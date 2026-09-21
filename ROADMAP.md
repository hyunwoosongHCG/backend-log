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
- [x] API 요청/응답 구조 설계 — 벌크 처리 엔드포인트는 "전부 성공/전부 실패"(단일 트랜잭션)와 "부분 성공"(항목별 트랜잭션 + success_count/error_count/errors)이 서로 다른 응답 계약이라, 트랜잭션 경계를 바꾸는 순간 API 응답 형태도 같이 바뀐다는 걸 실제 트레이드오프 논의에서 체감했다. 이 레포엔 "동기 엔드포인트 + 항목별 격리 + 부분 성공 응답"을 완전히 만족하는 선례가 아직 없다는 것도 grep으로 확인 → [배운 작업](work-log/2026-08-25-key-result-auto-checkin-reflect-batch-approval-async-pattern-research.md) · **API 응답 계약이 비대칭이면 클라이언트의 `Promise.all`이 정보를 삼킨다** — 목표 승인은 200+바디(부분실패)로 바뀌는데 가중치 승인은 그대로 실패 시 reject라서, 프론트가 `Promise.all`로 두 호출을 묶으면 가중치가 reject하는 순간 이미 온 목표 응답의 바디를 읽을 기회 자체가 사라진다. `Promise.allSettled`로 바꿔서 두 결과를 독립적으로 봐야 한다는 걸 실제 훅 코드(`useSubmitBulkApprove.ts`)로 확인했다 → [배운 작업](work-log/2026-08-26-key-result-auto-checkin-reflect-batch-approval-response-contract-and-error-isolation.md)

### 아키텍처

- [ ] MVC 패턴 (Model, View, Controller)
- [x] 서비스 레이어(Service Layer)란? — 화이트리스트 상수 같은 걸 어느 레이어에 둘지는 "누가 그 개념의 진짜 주인인가"로 판단한다. 모델 컬럼(`category`)에 대한 predicate는 모델에 두고, 컨트롤러/validator가 끌어다 쓰는 API 파라미터 화이트리스트는 서비스 클래스가 아니라 별도 PORO 모듈로 분리해야 역참조가 안 생긴다 → [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)
- [x] 트랜잭션 경계 소유권 — 트랜잭션을 **호출부가 여는가 서비스가 여는가**는 별도로 결정해야 하는 설계 항목이다. 서비스를 블록으로 감싸는 건 문법적으로 무해해 보여도, 그 서비스가 내부에서 트랜잭션을 열면 **감싸는 순간 경계가 이동**해서 원래 커밋 뒤에 돌던 후처리(자동 마감 등)가 같은 트랜잭션에 딸려 들어가고, 후처리 실패가 본 작업까지 롤백시킨다 → [레슨](lessons/0052-transaction-boundary-ownership.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md)
- [x] 도메인(Domain)이란? 3레이어 Entity와의 차이 → [레슨](lessons/0006-domain-vs-entity.html) | [배운 작업](work-log/2026-06-25-add-use-required-template.md)
- [x] **선언되지 않은 불변식은 조회 조건에 숨어 있다** ([레슨 61](lessons/0061-invariant-that-lives-only-in-queries.html)) — "응답 행의 status는 평가자의 status와 같다"가 모델·스키마·주석 어디에도 없고 `where(status: appraiser.status)` 라는 조회 조건 9곳에만 존재했다. 상태 컬럼만 바꾸자 남은 응답이 모든 조회에서 걸러져 화면에서 사라졌고, 화면에 없으니 제출 payload에도 빠져 `discard_all` 이 조용히 지웠다. **같은 조건이 여러 조회에 반복되면 중복이 아니라 계약이다** — 그 컬럼을 쓰기 전에 읽는 쪽의 가정을 `git grep` 으로 세어봐야 한다. 기존 `UpdateAppraiserStatusService#dup_and_update_status_res` 가 상태 전이 시 응답을 새 상태로 복제하던 것이 바로 그 계약을 지키는 장치였다 → [배운 작업](work-log/2026-09-11-ppback-pr-5606-job-template-response-reset.md)
- [x] **fail-open vs fail-closed — 틀릴 때 어느 방향으로 틀리는가** — 잠금 판정에 필요한 옵션을 누락하면 뒤 순번 목록이 빈 배열이 되어 "잠기지 않음"으로 판정됐다. 방어 기능이 열리는 쪽으로 틀리는 설계다. 호출처가 하나뿐이라 당장은 안전해도, 누락 시 기본값이 어느 방향인지는 명시적으로 정해야 한다(`ArgumentError` 로 전환) → [배운 작업](work-log/2026-09-11-ppback-pr-5606-job-template-response-reset.md)
- [x] **같은 판정이 프론트와 백엔드에 따로 살면 값이 갈린다** — 문항 설정 잠금의 `RESPONDED_STATUSES` 가 양쪽에 각각 있었고 백엔드는 `completed` 만, 프론트는 `tempsaved` 까지 봤다. 화면에서 막은 요청이 서버에서 통과하는 상태였다. 판정을 서버 한 벌로 모으고 결과만 내려주면 노출도 줄어든다(남의 상태 전체 대신 잠금 여부와 사유만) → [배운 작업](work-log/2026-09-11-ppback-pr-5606-job-template-response-reset.md)
- [x] **미들웨어(Middleware)란? — 체인은 먼저 추가한 것이 바깥쪽이다** — Sidekiq 서버 미들웨어 체인은 Rack 미들웨어·서블릿 필터 체인과 같은 모양이다: `chain.add`로 먼저 넣은 미들웨어일수록 pre-yield 코드가 먼저, post-yield 코드가 나중에 실행되는 **바깥쪽**이다. `insert_before(oldklass, newklass)`로 특정 미들웨어 앞에 넣으면 그 미들웨어의 post-yield 코드보다 **뒤에** 내 코드가 돌게 만들 수 있다. 같은 버그 패턴이 여러 파일에 반복될 때 파일마다 patch하는 대신 이 레이어에서 한 번에 계약(성공한 작업은 진행률도 100%)을 강제하면, 과거·미래의 모든 워커가 함께 방어된다 — 자바 Spring의 AOP/인터셉터로 옮겨도 같은 결정 축이다 → [배운 작업](work-log/2026-09-17-ppback-pr-5612-bulk-worker-progress-middleware-fix.md)
- [ ] 모놀리식 vs 마이크로서비스
- [x] **작업 단위와 경쟁 단위** ([레슨 57](lessons/0057-work-unit-vs-contention-unit.html)) — 작업을 쪼개는 축(원인)과 경합이 일어나는 축(대상)이 다르면 그 둘을 맞추는 조율 코드(잠금 목록 사전 계산·정렬 잠금·전제 가드·재시도·후보 부분집합 판정)가 생긴다. 조율 코드가 계속 늘어나면 정교화를 멈추고 **작업 단위를 경쟁 단위에 맞추는 것**을 검토해야 한다 — 잠글 대상이 잡 인자로 오면 알아낼 것이 없고, 알아낼 것이 없으면 낡을 수도 없다 → [배운 작업](work-log/2026-08-19-key-result-auto-reflect-decision-timeline.md)

### 데이터베이스 기초

- [ ] 관계형 데이터베이스(RDB)란?
- [ ] 테이블, 컬럼, 로우
- [x] 기본키(PK)와 외래키(FK) → [레슨](lessons/0005-sql-joins.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [x] 공개 식별자(Public ID)와 내부 PK 분리 패턴 → [정리](concepts/public-id-vs-primary-key.md) | [배운 작업](work-log/2026-07-07-delete-workspace-self-find.md)
- [ ] 1:1, 1:N, N:M 관계
- [x] 인덱스(Index)란? 왜 필요한가 → [레슨](lessons/0043-index-and-leftmost-prefix.html) · **인덱스가 있다 ≠ 쓰인다.** EXPLAIN으로 확인해야 한다 — MySQL이 `ORDER BY id`의 filesort를 피하려고 더 선택적인 복합 인덱스 대신 단독 인덱스를 풀스캔하는 선택을 했다(2,000행 중 2,331행 읽음 vs 200행). 행이 없으면 통계가 없어 EXPLAIN 자체가 무의미하니 데이터를 채우고 `ANALYZE` 후에 봐야 한다 → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md)
- [x] 조건부(Partial) 유니크 인덱스 — Postgres의 `WHERE` 조건부 인덱스와, MySQL이 생성 컬럼 + NULL 중복 허용으로 이를 흉내내는 법 → [레슨](lessons/0050-mysql-conditional-unique-index-via-generated-column.html) | [배운 작업](work-log/2026-07-27-ppback-pr-5506-review.md)
- [x] 트랜잭션(Transaction)과 ACID → [레슨](lessons/0024-transaction-atomicity-bulk-approval-bug.html) | [배운 작업](work-log/2026-07-03-sentry-batch-approval-atomicity-bug.md) · [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md) · [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)
- [x] 행 잠금(Row Locking)과 동시성 제어 (`with_lock`, `SELECT ... FOR UPDATE`) → [레슨](lessons/0042-row-locking-and-deadlock.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md) · 전역 정렬 순서(id 오름차순)로 잡으면 데드락을 피할 수 있지만, **반대로 조상 행 전체를 미리 선점하는 설계는 그 자체가 새 데드락 축을 만든다** — 같은 행을 락 없이 쓰는 다른 경로가 있으면 순서가 역전되므로, 그 경로까지 같은 규칙으로 잠그게 하거나 아예 한 번에 한 행만 잡아 hold-and-wait를 없애야 한다 · **FK 검사도 잠금을 잡는다** — INSERT의 참조 무결성 검사가 부모 행에 공유 잠금을 걸어, 그 부모를 배타 잠금한 트랜잭션과 대기한다. "내가 명시적으로 잠근 행"만 세면 이 대기를 놓친다. 파생 가능한 컬럼(다른 FK로 도달 가능한 부모)의 FK를 지우는 것으로 완화할 수 있다 → [배운 작업](work-log/2026-08-19-key-result-auto-reflect-decision-timeline.md) · **락 보유 시간과 요청 스레드 점유 시간은 별개 축이다** — 벌크 처리에서 "락을 오래 든다"는 문제는 N개를 하나의 트랜잭션으로 묶어 커밋을 미루기 때문이고, 항목별 트랜잭션으로 쪼개면 동기/비동기 여부와 무관하게 해결된다. 반면 "요청 하나가 처리 시간 내내 웹 서버 스레드를 점유한다"는 문제는 완전히 별개이고, 이건 동기냐 비동기(job+폴링)냐의 문제다. 이미 실전 코드(`Objective::UpdateObjectiveBulkWorker`의 `process_with_error_handling`)가 항목별 트랜잭션+에러격리를 증명하고 있었다 → [배운 작업](work-log/2026-08-25-key-result-auto-checkin-reflect-batch-approval-async-pattern-research.md) · **방어 로직은 호출부가 아니라 여러 경로가 모이는 낮은 지점에 둔다** — 같은 서비스를 여섯 곳이 부르는데 동시성 재확인(`closed?`)은 한 곳에만, 그마저 락 없이 있어 서로 다른 경로가 같은 목표를 동시에 처리하면 중복 이력이 생겼다. 호출부마다 가드를 반복하는 대신 서비스 자체를 `with_lock`으로 감싸 처리 직전 재확인하니 호출부 코드를 하나도 안 건드리고 전부 방어됐다 · **잠금 읽기는 REPEATABLE READ 스냅샷을 무시하고 최신 커밋을 보며, 같은 트랜잭션의 락 재요청은 즉시 통과한다** — 호출부가 이미 자신의 `with_lock` 안에서 서비스를 부르는 경우도 중첩된 `with_lock`이 데드락 없이 안전했다 → [배운 작업](work-log/2026-08-28-key-result-auto-checkin-reflect-auto-close-lock-and-migration-reissue.md)
- [ ] 낙관적 락(Optimistic Locking, `lock_version`) vs 비관적 락 — 충돌 빈도·재시도 비용 기준의 트레이드오프
- [x] 트랜잭션 격리 수준(Isolation Level)이란 (Dirty/Non-Repeatable/Phantom Read, Lost Update, MySQL 기본값) → [레슨](lessons/0044-transaction-isolation-level.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md) · MySQL REPEATABLE READ의 스냅샷 고정 **시점** 규칙: 잠금 읽기(`FOR UPDATE`)는 read view를 열지 않고 **첫 비잠금 SELECT가 연다.** 그래서 "락을 트랜잭션이 열리기 전(또는 첫 문장)에 잡아야 한다"는 제약이 생긴다 · **"동작한다"와 "보장된다"는 다르다** — 위 규칙 덕에 기본 격리수준으로도 실제로 통과하지만(실측), 그 보장은 코드로 강제되지 않는 암묵 전제(잠금 SELECT 앞에 조회가 없어야 함)라 한 줄만 끼어들면 조용히 깨지고 **테스트는 통과한다.** `isolation: :read_committed`를 명시하면 전제에 의존하지 않고, 중첩 트랜잭션에서 호출되면 `TransactionIsolationError`로 시끄럽게 터진다 → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md) · **격리수준의 정답은 설계 단위에 종속된다** ([레슨 57](lessons/0057-work-unit-vs-contention-unit.html)) — 같은 두 후보(잠금 우선 RR vs 명시적 RC)에 대해, 잠금 목록 사전 조회가 *구조적으로 필요한* 설계(원인 단위)에서는 RC가 옳고, 잠글 대상이 잡 인자로 와서 사전 조회가 *존재하지 않는* 설계(대상 단위)에서는 잠금 우선 RR이 옳다. 판단 근거는 "어느 쪽이 안전한가"가 아니라 **"이 구조에서 잠금이 첫 문장임을 코드가 보장하는가"** · **RC에는 이력 유실 축이 있다** — 조회마다 스냅샷이 새로 잡히면 원인 목록을 읽은 뒤 커밋된 값이 계산에는 들어가고 목록에는 없어, 그 원인의 감사 이력이 영구히 누락된다(값은 맞다). 격리수준을 값 정확성만으로 평가하면 놓친다 → [배운 작업](work-log/2026-08-19-key-result-auto-reflect-decision-timeline.md)
- [x] 중첩 트랜잭션(Nested Transaction)과 `requires_new`(SAVEPOINT) — 기본 중첩은 진짜 커밋 경계가 아니라 바깥 트랜잭션에 합류할 뿐이고, `requires_new: true`는 부분 실패 격리는 되지만 락 조기 해제는 안 됨 → [레슨](lessons/0045-nested-transaction-and-requires-new.html) | [배운 작업](work-log/2026-07-24-key-result-auto-checkin-reflect-auto-close-and-review-fixes.md)
- [ ] SQL 기본 (SELECT, INSERT, UPDATE, DELETE)
- [x] JOIN이란? → [레슨](lessons/0005-sql-joins.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [x] **`ORDER BY` 의 컬럼 이름은 SELECT 목록에서 먼저 해석된다** — 조인한 테이블들에 같은 컬럼명(`id`, `appraisal_id`)이 있어 모호한 `ORDER BY` 가 전체 컬럼(`table.*`)을 SELECT 할 때는 통과하지만, `pluck(:id)` 처럼 select list를 좁히는 순간 `Column 'appraisal_id' in order clause is ambiguous` 로 죽는다. 지금 동작한다고 안전한 게 아니라 나중에 `.select` 가 붙으면 깨지는 잠복 결함이므로, 정렬 상수의 컬럼은 테이블명으로 수식해 둔다 → [배운 작업](work-log/2026-09-03-ppback-pr-5585-appraisal-result-search-review.md)
- [x] 성능 측정에는 여러 축이 있다 ([레슨 55](lessons/0055-regression-spec-discriminating-power.html)) — 한 축(배치 크기)을 재고 다 쟀다고 착각했고, 지적받은 축(워크스페이스 전체 대기 건수)에서는 이벤트당 쿼리가 O(N)이라 총비용이 제곱이었다. "무엇을 재지 않았는지"를 스스로 물어야 한다. 이벤트당 쿼리 수를 세면 O(N)인지 O(N²)인지 바로 갈린다 → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md)
- [x] 쿼리 프로파일링/N+1 실측 (`ActiveSupport::Notifications.subscribed(..., "sql.active_record")`) — N+1을 추측이 아니라 직접 재현해서 쿼리 개수를 세는 법. 같은 방법으로 "이미 로드된 Relation을 `Enumerable#select`(블록)로 필터링하면 쿼리가 안 나가지만, `scope`(`.where`)를 걸면 로드 여부와 무관하게 새 쿼리가 나간다"는 것도 실측으로 증명했다 → [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)
- [x] 크로스 서비스 auto-increment 시퀀스 정합성 — 서로 다른 DB(서비스)에 같은 id로 레코드를 복제 삽입한 뒤 시퀀스(`setval`)를 강제로 맞출 때, 상대 DB의 현재 max_id를 확인하지 않고 계산하면 시퀀스가 기존 데이터보다 뒤로 밀려 다음 정상 삽입이 PK 충돌을 일으킬 수 있다 → [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)

