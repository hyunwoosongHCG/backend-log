# ppback PR #5579 리뷰 — 대상자 참고 데이터 구 필드 컬럼 제거 검증

> 날짜: 2026-09-01
> PR: https://github.com/hcgtheplus/ppback/pull/5579
> 레포: hcgtheplus/ppback (Rails/Grape)

## 작업 한 줄 요약

동료(epicari)가 올린 PR #5579(그룹 단위 참고 데이터 구 필드 `selected_view_appraisee_data` / `view_appraisee_performance_data` 를 엔티티 4곳·모델 2곳에서 제거하고, `appraisal_group_settings.view_appraisee_data`·`.view_appraisee_performance_data`·`appraisal_groups.view_appraisee_data` 세 컬럼을 드롭하는 마이그레이션 추가)를 `code-review` 스킬(4축: 구조/데드코드/변수명/로직중복)로 리뷰했다. 컬럼 제거 자체는 안전하게 준비돼 있었고(잔여 호출처 0, 마이그레이션 타임스탬프 규칙 준수, 백필 마이그레이션을 모델 의존에서 raw 값 디코딩으로 자립화), 프론트 크래시가 확인된 `open_appraisee_data` 는 정확히 남겨져 있었다. 대신 **논의에서 빠진 세 번째 소비자(대교 전용 엔티티)**, **컬럼 제거의 롤링 배포 창**, **항상 통과하는 동어반복 어서션** 세 가지를 찾았다. RSpec 은 로컬 test DB 에 컬럼 드롭을 적용해야 해서 현재 작업 브랜치 환경을 건드리게 되므로 미실행으로 명시 보고했다.

## 이번 작업에서 처음 배운 개념

