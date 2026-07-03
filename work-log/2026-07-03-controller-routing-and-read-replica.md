# 컨트롤러-라우터 분리 구조 & Read Replica 라우팅

> 날짜: 2026-07-03
> PR: (없음 — ppback `multisource_feedback_performance_rubocop` 브랜치 코드 탐색)

## 작업 한 줄 요약

`app/controllers/multisource_feedbacks_controller.rb`(레거시 Rails MVC)와 `app/controllers/v2/admins/multisource_feedbacks.rb`(Grape)를 비교하다가, "v1/v2는 ActiveRecord 사용 여부가 다른가?"와 "컨트롤러엔 왜 메서드만 있고 라우팅은 어디 있나?" 두 가지를 코드로 직접 추적해서 확인했다.

## 이 작업에서 처음 배운 개념

- [x] [Rails 라우팅과 컨트롤러 관습](../concepts/rails-routing-and-controller-convention.md) — `config/routes.rb` 역할
- [x] [Read Replica 라우팅](../concepts/read-replica-routing.md) (멀티 DB, `connects_to`/`connected_to`)

## 작업하면서 막혔던 것

- "v1은 ActiveRecord를 안 쓰고 v2는 쓴다"는 가설을 세웠는데, `grep -rn connected_to app/controllers/v1`와 `v2`를 각각 세보니 121번 vs 169번으로 **둘 다** 많이 썼다. → 진짜 경계선은 v1/v2가 아니라 **레거시 최상위 `*_controller.rb`(33개 중 1개만 `connected_to` 사용) vs Grape API(`v1/`, `v2/` 둘 다 최근 코드)** 라는 걸 숫자로 확인하고서야 가설을 수정했다.
- "컨트롤러에 라우팅 코드가 없는데 어떻게 요청이 매칭되나"가 헷갈렸다. → `config/routes.rb`(`scope :api do draw :v1 end`) → `config/routes/v1.rb`(`scope :v1 do resources :multisource_feedbacks end`) 3단계 체인을 직접 따라가고, `docker compose exec app rails routes -c multisource_feedbacks`로 실제 라우팅 테이블을 찍어서 `:multisource_feedbacks` 심볼이 `MultisourceFeedbacksController`로 이름 규칙만으로 연결된다는 걸 확인했다.

## 다음에 더 공부하고 싶은 것

- Grape 쪽(`v2/`)은 라우팅+핸들러가 한 파일에 있는데, 정확히 어떤 DSL로 URL을 등록하는지(`resource`, `mount`) 더 자세히
- `connected_to(role: :reading)` 블록 안에서 실수로 쓰기 쿼리를 하면 어떻게 되는지 (replica가 read-only DB 유저라 에러가 나는지, 아니면 조용히 primary로 새는지)
