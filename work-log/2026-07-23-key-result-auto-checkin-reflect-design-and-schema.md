# 핵심성과 체크인 자동 반영 기능 — 기획 검토 + 구현 1단계(옵션 스키마)

> 날짜: 2026-07-23
> 브랜치: feature/key-result-auto-checkin-reflect (dev에서 분기)
> 커밋: `2b8b947d7`(워크스페이스 옵션), `b22a69082`(핵심성과 옵션)
> 관련 Slack: #C06ULEEM88M, #C60TEJMB7, #C08VCM8TL76
> 레포: ppback(Rails), ppfront, Eggplant-admin(코드 조사만)

## 작업 한 줄 요약

하위 목표/핵심성과 체크인 시 상위 핵심성과에 달성값을 자동 반영하는 기능을, 기존 기획 아티팩트를 코드와 대조 검증하며 다시 정리하고(kind별 계산식 재설계, 순환 참조 리스크 실제 재현 시도, 벌크 처리 경로 2개 실제 API 대조), 그중 1단계인 워크스페이스·핵심성과 옵션 스키마를 구현·커밋했다.

## 이번 작업에서 처음 배운 개념

- **`accepts_nested_attributes_for`** — 부모 모델(`Objective`)에 자식 레코드(`KeyResult`) 배열을 한 번에 생성/수정하게 해주는 Rails 매크로. `has_many :key_results` 위에 선언하면 `key_results_attributes=`라는 가상 setter가 자동 생성되고, 배열 안 각 해시에 `id`가 없으면 create, 있으면 update, `allow_destroy: true` + `_destroy: true`면 delete로 자동 분기한다. 목표 생성(POST) API가 이걸 쓰기 때문에 새 필드를 추가할 때 Grape 파라미터만 추가하면 끝났다.
- **Grape의 입력 계약과 출력 계약 분리** — `params do...end`(요청 파라미터 화이트리스트)와 `Grape::Entity`의 `expose`(응답 필드 화이트리스트)가 완전히 별개 선언이라, 필드 하나 추가하려면 두 파일을 각각 손대야 한다는 것. "받는 것"과 "보여주는 것"이 프레임워크 레벨에서 명확히 갈라져 있다.
- **승인-diff 파이프라인 패턴** — 이 코드베이스는 목표 "생성"은 `accepts_nested_attributes_for`로 즉시 반영하지만, "수정"은 자체 구현한 `ObjectiveUpdateDiff`(필드를 화이트리스트로 비교해서 diff 생성) → `ObjectiveRevision`(pending 상태로 저장) → `ObjectiveApproveUpdate`(승인 시 실제 반영) 3단계 파이프라인을 탄다. 새 필드를 추가할 때 Grape 파라미터만으론 부족하고, `ObjectiveUpdateDiff`의 화이트리스트 세 곳(`next_data` 배열, `prev_data`의 `only:`, `next_hash`)에 다 반영해야 실제로 저장된다는 걸 직접 겪었다.
- **Grape custom validator** (`Grape::Validations::Validators::Base`, `register_validator`, `validate_param!`) — 워크스페이스 설정값에 따라 특정 파라미터 사용 자체를 막는 패턴(`use_super_key_result_link_validator`, `manager_required_validator` 등). 파라미터 타입 검증을 넘어서 "이 값을 지금 써도 되는 상태인가"까지 이 레이어에서 처리한다.
- **마이그레이션 롤백/재적용으로 `db/schema.rb` 스냅샷을 커밋 단위로 정확히 나누는 기법** — 생성 파일(schema.rb)을 손으로 짜깁기하지 않고, `rails db:rollback`으로 마지막 마이그레이션만 되돌린 상태를 커밋 1에, 다시 `rails db:migrate`로 재적용한 상태를 커밋 2에 넣는 방식. `annotate` gem이 모델 주석도 그 시점 스키마에 맞춰 자동으로 다시 써준다는 것도 같이 확인.
- **closure_tree gem과 자기참조 관계(self-referential association)의 순환 참조 방지** — `Objective.super_objective_id`처럼 같은 모델을 가리키는 FK 트리 구조에서 `cycle_is_not_permitted` 같은 커스텀 validation이 왜 필요한지, 그리고 이 검증이 없는 다른 FK 체인(`KeyResult.super_key_result_id`)에서는 이게 실제로 어떤 리스크가 되는지.
- **Pundit 정책의 `errors` 활용 패턴** — `record.errors.add(:status, :not_pending) unless ...`로 실패 사유를 기록해두고 `record.errors.empty? && (다른 조건)`으로 최종 boolean을 만드는 스타일. 정책 메서드는 여전히 true/false만 반환하면서도 왜 실패했는지를 명시적으로 남기는 절충안.
- **Sidekiq::Status gem** — `Sidekiq::Status::Worker` 모듈을 include하면 `total`/`at`/`store`/`retrieve` 헬퍼로 job 진행률을 Redis에 기록하고, 클라이언트가 `job_id`로 폴링해서 진행률(%)을 조회할 수 있게 해주는 벌크 작업 진행률 추적 패턴.
- **트랜잭션 하나로 묶인 반복문에서 부분 실패가 전체를 롤백시키는 실전 사례** — `UpdateKeyResultCheckInBulkWorker`가 목표 N개를 `ActiveRecord::Base.transaction do ... objectives.each do |o| ... end end`로 처리하는데, 이 중 하나만 실패해도(예: 값이 안 바뀌어서 나는 `BadRequest`) 트랜잭션 전체가 롤백되어 나머지 성공했어야 할 항목들까지 다 날아간다는 걸 코드로 확인했다.

