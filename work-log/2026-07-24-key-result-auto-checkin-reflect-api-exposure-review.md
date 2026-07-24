# 핵심성과 체크인 자동 반영 기능 — API 노출 검증 + 테스트 커버리지 보강 + 엔티티 설계 판단

> 날짜: 2026-07-24
> 브랜치: feature/key-result-auto-checkin-reflect
> 커밋: `8986941`(feat: 핵심성과 체크인 자동 반영 대상 정보 API 응답에 노출)
> 이어지는 작업: [2026-07-23 작업](2026-07-23-key-result-auto-checkin-reflect-design-and-schema.md)
> 관련 Slack: #C60TEJMB7 (프론트 일괄 승인 밸리데이션 스펙 스레드)

## 작업 한 줄 요약

전 세션 사이 외부에서 추가된 API 노출 작업(엔티티 필드/네이밍 변경, eager loading)을 코드로 검증하고, 코드 리뷰에서 나온 테스트 커버리지 갭을 채우다가 실제 버그 2개(interval kind 팩토리 검증 실패, `let_it_be` 오염)를 발견해 고쳤다. 새로 추가된 최소 엔티티가 과설계인지, `auto_reflect_target_key_result_ids` 필드를 쿼리 파라미터에 따라 조건부로 노출해야 하는지를 코드/Slack 스펙 대조로 직접 판단해봤고, 실제로 게이팅을 구현했다가 "프론트 실사용 전에는 성급한 최적화"라는 결론으로 되돌린 뒤 커밋했다.

## 이번 작업에서 처음 배운 개념

- Grape::Entity의 `if:` 조건부 expose 두 가지 성격 — 하나는 순수 성능/페이로드 최적화(쿼리 컨텍스트와 무관하게 항상 올바른 값을 계산할 수 있지만 비용이 아까운 경우), 다른 하나는 **정합성 문제**다. 이 코드베이스의 `team_position` 필드는 `'team' when` 분기에서만 `.select('team_objective_positions.position AS team_position')`으로 만들어지는 가상 컬럼이라, 다른 분기(다른 SQL)로 로드된 레코드에서 접근하면 `ActiveModel::MissingAttributeError`가 날 수 있다. `if: :view_team` 가드는 사실 이 크래시를 막는 필수 장치였다. 반면 이번에 다룬 `auto_reflect_target_key_result_ids`는 순수 Ruby 모델 메서드라 어느 분기에서 호출해도 항상 올바르게 계산되므로, 게이팅 여부는 순전히 비용 대 복잡도 트레이드오프 문제였다. 겉보기엔 똑같은 `if:` 패턴이라도 "왜 가드가 필요한가"가 완전히 다를 수 있다는 걸 실제 코드로 구분해봤다.
- `let_it_be`(test-prof gem)와 일반 `let`/`let!`의 차이 — `let`/`let!`은 예제(example)마다 새로 평가되지만, `let_it_be`는 같은 example group 안에서 **하나의 객체를 재사용**한다(트랜잭션 롤백은 DB 레코드는 되돌리지만, 이미 만들어진 Ruby 객체의 인메모리 속성 변경은 되돌리지 않는다). 그래서 `key_result.objective.stage = 'closed'`처럼 저장 없이 속성만 바꾸는 테스트를 `let_it_be` 공유 객체에 하면, 랜덤 실행 순서에 따라 다른 예제로 오염이 넘어간다. 이번에 실제로 이 버그를 겪고 `let`으로 바꿔서 고쳤다.
- FactoryBot의 트레이트(trait)가 모델 유효성 검사와 맞물리는 방식 — `KeyResult`는 `kind == 'interval'`이면 `key_result_option` 존재를 검증하는데, 팩토리에 `kind: :interval`만 넘기면 옵션이 없어 `RecordInvalid`가 난다. `:interval` 트레이트가 옵션까지 같이 만들어주므로 `create(:key_result, :interval, ...)`처럼 트레이트로 호출해야 한다는 걸 에러를 직접 만나고서야 알았다.

## 작업하면서 막혔던 것과 해결 방법

- **"쿼리 파라미터에 따라 응답 모양을 바꾸는 게 하드코딩 아닌가"를 걱정하다가, 실제로는 이 코드베이스가 이미 쓰는 패턴이라는 걸 뒤늦게 확인함.** `Entities::Objectives::IndexEntity`에 이미 `if: :view_team`, `if: :sort_position` 같은 조건부 expose가 있었는데, 처음엔 이걸 놓치고 새 필드를 게이팅하는 게 이질적인 시도라고 생각했다. 실제 컨트롤러 코드를 다시 읽고 나서야 "같은 파일 안에서 이미 검증된 관례를 따라가는 것"임을 확인했다.
- **게이팅을 실제로 구현했다가 되돌림.** `auto_reflect_target_key_result_ids`가 `objective_type=pending`(사용자 승인 대기 목록)에서만 필요하다는 걸 케이스문 구조로 확인하고, `include_auto_reflect_targets` 플래그 + `.includes` 분기까지 실제로 구현하고 테스트도 다시 맞췄다. 하지만 프론트가 아직 이 필드를 어디서 어떻게 쓸지 확정되지 않은 시점이라, "성급한 최적화"로 판단해 커밋 전에 되돌렸다. 구현 자체는 어렵지 않았지만, 실사용 패턴을 보기 전에 API 응답 모양을 고정하는 결정을 내리는 게 더 위험하다는 걸 판단 기준으로 삼았다.
- **어드민 엔티티(`Entities::AdminObjectives::ObjectivesEntity`)에만 쓰이는 별도의 최소 엔티티(`AutoCheckinReflectEntity`)가 있어서, "이건 사용자쪽과 무관한 별개 문제"라고 잘못 결론 내렸다가 지적받고 정정함.** 최소 엔티티 자체는 어드민에서만 쓰이는 게 맞지만(과설계 아님), `auto_reflect_target_key_result_ids`가 쿼리와 무관하게 항상 노출된다는 진짜 문제는 사용자쪽 엔티티에도 동일하게 존재했다. "이 엔티티가 여기서만 쓰인다"는 사실과 "이 필드가 조건 없이 노출된다"는 사실을 섞어서 성급하게 결론 낸 게 실수였다.

## 다음에 더 공부하고 싶은 것

- `key_results.super_key_result_id` self-referencing 체인에 실제로 순환 데이터가 있는지 MySQL 8.4의 `WITH RECURSIVE`(CYCLE 절 없음, 수동 path-tracking 필요)로 진단하는 작업이 다음 단계로 남아있음
- 어드민 엔드포인트(`POST /admins/objectives`)는 `pending`/`closed`/`archive`/`temp`처럼 독립적인 boolean 파라미터 여러 개의 조합이라, 사용자쪽처럼 단일 `objective_type` 스위치로 깔끔하게 게이팅하기 어려움 — 이런 다중 필터 조합 엔드포인트에서 조건부 노출을 어떻게 설계하는 게 맞는지
- 목표 생성/수정/벌크생성 시 `super_key_result_id` 순환 참조를 막는 검증 로직 설계 (아직 미착수)

## 참고 — ROADMAP.md 대조 결과

"Grape API" 섹션에 `if:` 조건부 expose 항목을, "테스트" 섹션에 `let_it_be` 항목을 새로 추가하고 이번 작업 링크로 체크함.
