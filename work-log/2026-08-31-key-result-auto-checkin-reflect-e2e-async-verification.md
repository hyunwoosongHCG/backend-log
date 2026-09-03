# 핵심성과 자동 반영 — 비동기 전환 이후 첫 화면 E2E 검증

> 날짜: 2026-08-31
> PR: https://github.com/hcgtheplus/ppback/pull/5532
> 브랜치: `feature/key-result-auto-checkin-reflect`
> 관련 기록: [08-28 브랜치 전체 2차 리뷰](2026-08-28-key-result-auto-checkin-reflect-full-branch-review.md) · [08-28 자동 마감 락 재설계](2026-08-28-key-result-auto-checkin-reflect-auto-close-lock-and-migration-reissue.md) · [08-26 배치 승인 응답 계약](2026-08-26-key-result-auto-checkin-reflect-batch-approval-response-contract-and-error-isolation.md) · [08-11 lost update 락 리뷰](2026-08-11-ppback-pr-5532-lost-update-lock-review.md)

## 작업 한 줄 요약

체크인 자동 반영이 커밋 이후 Sidekiq 워커로 분리된 뒤(`Objective::CheckIns::ReflectWorker`) 처음으로
실제 브라우저에서 `docs/qa/key_result_auto_reflect_manual_test_guide.md`를 따라 S1·S4·S5·S13을 재현하고,
S24·S25·S26은 가이드의 콘솔 스크립트로 검증했다. 그 과정에서 (1) 검증 스크립트 자신이 MySQL
REPEATABLE READ 스냅샷에 갇혀 "반영 안 됨"을 오보한 사건과 (2) 브랜치 전환 중 살아있던 puma가 새 파일을
못 잡아 일괄 승인이 500을 뱉은 사건을 겪었다. 둘 다 제품 결함이 아니라 **검증 환경이 만들어낸 가짜 신호**였다.

## 이번 작업에서 처음 배운 개념

- **검증 도구 자체가 트랜잭션 격리 수준에 속을 수 있다.** 승인 → 상위 반영 지연을 재려고
  `rails runner`에서 `240.times { Objective.find(1260); KeyResult.find(487); sleep 0.25 }` 폴링 루프를 돌렸는데,
  60초 내내 값이 0으로 보여 "반영 실패"로 결론 낼 뻔했다. 실제로는 승인과 **같은 초에** 반영이 끝나 있었다
  (히스토리 `CheckinAccepted` / `AutoCheckedIn` 둘 다 `03:41:45`). 원인은 MySQL 기본 격리수준 REPEATABLE READ —
  장시간 살아있는 Rails 프로세스의 첫 비잠금 SELECT가 read view를 열면 그 뒤 몇 번을 다시 조회해도
  **같은 스냅샷**을 본다. `Model.find`를 매번 새로 부르는 것은 쿼리 캐시를 피할 뿐 스냅샷을 새로 열지 않는다.
  [섹션1 트랜잭션 격리 수준](../ROADMAP.md) 항목에서 배운 "잠금 읽기는 스냅샷을 무시하고 최신을 본다"의
  **거울상**이다 — 비잠금 반복 읽기는 반대로 과거에 고정된다. 해결은 폴링마다 커넥션을 새로 여는 것으로,
  `docker compose exec db mysql -e "SELECT ..."`를 루프에서 호출하도록 바꾸니 홉별 시각이 정확히 찍혔다
  (S13 4단계 체인: 홉1 4.03s → 홉3 4.25s).
  **교훈: "관측되지 않음"을 "일어나지 않음"으로 읽기 전에, 관측 장치가 최신을 볼 수 있는 구조인지 먼저 의심한다.**

- **개발 환경의 파일 감시 한계가 "제품 버그처럼 보이는 500"을 만든다.** 화면에서 일괄 승인을 눌렀더니
  `PUT /objectives/batch_approval`이 500 — `NameError: uninitialized constant Objective::BulkErrorHandling`
  (`app/workers/objective/update_objective_bulk_worker.rb:3`). 파일은 멀쩡히 존재하고
  (`app/workers/concerns/objective/bulk_error_handling.rb`), 오토로드 경로에도 있고, spec 32건도 통과한다.
  갈랐던 근거는 **같은 상수를 새 프로세스에서는 해석한다**는 점이었다 — `rails runner`로 부르면 정상,
  실행 중인 puma에서만 실패. 컨테이너 `StartedAt`이 `01:55:58`이고 파일 mtime이 `02:22:35`(브랜치 체크아웃 시각)라,
  puma가 그 파일이 존재하기 전에 부팅해 Zeitwerk 인덱스가 그 시점에 멈춰 있었다. Docker on macOS의
  파일 감시(`EventedFileUpdateChecker`)가 마운트된 볼륨의 이벤트를 놓치는 알려진 한계 때문에 리로더도 안 돌았다.
  `docker compose restart app` 후 같은 요청이 200 + `{"job_id","total","at","progress","status"}`로 정상 응답했다.
  **교훈: 세션 중간에 브랜치를 갈아타면 실행 중인 서버 프로세스는 그 전 코드의 세계에 남아 있다.
  "새 프로세스에서도 재현되는가"가 환경 아티팩트와 진짜 버그를 가르는 가장 싼 리트머스다.**

