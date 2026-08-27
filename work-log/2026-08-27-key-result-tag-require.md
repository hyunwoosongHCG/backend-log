# 핵심성과 태그 필수/미필수 설정 — 백엔드 모델·API 작업

> 날짜: 2026-08-27
> PR: (아직 없음, 로컬 브랜치 상태)
> 브랜치: `feature/key-result-tag-require` (워크트리: `.claude/worktrees/feature+key-result-tag-require`)

## 작업 한 줄 요약

핵심성과(KeyResult) 태그 입력을 워크스페이스 단위로 필수/미필수 설정할 수 있는 기능을 추가했다. 이미 목표(Objective) 쪽에는 `objective_settings.use_tags_required` + `Objective::TagRequiredValidator`라는 동일한 패턴이 존재했고, 조사 에이전트가 처음엔 "이미 다 있다"고 잘못 결론 내렸지만 실제로 그 필드는 목표 전용이라는 걸 코드로 직접 확인해서 바로잡았다. 이후 그 패턴을 그대로 미러링해 `use_key_result_tags_required` 컬럼 + `Objective::KeyResultTagRequiredValidator`를 새로 만들고, migration/entity/params/i18n(7개 언어)/request spec까지 붙였다.

## 이번 작업에서 처음 배운 개념

- **서브에이전트의 결론도 반드시 소스로 검증해야 한다.** 조사 에이전트가 "`objective_settings.use_tags_required`가 이미 핵심성과 태그 필수 기능"이라고 보고했는데, 실제로 `app/controllers/entities/workspaces/objective_setting_entity.rb`와 `app/validators/objective/tag_required_validator.rb`를 직접 읽어보니 desc가 정확히 "**목표** 태그 설정 필수 옵션"이고 검증기도 `Objective::TagRequiredValidator`(목표 자신의 `tag_ids`만 검사)였다. 에이전트 요약은 "무엇을 하려 했는지"를 말해줄 뿐 "실제로 확인했는지"는 보장하지 않는다는 걸 실전에서 체감했다.
- **Docker Compose는 같은 host에서 여러 프로젝트를 동시에 못 띄운다(포트 고정 시).** git worktree로 별도 작업 디렉토리를 만들어도 `docker-compose.yml`의 `db`/`redis` 서비스가 `ports: [3306:3306]`처럼 고정 host 포트를 쓰면, 이미 메인 체크아웃에서 떠 있는 `ppback-db-1`/`ppback-redis-1`과 충돌한다. `docker-compose.override.yml`(이미 `.gitignore`에 있는 로컬 전용 파일)로 포트를 바꾸면 될 줄 알았는데, Compose Spec의 기본 병합 규칙은 `ports` 같은 리스트 필드를 **교체가 아니라 추가**해서 베이스의 `3306:3306`이 여전히 남아 똑같이 충돌했다. `ports: !override [...]` 같은 Compose Spec 병합 태그를 써야 리스트를 완전히 교체할 수 있다는 걸 알게 됐다 → [레슨으로 정리할 후보]
- **`db:migrate`가 빈 DB에서는 사실상 `db:schema:load`를 먼저 돈다.** 신규 워크트리의 빈 MySQL에 `db:migrate`를 돌렸더니 `schema.rb` 전체를 다시 만드는 로그가 나왔다. 이 과정이 중간에 (원인 불명의 일시적 오류로) 죽었는데, 재시도한 두 번째 `db:migrate`는 "성공"처럼 보였지만 실제로는 `appraisal_appraisee_element_settings` 테이블의 FK 8개 중 아무것도 안 걸린 상태로 DB가 굳어 있었고, 그 깨진 상태가 그대로 `db/schema.rb`에 재덤프되어 내 마이그레이션과 무관한 7줄의 `add_foreign_key` 삭제 diff가 생겼다. `db:drop db:create db:schema:load`로 깨끗하게 다시 만들어서 FK 8개가 정상 생성되는 걸 확인한 뒤에야 내 마이그레이션을 얹었다 — **"명령이 exit 0으로 끝났다" ≠ "DB가 스키마 파일과 일치한다"**라는 걸, 실제로 `ActiveRecord::Base.connection.foreign_keys(table)`로 라이브 DB를 조회해서 검증하고 나서야 확신할 수 있었다. 기존 ROADMAP의 "`db:migrate`는 DB 전체를 다시 덤프한다"(2026-08-19 항목)와 같은 축이지만, 이번엔 다른 브랜치 마이그레이션이 섞이는 문제가 아니라 **중단된 schema:load 자체가 오염을 만드는** 케이스였다.
- **Grape validator가 던진 예외가 실제 HTTP 400 응답으로 바뀌는 경로.** 프론트 안내 문서에 정확한 에러 응답 예시를 쓰려고 임시 스펙으로 직접 실행해서 `{"errors":{"key_result_tag_ids":"핵심성과 태그 정보를 입력해주시기 바랍니다."}}`를 확인했는데, 내 validator 코드 어디에도 이 JSON 구조를 만드는 부분이 없다는 걸 알아챘다. `app/controllers/grape_base.rb`에 전역으로 걸린 `rescue_from Grape::Exceptions::ValidationErrors, with: :parameter_validate_error`가 모든 validator의 `raise`를 가로채서, 내가 넘긴 `params: ['key_result_tag_ids']`를 `join(',')`한 값을 키로 써서 포맷한다. 새 validator를 추가할 때 응답 포맷을 신경 안 써도 되는 이유가 "규칙이 없어서"가 아니라 "이미 한 곳에서 처리되고 있어서"라는 걸 실제로 코드를 따라가 보고서야 확인했다.
- **`accepts_nested_attributes_for`로 부분 수정할 때 NOT NULL 컬럼의 DB `default`는 보호되지 않는다.** ([레슨 58](../lessons/0058-column-default-does-not-protect-updates.html)로 정리) `key_results.weight`는 `default(100.0), not null`인데, `ObjectiveUpdateDiff#change_or_create_key_result`(`app/services/objective_update_diff.rb:170`)는 기존 레코드를 갱신할 때 `weight: item[:weight]`를 그대로 넣는다. 요청에 `weight`를 안 보내면 `item[:weight]`는 `nil`이 되고, 이게 그대로 UPDATE에 실려나가 `Column 'weight' cannot be null` 에러가 난다. DB `default`는 **신규 INSERT에서 컬럼이 아예 손 안 댄 상태일 때만** 적용되고, UPDATE에서 명시적으로 `nil`을 대입하면 기존 값이 지워진다는 걸 내 스펙(핵심성과에 태그만 추가하고 `weight`는 안 보낸 PUT 요청)이 실패하면서 알게 됐다. 이건 내 기능과 무관한 기존 코드의 잠재 버그라 고치지 않고, 테스트에서 `weight`를 명시적으로 같이 보내는 것으로 우회했다.

