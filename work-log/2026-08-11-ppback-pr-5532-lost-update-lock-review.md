# PR #5532 — 상위 KR 동시 승인 lost update 대응 구조 변경 리뷰

> 날짜: 2026-08-11
> PR: https://github.com/hcgtheplus/ppback/pull/5532
> 관련 코멘트: https://github.com/hcgtheplus/ppback/pull/5532#issuecomment-5236435826
> 브랜치: `feature/key-result-auto-checkin-reflect`

## 작업 한 줄 요약

Codex adversarial 리뷰가 지적한 "형제 하위 목표가 같은 상위 핵심성과에 동시에 체크인 승인되면 lost update가 난다"는 문제에 대한 대응으로, 체크인 승인 진입점들에 조상 핵심성과 전역 순서 락(`with_ancestor_locks`)을 도입한 구조 변경을 리뷰했다. 하루 사이 여러 차례 리뷰를 거치며 락 구현이 바뀌어, 최종 형태 기준으로 다시 정리한다.

## 정정 — 초안 기록과 최종 구현의 차이

이 문서 초안(같은 날 오전)에는 락이 `key_result_ids.sort.reverse.inject`로 `with_lock`을 겹겹이 감싸는 **체이닝 구조**라고 적었다. 이후 리뷰를 거치며 바뀌어, 최종 구현은 **단일 트랜잭션 + 평면 루프**다 (`reflect_to_super_key_result_service.rb:102-110`):

```ruby
ActiveRecord::Base.transaction do
  LockedKeyResults.ids = already_locked | key_result_ids
  begin
    key_result_ids.sort.each {|key_result_id| KeyResult.lock.where(id: key_result_id).pluck(:id) }
    yield
  ensure
    LockedKeyResults.ids = already_locked
  end
end
```

- `with_lock`(모델 인스턴스 락) 대신 `KeyResult.lock.where(id:).pluck(:id)` — 인스턴스를 만들지 않는 순수 잠금 읽기.
- `inject` 중첩이 사라져서 트랜잭션(SAVEPOINT)이 락 개수만큼 쌓이지 않는다.
- 이 구조에서 지켜야 하는 규칙은 코드 주석(`:71-79`)에 명시돼 있다: **락 획득 구간에 평범한(비잠금) 조회를 단 한 번도 섞으면 안 된다.** 섞으면 그 뒤에 잡는 락이 이미 고정된 스냅샷 위에서 획득돼 형제의 커밋을 못 본다.

따라서 초안의 3번 개념("중첩 트랜잭션/`requires_new`를 락 체이닝으로 확인했다")은 근거가 사라졌다. `requires_new`는 이 파일에서 자동 마감 격리(`:260`)에만 남아 있고, 그 성격(독립 트랜잭션이 아니라 SAVEPOINT)은 이미 [2026-07-24 기록](2026-07-24-key-result-auto-checkin-reflect-auto-close-and-review-fixes.md)에서 배운 내용이다.

## 이 작업에서 처음 배운 개념

- [x] 트랜잭션 격리 수준(Isolation Level) — MySQL REPEATABLE READ의 스냅샷 고정 시점 세부 규칙: **잠금 읽기(`SELECT ... FOR UPDATE`)는 read view(스냅샷)를 고정하지 않고, 트랜잭션의 첫 평범한(비잠금) SELECT가 스냅샷을 고정한다.** 이 순서 차이 때문에 "락을 트랜잭션이 열리기 **전에** 잡아야 한다"는 제약이 생기고, 이 제약 하나가 이 PR에 붙은 코드 대부분의 이유다. → [레슨 44](../lessons/0044-transaction-isolation-level.html)
- [x] 행 잠금(Row Locking)과 동시성 제어 — 여러 호출부가 서로 다른 부분집합의 행을 잠글 때 **전역 정렬 순서(항상 id 오름차순)** 로 잡으면 조합과 무관하게 데드락을 피할 수 있다. **다만 이번에 배운 건 그 반대편**: 조상 전체를 미리 선점하는 설계는 그 자체가 새 데드락 축을 만든다. 상위 목표가 자기 KR을 체크인할 땐 그 행에 락 없이 쓰는데 하위 승인 쪽엔 같은 행이 `FOR UPDATE` 대상이라, 조상 KR의 id가 후손보다 작으면 순서가 역전된다. 그래서 "체크인되는 KR 자신"까지 락 집합에 넣어야 했다(`:129-133`). 레벨 단위로 하나씩 잠그면 hold-and-wait가 없어 이 문제 자체가 생기지 않는다. → [레슨 42](../lessons/0042-row-locking-and-deadlock.html)
- [x] **트랜잭션 경계 소유권** ([레슨 52](../lessons/0052-transaction-boundary-ownership.html)) — "블록으로 감싸기"는 문법적으로 무해해 보이지만, `with_ancestor_locks`가 내부에서 트랜잭션을 열기 때문에 **감싸는 순간 트랜잭션 경계가 이동한다.** 이전엔 체크인 승인이 커밋된 뒤 별도로 돌던 `AutoCloseObjectiveIfProgressCompleteService`가 이제 같은 트랜잭션 안으로 들어와서, 자동 마감이 실패하면 체크인 승인까지 롤백된다(`objective.rb:753-762`, `update_service.rb:13-17`). 트랜잭션을 **누가 여는가**는 서비스 객체 설계에서 별도로 결정해야 하는 항목이다.
- [x] **`ActiveSupport::CurrentAttributes`** ([레슨 53](../lessons/0053-current-attributes.html)) — 스레드/파이버 단위 전역 상태를 Rails executor가 요청·잡 단위로 자동 리셋해주는 장치. 여기선 벌크 워커의 **정상 재진입**(바깥에서 배치 전체를 잠근 뒤 objective별로 다시 부르는 경우 = 요청 집합 ⊆ 이미 잠근 집합)과 **진짜 전제 위반**을 구분하는 데 썼다(`:8-10`, `:91-94`). 스레드별로 독립이라 동시성 스펙에서도 안전.
- [x] **DatabaseCleaner 전략(`:transaction` vs `:truncation`)과 다중 커넥션 테스트** ([레슨 54](../lessons/0054-database-cleaner-strategy-and-concurrency-spec.html)) — `:transaction` 전략은 예제를 **미커밋 트랜잭션으로 감싸기** 때문에, 메인 스레드가 만든 픽스처가 **다른 커넥션(= 다른 스레드)에는 안 보인다.** 실제 동시성을 재현하려면 커밋되는 `:truncation`으로 바꿔야 한다(`rails_helper.rb:93-97`). 부수적으로 배운 것: DatabaseCleaner는 트랜잭션을 `joinable: false`로 열고 앱의 `ActiveRecord::Base.transaction`은 `true`라, `current_transaction.joinable?` 하나로 "테스트 하네스 트랜잭션"과 "앱 트랜잭션"을 구분할 수 있다(`:113-115`).

