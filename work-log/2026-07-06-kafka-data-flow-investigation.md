# Kafka 데이터 연동 조사 — theplus-aws-lambda → optimiz-system/optimiz-hr → theplus-back/ppback

> 날짜: 2026-07-06
> PR: (없음 — 5개 레포 교차 조사)

## 작업 한 줄 요약

people-sync(theplus-aws-lambda)가 발행한 이벤트가 optimiz-system/optimiz-hr(Java)를 거쳐 theplus-back의 Karafka 컨슈머에서 실제 DB로 반영되기까지의 전체 경로를, 5개 레포(theplus-aws-lambda, theplus-back, ppback, optimiz-system, optimiz-hr)를 교차 조사해서 코드로 확인했다.

## 이번 작업에서 처음 배운 개념

- **[Topic](../lessons/0025-kafka-topic.html)** — 이름 붙은 이벤트 채널, 토픽 이름에 발행 모듈명을 넣는 컨벤션
- **[Producer](../lessons/0026-kafka-producer.html)** — 메시지를 발행만 하고 응답을 기다리지 않는 fire-and-forget 방식
- **[Consumer / Karafka](../lessons/0027-kafka-consumer-karafka.html)** — Ruby 카프카 컨슈머 프레임워크, 얇은 Consumer + 서비스 객체 분리 패턴
- **[Consumer Group](../lessons/0028-kafka-consumer-group.html)** — 그룹 내 경쟁 소비 vs 그룹 간 독립 구독
- **[DLQ](../lessons/0029-kafka-dlq.html)** — 반복 실패 메시지를 격리해 파이프라인 전체가 막히지 않게 하는 패턴
- **[MSK](../lessons/0030-aws-msk.html)** — AWS 관리형 카프카, RDS의 카프카 버전

## 막혔던 것과 해결 방법

- theplus-back/ppback/theplus-aws-lambda 3개 레포만 봤을 때는 "누가 people-sync의 3개 토픽(`perpl-account`, `record-account-info`, `user-performance-module-status`)을 실제로 소비하는지" 코드로 확인할 수 없었다 — theplus-back의 `docs/kafka.md`엔 "System/HR은 Java 서비스"라고만 적혀 있고 그 코드는 조사 범위 밖이었다. → Desktop/optimiz 워크스페이스(optimiz-system, optimiz-hr)에서 정확히 그 3개 토픽 문자열을 grep해서 `PerplAccountConsumer`, `AccountInfoConsumer`, `UserModuleStatusConsumer`(`@KafkaListener`)를 찾아 직접 확인했다.
- `user-performance-module-status`와 `user-system-module-status`가 이름이 너무 비슷해서 처음엔 네이밍 버그로 의심했다. → optimiz-system의 `CONST_SYSTEM_TOPIC.java`에서 `user-hr-module-status` / `user-performance-module-status` / `user-system-module-status` / `user-time-module-status`가 나란히 정의된 걸 보고, 발행 모듈명을 토픽 이름에 넣는 의도된 컨벤션임을 확인했다.

## 다음에 더 공부하고 싶은 것

- 카프카 파티션과 메시지 순서 보장의 정확한 범위 (토픽 전체가 순서 보장되는지, 파티션 단위인지)
- Exactly-once / At-least-once 처리 시맨틱스와 이 프로젝트가 실제로 어느 쪽에 가까운지
- optimiz-time(근무 모듈)이 소비하는 나머지 토픽들 — 이번엔 이름만 확인하고 깊이 들어가지 않았다