### 인증과 인가

- [ ] 인증(Authentication) vs 인가(Authorization)
- [ ] 토큰 기반 인증 흐름
- [ ] JWT란?
- [ ] OAuth 개념

### 기타 기초

- [ ] 환경변수(Environment Variable)란?
- [x] 백그라운드 잡(Background Job)이란? — Sidekiq이 대표적 구현체다. `Sidekiq::Status`(gem)로 진행률(`at`/`total`/`pct_complete`)을 추적할 수 있는데, 성공 시 gem이 저장하는 건 `status`/`ended_at`뿐이라 워커가 마지막에 `at`을 안 부르면 job은 성공인데 진행률만 영원히 100%에 못 미친다. 서버 미들웨어(`Sidekiq.configure_server`)는 `Sidekiq.server?`가 true인 실제 sidekiq 프로세스에서만 즉시 실행되므로 Rails web/test 프로세스에서는 안 돈다 — `Sidekiq::Testing.inline!`조차 별도의 빈 미들웨어 체인을 써서, RSpec으로는 서버 미들웨어 경로를 재현할 수 없다 → [배운 작업](work-log/2026-09-17-ppback-pr-5612-bulk-worker-progress-middleware-fix.md)
- [ ] 캐시(Cache)란?
- [ ] 로깅(Logging)이란?

---

## 섹션 2. Ruby 기초

### 자료형과 변수

- [ ] 자료형 (String, Integer, Float, Boolean, nil)
- [x] `nil`(값을 안 보냄)과 `false`(false라는 값)의 구분 — Grape optional 파라미터는 미전송 시 `params`에 키 자체가 없어 `nil`이 되는데, NOT NULL boolean 컬럼은 `as_json` 시 항상 `true`/`false`라 diff 비교에서 "변경 없음"이 "false로 바꿔달라"로 둔갑한다 → [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-branch-review.md)
- [x] `BigDecimal`의 정밀도와 `#round` — 인자 없는 `#round`는 정수로 반올림하므로 `decimal(26,6)` 같은 컬럼에 쓰면 소수점이 통째로 사라진다 → [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-branch-review.md)
- [x] Symbol vs String → [레슨](lessons/0021-symbol-vs-string.html) | [정리](concepts/symbol-vs-string.md) | [배운 작업](work-log/2026-07-02-symbol-vs-string.md)
- [ ] 배열(Array)
- [ ] 해시(Hash)
- [x] 변수 종류 (지역, 인스턴스, 클래스, 전역) → [레슨](lessons/0035-ruby-instance-variable-and-annotation-confusion.html) | [정리](concepts/ruby-instance-variables.md) | [배운 작업](work-log/2026-07-08-badge-stats-instance-variable-question.md)

### 메서드와 제어문

