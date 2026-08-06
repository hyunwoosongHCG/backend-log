# 연관관계 스코프의 비대칭

> 섹션: Rails / 실무 패턴

## 한 줄 정의

연관관계에 걸린 스코프가 **조인 대상 테이블 자신의 컬럼만** 검사하고 그 레코드가 속한
**부모의 상태는 안 보기 때문에**, 같은 정책을 표현한 줄 알았던 두 연관관계가 서로 다르게 동작하는 것.

## 이해한 대로 설명

`has_many`에 람다로 스코프를 걸면 그 조건은 **조인되는 테이블에만** 적용된다.
그 테이블의 레코드가 어떤 부모에 속해 있고 그 부모가 어떤 상태인지는 조건에 안 들어간다.
쓰는 사람은 "삭제된 건 빠지겠지"라고 읽지만, 실제로는 그 레코드 자신이 삭제 표시됐을 때만 빠진다.

문제는 **삭제 처리가 부모 쪽에서만 일어날 때** 드러난다. 목표를 삭제해도 그 목표에 속한
핵심성과의 `active` 플래그는 그대로 남는 설계라면, 핵심성과 연관관계는 삭제된 목표의
핵심성과를 계속 들고 온다.

같은 개념("연계된 하위")을 표현하는 두 연관관계가 나란히 있는데 한쪽만 부모 상태를 보고
다른 쪽은 안 보면, **둘이 같은 정책이라고 착각하기 쉽다.** 이름이 대칭적일수록 더 그렇다.

## 코드 예시

```ruby
class KeyResult < ApplicationRecord
  # 하위 목표 — 목표 자신의 stage와 삭제 여부를 본다
  has_many :child_objectives,
           -> { where(stage: Objective::ACTIVE + Objective::CLOSED).kept },
           class_name: :Objective, foreign_key: :super_key_result_id

  # 하위 핵심성과 — 핵심성과 자신의 active만 본다. 소유 목표의 상태 조건이 없다.
  has_many :child_key_results,
           -> { where(active: true) },
           class_name: :KeyResult, foreign_key: :super_key_result_id
end
```

이름은 대칭인데 동작이 다르다. 목표를 삭제하는 코드가

```ruby
def archive_and_create_history(current_user_id)
  update!(stage: :archived)   # 핵심성과의 active는 건드리지 않는다
  create_history('Archived', current_user_id)
end
```

이렇게 `stage`만 바꾸기 때문에, `child_objectives`에서는 빠진 목표가
`child_key_results`에서는 그 목표의 핵심성과가 **그대로 남는다.**

해결은 조인해서 부모 조건까지 SQL에 넣는 것이다.

```ruby
has_many :reflect_source_key_results,
         lambda {
           unscope(:order)
             .joins(:objective)
             .where(active: true,
                    objective: { stage: Objective::ACTIVE + Objective::CLOSED, deleted_at: nil })
         },
         class_name: :KeyResult, foreign_key: :super_key_result_id,
         inverse_of: :super_key_result
```

`joins` 조건에는 `.kept`(Discard의 스코프)를 직접 못 쓰므로 `deleted_at: nil`로 같은 정책을
표현해야 한다. Discard 설정이 바뀌면 이쪽도 같이 고쳐야 하는 결합이 생긴다 — 주석으로 남겨뒀다.

## 처음엔 헷갈렸던 것

**"이미 있는 연관관계를 쓰면 되지 않나"** 라고 생각했다. 이름이 `child_objectives` /
`child_key_results`로 대칭이라 정책도 같을 거라 믿었다.

정작 발견한 건 나중이었는데, 프론트 엔티티가 이미 이 문제를 알고 Ruby 쪽에서 보정하고 있었다.

```ruby
object.child_key_results.select {|kr|
  kr.objective.stage.in?(Objective::ACTIVE + Objective::CLOSED) && !kr.objective.discarded?
}
```

즉 비대칭은 **이미 알려져 있었고 화면단에서 손으로 메우고 있던 것**이다. 연관관계 자체를
고치지 않았기 때문에, 그 연관관계를 새로 쓰는 코드는 매번 같은 함정을 다시 밟게 된다.

하나 더. **보정을 어디서 하느냐도 선택지다.** 화면은 목록을 그리려고 어차피 레코드를 다
로드하니 Ruby `select`가 자연스럽다. 하지만 나는 **건수만** 필요했다(평균의 분모).
그럴 땐 SQL에서 거르는 게 맞다. 같은 정책이라도 쓰임에 따라 구현 위치가 달라진다.

그리고 기존 연관관계를 고치는 대신 **전용 연관관계를 새로 뒀다.** `child_*`는 화면 노출에도
쓰이는데, 표시 요구가 바뀌어 조건이 달라지면 계산 결과가 조용히 따라 바뀐다. 계산과 표시는
분리해두는 게 안전하다.

## 배운 작업

- [핵심성과 자동 반영 — 1/n 분할 전환](../work-log/2026-08-06-key-result-auto-reflect-1n-split.md)

## 관련 개념

- [레슨 8 — ActiveRecord 연관관계](../lessons/0008-active-record-associations.html)
- [레슨 51 — 연관관계 스코프는 조인 대상의 부모를 보지 않는다](../lessons/0051-association-scope-asymmetry.html)
- [레슨 49 — where.not의 다중 조건은 AND가 아니라 NOR다](../lessons/0049-where-not-nor-vs-and.html) (스코프를 읽는 방식이 직관과 어긋나는 다른 사례)
