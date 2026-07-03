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
- [ ] 1:1, 1:N, N:M 관계
- [ ] 인덱스(Index)란? 왜 필요한가
- [ ] 트랜잭션(Transaction)과 ACID
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
- [ ] 변수 종류 (지역, 인스턴스, 클래스, 전역)

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
- [ ] Gem이란? Bundler와 Gemfile

---

## 섹션 3. Rails 기초

### 프로젝트 구조

- [ ] Rails 디렉토리 구조 (`app/`, `config/`, `db/`)
- [x] `config/routes.rb` 역할 → [정리](concepts/rails-routing-and-controller-convention.md) | [배운 작업](work-log/2026-07-03-controller-routing-and-read-replica.md)
- [ ] `Gemfile`과 `bundle install`

### ActiveRecord (Model)

- [x] 모델(Model)이란? 테이블과의 관계 → [레슨](lessons/0011-activerecord-base-and-model-layer.html)
- [x] 마이그레이션(Migration)이란? → [정리](concepts/migration.md) | [배운 작업](work-log/2026-06-25-add-use-required-template.md)
- [x] 연관관계 (`belongs_to`, `has_many`, `has_one`, `has_many :through`) → [레슨](lessons/0008-active-record-associations.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [ ] 유효성 검사 (`validates`)
- [ ] 스코프(Scope)란?
- [x] 콜백 (`before_save`, `after_create` 등) → [레슨](lessons/0019-timestamps-and-hidden-callbacks.html) | [정리](concepts/timestamps-and-callbacks.md) | [배운 작업](work-log/2026-07-01-objective-updated-at-and-key-result-history.md)
- [x] Dirty Tracking이란? (`changed?`, `attribute_changed?`, partial writes) → [레슨](lessons/0020-dirty-tracking-and-partial-writes.html) | [정리](concepts/dirty-tracking.md) | [배운 작업](work-log/2026-07-01-objective-updated-at-and-key-result-history.md)
- [ ] 쿼리 메서드 (`where`, `find`, `find_by`, `includes`, `joins`)
- [x] N+1 문제란? `includes`로 해결하기 → [레슨](lessons/0009-n-plus-1.html) | [배운 작업](work-log/2026-06-29-sentry-appraisees-query-bug.md)
- [x] Read Replica 라우팅 (멀티 DB, `connects_to`/`connected_to`) → [정리](concepts/read-replica-routing.md) | [배운 작업](work-log/2026-07-03-controller-routing-and-read-replica.md)

### Controller

- [ ] 컨트롤러(Controller)란?
- [ ] 액션(Action)과 HTTP 메서드 매핑
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
- [ ] `params do` 블록으로 파라미터 정의
- [x] `desc`와 Swagger 문서 자동 생성 → [레슨](lessons/0022-data-wrapper-and-swagger.html) | [정리](concepts/data-wrapper-and-swagger.md) | [배운 작업](work-log/2026-07-03-pr-5489-review-and-data-wrapper.md)
- [ ] `before` 블록과 인증 처리

### 권한

- [ ] Pundit 정책(Policy)이란?
- [ ] `policy_scope`란?
- [ ] `authorize`란?

### 백그라운드 잡

- [ ] Sidekiq란?
- [ ] 워커(Worker) 작성법
- [ ] 큐(Queue) 종류와 우선순위
- [ ] 실패한 잡 재시도

### 기타

- [ ] Docker와 컨테이너 기초
- [ ] `docker compose` 명령어 흐름
- [ ] Redis란? 어디에 쓰이나
