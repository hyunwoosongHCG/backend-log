# DataWrapper와 Swagger 응답 스키마 자동 생성

> 섹션: 섹션 4. 실무 패턴 (Performance Plus) / Grape API

## 한 줄 정의

`DataWrapper`는 실제로 응답을 감싸는 코드가 아니라, "이 API는 `{ data: ... }` 모양으로 응답한다"는 걸 Swagger 문서 생성기에게 알려주는 **스키마 서술자(값 객체)**다.

## 이해한 대로 설명

프론트에서 OpenAPI/Swagger 스펙을 YAML로 손으로 적어본 적이 있다면, 그 response schema 부분을 Ruby 객체로 선언하는 셈이라고 보면 된다.

```ruby
success model: DataWrapper.new(Entities::MultisourceFeedbacks::MonitorEntity)
```

이 한 줄은 "응답은 `{ "data": <MonitorEntity 스키마> }` 형태다" 라고 문서에 박아넣으라는 뜻이다. 하지만 실제로 그 모양대로 응답을 조립하는 건 완전히 별개의 코드, 컨트롤러 안의 `present :data, ..., with: Entities::...` 호출이다. `DataWrapper`는 **문서(선언)** 이고, `present`는 **실행(구현)** 이다. 둘은 이름이 같은 `:data` 키를 쓰기로 "약속"되어 있을 뿐, 코드로 강제 연결되어 있지는 않다.

동작 흐름:
1. `config/initializers/grape_swagger.rb`에서 `GrapeSwagger.model_parsers.register(DataWrapperParser, DataWrapper)`로, "success model이 DataWrapper 타입이면 DataWrapperParser로 파싱해라"라고 grape-swagger에 등록해둔다.
2. Swagger 문서를 만들 때 grape-swagger가 `DataWrapper` 인스턴스를 만나면 `DataWrapperParser#call`을 호출한다.
3. 그 안에서 `is_array` 여부에 따라 `{ 'type' => 'object', '$ref' => '#/definitions/Entity이름' }` 또는 배열 형태 스키마를 만들고, `meta`/`meta_key`가 있으면 페이지네이션 같은 부가 필드도 스키마에 얹는다.

## 코드 예시

```ruby
# lib/types/data_wrapper.rb — 그냥 값을 들고 있는 객체
class DataWrapper
  attr_reader :model, :key, :is_array, :meta, :meta_key, :wrapper_name

  def initialize(model, wrapper_name: nil, key: :data, is_array: false, meta: false, meta_key: :meta)
    @model = model
    @key = key
    @is_array = is_array
    @meta = meta
    @meta_key = meta_key
  end
end

# lib/types/data_wrapper_parser.rb — 실제 스키마를 만드는 쪽
memo[wrapper.key] = if wrapper.is_array
                      { 'type' => 'array', 'items' => { '$ref' => "#/definitions/#{name}" } }
                    else
                      { 'type' => :object, '$ref' => "#/definitions/#{name}" }
                    end
memo[wrapper.meta_key] = wrapper.meta if wrapper.meta

# 사용 예 (배열 + 페이지네이션 메타)
success model: DataWrapper.new(Entities::Users::AdminObjectiveWeightEntity,
                                is_array: true,
                                meta_key: :total_pages,
                                meta: { type: 'Integer' })
```

## 처음엔 헷갈렸던 것

이름이 "Wrapper"라서 응답을 실제로 감싸는(runtime wrapping) 로직인 줄 알았다. 하지만 실체는 Swagger 문서용 메타데이터 객체일 뿐이고, 실제 응답 조립(`present :data, ...`)과는 코드상 분리되어 있어서 — 둘이 어긋나면 (예: `present`는 `:items`로 감싸는데 `DataWrapper`는 `:data`로 선언) 문서와 실제 응답이 다르게 나올 수 있다는 게 핵심이었다.

## 배운 작업

- [2026-07-03 PR #5489 리뷰 시각화 및 DataWrapper 학습](../work-log/2026-07-03-pr-5489-review-and-data-wrapper.md)

## 관련 개념

- [레슨 22 — DataWrapper와 Swagger 문서 자동 생성](../lessons/0022-data-wrapper-and-swagger.html)
- Grape::Entity (`../lessons/0010-grape-entity-and-n-plus-1-trace.html`)
