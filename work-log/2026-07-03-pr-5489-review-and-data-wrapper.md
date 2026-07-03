# PR #5489 리뷰 시각화 및 DataWrapper(Swagger 스키마) 개념 학습

> 날짜: 2026-07-03
> PR: https://github.com/hcgtheplus/ppback/pull/5489 (`multisource_feedback_performance_rubocop`)

## 작업 한 줄 요약

PR #5489(360피드백 어드민 API N+1/성능 개선 + 보안 스코프 수정 + 루보캅 스타일 정리)의 인라인 리뷰 코멘트 14개를 GitHub REST/GraphQL API로 모아 보안/성능/스타일/후속조치 카테고리로 나눠 터미널에 시각화했다. 그 과정에서 리뷰에 등장한 `DataWrapper` 클래스의 실체를 코드 추적으로 파악했다.

## 이 작업에서 처음 배운 개념

- [x] `desc`와 Swagger 문서 자동 생성 (`DataWrapper`) → [정리](../concepts/data-wrapper-and-swagger.md)

## 작업하면서 막혔던 것

- `gh pr view --json reviews`로 리뷰 목록을 보면 각 리뷰의 `body`가 전부 빈 문자열이었다. 처음엔 "리뷰 내용이 없나?" 싶었는데, 이건 **라인별 인라인 코멘트만 남기고 리뷰 전체에 대한 요약 코멘트(body)는 안 쓴 경우**라 그런 것이었다. → `gh api repos/.../pulls/5489/comments`로 인라인 코멘트 자체를 가져오고, GraphQL `reviewThreads { isResolved, comments }` 쿼리로 각 스레드의 resolved 여부까지 확인해서 해결.
- 코멘트 작성자(`epicari`)가 리뷰어인 줄 알았는데 `gh pr view --json author`로 확인해보니 **PR 작성자 본인**이었다. 즉 이 14개 코멘트는 "리뷰어의 지적"이 아니라 "작성자가 diff에 남긴 변경 근거 셀프노트"였고, 이 차이를 놓치면 리뷰 상태를 완전히 잘못 해석할 뻔했다.
- `DataWrapper`라는 이름 때문에 실제로 응답을 감싸는 런타임 로직인 줄 알았는데, `lib/types/data_wrapper.rb` / `data_wrapper_parser.rb` / `config/initializers/grape_swagger.rb`를 따라가 보니 **Swagger 문서용 스키마 선언 객체**일 뿐이고, 실제 응답 조립은 `present :data, ...` 쪽이 따로 한다는 걸 확인했다.

## 다음에 더 공부하고 싶은 것

- grape-swagger의 `model_parsers.register` 전체 흐름 — `DataWrapper` 말고 기본 `Entity` 자체는 어떻게 파싱되는지
- Swagger 문서 선언(`DataWrapper`)과 실제 런타임 응답(`present`)이 어긋나는 걸 막는 방법(스펙 테스트로 응답 shape 검증 등)