- [ ] 메서드 정의와 호출
- [ ] 조건문 (if, unless, case)
- [ ] 반복문 (while, loop)
- [ ] 이터레이터 (each, map, select, reduce)
- [x] 예외 처리 (begin / rescue / ensure) — **`case`/`when`에 `else`가 없으면 "예상 밖 상태"는 예외가 아니라 조용한 no-op이 된다.** 벌크 승인 로직(`case obj.stage; when 'pending_create' ...; end`)이 다른 사람이 먼저 처리해 `stage`가 이미 매칭 안 되는 값이 되어 있어도 그냥 아무 것도 안 하고 지나간다 — 예외가 안 나니 `rescue StandardError`가 못 잡고, 그 항목은 실패가 아니라 성공으로 집계된다. "에러를 잡는 것"과 "예상과 다른 모든 경로를 잡는 것"은 다르다 → [배운 작업](work-log/2026-08-26-key-result-auto-checkin-reflect-batch-approval-response-contract-and-error-isolation.md)

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
- [x] 마이그레이션(Migration)이란? → [정리](concepts/migration.md) | [배운 작업](work-log/2026-06-25-add-use-required-template.md) · **롤백은 "된다고 적는 것"이 아니라 돌려보는 것.** `change`의 자동 역방향이 항상 되는 게 아니다 — `add_foreign_key(column:)`은 역방향에서 제약을 못 찾아 실패한다. 게다가 실패한 롤백이 FK를 지워서 `db/schema.rb`와 실제 DB가 어긋난 채 남았다(`SHOW CREATE TABLE`로만 발각). 확실히 하려면 `up`/`down`을 직접 쓴다 → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md) · **`db:migrate`는 DB 전체를 다시 덤프한다** — 다른 브랜치의 마이그레이션이 로컬 DB에 남아 있으면 그 산출물까지 `schema.rb`에 섞여 들어온다(`db:migrate:status`의 `NO FILE`로 확인). 커밋 전에 `git diff db/schema.rb` 필수 · **테이블과 `schema_migrations`가 어긋날 수 있다** — 테이블은 있는데 기록이 없으면 `db:migrate`가 `already exists`로 죽는다. schema.rb·`schema_migrations`·실제 DB 셋을 각각 확인해야 한다 · **schema.rb 병합 충돌의 정답은 최대 타임스탬프** — version은 적용된 마이그레이션의 최댓값이므로 늦은 쪽을 남기면 `db:migrate`가 만들 값과 같아진다 → [배운 작업](work-log/2026-08-19-key-result-auto-reflect-decision-timeline.md) · **빈 DB의 `db:migrate`는 사실상 `db:schema:load`부터 돈다** — 이 과정이 중간에 죽으면(일시적 오류) 재시도가 "성공"처럼 보여도 일부 테이블의 FK가 안 걸린 채로 굳고, 그 깨진 상태가 그대로 `schema.rb`에 재덤프되어 무관한 diff(FK 삭제)를 만든다. `exit 0`은 "스키마와 DB가 일치한다"를 보장하지 않으므로, 의심되면 `db:drop db:create db:schema:load`로 새로 만들고 `connection.foreign_keys(table)`로 라이브 DB를 직접 확인해야 한다 → [배운 작업](work-log/2026-08-27-key-result-tag-require.md) · **이미 적용된 마이그레이션의 타임스탬프가 뒤늦게 병합된 다른 마이그레이션보다 앞서면, 컬럼을 다시 만들지 않고 `schema_migrations`의 버전 값만 relabel한다** — Rails 생성기로 실제 지금 시각의 새 파일을 만들어 `change` 내용만 옮기고, `UPDATE schema_migrations SET version = 새값 WHERE version = 옛값`으로 버전 식별자만 바꿨다. `db:migrate:status`가 `up`을 그대로 보고하고 `db/schema.rb` 재덤프 시 버전 줄 하나만 바뀌는지로 안전하게 됐는지 확인했다 → [배운 작업](work-log/2026-08-28-key-result-auto-checkin-reflect-auto-close-lock-and-migration-reissue.md) · **마이그레이션이 모델 메서드에 의존하면 시간이 지나 과거 마이그레이션이 깨진다** — 백필이 `setting.selected_view_appraisee_data`(`has_flags` 생성 메서드)를 부르고 있으면, 나중에 그 선언을 지우는 PR 이 과거 마이그레이션까지 같이 죽인다. `setting.attributes['컬럼명']` 으로 raw 값을 읽고 디코딩 규칙(비트값 표, YAML `permitted_classes` 등)을 마이그레이션 안에 상수로 **복제**해 자립시키는 게 정석. 부수적으로 `Hash#[]` 는 없는 키에 `nil` 을 주므로 컬럼이 이미 드롭된 DB 에서도 안전하게 빈 값으로 떨어진다 · **이미 실행된 마이그레이션을 나중에 수정하면 그 환경에서는 영구히 no-op 이다** — `schema_migrations` 에 버전이 있으면 다시 돌지 않으므로, 그런 수정은 데이터 보정이 아니라 **아직 실행 안 한 환경(신규 DB·미배포 환경)만을 위한 방어**다. "마이그레이션 파일을 고쳤다"와 "데이터가 고쳐진다"는 다르다 → [배운 작업](work-log/2026-09-01-ppback-pr-5579-legacy-column-removal-review.md)
- [x] **컬럼 제거는 롤링 배포에서 창(window)을 만든다 — `self.ignored_columns` 2단계 배포** — Rails 는 컬럼 정보를 프로세스가 모델을 처음 쓸 때 캐시하고 DDL 변경으로 자동 무효화하지 않는다. `load_defaults 7.0` 이상은 `partial_inserts = false` 라 INSERT 에 **항상 전체 컬럼**이 실리므로, 드롭 후 살아 있는 구 프로세스는 없어진 컬럼을 INSERT 에 실어 `Unknown column` 500 을 낸다. 읽기 쪽도 `SELECT table.*` 결과에 컬럼이 없어 `ActiveModel::MissingAttributeError` 가 난다. **코드 먼저 / 마이그레이션 먼저 어느 순서로도 창이 안 없어지므로**, 정석은 `self.ignored_columns += %w[...]` 를 **먼저 배포**해 attribute set 에서 빼두고 **다음 배포에서 드롭**하는 2단계다. 창의 위험도는 그 테이블의 쓰기 빈도에 비례한다(그룹 생성마다 INSERT 되는 설정 테이블 vs 거의 안 쓰는 테이블) → [배운 작업](work-log/2026-09-01-ppback-pr-5579-legacy-column-removal-review.md)
- [x] 연관관계 (`belongs_to`, `has_many`, `has_one`, `has_many :through`) → [레슨](lessons/0008-active-record-associations.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [x] `has_one` 연관에서 FK는 상대 테이블에 있다 — `section.score?`가 부르는 `score_setting`은 `appraisal_sections`의 컬럼이 아니라 `has_one`으로 연결된 별도 테이블(`appraisal_section_score_settings`)이라, `.includes(:appraisal_sections)`만으로는 preload가 안 되고 섹션 수만큼 N+1이 생긴다. `includes(appraisal_sections: [:score_setting, :rating_setting])`처럼 중첩 preload로 해결 → [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)
- [x] 연관관계 스코프의 비대칭 — `has_many`의 람다 스코프는 **조인 대상 테이블의 컬럼만** 검사하고 그 레코드가 속한 부모의 상태는 보지 않는다. 소프트 삭제가 부모 쪽에서만 일어나는 설계(`stage: :archived`만 바꾸고 자식의 `active`는 그대로)에서는, 자식 연관관계가 삭제된 부모의 자식을 계속 들고 온다. 이름이 대칭인 두 연관관계라도 정책이 같다고 믿으면 안 됨 → [레슨](lessons/0051-association-scope-asymmetry.html) | [정리](concepts/association-scope-asymmetry.md) | [배운 작업](work-log/2026-08-06-key-result-auto-reflect-1n-split.md)
- [x] 폴리모픽 연관관계 (`belongs_to ..., polymorphic: true`) → [레슨](lessons/0036-polymorphic-association.html) | [배운 작업](work-log/2026-07-09-review-remind-notification-split.md) · 반대쪽 `has_many`에 `as:`를 빼먹으면 존재하지 않는 `<모델>_id` 컬럼을 찾는다. 조회 경로가 없으면 배포 후에도 안 터지고, `destroy` 같은 드문 경로에서만 드러난다 → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md)
- [x] **association 문법을 흉내 내는 일반 메서드는 진짜 association이 아니다** — `ObjectiveWeight#user_cycle`은 `belongs_to :user_cycle`처럼 보이지만 실제로는 `UserCycle.find_by(user_id:, cycle_id:)`를 매번 호출하는 메서드였다. 진짜 복합키 association 선언(`belongs_to :user_cycle, foreign_key: %i[user_id cycle_id], primary_key: %i[user_id cycle_id]`)은 양쪽 모델에 주석 처리된 채 남아 있었다. `includes`로 preload가 안 되니 N+1이 구조적으로 못 없어지고, 이것 때문에 서로 다른 단위(`objective_id` 단위 vs `user_id`+`cycle_id` 단위)로 묶인 두 벌크 처리를 하나의 파이프라인으로 합치기가 실질적으로 어렵다는 걸 스키마로 확인했다 → [배운 작업](work-log/2026-08-26-key-result-auto-checkin-reflect-batch-approval-response-contract-and-error-isolation.md)
- [x] 유효성 검사 (`validates`) → [배운 작업](work-log/2026-07-27-ppback-pr-5506-review.md)
- [x] 스코프(Scope)란? → [레슨](lessons/0049-where-not-nor-vs-and.html) | [배운 작업](work-log/2026-07-27-ppback-pr-5506-review.md)
- [x] 콜백 (`before_save`, `after_create` 등) → [레슨](lessons/0019-timestamps-and-hidden-callbacks.html) | [정리](concepts/timestamps-and-callbacks.md) | [배운 작업](work-log/2026-07-01-objective-updated-at-and-key-result-history.md) · **콜백이 만드는 암묵적 데이터가 스펙 픽스처를 오염시킨다** — `AppraisalSection#after_create :create_appraisal_joins` 가 그룹의 모든 프로세스에 join 을 자동 생성하는데, 그걸 모르고 스펙에서 join 을 또 만들어 `section_ids: [1, 1]` 중복이 났다. 팩토리로 레코드를 만들 때 콜백이 무엇을 더 만드는지 확인하지 않으면 내가 만든 픽스처가 내가 의도한 모양이 아니다 → [배운 작업](work-log/2026-09-11-ppback-pr-5606-job-template-response-reset.md)
- [x] **`update_all` 과 `update!` 을 같은 서비스에서 섞으면 리팩터링 폭탄이 된다** — 한쪽은 콜백·검증을 건너뛰고 다른 쪽은 탄다. 지금 무해해도 콜백이 추가되면 한쪽만 탄다. 통일할 때는 방향이 중요한데, `update_all` → `update!` 전환은 **기존에 저장 가능했던 행이 이제 검증에 걸릴 수 있다**는 리스크를 동반하므로 전환 전에 대상 전체를 `valid?` 로 dry-run 해보는 게 안전하다(이번엔 262행 검사, 실패 0) → [배운 작업](work-log/2026-09-11-ppback-pr-5606-job-template-response-reset.md)
- [x] **live 참조 vs 스냅샷 — 무엇을 평가 시점에 고정할 것인가** — 대상자의 직무가 `has_many :job_category_users, through: :user` 로 유저를 타고 가서 평가에 고정돼 있지 않다. 덕분에 재생성만 하면 직무 변경이 자동 반영되지만, 반대로 "평가 시작 시점에 이 직무였던 대상자"를 조회할 수 없어 이미 직무가 바뀐 사람(= 갱신이 가장 필요한 사람)이 대상에서 누락된다. 같은 도메인에서 조직도는 `TeamSnapshot` 으로 스냅샷을 갖는 비대칭 → [배운 작업](work-log/2026-09-11-ppback-pr-5606-job-template-response-reset.md)
- [x] `after_commit`과 `after_save`/`after_create`의 차이 (트랜잭션 커밋 시점) → [레슨](lessons/0038-after-commit-vs-after-create.html) | [배운 작업](work-log/2026-07-09-review-remind-notification-split.md) · **중첩 트랜잭션에서는 최외곽 커밋까지 미뤄져 실행된다** — 그래서 진입점 여러 곳이 이미 바깥 트랜잭션 안이어도 재구성 없이 모델 콜백 한 줄로 "커밋 후 발행"을 걸 수 있다. 대신 콜백 안에서는 예외를 삼켜야 한다(이미 커밋된 트랜잭션은 되돌릴 수 없으므로) → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md)
- [x] `dependent: :destroy`는 **선언 순서대로** 실행된다 — 두 부모를 FK로 참조하는 자식 테이블이 있으면, 참조당하는 쪽보다 먼저 선언해야 삭제 시 외래키 위반이 나지 않는다 → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md)
- [x] Dirty Tracking이란? (`changed?`, `attribute_changed?`, partial writes) → [레슨](lessons/0020-dirty-tracking-and-partial-writes.html) | [정리](concepts/dirty-tracking.md) | [배운 작업](work-log/2026-07-01-objective-updated-at-and-key-result-history.md)
- [x] 쿼리 메서드 (`where`, `find`, `find_by`, `includes`, `joins`) → [배운 작업](work-log/2026-07-07-delete-workspace-self-find.md)
- [x] **`Relation#merge` 는 같은 컬럼의 술어를 `AND` 하지 않고 덮어쓴다** — `.where(a).where(b)` 체이닝은 누적(AND)이지만 `base.merge(other)` 는 양쪽에 같은 컬럼의 술어가 있으면 **인자로 들어온 쪽이 이긴다**(`WhereClause#merge` 의 `predicates_unreferenced_by`). 안전 범위(테넌트·상태·soft delete)를 담은 relation에 사용자 입력 조건을 붙일 때 `merge` 를 쓰면 `appraisal_id IN (마감 평가 서브쿼리)` 가 `appraisal_id = <클라이언트 값>` 으로 조용히 교체된다. 겹치지 않는 컬럼(`workspace_id`)은 살아남기 때문에 **일부 방어만 사라져 사고 범위가 좁아 보인다** → [레슨](lessons/0060-relation-merge-overwrites-predicates.html) | [배운 작업](work-log/2026-09-03-ppback-pr-5585-appraisal-result-search-review.md)
- [x] **서브쿼리는 자기만의 `WHERE` 를 갖는 독립 스코프다 — 바깥 필터가 적용되지 않는다** — 같은 조건 술어를 (가) 바깥 `WHERE` 에 `AND` 로 얹는 자리와 (나) `IN (SELECT ...)` 안에서 따로 실행하는 자리에 함께 쓰면, 거기서 안전 범위를 걷어내는 리팩터링이 (가)에서는 순수한 중복 제거이고 (나)에서는 방어 제거가 된다. **판단 기준은 "이 술어가 어디서 실행되는가" 하나.** 부수적으로 **성능 수치가 개선의 증거가 아니라 결함의 증상일 수 있다** — 서브쿼리 6회→2회가 필터 유실의 결과였고, 정확한 수정은 4회였다 → [레슨](lessons/0060-relation-merge-overwrites-predicates.html) | [배운 작업](work-log/2026-09-03-ppback-pr-5585-appraisal-result-search-review.md)
- [x] N+1 문제란? `includes`로 해결하기 → [레슨](lessons/0009-n-plus-1.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [x] `preload` vs `includes`, 그리고 공유 엔티티에 필드를 추가하면 그 엔티티를 렌더하는 **모든** 컨트롤러의 preload를 갱신해야 한다 — 쿼리는 그대로인데 노출 필드 하나 때문에 N+1이 생긴다 → [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-branch-review.md)
- [x] 연관 캐시(association cache) — 스코프가 걸린 `has_one`(`-> { where(status: :pending) }`)은 상태가 바뀐 뒤 재조회하면 `nil`이 되므로, 이미 로드된 캐시에만 의존하는 코드는 `reload` 한 줄에 깨진다 → [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-branch-review.md)
- [x] Relation의 `Enumerable#select`(블록)는 이미 로드된 배열을 재사용하지만 `scope`(`.where`)는 로드 여부와 무관하게 새 Relation(= 새 쿼리)을 만든다 — 그래서 이미 `.includes`로 로드해둔 컬렉션을 다시 필터링할 땐 `scope`가 아니라 인스턴스 predicate를 써야 방금 고친 N+1이 다른 자리에 또 생기지 않는다 → [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)
- [x] Read Replica 라우팅 (멀티 DB, `connects_to`/`connected_to`) → [정리](concepts/read-replica-routing.md) | [배운 작업](work-log/2026-07-03-controller-routing-and-read-replica.md)
- [x] `accepts_nested_attributes_for` — 부모 생성/수정 시 자식 레코드 배열을 한 번에 생성/수정/삭제 → [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md) · **NOT NULL 컬럼의 DB `default`는 UPDATE에서 안 지켜진다** — `default(100.0), not null`인 컬럼이라도, 갱신 코드가 요청에 없는 필드를 `item[:weight]`처럼 그대로 대입하면 `nil`이 되어 UPDATE에 실리고 기존 값을 지워버린다. `default`는 신규 INSERT에서 컬럼을 아예 안 건드렸을 때만 적용되지, 명시적 `nil` 대입까지 막아주지 않는다. 같은 코드베이스의 생성 분기는 `|| BigDecimal('100.0')`로 이미 방어하고 있었는데 수정 분기만 빠져 있던 비대칭이었다 → [레슨](lessons/0058-column-default-does-not-protect-updates.html) | [배운 작업](work-log/2026-08-27-key-result-tag-require.md)
- [x] **`enum`이 만드는 술어 이름과 `delegate`가 넘기는 것** — `enum :objective_weight_required_setting, { 'checkin' => 0, 'self' => 1 }`이 만드는 술어는 `checkin?`/`self?`이지 `objective_weight_required_setting_self?`가 **아니다**(접두어는 `prefix: true`를 줘야 붙는다). 그리고 `delegate :objective_weight_required_setting`은 **적어 준 메서드 하나만** 넘기고 enum이 부수적으로 만든 술어는 따라오지 않는다. 둘이 겹쳐서, 어느 모델에도 없는 이름을 부르는 코드가 10개월간 살아 있었다 → [배운 작업](work-log/2026-09-17-ppback-pr-5611-v1-removal-review-followups.md)
- [x] 자기참조 관계(Self-referential Association)와 순환 참조 방지 (closure_tree gem, `cycle_is_not_permitted`) → [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md) · DB 레벨 방지와 별개로, 런타임에 그래프를 재귀 순회할 땐 방문한 노드 id를 `Set`에 쌓아 막아야 한다 → [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-branch-review.md)

### Controller

- [ ] 컨트롤러(Controller)란?
- [x] 액션(Action)과 HTTP 메서드 매핑 → [레슨](lessons/0023-rails-resources-routing-cases.html) | [배운 작업](work-log/2026-07-03-rails-resources-routing-lesson.md)
- [ ] `before_action`이란?
- [x] 요청/잡 단위 전역 상태 (`ActiveSupport::CurrentAttributes`) — 스레드·파이버 단위 상태를 Rails executor가 요청·잡 경계마다 자동 리셋해준다. 전역 변수처럼 쓰되 요청 간 누수가 없어, "이 호출 스택 안에서 이미 처리한 것"을 기록해 정상 재진입과 진짜 위반을 구분하는 용도로 쓸 수 있다. 다만 인자에 안 드러나는 암묵적 의존이라 도메인 결정보다 진단·가드용이 안전 → [레슨](lessons/0053-current-attributes.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md)
- [ ] Strong Parameters (`params.require.permit`)
- [ ] `render` vs `redirect_to`

### 직렬화와 응답

- [ ] 시리얼라이저(Serializer)란?
- [ ] `render json:` 응답 만들기
- [x] JSON 컬럼을 여러 파일이 독립적으로 파싱할 때 shape 계약이 갈라지는 문제 — 같은 JSON 컬럼을 한 파일은 String 키로, 다른 파일은 `deep_symbolize_keys`로 Symbol 키로 각자 읽으면, 원본 필드 이름이 바뀌어도 `[]`/`dig`가 예외 없이 `nil`을 반환해서 조용히 값만 틀려진다. PORO(값 객체)로 파싱 지점을 하나로 모으는 게 정석 → [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)

### 테스트

- [ ] RSpec 기초 (`describe`, `it`, `expect`)
- [ ] `let`과 `let!`의 차이
- [x] `let_it_be`(test-prof)와 `let`/`let!`의 차이 — 같은 example group 안에서 객체를 재사용하므로, 저장 없는 인메모리 속성 변경 시 다른 예제로 오염될 수 있음 → [레슨](lessons/0048-let-it-be-shared-object-pollution.html) | [배운 작업](work-log/2026-07-24-key-result-auto-checkin-reflect-api-exposure-review.md) · **"저장 없는 변경만 조심하면 된다"는 판단 기준은 불완전하다** ([레슨 59](lessons/0059-let-it-be-stale-attribute-skips-update-sql.html)) — 매번 정식으로 `update!`를 불러도, 그 값이 앞선 예제 때문에 이미 인메모리와 같으면 Dirty Tracking이 "변경 없음"으로 보고 `partial_writes`가 그 컬럼을 UPDATE SQL에서 빼버려 트랜잭션 롤백으로 되돌아간 DB 값이 갱신되지 않는다. 공유 레코드를 다루기 전엔 `reload`로 진짜 현재 값부터 확보해야 한다 → [배운 작업](work-log/2026-08-28-key-result-auto-checkin-reflect-auto-close-lock-and-migration-reissue.md) · **속성이 아니라 연관 캐시(association cache)가 새는 변주** — `let_it_be` 로 공유한 객체의 `has_many` 연관이 앞 describe 에서 로드된 채 남아 다음 describe 의 판정에 섞였다. `--order defined` 와 random 에서 결과가 갈렸고, **한 번 초록색이 나온 것은 순서 운이었다**(describe 를 하나 추가하자 3건이 깨졌다). 원인은 스펙이 운영과 다른 방식으로 객체를 얻고 있던 것 — 운영에서는 부모 엔티티가 매번 새로 로드한다. 공유 객체를 판정 대상으로 넘길 땐 DB 에서 다시 읽고, 순서를 바꿔 여러 번 돌려봐야 한다 → [배운 작업](work-log/2026-09-11-ppback-pr-5606-job-template-response-reset.md)
- [ ] Factory Bot으로 테스트 데이터 만들기 — 미사용 팩토리는 `FactoryBot.lint`가 없으면 아무도 잡지 못하고, NOT NULL 컬럼을 안 채운 팩토리는 호출하면 실패하는 죽은 코드로 남는다 → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md)
- [ ] Request spec vs Model spec
- [x] **특성화 테스트(characterization test)가 리팩터링의 선행 조건** — 대상 코드의 현재 동작이 스펙으로 고정돼 있지 않으면, 리팩터링 후 무엇이 바뀌었는지 알 수 없다. 운영에 쓰이는데 스펙이 얇은 경로(소프트 리셋)는 구조를 바꾸기 전에 현재 동작을 먼저 스펙으로 박아야 한다 — 리팩터링을 하든 안 하든 값어치가 있는 단계라 계획의 0단계로 둔다 → [배운 작업](work-log/2026-09-11-ppback-pr-5606-job-template-response-reset.md)
- [x] DB 정리 전략 (`DatabaseCleaner` `:transaction` vs `:truncation`) — `:transaction`은 예제를 **미커밋 트랜잭션으로 감싸서** 빠르게 되돌리는 대신, 그 픽스처가 **다른 커넥션에는 보이지 않는다.** `:truncation`은 실제로 커밋되지만 매 예제마다 테이블을 비워서 느리다 → [레슨](lessons/0054-database-cleaner-strategy-and-concurrency-spec.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md) · 바깥 트랜잭션이 **첫 예제에만 열려 있고 이후 예제엔 없다** — 그래서 `transaction(isolation:)`처럼 중첩을 못 견디는 코드는 어떤 예제가 먼저 실행되느냐에 따라 통과/실패가 갈린다. 격리수준을 쓰는 스펙 파일은 태그로 아예 `:truncation`에 태워야 한다 → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md)
- [x] **회귀 스펙의 판별력 검증** ([레슨 55](lessons/0055-regression-spec-discriminating-power.html)) — 초록색은 아무것도 증명하지 않을 수 있다. 고친 코드를 임시로 되돌려 그 스펙이 **실제로 실패하는지** 확인해야 한다. 동시성 회귀는 특히 그런데, 경합 상태를 만들어두지 않으면(예: 두 입력이 워커 실행 전에 이미 커밋돼 있으면) 두 실행이 같은 값을 계산해 경합 자체가 성립하지 않는다. 인터리빙을 `Queue` 등으로 강제해야 한다 → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md) · **변주 — 남의 PR 리뷰에도 쓴다**: 작성자가 "회귀 테스트를 추가했다"고 하면 그 말을 믿는 대신 고친 코드를 임시로 되돌려 돌려본다. 이때 **정확히 그 example 하나만 실패하는지**까지 봐야 한다 — 여러 개가 같이 실패하면 그 테스트가 무엇을 지키는지 불분명하다는 뜻이다 → [배운 작업](work-log/2026-09-03-ppback-pr-5585-appraisal-result-search-review.md) · **변주 — 분기에 `raise`를 꽂아 "커버리지 0"을 찾는다**: 단언이 약한 것과 그 코드에 **도달하는 예제가 아예 없는 것**은 다르다. 문제의 분기에 `else raise "..."`를 넣고 1787 예제를 돌려 0 failures가 나오면 후자다. 하필 그 갈래가 리팩터링이 반드시 보존해야 하는 곳일 수 있다. 같은 방법으로 기존 예제가 **아무것도 안 해도 통과**하는지도 잡힌다(`be_present`만 보는 어서션은 서비스를 통째로 비워도 초록) → [배운 작업](work-log/2026-09-17-ppback-pr-5611-v1-removal-review-followups.md)
- [x] **부재를 검증하는 어서션은 항상 통과한다** — 판별력 검증(위 항목)의 정적 버전. `expect(model).not_to respond_to(:removed_method)` 처럼 "메서드가 없음"을 확인하는 어서션은 프로덕션 코드가 무엇을 하든 통과하므로 회귀 방어가 0 이다(되돌릴 대상 자체가 없어서 실패할 수 없다). "구 필드를 보내도 실패하지 않는다"를 실제로 보장하는 건 `expect(response).to have_http_status(:success)` 한 줄이고, 그 다음엔 **"새 저장 경로가 오염되지 않았다"를 값으로 비교**해야 한다. 응답 계약 쪽은 `expect(data).not_to have_key('...')` 처럼 실제 페이로드를 보는 어서션이라 이와 다르게 유효하다 → [배운 작업](work-log/2026-09-01-ppback-pr-5579-legacy-column-removal-review.md)
- [x] 다중 커넥션(스레드) 동시성 스펙 — 진짜 동시성 버그(lost update, 데드락)는 커넥션 2개를 실제로 띄워야 재현된다. 픽스처가 커밋돼 있어야 하므로 `:truncation` 전환이 전제. 부수적으로, 테스트 하네스가 연 트랜잭션은 `joinable: false`로 열려서 앱이 연 트랜잭션(`true`)과 `current_transaction.joinable?`로 구분할 수 있다 → [레슨](lessons/0054-database-cleaner-strategy-and-concurrency-spec.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md)
- [x] **차등 실행(differential testing)으로 리팩터링 동치성 확인하기** — "읽어 보니 같다"는 증명이 아니다. 같은 픽스처에 현재 구현과 제안 구현들을 각각 적용하고 트랜잭션 롤백으로 되돌리며 결과를 비교한다. 내가 "어차피 같다"고 적은 제안이 6개 시나리오 중 하나에서 갈렸고, 그게 실동작 회귀였다. 갈리는 입력은 보통 **그 코드가 아무것도 하지 않는 갈래**에 숨어 있다 → [배운 작업](work-log/2026-09-17-ppback-pr-5611-v1-removal-review-followups.md)
- [x] 태그 기반 스펙 제외 (`config.filter_run_excluding`)와 그 대가 — 느리거나 flaky한 스펙을 기본 스위트에서 빼는 표준 방법이지만, **그 태그를 실행하는 경로를 확인하지 않으면 회귀 방어가 0이 된다** (초록 CI가 아무것도 보장하지 않게 됨) → [레슨](lessons/0054-database-cleaner-strategy-and-concurrency-spec.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md) · **확인 방법을 틀렸던 사례**: `.github/workflows`에 rspec이 없어 "스펙 CI 부재"로 단정했는데 실제 파이프라인은 AWS 쪽에 있었다. CI 정의가 레포 밖에 있을 수 있다 → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md) · **한 번 잡은 gap도 재확인 안 하면 여러 커밋을 그냥 통과한다**: 08-11에 지적한 뒤로도 08-19, 08-28 커밋까지 `aws/buildspec-test.yml`이 안 고쳐진 채 남아 있다가, 2차 전체 리뷰에서 다시 짚고서야 실제로 수정됐다 → [배운 작업](work-log/2026-08-28-key-result-auto-checkin-reflect-full-branch-review.md)

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
- [x] Grape custom validator 작성 (`Grape::Validations::Validators::Base`, `register_validator`, `validate_param!`) — 파라미터 타입 검증을 넘어 "지금 이 값을 써도 되는 상태인가"까지 처리 → [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md) · **validator가 던진 예외가 실제 HTTP 응답으로 바뀌는 경로**: 개별 validator는 `raise Grape::Exceptions::Validation.new(params: [...], message: ...)`만 던지고 끝이다. 이걸 실제 `400 { "errors": { "<key>": "<message>" } }` 바디로 바꾸는 건 애플리케이션 전역에 한 번 걸린 `rescue_from Grape::Exceptions::ValidationErrors, with: :parameter_validate_error`(`app/controllers/grape_base.rb`)이고, 여기서 `params:` 배열을 `join(',')`한 값이 응답의 키가 된다. 즉 validator를 새로 추가할 때 응답 포맷을 직접 신경 쓸 필요가 없는 이유는 "안 나서 그런 게 아니라 이미 한 곳에서 처리되고 있어서"였다 → [배운 작업](work-log/2026-08-27-key-result-tag-require.md)
- [x] Grape::Entity의 `if:` 조건부 expose — 성능/페이로드 최적화용 게이팅과, 특정 분기에서만 SELECT되는 가상 컬럼 접근 시 `MissingAttributeError`를 막는 정합성 게이팅은 서로 다른 이유일 수 있음 → [레슨](lessons/0047-grape-entity-conditional-expose-two-natures.html) | [배운 작업](work-log/2026-07-24-key-result-auto-checkin-reflect-api-exposure-review.md)
- [x] **Grape `Boolean` 은 문자열을 강제 변환한다** — `"yes"` 를 보내면 `true` 가 되어 파괴적인 옵션이 켜진다. 프론트가 axiauth 를 타면 실제 boolean 이 가므로 위험도는 낮지만, 오타 하나로 데이터가 삭제될 수 있는 파라미터라면 타입 검증만 믿지 말고 값 범위를 좁히는 편이 안전하다 → [배운 작업](work-log/2026-09-11-ppback-pr-5606-job-template-response-reset.md)
- [x] **`options` 를 preload 전달 통로로 쓰기** — 부모 엔티티가 이미 로드한 컬렉션을 자식 엔티티에 넘기면, 자식이 판정을 위해 다시 조회하며 생기는 N+1 을 없앨 수 있다(프로세스 수만큼 늘어나던 질의를 프로세스당 1회로). 아래 조건부 필터링과 같은 `options` 지만 목적이 다르다 → [배운 작업](work-log/2026-09-11-ppback-pr-5606-job-template-response-reset.md)
- [x] Grape::Entity `options` 기반 조건부 필터링 — `if:`는 expose 자체를 게이팅하지만, expose된 컬렉션 안에서 개별 원소를 `options[:key]`로 `reject`하는 건 다른 메커니즘. 호출부마다 다른 필터 기준(`open_result_section_ids` 등)을 주입할 수 있는 대신, 그 옵션 값을 만드는 헬퍼가 어떤 범위로 스코프됐는지(예: 특정 process 기준인지 전체인지)를 놓치면 필터가 조용히 새는 게이트가 됨 → [배운 작업](work-log/2026-08-04-ppback-pr-5528-review.md)
- [x] **같은 도메인 필드가 고객사 전용 엔티티에 독립적으로 복제돼 있을 수 있다** — `AppraisalGroups::BaseEntity` / `TargetEntity` 와 별개로 `Entities::Daekyo::AppraisalGroups::DefaultInfoEntity` 가 같은 필드를 노출하고, 그 엔드포인트는 `authorize workspace, :daekyo?` 로 게이팅된 고객사 전용 API 다. 필드 제거 PR 이 "프론트 몇 곳 확인"으로 끝나면 이런 전용 계약이 조용히 사라지고, 스펙이 없으면 CI 로도 안 잡힌다. 제거 전에 `git grep <필드명> -- app/controllers/entities app/serializers` 로 **노출 지점 전수**를 먼저 세는 게 순서 → [배운 작업](work-log/2026-09-01-ppback-pr-5579-legacy-column-removal-review.md)

