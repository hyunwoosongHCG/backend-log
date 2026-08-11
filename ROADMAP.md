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
- [x] 서비스 레이어(Service Layer)란? — 화이트리스트 상수 같은 걸 어느 레이어에 둘지는 "누가 그 개념의 진짜 주인인가"로 판단한다. 모델 컬럼(`category`)에 대한 predicate는 모델에 두고, 컨트롤러/validator가 끌어다 쓰는 API 파라미터 화이트리스트는 서비스 클래스가 아니라 별도 PORO 모듈로 분리해야 역참조가 안 생긴다 → [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)
- [x] 트랜잭션 경계 소유권 — 트랜잭션을 **호출부가 여는가 서비스가 여는가**는 별도로 결정해야 하는 설계 항목이다. 서비스를 블록으로 감싸는 건 문법적으로 무해해 보여도, 그 서비스가 내부에서 트랜잭션을 열면 **감싸는 순간 경계가 이동**해서 원래 커밋 뒤에 돌던 후처리(자동 마감 등)가 같은 트랜잭션에 딸려 들어가고, 후처리 실패가 본 작업까지 롤백시킨다 → [레슨](lessons/0052-transaction-boundary-ownership.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md)
- [x] 도메인(Domain)이란? 3레이어 Entity와의 차이 → [레슨](lessons/0006-domain-vs-entity.html) | [배운 작업](work-log/2026-06-25-add-use-required-template.md)
- [ ] 미들웨어(Middleware)란?
- [ ] 모놀리식 vs 마이크로서비스

### 데이터베이스 기초

