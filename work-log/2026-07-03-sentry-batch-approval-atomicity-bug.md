# Sentry PERPL-BACK-44H — batch_approval NoMethodError 원인 분석

## 작업 한 줄 요약

목표 일괄승인 API에서 발생한 `NoMethodError`(`change_data`가 nil)의 근본 원인을, 승인 로직의 여러 UPDATE가 하나의 트랜잭션으로 묶여있지 않아 원자성이 깨진 결과로 추적했다.

## 이번 작업에서 처음 배운 개념

- **트랜잭션(Transaction)과 원자성(Atomicity)** — 여러 개의 개별 UPDATE 문이 `ActiveRecord::Base.transaction`으로 묶여 있지 않으면, 중간 단계 하나가 실패해도 그 앞의 UPDATE는 이미 커밋된 채로 영구히 남는다.
- **`update` vs `update!`** — `update`는 validation 실패 시 예외 없이 `false`만 반환한다. 반환값을 확인하지 않으면 실패가 로그도 없이 조용히 묻힌다(silent failure).
- **`has_one -> { where(status: :pending) }` 스코프드 연관관계** — 연관 레코드의 상태(status) 컬럼이 바뀌는 순간, 새로 조회하는 연관관계 결과는 즉시 nil이 될 수 있다.
- **`with_lock`** — 행 잠금(`SELECT ... FOR UPDATE`)과 트랜잭션을 함께 걸어주는 헬퍼. 이미 외부 트랜잭션 안에서 호출되면 별도 서브트랜잭션을 만들지 않고 그 트랜잭션에 합류한다.

## 막혔던 것과 해결 방법

- 처음엔 "일괄승인 중 objective 여러 개 중 하나만 처리 실패한 케이스"라고 추측했지만, 코드를 보니 `bulk_accept`는 `objectives.each` 루프 전체가 `ActiveRecord::Base.transaction`으로 감싸여 있어서 중간에 하나가 실패하면 배치 전체가 롤백된다. 즉 배치(bulk) 자체는 이미 원자적으로 설계되어 있었다.
- 진짜 원인은 완전히 별개의 **단건 API**였다: 목표 수정요청 단건 승인(`PUT :id/update_approval`)과 체크인 단건 승인(`Objective::CheckIns::UpdateService`). 두 경로 모두 "① revision/체크인 status를 accepted로 저장" → "② objective의 stage를 open으로 업데이트"가 각각 독립된 statement로 실행되는데, 그 사이를 감싸는 트랜잭션이 없다.
  - 체크인 단건 승인: `accept_check_ins`(revision 저장, `save!`)가 끝나고 나서 `update!(progress: calculate_progress, stage: 'open')`을 호출하는데, `calculate_progress`가 예외를 던질 수 있는 경로가 실제로 존재한다 (`key_result.weight`가 nil이거나, interval형 key_result의 `key_result_option`이 nil이거나, `target`이 0이라 `Infinity`가 나오는 경우).
  - 수정요청 단건 승인: `accept_update_and_create_history`(app/models/objective.rb:874)가 `update(stage: :open)`을 **반환값 체크 없이** 호출한다. Objective 모델엔 `validate :started_time, :ended_time`, `validate :individual_validation` 같은 검증이 걸려있어서(시작일/종료일 없음, 개인 목표가 아닌데 담당팀 없음 등), 이 조건에 걸리면 `update`가 예외 없이 조용히 `false`를 반환하고 다음 줄(`create_history`)로 그냥 넘어간다.
  - 두 경우 모두 결과적으로 "승인 대기 데이터(revision)는 이미 사라졌는데 objective의 stage는 계속 대기중"인 고장난 상태가 영구히 남는다. 이후 그 objective를 다시 승인 시도할 때마다(단건이든 일괄이든) 똑같은 `NoMethodError`가 재현된다 — 실제로 같은 유저가 8분 새 6번 같은 에러를 본 이유.

## 다음에 더 공부할 것

- 트랜잭션 격리 수준(Isolation Level)과 MySQL 기본값(REPEATABLE READ)이 동시 요청에 미치는 영향
- `with_lock` / `SELECT ... FOR UPDATE` 행 잠금과 동시성 제어
- 컨트롤러 vs 서비스 객체 중 어느 레이어에서 트랜잭션을 감싸는 게 맞는지에 대한 설계 패턴