## 작업하면서 막혔던 것과 해결 방법

- 워크트리 안에서 `Read`/`Bash`가 `/Users/songhyeon-u/Desktop/ppback/...`(메인 체크아웃 경로)를 조용히 허용해서, 처음 몇 번은 워크트리가 아니라 메인 체크아웃 파일을 읽고 있었다. `Edit`가 그 경로를 거부하면서 알아챘고, 이후 모든 파일 작업을 `.claude/worktrees/feature+key-result-tag-require/...` 절대경로로 통일했다. 다행히 그 시점까진 아무것도 수정하지 않은 순수 조사 단계라 실제 파일 오염은 없었다.
- ECR 인증이 안 되어 있어 `docker-compose-test.yml`이 요구하는 `elasticsearch` 이미지를 못 받아왔다(`no basic auth credentials`). 이미 떠 있는 `db`/`redis`를 재사용하도록 `docker compose run --rm --no-deps ...`로 우회해서 `elasticsearch` 의존성을 건너뛰고 대상 spec만 돌렸다.
- 새로 추가한 request spec 중 "핵심성과에 태그를 포함해 수정" 케이스가 계속 500(정확히는 SQL NOT NULL 위반)으로 죽었다. 처음엔 내 검증기 로직을 의심했는데, `bad_request` 케이스는 통과하고 있어서(Grape 검증 단계에서 이미 막힘) 범위를 좁혀보니 실제 원인은 위에 적은 `ObjectiveUpdateDiff`의 기존 버그였다.
- 변경 전후로 4개 테스트(`assessor_identity_disclosure`, `sentiment_analysis`, `collaboration_assessor_recommendation`, `require_parent_objective_link` hr_admin 케이스)가 계속 403으로 실패했다. 내 변경이 원인인지 확신이 안 서서, `git stash`(공유 스택이라 `-u -m <고유태그>` + SHA로 특정해서 `apply`)로 변경분을 통째로 걷어내고 같은 spec을 다시 돌려 **베이스라인에서도 똑같이 실패**하는 걸 확인한 뒤에야 "내 변경과 무관한 기존 실패"라고 보고할 수 있었다.

## 다음에 더 공부하고 싶은 것

- `ObjectiveUpdateDiff#change_or_create_key_result`의 `weight: item[:weight]` nil 전파 버그를 실제로 고치는 PR — nil이면 기존 값을 유지하도록 `item.key?(:weight) ? item[:weight] : original.weight` 형태로 바꾸는 리팩터링과, 그걸 증명하는 회귀 스펙.
- Compose Spec의 병합 태그(`!override`, `!reset`) 전체 목록과, 이걸 `docker-compose.override.yml` 컨벤션으로 팀에 공유할 가치가 있는지.
- `ActiveRecord::Migration.maintain_test_schema!`가 정확히 어떤 기준으로 "스키마가 최신"이라고 판단하는지(체크섬인지 버전 비교인지) — 이번에 test DB는 별다른 개입 없이도 알아서 최신화됐는데 그 메커니즘을 아직 명확히 모른다.