## 작업하면서 막혔던 것과 해결 방법

- **순환 참조를 이론으로만 걱정하다가 실제 재현에서 막힘.** "상위-하위 목표가 순환 구조를 만들 수 있는가"를 처음엔 코드만 보고 걱정했는데, 실제로 Postman/화면에서 재현을 시도해보니 "상위 목표를 먼저 연계하지 않으면 핵심성과 가져오기 자체가 불가능"하다는 프론트 제약에 막혔다. "아무 KR이나 자유롭게 연계 가능"이라는 첫 가설이 틀렸다는 걸, 실제 프론트 코드(`SuperObjectiveModal`이 `objectiveId=selectedSuperObjective.value`로 스코프됨)로 재검증하고 나서야 "일반 UI 흐름으론 불가능하지만 백엔드엔 이 검증이 없어서 API/벌크 업로드 경로는 여전히 이론상 가능하다"로 리스크를 정확히 재평가할 수 있었다. 가설 → 재현 시도 → 실패 → 코드로 원인 재검증, 이 순서가 유용했다.
- **`ObjectiveUpdateDiff`에 새 필드 추가가 화이트리스트 3곳 다 필요하다는 걸 늦게 알아챌 뻔함.** Grape 파라미터만 추가하면 될 줄 알았다가, PUT(수정) API로 값을 보내도 실제로는 저장이 안 되는 걸 뒤늦게 알아챌 뻔했다. `git diff`로 이 서비스가 화이트리스트 비교 방식이라는 걸 미리 파악해서 세 지점(`next_data` 배열, `prev_data`의 `only:`, `next_hash`)에 다 반영했다.
- **컬럼명을 논의 중간에 바꾸면서 이미 적용한 마이그레이션을 다시 손봐야 했음.** `use_key_result_auto_checkin_reflect`/`auto_checkin_reflect`로 이름을 확정하기 전 다른 이름으로 먼저 마이그레이션을 적용해뒀던 걸, 롤백 → 파일명/클래스명 다시 맞춰서 재작성 → 재적용하는 과정을 거쳤다. Rails 마이그레이션은 파일명과 클래스명이 정확히 일치해야 한다는 걸(안 맞으면 `NameError`) 이번에 다시 확인했다.

## 다음에 더 공부하고 싶은 것

- Sidekiq 워커 안에서 여러 레코드를 처리할 때 부분 실패를 격리하는 표준 패턴(트랜잭션을 레코드 단위로 쪼개거나, 실패 목록을 따로 모아 재시도하는 방식 등)이 이 코드베이스 다른 곳엔 있는지
- Grape custom validator를 실제로 하나 새로 작성해보기 — 다음 단계인 "워크스페이스 옵션 우선 검증 → 개별 핵심성과 확인" 가드를 만들 때 직접 작성해볼 예정
- closure_tree gem이 내부적으로 유지하는 closure table 구조를 실제 스키마로 뜯어보고 싶다 (지금은 "그런 게 있다"만 알고 실제 테이블 구조는 안 봄)

## 참고 — ROADMAP.md 대조 결과

`accepts_nested_attributes_for`, closure_tree/자기참조 관계 순환 방지, Grape custom validator 항목이 로드맵에 아직 없어서 새로 추가. Pundit 관련 두 항목(`Pundit 정책(Policy)이란?`, `authorize란?`)은 이번에 `batch_approve?`/`ManagerRequiredValidator` 같은 구체적인 예시로 충분히 이해했다고 판단해 체크함. Sidekiq 워커 작성법 항목엔 이번 작업 링크를 추가.