### 권한

- [x] Pundit 정책(Policy)이란? → [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md)
- [ ] `policy_scope`란?
- [x] `authorize`란? (실패 시 `record.errors.add`로 사유 기록 → `errors.empty? && 조건`으로 최종 판정하는 패턴) → [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md)
- [x] `authorize`는 컨트롤러에서 명시적으로 호출한 곳에서만 강제됨 — 서비스 객체를 직접 호출하면 정책 체크가 통째로 우회됨 → [레슨](lessons/0046-pundit-authorize-scope-and-hr-admin-duality.html) | [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-manual-scenario-testing.md) · **변주 — 인가 지점을 워커로 옮기면 옆에 있던 다른 side effect도 같이 재검토해야 한다**: 목표별 `authorize`를 워커(비동기)로 이관했는데, 같은 액션의 알림 발행 워커 호출은 컨트롤러에 그대로 남아 워크스페이스 소속만 확인한 채(개별 인가 결과와 무관하게) 실행된다 → [배운 작업](work-log/2026-08-28-key-result-auto-checkin-reflect-full-branch-review.md)
- [x] `has_flags`(비트마스크 플래그 컬럼) 패턴과, 같은 개념(HR admin)이 조인 테이블과 비트마스크 두 곳에 독립적으로 존재해 서로 어긋날 수 있다는 것 → [레슨](lessons/0046-pundit-authorize-scope-and-hr-admin-duality.html) | [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-manual-scenario-testing.md) · **선언의 키는 비트 위치이고 컬럼에 저장되는 값은 `2^(n-1)` 이다** — `has_flags 1 => :objectives … 5 => :reviews` 의 왼쪽 숫자는 1-based 포지션이고 정수 컬럼에는 `1/2/4/8/16` 이 OR 되어 들어간다. 마이그레이션에서 raw 값을 직접 디코딩할 때 이 변환을 틀리면 조용히 잘못된 플래그를 읽는다 · **생성 메서드는 동적이라 컬럼명 grep 으로 안 잡힌다** — `selected_<컬럼명>`(켜진 플래그의 심볼 배열), `<플래그>`, `<플래그>?`, `<플래그>=` 가 전부 런타임 정의다. `has_flags` 를 제거할 땐 컬럼명이 아니라 **플래그 이름 전부**(와 `?`·`=` 변형)로 잔여 호출처를 훑어야 한다 → [배운 작업](work-log/2026-09-01-ppback-pr-5579-legacy-column-removal-review.md)
- [x] 테넌트 격리 가드 패턴 (멀티 workspace에서 FK 소속 검증) — 같은 user가 여러 workspace에 속할 수 있는 멀티테넌시에서는, 파라미터로 받은 id가 "존재하는가"가 아니라 "현재 요청 중인 workspace에 속하는가"를 별도로 확인해야 한다. `AppraisalProcess.joins(appraisal_group: :appraisal).exists?(id:, appraisals: { workspace_id: })` 같은 join + `exists?`로 소속을 검증하고, 실패 시 존재 자체를 노출하지 않도록 403이 아니라 404로 처리한다 → [배운 작업](work-log/2026-08-04-ppback-pr-5528-review.md)
- [x] **정책이 죽었는지 확인하는 세 겹** — "grep에 안 나온다"만으로는 부족하다. (1) 문자열 전수 — 이름이 겹치는 **Grape 라우트 경로 문자열**을 호출부로 오독하기 쉽다(`post 'appraisee_reset'`의 핸들러는 다른 정책을 쓰고 있었다). (2) 이름으로 추론되는 경로 — Pundit은 query를 생략하면 `"#{action_name}?"`로 찾으므로, query 생략 `authorize`가 몇 건인지·그 action_name을 만들 라우트가 있는지·정책 메서드명을 보간으로 만드는 곳이 그 이름을 만들 수 있는지를 따로 본다. (3) 런타임 — 실제로 불러 본다. 이 층이 "호출부가 없다"를 넘어 **"불려도 터진다"**까지 알려 준다 → [배운 작업](work-log/2026-09-17-ppback-pr-5611-v1-removal-review-followups.md)
- [x] **`||`의 첫 항이 예외를 던지면 뒤 항은 영원히 안 읽힌다** — "셋 중 하나라도 참이면 허용"으로 읽히는 정책의 첫 항이 존재하지 않는 메서드였다. `undiscarded?`가 참인 모든 호출이 `NoMethodError`로 끝나, 뒤의 두 조건은 한 번도 평가된 적이 없다. 정책 도입 **1분 뒤** 커밋이 이 항을 맨 앞에 붙였고 10개월을 갔다 — 조건 하나를 추가하는 작은 diff가 `||`에서는 순서 때문에 의미를 통째로 바꾼다 → [배운 작업](work-log/2026-09-17-ppback-pr-5611-v1-removal-review-followups.md)

