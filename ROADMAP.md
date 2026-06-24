# 백엔드 학습 로드맵

> 체크 형식: `- [x] 개념 → [정리](concepts/개념.md) | [배운 작업](work-log/날짜-작업명.md)`

---

## 섹션 1. 백엔드 기초 (언어 무관)

### 웹과 HTTP

- [ ] HTTP란? (Request / Response 사이클)
- [ ] URL 구조와 엔드포인트
- [ ] HTTP 메서드 (GET, POST, PUT, PATCH, DELETE)
- [ ] HTTP 상태 코드 (2xx, 4xx, 5xx)
- [ ] 헤더(Header)와 바디(Body)
- [ ] 쿠키(Cookie) vs 세션(Session) vs 토큰(Token)

### REST API

- [ ] REST란? (RESTful 설계 원칙)
- [ ] JSON 데이터 형식
- [ ] API 버전 관리 (v1, v2)
- [ ] API 요청/응답 구조 설계

### 아키텍처

- [ ] MVC 패턴 (Model, View, Controller)
- [ ] 서비스 레이어(Service Layer)란?
- [ ] 미들웨어(Middleware)란?
- [ ] 모놀리식 vs 마이크로서비스

### 데이터베이스 기초

- [ ] 관계형 데이터베이스(RDB)란?
- [ ] 테이블, 컬럼, 로우
- [ ] 기본키(PK)와 외래키(FK)
- [ ] 1:1, 1:N, N:M 관계
- [ ] 인덱스(Index)란? 왜 필요한가
- [ ] 트랜잭션(Transaction)과 ACID
- [ ] SQL 기본 (SELECT, INSERT, UPDATE, DELETE)
- [ ] JOIN이란?

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
- [ ] Symbol vs String
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

- [ ] 클래스(Class)와 객체(Object)
- [ ] 인스턴스 메서드 vs 클래스 메서드
- [ ] 상속(Inheritance)
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
- [ ] `config/routes.rb` 역할
- [ ] `Gemfile`과 `bundle install`

### ActiveRecord (Model)

- [ ] 모델(Model)이란? 테이블과의 관계
- [ ] 마이그레이션(Migration)이란?
- [ ] 연관관계 (`belongs_to`, `has_many`, `has_one`, `has_many :through`)
- [ ] 유효성 검사 (`validates`)
- [ ] 스코프(Scope)란?
- [ ] 콜백 (`before_save`, `after_create` 등)
- [ ] 쿼리 메서드 (`where`, `find`, `find_by`, `includes`, `joins`)
- [ ] N+1 문제란? `includes`로 해결하기

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
- [ ] 엔티티(Entity)란? (Grape::Entity)
- [ ] `present`로 응답 만들기
- [ ] `params do` 블록으로 파라미터 정의
- [ ] `desc`와 Swagger 문서 자동 생성
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
