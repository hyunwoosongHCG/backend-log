# v1 그룹 재설정 경로 제거 PR 자체 리뷰와 그 후속 조치

> 날짜: 2026-09-17
> PR: [ppback #5611](https://github.com/hcgtheplus/ppback/pull/5611) · [talenx-log #91](https://github.com/hcgtheplus/talenx-log/pull/91)
> 소스: Performance Plus(실무) — Rails 8 + Grape, Pundit, Sidekiq, MySQL
> 내 역할: 리뷰어 + 구현 — PR 작성자가 나 자신이라 자체 리뷰 후 지적 반영까지 단독
> 선행: [2026-09-11 직무 역량 양식 영역 응답 초기화 API 구현](2026-09-11-ppback-pr-5606-job-template-response-reset.md)

## 작업 한 줄 요약

내가 만든 PR을 내가 4축으로 리뷰하고 지적 6건을 냈는데, 착수 전에 전제를 독립 조사에 걸었더니 **3건이 전제부터 틀려 있었다** — 그중 하나는 그대로 커밋했으면 실동작 회귀였다. 살아남은 3건을 고쳐 올렸고, 틀린 3건은 왜 틀렸는지를 근거와 함께 철회했다.

## 성과

**Before → After**

| | Before | After |
|---|---|---|
| "완료 이탈 시 파생물 정리" 구현 개수 | 4곳 (PR 시작 시점 9곳 → 4곳까지 줄인 상태) | **3곳** — 다섯 번째 사본을 위임 |
| `AppraisalGroupPolicy#appraisee_reset?` | 호출부 0, 불리면 `NoMethodError`인 채 10개월 방치 | 제거 |
| `realign_appraisers` 세 번째 갈래 | 스펙 **0건** — 가드를 지워도 1787 예제가 전부 초록 | 스펙 2건, 같은 변이에서 그 둘만 빨강 |
| multi 대시보드 예제 | 서비스 본문을 비워도 통과(`be_present`만 확인) | 점수로 갈라 양방향 고정, 변이에서 빨강 |
| 내 리뷰 지적 6건 | — | 3건 반영 / **3건은 착수 전 철회**(그중 1건은 실동작 회귀였음) |
| 내가 쓴 근거 서술 | — | 사용자 지적 5건을 조사에 걸어 **4건 정정**(대시보드 버그 조건·PERF 귀속·v2 완화 근거·스펙 실패 37건) |

**측정 방법**

전부 **실측**이다.

- 구현 개수: `git grep`으로 같은 본문을 가진 메서드 전수 확인
- 정책 사망: test 환경에서 `AppraisalGroupPolicy#appraisee_reset?`를 실제 호출 → `NoMethodError` 재현. `respond_to?`로 두 모델 모두 그 이름이 없음을 확인
- 커버리지 0: 해당 분기에 `else raise "..."`를 꽂고 `spec/services` + `spec/workers` + `spec/api/v2/admins` 1787 예제 → 0 failures (실행 직전·직후 프로브 잔존을 md5로 확인)
- 동치성: 같은 픽스처에 구현 3종을 적용하고 트랜잭션 롤백으로 되돌리는 차등 실행, 시나리오 6개

**검증 근거**

```
spec/services/appraisal/  spec/workers/appraisals/  spec/api/v1/appraisal/  spec/api/v2/admins/
→ 1361 examples, 0 failures
```

- 변이 4종으로 새 스펙의 판별력 확인 (가드 제거 → 새 예제 2건만 빨강 / 대시보드 재생성 제거 → 강화한 예제 빨강)
- rubocop 변경 파일 offense 0
- 한때 `spec/api/v2/admins/`에서 37 failures가 나와 '기존 실패'로 분류했는데 **오분류였다**(아래 참조). 원인을 제거하니 0이다

## 이 작업에서 처음 배운 개념

### [Rails 전용] `enum`이 만드는 술어 이름 규칙 — `prefix:` 없이는 접두어가 안 붙는다

```ruby
# app/models/appraisal_group_setting.rb
enum :objective_weight_required_setting, { 'checkin' => 0, 'self' => 1 }
```

이게 만드는 술어는 `checkin?`와 `self?`다. **`objective_weight_required_setting_checkin?`이 아니다.** 접두어를 붙이려면 `prefix: true`를 줘야 한다.

그리고 `AppraisalGroup`은 이렇게만 위임하고 있었다.

```ruby
delegate :objective_weight_required_setting, to: :appraisal_group_setting
```

`delegate`는 **적어 준 메서드 하나만** 넘긴다. enum이 부수적으로 만든 술어들은 따라오지 않는다.

그런데 정책은 `record.objective_weight_required_setting_self?`를 부르고 있었다 — 그 이름은 `AppraisalGroup`에도 `AppraisalGroupSetting`에도 **존재한 적이 없다.**

```
AppraisalGroup#respond_to?(:objective_weight_required_setting_self?)        => false
AppraisalGroupSetting#respond_to?(:objective_weight_required_setting_self?) => false
AppraisalGroupSetting#self? => true   # 이게 진짜 이름
```

### [보편] `||`의 첫 항이 예외를 던지면 뒤 항들은 영원히 안 읽힌다

```ruby
def appraisee_reset?
  undiscarded? && (record.objective_weight_required_setting_self? || record.allow_appraisee_weight_reset || hr_admin_with_sub_admin?)
end
```

"셋 중 하나라도 참이면 허용"으로 읽히지만, 첫 항이 `NoMethodError`라서 `undiscarded?`가 참인 모든 호출은 **예외로 끝났다.** 뒤의 두 조건(설정 플래그, hr 어드민)은 한 번도 평가된 적이 없다. 이 정책이 낼 수 있었던 결과는 `false`(평가가 discard됨) 아니면 예외뿐이고, **누구에게도 허용을 내준 적이 없다.**

git 이력이 더 재미있었다.

| 커밋 | 시각 | 내용 |
|---|---|---|
| `9cb3f19ab` | 2025-11-26 17:16 | 정책 도입. `undiscarded? && (hr_admin_with_sub_admin? \|\| record.allow_appraisee_weight_reset)` — **동작하는 코드** |
| `b8c01e00a` | 2025-11-26 17:17 | 없는 술어를 조건에 추가. 그 순간부터 죽음 |

**1분 만에** 깨졌고 10개월을 그대로 갔다. 호출하는 프론트가 없어서 아무도 몰랐다.

### [Rails 전용] 죽은 정책인지 확인하는 세 겹

"grep했더니 안 나온다"만으로는 부족했다. 세 층으로 나눠서 봤다.

1. **문자열 전수** — 추적 파일 전체에서 `appraisee_reset`. 딱 두 줄이 나왔는데, 하나는 정의부고 다른 하나는 **Grape 라우트 경로 문자열**(`post 'appraisee_reset' do`)이었다. 그 핸들러는 다른 정책(`authorize appraisee, :self?`, `AppraisalAppraiseePolicy`)을 쓴다. 이름만 겹치는 우연이라 grep 결과만 보고 "호출부가 있다"고 판단할 뻔했다.
2. **이름으로 추론되는 경로** — Pundit은 query를 생략하면 `"#{action_name}?"`로 정책 메서드를 찾는다. 그래서 (a) `app/controllers` 전체에서 query 생략 `authorize`가 몇 건인지(0건), (b) `appraisee_reset`이라는 action_name을 만들 Rails 라우트가 있는지(없음), (c) 정책 메서드명을 문자열 보간으로 만드는 곳이 이 이름을 만들 수 있는지(두 곳 있지만 둘 다 고정 리터럴 배열이라 불가) — 이 셋을 따로 확인했다.
3. **런타임** — test 환경에서 실제로 불러 봤다. 이게 "호출부가 없다"를 넘어 **"불려도 터진다"**까지 확인해 준 층이다.

### [보편] 차등 실행(differential testing)으로 리팩터링 동치성 확인하기

내가 리뷰에 적은 To-be는 이거였다.

```ruby
next_status = appraiser.appraisal_responses.empty? ? 'closed' : 'tempsaved'
# ... 위임 ...
if next_status == 'closed'
  appraiser.update!(status: :closed, response_created_at: nil)
else                              # ← 원래는 elsif appraiser.completed?
  self.class.move_responses(appraiser, :tempsaved)
  appraiser.update!(status: :tempsaved)
end
```

"어차피 같다"고 썼는데 **틀렸다.** 같은 픽스처에 현재 구현 / 내 제안 / 가드를 남긴 제안 셋을 각각 적용하고 트랜잭션 롤백으로 되돌리며 6가지 시나리오를 비교하니, 한 곳에서 갈렸다.

| 시나리오 | 현재 구현 | 내 제안 |
|---|---|---|
| `wait_write` 평가자가 직무 역량 양식 영역 응답만 잃고 목표 영역 응답이 남음 | `wait_write` 유지, 남은 이월본 그대로 | **`tempsaved`로 내려가고 이월본이 `tempsaved`로 복제됨** |

`wait_write`는 본인이 쓴 게 아니라 앞 평가자 응답의 **이월본**이라 임시저장으로 볼 수 없다는 규칙이 파일 상단에 적혀 있었는데, 내 제안이 그걸 깼다. 그리고 `JobTemplateResponseResetService`가 평가자 상태를 가리지 않고 폐기하므로 이 조합은 실제로 만들어진다.

**"두 구현이 같은 결과를 낸다"는 읽어서 증명할 게 아니라 돌려서 증명할 것이다.**

### [보편] "가는 곳과 다른 값을 알려 주지 않는다"는 인자 설계

고친 최종본은 목표 상태를 3분기로 만든다.

```ruby
def next_status(appraiser, lost_all_responses)
  return 'closed' if lost_all_responses
  return 'tempsaved' if appraiser.completed?

  appraiser.status          # 아래 분기가 아무것도 하지 않는 갈래
end
```

세 번째 갈래에 `'tempsaved'`를 넣어도 **지금 가드에서는 결과가 같다**(가드가 `after_status != 'completed'`만 보므로). 그래도 넣지 않았다. 그 평가자는 `tempsaved`로 가지 않기 때문이다. 결과가 같다는 이유로 거짓말을 넣어 두면, 가드가 바뀌는 순간 이 호출부만 조용히 빗나간다.

## 기존에 알던 것의 새 변주

### [보편] 판별력 검증 — 남의 스펙이 아니라 **내가 방금 쓴 스펙**에

[레슨 55](../lessons/0055-regression-spec-discriminating-power.html)와 [2026-09-03 리뷰](2026-09-03-ppback-pr-5585-appraisal-result-search-review.md)는 "작성자가 회귀 테스트를 추가했다고 하면 되돌려 돌려본다"였다. 이번엔 그걸 내 스펙에 썼다.

| 변이 | 결과 |
|---|---|
| `realign_appraisers`의 `elsif appraiser.completed?` → `else` | 새로 쓴 예제 **2건만** 빨강 |
| 대시보드 재생성 호출만 제거 | 강화한 예제 빨강 — **강화 전에는 같은 변이에서 초록이었다** |

두 번째가 특히 그렇다. 원래 예제는 이랬다.

```ruby
expect(appraisee.appraisal_dash_board_data.where(appraisal_process_id: multi_process.id)).to be_present
# ... 실행 ...
expect(appraisee.appraisal_dash_board_data.where(appraisal_process_id: multi_process.id)).to be_present
```

"행이 남아 있다"만 보니까 **서비스가 아무것도 안 해도 통과한다.** 평가자별로 점수를 갈라 두고 `contain_exactly(10.0, 90.0)` → `contain_exactly(90.0)`로 바꾸니 "내려가는 몫만 빠진다"가 양방향으로 잡힌다.

### [보편] 변이 테스트는 "커버리지 0인 분기"를 찾는 데도 쓴다

`realign_appraisers`에는 갈래가 셋인데, 세 번째(응답이 남았는데 완료도 아니라 아무것도 안 함)에 `else raise "..."`를 꽂고 관련 스펙 1787 예제를 돌려도 **0 failures**였다. 단언이 약한 게 아니라 **그 갈래에 도달하는 예제가 하나도 없었다.** 그리고 하필 그 갈래가 이번 위임이 반드시 보존해야 하는 곳이었다.

### [보편] 격리했더니 격리한 것이 원인이 된다 — 검증 환경이 만든 가짜 실패

worktree로 격리해 돌렸더니 `spec/api/v2/admins/`에서 37건이 깨졌다. 변경 전 커밋과 같은 seed로 수치가 **동일**했기 때문에 "이 브랜치와 무관한 기존 실패"로 분류하고 PR 본문에까지 적었다.

그게 틀렸다. 인과는 이랬다.

```
git worktree add  →  gitignore된 config/credentials/test.key 가 안 따라옴
  → PpBack.credentials 전부 nil
  → SuperAdminIp::YANGJAE = nil  →  SuperAdminIp.list.compact == []
  → super_admin_ip? == false
  → GrapeBase#workspace 의 슈퍼어드민 분기가 403 DENIED_IP
```

그리고 왜 하필 그 7개 파일이었냐면, 스펙이 `create(:workspace, hr_admins: [user])`를 쓰면 `WorkHrAdministration`의 `status`가 기본값 0 = `super`로 생성돼 **그 유저가 슈퍼어드민이 된다.** `grep -c "hr_admins:"`가 1 이상인 파일이 정확히 실패한 7개였다.

`-e RAILS_MASTER_KEY="$(tr -d '\n\r' < config/credentials/test.key)"` 하나 넣으니 `279 examples, 0 failures`. `origin/dev`에서도 키 없으면 똑같이 깨지고 키 있으면 깨끗했다.

**"변경 전후가 같으니 내 탓이 아니다"는 '기존 실패'의 증거가 아니다.** 내가 바꾼 건 코드가 아니라 **측정 환경**이었고, 그건 변경 전후 양쪽에 똑같이 걸린다. 403을 Pundit 인가 실패로 지레짐작하고 응답 본문(`keyword: "DENIED_IP"`)을 안 읽은 것도 같은 게으름이다.

## 작업하면서 막혔던 것과 해결 방법

### [보편] 같은 워킹트리를 두 세션이 동시에 쓰면 검증이 오염된다

작업 중 다른 세션이 `/Users/songhyeon-u/Desktop/ppback`의 브랜치를 갈아치웠다. 내 PR 브랜치 파일이 트리에서 사라졌고, 조사 에이전트가 측정하던 중에도 바뀌었다.

**해결: git worktree + 컨테이너 마운트 덮어쓰기.**

```bash
git worktree add ~/Desktop/ppback-worktrees/pr5611 refactor/remove-v1-group-reset-compat

docker compose run --rm --no-deps --entrypoint bash \
  -v ~/Desktop/ppback-worktrees/pr5611:/var/www/app \
  -e RAILS_ENV=test app -c 'bundle exec rspec ...'
```

여기서 두 가지를 알게 됐다.

- **`docker-compose.yml`의 "named volume"이 사실 bind mount였다.** `driver_opts: {type: none, device: ${PWD}, o: bind}`. 그래서 컨테이너가 메인 트리를 실시간으로 본다 — 병렬 세션의 편집이 내 스펙 실행에 그대로 반영된다. `-v <worktree>:/var/www/app`로 그 마운트를 덮어쓰면 격리된다.
- **`--entrypoint bash`가 필요했다.** 기본 entrypoint가 `elasticsearch`를 기다리는데 그 서비스가 compose에서 주석 처리돼 있어 `nc: bad address 'elasticsearch'`를 무한 반복하며 컨테이너가 안 뜬다. 이미 떠 있는 `app` 컨테이너는 과거에 통과했을 뿐이다.

다만 **test DB는 여전히 공유**라, 상대가 DDL을 돌리면 이런 게 뜬다.

```
Mysql2::Error: Table definition has changed, please retry transaction
Mysql2::Error: SAVEPOINT active_record_1 does not exist
```

같은 seed·같은 코드로 `37 examples, 17 failures` → `37 examples, 0 failures`로 흔들렸다. **뮤테이션 결과를 1회 실행으로 믿으면 오판한다.** 재시도 루프를 씌우고, "기존부터 실패였나"는 변경 전 커밋을 별도 worktree에 띄워 같은 seed로 대조해 가렸다.

### [보편] `git checkout -- <path>`는 HEAD가 아니라 **인덱스**에서 복원한다

뮤테이션 실험을 끝내고 `git checkout -- app/services/appraisal/response_discard_service.rb`로 되돌렸는데, 스테이징하지 않은 **내 리팩터링까지 같이 날아갔다.** 인덱스에 없으면 복원 대상은 HEAD 버전이다.

확인도 잘못했다. "`DiscardCompletedArtifactsService` 문자열이 있으니 살아 있다"고 봤는데, 그 이름은 **되돌리기 전 헤더 주석에도 있던 문자열**이었다. 복원 여부는 내가 추가한 것 중 **그 변경에서만 생기는 토큰**(`def next_status`)으로 확인해야 했다.

**교훈: 파일을 임시로 망가뜨리는 실험 전에는 `git add`부터.**

## 결정이 필요해서 남긴 것

- `[통합예정]` 셋 — 벌크 소프트 리셋 위임, 그 서비스의 무조건 대시보드 파기, v1 `appraisal_sections#change_tempsaved`의 순서·가드 반전. 전부 **현행 동작을 바꾸는 판단**이 먼저다.
- 대시보드를 `(피평가자, 프로세스)` 단위로 다시 만드는 구조 변경 — `CreateDashBoardDataService`의 `completed?` 가드에 막혀 이번 범위 밖.
- `allow_appraisee_weight_reset` / `objective_weight_required_setting == 'self'`로 대상자 본인 재설정을 연다는 기획 — **한 번도 구현된 적이 없다.** 살아 있는 요구사항인지 확인 필요.

## 다음에 더 공부하고 싶은 것

- Rails 트랜잭션 중첩과 savepoint — `requires_new: true` 없이 중첩하면 안쪽이 바깥에 흡수된다는 것은 이번에 "감싸 봤자 의미 없다"의 근거로 썼는데, 롤백 전파 규칙을 정확히는 모른다
- Grape `params`가 넘어온 배열에 `Enumerable#pluck`이 먹는 이유 (`HashWithIndifferentAccess` + ActiveSupport 확장) — 동작은 확인했지만 경계를 모른다

## 참고 — ROADMAP.md 대조 결과

**기존 항목 심화**

- 테스트 › 회귀 스펙의 판별력 검증 — 변주 추가: 분기에 `raise`를 꽂아 **단언이 약한 것**과 **도달하는 예제가 아예 없는 것**을 구분한다

**신규 체크**

- 권한 › 정책이 죽었는지 확인하는 세 겹 (문자열 전수 / 이름 추론 경로 / 런타임)
- 권한 › `||`의 첫 항이 예외를 던지면 뒤 항은 영원히 안 읽힌다
- ActiveRecord › `enum`이 만드는 술어 이름과 `delegate`가 넘기는 것
- 테스트 › 차등 실행으로 리팩터링 동치성 확인하기
- 기타 › compose의 named volume이 사실 bind mount일 수 있다, worktree로 격리 실행하기
- 기타 › `git checkout -- <path>`는 HEAD가 아니라 인덱스에서 복원한다

- 기타 › 격리 환경이 만든 가짜 실패 — worktree에는 gitignore된 크리덴셜 키가 안 따라온다

**미체크 유지**

- 백그라운드 잡 › 실패한 잡 재시도 — 배포 시 큐에 남은 잡이 제거된 워커 클래스를 만나면 `NameError`로 죽는 문제를 PR 본문에 적었지만, Sidekiq의 재시도·DLQ 동작은 확인하지 않았다
- 아래 "다음에 더 공부하고 싶은 것"의 트랜잭션 중첩·savepoint는 이번에 "중첩은 의미 없다"의 근거로만 쓰고 롤백 전파 규칙은 확인하지 않아 체크하지 않는다
