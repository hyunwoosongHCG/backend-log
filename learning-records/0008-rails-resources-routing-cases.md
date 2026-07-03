# Rails 리소스 라우팅의 경우의 수

2026-07-03 ppback `multisource_feedback_performance_rubocop` 브랜치 코드를 보다가,
`config/routes/v1.rb`의 `resources :multisource_feedbacks do collection { get 'new' } end`를 보고
"컨트롤러엔 메서드만 있는데 라우팅은 어디서 매칭되나", "이 한 줄에 `:id`가 붙은 라우트까지 왜 자동으로 생기나"를
Rails(`actionpack-7.2.3.1`) 소스코드를 직접 열어 추적하며 학습했다.

**Evidence**:
- `docker compose exec app rails routes -c multisource_feedbacks`로 실제 생성된 라우트 테이블을 확인 —
  `GET/POST /workspaces/:workspace_id/multisource_feedbacks`, `GET/PATCH/PUT/DELETE .../:id`,
  `GET .../new` 총 6개 라우트만 존재하고 `edit`은 없음을 확인.
- `actionpack-7.2.3.1/lib/action_dispatch/routing/mapper.rb`에서 `resources`, `Resource#default_actions`,
  `set_member_mappings_for_resource`, `path_for_action`, `CANONICAL_ACTIONS` 상수를 직접 읽고
  api_only 모드에서 `new`/`edit`이 빠지는 이유, canonical 액션이 URL에 이름을 안 붙이는 이유를 코드로 검증.

**Implications**:
- 컨트롤러 파일(`multisource_feedbacks_controller.rb`)엔 라우팅 코드가 전혀 없다 — Rails는 라우팅 테이블(`config/routes.rb`)과
  컨트롤러(핸들러)를 물리적으로 분리하고, 자원 이름(`:multisource_feedbacks`)을 컨트롤러 클래스명(`MultisourceFeedbacksController`)으로
  변환하는 **이름 규칙(관습)** 으로만 연결한다. Express처럼 라우트 등록과 핸들러가 한 줄에 붙어있는 구조와 정반대.
- `resources :x` 한 줄은 실제로 여러 겹의 조건 분기를 거쳐 라우트를 만든다: (1) `api_only` 여부로 액션 5개/7개 결정,
  (2) canonical 액션(`index/create/show/update/destroy`)은 URL에 이름을 안 붙이고 `edit`/커스텀 액션은 붙임,
  (3) `collection`/`member`/`new` 세 스코프 중 하나로 액션이 배치됨, (4) `only`/`except`로 액션 자체를 줄일 수 있음.
- `resources :x do ... end`의 `do...end` 블록은 기본 라우트를 **대체하는 게 아니라 추가**하는 것 — 블록을 통째로 지워도
  기본 5개(api_only 기준) 라우트는 그대로 생긴다. 처음엔 "블록에 있는 것만 라우트가 된다"고 착각했었다.
- 중첩된 `resources :workspaces do resources :multisource_feedbacks end`는 상위 자원의 `:id`를 URL 접두어로 강제해서,
  컨트롤러/Grape 양쪽 모두 `workspace_id` 기준 권한 스코프를 걸 수 있는 구조적 근거가 된다.

관련: [concepts/rails-routing-and-controller-convention.md](../concepts/rails-routing-and-controller-convention.md) ·
[레슨 23](../lessons/0023-rails-resources-routing-cases.html)
