# 벌크 워커 진행률 버그 감사 + 미들웨어로 구조적 수정

> 날짜: 2026-09-17
> PR: [ppback #5612](https://github.com/hcgtheplus/ppback/pull/5612)
> 소스: Performance Plus(실무) — Rails 8 + Grape, Sidekiq(sidekiq-status), MySQL, Redis
> 내 역할: 감사(전수 조사) + 구현 — 이슈 #5401을 계기로 같은 패턴을 전체 워커에서 찾아 구조적으로 고침
> 선행: [2026-09-17 ppback #5611 자체 리뷰와 후속 조치](2026-09-17-ppback-pr-5611-v1-removal-review-followups.md)

## 작업 한 줄 요약

이슈 #5401(핵심성과 가중치 일괄 변경 워커의 진행률 버그)이 이미 다른 PR로 고쳐진 걸 확인한 뒤, 같은 버그 패턴이 `Sidekiq::Status::Worker`를 쓰는 워커 81개 전반에 반복되고 있는지 전수 감사했다. 처음엔 발견한 16개 파일을 각각 patch하려다, "이렇게 한 줄씩 말고 레이어 단에서 처리할 수 없냐"는 지적을 받고 Sidekiq 서버 미들웨어 하나로 구조적으로 막는 방향으로 다시 짰다. 그 과정에서 미들웨어 자체의 사이드이펙트(작업 중지 오판)와, 반대 방향 버그(진행률 100% 초과)까지 추가로 잡았다.

## 성과

**Before → After**

| | Before | After |
|---|---|---|
| 진행률 미달 버그(스킵 경로에서 `at` 누락) | 확인된 파일 16개, 각각 patch 예정이었음 | 미들웨어 1개 파일로 구조적 차단, 워커 파일 변경 **0건** |
| 진행률 초과 버그(`update_objective_bulk_worker.rb`) | 그룹 하나에 objective_ids 여러 개면 `pct_complete`가 100% 초과 가능 | total을 그룹 수가 아니라 objective_ids 총합으로 계산 |
| `/sidekiq` 웹 UI에서 작업을 중지시킨 경우 | (내가 처음 짠 미들웨어 기준) 중지된 작업도 진행률 100%로 오판 | status가 `:complete`일 때만 보정하도록 좁힘 |
| 이슈 #5401 GitHub 상태 | 이미 고쳐졌는데 OPEN으로 방치 | 커밋 링크로 설명 코멘트 남기고 닫음 |

**측정 방법**

전부 **실측**이다. `Sidekiq::Status::ServerMiddleware`·`Sidekiq::Middleware::Chain`·`Sidekiq::Testing`의 실제 동작은 컨테이너 안 gem 소스(`/bundle/ruby/3.4.0/gems/sidekiq-*`)를 직접 읽어 확인했고, 프론트 영향 여부는 ppfront·theplus-front 두 레포의 실제 폴링 코드를 grep해서 확인했다(추정 없음).

**검증 근거**

```
spec/middlewares/sidekiq_status_progress_completion_middleware_spec.rb   → 6 examples, 0 failures
spec/workers/objectives/update_objective_bulk_worker_spec.rb
  + spec/workers/team_admins/objective/update_objective_bulk_worker_spec.rb → 62 examples, 0 failures
```

- 모든 회귀 스펙을 고치기 전 코드로 임시로 되돌려 실제로 빨간불이 뜨는지 확인 후 복원(성공/이미 완료/예외/작업 중지/총합 초과 다섯 경로)
- 변경 파일 전체 rubocop 0 offense(사전에 있던 `config/initializers/sidekiq.rb` 상단부 offense 3건은 이번 변경 범위 밖으로 분류)

## 이 작업에서 처음 배운 개념

- [ ] [Rails 전용] [Sidekiq 서버 미들웨어 체인의 실행 순서](../concepts/sidekiq-status-middleware.md) — `chain.add`는 먼저 추가한 것이 **바깥쪽**(pre-yield가 먼저, post-yield가 나중)이다. `insert_before(oldklass, newklass)`로 특정 미들웨어 앞에 넣으면 그 미들웨어의 post-yield 코드보다 **뒤에** 내 코드가 실행되게 만들 수 있다. Rack 미들웨어·자바의 서블릿 필터 체인과 같은 모양이라 스택이 바뀌어도 이 사고방식 자체는 [보편]에 가깝다.
- [ ] [Rails 전용] `Sidekiq::Status::ServerMiddleware`가 성공 시 `store_status(:complete)`로 저장하는 필드는 `status`/`ended_at`뿐, `at`/`total`/`pct_complete`는 안 건드린다 — 그래서 워커가 마지막에 `at`을 안 불렀으면 job은 성공(`status: complete`)인데 진행률만 영원히 못 미친 채 남는다.
- [ ] [Rails 전용] `Sidekiq.configure_server`의 블록은 `Sidekiq.server?`가 true일 때(=실제 `bundle exec sidekiq` 프로세스)만 즉시 실행된다 — Rails web/test 프로세스에서는 등록만 되고 안 돈다. 그래서 서버 미들웨어(Sidekiq::Status 포함)는 RSpec에서 절대 안 탄다.
- [ ] [Rails 전용] `Sidekiq::Testing.inline!`은 그마저도 **별도의 빈 미들웨어 체인**(`Sidekiq::Testing.server_middleware`)을 쓴다 — `Sidekiq.configure_server`로 등록한 진짜 체인과 다른 객체라, inline 모드로 perform_async를 돌려도 내가 등록한 미들웨어는 실행되지 않는다. 이미 `spec/api/v2/objectives/batch_approval_spec.rb`에 이 제약이 문서화돼 있었다.
- [ ] [Rails 전용] `Integer#size`는 실제로 존재하는 메서드다(바이트 크기를 돌려준다) — Grape 파라미터가 배열 아니면 단일 정수도 허용하는 자리(`types: [[Integer], Integer]`)에서 `.size`를 그냥 부르면 에러 없이 조용히 엉뚱한 값이 나온다. `Array()`로 감싸 정규화하는 게 방어책.
- [ ] [보편] 같은 버그 패턴이 여러 파일에 반복되면, 파일마다 patch하기 전에 "이 반복을 프레임워크 레벨(미들웨어/인터셉터/베이스 클래스)에서 한 번에 막을 수 있는가"부터 검토한다 — 자바로 치면 Spring AOP/인터셉터로 옮기는 것과 같은 결정이다.

## 작업하면서 막혔던 것과 해결 방법

**"프론트가 폴링하다 멈춘다"는 원래 커밋 메시지의 근거를 그대로 믿을 뻔한 것.** 이슈 #5401을 고친 예전 커밋이 "`while (progress !== 100 || status !== "complete")`로 폴링해서 무한 대기한다"고 적어 놨는데, 실제로 ppfront·theplus-front 두 레포를 뒤져보니 지금 코드는 전부 `status === 'complete'`만으로 루프를 빠져나가고 있었다(그 리터럴 패턴은 어디에도 없었음). 커밋 메시지에 적힌 근거라도 그대로 믿지 않고 프론트 코드를 직접 읽어야 한다는 걸 다시 확인했다.

**진행률 초과 버그를 고쳐도 되는지 판단하려면 프론트 실사용 패턴까지 봐야 했던 것.** 백엔드 Grape 파라미터 스키마는 그룹 하나에 objective_ids 여러 개를 명시적으로 허용하는데, 실제로 그렇게 보내는 화면이 있는지는 코드만 봐서는 몰랐다. 엑셀 업로드 처리 로직(`objectives/record/ModalContent.tsx`)까지 내려가서 "행 하나 = objective_ids 배열 1개짜리 그룹"으로 항상 만든다는 걸 확인하고서야 "지금 당장은 영향 없는 잠복 버그"라고 결론 내릴 수 있었다.

**병렬로 띄운 감사 서브에이전트가 방향 전환 후에도 계속 파일을 고치고 있었던 것.** 미들웨어 방식으로 바꾸기로 하고 되돌리는(`git checkout`) 도중에도 백그라운드 에이전트가 같은 파일에 다시 patch를 쓰고 있어서, `SendMessage`로 중단 지시만 보내는 걸로는 부족했다. `TaskStop`으로 강제 종료한 뒤에야 확실히 멈췄고, 되돌린 파일 중 하나(`spec/workers/objectives/...`, `spec/workers/group_multisource_feedbacks/...` 등 복수형 디렉터리)를 "에이전트가 잘못 만든 파일"로 오판해 지웠다가, 실제로는 origin/dev에 이미 있던 파일이라 `git checkout origin/dev -- <path>`로 복구했다. 지우기 전에 `git cat-file -e origin/dev:<path>`로 원본 존재 여부부터 확인했어야 했다.

## 다음에 더 공부하고 싶은 것

- Sidekiq 재시도·dead set 동작 — 이번엔 jid가 재시도 전체에서 유지된다는 것만 확인했고, DLQ로 넘어간 뒤의 상태 만료·정리 정책은 안 봤다
- Rack 미들웨어 체인과 Sidekiq 미들웨어 체인의 차이 — 둘 다 "먼저 추가한 게 바깥"이라는 점은 같아 보였는데, client/server 체인이 분리되는 지점이나 예외 전파 규칙까지 완전히 같은지는 확인 안 함
- 이번에 찾은 "total과 실제 순회 대상이 어긋나는" 나머지 사례들(under-count 계열 7개 파일, `create_link_appraisee_data_worker.rb`의 인덱스 리셋 등) — 이번 PR 범위에는 안 넣었다

## 참고 — ROADMAP.md 대조 결과

**신규 체크**

- 기타 기초 › 백그라운드 잡(Background Job)이란? — Sidekiq::Status 미들웨어 체인/등록 시점/테스트 모드 차이로 심화 채움
- 아키텍처 › 반복되는 버그는 개별 patch보다 미들웨어/인터셉터 레벨에서 막는다(자바 Spring AOP와 같은 결정 축)

**미체크 유지**

- 위 "다음에 더 공부하고 싶은 것"의 Sidekiq 재시도·DLQ, Rack vs Sidekiq 미들웨어 체인 비교는 이번에 확인하지 않아 체크하지 않는다