- **컬럼 제거는 롤링 배포에서 "창(window)"을 만들고, 정석 해법은 `ignored_columns` 2단계 배포다** — Rails 는 테이블의 컬럼 정보를 프로세스가 그 모델을 처음 쓸 때 캐시하고, 그 뒤 DDL 이 바뀌어도 자동으로 무효화하지 않는다. 그래서 마이그레이션이 컬럼을 드롭한 뒤에도 살아 있는 구 프로세스는 캐시에 남은 컬럼을 그대로 참조한다. 이 레포는 `config.load_defaults 8.1` 이라 `partial_inserts = false` — **INSERT 에 항상 전체 컬럼이 실린다.** 즉 구 프로세스가 그룹 하나를 만들면 `appraisal_group_settings` INSERT 에 이미 없어진 `view_appraisee_data` 가 포함되어 `Unknown column 'view_appraisee_data' in 'field list'` 로 500 이 난다. 읽기 쪽도 같은데, 구 프로세스의 엔티티가 `expose :selected_view_appraisee_data` 로 `has_flags` 생성 메서드를 부르면 `SELECT table.*` 결과에 그 컬럼이 없어 `ActiveModel::MissingAttributeError` 가 난다. 중요한 건 **"코드 먼저 / 마이그레이션 먼저" 어느 순서로도 창이 안 없어진다**는 점이다(코드를 먼저 배포하면 새 프로세스의 캐시에 드롭 전 컬럼이 남아 같은 증상). 그래서 표준 절차가 `self.ignored_columns += %w[...]` 를 **먼저 배포**해서 그 컬럼을 애초에 attribute set 에서 빼두고, **다음 배포에서 드롭**하는 2단계다. 창의 위험도는 그 테이블의 쓰기 빈도에 비례한다 — 이번 `appraisal_group_settings` 는 그룹 생성마다 INSERT 되는 테이블이라, 직전 사례(`job_templates.is_primary`, `20260825021730`)보다 노출도가 훨씬 높다. 다만 이 레포는 `ignored_columns` 사용 이력이 0건이어서(`git log -S "ignored_columns"`) 컨벤션상으로는 이 PR 과 동일하다는 것도 확인했다.
- **마이그레이션이 모델 메서드에 의존하면 시간이 지나 과거 마이그레이션이 깨진다** — 백필 마이그레이션(`20260806000013`)이 원래 `setting.selected_view_appraisee_data` / `setting.view_appraisee_performance_data` 를 부르고 있었는데, 이 PR 이 모델에서 `has_flags` 와 `serialize` 를 지우면서 **그 과거 마이그레이션까지 같이 죽는** 구조였다. 이 PR 의 해법이 정석이었다: `setting.attributes['view_appraisee_data']` 로 raw 값을 직접 읽고, 디코딩 규칙(`{ 'objectives' => 1, ..., 'reviews' => 16 }`)을 마이그레이션 안에 상수로 **복제**해 자립시킨다. YAML 컬럼도 마찬가지로 `YAML.safe_load(raw, permitted_classes: [Symbol])` 로 직접 파싱한다(과거 데이터에 심볼이 들어 있어서 `permitted_classes` 가 필수). 부수적으로 `Hash#[]` 는 없는 키에 예외 대신 `nil` 을 주므로, 컬럼이 이미 드롭된 DB 에서도 `nil.to_i → 0` 으로 안전하게 떨어진다.
- **이미 머지·실행된 마이그레이션을 나중에 수정하면, 이미 실행한 환경에서는 영구히 no-op 이다** — 이게 위 항목의 반쪽인데, 처음엔 "백필 로직을 고쳤으니 데이터가 보정되겠구나"로 잘못 읽었다. `schema_migrations` 에 버전이 이미 있으면 `db:migrate` 는 그 파일을 다시 돌리지 않는다. 즉 `20260806000013` 수정본(이미 `48d583815 feat: 참고 데이터 설정을 평가 프로세스 × 데이터타입 단위로 확장 (#5554)` 로 dev 에 머지된 파일)은 **아직 백필을 실행하지 않은 환경(신규 DB, 미배포 환경)만을 위한 방어**이고, 운영 데이터에는 아무 영향이 없다. "마이그레이션 파일을 고쳤다"와 "데이터가 고쳐진다"를 구분해야 한다.
- **`has_flags` 의 키는 비트 위치이고 컬럼에 저장되는 값은 `2^(n-1)` 이다** — `has_flags 1 => :objectives, 2 => :feedbacks, 3 => :multi_source_feedbacks, 4 => :one_on_ones, 5 => :reviews` 에서 왼쪽 숫자는 **1-based 포지션**이고, 실제 정수 컬럼에는 `1 / 2 / 4 / 8 / 16` 이 OR 되어 들어간다. PR 의 `LEGACY_FLAG_BITS` 가 이 변환을 정확히 반영했는지 하나씩 대조해서 확인했다. 그리고 `has_flags` 가 만드는 메서드가 `selected_<컬럼명>`(켜진 플래그의 심볼 배열), `<플래그>`, `<플래그>?`, `<플래그>=` 인데 **전부 동적 생성이라 컬럼명으로 grep 해도 안 잡힌다**. 그래서 잔여 호출처 확인을 컬럼명이 아니라 **플래그 이름 5개**(`objectives|feedbacks|multi_source_feedbacks|one_on_ones|reviews` 와 `?`·`=` 변형)로 다시 훑었다. (ROADMAP 200번 항목의 `has_flags` 개념을 이번에 처음 "제거하는 쪽"에서 봤다.)
- **같은 도메인 필드가 고객사 전용 엔티티에 독립적으로 복제돼 있을 수 있다** — PR 코멘트에서 검토된 소비자는 theplus-front(`selected_view_appraisee_data`)와 talenx(`open_appraisee_data`) 두 곳이었는데, 실제로는 세 번째가 있었다. `Entities::Daekyo::AppraisalGroups::DefaultInfoEntity` 가 `authorize workspace, :daekyo?` 로 게이팅된 대교 전용 엔드포인트(`GET .../appraisal_users/default_info`)에서 같은 필드를 노출한다. 이 엔티티에는 `open_appraisee_data` 도, 새 `process_data_settings` 대체 필드도 없어서 제거되면 대교 클라이언트는 데이터탭 사용 목록을 알 방법이 **완전히** 사라진다. 스펙도 0건이라 CI 로도 안 잡힌다. → 필드 제거 리뷰에서 "프론트 몇 곳 확인"으로 끝내지 말고 `git grep <필드명> -- app/controllers/entities` 로 노출 지점 전체를 먼저 세는 습관이 필요하다.

