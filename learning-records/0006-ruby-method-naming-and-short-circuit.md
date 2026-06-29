# 0006 — Ruby `?` `!` `&.` 그리고 단락 평가

**날짜**: 2026-06-29
**출처**: ppback PR #5479 디버깅 (`use_required_template` 밸리데이션 구현)

## 배운 것

### `?` 메서드 컨벤션
boolean을 반환하는 메서드에 붙이는 약속. `setting.user?`, `comment.completed?`처럼
이 레포 전체에서 사용 중. 오늘 `privacy_blocked?`, `template_required?`를 직접 만들었다.

### `!` 메서드 컨벤션
두 가지 의미: (1) 실패 시 예외 발생 (`save!`, `discard!`), (2) 원본 객체 변경 (`sort!`).
이 레포에서는 주로 (1) 용도로 쓴다.

### 단락 평가 (Short-circuit Evaluation)
`&&`는 왼쪽이 falsy면 오른쪽을 실행하지 않는다.
`setting&.user? && setting.use_required_template`에서 `setting`이 nil이면
`setting&.user?`가 nil을 반환 → `&&`가 오른쪽 실행을 건너뜀.

### Safe Navigation Operator (`&.`)
`setting&.user?` = setting이 nil이면 nil 반환, 아니면 `user?` 호출.
JS Optional Chaining `?.`과 동일한 개념.

## 막혔던 것과 해결

`setting.user?`에서 `&.`을 제거했더니 기존 테스트 12개 `NoMethodError` 발생.
원인: 테스트는 팩토리로 객체를 직접 생성해 `one_on_one_setting`이 nil.
해결: `before` 블록에 `GET /one_on_one_settings` 추가 → 실제 프로덕션 플로우 재현
→ `find_or_create_by!` 트리거 → setting 항상 존재 → `&.` 제거 가능.

## 리팩토링 흐름

```
# 처음
error!(...) if setting&.user? && setting.use_required_template && ...

# 최종: helpers에 메서드로 추출
def privacy_blocked?(setting) = params[:privacy] && !setting.use_privacy_comment
def template_required?(setting) = setting.user? && setting.use_required_template && ...
def check_one_on_one_setting(setting)
  error!(...) if privacy_blocked?(setting)
  error!(...) if template_required?(setting)
end
```

## 다음에 더 공부할 것

- 서비스 객체(Service Object) 패턴 — 검증 로직이 늘어나면 helpers에서 서비스로 이전하는 기준
- RuboCop `Style/GuardClause` 규칙 — 언제 guard clause가 적절하고 언제 trailing if가 나은지
