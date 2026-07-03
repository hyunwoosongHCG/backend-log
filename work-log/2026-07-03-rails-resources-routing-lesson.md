# Rails 리소스 라우팅의 경우의 수 (레슨 23)

> 날짜: 2026-07-03
> PR: (없음 — `/teach` 스킬로 진행한 학습 세션, ppback `multisource_feedback_performance_rubocop` 브랜치 코드 기반)

## 작업 한 줄 요약

`config/routes/v1.rb`의 `resources :multisource_feedbacks do collection { get 'new' } end`를 실마리로,
Rails `resources`가 실제로 몇 가지 조건 분기를 거쳐 라우트를 만드는지(api_only 여부, canonical 액션, collection/member/new 스코프,
only/except, 커스텀 블록의 추가 vs 대체, nested resources) Rails 프레임워크 소스코드(`actionpack-7.2.3.1`)를 직접 읽어가며
인터랙티브 레슨(레슨 23)으로 정리했다.

## 이 작업에서 처음 배운 개념

- [x] [액션(Action)과 HTTP 메서드 매핑](../concepts/rails-routing-and-controller-convention.md) → [레슨 23](../lessons/0023-rails-resources-routing-cases.html)

## 작업하면서 막혔던 것

- `resources :multisource_feedbacks do collection { get 'new' } end`에서 `get 'new'`만 눈에 보여서
  "그럼 show/update/destroy는 어디서 온 거지?"라고 착각했다. → Rails `resources` 메서드 소스를 직접 읽어서
  `yield if block_given?`(사용자 블록 실행)과 그 아래 무조건 실행되는 기본 액션 생성 코드가 분리되어 있다는 걸 확인 —
  블록은 "추가"이지 "대체"가 아니었다.
- `rails routes`에 왜 `edit`이 안 나오는지 처음엔 우연이라고 생각했는데, `Resource#default_actions`가
  `api_only` 플래그에 따라 아예 다른 액션 목록을 반환한다는 걸 소스에서 확인하고서야 확실해졌다.

## 다음에 더 공부하고 싶은 것

- `shallow: true` 옵션 — 중첩 라우트에서 member 라우트만 상위 프리픽스를 생략하는 경우
- Grape API(`v2/`)는 왜 이런 "관습 기반 매칭"을 안 쓰고 명시적 `mount`/`resource` DSL을 쓰는지, 설계 철학 차이
