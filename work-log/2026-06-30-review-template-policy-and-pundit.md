# review_template copy-on-write → 수정 차단 PR 리뷰

**날짜**: 2026-06-30
**PR**: #5486 `[리뷰] reviews가 있는 review_template 수정 차단 및 안전성 개선`
**브랜치**: `feature/review-template-copy-on-write`

---

## 작업 한 줄 요약

reviews가 존재하는 review_template을 수정할 때 데이터 유실이 발생하던 버그를,
copy-on-write 대신 policy 레이어에서 403으로 차단하는 방식으로 수정한 PR을 리뷰했다.

---

## 이번 작업에서 처음 배운 개념

### Pundit 권한 체크 흐름 (레슨 12)

`authorize record, :action?` 한 줄이 내부에서 거치는 경로:

```
authorize review_template, :update?
  → Pundit이 ReviewTemplatePolicy 찾음 (네이밍 컨벤션: 모델명 + Policy)
  → ReviewTemplatePolicy.new(pundit_user, review_template).update? 실행
  → false → Pundit::NotAuthorizedError 발생
  → rescue_from 이 잡음
  → user_not_authorized → error!(403)
```

### rescue_from: 전역 예외 핸들러

JS `try/catch`와 차이점:
- JS: 매 함수마다 직접 감싸야 함
- `rescue_from`: 한 번 등록하면 전체 API에 자동 적용 (Express `app.use(errorHandler)` 와 동일)

이 프로젝트의 예외-상태코드 매핑:
```ruby
rescue_from ActiveRecord::RecordNotFound        → 404
rescue_from ActiveRecord::RecordInvalid         → 400
rescue_from Pundit::NotAuthorizedError          → 403
rescue_from Grape::Exceptions::ValidationErrors → 400
rescue_from ActiveRecord::RecordNotUnique       → 409
```

### pundit_user: Member를 넘기는 이유

Pundit 기본값은 `current_user`지만 이 프로젝트는 `Member`를 넘긴다.
권한이 "누구인가"가 아닌 "이 워크스페이스에서 어떤 역할인가"로 결정되기 때문.

### Discard gem의 kept 스코프

- `reviews` → 전체 (soft-delete 포함)
- `reviews.kept` → soft-delete 되지 않은 것만

이 PR의 핵심: `alias update? show?` → `show? && !record.reviews.kept.exists?`

---

## 리뷰에서 발견한 버그

**`PUT ':item_id'` 엔드포인트에 old copy-on-write 로직 잔존**

`PUT ':id'`에서는 copy_flag 블록을 제거했지만 개별 항목 수정 엔드포인트(`PUT ':id/:review_type/:item_id'`)에는 그대로 남아 있음.

문제 시나리오:
1. template에 soft-delete된 review 있음 (`reviews.kept` = 0, `reviews.exists?` = true)
2. policy 통과 (`reviews.kept.exists? == false`)
3. `if review_template.reviews.exists?` → true → deep_clone 실행 (의도치 않은 동작)

---

## 막혔던 것과 해결 방법

**"policy에서 false가 나오면 어떻게 403이 되나?"**

컨트롤러에 에러 코드를 직접 쓰는 코드가 없어서 처음엔 연결이 안 됐다.
`grape_base.rb`의 `rescue_from` + `Pundit::NotAuthorizedError` 흐름을 추적하면서 해결됨.

핵심 깨달음: 에러 코드 매핑은 컨트롤러가 아닌 `grape_base.rb`에 전역으로 등록돼 있다.

---

## 다음에 더 공부할 것

- [ ] `policy_scope`는 뭐가 다른가? (`authorize`는 단건, `policy_scope`는 컬렉션 필터링)
- [ ] `ApplicationPolicy` 안에 있는 공통 메서드들 (`admin?`, `user_is_member?` 등)
- [ ] Discard gem의 soft-delete 전체 매커니즘
