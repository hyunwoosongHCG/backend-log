# Teaching Notes

## 사용자 프로필

- **배경**: React/TypeScript 프론트엔드 개발자 → Rails 백엔드 개발자 전환 중
- **현재 프로젝트 (실무)**: Performance Plus (Rails 7.2, Ruby 3.4, Grape API, MySQL, Sidekiq, Pundit)
- **현재 프로젝트 (자체)**: 뿌(부동산을 부탁해) — Java 21, Spring Boot, PostgreSQL+PostGIS. 백엔드 전담. **자바는 처음이다**
- **학습 방식**: 실무 작업을 통해 배운다 — 강의 순서가 아닌 작업 순서로
- **자바/스프링은 강의를 듣지 않는다**: 인프런 김영한 로드맵의 커리큘럼 목차만 커버리지 기준으로 쓰고(ROADMAP 7-B, 203항목), 뿌를 바이브 코딩하면서 필요한 순간에 레슨으로 배운다. 자바 트랙 레슨은 `lessons/java-NN-*.html`, `index.html` 의 `track: 'java'`

## 교육 선호

- **React 비유를 최대한 활용**: 이미 아는 개념으로 연결하면 이해 속도가 빠름
  - `extends React.Component` → `< ActiveRecord::Migration`
  - TypeScript 타입 → DB 스키마
  - 이벤트 핸들러 → 컨트롤러 액션
- **개념 먼저, 코드 나중**: 왜 필요한지 → 어떻게 생겼는지 → 실무 예시 순서
- **코드는 실무 코드 기반**: Performance Plus 실제 코드를 예시로 사용할 것. 자바 트랙은 뿌에서 곧 쓸 코드(엔티티·DTO·수집기) 형태로 예시를 든다
- **A-Z 설명**: 당연한 것도 설명한다 (백엔드 기초가 없으므로)
- **자바 트랙은 퀴즈(객관식)뿐 아니라 코드 타이핑 연습도 포함**: 문법을 직접 손으로 쳐보며 감을 익히고 싶어함 (2026-09-29). 위젯은 `assets/code-practice.js` + `.code-practice` 마크업, 개념 예제 직후 배치. 상세 규칙은 `~/.claude/skills/teach/SKILL.md`의 "코드 타이핑 연습 위젯" 절 참고

## 이미 알고 있는 것 (가르치지 않아도 됨)

- React, TypeScript, 컴포넌트 구조
- HTTP 메서드 (GET, POST 등) — 프론트 개발 경험으로 알고 있음
- JSON 형식
- Git 기본 사용

## 이미 학습한 개념 (기초 설명 불필요)

