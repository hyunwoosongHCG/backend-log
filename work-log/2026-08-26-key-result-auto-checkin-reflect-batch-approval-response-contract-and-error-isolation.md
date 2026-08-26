# 핵심성과 자동 반영 — 목표 일괄 승인 응답 계약 확정 및 부분실패 격리 버그 발견

> 날짜: 2026-08-26
> PR: https://github.com/hcgtheplus/ppback/pull/5532 (재설계, 커밋 2 관련)
> 브랜치: `feature/key-result-auto-checkin-reflect`
> 관련 기록: [08-25 구조적 레퍼런스 조사](2026-08-25-key-result-auto-checkin-reflect-batch-approval-async-pattern-research.md)

## 작업 한 줄 요약

어제 조사한 구조적 레퍼런스를 근거로 커밋 2 방향을 확정하는 과정이었다 — 목표 일괄 승인은 폴링 없이 동기 유지 + 목표별 트랜잭션 + `{ errors: [{objective_id, error}], error_count, success_count, total_count }` 바디로 가기로 했다. 이 과정에서 (1) ppfront 코드로 배치 건수 상한이 실제로 전혀 없음을 직접 확인했고, (2) 목표+가중치를 폴링으로 묶으려는 안을 검토하다 `ObjectiveWeight`의 `user_cycle`이 진짜 association이 아님을 발견해 통합안을 접었고, (3) 프론트의 `Promise.all`이 두 API의 서로 다른 실패 신호(목표는 200+바디, 가중치는 reject)를 삼킬 수 있다는 걸 찾아 `allSettled` 전환을 요청했고, (4) 디자이너(mykim)와의 실패 UI 문구 논의 중 `case obj.stage`에 `else`가 없어 상태 불일치가 조용히 성공 처리되는 correctness 버그를 발견했다.

## 이번 작업에서 처음 배운 개념

- **API 응답 계약이 비대칭이면 클라이언트의 `Promise.all`이 정보를 삼킨다.** 목표 승인을 목표별 트랜잭션으로 바꾸면 부분 실패도 200 + 바디(`error_count` 등)로 응답하는데, 가중치 승인은 그대로 전체 트랜잭션이라 실패 시 여전히 reject한다. 프론트 훅(`useSubmitBulkApprove.ts:57-64`)처럼 이 둘을 `Promise.all`로 묶어두면, 가중치가 reject하는 순간 이미 도착한 목표 응답의 바디(부분실패 정보)를 읽을 기회 자체가 사라진다 — `Promise.allSettled`로 바꿔서 두 결과를 독립적으로 봐야 한다는 걸 실제 코드로 확인하고 나서야 이게 "말로만 설명하면 놓치기 쉬운" 문제라는 걸 체감했다.
- **Rails association 문법을 흉내 내는 메서드가 항상 진짜 association은 아니다.** `ObjectiveWeight#user_cycle`(`app/models/objective_weight.rb:42-44`)은 `belongs_to :user_cycle`처럼 보이지만 실제로는 `UserCycle.find_by(user_id: user_id, cycle_id: cycle_id)`를 매번 호출하는 일반 메서드였다. 진짜 복합키 association 선언(`belongs_to :user_cycle, foreign_key: %i[user_id cycle_id], primary_key: %i[user_id cycle_id]`)은 양쪽 모델에 다 주석 처리된 채 남아 있었다 — 누군가 시도했다가 막힌 흔적으로 보인다. `includes`로 preload가 안 되니 N+1이 구조적으로 안 없어지고, 이 때문에 목표(`objective_id` 단위)와 가중치(`user_id`+`cycle_id` 단위)처럼 서로 다른 단위로 묶인 두 벌크 처리를 하나의 파이프라인으로 합치는 게 "그룹핑 단위가 다르다"는 것보다 한 겹 더 실질적으로 어렵다는 걸 스키마·모델 코드로 확인했다.
- **`case`/`when`에 `else`가 없으면 "예상 밖 상태"는 예외가 아니라 조용한 no-op이 된다.** 벌크 승인 로직(`Objective::UpdateObjectiveBulkWorker#accept_objective`, `Objective::Admin::BulkUpdateService#bulk_accept`)이 둘 다 `case obj.stage; when 'pending_create' ...; end` 형태인데, 다른 관리자가 먼저 처리해서 `stage`가 이미 매칭 안 되는 값(`open` 등)이 되어 있으면 이 `case`는 아무 것도 안 하고 그냥 지나간다. 예외가 안 나니 `rescue StandardError`가 못 잡고, 항목별 에러 격리 로직(`process_with_error_handling`)은 이걸 실패가 아니라 **성공(success_count)으로 센다.** "에러를 잡는 것"과 "예상과 다른 모든 경로를 잡는 것"은 다르다는 걸 실제 잠재 버그로 체감했다 — `rescue`는 던져진 예외만 잡지, 아무 것도 안 하고 조용히 끝나는 분기는 못 잡는다.

## 작업하면서 막혔던 것과 해결 방법

- ppfront에서 `useSubmitBulkApprove`/`BulkApproveConfirmContent` 실제 사용처를 처음엔 못 찾았다. `grep --include="*.tsx" --include="*.ts"`로만 검색했는데, 실제 사용처(`PendingObjective.jsx`)가 `.jsx` 확장자라 걸리지 않았던 것 — 확장자를 가정하지 말고 전체를 검색해야 한다는 걸 다시 확인했다.
- `gh` CLI가 이 세션에서 인증이 안 되어 있어서 "GitHub에 관련 PR/이슈가 있는지" 확인이 막혔다. `gh auth login --hostname github.com --git-protocol https --web`을 백그라운드로 돌려 원타임 코드(`https://github.com/login/device`)를 받고, 사용자가 브라우저에서 완료한 뒤 `gh auth status`로 재확인해서 풀었다.
- "백로그에 적어줘"라는 요청을 GitHub 백로그(이슈/PR)로 잘못 이해해서 PR #5532 본문·코멘트를 한참 뒤지고 있었는데, 실제로는 "백엔드 로그"(이 work-log)를 뜻한 것이었다. 이미 이 세션에서 반복해온 work-log 패턴이 있었으니, 발음이 비슷한 요청은 기존 맥락을 먼저 의심했어야 했다.

## 다음에 더 공부하고 싶은 것

- `case obj.stage`에 `else raise` 가드를 실제로 추가하는 리팩터링과, 이걸 검증할 스펙 작성법 — 스테이지를 일부러 어긋나게 만든 뒤 success_count가 아니라 errors에 잡히는지 확인하는 방식이 될 것 같다.
- 배치 건수 상한 validator를 실제로 추가할 때, 목표/가중치 각각 상한을 어떻게 잡을지(하늘님 쪽 UX 논의 결과에 따라 달라질 부분).
- 덤프 테스트에서 실제 처리 시간이 어느 정도로 나오는지, 그 결과가 "동기 유지" 결정을 다시 흔드는지.