- [ ] 관계형 데이터베이스(RDB)란?
- [ ] 테이블, 컬럼, 로우
- [x] 기본키(PK)와 외래키(FK) → [레슨](lessons/0005-sql-joins.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [x] 공개 식별자(Public ID)와 내부 PK 분리 패턴 → [정리](concepts/public-id-vs-primary-key.md) | [배운 작업](work-log/2026-07-07-delete-workspace-self-find.md)
- [ ] 1:1, 1:N, N:M 관계
- [x] 인덱스(Index)란? 왜 필요한가 → [레슨](lessons/0043-index-and-leftmost-prefix.html)
- [x] 조건부(Partial) 유니크 인덱스 — Postgres의 `WHERE` 조건부 인덱스와, MySQL이 생성 컬럼 + NULL 중복 허용으로 이를 흉내내는 법 → [레슨](lessons/0050-mysql-conditional-unique-index-via-generated-column.html) | [배운 작업](work-log/2026-07-27-ppback-pr-5506-review.md)
- [x] 트랜잭션(Transaction)과 ACID → [레슨](lessons/0024-transaction-atomicity-bulk-approval-bug.html) | [배운 작업](work-log/2026-07-03-sentry-batch-approval-atomicity-bug.md) · [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md) · [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)
- [x] 행 잠금(Row Locking)과 동시성 제어 (`with_lock`, `SELECT ... FOR UPDATE`) → [레슨](lessons/0042-row-locking-and-deadlock.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md) · 전역 정렬 순서(id 오름차순)로 잡으면 데드락을 피할 수 있지만, **반대로 조상 행 전체를 미리 선점하는 설계는 그 자체가 새 데드락 축을 만든다** — 같은 행을 락 없이 쓰는 다른 경로가 있으면 순서가 역전되므로, 그 경로까지 같은 규칙으로 잠그게 하거나 아예 한 번에 한 행만 잡아 hold-and-wait를 없애야 한다
- [ ] 낙관적 락(Optimistic Locking, `lock_version`) vs 비관적 락 — 충돌 빈도·재시도 비용 기준의 트레이드오프
- [x] 트랜잭션 격리 수준(Isolation Level)이란 (Dirty/Non-Repeatable/Phantom Read, Lost Update, MySQL 기본값) → [레슨](lessons/0044-transaction-isolation-level.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md) · MySQL REPEATABLE READ의 스냅샷 고정 **시점** 규칙: 잠금 읽기(`FOR UPDATE`)는 read view를 열지 않고 **첫 비잠금 SELECT가 연다.** 그래서 "락을 트랜잭션이 열리기 전(또는 첫 문장)에 잡아야 한다"는 제약이 생긴다
- [x] 중첩 트랜잭션(Nested Transaction)과 `requires_new`(SAVEPOINT) — 기본 중첩은 진짜 커밋 경계가 아니라 바깥 트랜잭션에 합류할 뿐이고, `requires_new: true`는 부분 실패 격리는 되지만 락 조기 해제는 안 됨 → [레슨](lessons/0045-nested-transaction-and-requires-new.html) | [배운 작업](work-log/2026-07-24-key-result-auto-checkin-reflect-auto-close-and-review-fixes.md)
- [ ] SQL 기본 (SELECT, INSERT, UPDATE, DELETE)
- [x] JOIN이란? → [레슨](lessons/0005-sql-joins.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [x] 쿼리 프로파일링/N+1 실측 (`ActiveSupport::Notifications.subscribed(..., "sql.active_record")`) — N+1을 추측이 아니라 직접 재현해서 쿼리 개수를 세는 법. 같은 방법으로 "이미 로드된 Relation을 `Enumerable#select`(블록)로 필터링하면 쿼리가 안 나가지만, `scope`(`.where`)를 걸면 로드 여부와 무관하게 새 쿼리가 나간다"는 것도 실측으로 증명했다 → [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)
- [x] 크로스 서비스 auto-increment 시퀀스 정합성 — 서로 다른 DB(서비스)에 같은 id로 레코드를 복제 삽입한 뒤 시퀀스(`setval`)를 강제로 맞출 때, 상대 DB의 현재 max_id를 확인하지 않고 계산하면 시퀀스가 기존 데이터보다 뒤로 밀려 다음 정상 삽입이 PK 충돌을 일으킬 수 있다 → [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)

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
- [x] `has_one` 연관에서 FK는 상대 테이블에 있다 — `section.score?`가 부르는 `score_setting`은 `appraisal_sections`의 컬럼이 아니라 `has_one`으로 연결된 별도 테이블(`appraisal_section_score_settings`)이라, `.includes(:appraisal_sections)`만으로는 preload가 안 되고 섹션 수만큼 N+1이 생긴다. `includes(appraisal_sections: [:score_setting, :rating_setting])`처럼 중첩 preload로 해결 → [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)
- [x] 연관관계 스코프의 비대칭 — `has_many`의 람다 스코프는 **조인 대상 테이블의 컬럼만** 검사하고 그 레코드가 속한 부모의 상태는 보지 않는다. 소프트 삭제가 부모 쪽에서만 일어나는 설계(`stage: :archived`만 바꾸고 자식의 `active`는 그대로)에서는, 자식 연관관계가 삭제된 부모의 자식을 계속 들고 온다. 이름이 대칭인 두 연관관계라도 정책이 같다고 믿으면 안 됨 → [레슨](lessons/0051-association-scope-asymmetry.html) | [정리](concepts/association-scope-asymmetry.md) | [배운 작업](work-log/2026-08-06-key-result-auto-reflect-1n-split.md)
- [x] 폴리모픽 연관관계 (`belongs_to ..., polymorphic: true`) → [레슨](lessons/0036-polymorphic-association.html) | [배운 작업](work-log/2026-07-09-review-remind-notification-split.md)
- [x] 유효성 검사 (`validates`) → [배운 작업](work-log/2026-07-27-ppback-pr-5506-review.md)
- [x] 스코프(Scope)란? → [레슨](lessons/0049-where-not-nor-vs-and.html) | [배운 작업](work-log/2026-07-27-ppback-pr-5506-review.md)
- [x] 콜백 (`before_save`, `after_create` 등) → [레슨](lessons/0019-timestamps-and-hidden-callbacks.html) | [정리](concepts/timestamps-and-callbacks.md) | [배운 작업](work-log/2026-07-01-objective-updated-at-and-key-result-history.md)
- [x] `after_commit`과 `after_save`/`after_create`의 차이 (트랜잭션 커밋 시점) → [레슨](lessons/0038-after-commit-vs-after-create.html) | [배운 작업](work-log/2026-07-09-review-remind-notification-split.md)
- [x] Dirty Tracking이란? (`changed?`, `attribute_changed?`, partial writes) → [레슨](lessons/0020-dirty-tracking-and-partial-writes.html) | [정리](concepts/dirty-tracking.md) | [배운 작업](work-log/2026-07-01-objective-updated-at-and-key-result-history.md)
- [x] 쿼리 메서드 (`where`, `find`, `find_by`, `includes`, `joins`) → [배운 작업](work-log/2026-07-07-delete-workspace-self-find.md)
- [x] N+1 문제란? `includes`로 해결하기 → [레슨](lessons/0009-n-plus-1.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [x] `preload` vs `includes`, 그리고 공유 엔티티에 필드를 추가하면 그 엔티티를 렌더하는 **모든** 컨트롤러의 preload를 갱신해야 한다 — 쿼리는 그대로인데 노출 필드 하나 때문에 N+1이 생긴다 → [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-branch-review.md)
- [x] 연관 캐시(association cache) — 스코프가 걸린 `has_one`(`-> { where(status: :pending) }`)은 상태가 바뀐 뒤 재조회하면 `nil`이 되므로, 이미 로드된 캐시에만 의존하는 코드는 `reload` 한 줄에 깨진다 → [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-branch-review.md)
- [x] Relation의 `Enumerable#select`(블록)는 이미 로드된 배열을 재사용하지만 `scope`(`.where`)는 로드 여부와 무관하게 새 Relation(= 새 쿼리)을 만든다 — 그래서 이미 `.includes`로 로드해둔 컬렉션을 다시 필터링할 땐 `scope`가 아니라 인스턴스 predicate를 써야 방금 고친 N+1이 다른 자리에 또 생기지 않는다 → [배운 작업](work-log/2026-07-30-ppback-pr-5504-comparison-review.md)
- [x] Read Replica 라우팅 (멀티 DB, `connects_to`/`connected_to`) → [정리](concepts/read-replica-routing.md) | [배운 작업](work-log/2026-07-03-controller-routing-and-read-replica.md)
- [x] `accepts_nested_attributes_for` — 부모 생성/수정 시 자식 레코드 배열을 한 번에 생성/수정/삭제 → [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md)
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
- [x] `let_it_be`(test-prof)와 `let`/`let!`의 차이 — 같은 example group 안에서 객체를 재사용하므로, 저장 없는 인메모리 속성 변경 시 다른 예제로 오염될 수 있음 → [레슨](lessons/0048-let-it-be-shared-object-pollution.html) | [배운 작업](work-log/2026-07-24-key-result-auto-checkin-reflect-api-exposure-review.md)
- [ ] Factory Bot으로 테스트 데이터 만들기
- [ ] Request spec vs Model spec
- [x] DB 정리 전략 (`DatabaseCleaner` `:transaction` vs `:truncation`) — `:transaction`은 예제를 **미커밋 트랜잭션으로 감싸서** 빠르게 되돌리는 대신, 그 픽스처가 **다른 커넥션에는 보이지 않는다.** `:truncation`은 실제로 커밋되지만 매 예제마다 테이블을 비워서 느리다 → [레슨](lessons/0054-database-cleaner-strategy-and-concurrency-spec.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md)
- [x] 다중 커넥션(스레드) 동시성 스펙 — 진짜 동시성 버그(lost update, 데드락)는 커넥션 2개를 실제로 띄워야 재현된다. 픽스처가 커밋돼 있어야 하므로 `:truncation` 전환이 전제. 부수적으로, 테스트 하네스가 연 트랜잭션은 `joinable: false`로 열려서 앱이 연 트랜잭션(`true`)과 `current_transaction.joinable?`로 구분할 수 있다 → [레슨](lessons/0054-database-cleaner-strategy-and-concurrency-spec.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md)
- [x] 태그 기반 스펙 제외 (`config.filter_run_excluding`)와 그 대가 — 느리거나 flaky한 스펙을 기본 스위트에서 빼는 표준 방법이지만, **CI에 별도 실행 스텝을 안 만들면 그 회귀 방어는 0이 된다** (초록 CI가 아무것도 보장하지 않게 됨) → [레슨](lessons/0054-database-cleaner-strategy-and-concurrency-spec.html) | [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md)

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
- [x] Grape custom validator 작성 (`Grape::Validations::Validators::Base`, `register_validator`, `validate_param!`) — 파라미터 타입 검증을 넘어 "지금 이 값을 써도 되는 상태인가"까지 처리 → [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md)
- [x] Grape::Entity의 `if:` 조건부 expose — 성능/페이로드 최적화용 게이팅과, 특정 분기에서만 SELECT되는 가상 컬럼 접근 시 `MissingAttributeError`를 막는 정합성 게이팅은 서로 다른 이유일 수 있음 → [레슨](lessons/0047-grape-entity-conditional-expose-two-natures.html) | [배운 작업](work-log/2026-07-24-key-result-auto-checkin-reflect-api-exposure-review.md)
- [x] Grape::Entity `options` 기반 조건부 필터링 — `if:`는 expose 자체를 게이팅하지만, expose된 컬렉션 안에서 개별 원소를 `options[:key]`로 `reject`하는 건 다른 메커니즘. 호출부마다 다른 필터 기준(`open_result_section_ids` 등)을 주입할 수 있는 대신, 그 옵션 값을 만드는 헬퍼가 어떤 범위로 스코프됐는지(예: 특정 process 기준인지 전체인지)를 놓치면 필터가 조용히 새는 게이트가 됨 → [배운 작업](work-log/2026-08-04-ppback-pr-5528-review.md)

### 권한

- [x] Pundit 정책(Policy)이란? → [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md)
- [ ] `policy_scope`란?
- [x] `authorize`란? (실패 시 `record.errors.add`로 사유 기록 → `errors.empty? && 조건`으로 최종 판정하는 패턴) → [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md)
- [x] `authorize`는 컨트롤러에서 명시적으로 호출한 곳에서만 강제됨 — 서비스 객체를 직접 호출하면 정책 체크가 통째로 우회됨 → [레슨](lessons/0046-pundit-authorize-scope-and-hr-admin-duality.html) | [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-manual-scenario-testing.md)
- [x] `has_flags`(비트마스크 플래그 컬럼) 패턴과, 같은 개념(HR admin)이 조인 테이블과 비트마스크 두 곳에 독립적으로 존재해 서로 어긋날 수 있다는 것 → [레슨](lessons/0046-pundit-authorize-scope-and-hr-admin-duality.html) | [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-manual-scenario-testing.md)
- [x] 테넌트 격리 가드 패턴 (멀티 workspace에서 FK 소속 검증) — 같은 user가 여러 workspace에 속할 수 있는 멀티테넌시에서는, 파라미터로 받은 id가 "존재하는가"가 아니라 "현재 요청 중인 workspace에 속하는가"를 별도로 확인해야 한다. `AppraisalProcess.joins(appraisal_group: :appraisal).exists?(id:, appraisals: { workspace_id: })` 같은 join + `exists?`로 소속을 검증하고, 실패 시 존재 자체를 노출하지 않도록 403이 아니라 404로 처리한다 → [배운 작업](work-log/2026-08-04-ppback-pr-5528-review.md)

### 도메인 이벤트

- [x] 문자열 상수(`event_type`)로 분기하는 도메인 이벤트를 추가할 때의 파급 범위 — enum이나 타입이 아니라 문자열이라 컴파일러가 누락을 안 잡아준다. 이벤트 하나 추가에 메시지 팩토리(안 넣으면 `raise`), 히스토리 스코프, 안읽음 카운트 제외 목록, 노출 제외 목록, 시리얼라이저, 엔티티의 `case`까지 6곳이 얽혔다 → [배운 작업](work-log/2026-07-27-key-result-auto-checkin-reflect-branch-review.md)
- [ ] 1:N 팬인(여러 하위 → 하나의 상위) 값 반영 semantics — 마지막이 이김 / 평균 / 합계 중 무엇이 기본이어야 하나

### 백그라운드 잡

- [ ] Sidekiq란?
- [x] 워커(Worker) 작성법 → [정리](concepts/sidekiq-job-argument-pipeline.md) | [배운 작업](work-log/2026-07-03-sidekiq-job-args-and-slack-investigation.md) · [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md)
- [x] `Sidekiq::Status` gem — `total`/`at`/`store`/`retrieve`로 벌크 job 진행률을 Redis에 기록하고 `job_id`로 폴링 조회 → [배운 작업](work-log/2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md)
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

- [x] 원자성(Atomicity) vs 멱등성(Idempotency) → [레슨](lessons/0031-atomicity-vs-idempotency.html) | [배운 작업](work-log/2026-07-06-pr-1294-transaction-atomicity-and-msa-discussion.md) · 장애를 분류하는 프레임이 아니라 **설계 도구로** 쓴 사례 — 값을 절대 대입하는 대신 매번 전량 재계산하게 바꾸니 "처리 순서가 결과를 바꾼다"는 문제 자체가 사라져, 모호한 배치를 탐지해 막던 밸리데이션을 통째로 폐기할 수 있었다 → [배운 작업](work-log/2026-08-06-key-result-auto-reflect-1n-split.md) · 둘은 서로를 대체하기도 한다 — 전량 재계산(멱등)이 있으면 값은 다음 실행에 자가복구되므로 **원자성을 포기하고 후처리를 커밋 뒤로 분리**하는 선택지가 열리고, 그 결정 하나가 동시성 방어 코드량을 크게 좌우한다 → [배운 작업](work-log/2026-08-11-ppback-pr-5532-lost-update-lock-review.md)
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
