# 핵심성과 자동 반영 — closure_tree 어멘드 트리 적용 가능성 분석 + 로컬 실증

> 날짜: 2026-08-20
> PR: https://github.com/hcgtheplus/ppback/pull/5532
> 브랜치: `feature/key-result-auto-checkin-reflect`
> 관련 기록: [08-19 결정 연대기](2026-08-19-key-result-auto-reflect-decision-timeline.md)

## 작업 한 줄 요약

8/19 Slack 미팅에서 "체크인 자동 반영을 최하위→최상위 정렬 후 Sidekiq에 순차 태우자"는 결론이 나왔고, 담당자가 `config/initializers/closure_tree_amend.rb`(closure_tree gem 확장)를 그 정렬에 재사용할 수 있는지 물었다. 코드를 구조적으로 추적한 결과 **재사용 불가**로 결론 냈다 — 자동 반영이 타는 체인(`super_key_result_id`, Objective↔KeyResult 교대)과 closure_tree가 관리하는 트리(`super_objective_id`, Objective 단일 모델 자기참조)는 별개였다. 이어서 이 두 연계 방식이 프론트 어디에 있고 실제로 어떻게 데이터를 쌓는지 확인해달라는 요청을 받아, ppfront 소스에서 UI 위치를 확정하고, 로컬 DB에 실제 연계 데이터가 하나도 없길래 도메인 서비스 코드를 직접 호출해 두 시나리오(목표 연계·핵심성과 가져오기)를 만들고 체크인까지 실행해 반영 결과를 실측했다.

## 이번 작업에서 처음 배운 개념

- **closure_tree gem은 단일 모델의 자기참조 트리만 표현한다.** `depth`가 `ancestor_hierarchies.size - 1`로 계산되는데(`closure_tree-9.7.0/lib/closure_tree/model.rb`), `ancestor_hierarchies`는 `has_closure_tree`를 선언한 모델 전용 hierarchy 테이블(`objective_hierarchies` 등)에 대한 자기 참조 관계다. 자동 반영 체인처럼 `Objective → KeyResult(super_key_result) → Objective → ...`로 **두 모델이 교대로 나오는 그래프**는 이 gem 하나로 표현할 방법이 애초에 없다는 걸 gem 소스를 직접 읽고 확인했다.
- **필드가 이웃해 있다고 같은 트리가 아니다.** `Objective`에는 `super_objective_id`(closure_tree 대상, 상위 목표 org-chart)와 `super_key_result_id`(자동 반영 대상)가 나란히 있는데, `objectives_controller.rb`의 파라미터 허용 목록에도 별개로 있고 둘을 교차검증하는 validator가 어디에도 없다. 그런데 ppfront 코드(`SuperObjectiveModal.jsx`)와 e2e 시드(`09-obj-edit-links.sh`)를 보면 **UI로는 항상 이미 선택한 `super_objective_id`의 KR 중에서만** `super_key_result_id`를 고르게 되어 있어서, 실제 사용 경로에서는 두 값이 한 홉씩 우연히 맞아떨어진다. "스키마가 보장하는 것"과 "UI 관례로 보장되는 것"을 구분해야 한다는 걸 체감했다 — 전자는 API 직접 호출이나 관리자 벌크 업로드가 깨도 막을 방법이 없다.
- **outbox 패턴이 실제로 어떻게 도는지 처음 눈으로 봤다.** `check_in_revisions.create!` 직후 `key_result_reflection_events`에 `processed_at: nil`인 행이 즉시 생기고(같은 트랜잭션), 별도로 떠 있던 Sidekiq 워커(`Objective::ReflectToSuperKeyResultWorker`)가 0.1초 안에 그 행을 집어가 `processed_at`을 채우는 걸 확인했다. 커밋과 반영이 분리돼 있다는 걸 코드 주석으로만 알던 것과, 실제로 그 사이에 "아직 처리 안 된 창"이 눈에 보이는 것은 다른 확신이었다.
- **"목표 연계"와 "핵심성과 가져오기"는 히스토리 `source` 구조 자체가 다르다.** 실측한 `AutoCheckedIn` 히스토리를 보면 목표 연계는 `source.type == "objective"`(source 자신이 목표라 `objective_id` 필드가 따로 없음), 핵심성과 가져오기는 `source.type == "key_result"`이고 `source.objective_id`가 별도로 붙는다(KR과 그 소유 목표가 다른 개체라서). 코드(`reflect_to_super_key_result_service.rb#source_information`)를 읽었을 때는 이 구조 차이가 왜 필요한지 몰랐는데, 실제 데이터로 보니 "이 반영이 목표 단위 연계에서 온 건지 KR 단위 연계에서 온 건지"를 감사 이력만 보고 구분하기 위한 설계라는 게 명확해졌다.

