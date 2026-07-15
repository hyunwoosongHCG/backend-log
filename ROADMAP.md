# 백엔드 학습 로드맵

> 체크 형식: `- [x] 개념 → [정리](concepts/개념.md) | [배운 작업](work-log/날짜-작업명.md)`

---

## 섹션 1. 백엔드 기초 (언어 무관)

### 웹과 HTTP

> 📡 **네트워크 트랙**에서 상세 학습 — 김영한 「모든 개발자를 위한 HTTP 웹 기본 지식」(37강).
> 뷰어(`index.html`) 상단 탭 → **네트워크**. 강의를 정리하면 아래 항목을 `[x]`로 체크한다.
> (아래 `네트워크:` 링크는 해당 개념이 담긴 강의 스텁으로 연결됨)

- [ ] HTTP란? (Request / Response 사이클) — 네트워크: [모든 것이 HTTP](lessons/net-08-everything-is-http.html) · [HTTP 메시지](lessons/net-12-http-message.html)
- [ ] URL 구조와 엔드포인트 — 네트워크: [URI](lessons/net-06-uri.html) · [웹 브라우저 요청 흐름](lessons/net-07-web-browser-request-flow.html)
- [ ] HTTP 메서드 (GET, POST, PUT, PATCH, DELETE) — 네트워크: [GET·POST](lessons/net-14-get-post.html) · [PUT·PATCH·DELETE](lessons/net-15-put-patch-delete.html) · [메서드 속성](lessons/net-16-method-properties.html)
- [ ] HTTP 상태 코드 (2xx, 4xx, 5xx) — 네트워크: [상태코드 소개](lessons/net-19-status-code-intro.html) · [2xx](lessons/net-20-status-2xx.html) · [3xx](lessons/net-21-status-3xx-redirect-1.html) · [4xx·5xx](lessons/net-23-status-4xx-5xx.html)
- [ ] 헤더(Header)와 바디(Body) — 네트워크: [HTTP 헤더 개요](lessons/net-24-header-overview.html) · [표현](lessons/net-25-representation.html) · [콘텐츠 협상](lessons/net-26-content-negotiation.html)
- [ ] 쿠키(Cookie) vs 세션(Session) vs 토큰(Token) — 네트워크: [쿠키](lessons/net-31-cookie.html) · [인증](lessons/net-30-authentication.html)
- [ ] 인터넷 통신 기반 (IP · TCP/UDP · PORT · DNS) — 네트워크: [IP](lessons/net-02-ip-protocol.html) · [TCP·UDP](lessons/net-03-tcp-udp.html) · [PORT](lessons/net-04-port.html) · [DNS](lessons/net-05-dns.html)
- [ ] HTTP 캐시와 조건부 요청 — 네트워크: [캐시 기본](lessons/net-32-cache-basics.html) · [검증 헤더](lessons/net-33-cache-validation-1.html) · [프록시 캐시](lessons/net-36-proxy-cache.html) · [캐시 무효화](lessons/net-37-cache-invalidation.html)

### REST API

- [ ] REST란? (RESTful 설계 원칙)
- [ ] JSON 데이터 형식
- [ ] API 버전 관리 (v1, v2)
- [ ] API 요청/응답 구조 설계

### 아키텍처

- [ ] MVC 패턴 (Model, View, Controller)
- [ ] 서비스 레이어(Service Layer)란?
- [x] 도메인(Domain)이란? 3레이어 Entity와의 차이 → [레슨](lessons/0003-domain-vs-entity.html) | [배운 작업](work-log/2026-06-25-add-use-required-template.md)
- [ ] 미들웨어(Middleware)란?
- [ ] 모놀리식 vs 마이크로서비스

### 데이터베이스 기초

