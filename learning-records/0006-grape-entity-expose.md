# Grape Entity expose DSL · delegate · object · N+1 추적

2026-06-30 ppback N+1 성능 개선 PR 리뷰 중 학습했다.

`v2/admins/one_on_ones.rb` 컨트롤러가 `HistoryScheduleEntity`를 렌더링하면서
`includes`로 N+1을 막고, expose로 불필요한 연관 객체 로드를 제거하는 패턴을 분석했다.

**Evidence**: `id → ids` 성능 개선 PR (커밋 0fa4179c2) 코드 추적.

**Implications**:
- `expose :x` 는 어노테이션이 아니라 클래스 본문에서 호출하는 Ruby 메서드 (DSL)
- `object` = 렌더링 대상 모델 인스턴스 (JS의 props)
- `delegate :x, to: :object` = `def x; object.x; end` 자동 생성
- Entity에서 `object.연관관계` 호출 → 컨트롤러에서 includes 필요
- `expose :컬럼명` 으로 직접 노출하면 연관 객체 로드 자체를 줄일 수 있다