## 작업하면서 막혔던 것과 해결 방법

- **로컬 DB에 자동 반영 관련 데이터가 0건이었다.** `e2e-seed-scripts/objectives/09-obj-edit-links.sh`가 만든다는 목표(id 89-91)를 `ids.json`에서 찾아 조회했는데 전부 `RecordNotFound` — `Objective.count`가 57(max id 60)까지밖에 없어서, 그 시드가 이 로컬 DB에는 아예 실행된 적이 없는 상태였다. `super_key_result_id IS NOT NULL`인 행도, `auto_checkin_reflect = true`인 KR도, `key_result_reflection_events` 행도 전부 0건이었다. 시드 스크립트를 그대로 재현하려면 로그인 서버(`localhost:8095`, 별도 레포)가 필요한데 이번 세션에서 띄운 건 ppback docker만이라 그 경로는 막혀 있었다.
  - **해결:** HTTP/인증 계층을 우회하고, 컨트롤러가 실제로 호출하는 것과 동일한 도메인 서비스(`Objective::CheckIns::RequestService`가 즉시 확정 분기에서 쓰는 `objective.adjust_check_ins_and_create_history`)를 `rails runner`에서 직접 호출했다. `rails runner`로 `update_column` 같은 raw write를 하면 콜백·검증이 빠져 운영과 어긋난 데이터가 된다는 걸 알고 있어서, 대신 실제 서비스 코드 경로를 그대로 실행하는 방식을 택했다 — 이건 API를 우회한 게 아니라 API가 도달하는 지점과 같은 지점에서 시작한 것이다.
- **`Objective.create!`가 "값이 반드시 필요합니다"만 던지고 어떤 필드인지 안 알려줬다.** `key_results_attributes`의 `target` 누락이 원인인 줄 알고 명시적으로 채웠는데도 같은 에러가 반복됐다. `.new` + `.valid?` + `errors.details`로 바꿔서 찍어보니 `{approver: [{error: :blank}]}` — `belongs_to :approver`가 Rails 기본값(`belongs_to_required_by_default`)으로 presence를 요구하고 있었다. `full_messages`만 보고는 어느 필드인지 알 수 없었고, `errors.details`(attribute + error 코드)를 보고서야 원인을 특정했다. **presence 에러 디버깅은 `full_messages`가 아니라 `errors.details`부터 봐야 한다**는 걸 배웠다.

## 다음에 더 공부하고 싶은 것

- 4세대 제안(08-19 기록의 대상 단위 아웃박스)이 실제로 채택된다면, 지금 실측한 "체크인 직후 outbox 생성 → 워커가 처리 → processed_at 갱신"이라는 관찰 지점 자체가 어떻게 바뀌는지 — 대상 단위로 바뀌면 같은 실험을 다시 돌렸을 때 `key_result_reflection_events` 행 수·내용이 어떻게 달라지는지 비교해보고 싶다.
- `super_objective_id`와 `super_key_result_id`가 어긋나는 경로(관리자 API 직접 호출, 벌크 업로드가 나중에 `super_key_result_id`도 다루게 되는 경우)가 실제로 생기면 반영 체인이 어떻게 깨지는지 — 지금은 "UI로는 안 깨진다"까지만 확인했고 "깨지면 정확히 뭐가 잘못되는지"는 실험해보지 않았다.
- `errors.details`를 습관적으로 먼저 찍어보는 디버깅 순서를 다른 모델 검증 실패에도 적용해보기.
