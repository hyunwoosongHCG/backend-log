# Symbol vs String

> 섹션: 섹션 2. Ruby 기초

## 한 줄 정의

Symbol(`:foo`)은 불변이며 프로세스 전체에서 항상 동일한 객체로 재사용(인터닝)되는 식별자 리터럴. String(`"foo"`)은 그때그때 새로 만들어지는 가변 텍스트 데이터.

## 이해한 대로 설명

겉보기엔 `:foo`도 `"foo"`처럼 텍스트를 담는 것 같지만 역할이 다르다. String은 "화면에 보여줄 텍스트, 사용자 입력, 바뀔 수 있는 데이터"에 쓰고, Symbol은 "코드 내부에서만 쓰는 고정된 이름표(키, enum 값, 메서드 이름)"에 쓴다.

핵심 차이는 **인터닝(interning)**이다. `:foo`는 코드 어디에 몇 번을 쓰든 항상 완전히 같은 객체다. 반면 `"foo"`는 리터럴을 새로 쓸 때마다 별개의 객체가 생긴다. 그래서 Symbol끼리 비교(`==`)는 정수 비교급으로 빠르고(O(1)), String 비교는 글자를 하나씩 훑어야 한다.

## 코드 예시

`app/workers/talent_sessions/start_worker.rb`에서 본 예:

```ruby
talent_session_reference_data: { reference_data: %i[feedbackpool multisource_feedbacks] },
```

- `talent_session_reference_data:` — 해시 키 축약형. `:talent_session_reference_data => ...`와 동일.
- `%i[feedbackpool multisource_feedbacks]` — 심볼 배열 리터럴 축약형. `[:feedbackpool, :multisource_feedbacks]`와 동일하며, 따옴표·콜론·쉼표 없이 공백으로만 나열한다.

`object_id`로 직접 확인하면 차이가 드러난다:

```ruby
:foo.object_id == :foo.object_id   # => true  (항상 같은 객체)
"foo".object_id == "foo".object_id # => false (매번 새 객체)
```

## JS Symbol과 헷갈리지 않기

이름은 같지만 동작은 정반대다.

- JS `Symbol()`은 호출할 때마다 **유일한** 값을 만든다: `Symbol('foo') !== Symbol('foo')`.
- Ruby `:foo`는 항상 **동일한** 객체다: `:foo == :foo`.

JS 배경에서 오면 이름 때문에 같은 개념으로 착각하기 쉬운데, 완전히 다른 개념으로 따로 기억해야 한다. 굳이 비유하자면 Ruby Symbol은 `const STATUS = { ACTIVE: 'active' }`처럼 고정된 enum 값을 언어 차원에서 인터닝해주는 것에 더 가깝다.

## 왜 여기서 String 대신 Symbol을 쓰나

- 사용자 입력이나 화면 표시용 텍스트가 아니라, 코드가 정의한 고정된 내부 식별자(enum 성격)이기 때문.
- 반복 비교·분기(`case`, `include?` 등)에서 String보다 빠르고 메모리도 덜 씀.
- 불변이라 실수로 값이 바뀌는 사고가 안 남.
- 단, JSON 직렬화 등 프로세스 경계를 넘는 순간 String으로 바뀌므로 Symbol은 프로세스 내부통신용으로만 의미가 있다.

## 관련 개념

- [해시(Hash)](hash.md) — 예정
- [클래스와 인스턴스](class-and-instance.md)
