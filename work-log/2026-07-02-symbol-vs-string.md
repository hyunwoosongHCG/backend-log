# Ruby Symbol vs String 개념 정리

> 날짜: 2026-07-02
> PR: (없음 — ppback `fix_history_information` 브랜치 리뷰 중 파생된 학습)

## 작업 한 줄 요약

ppback의 히스토리 information entity PR(#5470)을 리뷰하던 중, IDE에서 우연히 열린 `app/workers/talent_sessions/start_worker.rb`의 `%i[feedbackpool multisource_feedbacks]` 코드를 보고 Ruby Symbol의 의미와 필요성을 정리했다.

## 이 작업에서 처음 배운 개념

- [x] Symbol vs String → [정리](../concepts/symbol-vs-string.md)

## 작업하면서 막혔던 것

- JS만 해온 배경이라 `:foo` 표기가 낯설었고, 특히 JS의 `Symbol()`과 이름이 같아서 같은 개념으로 착각할 뻔했다.
  → JS `Symbol()`은 호출마다 유일한 값을 만드는 반면, Ruby `:foo`는 항상 같은 객체로 인터닝된다는 정반대 동작임을 확인하고 구분해서 기억하기로 함.
- `talent_session_reference_data:` 같은 해시 키 축약형과 `%i[...]` 심볼 배열 리터럴이 각각 무엇의 축약인지 몰랐음 → `:key => value`, `[:a, :b]`의 축약 문법임을 원형과 대조해서 확인.

## 다음에 더 공부하고 싶은 것

- 해시(Hash) 자체의 기초 문법과, 심볼 키 해시(`{ a: 1 }`) vs 문자열 키 해시(`{ "a" => 1 }`)가 실무에서 섞여 쓰이는 경우(JSON 파싱 결과 등)의 처리 패턴.
- `attr_accessor`, `send(:method_name)` 등 심볼이 메서드 이름으로 쓰이는 메타프로그래밍 사례.