### 도메인 이벤트

- [x] 문자열 상수(`event_type`)로 분기하는 도메인 이벤트를 추가할 때의 파급 범위 — enum이나 타입이 아니라 문자열이라 컴파일러가 누락을 안 잡아준다. 이벤트 하나 추가에 메시지 팩토리(안 넣으면 `raise`), 히스토리 스코프, 안읽음 카운트 제외 목록, 노출 제외 목록, 시리얼라이저, 엔티티의 `case`까지 6곳이 얽혔다 → [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-branch-review.md)
- [x] 1:N 팬인(여러 하위 → 하나의 상위) 값 반영 semantics — 마지막이 이김 / 평균 / 합계 중 무엇이 기본이어야 하나 → **평균(1/n 균등분할)로 결정** — 하위 하나만 대입하면 처리 순서에 따라 최종값이 달라지고, 재귀 반영에서 이 비결정성이 위로 증폭된다. 연계된 하위 전체에서 매번 다시 계산하면 순서 무관하게 같은 값에 수렴한다. 하위 수가 많고 target이 작으면 정수 반올림 때문에 한동안 계단식으로 오르지만(예: target 10·하위 72개, 1건→0, 4건→1), 매번 전량 재계산이라 하위 전체가 완료되면 정확히 target에 도달한다 → [배운 작업](work-log/2026-08-06-key-result-auto-reflect-1n-split.md)

### 외부 시스템 연동 (HR 동기화)

- [x] 외부 연동 실패의 두 계층 — "매칭 실패"(로그 있음) vs "소스 데이터 자체 부재"(로그 없음) — 발령 동기화 코드는 발령 레코드가 있는데 참조하는 member_uid/organization_uid가 안 맞을 때만 에러 로그를 남긴다. 대상이 소스 피드에 아예 없으면 그 코드 경로 자체가 안 돌아서 아무 로그도 없이 `status=completed / error_code=ok`로 끝난다 — "에러 로그 없음"이 "정상"을 보장하지 않는다 → [배운 작업](work-log/2026-09-11-hyundai-department-store-organization-sync-investigation.md)
- [x] 동기화 스냅샷(JSON 컬럼)으로 원본 피드를 그대로 재현해서 검증하기 — `Synchronization#data`(JSON)에 그 회차 users/organizations/appointments 배열 전체가 보존돼 있어서, 특정 대상이 그 회차 소스 피드에 포함됐는지를 코드 추측이 아니라 실제 데이터로 확인할 수 있다 → [배운 작업](work-log/2026-09-11-hyundai-department-store-organization-sync-investigation.md)
- [x] 동기화 트리거 주체(`member_id`)와 동기화 대상(피드 안 `EMP_ID`)은 다른 축이다 — `Synchronization#member_id`는 수동 재동기화를 누른 관리자이지 동기화되는 대상이 아니다. 특정 대상을 찾으려면 `data` JSON 내부를 뒤져야 한다 → [배운 작업](work-log/2026-09-11-hyundai-department-store-organization-sync-investigation.md)
- [x] 활성화 시각(`last_activate_at`)을 배치 스케줄과 대조해 수동 조치인지 자동 동기화 결과인지 구분하기 — 대상 레코드의 활성화 시각이 최근 배치 시각들과 하나도 안 맞으면, 그 활성화는 이번 동기화가 아니라 수동 처리(관리자/CS)였다고 추론할 수 있다 → [배운 작업](work-log/2026-09-11-hyundai-department-store-organization-sync-investigation.md)
- [x] **서비스 간 동기화가 항상 Kafka는 아니다 — Sidekiq 크로스 앱 job push** — theplus-back→ppback 구간(`Performance::OrganizationWorker`/`MemberWorker` 등)은 ppback 안에 enqueue 코드가 없고 `karafka.rb`엔 활성 consumer route도 없다. theplus-back이 공유 Redis에 job class 이름 문자열만으로 직접 push하는 구조로 보인다 → [배운 작업](work-log/2026-09-16-nhqv-organization-member-excel-sync-review.md)
- [x] `SyncMessage::Type`(CREATE/UPDATE/DELETE) envelope로 동기화 메세지 종류를 구분하는 패턴 → [배운 작업](work-log/2026-09-16-nhqv-organization-member-excel-sync-review.md)
- [x] `Team#update`는 삭제 후 재생성이 아니라, 원하는 멤버 목록과 현재 `end_team_joins`를 diff해서 추가/삭제분만 반영한다 — in-place 동기화 갱신의 실사례 → [배운 작업](work-log/2026-09-16-nhqv-organization-member-excel-sync-review.md)

### 백그라운드 잡

