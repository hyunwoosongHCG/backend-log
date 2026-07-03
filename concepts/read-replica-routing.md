# Read Replica 라우팅 (Rails 멀티 데이터베이스)

> 섹션: 섹션 3. Rails 기초 / ActiveRecord (Model)

## 한 줄 정의

읽기 전용 쿼리를 주 DB(primary)가 아닌 별도의 복제 DB(replica)로 보내서 primary의 부하를 줄이는 Rails 멀티 데이터베이스 기능. `connects_to`로 커넥션 두 개(writing/reading)를 등록해두고, `connected_to(role: :reading)` 블록 안의 쿼리만 replica로 라우팅한다.

## 이해한 대로 설명

원래는 "v1은 ActiveRecord를 안 쓰고 v2는 쓴다"는 식의 차이가 있다고 생각했는데, 실제로는 v1/v2 버전 차이가 아니라 **레거시 Rails MVC 컨트롤러 vs 최근에 짜여진 Grape API 코드**의 차이였다. 레거시 컨트롤러는 ActiveRecord를 단순하게 직접 호출하고, 최근 Grape 코드(v1 폴더 안의 Grape 엔드포인트 포함)는 조회를 `connected_to` 블록으로 감싸서 읽기 전용 replica로 보낸다.

## 코드 예시

```ruby
# app/models/application_record.rb
class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  REPLICA_ENVS = %w[production staging dump demo].freeze

  if Rails.env.in?(REPLICA_ENVS)
    @@read_role = :reading
    connects_to database: { writing: :primary, reading: :replica }
  else
    @@read_role = :writing   # dev/test는 replica가 없어서 그냥 primary로
  end

  def self.read_role
    @@read_role
  end
end
```

```ruby
# app/controllers/v2/admins/multisource_feedbacks.rb
post 'list' do
  ActiveRecord::Base.connected_to(role: ApplicationRecord.read_role) do
    # 이 블록 안의 쿼리는 production/staging에서 replica DB로 라우팅됨
    multisource_feedbacks = MultisourceFeedbackPolicy::Scope.new(current_user, ...).admin_resolve
    ...
  end
end
```

레거시 컨트롤러(`app/controllers/multisource_feedbacks_controller.rb`)엔 이 패턴이 없다 — 그냥 `@workspace.multisource_feedbacks.new` 처럼 바로 씀. grep으로 세어보면 레거시 컨트롤러 33개 중 1개만 `connected_to`를 쓰고, Grape `v1/`은 121번, `v2/`는 169번 등장한다.

## 처음엔 헷갈렸던 것

"v1은 AR을 안 쓰고 v2는 쓴다"고 착각했다. 실제로는 둘 다 ActiveRecord를 쓰고(Rails인 이상 피할 수 없음), 차이는 **얼마나 최근에 짜여진 코드인지 + 얼마나 겹겹이 감쌌는지**(Policy Scope, Query 객체, read replica 라우팅)였다. "v1 vs v2"가 아니라 "레거시 vs 최신"이 진짜 경계선이라는 걸 코드를 직접 세어보고서야 확인했다.

## 배운 작업

- [2026-07-03 컨트롤러-라우터 분리 구조 & Read Replica](../work-log/2026-07-03-controller-routing-and-read-replica.md)

## 관련 개념

- [Rails 라우팅과 컨트롤러 관습](rails-routing-and-controller-convention.md)
