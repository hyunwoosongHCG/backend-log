# Ruby Symbol vs String

2026-07-02 ppback `fix_history_information` PR(#5470) 리뷰 중, IDE에 열려있던
`app/workers/talent_sessions/start_worker.rb`의 `%i[feedbackpool multisource_feedbacks]`
코드를 보고 Symbol의 의미와 필요성을 학습했다.

**Evidence**: `talent_session_reference_data: { reference_data: %i[feedbackpool multisource_feedbacks] },`
코드를 `object_id` 비교(`:foo.object_id == :foo.object_id` → true, `"foo".object_id == "foo".object_id` → false)로
직접 확인하며 인터닝(interning) 개념을 검증.

**Implications**:
- Symbol(`:foo`)은 불변이며 프로세스 전체에서 항상 동일한 객체로 재사용되는 식별자. String은 매번 새로 만들어지는 가변 텍스트.
- `key:` 해시 키 축약형은 `:key => value`의 문법 설탕, `%i[a b]`는 `[:a, :b]`의 축약형.
- JS `Symbol()`과 이름은 같지만 동작은 정반대 — JS는 호출마다 유일한 값을 생성, Ruby는 항상 같은 값을 재사용. 별개 개념으로 구분해서 기억.
- 사용자 입력/화면 표시용 텍스트는 String, 코드 내부 고정 식별자(enum, 해시 키, 메서드 이름)는 Symbol이 관용적인 이유: 빠른 O(1) 비교 + 불변성 + "이건 코드용 값"이라는 의미 신호.
- Symbol은 JSON 직렬화 경계를 넘으면 String으로 바뀌므로 프로세스 내부통신에서만 의미가 있다.

관련: [concepts/symbol-vs-string.md](../concepts/symbol-vs-string.md)