- [ ] 관계형 데이터베이스(RDB)란?
- [ ] 테이블, 컬럼, 로우
- [x] 기본키(PK)와 외래키(FK) → [레슨](lessons/0004-sql-joins.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [x] 공개 식별자(Public ID)와 내부 PK 분리 패턴 → [정리](concepts/public-id-vs-primary-key.md) | [배운 작업](work-log/2026-07-07-delete-workspace-self-find.md)
- [ ] 1:1, 1:N, N:M 관계
- [ ] 인덱스(Index)란? 왜 필요한가
- [x] 트랜잭션(Transaction)과 ACID → [레슨](lessons/0024-transaction-atomicity-bulk-approval-bug.html) | [배운 작업](work-log/2026-07-03-sentry-batch-approval-atomicity-bug.md)
- [ ] 행 잠금(Row Locking)과 동시성 제어 (`with_lock`, `SELECT ... FOR UPDATE`)
- [ ] SQL 기본 (SELECT, INSERT, UPDATE, DELETE)
- [x] JOIN이란? → [레슨](lessons/0004-sql-joins.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)

### 인증과 인가

- [ ] 인증(Authentication) vs 인가(Authorization)
- [ ] 토큰 기반 인증 흐름
- [ ] JWT란?
- [ ] OAuth 개념

### 기타 기초

- [ ] 환경변수(Environment Variable)란?
- [ ] 백그라운드 잡(Background Job)이란?
- [ ] 캐시(Cache)란?
- [ ] 로깅(Logging)이란?

---

## 섹션 2. Ruby 기초

### 자료형과 변수

- [ ] 자료형 (String, Integer, Float, Boolean, nil)
- [x] Symbol vs String → [레슨](lessons/0021-symbol-vs-string.html) | [정리](concepts/symbol-vs-string.md) | [배운 작업](work-log/2026-07-02-symbol-vs-string.md)
- [ ] 배열(Array)
- [ ] 해시(Hash)
- [x] 변수 종류 (지역, 인스턴스, 클래스, 전역) → [레슨](lessons/0035-ruby-instance-variable-and-annotation-confusion.html) | [정리](concepts/ruby-instance-variables.md) | [배운 작업](work-log/2026-07-08-badge-stats-instance-variable-question.md)

### 메서드와 제어문

- [ ] 메서드 정의와 호출
- [ ] 조건문 (if, unless, case)
- [ ] 반복문 (while, loop)
- [ ] 이터레이터 (each, map, select, reduce)
- [ ] 예외 처리 (begin / rescue / ensure)

### 객체지향

- [x] 클래스(Class)와 객체(Object) → [정리](concepts/class-and-instance.md) | [배운 작업](work-log/2026-06-25-add-use-required-template.md)
- [ ] 인스턴스 메서드 vs 클래스 메서드
- [x] 상속(Inheritance) → [정리](concepts/inheritance-and-override.md) | [배운 작업](work-log/2026-06-25-add-use-required-template.md)
- [ ] 모듈(Module)과 믹스인(Mixin)
- [ ] `attr_accessor`, `attr_reader`, `attr_writer`

### Ruby 특유 개념

- [ ] 블록(Block)이란? (`do...end`, `{}`)
- [ ] yield란?
- [ ] Proc과 Lambda
- [ ] `&method` 심볼을 블록으로 넘기기
- [ ] `freeze`, `dup`, `clone`
- [x] 동적 메서드 디스패치 (`send`, 메타프로그래밍) → [레슨](lessons/0037-dynamic-dispatch-send.html) | [배운 작업](work-log/2026-07-09-review-remind-notification-split.md)
- [ ] Gem이란? Bundler와 Gemfile

---

## 섹션 3. Rails 기초

### 프로젝트 구조

- [ ] Rails 디렉토리 구조 (`app/`, `config/`, `db/`)
- [x] `config/routes.rb` 역할 → [레슨](lessons/0023-rails-resources-routing-cases.html) | [정리](concepts/rails-routing-and-controller-convention.md) | [배운 작업](work-log/2026-07-03-controller-routing-and-read-replica.md)
- [ ] `Gemfile`과 `bundle install`

### ActiveRecord (Model)

- [x] 모델(Model)이란? 테이블과의 관계 → [레슨](lessons/0011-activerecord-base-and-model-layer.html)
- [x] 마이그레이션(Migration)이란? → [정리](concepts/migration.md) | [배운 작업](work-log/2026-06-25-add-use-required-template.md)
- [x] 연관관계 (`belongs_to`, `has_many`, `has_one`, `has_many :through`) → [레슨](lessons/0008-active-record-associations.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [x] 폴리모픽 연관관계 (`belongs_to ..., polymorphic: true`) → [레슨](lessons/0036-polymorphic-association.html) | [배운 작업](work-log/2026-07-09-review-remind-notification-split.md)
- [ ] 유효성 검사 (`validates`)
- [ ] 스코프(Scope)란?
- [x] 콜백 (`before_save`, `after_create` 등) → [레슨](lessons/0019-timestamps-and-hidden-callbacks.html) | [정리](concepts/timestamps-and-callbacks.md) | [배운 작업](work-log/2026-07-01-objective-updated-at-and-key-result-history.md)
- [x] `after_commit`과 `after_save`/`after_create`의 차이 (트랜잭션 커밋 시점) → [레슨](lessons/0038-after-commit-vs-after-create.html) | [배운 작업](work-log/2026-07-09-review-remind-notification-split.md)
- [x] Dirty Tracking이란? (`changed?`, `attribute_changed?`, partial writes) → [레슨](lessons/0020-dirty-tracking-and-partial-writes.html) | [정리](concepts/dirty-tracking.md) | [배운 작업](work-log/2026-07-01-objective-updated-at-and-key-result-history.md)
- [x] 쿼리 메서드 (`where`, `find`, `find_by`, `includes`, `joins`) → [배운 작업](work-log/2026-07-07-delete-workspace-self-find.md)
- [x] N+1 문제란? `includes`로 해결하기 → [레슨](lessons/0009-n-plus-1.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [x] Read Replica 라우팅 (멀티 DB, `connects_to`/`connected_to`) → [정리](concepts/read-replica-routing.md) | [배운 작업](work-log/2026-07-03-controller-routing-and-read-replica.md)

### Controller

- [ ] 컨트롤러(Controller)란?
- [x] 액션(Action)과 HTTP 메서드 매핑 → [레슨](lessons/0023-rails-resources-routing-cases.html) | [배운 작업](work-log/2026-07-03-rails-resources-routing-lesson.md)
- [ ] `before_action`이란?
- [ ] Strong Parameters (`params.require.permit`)
- [ ] `render` vs `redirect_to`

### 직렬화와 응답

- [ ] 시리얼라이저(Serializer)란?
- [ ] `render json:` 응답 만들기

### 테스트

- [ ] RSpec 기초 (`describe`, `it`, `expect`)
- [ ] `let`과 `let!`의 차이
- [ ] Factory Bot으로 테스트 데이터 만들기
- [ ] Request spec vs Model spec

---

## 섹션 4. 실무 패턴 (Performance Plus)

### Grape API

- [ ] Grape란? Rails 컨트롤러와의 차이
- [x] 엔티티(Entity)란? (Grape::Entity) → [레슨](lessons/0010-grape-entity-and-n-plus-1-trace.html)
- [ ] `present`로 응답 만들기
- [x] `params do` 블록으로 파라미터 정의 → [레슨](lessons/0018-grape-params.html) | [배운 작업](work-log/2026-07-09-review-remind-notification-split.md)
- [x] `desc`와 Swagger 문서 자동 생성 → [레슨](lessons/0022-data-wrapper-and-swagger.html) | [정리](concepts/data-wrapper-and-swagger.md) | [배운 작업](work-log/2026-07-03-pr-5489-review-and-data-wrapper.md)
- [ ] `before` 블록과 인증 처리
- [x] Grape 파라미터 상호 검증 (`at_least_one_of`)과 `default:`의 실행 순서 충돌 → [배운 작업](work-log/2026-07-09-review-remind-notification-split.md)
- [x] Grape는 top-level JSON 배열 body를 못 읽는다 (`Formatter#read_rack_input`의 `body.is_a?(Hash)` 체크) → [배운 작업](work-log/2026-07-09-review-remind-notification-split.md)

### 권한

- [ ] Pundit 정책(Policy)이란?
- [ ] `policy_scope`란?
- [ ] `authorize`란?

### 백그라운드 잡

- [ ] Sidekiq란?
- [x] 워커(Worker) 작성법 → [정리](concepts/sidekiq-job-argument-pipeline.md) | [배운 작업](work-log/2026-07-03-sidekiq-job-args-and-slack-investigation.md)
- [ ] 큐(Queue) 종류와 우선순위
- [ ] 실패한 잡 재시도
- [x] job 인자 직렬화 (Marshal vs JSON, `on_complex_arguments`) → [정리](concepts/sidekiq-marshal-vs-json-serialization.md) | [배운 작업](work-log/2026-07-03-sidekiq-job-args-and-slack-investigation.md)

### 기타

- [ ] Docker와 컨테이너 기초
- [ ] `docker compose` 명령어 흐름
- [ ] Redis란? 어디에 쓰이나

---

## 섹션 5. 메시지 큐 / 이벤트 기반 아키텍처 (Kafka)

> Performance Plus(theplus-back)가 다른 서비스(System·HR 등)와 어떻게 데이터를 주고받는지 조사하다가 처음 마주친 개념들. theplus-aws-lambda(people-sync) ↔ optimiz-system/optimiz-hr(Java) ↔ theplus-back/ppback(Karafka) 실제 연동 경로를 코드로 추적하며 배웠다.

### Kafka 기본 개념

- [x] Topic이란? → [레슨](lessons/0025-kafka-topic.html) | [배운 작업](work-log/2026-07-06-kafka-data-flow-investigation.md)
- [x] Producer란? → [레슨](lessons/0026-kafka-producer.html) | [배운 작업](work-log/2026-07-06-kafka-data-flow-investigation.md)
- [x] Consumer란? Karafka(Ruby)는 무엇인가 → [레슨](lessons/0027-kafka-consumer-karafka.html) | [배운 작업](work-log/2026-07-06-kafka-data-flow-investigation.md)
- [x] Consumer Group이란? → [레슨](lessons/0028-kafka-consumer-group.html) | [배운 작업](work-log/2026-07-06-kafka-data-flow-investigation.md)
- [x] DLQ(Dead Letter Queue)란? → [레슨](lessons/0029-kafka-dlq.html) | [배운 작업](work-log/2026-07-06-kafka-data-flow-investigation.md)
- [x] MSK(Managed Streaming for Kafka)란? → [레슨](lessons/0030-aws-msk.html) | [배운 작업](work-log/2026-07-06-kafka-data-flow-investigation.md)

### 신뢰성 있는 이벤트 처리

> theplus-back PR #1294(Kafka 컨슘 실패 처리 개편)를 보며 심화. 레슨 24(트랜잭션)·29(DLQ)도 이 PR 내용으로 함께 보강했다.

- [x] 원자성(Atomicity) vs 멱등성(Idempotency) → [레슨](lessons/0031-atomicity-vs-idempotency.html) | [배운 작업](work-log/2026-07-06-pr-1294-transaction-atomicity-and-msa-discussion.md)
- [x] Transient vs Non-transient 에러 분류 (재시도 가능 여부로 에러 나누기) → [레슨](lessons/0029-kafka-dlq.html) | [배운 작업](work-log/2026-07-06-pr-1294-transaction-atomicity-and-msa-discussion.md)

### 분산 트랜잭션과 아키텍처 패턴

> 팀 시니어(juhoLee)와의 대화에서 나온 "2PC → Saga → Outbox" 순서, "MSA 이해하려면 DDD로 돌아가야 한다"는 관점을 정리했다.

- [x] 분산 트랜잭션 전략: 2PC → Saga → Outbox → [레슨](lessons/0032-distributed-transaction-2pc-saga-outbox.html) | [배운 작업](work-log/2026-07-06-pr-1294-transaction-atomicity-and-msa-discussion.md)
- [x] 언제 카프카를 쓰면 안 되는가 (기술 선택 기준) → [레슨](lessons/0033-when-not-to-use-kafka.html) | [배운 작업](work-log/2026-07-06-pr-1294-transaction-atomicity-and-msa-discussion.md)
- [x] MSA와 DDD의 관계 (아키텍처는 구조, 패턴은 전략) → [레슨](lessons/0034-msa-ddd-and-not-knowing-everything.html) | [배운 작업](work-log/2026-07-06-pr-1294-transaction-atomicity-and-msa-discussion.md)

### 더 알아볼 것

- [ ] 파티션(Partition)과 메시지 순서 보장
- [ ] Exactly-once vs At-least-once 처리 시맨틱스
- [ ] 오프셋 커밋 시점 (`mark_as_consumed` 타이밍)
- [ ] Saga의 Choreography vs Orchestration 구현 방식 차이
- [ ] Bounded Context가 실제 코드/레포 경계에서 어떻게 드러나는지

---

## 섹션 6. AWS 인프라 / CDK

> aws-infra-architecture 레포(performance-plus, CDK/TypeScript)의 ECS EC2→Fargate 마이그레이션 PR(#273 Phase 1, #274 Phase 2)을 리뷰하며 처음 마주친 개념들.

### ECS 기본 개념

- [x] ECS(Elastic Container Service)란? → [레슨](lessons/0040-ecs-ec2-vs-fargate.html) | [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md)
- [x] EC2 launch type vs Fargate launch type → [레슨](lessons/0040-ecs-ec2-vs-fargate.html) | [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md)
- [x] Task Definition(설계도) vs Service(실행·재시작·LB 연결 관리자) → [레슨](lessons/0040-ecs-ec2-vs-fargate.html) | [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md) · [배운 작업](work-log/2026-07-15-pr-274-ecs-ec2-removal-review.md)
- [x] Task Definition의 `compatibility`/`RequiresCompatibilities` → [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md)
- [x] Fargate CPU/메모리 quantization (256/512/1024... 단위 제약) → [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md)
- [x] `runtimePlatform`(CPU 아키텍처 명시)과 ARM64/Graviton 선택이 EC2→Fargate 전환과 독립적으로 유지된다는 것 → [레슨](lessons/0040-ecs-ec2-vs-fargate.html) | [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md) · [배운 작업](work-log/2026-07-15-pr-274-ecs-ec2-removal-review.md)
- [x] Placement Strategy는 Fargate 미지원(AWS가 서브넷 간 자동 분산) → [레슨](lessons/0040-ecs-ec2-vs-fargate.html) | [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md)
- [x] ECS Exec — SSM 세션 관리로 SSH 없이 컨테이너 접속 → [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md)
- [x] Deployment Circuit Breaker — 배포 실패 시 즉시 롤백 → [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md)
- [ ] AWS Application Auto Scaling — CPU/메모리 알람 기준 태스크 개수 조정 원리
- [ ] IAM Role의 `assumedBy` vs managed/inline policy, taskRole vs executionRole vs serverRole 차이

### CloudFormation / CDK

- [x] CloudFormation의 in-place Update vs Replacement → [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md)
- [x] CDK L1 escape hatch (`node.defaultChild`로 L2가 안 감싸는 속성에 직접 접근) → [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md)
- [x] CDK Nested Stack vs Construct (논리 ID 계층 차이) → [배운 작업](work-log/2026-07-15-pr-273-ecs-fargate-migration-review.md)
- [x] CDK Context — `tryGetContext`로 읽는 임의 커스텀 키 vs `cdk.json`의 `@aws-cdk/<모듈>:<플래그>` 예약된 feature flag → [레슨](lessons/0041-cdk-deployment-guard-and-codepipeline.html) | [배운 작업](work-log/2026-07-15-pr-274-ecs-ec2-removal-review.md)
- [x] 배포 가드 패턴 — opt-in context flag로 위험한 스택(production/demo)을 기본 assembly에서 제외 → [레슨](lessons/0041-cdk-deployment-guard-and-codepipeline.html) | [배운 작업](work-log/2026-07-15-pr-274-ecs-ec2-removal-review.md)
- [ ] `CfnParameter`(배포 시점 파라미터) vs CDK context(합성 시점 값)의 차이
- [ ] `cdk.context.json` 캐시가 정확히 뭘 저장하길래 AWS 자격증명 없이 오프라인 synth가 가능한지

### CI/CD (CodePipeline/CodeBuild)

- [x] CodePipeline `EcsDeployAction` + `imageDef.json` 아티팩트로 서비스별 배포 이미지 지정 → [레슨](lessons/0041-cdk-deployment-guard-and-codepipeline.html) | [배운 작업](work-log/2026-07-15-pr-274-ecs-ec2-removal-review.md)
- [x] `CodeStarConnectionsSourceAction`의 `triggerOnPush` — GitHub push 자동 트리거 여부 → [레슨](lessons/0041-cdk-deployment-guard-and-codepipeline.html) | [배운 작업](work-log/2026-07-15-pr-274-ecs-ec2-removal-review.md)
- [ ] CodeBuild buildspec.yml 문법과 `*ImageDef.json` 아티팩트 생성 방식

### 개발 도구

- [x] git worktree로 로컬 브랜치 안 건드리고 다른 브랜치 격리 테스트 → [배운 작업](work-log/2026-07-15-pr-274-ecs-ec2-removal-review.md)
