# theplus-back PR #1294 학습 + juhoLee님과의 MSA/분산 트랜잭션 대화 정리

> 날짜: 2026-07-06
> PR: https://github.com/hcgtheplus/theplus-back/pull/1294 (원희님 작업, 리뷰어 아님 — 학습 목적으로 읽음)

## 작업 한 줄 요약

Kafka 컨슘 실패 처리를 개편한 PR #1294(트랜잭션 추가, 에러 분류기, `KafkaFailedMessage` 테이블)를 읽고, 팀 시니어 juhoLee님과 나눈 Slack 대화를 바탕으로 원자성/멱등성 구분, 분산 트랜잭션 전략(2PC/Saga/Outbox), 카프카 오남용 판단 기준까지 정리했다.

## 이 작업에서 처음 배운 개념

- **[원자성 vs 멱등성](../lessons/0031-atomicity-vs-idempotency.html)** — "연동이 뻑난다"는 증상 하나에 서로 다른 두 원인이 섞여 있을 수 있다는 것
- **[분산 트랜잭션: 2PC → Saga → Outbox](../lessons/0032-distributed-transaction-2pc-saga-outbox.html)** — 여러 서비스에 걸친 작업을 안전하게 다루는 전략의 계보
- **[언제 카프카를 쓰면 안 되는가](../lessons/0033-when-not-to-use-kafka.html)** — 근태/외부출입 모듈의 카프카 오남용 사례로 배운 기술 선택 기준
- **[MSA와 DDD의 관계](../lessons/0034-msa-ddd-and-not-knowing-everything.html)** — 도메인 경계 → MSA 서비스 경계 → 분산 트랜잭션 전략으로 이어지는 사슬
- (기존 레슨 24·29에도 이 PR의 실제 코드를 두 번째 사례로 보강)

## 작업하면서 막혔던 것

- "트랜잭션 커밋 후 이벤트 발행"이 뭘 완전히 해결하는 건지 헷갈렸다. → 커밋과 발행 사이에 프로세스가 죽으면 여전히 이벤트가 유실될 수 있다는 걸 깨닫고, 그게 바로 Dual Write Problem이자 Outbox 패턴이 풀려는 문제라는 걸 연결했다.
- "원자성 문제"와 "멱등성 문제"가 실제 장애 보고에서는 구분 없이 "연동이 이상하다"로 뭉뚱그려 들어온다는 걸 juhoLee님과의 대화에서 처음 명확히 나눠봤다.
- DDD·MSA·분산 트랜잭션까지 한 번에 다 이해하려니 막막했는데, "이번 주말엔 MSA 파트만, 원희님 작업은 그다음에"로 범위를 스스로 잘라야 한다는 걸 대화 끝에 정했다.

## 다음에 더 공부하고 싶은 것

- Saga의 Choreography(각자 이벤트로 알아서 반응) vs Orchestration(중앙 지휘자가 순서 관리) 구현 방식 차이
- 이 조직의 서비스 경계(theplus-back/ppback/optimiz-*)가 실제로 어떤 Bounded Context 기준으로 나뉘어 있는지
- DDD 기초 — Aggregate, Bounded Context 같은 용어부터