- [ ] Sidekiq란?
- [x] 워커(Worker) 작성법 → [정리](concepts/sidekiq-job-argument-pipeline.md) | [배운 작업](work-log/2026-07-03-sidekiq-job-args-and-slack-investigation.md) · [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md)
- [x] `Sidekiq::Status` gem — `total`/`at`/`store`/`retrieve`로 벌크 job 진행률을 Redis에 기록하고 `job_id`로 폴링 조회 → [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md)
- [x] 큐(Queue) 종류와 우선순위 — 큐는 처리량 분리 용도만이 아니라 `sidekiq-limit_fetch` 같은 gem으로 특정 큐의 concurrency를 1로 눌러 **직렬화 전용**으로 쓰는 용도로도 쓰인다(운영 설정 `config/sidekiq.yml`에서 실제로 확인). 그리고 이 큐 동시성(Sidekiq)과 웹 요청을 받는 Puma 워커·스레드 동시성(`config/puma.rb`)은 완전히 분리된 자원 풀이라, "동기 처리가 오래 걸려 운영 자원을 점유한다"는 우려가 실제로는 Sidekiq이 아니라 Puma 쪽 슬롯(workers × threads) 이야기였다 → [배운 작업](work-log/2026-08-25-key-result-auto-checkin-reflect-batch-approval-async-pattern-research.md)
- [ ] 실패한 잡 재시도
- [x] **실패를 예외가 아니라 상태로 다루기** ([레슨 57](lessons/0057-work-unit-vs-contention-unit.html)) — 아웃박스 전표의 의미를 "원인을 소비했다"에서 "대상이 더럽다"로 바꾸면 "지금은 반영할 수 없다"가 예외 처리가 아니라 기본 동작이 된다. 대가는 **회수 주체(스윕)가 선택이 아니라 전제가 된다**는 것. 그리고 **일시적 불가(승인 대기)와 영구적 불가(옵션 off)를 구분해야 한다** — 안 나누면 정상 설정이 처리 불가 전표를 쌓고 스윕이 주기마다 재시도해 알람을 만든다 → [배운 작업](work-log/2026-08-19-key-result-auto-reflect-decision-timeline.md)
- [ ] 아웃박스 테이블의 수명 관리 — 폴링 스위퍼/클린업 cron을 언제 붙여야 하는지 판단 기준(테이블 증가 속도, 발행 유실 빈도 관측)
- [x] job 인자 직렬화 (Marshal vs JSON, `on_complex_arguments`) → [정리](concepts/sidekiq-marshal-vs-json-serialization.md) | [배운 작업](work-log/2026-07-03-sidekiq-job-args-and-slack-investigation.md)

### 기타

- [ ] Docker와 컨테이너 기초
- [x] `docker compose` 명령어 흐름 — 같은 host에서 여러 compose 프로젝트(예: git worktree별로)를 동시에 띄우면, `ports: [3306:3306]`처럼 고정 host 포트를 쓰는 서비스는 이미 떠 있는 다른 프로젝트와 충돌한다. `docker-compose.override.yml`로 포트를 바꾸려 했지만 Compose Spec의 기본 병합 규칙은 `ports` 같은 리스트를 교체가 아니라 **추가**해서 베이스 포트가 그대로 남아 있었다 — `ports: !override [...]`처럼 병합 태그를 명시해야 리스트를 완전히 교체할 수 있다 → [배운 작업](work-log/2026-08-27-key-result-tag-require.md)
- [x] **compose의 "named volume"이 사실 bind mount일 수 있다, 그리고 worktree로 격리 실행하기** — `driver_opts: {type: none, device: ${PWD}, o: bind}`면 이름만 볼륨이고 실체는 그 디렉토리다. 그래서 같은 트리를 다른 세션이 건드리면 스펙 실행 결과가 오염된다. `docker compose run --rm --no-deps --entrypoint bash -v <worktree>:/var/www/app` 로 그 마운트를 덮어쓰면 격리된다(`--entrypoint bash`가 필요한 이유는 기본 entrypoint가 compose에서 주석 처리된 elasticsearch를 무한히 기다리기 때문). 다만 **test DB는 여전히 공유**라 상대의 DDL이 `Mysql2::Error: Table definition has changed`로 튀어나온다 — 같은 seed·같은 코드가 17 failures와 0 failures를 오갔으므로 1회 실행을 믿으면 안 된다 → [배운 작업](work-log/2026-09-17-ppback-pr-5611-v1-removal-review-followups.md)
- [x] **`git checkout -- <path>`는 HEAD가 아니라 인덱스에서 복원한다** — 뮤테이션 실험을 되돌리면서 스테이징하지 않은 리팩터링까지 날렸다. 파일을 임시로 망가뜨리기 전에 `git add`부터. 복원 여부를 확인할 때도 **그 변경에서만 생기는 토큰**으로 봐야 한다 — 되돌리기 전후에 모두 존재하는 문자열(주석 속 클래스명)로 확인하면 살아 있다고 오판한다 → [배운 작업](work-log/2026-09-17-ppback-pr-5611-v1-removal-review-followups.md)
- [x] **격리 환경이 만든 가짜 실패 — worktree에는 gitignore된 키가 안 따라온다** — `git worktree add`는 `config/credentials/test.key`를 가져오지 않는다. 그러면 `Rails.application.credentials`가 전부 nil이 되고, 그걸 읽는 값(IP 허용 목록 등)이 빈 채로 인가 분기를 태워 **코드와 무관한 403**이 무더기로 난다. `-e RAILS_MASTER_KEY=...`로 주입하면 0 failures. 더 중요한 교훈은 분류 기준 쪽이다 — **"변경 전후가 같은 수치니 기존 실패"는 성립하지 않는다.** 내가 바꾼 것이 코드가 아니라 측정 환경이면 그 오염은 변경 전후 양쪽에 똑같이 걸린다. 403을 Pundit 실패로 지레짐작하지 말고 응답 본문(`keyword`)을 읽어야 한다 → [배운 작업](work-log/2026-09-17-ppback-pr-5611-v1-removal-review-followups.md)
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

- [x] 원자성(Atomicity) vs 멱등성(Idempotency) → [레슨](lessons/0031-atomicity-vs-idempotency.html) | [배운 작업](work-log/2026-07-06-pr-1294-transaction-atomicity-and-msa-discussion.md) · 장애를 분류하는 프레임이 아니라 **설계 도구로** 쓴 사례 — 값을 절대 대입하는 대신 매번 전량 재계산하게 바꾸니 "처리 순서가 결과를 바꾼다"는 문제 자체가 사라져, 모호한 배치를 탐지해 막던 밸리데이션을 통째로 폐기할 수 있었다 → [배운 작업](work-log/2026-08-06-key-result-auto-reflect-1n-split.md) · 둘은 서로를 대체하기도 한다 — 전량 재계산(멱등)이 있으면 값은 다음 실행에 자가복구되므로 **원자성을 포기하고 후처리를 커밋 뒤로 분리**하는 선택지가 열리고, 그 결정 하나가 동시성 방어 코드량을 크게 좌우한다 → [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md)
- [x] Transient vs Non-transient 에러 분류 (재시도 가능 여부로 에러 나누기) → [레슨](lessons/0029-kafka-dlq.html) | [배운 작업](work-log/2026-07-06-pr-1294-transaction-atomicity-and-msa-discussion.md)

### 분산 트랜잭션과 아키텍처 패턴

> 팀 시니어(juhoLee)와의 대화에서 나온 "2PC → Saga → Outbox" 순서, "MSA 이해하려면 DDD로 돌아가야 한다"는 관점을 정리했다.

- [x] 분산 트랜잭션 전략: 2PC → Saga → Outbox → [레슨](lessons/0032-distributed-transaction-2pc-saga-outbox.html) · 서비스 _내부_ 트랜잭션 경계 분리 용도 → [레슨 56](lessons/0056-outbox-moving-the-transaction-boundary.html) | [배운 작업](work-log/2026-07-06-pr-1294-transaction-atomicity-and-msa-discussion.md) · **아웃박스는 서비스 *내부*에서도 쓴다** — 서비스 간 메시지 유실 방지가 아니라, 같은 DB 안에서 무거운 후처리를 커밋 밖으로 빼되 "후처리가 필요하다"는 사실만은 원자적으로 남기려는 용도. 후처리를 별도 트랜잭션으로 열 수 있게 되면서 잠금·격리수준을 그 트랜잭션이 직접 소유하게 된다 → [배운 작업](work-log/2026-08-12-ppback-pr-5532-outbox-worker-migration.md)
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
- [x] awslogs 로그 그룹 위치 — CloudWatch 로그 그룹은 클러스터/서비스가 아니라 Task Definition의 컨테이너별 `logConfiguration.options`(`awslogs-group`/`awslogs-stream-prefix`)에 있다. `ecs describe-task-definition`으로 그때그때 읽으면 하드코딩 없이 정확한 그룹을 찾을 수 있고, 스트림명 규칙(`{prefix}/{컨테이너명}/{taskId}`)으로 같은 그룹을 공유하는 다른 컨테이너(app/sidekiq)의 로그와 안 섞이게 좁힐 수 있다 → [배운 작업](work-log/2026-09-11-hyundai-department-store-organization-sync-investigation.md)
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
- [x] `aws logs filter-log-events`의 `nextToken` 페이지네이션엔 직접 상한(cap)을 걸어야 한다 — 안 그러면 넓은 기간·느슨한 필터에서 무한히 페이지를 따라가며 출력이 폭주할 수 있다 → [배운 작업](work-log/2026-09-11-hyundai-department-store-organization-sync-investigation.md)
- [x] 컨테이너 이미지의 `base64`가 BusyBox(Alpine 계열)면 GNU 롱옵션(`--decode`)이 없다 — `-d`만 지원해서, 로컬(macOS)에서 만든 명령을 그대로 넣으면 `unrecognized option`으로 조용히 실패한다. 세션이 1~2초 만에 끝나는 증상만 보면 완전히 다른 원인(S3 세션로그 검증 실패)으로 오판하기 쉽다 → [배운 작업](work-log/2026-09-11-hyundai-department-store-organization-sync-investigation.md)

---

## 섹션 7. Java / Spring (뿌)

> 자체 프로젝트 **뿌(부동산을 부탁해)** 의 백엔드를 직접 설계·구현하며 배우는 것들.
> Rails 와 같은 개념은 [Rails에서 이미 아는 것 → Spring에서 이름만 다른 것] 으로 연결하고,
> Ruby/JS 비유가 안 통하는 지점만 A-Z 로 판다.
> 스택: Java 21 · Spring Boot · Gradle 멀티모듈(core/api/collector) · PostgreSQL + PostGIS · Flyway

> 이 섹션은 두 층이다.
>
> - **7-A 문제 기반** — 뿌를 만들다 실제로 부딪힌 것. 문제에서 출발해 적는다.
> - **7-B 커버리지** — 김영한 로드맵 3개(자바·스프링·JPA)의 커리큘럼 목차 전량 203항목. 빠진 구멍을 찾기 위한 목록.
>
> 강의를 듣는 것이 목적이 아니다. 뿌를 만들다 개념이 튀어나오면 7-B 에서 대응 항목을 찾아 체크하고,
> 7-A 에는 그 개념이 **어떤 문제로** 나타났는지 적는다. 체크의 뜻은 "강의를 봤다" 가 아니라
> **"뿌 코드에서 써봤고 남에게 설명할 수 있다"** 다. 7-B 에 미체크로 오래 남은 항목이 곧 다음 레슨 후보다.

### 7-A. 뿌에서 먼저 부딪히는 것 (문제 기반)

#### Java 언어 기초 (Ruby/JS 와 갈리는 지점만)

- [ ] 정적 타입과 제네릭 — 컴파일러가 잡아주는 것 / 여전히 못 잡는 것
- [ ] `record` 와 불변 객체 — DTO 를 왜 record 로 만드나
- [ ] `Optional` — Ruby 의 `nil` 안전 연산자, TS 의 `?.` 와 뭐가 다른가
- [ ] 체크 예외 vs 언체크 예외 — Ruby 에는 없는 구분
- [ ] 인터페이스와 추상 클래스 — Ruby 모듈(믹스인)과의 대응
- [ ] Stream API — Ruby 의 `map`/`select`/`reduce` 대응과 지연 평가 차이

#### Spring 핵심 (첫 주에 반드시 걸리는 것)

- [ ] **의존성 주입(DI)과 IoC 컨테이너** — Rails 는 `Service.new`, Spring 은 컨테이너가 주입한다
- [ ] **`@Transactional` 이 프록시로 걸린다** — 같은 클래스 내부 호출(self-invocation)은 트랜잭션이 안 걸림. [레슨 52](lessons/0052-transaction-boundary-ownership.html) 의 Java 판 함정
- [ ] `@Component` / `@Service` / `@Repository` / `@Configuration` 의 구분
- [ ] Bean 스코프와 생명주기 — 싱글턴 빈에 상태를 두면 안 되는 이유
- [ ] `application.yml` 과 프로파일(local/dev/prod), 환경변수 주입
- [ ] Spring Boot 자동 설정(auto-configuration)이 뭘 켜고 있는지 확인하는 법

#### JPA / Hibernate (ActiveRecord 와 가장 다른 곳)