- 마이그레이션(Migration) — 2026-06-25
- 클래스와 인스턴스 — 2026-06-25
- 상속과 오버라이드 — 2026-06-25
- 자동 타임스탬프 관리 (created_at/updated_at, 숨은 콜백) — 2026-07-01
- Dirty Tracking / Partial Writes (changed?, attribute_changed?) — 2026-07-01
- Symbol vs String (인터닝) — 2026-07-02
- DataWrapper / grape-swagger 응답 스키마 자동 생성 — 2026-07-03
- Read Replica 라우팅 (connects_to/connected_to, 멀티 DB) — 2026-07-03
- Rails 리소스 라우팅 (resources, canonical actions, collection/member/new, only/except, nested) — 2026-07-03
- 행 잠금(Row Locking)과 동시성 제어 (with_lock, SELECT ... FOR UPDATE, 데드락) — 2026-07-15
- 인덱스(Index)와 복합 인덱스 Leftmost-Prefix 규칙 — 2026-07-15
- 트랜잭션 격리 수준(Isolation Level), Dirty/Non-Repeatable/Phantom Read, Lost Update — 2026-07-16
- 중첩 트랜잭션과 requires_new(SAVEPOINT) — 락 조기 해제는 안 됨, 부분 실패 격리만 됨 — 2026-07-24
- Pundit `authorize`는 컨트롤러 전용, `has_flags` 비트마스크와 조인 테이블 두 곳에 독립적으로 존재하는 "HR admin" — 2026-07-27
- 트랜잭션 경계 소유권 — 서비스를 블록으로 감싸면 그 서비스가 트랜잭션을 열 때 경계가 이동한다 — 2026-08-11
- `ActiveSupport::CurrentAttributes` (요청/잡 단위 스레드 로컬 상태, executor가 자동 리셋) — 2026-08-11
- DatabaseCleaner `:transaction` vs `:truncation`, 다중 커넥션 동시성 스펙, `filter_run_excluding`의 CI 공백 — 2026-08-11
- MySQL REPEATABLE READ read view 고정 **시점** (`FOR UPDATE`는 안 열고 첫 비잠금 SELECT가 연다) — 2026-08-11
- DB 컬럼 `default`는 CREATE에서만 작동하고 UPDATE에서 명시적 `nil` 대입은 막아주지 않는다 (`key?`로 "안 보냄"과 "명시적 null"을 구분해야 함) — 2026-08-27
- [자바] 클래스 정의 = 타입 생성, 명목적 타이핑(이름이 다르면 다른 타입), 필드 자동 초기화와 기본형의 "값 없음" 표현 불가 — 2026-09-21
- [자바] 값 복사 대원칙(항상 복사, 복사되는 게 값이냐 주소냐만 다름), 메서드 호출도 대입이라 재대입은 원본에 안 보임, `Integer`→`int` 언박싱 NPE — 2026-09-29
- [자바] 객체 지향 = 데이터+기능을 한 객체 안에 묶기(캡슐화), `this`는 지금은 생략 가능(이름 충돌 없어서)하고 생성자에서 필수가 됨 — 2026-09-29
- [자바] 생성자 이름=클래스명·반환타입 없음, 매개변수-필드 이름 충돌 시 `this` 필수(안 쓰면 조용히 틀림), 생성자를 하나라도 쓰면 기본 생성자 소멸, `this(...)`는 첫 줄에서만 — 2026-09-29
- [Spring/JPA] 엔티티 로딩 = 빈 생성자로 껍데기 생성(1단계) → DB 값을 리플렉션으로 필드에 직접 대입(2단계, 생성자 코드는 안 거침) — Rails `allocate` + ivar 직접 대입과 같은 구조. JPA `@Entity`(DB 매핑, ActiveRecord에 대응)와 Grape `Entity`(API 응답 모양, DTO에 대응)는 이름만 같고 완전히 다른 계층 — 2026-09-29
- [자바] 패키지 = 이름공간(폴더), `a.b`는 `a`와 완전히 무관(계층처럼 보이지만 상속 없음), 겹치는 클래스명은 FQCN으로 구분, 패키지 이름=디렉터리 구조는 컴파일러가 강제 — 2026-09-29
- [자바] `package` 선언 없는 클래스는 "이름 없는 패키지"에 속하고, 이름 있는 패키지에서는 이걸 `import` 자체를 못 함(언어 사양). `java-15`의 `default` 접근 제어자와는 완전히 다른 개념인데 이름만 같음 — 2026-09-29
- [자바] 접근 제어자 4단계(`private > default > protected > public`), `default`=같은 패키지, `protected`=같은 패키지+상속. Ruby `private`/`protected`는 이름만 같고 뜻이 다름(리시버 유무 규칙이지 범위 아님). JPA 빈 생성자가 `protected`인 이유: `public`이면 아무나 빈 엔티티 생성 가능, `private`이면 Hibernate 프록시(상속 관계)가 호출 못 함 — 2026-09-29

## 주의사항

- 한국어로 가르친다
- 전문 용어는 영어 원문 병기 (예: 마이그레이션(Migration))
- 퀴즈 보기는 글자 수를 맞춘다 (힌트 방지)