## 이번에 직접 검증한 것

- 스펙 실행 (컨테이너 `RAILS_ENV=test`): `reflect_..._spec` + `request_service_spec` **47 examples 0 failures**, `api/v2/objectives/check_in_spec` + concurrency spec(`RUN_CONCURRENCY_SPECS=1`) **32 examples 0 failures**. 동시성 7건은 실제 2스레드/2커넥션으로 돌고 예제당 10~15초.
- 리뷰어가 제시한 대안 ③(`app/models/lock.rb`의 named lock을 트랜잭션 밖에서 획득)은 **이 구현으로는 안 된다.** `Lock.acquire`가 `transaction do find_by(name).lock!` 순서라(`lock.rb:44-46`) `find_by`(비잠금 조회)가 read view를 먼저 열어버린다. 락은 잡히지만 블록 안의 조회는 여전히 옛 스냅샷.
- 대안 ①(`with_lock` 후 source reload)은 데드락 시나리오를 손으로 전개해서 기각: Tx1이 자식 A를 쓴 채 P를 기다리고, Tx2가 P를 쥔 채 A의 공유 락을 기다린다.
- policy 평가를 트랜잭션 밖으로 올린 변경은 안전. `approve_check_in?`(`objective_policy.rb:99-101`)이 `record_in_checkin_stage? && (managing_user? || (direct_check_in? && member?) || hr_admin?)` — revision을 전혀 안 보고 stage/user만 본다.
- 초안에서 지적했던 테넌트 스코프 이슈는 반영됨: 락 대상 KR id를 `objective_id`/`objectives.map(&:id)`로 교집합(`:52`, `:136`, `request_service.rb:20`).

## 작업하면서 막혔던 것

- **"코드가 많다 = 과설계"가 아니라는 것.** 처음엔 90줄(주석 제외)짜리 락 기계가 과해 보였는데, 붙은 이유를 하나씩 따라가보니 전부 "체크인과 상위 반영이 한 트랜잭션이어야 한다"는 전제 하나에서 파생됐다. 전제를 놓으면(반영을 커밋 뒤 별도 트랜잭션으로 분리) 같은 기계가 ~15줄이 된다. **설계 리뷰에서 볼 것은 코드량이 아니라 전제**라는 걸 이번에 체감했다.
- 저자의 근거를 검증하는 방법을 몰라서 처음엔 그냥 믿을 뻔했다. 결국 "제안된 대안이 왜 안 되는지"를 하나씩 코드로 전개하는 게 유일한 검증이었다 — 데드락은 시나리오를 손으로 펼쳐서, named lock은 `Lock.acquire` 구현을 직접 읽어서.
- 락 보유 구간(lock hold window)이 실제로 얼마나 위험한지 **숫자로 말하지 못했다.** `batch_approval`이 배치 전체 동안 조상 KR을 잡는다는 건 코드로 확인했지만, 목표 N개일 때 몇 초인지는 측정 방법을 몰랐다.

## 다음에 더 공부하고 싶은 것

- 낙관적 락(`lock_version`)으로 이 문제를 풀었다면 비관적 락 대비 어떤 트레이드오프가 생겼을지 — 이번에도 비관적 락 방식만 봤다.
- 락 보유 구간을 측정하는 법 (`SHOW ENGINE INNODB STATUS`, `performance_schema.data_locks`, 락 대기 시간 계측).
- 로드맵의 "1:N 팬인(여러 하위 → 하나의 상위) 값 반영 semantics" — 이번 PR의 1/n 균등분할이 정확히 이 항목인데 아직 미체크.
- 태그로 제외한 느린 스펙을 CI에서 어떻게 따로 돌리는지 (지금은 `RUN_CONCURRENCY_SPECS` 없이는 CI가 이 PR의 핵심 회귀를 전혀 안 돈다).

## 참고 — ROADMAP.md 대조 결과

- **기존 체크 항목 심화 3개**: 트랜잭션 격리 수준(레슨 44), 행 잠금(레슨 42), 원자성 vs 멱등성(레슨 31).
- **신규 체크 5개**: 트랜잭션 경계 소유권(아키텍처), `ActiveSupport::CurrentAttributes`(Controller), DatabaseCleaner 전략 / 다중 커넥션 동시성 스펙 / 태그 기반 스펙 제외(테스트).
- **신규 미체크 1개**: 낙관적 락 vs 비관적 락.
- 격리 수준 항목의 이상현상 목록에 `Lost Update`가 빠져 있어 문구 보정(NOTES.md엔 2026-07-16 학습 기록이 있었다).
