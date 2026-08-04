# ppback PR #5528 리뷰 — v2 appraisal_users response_lists API 5분리 검증

> 날짜: 2026-08-04
> PR: https://github.com/hcgtheplus/ppback/pull/5528
> 레포: hcgtheplus/ppback (Rails/Grape)

## 작업 한 줄 요약

동료(epicari)가 올린 PR #5528(v1 `GET appraisal_users/response_lists`의 파라미터 분기 1개 엔드포인트를 역할별 v2 엔드포인트 5개로 분리, workspace_id 테넌트 격리 가드 추가, `appraisee_open_response_list`의 미공개 process 조회 우회 방지 보안 픽스 포함)를 `review-ppback` 스킬로 1차 리뷰하고, 이어서 `code-review` 스킬(4축: 구조/데드코드/변수명/로직중복)로 2차 리뷰했다. CI(RSpec, RuboCop 미포함)는 통과 상태였고, 로컬에서 변경 파일 대상 RuboCop을 별도로 돌려 새 코드에 오펜스가 없음을 확인했다. 두 스킬 리뷰를 통해 병합을 막는 문제는 발견하지 못했지만, PR이 방금 고친 보안 픽스와 같은 카테고리의 잔여 위험(섹션 단위 공개 스코프 누락)과 헬퍼 간 사소한 중복을 찾았다.

## 이번 작업에서 처음 배운 개념

- **테넌트 격리 가드 패턴 (멀티 workspace에서 FK 소속 검증)** — 이 앱에서 `User`는 `has_many :workspaces`로 여러 workspace에 동시에 속할 수 있다. 그래서 컨트롤러가 파라미터로 받은 `process_id`/`group_id`/`appraisee_id` 같은 FK가 "DB에 존재하는가"만 확인하면 안 되고, "현재 요청 URL의 workspace에 속하는가"까지 별도로 확인해야 한다. 이 PR은 `AppraisalProcess.joins(appraisal_group: :appraisal).exists?(id:, appraisals: { workspace_id: workspace.id })` 같은 join + `exists?`로 소속을 검증하고, 실패하면 403이 아니라 404를 반환해서(`not_found_error!`) 그 id가 다른 workspace에 존재하는지 여부 자체를 노출하지 않는다. AGENTS.md의 "객체 ID만 믿지 않는다" 불변식이 실제로 어떤 형태의 코드가 되는지 처음 구체적으로 봤다.
- **Grape::Entity `options` 기반 조건부 필터링과, `if:` 게이팅과의 차이** — `Entities::Appraisers::AppraisalResponseEntity#grade_adjustments`는 `expose`된 컬렉션 자체를 껐다 켰다 하는 게 아니라, `object.grade_adjustments.reject { options[:open_result_section_ids].present? && !grade_adjustment.section_id.in?(options[:open_result_section_ids]) }`처럼 **컬렉션 내부 원소를 옵션 값으로 걸러낸다**. 기존에 알던 `if:` 조건부 expose(레슨 47)는 "이 필드를 노출할지 말지"를 결정하는 것이고, 이건 "이미 노출하기로 한 컬렉션에서 어떤 원소를 뺄지"를 결정하는 다른 메커니즘이다. 그런데 이 옵션 값(`open_result_section_ids`)을 만드는 헬퍼(`AppraisalAppraisee#open_section_ids`)가 어떤 process 기준으로 스코프됐는지를 놓치면, 필터 자체는 정상 작동하는데 필터에 넘겨주는 입력값이 이미 새어 있는 상태가 될 수 있다는 걸 확인했다 (아래 "막혔던 것" 참고).

## 작업하면서 막혔던 것과 해결 방법

- **"이미 고친 보안 버그"와 "같은 카테고리의 남은 버그"를 구분하는 데 시간이 걸렸다.** PR은 `find_open_result_list_appraisee`에서 요청한 `process_id`가 실제로 `appraisee.open_process_ids`에 포함되는지 검증하도록 막 고쳤다(커밋 92aee159b). 그런데 같은 엔드포인트가 그 다음 줄에서 쓰는 `appraisee.open_section_ids`는 형제 메서드인 `AppraisalAppraiser#open_section_ids(open_process_id:)`/`AppraisalProcess#open_section_ids(open_process_id:)`와 달리 `open_process_id:` 인자를 받지 않고 대상자의 **모든** process에 걸쳐 공개된 section을 합집합으로 반환한다. `validated_appraisal_private_processes`(→ `AppraisalPrivateProcess`, FK `appraisee_id`)까지 모델을 따라 내려가서, "process는 스코프했는데 section은 스코프 안 한" 비대칭을 실제 쿼리로 확인했다. 추가된 회귀 테스트도 "전혀 공개 안 된 섹션은 제외"만 검증해서 이 비대칭을 못 잡는다는 것까지 diff와 spec 픽스처를 나란히 대조해서 알아냈다. — "보안 커밋이 있으니 그 영역은 안전하다"고 넘겨짚지 않고, 그 커밋이 정확히 무엇을 스코프했는지 형제 메서드와 나란히 비교해야 한다는 걸 체감했다.
- **로컬 RSpec 실행이 docker 컨테이너 기동 지연으로 백그라운드에서 끝내 완료되지 못하고 kill됨.** GitHub CI(AWS CodeBuild)는 이미 통과했으므로 병합 판단에는 영향 없다고 보고, 로컬 실행은 미검증으로 명시해서 보고했다.

## 다음에 더 공부하고 싶은 것

- `AppraisalPrivateProcess`(`open_process_id`, `open_section_id`, `privacy_type`)가 정확히 어떤 도메인 요구사항("A 프로세스 결과가 열리면 B 프로세스의 특정 section도 같이 열린다" 같은 것)을 표현하려는 모델인지 더 파보기 — 지금은 "스코프가 비대칭이다"까지만 확인했고, 의도된 설계인지 실수인지는 팀 확인이 필요한 상태로 남겨뒀다.
- 같은 개념(스코프 필터)을 구현한 형제 메서드 여러 개 중 하나만 파라미터를 안 받는 "시그니처 비대칭" 버그 패턴을 다른 PR에서도 의식적으로 찾아보기 — 이번처럼 `open_section_ids`(대상자) vs `open_section_ids`(평가자/프로세스)처럼 이름은 같은데 스코프 계약이 다른 메서드 쌍을 grep으로 걸러내는 방법.

## 참고 — ROADMAP.md 대조 결과

"실무 패턴(Performance Plus) > 권한" 섹션에 "테넌트 격리 가드 패턴 (멀티 workspace에서 FK 소속 검증)" 항목을 새로 추가해 체크(`[x]`)했다. "실무 패턴 > Grape API" 섹션에는 기존 "Grape::Entity의 `if:` 조건부 expose" 항목 바로 아래에 "Grape::Entity `options` 기반 조건부 필터링" 항목을 신규 추가해 체크했다. "파라미터 스코프 불일치로 인한 데이터 노출"(형제 메서드 시그니처 비대칭) 개념은 이번엔 ROADMAP에 반영하지 않고 이 work-log에만 기록하기로 함 — 다음에 비슷한 사례를 한 번 더 만나면 그때 별도 항목화할지 판단.