## 작업하면서 막혔던 것과 해결 방법

- **"구 필드를 보내도 500 이 안 난다"를 뭐가 보장하는지 찾는 데 시간이 걸렸다.** 스펙 이름이 `제거된 구 필드를 보내도 그룹 PUT 이 실패하지 않는다` 라서, 컬럼이 사라진 뒤 `update!` 가 `ActiveRecord::UnknownAttributeError` 를 낼 위험을 어디서 막는지가 궁금했다. 컨트롤러를 따라가 보니 답은 코드가 아니라 **Grape 의 파라미터 선언**이었다 — `app/controllers/v1/appraisals/appraisal_groups.rb` 의 create(`:76-79`)·update(`:220-239`) `params do` 블록에 애초에 구 필드가 선언돼 있지 않고, 핸들러가 `declared(params, include_missing: false)` 로 **선언된 것만** 뽑아 쓴다. 그래서 구 필드는 모델까지 도달조차 못 한다. 즉 이 스펙은 컬럼 제거와 무관하게 원래부터 통과했고, 회귀 방어 대상은 "누군가 나중에 `params do` 에 그 필드를 다시 선언하는 것"뿐이다.
- **그걸 알고 나서야 `not_to respond_to` 어서션이 왜 무의미한지 정리됐다.** 스펙 2개 파일 4곳이 `expect(setting).not_to respond_to(:selected_view_appraisee_data)` 로 바뀌어 있었는데, 이건 "프로덕션 코드에 메서드가 없음"을 확인하는 거라 프로덕션 코드가 무엇을 하든 **항상 통과**한다. 처음에는 "제거를 검증하는 어서션이니 맞는 거 아닌가" 싶었는데, 판별력 기준(레슨 55: 고친 코드를 되돌리면 그 스펙이 실패해야 한다)을 적용해 보면 되돌릴 대상 자체가 없어서 실패할 수 없다. 실제 계약("구 필드가 새 저장 경로 `appraisal_process_data_settings` 를 오염시키지 않는다")을 값으로 비교하는 to-be 를 제안했다.
- **RSpec 실행을 포기한 판단.** 이 브랜치 스펙을 돌리려면 로컬 test DB 에 `remove_column` 마이그레이션을 적용해야 하는데, 지금 체크아웃된 건 내 작업 브랜치(`feature/key-result-auto-checkin-reflect`)라서 DB 스키마가 바뀌면 내 쪽 환경이 깨진다. AGENTS.md 의 "파괴적인 DB 작업 전 승인" 기준에 걸려서 미실행으로 남기고, 대신 DB 없이 되는 검증(변경 파일 10개 `ruby -c`, 마이그레이션 타임스탬프 중복·순서, 잔여 호출처 grep, `.rubocop.yml` 의 `Layout/LineLength` 정책)만 돌려서 "실행함 / 실행하지 않음"을 나눠 보고했다. 워크트리를 따로 파면 격리해서 돌릴 수 있다는 것도 같이 적어뒀다.
- **롤백 조합의 위험을 늦게 알아챘다.** 새 마이그레이션 주석에 "값은 복구되지 않는다"가 이미 적혀 있어서 처음엔 그걸로 충분하다고 봤다. 그런데 백필 마이그레이션이 `legacy_used_data_types` 로 그 컬럼을 읽는다는 걸 다시 보고 나서, **롤백으로 컬럼을 default 값(0)으로 되살린 뒤 백필을 재실행하면 모든 데이터타입이 `unused` 로 덮어써진다**는 조합을 찾았다. 두 마이그레이션을 따로 읽으면 안 보이고 같이 놓고 봐야 보이는 위험이라, 롤백 런북에 "컬럼 복구 후 `20260806000013` 재실행 금지"를 명시하라고 체크리스트에 넣었다.

