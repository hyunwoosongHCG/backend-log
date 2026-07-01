# 자동 타임스탬프 관리와 Dirty Tracking 습득

2026-07-01 ppback Objective/KeyResult의 `updated_at`이 "체크인 시에만 갱신되는가"라는 질문에서 출발해 코드베이스를 전수 조사하며 학습했다. `created_at`/`updated_at`이 모델 코드 어디에도 세팅되지 않는데 자동으로 채워지는 이유가 `ActiveRecord::Timestamp`가 모든 모델에 숨은 콜백을 걸어두기 때문임을 확인했고, 이어서 "같은 값으로 update해도 updated_at이 안 바뀌는" 현상을 조사하며 Dirty Tracking/Partial Writes 개념(`changed?`, `attribute_changed?`)까지 연결했다.

**Evidence**: `app/models/objective.rb`의 체크인/수정 메서드 전수 조사, `app/controllers/check_ins_controller.rb`의 `next if key_result.value == check_in_detail[:value]` 가드 코드 분석, 가중치 일괄 수정 워커(`update_key_result_weight_bulk_worker.rb`)가 `update_obj_progress_history`를 안 거쳐 이력이 누락되는 사례 발견.

**Implications**:
- "같은 레코드의 timestamp 자동 관리"와 "다른 테이블에 이력을 명시적으로 남기는 것"의 경계를 구분할 수 있게 됨 — 다음에 콜백(`before_save`, `after_create`)을 직접 선언하는 레슨에서 이 대조를 다시 언급하면 강화된다.
- `belongs_to ... touch: true` 옵션은 아직 실습 안 함 — 연관관계 레슨(0008) 복습 시 추가로 다룰 만한 다음 후보.