- **검증 기록은 시점을 박아두지 않으면 조용히 거짓이 된다.** stash에 남아 있던 미커밋 QA 기록(164줄)에
  "**중요한 프론트 결함(신규 발견)**: `useSubmitBulkObjectiveApprove.ts`와 `useSubmitBulkApprove.ts` 둘 다
  `job_id` 응답을 즉시 완료로 취급한다"고 적혀 있었다. 그런데 오늘 확인하니 절반은 이미 사실이 아니었다 —
  실제 UI가 쓰는 `useSubmitBulkApprove.tsx`는 `fetchProgress`로 폴링하도록 고쳐졌고(72행), 결함이 남은
  `useSubmitBulkObjectiveApprove.ts`는 **레포 전체에서 import가 0건인 죽은 코드**였다. 기록을 쓴 08-27 이후
  55커밋이 쌓이는 동안 살아있는 경로만 수정되고 죽은 파일은 남은 것이다. 화면에서 일괄 승인을 눌러
  `GET /bulk?job_id=...` → 200이 실제로 나가는 걸 네트워크 탭으로 확인해 최종 확정했다.
  **교훈: "결함 발견" 기록에는 확인한 커밋 SHA를 같이 적고, 다시 쓸 때는 코드로 재확인한다.
  특히 dead code에 대한 지적은 심각도가 완전히 다르다 — 고쳐야 할 버그가 아니라 지워야 할 파일이다.**

- **"통과하는 동시성 spec"이 실제로 무엇을 지키는지는 뮤테이션으로만 알 수 있다.**
  `reflect_worker.rb:33`의 `parent_objective.with_lock`을 평범한 `ActiveRecord::Base.transaction`으로
  바꿔봤더니 반영 관련 spec **119건이 전부 통과**했다(`RUN_CONCURRENCY_SPECS=1` 포함). 이름부터
  `reflect_worker_concurrency_spec.rb`인 spec조차 못 잡는데, 그 이유가 이 세션의 핵심 배움이다 —
  그 spec은 스레드 A가 `Objective.find(...).with_lock`으로 **직접** 상위 목표 행 락을 쥐는 구조다(`:31`).
  그래서 워커에서 락을 빼도 스레드 B가 `objectives.progress`를 UPDATE하려면 어차피 **같은 행의 배타 락**을
  기다리게 되고, `:48`의 "아직 0이어야 한다" 단정은 그대로 통과한다. 즉 이 spec은
  **"워커가 명시적으로 잠가서 막혔다"와 "UPDATE가 우연히 같은 행 락에 걸려 막혔다"를 구분하지 못한다.**
  정작 락이 막아야 할 lost update는 *두 워커가 각자 읽은 뒤 각자 쓰는* 인터리빙인데, A가 서비스를
  타지 않으니 그 상황 자체가 만들어지지 않는다.
  **교훈: "동시성 spec이 있다"는 "그 동시성 제어가 검증된다"가 아니다. 방어 코드를 지우고도 초록이면
  그 테스트는 다른 것을 보고 있는 것이다. 락·트랜잭션 같은 방어 장치는 뮤테이션 한 번이 리뷰 열 번보다 싸다.**

- **음성 대조군은 "기능이 꺼졌다"가 아니라 "파이프라인은 살아있는데 이것만 없다"를 보여야 한다.**
  `AutoCheckedIn`이 알림을 발생시키지 않는다는 걸 검증할 때, 처음엔 "AutoCheckedIn 알림 0건"만 셌다.
  그런데 그것만으로는 *알림 기능 자체가 죽어서* 0건인 경우와 구분이 안 된다. `notifications.history_id`로
  조인해 같은 워크스페이스의 `CheckinAccepted` 4건 · `CheckedIn` 17건이 **정상적으로 알림을 만들고 있는데**
  `AutoCheckedIn` 180건만 0건이라는 대조를 만들자 비로소 주장이 성립했다.

## 작업하면서 막혔던 것과 해결 방법

- 관리자 콘솔(8001)이 요청받은 `~/Desktop/talenx-admin`이 아니라 `~/Desktop/Eggplant/Eggplant-admin`
  체크아웃에서, 그것도 **다른 브랜치**(`objectiveSetting_keyResult_useTagsRequired`)로 서비스되고 있었다.
  그 체크아웃엔 자동 반영 UI 참조가 0건이라 §1 엑셀 일괄 업로드부터 막혔다. `lsof -a -p <pid> -d cwd -Fn`로
  포트별 실제 서비스 디렉터리를 확인하는 절차를 먼저 밟았어야 했다 — web-e2e 스킬에 이 확인 단계가 명시돼 있는데
  건너뛰고 작업 요청서의 "준비됨" 표시를 믿은 게 원인이었다.
