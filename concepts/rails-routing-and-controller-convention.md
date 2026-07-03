# Rails 라우팅과 컨트롤러 관습 (Convention over Configuration)

> 섹션: 섹션 3. Rails 기초 / 프로젝트 구조

## 한 줄 정의

Rails는 "어떤 URL+HTTP 메서드가 오면 어떤 컨트롤러의 어떤 메서드로 보낼지"를 `config/routes.rb` 라우팅 테이블에서 미리 선언해두고, 컨트롤러 파일 자체에는 라우팅 코드가 전혀 없다 — 연결은 이름 규칙(관습)으로 이뤄진다.

## 이해한 대로 설명

Express 같은 프레임워크는 라우트 등록과 핸들러가 한 줄에 붙어있다:

```js
app.post('/multisource_feedbacks', (req, res) => { ... })  // 경로 + 핸들러가 한 곳에
```

Rails는 이걸 완전히 분리한다. 라우팅 테이블에 `resources :multisource_feedbacks` 한 줄만 쓰면 RESTful 7종 라우트(index/show/new/create/edit/update/destroy)가 자동 생성되고, 자원 이름 `:multisource_feedbacks`를 카멜케이스로 바꿔 `MultisourceFeedbacksController`를 찾아 연결한다. 그래서 컨트롤러 파일만 봐서는 "이게 어떤 URL에서 호출되는지" 전혀 알 수 없고, 반드시 라우팅 테이블을 따로 봐야 한다. 이름이 정확히 일치하지 않으면(오타 등) 매칭 자체가 안 된다.

## 코드 예시

ppback은 라우팅이 3단계로 중첩된다:

```ruby
# config/routes.rb
Rails.application.routes.draw do
  scope :api do
    draw :v1   # config/routes/v1.rb 내용을 여기 통째로 끼워넣음
    draw :v2
  end
end

# config/routes/v1.rb
scope :v1 do
  resources :workspaces do
    resources :multisource_feedbacks do
      collection { get 'new' }
    end
  end
end
```

`rails routes -c multisource_feedbacks`로 확인한 실제 결과:

```
GET    /api/v1/workspaces/:workspace_id/multisource_feedbacks          → multisource_feedbacks#index
POST   /api/v1/workspaces/:workspace_id/multisource_feedbacks          → multisource_feedbacks#create
GET    /api/v1/workspaces/:workspace_id/multisource_feedbacks/:id      → multisource_feedbacks#show
PATCH  /api/v1/workspaces/:workspace_id/multisource_feedbacks/:id      → multisource_feedbacks#update
DELETE /api/v1/workspaces/:workspace_id/multisource_feedbacks/:id      → multisource_feedbacks#destroy
```

`:multisource_feedbacks` → `MultisourceFeedbacksController` → 파일 `app/controllers/multisource_feedbacks_controller.rb`. 세 곳의 이름이 전부 일치해야 연결된다.

## 처음엔 헷갈렸던 것

"컨트롤러 = 라우팅 + 핸들러"라고 생각했는데, Rails에서 컨트롤러는 순수 핸들러(액션 메서드) 모음일 뿐이고 라우팅은 완전히 별도 파일/DSL이라는 점. 그리고 그 둘의 연결이 명시적 코드(import, require 등)가 아니라 **이름이 맞아야만 연결되는 관습 기반**이라는 게 Express와 가장 다른 지점이었다.

반대로 같은 코드베이스의 Grape API(`v2/`)는 이런 관습이 없고 `mount V2::MultisourceFeedbacks`처럼 클래스를 명시적으로 마운트한다 — 그래서 Grape 파일 안에는 라우팅(`resource 'multisource_feedbacks' do get do ... end end`)과 핸들러가 같은 파일에 같이 있다. 오히려 Express와 구조적으로 더 비슷한 건 Grape 쪽이었다.

## 배운 작업

- [2026-07-03 컨트롤러-라우터 분리 구조 & Read Replica](../work-log/2026-07-03-controller-routing-and-read-replica.md)

## 관련 개념

- [Read Replica 라우팅](read-replica-routing.md)