- [ ] **영속성 컨텍스트와 dirty checking** — ActiveRecord 는 `save!` 를 불러야 하지만 JPA 는 **값만 바꿔도 커밋 시 UPDATE 가 나간다**. [정리](concepts/dirty-tracking.md) 와 이름은 같은데 동작이 반대
- [ ] 엔티티 생명주기 (transient / managed / detached / removed)
- [ ] 지연 로딩과 `LazyInitializationException` — 영속성 컨텍스트 밖에서 프록시를 건드리면 터진다
- [ ] **JPA 의 N+1 과 `fetch join`** — Rails `includes` 대응. [레슨 9](lessons/0009-n-plus-1.html) 와 같은 문제, 다른 도구
- [ ] `@Transactional(readOnly = true)` 와 읽기 전용 최적화
- [ ] 벌크 연산(`@Modifying`)이 영속성 컨텍스트를 우회한다 — Rails `update_all` 과 같은 함정
- [ ] **PostGIS 공간 쿼리는 JPA 로 안 된다** — 네이티브 SQL 또는 JdbcTemplate 으로 내려가야 하는 경계

#### 마이그레이션과 스키마

- [ ] **Flyway** — Rails 는 마이그레이션이 내장이지만 Spring 은 직접 붙인다. [정리](concepts/migration.md) 와 대조
- [ ] 버전 네이밍 규칙과 체크섬 — 이미 적용된 마이그레이션 파일을 고치면 왜 터지나
- [ ] `baseline` 과 기존 DB 에 Flyway 를 나중에 붙이는 경우

#### 외부 API 수집 (뿌 고유)

- [ ] `RestClient` / `WebClient` — 타임아웃·재시도·백오프 설정
- [ ] **HTTP 200 에 에러가 실려 오는 API** — 국토부 계열은 `resultCode` 를 명시적으로 봐야 한다. 안 보면 빈 결과를 정상으로 적재
- [ ] Jackson XML 로 XML 파싱 (Nokogiri 대응)
- [ ] **멱등 upsert** — 재수집이 전제인 데이터에서 자연키 해시 + `ON CONFLICT DO UPDATE`. [레슨 31](lessons/0031-atomicity-vs-idempotency.html) 의 실적용
- [ ] 외부 API 쿼터 관리 — 일일 호출 상한을 코드로 강제하는 법 (ODsay 30건/일)
- [ ] `@Scheduled` 와 `ApplicationRunner` — Sidekiq 워커 대응, 별도 프로세스로 띄우는 이유

#### 응답과 검증

- [ ] DTO 와 매퍼 — Grape::Entity 와 달리 **자동 노출이 없다.** [레슨 10](lessons/0010-grape-entity-and-n-plus-1-trace.html) 과 대조
- [ ] Bean Validation (`@Valid`, `@NotNull`, 커스텀 validator) — Grape `params do` 대응
- [ ] `@RestControllerAdvice` 로 예외를 응답으로 변환 — Grape `rescue_from` 대응
- [ ] springdoc(OpenAPI) 문서 자동 생성과 `openapi-typescript` 로 프론트 타입 뽑기

#### 테스트

- [ ] JUnit 5 + AssertJ 기초 — RSpec `describe`/`it`/`expect` 대응
- [ ] `@SpringBootTest` vs `@DataJpaTest` vs `@WebMvcTest` — 뭘 띄우고 뭘 안 띄우나
- [ ] **Testcontainers** — PostGIS 를 진짜 띄워서 테스트. 공간 쿼리는 H2 로 검증 불가
- [ ] 트랜잭션 롤백 테스트와 그 한계 — [레슨 54](lessons/0054-database-cleaner-strategy-and-concurrency-spec.html) 의 DatabaseCleaner `:transaction` 과 같은 함정

#### 빌드와 실행

- [ ] Gradle 멀티모듈 — 모듈 간 의존 방향, `api` vs `implementation`
- [ ] `bootJar` 와 실행 가능 jar — api 와 collector 를 별도 프로세스로 띄우는 구조
- [ ] Docker Compose 로 로컬 PostGIS 띄우기

### 7-B. 커리큘럼 커버리지 (김영한 로드맵 목차 203항목)

> 출처: 인프런 김영한 강사의 로드맵 3개 커리큘럼 목차(2026-09-21 확인). 강의 수강이 아니라 **커버리지 기준**으로 쓴다.
>
> **뿌를 만들다 보면 대략 이 순서로 걸린다** — 막혔을 때 어디를 볼지의 지도다.
>
> | 순서 | 걸리는 지점 | 대응 항목 |
> |---|---|---|
> | 1 | 빈 프로젝트에 모듈·설정부터 | 스프링 핵심 원리 기본편 (컨테이너·빈·DI) |
> | 2 | 엔티티를 짜는 순간 | JPA 기본편 (영속성 관리 → 엔티티 매핑 → 연관관계) |
> | 3 | 값이 저장이 안 되거나 두 번 저장될 때 | 스프링 DB 1편 (트랜잭션) → DB 2편 (전파) |
> | 4 | 외부 API 를 붙일 때 | 자바 중급 1편 (예외 처리) · 고급 2편 (I/O·네트워크) |
> | 5 | 목록 API 가 느려질 때 | JPA 활용2 (N+1·fetch join) · 스프링 데이터 JPA |
> | 6 | 검색 필터가 늘어날 때 | Querydsl |
> | 7 | "왜 이 어노테이션이 안 먹지" 할 때 | 스프링 핵심 원리 고급편 (프록시·AOP) · 스프링 부트 (자동 설정) |

#### 실전 자바 로드맵