- 가이드 §2가 `link_map = { # 하위_obj_id => 상위_kr_id }`를 **수동으로 채우라**고 되어 있어, 28개 목표의
  실제 ID를 매번 조회해 옮겨 적어야 했다. 목표 이름 접두사(`[S1-하위]` 등)로 런타임에 해석하고
  기대/실제를 표로 찍는 멱등 스크립트로 바꿔서 19건 전부 PASS를 한 번에 확인했다. 가이드에 이 스크립트를
  넣어두면 다음 QA 때 이 단계가 통째로 사라진다.
- Playwright가 3일 된 고아 Chrome(pid 93476)이 프로파일을 점유해 아예 뜨지 않았다. `SingletonLock`이 가리키는
  pid가 **살아있는지** 확인해 stale lock과 실제 점유를 구분한 뒤 정리했다.

## 다음에 더 공부하고 싶은 것

- **비결정적이지 않은 인터리빙 강제 기법.** 위 lost update 회귀 테스트는 "하위를 읽은 뒤 · 쓰기 전"에
  스레드를 세워야 하는데, 그 지점이 서비스 내부라 배리어 주입이 필요하다. RSpec 목(`allow_any_instance_of`)은
  **스레드 안전하지 않아** 두 스레드가 도는 테스트에선 쓸 수 없고, spec 파일 안에서 모듈을 `prepend`하고
  `Queue`로 배리어를 거는 방식이 남는다. 다만 이 레포의 기존 동시성 spec이 이미
  `let_it_be` + `:truncation` 조합에서 비결정적으로 멈춘 이력이 있어(`reflect_worker_concurrency_spec.rb:1-5`)
  안정적으로 만들기 어렵다고 판단, **이번 PR에서는 후속 티켓으로 분리하고 PR 본문에 한계를 명시**하기로 했다.
  "flaky한 테스트를 추가하는 것"은 방어가 아니라 **CI에서 무시되는 초록 하나를 늘리는 일**이라는 게 판단 근거였다.
  DB 락 기반(`GET_LOCK`)이나 실제 두 프로세스를 띄우는 방식 등 결정성을 확보하는 다른 기법을 더 알아볼 것.
- ROADMAP "실패한 잡 재시도"(미체크) — [08-28 기록](2026-08-28-key-result-auto-checkin-reflect-full-branch-review.md)에서
  미룬 항목이 그대로 남아 있다. 오늘 `reflect_worker_retry_consistency_spec.rb`의 존재를 확인했으니 이걸 읽고 정리하면 된다.

## 참고 — ROADMAP.md 대조 결과

- 섹션1 "트랜잭션 격리 수준"(53행) — 위 **비잠금 반복 읽기가 과거에 고정된다**는 거울상 사례를 이어 붙일 것.
  기존 서술은 전부 "애플리케이션 코드의 정확성" 관점인데, 이번 건은 "검증 도구의 관측 신뢰성" 관점이라 축이 다르다.
- 섹션3 "프로젝트 구조"(119행) — Zeitwerk 오토로딩과 개발 환경 파일 감시 한계 항목이 아직 없다. 신규 추가 대상.
- 섹션3 "테스트"(164행) — **뮤테이션 테스트** 항목이 없다. 신규 추가 대상: "방어 코드(락·트랜잭션·가드)를
  일부러 지우고 스펙을 돌려, 초록이 유지되면 그 방어를 지키는 테스트가 없는 것"이라는 판별법.
  이번에 `with_lock` 제거로 119건이 그대로 통과한 사례가 근거다.
- 섹션4 "백그라운드 잡"(208행) — 비동기 전환 후 실측 지연값을 근거로 채울 수 있다
  (단일 홉 1초 미만, 4단계 체인 0.22초, 일괄 승인 경유 2홉 약 3.2초).

## 실측 기록 (재사용용)

| 시나리오 | 경로 | 결과 |
|---|---|---|
| S1 단일 홉 | 화면 | 상위 KR 0→100, 승인과 같은 초에 반영, `is_first_reflection: true` |
| S13 4단계 체인 | 화면 | 홉1 4.03s → 홉2·홉3 4.25s (홉 간 0.22초), 최상위 `is_first_reflection: false` |
| S4 일괄 승인 | 화면 | `PUT batch_approval` 200 → `GET /bulk?job_id=` 200 폴링 확인. 중간값 50 관측(1/n 분할), 최종 100 + 상위·조부모 자동마감 |
| S5 옵션 OFF | 화면 | 하위 100·자동마감, 상위 0 유지, `AutoCheckedIn` 0건 |
| S24 전체 토폴로지 | 콘솔 | 15건 PASS (역순 처리 최종값 동일 포함) |
| S25 kind 혼합 | 콘솔 | 11건 PASS (boolean 비분할, interval 반영 제외) |
| S26 부분 실패 분류 | 콘솔 | 6건 PASS (state_changed / not_authorized / unexpected) |
| `AutoCheckedIn` 알림 | DB | 180건 전체 알림 0건 (대조군 `CheckinAccepted` 4건 · `CheckedIn` 17건은 정상 발생) |
| RSpec | Docker | `RUN_CONCURRENCY_SPECS=1` 119 examples / 0 failures |
