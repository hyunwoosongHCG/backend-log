# Sidekiq job 인자 직렬화 & Slack 스레드 조사

> 날짜: 2026-07-03
> PR: (없음 — 사내 Slack 스레드 해석 + ppback/Sidekiq gem 소스 조사)

## 작업 한 줄 요약

Slack에 공유된 SB(백엔드 스쿼드) 스레드 링크를 해석하다가 `theplus-back`의 Sidekiq 8.1 업그레이드 논의(`json_allow_marshal`, `SidekiqJsonSafeArgsMiddleware`)로 이어졌고, 최종적으로 "Sidekiq이 `perform_async` 인자를 실제로 어떻게 워커의 `perform`까지 전달하는지"를 gem 소스(`sidekiq-6.5.12`)로 직접 검증했다.

## 이 작업에서 처음 배운 개념

- [x] [Sidekiq이 인자를 워커로 넘기는 파이프라인](../concepts/sidekiq-job-argument-pipeline.md) — `perform_async` → job Hash → client middleware → JSON 직렬화 → Redis → `perform(*args)`
- [x] [Sidekiq job 인자: Marshal vs JSON 직렬화](../concepts/sidekiq-marshal-vs-json-serialization.md) — 보안 이유로 JSON 전환, `on_complex_arguments`, 명시적 `as_json`이 미들웨어 자동변환보다 나은 이유

## 작업하면서 막혔던 것

- `json_allow_marshal`이라는 이름을 Sidekiq 공식 문서/GitHub 이슈/RubyDoc 어디서도 찾을 수 없었다. → `on_complex_arguments`(Sidekiq 7.1+ 실제 공식 옵션, 기본값 `:raise`)라는 진짜 기능을 찾아서, `json_allow_marshal`은 팀이 마이그레이션 과도기에 붙인 자체 이름일 가능성이 높다는 결론으로 정리(단, `theplus-back` 리포를 직접 열어보지 못해 100% 확정은 아님).
- "미들웨어로 자동 `as_json` 처리하면 편한데 왜 명시적으로 하자고 했을까"가 처음엔 이해가 안 갔다. → enqueue 시점 변환을 감추는 것과, `perform`이 받는 데이터 모양이 바뀐다는 지식(symbol→string 키, BigDecimal→문자열)을 워커 작성자가 여전히 알아야 한다는 건 별개라는 걸 깨닫고 나서야 "명시적 방식이 낫다"는 팀 결론에 납득했다.
- 미들웨어 코드 `job['args'].map { |arg| ... }`의 `arg`가 정확히 뭘 가리키는지 몰라서, `sidekiq/worker.rb`(`perform_async`), `sidekiq/client.rb`(`push`), `sidekiq/processor.rb`(`execute_job`)를 직접 열어 `args`가 언제 배열로 포장되고 언제 다시 풀리는지 전체 파이프라인을 추적해서 확인했다.

## 다음에 더 공부하고 싶은 것

- Sidekiq server middleware(워커가 실행되기 직전/직후에 끼는 것)는 client middleware와 훅 타이밍이 어떻게 다른지
- 엑셀 업로드처럼 대용량 데이터를 job 인자로 넘기는 대신 DB/S3에 저장하고 참조 id만 넘기는 패턴(`ResponseBulkUploadWorker`)을, 왜 `appraisals.rb`의 bulk API는 아직 안 쓰고 있는지 — 리팩토링 여지가 있는지
