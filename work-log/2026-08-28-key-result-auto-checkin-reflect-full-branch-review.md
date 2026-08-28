# 핵심성과 자동 반영 — 브랜치 전체 2차 리뷰 (동시성·인가 이관 관점)

> 날짜: 2026-08-28
> PR: https://github.com/hcgtheplus/ppback/pull/5532
> 브랜치: `feature/key-result-auto-checkin-reflect`
> 관련 기록: [07-27 브랜치 전체 셀프 리뷰](2026-07-27-key-result-auto-checkin-reflect-branch-review.md) · [08-28 자동 마감 락 재설계](2026-08-28-key-result-auto-checkin-reflect-auto-close-lock-and-migration-reissue.md) · [08-06 1/n 분할 전환](2026-08-06-key-result-auto-reflect-1n-split.md) · [레슨 54](../lessons/0054-database-cleaner-strategy-and-concurrency-spec.html)

## 작업 한 줄 요약

같은 날 자동 마감 락 재설계([08-28](2026-08-28-key-result-auto-checkin-reflect-auto-close-lock-and-migration-reissue.md))를 마친 뒤, review-ppback 스킬로 `dev...HEAD`(48개 파일) 전체를 처음부터 다시 훑었다. 핵심성과 체크인의 상위 1/n 자동 반영 축과 목표 일괄 승인의 동기→비동기 워커 전환 축, 두 축이 이번엔 서로의 경계에서 새로 만들어내는 문제가 없는지에 집중했다. RuboCop(변경 라인 기준, 위반 없음)과 RSpec(변경 spec 18개 파일, `RUN_CONCURRENCY_SPECS=1` 포함 351 examples 0 failures)으로 검증했다.

## 이번 작업에서 처음 배운 개념

- **한 번 지적한 CI 배선 gap도 재확인하지 않으면 여러 커밋을 그냥 통과한다.** [08-11 리뷰](2026-08-11-ppback-pr-5532-lost-update-lock-review.md)에서 이미 "`RUN_CONCURRENCY_SPECS` 없이는 CI가 이 PR의 핵심 회귀(동시성 스펙)를 전혀 안 돈다"고 적어뒀는데, 그 뒤 08-19 수동 검증 커밋과 오늘 새벽의 자동 마감 락 재설계 커밋까지도 `aws/buildspec-test.yml`은 그대로였다. 이번 리뷰에서 같은 지점을 다시 짚자 `aws/buildspec-test.yml:50`이 `docker-compose ... run -e RAILS_ENV=test -e RUN_CONCURRENCY_SPECS=1 app rspec --format progress`로 실제 수정됐다(세션 중 사용자가 직접 반영). "리뷰에서 한 번 잡았다"는 사실 자체가 방어를 보장하지 않고, 병합 시점에 다시 확인해야 한다는 걸 실제로 겪었다.
- **인가(`authorize`)를 컨트롤러 동기 경로에서 워커로 이관하면, 그 경계 바로 옆에 있던 다른 side effect까지 인가 결과와 분리된다.** `app/controllers/v2/objectives/objectives.rb:551-570`의 `batch_approval` 액션을 보면, 목표별 Pundit 인가(`batch_approve?`)는 이제 `Objective::UpdateObjectiveBulkWorker.perform_async(...)`(560행) 안, 워커의 목표별 트랜잭션 안에서 수행된다. 그런데 바로 다음 줄의 `Karafka::SetReadNotificationProducerWorker.perform_async(...)`(566행)는 컨트롤러에 그대로 남아 있고, 여기 넘기는 `objective_ids`는 554행에서 워크스페이스 소속만 확인한 값이라 개별 목표의 인가 통과 여부와 무관하게 바로 실행된다. 이전(동기 시절)엔 전체 목표에 대한 `authorize`가 다 통과해야 이 줄에 도달했을 것이다. [레슨 46](../lessons/0046-pundit-authorize-scope-and-hr-admin-duality.html)에서 배운 "authorize는 명시적으로 호출한 곳에서만 강제된다"의 새로운 변주다 — 이번엔 서비스 객체 우회가 아니라, **인가 지점을 옮기면 그 앞뒤에 나란히 있던 다른 코드의 전제도 같이 재검토해야 한다**는 사례다.
- **RuboCop 위반은 "새 코드가 새로 만든 것"과 "기존 코드가 이미 갖고 있던 것"을 구분해서 봐야 한다.** `app/models/key_result.rb`에 신규 추가된 `reflect_source_objectives`(91행)·`reflect_source_key_results`(101행) 연관관계에 `rubocop app/models/key_result.rb`를 돌리면 `Rails/HasManyOrHasOneDependent`(`:dependent` 옵션 없음)가 걸린다. 그런데 바로 위 기존 `child_key_results`(79행)·`child_objectives`(81행)도 같은 cop에 걸리고, 거기다 `Rails/InverseOf`까지 추가로 걸린다(신규 연관 두 개는 이미 `inverse_of: :super_key_result`를 명시해서 그쪽은 안 걸림). 조회 전용 연관에 `dependent: :destroy`를 넣으면 상위 삭제 시 하위까지 연쇄삭제되는 잘못된 동작이 생기므로, 넷 다 의도적으로 생략한 것이 맞다 — `.rubocop_todo.yml`에 없는 활성 cop이라도 diff 라인만 보지 말고 인접한 기존 코드의 관례를 실제로 rubocop 출력으로 대조해야 잘못된 지적을 안 한다는 걸 확인했다.

## 작업하면서 막혔던 것과 해결 방법

- zsh에서 변경 spec 파일 목록을 변수에 담아 unquoted로 `docker compose exec ... rubocop $FILES`에 넘겼더니 word-split이 안 돼 인자 전체가 하나로 뭉쳐 전달됐다. bash는 unquoted 변수 확장을 공백 기준으로 split하지만 zsh 기본 옵션(`SH_WORD_SPLIT` 꺼짐)은 안 한다 — `$(cat filelist)`처럼 커맨드 substitution으로 인라인하면 zsh도 split해서 우회했다.

## 다음에 더 공부하고 싶은 것

- ROADMAP "실패한 잡 재시도"(미체크) — 이번에 `Objective::CheckIns::ReflectWorker`가 왜 재시도에 안전한지(매번 `reflect_source_key_results` 전체에서 재계산하는 자연 멱등성, 부수 호출인 마감 판정의 `rescue`로 자기치유)는 짚었지만 항목으로 정리하진 않았다.

## 참고 — ROADMAP.md 대조 결과

- 섹션3 "태그 기반 스펙 제외"(174행) — 위 CI gap 재발견+해결 사례를 이 항목에 이어 붙였다.
- 섹션4 "권한" > "`authorize`는 컨트롤러에서 명시적으로 호출한 곳에서만 강제됨"(199행) — 위 인가 이관 사례를 새 변주로 이어 붙였다.
- 섹션 "도메인 이벤트" > "1:N 팬인 값 반영 semantics"(206행) — [08-06 1/n 분할 전환](2026-08-06-key-result-auto-reflect-1n-split.md)에서 이미 평균(1/n 균등분할)로 결정돼 있던 걸 확인하고 체크했다.
