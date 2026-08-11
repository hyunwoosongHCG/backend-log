# PR #5532 — 상위 KR 동시 승인 lost update 대응 구조 변경 리뷰

> 날짜: 2026-08-11
> PR: https://github.com/hcgtheplus/ppback/pull/5532
> 관련 코멘트: https://github.com/hcgtheplus/ppback/pull/5532#issuecomment-5236435826

## 작업 한 줄 요약

Codex adversarial 리뷰가 지적한 "형제 하위 목표가 같은 상위 핵심성과에 동시에 체크인 승인되면 lost update가 난다"는 문제에 대한 대응으로, 체크인 승인 6개 호출부(자기승인/승인/벌크승인/워커 2종/연동 승인)에 조상 핵심성과 전역 순서 락(`with_ancestor_locks`)을 도입한 구조 변경을 리뷰했다.

## 이 작업에서 처음 배운 개념

- [x] 트랜잭션 격리 수준(Isolation Level) — MySQL REPEATABLE READ의 스냅샷 고정 시점 세부 규칙: **잠금 읽기(`SELECT ... FOR UPDATE`)는 read view(스냅샷)를 고정하지 않고, 트랜잭션의 첫 평범한(비잠금) SELECT가 스냅샷을 고정한다.** 이 순서 차이를 이용하면 "락을 먼저 잡고 → 그 다음에 평범한 읽기를 하도록" 코드 순서만 바꿔서, 트랜잭션을 분리하거나 격리 수준을 낮추지 않고도(원자성을 유지한 채) lost update를 막을 수 있다. → [레슨 44](../lessons/0044-transaction-isolation-level.html)
- [x] 행 잠금(Row Locking)과 동시성 제어 — 여러 호출부가 서로 다른 부분집합의 행을 잠글 때, **전역 정렬 순서(항상 id 오름차순)로 락을 잡는 것**만으로 호출부 개수·조합과 무관하게 데드락을 회피할 수 있다. `key_result_ids.sort.reverse.inject`로 락 체이닝을 만들어 항상 같은 순서로 잠그는 패턴을 실제 코드(호출부 6곳)에서 확인했다. → [레슨 42](../lessons/0042-row-locking-and-deadlock.html)
- [x] 중첩 트랜잭션과 `requires_new` — `with_lock`을 이미 열린 트랜잭션 안에서 또 부르면 새 트랜잭션이 아니라 그냥 합류(join)하고, `lock!`(`SELECT ... FOR UPDATE`)만 실행된다. 이번 코드의 락 체이닝(`inject`로 `with_lock`을 겹겹이 감싸는 구조)이 실제로는 전부 같은 트랜잭션 안에서 순차적으로 `FOR UPDATE`를 쌓는 것뿐이라는 걸 이 규칙으로 확인했다. → [레슨 45](../lessons/0045-nested-transaction-and-requires-new.html)

## 작업하면서 막혔던 것

- 코드만 보고는 "이 락이 정말 lost update를 막아주는가"를 바로 확신하기 어려웠다. `with_ancestor_locks`가 락을 잡는 시점과, 실제 체크인 로직(`accept_check_ins_and_create_history` 등)이 형제 값을 읽는 시점 사이의 순서를 직접 추적해서 — 락은 잠금 읽기라 스냅샷을 안 고정하고, 그 뒤에 나오는 첫 평범한 SELECT가 스냅샷을 고정한다는 MySQL 규칙에 대입해보고서야 왜 이 구조가 동작하는지 이해했다.
- 테넌트 스코프 이슈 하나를 발견했다(`params[:check_in_details]`의 `key_result_id`를 워크스페이스 검증 없이 바로 락 대상 조회에 쓰는 부분) — 리뷰 코멘트의 lost update 지적과는 무관한 별개 이슈였는데, "락을 어디서 걸든 그 대상 id가 어디서 왔는지"를 따로 확인하는 습관이 없었다면 놓쳤을 것 같다.

## 다음에 더 공부하고 싶은 것

- 로드맵의 "1:N 팬인(여러 하위 → 하나의 상위) 값 반영 semantics" — 이번 PR의 1/n 균등분할 반영 방식이 정확히 이 항목에 해당하는데 아직 미체크 상태.
- 낙관적 락(`lock_version`)으로 이 문제를 풀었다면 비관적 락(`with_lock`) 대비 어떤 트레이드오프가 생겼을지 — 이번엔 비관적 락 방식만 봤다.

## 참고 — ROADMAP.md 대조 결과

새 체크박스는 추가하지 않았다(이미 체크된 항목들의 세부 규칙을 심화한 내용이라). "데이터베이스 기초" 섹션의 트랜잭션 격리 수준(레슨 44)·행 잠금(레슨 42) 항목에 이 work-log 링크를 추가했다.
