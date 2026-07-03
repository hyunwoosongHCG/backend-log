# Sidekiq job 인자: Marshal vs JSON 직렬화

> 섹션: 섹션 4. 실무 패턴 (Performance Plus) / 백그라운드 잡

## 한 줄 정의

Sidekiq job 인자는 원래도 Redis에 JSON으로 저장되지만, 인자로 넘기는 Ruby 객체(Symbol, BigDecimal, 커스텀 객체 등)가 JSON에 안전하지 않으면 문제가 생긴다. 팀은 이런 "복잡한 인자"를 관대하게 봐주던 옛 방식(넓은 의미의 Marshal적 관행)에서, 명시적으로 `.as_json` 변환을 강제하는 JSON 전용 방식으로 옮겨가는 중이다.

## 이해한 대로 설명

사내 Slack 스레드(2026-07-03, `theplus-back` PR 리뷰)에서 이런 흐름이 있었다:

1. 이원희님: "Sidekiq 8.1 기본값은 json인데, `json_allow_marshal`로 배포한 후 다음 스프린트에 json으로 바꾸자" — Marshal 모듈의 보안 취약점(조작된 데이터를 역직렬화하면 임의 코드 실행이 가능한, Ruby 생태계에서 유명한 이슈) 때문에 남긴 리뷰.
2. 최수호님: Sidekiq 7.0 업데이트로 hash를 그대로 못 넘기고 `params.as_json`으로 변환해서 넘겨야 하는 게 권장 방식이라 어쩔 수 없다며, 자동 변환 미들웨어(`SidekiqJsonSafeArgsMiddleware`)를 제안했다가 — 스스로 "그래도 직접 `as_json` 부르는 명시적 방식이 베스트"라고 정정.

`json_allow_marshal`은 Sidekiq 공식 문서에 없는 이름(직접 검색해서 확인)이라, `theplus-back` 팀이 업그레이드 과도기용으로 붙인 이름으로 추정된다. Sidekiq 공식 옵션 중 실제로 존재하는 건 `on_complex_arguments`(기본값 `:raise`)로, `:raise`(즉시 에러)/`:warn`(경고만)/`:allow`(허용) 중 고를 수 있다 — 아마 `:allow`나 `:warn`으로 완충 배포한 뒤, 문제 되는 호출부를 고치고 나서 기본값(`:raise`, 순수 json 강제)으로 넘어가려는 단계적 마이그레이션으로 보인다.

## 코드 예시

**미들웨어로 자동 변환(기각된 안)**:
```ruby
class SidekiqJsonSafeArgsMiddleware
  include Sidekiq::ClientMiddleware
  def call(_worker_class, job, _queue, _redis_pool)
    job['args'] = job['args'].map { |arg| arg.is_a?(Hash) || arg.is_a?(Array) ? arg.as_json : arg }
    yield
  end
end
```

**팀이 최종 선택한 방식 — 호출부에서 명시적으로 변환**:
```ruby
SomeWorker.perform_async(params.as_json, workspace_id, user_id)
```

**ppback 실제 코드 대비 — 아예 복잡한 데이터를 job 인자로 안 넘기는 더 나은 패턴**:
```ruby
# app/workers/group_multisource_feedback/response_bulk_upload_worker.rb
def perform(multisource_feedback_responses_bulk_data_id)   # 인자는 정수 id 하나뿐
  bulk_data = MultisourceFeedbackResponseSavedExcelDatum.find_by(id: multisource_feedback_responses_bulk_data_id)
  params = bulk_data.payload.deep_symbolize_keys   # 엑셀 파싱 결과는 DB에 저장해두고 여기서 조회
  ...
end

# 대조 — app/controllers/v1/appraisals/appraisals.rb:253
# 엑셀 업로드 params(BigDecimal 포함, 대용량) 전체를 job 인자로 그대로 넘기는 케이스
Appraisal::CreateBulkAppraisalsWorker.perform_async(params, workspace.id, current_user.id, 'appraisal_bulk')
```

## 처음엔 헷갈렸던 것

"미들웨어로 자동 변환하면 편한데 왜 안 쓰나"가 의아했다. 답은 — 미들웨어는 **enqueue 시점의 변환**만 감출 뿐, `perform` 쪽에서 "이 인자는 JSON 왕복을 거쳐 타입이 바뀌었다"(symbol 키 → string 키, `BigDecimal` → 문자열)는 지식은 여전히 필요하다는 것. 그 지식을 호출부에서 보이지 않게 감추면, 워커를 작성/유지보수하는 사람(또는 AI)이 오히려 더 찾기 어려워진다 — 그래서 "명시적으로 `as_json`을 부르자"는 결론이 합리적이었다.

## 배운 작업

- [2026-07-03 Sidekiq job 인자 직렬화 & Slack 스레드 조사](../work-log/2026-07-03-sidekiq-job-args-and-slack-investigation.md)

## 관련 개념

- [Sidekiq이 인자를 워커로 넘기는 파이프라인](sidekiq-job-argument-pipeline.md)
