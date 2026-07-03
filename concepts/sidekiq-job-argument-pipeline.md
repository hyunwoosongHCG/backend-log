# Sidekiq이 인자를 워커로 넘기는 파이프라인

> 섹션: 섹션 4. 실무 패턴 (Performance Plus) / 백그라운드 잡

## 한 줄 정의

`perform_async(a, b, c)`에 넘긴 인자는 `args`라는 배열에 담겨 Hash("job")가 되고, 이 Hash가 JSON 문자열로 직렬화되어 Redis에 저장됐다가, 나중에 워커 프로세스가 다시 파싱해서 `perform(*args)`로 스플랫(splat)해 풀어준다.

## 이해한 대로 설명

프론트 비유로는 `fetch(url, { body: JSON.stringify(payload) })`(보내기 전 직렬화) → 서버의 `JSON.parse(req.body)`(받고 나서 역직렬화)와 완전히 같은 구조다. 다른 점은 Sidekiq이 그 "직렬화 직전" 타이밍에 개발자가 끼어들 수 있는 미들웨어 훅(client middleware)을 공식적으로 열어뒀다는 것.

## 코드 예시

Sidekiq 6.5.12 gem 소스로 직접 확인한 파이프라인:

```ruby
# ① sidekiq/worker.rb:194 — perform_async가 위치 인자를 배열로 포장
def perform_async(*args)
  @klass.client_push(@opts.merge("args" => args, "class" => @klass))
end
# perform_async(params, workspace_id, user_id, 'appraisal_bulk')
# → job = { "args" => [params, workspace_id, user_id, 'appraisal_bulk'], "class" => ..., ... }

# ② sidekiq/client.rb:72 — 미들웨어 체인이 "아직 JSON이 되기 전" job Hash를 가로챈다
def push(item)
  normed = normalize_item(item)
  payload = middleware.invoke(item["class"], normed, normed["queue"], @redis_pool) { normed }
  raw_push([payload])   # 여기서 JSON.generate 후 Redis LPUSH
end

# ③ 커스텀 client middleware 예시 — job['args']는 이 시점엔 순수 Ruby 객체 배열
class SidekiqJsonSafeArgsMiddleware
  include Sidekiq::ClientMiddleware
  def call(_worker_class, job, _queue, _redis_pool)
    job['args'] = job['args'].map { |arg| arg.is_a?(Hash) || arg.is_a?(Array) ? arg.as_json : arg }
    yield
  end
end

# ④ sidekiq/processor.rb:201 — 워커 프로세스가 꺼내서 다시 위치 인자로 풀어줌
def execute_job(inst, cloned_args)
  inst.perform(*cloned_args)
end
```

전체 흐름:
```
perform_async(a, b, c)
  → args = [a, b, c]                       (*args로 배열 포장)
  → job = { "args" => [a, b, c], ... }
  → 클라이언트 미들웨어 체인 (아직 Ruby 객체 상태 — 여기서 검사/변형 가능)
  → JSON.generate(job) → Redis LPUSH
  ⋯ (워커 프로세스가 나중에 꺼냄) ⋯
  → JSON.parse → job Hash 복원
  → 서버 미들웨어 체인
  → inst.perform(*job['args'])             (배열을 다시 위치 인자로 스플랫)
```

## 처음엔 헷갈렸던 것

미들웨어 코드의 `job['args'].map { |arg| ... }`에서 `arg`가 뭘 가리키는지 헷갈렸다. `job['args']`는 `perform_async`에 넘긴 **모든 위치 인자를 순서대로 담은 배열**이고, `arg`는 그 배열을 순회하며 하나씩 꺼낸 **개별 인자 하나**(예: 4개 인자를 넘겼으면 `map`이 4번 돈다)라는 걸 gem 소스를 직접 읽고서야 명확해졌다.

## 배운 작업

- [2026-07-03 Sidekiq job 인자 직렬화 & Slack 스레드 조사](../work-log/2026-07-03-sidekiq-job-args-and-slack-investigation.md)

## 관련 개념

- [Sidekiq Marshal vs JSON 직렬화](sidekiq-marshal-vs-json-serialization.md)
