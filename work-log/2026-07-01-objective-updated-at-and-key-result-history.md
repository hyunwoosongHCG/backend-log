# Objective updated_at 갱신 시점 & 핵심성과 이력 기록 구조 파악

## 작업 요약

Performance Plus 백엔드(ppback)의 OKR API에서 `objectives`/`key_results` 조회 시 내려오는 `updated_at`이 "목표 달성도 체크인(진척도 체크인) 시에만 갱신되는가"라는 궁금증에서 출발해, `Objective`/`KeyResult`의 `updated_at` 갱신 경로와 진행도 이력(`ObjProgressHistory`) 기록 커버리지를 코드베이스 전수 조사로 확인했다.

## 이번에 새로 배운 개념

- [x] 콜백 (`before_save`, `after_create` 등) → `ActiveRecord::Timestamp`가 `created_at`/`updated_at`을 자동 관리하는 것도 내부적으로 콜백처럼 동작하는 프레임워크 기본 기능이라는 걸 확인했다. 마이그레이션에서 `t.timestamps`로 두 컬럼만 만들어두면, 모델 코드에 아무것도 안 써도 저장(`save`/`update`/`update!`)될 때마다 자동으로 값이 채워진다. `created_at`은 INSERT 시 1번, `updated_at`은 UPDATE될 때마다.
- [x] Dirty Tracking / Partial Writes (ROADMAP 신규 항목 제안) → 실제 attribute 값이 바뀌지 않으면 `.update`가 SQL UPDATE 자체를 스킵하고(`changed?` false), 그 결과 `updated_at`도 갱신되지 않는다. `app/controllers/check_ins_controller.rb`의 `next if key_result.value == check_in_detail[:value]` 가드에서 실제 사례를 확인했다.
- `belongs_to`/`has_many`의 `touch: true` 옵션 → 이 프로젝트는 `Objective`↔`KeyResult` 관계에 이 옵션을 쓰지 않는다. 그래서 KeyResult 레코드만 단독으로 저장돼도 Objective의 `updated_at`은 자동으로 갱신되지 않고, 각 이벤트 메서드가 `objective.update!(...)`를 직접 호출해야 갱신된다.
- 명시적 이력 기록 패턴(콜백 vs 수동 체이닝) → 관련 테이블(`ObjProgressHistory`)에 이력을 남기는 것은 프레임워크가 대신해주지 않는다. 이벤트 메서드 안에서 개발자가 명시적으로 `create!`를 호출해야 하는데, 이 방식은 명확하지만 특정 경로에서 호출을 빠뜨리면 이력이 조용히 누락될 수 있다는 걸 실제 사례로 확인했다.

## 막혔던 것과 해결 방법

- **문제 1**: "체크인 시에만 `Objective.updated_at`이 갱신된다"는 전제가 맞는지 확인이 필요했다.
  - **해결**: `app/models/objective.rb`의 체크인 관련 메서드(`request_check_ins_and_create_history`, `adjust_check_ins_and_create_history`, `accept_check_ins_and_create_history` 등)뿐 아니라 생성/수정/승인/거절/마감/복원 등 Objective 레코드가 저장되는 **모든** 경로에서 `updated_at`이 갱신된다는 걸 코드 전수 조사로 확인했다. 전제 자체가 틀렸다.

- **문제 2**: "핵심성과(KeyResult)에 대해 수정된 사항이 있는 시각이 어딘가에 다 기록되는지" 확인이 필요했다.
  - **해결**: 단일 테이블로 전부 커버되지 않고 계층별로 나뉘어 있다는 걸 발견했다.
    - `KeyResult.updated_at` — 그 레코드의 **최신** 저장 시각만 (여러 번의 이력이 아님)
    - `CheckInRevision.data` / `ObjectiveRevision.data` — 승인 이벤트별 prev/next diff + 자체 타임스탬프
    - `ObjProgressHistory` — Objective 전체 progress(%) 스냅샷 (개별 key_result 단위 아님)

- **문제 3(발견)**: 가중치(weight) 일괄 수정 워커(`app/workers/objective/update_key_result_weight_bulk_worker.rb:45-61`, `app/workers/team_admins/objective/update_key_result_weight_bulk_worker.rb:51-70`)가 `Objective#update_progress`(=`update_obj_progress_history` 호출 포함)를 거치지 않고 `objective.update!(progress: ...)`를 직접 호출한다는 걸 발견했다. 그 결과 이 경로로 인한 progress 변경은 `ObjProgressHistory`에 기록되지 않는 사각지대가 있다. (의도된 설계인지 누락인지는 미확인 — 후속 확인 필요)

## 다음에 더 공부할 것

- `before_save`/`after_create` 등 콜백을 실제 모델에 직접 선언해보고, 이번에 확인한 "명시적 체이닝 vs 콜백" 트레이드오프(선언적이라 안전하지만 암묵적 vs 명확하지만 호출 누락 위험)를 직접 비교해보기.
- Dirty Tracking API(`changed?`, `attribute_changed?`, `saved_change_to_*?`)를 콘솔에서 직접 실습.
- 가중치 워커의 `ObjProgressHistory` 누락이 의도된 설계인지 실제 버그인지 확인 — 필요하면 별도 이슈로 트래킹.
