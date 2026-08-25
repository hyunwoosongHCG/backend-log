# 핵심성과 자동 반영 — 목표 일괄 승인 동기/비동기 재설계 구조적 레퍼런스 조사

> 날짜: 2026-08-25
> PR: https://github.com/hcgtheplus/ppback/pull/5532 (재설계, 커밋 2 관련)
> 브랜치: `feature/key-result-auto-checkin-reflect`
> 관련 기록: [08-19 결정 연대기](2026-08-19-key-result-auto-reflect-decision-timeline.md)

## 작업 한 줄 요약

커밋 2(사용자 목표 일괄 승인 `PUT /v2/objectives/batch_approval`을 목표별 트랜잭션으로 쪼개는 작업)가 "목표는 job+폴링, 가중치는 동기"라는 대기 UI 이원화 문제로 프론트(하늘님)와의 논의가 멈춘 상태에서, 코드베이스에 이미 있는 유사 패턴(어드민 비동기 목표 승인 워커, 엑셀 업로드 job 인프라, Sidekiq/Puma 동시성 설정, 기존 부분실패 응답 선례 유무)을 4개 병렬 조사로 추적해 "동기 유지 + errors 추가" 안과 "동기 유지 + 전용 큐 + 서버 대기" 안 중 어느 쪽이 실제 레포 구조에 맞는지 근거를 확보했다.

## 이번 작업에서 처음 배운 개념

- **웹 서버 동시성(Puma workers×threads)과 백그라운드 큐 동시성(Sidekiq concurrency)은 완전히 분리된 자원 풀이다** — 팀 논의에서 나온 "레드존 점유(운영 16개 중 1개)"라는 표현을 처음엔 Sidekiq 쪽 숫자로 짐작했는데, `config/sidekiq.yml:9`의 concurrency는 10이고 "16"의 실제 근거는 `config/puma.rb:39,12-14,42-51`의 `production 2 workers × max_threads_count 8 = 16`이었다. 동기 엔드포인트가 오래 걸리면 점유되는 건 Sidekiq 워커 슬롯이 아니라 **웹 요청을 받는 Puma 스레드**라는 걸 코드로 확인하고서야 두 숫자가 왜 다른 자원인지 감이 잡혔다.
- **Sidekiq은 큐 단위로 gem을 얹어 concurrency를 개별 제한할 수 있다 (`sidekiq-limit_fetch`)** — `config/sidekiq.yml:20-21`에서 `performance_workers` 큐만 `concurrency: 1`로 눌러놓은 걸 보고 처음 알았다. 처리량을 나누려는 목적이 아니라 **그 큐에 올라간 job들이 서로 동시에 실행되지 못하게 강제로 직렬화**하려는 목적이다 — 락으로 순서를 강제하는 대신 큐 자체의 동시성을 1로 눌러 같은 효과를 내는 방식이 실제 설정에 있었다.
- **락 보유 시간 문제와 요청 스레드 점유 시간 문제는 서로 다른 축이라 각각 다른 해법이 필요하다.** 원 PR(#5532)이 revert된 원인은 "목표별 락을 오래 들고 있어 락 걸린 목표가 제한적 서비스만 받는" 것이었는데, 이건 하나의 트랜잭션이 N개 목표를 다 처리할 때까지 커밋을 미뤄서 그 안에서 잡은 모든 락이 트랜잭션이 끝날 때까지 안 풀리기 때문이다. 목표별로 트랜잭션을 쪼개면(커밋 2) 락은 각 목표 처리가 끝나는 즉시 풀린다 — **이건 동기냐 비동기냐와 무관하게 해결된다.** 반면 "레드존 점유"는 요청 하나가 N개 목표를 순차 처리하는 동안 Puma 스레드 하나를 붙들고 있다는, 완전히 다른 문제다. 이 둘을 분리해서 보니 "목표별 트랜잭션 전환" 자체는 이미 확정해도 되는 결정이고, 진짜 논쟁거리(job+폴링 여부)는 그다음 단계라는 게 명확해졌다. 실전 코드(`app/workers/objective/update_objective_bulk_worker.rb`의 `process_with_error_handling`)가 목표별 트랜잭션+에러격리를 이미 증명하고 있다는 것도 확인했다.
- **같은 gem(`Sidekiq::Status`)의 진행 상태 저장(`store`)과 그 값을 실제로 응답에 노출하는 폴링 엔드포인트는 분리된 책임이라, 워커가 값을 저장한다고 자동으로 API에 나오지 않는다.** `UpdateObjectiveBulkWorker`는 이미 `store(success_count:, error_count:, errors:, total_count:)`로 Redis에 저장 중인데(60-65행), 공용 폴링 컨트롤러 `app/controllers/v2/bulk.rb`는 `job_id/total/at/progress/status/error_message`만 `present`해서 그 값들이 실제 응답에는 안 나간다. "인프라가 이미 있다"는 말이 "필드가 이미 API에 있다"는 뜻은 아니라는 걸 두 파일을 나란히 놓고서야 알았다.

## 작업하면서 막혔던 것과 해결 방법

- 병렬 조사 중 하나(어드민 비동기 승인 선례 조사)가 "`PUT /v2/objectives/batch_approval`은 `admin/bulk_update_service.rb`를 호출하지 않는다"고 잘못 보고했다. 실제로 `app/controllers/v2/objectives/objectives.rb:563`을 직접 읽어보니 그 라우트가 `Objective::Admin::BulkUpdateService.call(...)`을 정확히 호출하고 있었다 — 서비스 클래스 이름에 `Admin`이 들어 있어서(레거시 네이밍으로 보임) "admin 전용이라 이 사용자 라우트가 호출할 리 없다"고 잘못 추론한 것으로 보인다. `grep -rn "BulkUpdateService" app/`로 호출부가 그 한 곳뿐임을 재확인하고서야 확정했다. **파일 이름/네임스페이스만 보고 소유자를 추측하면 안 되고, 실제 호출부로 확인해야 한다**는 걸 다시 한번 체감했다.
- backend-log ROADMAP.md를 대조하려는데 이 세션의 작업 레포(ppback)에는 backend-log가 없어서, 처음엔 `gh api repos/.../contents/ROADMAP.md`로 GitHub에서 직접 파일을 가져왔다. 이후 로컬(`~/Desktop/backend-log`)에 이미 클론이 있고 origin과 동기화 상태인 걸 확인해서, 실제 체크 반영은 로컬 파일 기준으로 다시 했다.

## 다음에 더 공부하고 싶은 것

- `Sidekiq::Status`의 `store`/`retrieve`가 내부적으로 Redis에 어떤 키 구조로 저장되는지(TTL, 직렬화 방식)를 Redis CLI로 직접 들여다보고 싶다 — 지금은 gem의 공개 API(`store`/`get`)만 보고 "Redis에 저장된다"는 사실만 안다.
- `sidekiq-limit_fetch`가 concurrency 1을 어떻게 강제하는지(Sidekiq의 fetch 전략을 어떻게 가로채는지) gem 소스를 읽어보고 싶다 — 지금은 설정만 보고 "된다"는 결과만 안다.
- 옵션 3/4 중 실제로 어느 쪽으로 결정되는지, 그리고 그 결정이 왜 그렇게 났는지 다음 work-log에 이어서 기록.