## 다음에 더 공부하고 싶은 것

- `ignored_columns` 2단계 배포를 이 레포에서 실제로 해보기 — 지금은 "정석은 이것"까지만 알고, `ignored_columns` 를 걸어둔 상태에서 `db/schema.rb` 덤프나 `annotate` 주석이 어떻게 나오는지, 2단계 중간 상태를 어떻게 리뷰 가능하게 남기는지는 안 해봤다. 다음에 컬럼 제거 과제를 직접 맡으면 이 절차를 밟아보고 레슨으로 정리.
- Rails 스키마 캐시가 정확히 언제 무효화되는지 — `reset_column_information` 을 명시 호출하는 경우 외에, 프로세스 재시작 / `db:schema:cache:dump` / 개발 환경의 코드 리로드 중 무엇이 캐시를 새로 읽게 하는지 실제로 확인해보기. 이번엔 "자동으로는 안 된다"까지만 알고 넘어갔다.
- 필드 제거 PR 의 "소비자 전수조사" 체크리스트 만들기 — `app/controllers/entities` 전체 + `app/serializers` + 고객사 전용 네임스페이스(`Daekyo` 등) + 프론트 레포 grep 까지 순서를 정해두면 이번처럼 세 번째 소비자를 놓치지 않는다.

## 참고 — ROADMAP.md 대조 결과

- **섹션 3 > ActiveRecord (Model) > 마이그레이션(Migration)** (기존 `[x]` 항목) — 뒤에 두 가지를 추가했다: (1) 마이그레이션이 모델 메서드에 의존하면 나중 리팩터링이 과거 마이그레이션을 깨뜨리므로 raw attribute + 디코딩 규칙 복제로 자립시켜야 한다는 것, (2) 이미 실행된 마이그레이션의 수정은 그 환경에서 영구 no-op 이라는 것.
- **섹션 3 > ActiveRecord (Model)** — `self.ignored_columns` 와 컬럼 제거 롤링 배포 창을 **신규 항목**으로 추가하고 체크(`[x]`). 마이그레이션 항목 바로 아래에 뒀다(스키마 변경과 배포가 붙어 있는 개념이라).
- **섹션 3 > 테스트** — "부재를 검증하는 어서션은 항상 통과한다"를 **신규 항목**으로 추가하고 체크(`[x]`). 기존 "회귀 스펙의 판별력 검증"(레슨 55) 항목 바로 아래에 배치 — 같은 원리의 정적 버전이라.
- **섹션 4 > 권한 > `has_flags`(비트마스크 플래그 컬럼)** (기존 `[x]` 항목) — 비트 위치 vs 저장 값(`2^(n-1)`) 구분과, 생성 메서드가 동적이라 컬럼명 grep 으로 안 잡히니 플래그 이름으로 훑어야 한다는 것을 뒤에 추가.
- **섹션 4 > Grape API** — "같은 도메인 필드가 고객사 전용 엔티티에 독립적으로 복제돼 있을 수 있다"를 **신규 항목**으로 추가하고 체크(`[x]`).
- ROADMAP 에 반영하지 않은 것: "롤백으로 컬럼을 default 로 되살린 뒤 백필 재실행 시 데이터가 덮어써진다"는 조합은 이번 PR 에 특수한 형태라 이 work-log 에만 남겼다. 컬럼 제거 + 백필 재실행 조합을 한 번 더 만나면 그때 항목화 판단.