> [실전 자바 로드맵](https://www.inflearn.com/roadmaps/744) — 7개 코스 · 127시간

> **자바 트랙 운영 규칙** — 뿌 환경설정 전에 자바부터 시작한다. 항목의 `java-NN` 은 레슨 파일 이름이다
> (`lessons/java-NN-<dash-case>.html`, `index.html` 의 `LESSONS` 배열에 `track: 'java'` 로 등록).
> 번호는 커리큘럼 순서로 고정돼 있고, **만드는 순서는 아래 페이즈를 따른다.**
>
> | 페이즈 | 범위 | 언제 | 왜 |
> |---|---|---|---|
> | 1 | `java-10` ~ `java-21` (기본편 12) | **지금** | `build.gradle` 과 `@SpringBootApplication` 을 열었을 때 눈에 들어오는 것이 전부 여기 — 패키지, `public class`, `static void main`, 어노테이션 붙은 클래스 |
> | 2 | `java-01` ~ `java-09` (입문 9) | 페이즈 1 중 막히면 | 프론트 경력으로 대부분 커버된다. 레슨을 만들지 말고 읽고 바로 체크, 자바 고유 문법(형변환·배열)만 레슨으로 |
> | 3 | `java-22` ~ `java-41` (중급 1·2) | 엔티티·수집기 짜기 시작할 때 | 예외 처리·enum·날짜(수집기), 제네릭·컬렉션(DTO·응답 래퍼) |
> | 4 | `java-69` ~ `java-81` (고급 3) | 수집 데이터 가공할 때 | 람다·스트림·Optional. Ruby `map`/`select` 대응이지만 지연 평가가 다르다 |
> | 5 | `java-42` ~ `java-68` (고급 1·2) | 필요해질 때 | 동시성은 collector 병렬화, I/O·리플렉션은 외부 API 와 스프링 동작 원리의 전제 |
>
> 레슨 **포맷**은 `net-*` 계열(커리큘럼 기반)을 따른다 — `lesson-meta` 는 `자바 · <강의명>` / `섹션 N` / 분량,
> 본문은 핵심 한 줄 → 왜 필요한가 → `.analogy`(Ruby·TS 대응) → 퀴즈. 실무 버그에서 출발하는 `NNNN-*` 계열과 다르다.
>
> ⚠️ **내용 출처는 다르다.** `net-*` 은 강의를 들으며 정리한 것이지만, `java-*` 는 **강의를 수강하지 않고 직접 작성**한다.
> 김영한 커리큘럼에서 빌리는 것은 **섹션 제목(= 무엇을 다룰지)** 뿐이고, 설명 방식·예제·전개는 강의와 무관하다.
> 각 레슨에도 이 사실을 명시한다 — 나중에 강의를 듣게 되면 전개가 다르다는 것을 알고 봐야 한다.

##### 자바 입문 — 코드로 시작하는 자바 첫걸음

> 입문 · 82강 12h51m · [강의](https://www.inflearn.com/course/김영한의-자바-입문)  
> 문법 기초. 뿌 코드를 읽는 데 바로 쓰이지만 프론트 경력으로 대부분 커버됨 — 자바 고유 문법(형변환, 배열)만 확인

- [ ] `java-01` Hello World
- [ ] `java-02` 변수
- [ ] `java-03` 연산자
- [ ] `java-04` 조건문
- [ ] `java-05` 반복문
- [ ] `java-06` 스코프, 형변환
- [ ] `java-07` 훈련
- [ ] `java-08` 배열
- [ ] `java-09` 메서드

##### 실전 자바 — 기본편

> 초급 · 98강 16h51m · [강의](https://www.inflearn.com/course/김영한의-실전-자바-기본편)  
> 엔티티·서비스 클래스를 스스로 설계하려면 필수. `static`/`final`/접근 제어자는 Ruby에 대응이 없다

- [x] `java-10` 클래스와 데이터 → [레슨](lessons/java-10-class-and-data.html)
- [ ] `java-11` 기본형과 참조형
- [ ] `java-12` 객체 지향 프로그래밍
- [ ] `java-13` 생성자
- [ ] `java-14` 패키지
- [ ] `java-15` 접근 제어자
- [ ] `java-16` 자바 메모리 구조와 static
- [ ] `java-17` final
- [ ] `java-18` 상속
- [ ] `java-19` 다형성1
- [ ] `java-20` 다형성2
- [ ] `java-21` 다형성과 설계

##### 실전 자바 — 중급 1편

> 초급 · 103강 19h20m · [강의](https://www.inflearn.com/course/김영한의-실전-자바-중급-1)  
> 수집기 예외 처리(체크/언체크), 날짜·시간(거래일자 파싱), enum(매물 상태)이 전부 여기

- [ ] `java-22` Object 클래스
- [ ] `java-23` 불변 객체
- [ ] `java-24` String 클래스
- [ ] `java-25` 래퍼, Class 클래스
- [ ] `java-26` 열거형 - ENUM
- [ ] `java-27` 날짜와 시간
- [ ] `java-28` 중첩 클래스, 내부 클래스1
- [ ] `java-29` 중첩 클래스, 내부 클래스2
- [ ] `java-30` 예외 처리1 - 이론
- [ ] `java-31` 예외 처리2 - 실습

##### 실전 자바 — 중급 2편

> 초급 · 93강 19h24m · [강의](https://www.inflearn.com/course/김영한의-실전-자바-중급-2)  
> 제네릭은 DTO·Response 래퍼를 짤 때 바로 필요하고, 컬렉션은 수집 결과 중복 제거(HashSet)에 쓰인다

- [ ] `java-32` 제네릭 - Generic1
- [ ] `java-33` 제네릭 - Generic2
- [ ] `java-34` 컬렉션 프레임워크 - ArrayList
- [ ] `java-35` 컬렉션 프레임워크 - LinkedList
- [ ] `java-36` 컬렉션 프레임워크 - List
- [ ] `java-37` 컬렉션 프레임워크 - 해시(Hash)
- [ ] `java-38` 컬렉션 프레임워크 - HashSet
- [ ] `java-39` 컬렉션 프레임워크 - Set
- [ ] `java-40` 컬렉션 프레임워크 - Map, Stack, Queue
- [ ] `java-41` 컬렉션 프레임워크 - 순회, 정렬, 전체 정리

##### 실전 자바 — 고급 1편, 멀티스레드와 동시성

> 초급 · 118강 20h48m · [강의](https://www.inflearn.com/course/김영한의-실전-자바-고급-1)  
> collector를 병렬로 돌릴 때. 실무 Rails에서 겪은 락·경합 문제의 자바판

- [ ] `java-42` 프로세스와 스레드 소개
- [ ] `java-43` 스레드 생성과 실행
- [ ] `java-44` 스레드 제어와 생명 주기1
- [ ] `java-45` 스레드 제어와 생명 주기2
- [ ] `java-46` 메모리 가시성
- [ ] `java-47` 동기화 - synchronized
- [ ] `java-48` 고급 동기화 - concurrent.Lock
- [ ] `java-49` 생산자 소비자 문제1
- [ ] `java-50` 생산자 소비자 문제2
- [ ] `java-51` CAS - 동기화와 원자적 연산
- [ ] `java-52` 동시성 컬렉션
- [ ] `java-53` 스레드 풀과 Executor 프레임워크1
- [ ] `java-54` 스레드 풀과 Executor 프레임워크2

##### 실전 자바 — 고급 2편, I/O, 네트워크, 리플렉션

> 초급 · 101강 21h35m · [강의](https://www.inflearn.com/course/김영한의-실전-자바-고급-2)  
> 외부 API 호출·XML 파싱의 바닥. 리플렉션/애노테이션은 스프링이 어떻게 동작하는지의 전제

- [ ] `java-55` 문자 인코딩
- [ ] `java-56` I/O 기본1
- [ ] `java-57` I/O 기본2
- [ ] `java-58` I/O 활용
- [ ] `java-59` File, Files
- [ ] `java-60` 네트워크 - 기본 이론
- [ ] `java-61` 네트워크 - 프로그램1
- [ ] `java-62` 네트워크 - 프로그램2
- [ ] `java-63` 채팅 프로그램
- [ ] `java-64` HTTP - 기본 이론
- [ ] `java-65` HTTP 서버 만들기
- [ ] `java-66` 리플렉션
- [ ] `java-67` 애노테이션
- [ ] `java-68` HTTP 서버 활용

##### 실전 자바 — 고급 3편, 람다, 스트림, 함수형

> 초급 · 99강 16h40m · [강의](https://www.inflearn.com/course/김영한의-실전-자바-고급-3)  
> 수집 데이터 가공에 매일 쓴다. Ruby `map`/`select`와 대응되지만 지연 평가가 다르다

- [ ] `java-69` 람다가 필요한 이유
- [ ] `java-70` 람다
- [ ] `java-71` 함수형 인터페이스
- [ ] `java-72` 람다 활용
- [ ] `java-73` 람다 vs 익명 클래스
- [ ] `java-74` 메서드 참조
- [ ] `java-75` 스트림 API1 - 기본
- [ ] `java-76` 스트림 API2 - 기능
- [ ] `java-77` 스트림 API3 - 컬렉터
- [ ] `java-78` Optional
- [ ] `java-79` 디폴트 메서드
- [ ] `java-80` 병렬 스트림
- [ ] `java-81` 함수형 프로그래밍

#### 스프링 완전 정복 로드맵

> [스프링 완전 정복 로드맵](https://www.inflearn.com/roadmaps/373) — 9개 코스 · 116시간

##### 스프링 입문 — 코드로 배우는 스프링 부트, 웹 MVC, DB 접근

> 초급 · 28강 5h21m · 무료 · [강의](https://www.inflearn.com/course/스프링-입문-스프링부트)  
> 전체 윤곽을 한 번에 훑는 용도. 뿌 초기 스캐폴딩과 겹친다

- [ ] 프로젝트 환경설정
- [ ] 스프링 웹 개발 기초
- [ ] 회원 관리 예제 - 백엔드 개발
- [ ] 스프링 빈과 의존관계
- [ ] 회원 관리 예제 - 웹 MVC 개발
- [ ] 스프링 DB 접근 기술
- [ ] AOP

##### 스프링 핵심 원리 — 기본편

> 초급 · 65강 12h5m · [강의](https://www.inflearn.com/course/스프링-핵심-원리-기본편)  
> **최우선.** DI/IoC는 Rails `Service.new`와 갈리는 지점이라 비유가 안 통한다

- [ ] 객체 지향 설계와 스프링
- [ ] 스프링 핵심 원리 이해1 - 예제 만들기
- [ ] 스프링 핵심 원리 이해2 - 객체 지향 원리 적용
- [ ] 스프링 컨테이너와 스프링 빈
- [ ] 싱글톤 컨테이너
- [ ] 컴포넌트 스캔
- [ ] 의존관계 자동 주입
- [ ] 빈 생명주기 콜백
- [ ] 빈 스코프

##### 모든 개발자를 위한 HTTP 웹 기본 지식

> 초급 · 41강 5h40m · [강의](https://www.inflearn.com/course/http-웹-네트워크)  
> 프론트 경력으로 대부분 아는 영역. 캐시·조건부 요청 헤더만 확인하면 된다

- [ ] 인터넷 네트워크
- [ ] URI와 웹 브라우저 요청 흐름
- [ ] HTTP 기본
- [ ] HTTP 메서드
- [ ] HTTP 메서드 활용
- [ ] HTTP 상태코드
- [ ] HTTP 헤더1 - 일반 헤더
- [ ] HTTP 헤더2 - 캐시와 조건부 요청

##### 스프링 MVC 1편 — 백엔드 웹 개발 핵심 기술

> 초급 · 72강 15h22m · [강의](https://www.inflearn.com/course/스프링-mvc-1)  
> 서블릿부터 MVC를 직접 만들어 보는 구성. Rails 라우팅→컨트롤러 흐름을 이미 아는 만큼 구조 이해 위주로

- [ ] 웹 애플리케이션 이해
- [ ] 서블릿
- [ ] 서블릿, JSP, MVC 패턴
- [ ] MVC 프레임워크 만들기
- [ ] 스프링 MVC - 구조 이해
- [ ] 스프링 MVC - 기본 기능
- [ ] 스프링 MVC - 웹 페이지 만들기

##### 스프링 MVC 2편 — 백엔드 웹 개발 활용 기술

> 초급 · 129강 21h5m · [강의](https://www.inflearn.com/course/스프링-mvc-2)  
> 검증·예외 처리·타입 컨버터가 Grape `params do`/`rescue_from` 대응. API 예외 처리는 뿌 응답 계약에 직결

- [ ] 타임리프 - 기본 기능
- [ ] 타임리프 - 스프링 통합과 폼
- [ ] 메시지, 국제화
- [ ] 검증1 - Validation
- [ ] 검증2 - Bean Validation
- [ ] 로그인 처리1 - 쿠키, 세션
- [ ] 로그인 처리2 - 필터, 인터셉터
- [ ] 예외 처리와 오류 페이지
- [ ] API 예외 처리
- [ ] 스프링 타입 컨버터
- [ ] 파일 업로드

##### 스프링 DB 1편 — 데이터 접근 핵심 원리

> 초급 · 57강 10h4m · [강의](https://www.inflearn.com/course/스프링-db-1)  
> 트랜잭션 경계는 실무에서 이미 겪은 문제. 자바 예외 계층과 스프링 예외 추상화가 새로운 부분

- [ ] JDBC 이해
- [ ] 커넥션풀과 데이터소스 이해
- [ ] 트랜잭션 이해
- [ ] 스프링과 문제 해결 - 트랜잭션
- [ ] 자바 예외 이해
- [ ] 스프링과 문제 해결 - 예외 처리, 반복

##### 스프링 DB 2편 — 데이터 접근 활용 기술

> 초급 · 88강 13h59m · [강의](https://www.inflearn.com/course/스프링-db-2)  
> **트랜잭션 전파(propagation)**가 핵심. 수집기 재시도·부분 실패 설계가 여기에 달렸다

- [ ] 데이터 접근 기술 - 시작
- [ ] 데이터 접근 기술 - 스프링 JdbcTemplate
- [ ] 데이터 접근 기술 - 테스트
- [ ] 데이터 접근 기술 - MyBatis
- [ ] 데이터 접근 기술 - JPA
- [ ] 데이터 접근 기술 - 스프링 데이터 JPA
- [ ] 데이터 접근 기술 - Querydsl
- [ ] 데이터 접근 기술 - 활용 방안
- [ ] 스프링 트랜잭션 이해
- [ ] 스프링 트랜잭션 전파1 - 기본
- [ ] 스프링 트랜잭션 전파2 - 활용

##### 스프링 핵심 원리 — 고급편

> 중급이상 · 125강 16h44m · [강의](https://www.inflearn.com/course/스프링-핵심-원리-고급편)  
> `@Transactional`이 왜 self-invocation에서 안 걸리는지의 답. 프록시·AOP 전량

- [ ] 예제 만들기
- [ ] 쓰레드 로컬 - ThreadLocal
- [ ] 템플릿 메서드 패턴과 콜백 패턴
- [ ] 프록시 패턴과 데코레이터 패턴
- [ ] 동적 프록시 기술
- [ ] 스프링이 지원하는 프록시
- [ ] 빈 후처리기
- [ ] @Aspect AOP
- [ ] 스프링 AOP 개념
- [ ] 스프링 AOP 구현
- [ ] 스프링 AOP - 포인트컷
- [ ] 스프링 AOP - 실전 예제
- [ ] 스프링 AOP - 실무 주의사항

##### 스프링 부트 — 핵심 원리와 활용

> 초급 · 107강 15h45m · [강의](https://www.inflearn.com/course/스프링부트-핵심원리-활용)  
> 자동 설정이 뭘 켜고 있는지 확인하는 법. 액추에이터는 뿌 운영 모니터링에 바로 쓴다

- [ ] 오리엔테이션
- [ ] 스프링 부트 소개
- [ ] 웹 서버와 서블릿 컨테이너
- [ ] 스프링 부트와 내장 톰캣
- [ ] 스프링 부트 스타터와 라이브러리 관리
- [ ] 자동 구성(Auto Configuration)
- [ ] 외부설정과 프로필1
- [ ] 외부설정과 프로필2
- [ ] 액츄에이터
- [ ] 마이크로미터, 프로메테우스, 그라파나
- [ ] 모니터링 메트릭 활용

#### 스프링 부트 + JPA 실무 완전 정복 로드맵

> [스프링 부트 + JPA 실무 완전 정복 로드맵](https://www.inflearn.com/roadmaps/149) — 5개 코스 · 44시간

##### 자바 ORM 표준 JPA 프로그래밍 — 기본편

> 초급 · 56강 16h3m · [강의](https://www.inflearn.com/course/ORM-JPA-Basic)  
> **최우선.** 영속성 컨텍스트·dirty checking은 ActiveRecord와 이름만 같고 동작이 반대

- [ ] JPA 소개
- [ ] JPA 시작하기
- [ ] 영속성 관리 - 내부 동작 방식
- [ ] 엔티티 매핑
- [ ] 연관관계 매핑 기초
- [ ] 다양한 연관관계 매핑
- [ ] 고급 매핑
- [ ] 프록시와 연관관계 관리
- [ ] 값 타입
- [ ] 객체지향 쿼리 언어1 - 기본 문법
- [ ] 객체지향 쿼리 언어2 - 중급 문법

##### 실전! 스프링 부트와 JPA 활용1 — 웹 애플리케이션 개발

> 초급 · 36강 7h44m · [강의](https://www.inflearn.com/course/스프링부트-JPA-활용-1)  
> 도메인 설계→구현 한 바퀴. 뿌에서 직접 하고 있는 그 작업

- [ ] 프로젝트 환경설정
- [ ] 도메인 분석 설계
- [ ] 애플리케이션 구현 준비
- [ ] 회원 도메인 개발
- [ ] 상품 도메인 개발
- [ ] 주문 도메인 개발
- [ ] 웹 계층 개발

##### 실전! 스프링 부트와 JPA 활용2 — API 개발과 성능 최적화

> 중급이상 · 24강 6h35m · [강의](https://www.inflearn.com/course/스프링부트-JPA-API개발-성능최적화)  
> N+1과 fetch join. 레슨 9의 Rails `includes` 문제와 같은 문제, 다른 도구

- [ ] API 개발 기본
- [ ] API 개발 고급 - 준비
- [ ] API 개발 고급 - 지연 로딩과 조회 성능 최적화
- [ ] API 개발 고급 - 컬렉션 조회 최적화
- [ ] API 개발 고급 - 실무 필수 최적화

##### 실전! 스프링 데이터 JPA

> 중급이상 · 32강 7h17m · [강의](https://www.inflearn.com/course/스프링-데이터-JPA-실전)  
> 리포지토리 인터페이스와 벌크 연산. 벌크는 영속성 컨텍스트를 우회한다는 함정 포함

- [ ] 스프링 데이터 JPA 소개
- [ ] 프로젝트 환경설정
- [ ] 예제 도메인 모델
- [ ] 공통 인터페이스 기능
- [ ] 쿼리 메소드 기능
- [ ] 확장 기능
- [ ] 스프링 데이터 JPA 분석
- [ ] 나머지 기능들

##### 실전! Querydsl

> 중급이상 · 41강 6h24m · [강의](https://www.inflearn.com/course/querydsl-실전)  
> 동적 쿼리. 매물 검색 필터가 늘어나면 문자열 JPQL로는 감당이 안 된다

- [ ] Querydsl 소개
- [ ] 프로젝트 환경설정
- [ ] 예제 도메인 모델
- [ ] 기본 문법
- [ ] 중급 문법
- [ ] 실무 활용 - 순수 JPA와 Querydsl
- [ ] 실무 활용 - 스프링 데이터 JPA와 Querydsl
- [ ] 스프링 데이터 JPA가 제공하는 Querydsl 기능
