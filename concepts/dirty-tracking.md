# Dirty Tracking (변경 감지)

> 섹션: 섹션 3. Rails 기초 — ActiveRecord

## 한 줄 정의

ActiveRecord가 "이 레코드의 어떤 필드가 저장 전 값에서 저장 후 값으로 실제로 바뀌었는지"를 추적하는 기능. 아무것도 안 바뀌었으면 `save`/`update`를 호출해도 실제 SQL UPDATE 자체가 나가지 않는다.

## 이해한 대로 설명

프론트에서 폼 상태를 다룰 때 "값이 실제로 바뀐 필드만 diff해서 서버에 보낸다"는 개념과 비슷하다. Rails는 이걸 레코드 단위로 자동으로 해준다.

`.update(value: new_value)`를 호출해도 `new_value`가 기존 값과 완전히 같으면, ActiveRecord는 "dirty(변경됨)하지 않다"고 판단해서 UPDATE 쿼리를 아예 스킵한다. 이 때문에:

- 실제로 DB에 쿼리가 안 나간다 (성능상 이득 — `partial_writes` 옵션과 연결)
- 값이 안 바뀌었으니 `updated_at`도 갱신되지 않는다 ([자동 타임스탬프 관리](timestamps-and-callbacks.md)와 연결됨)

## 코드 예시

```ruby
key_result = KeyResult.find(1)
key_result.value # => 50

key_result.update(value: 50)   # 기존 값과 동일
key_result.changed?            # => false, UPDATE 쿼리 자체가 안 나감
key_result.updated_at          # => 그대로 (안 바뀜)

key_result.update(value: 80)   # 실제로 다른 값
key_result.updated_at          # => 방금 시각으로 갱신됨
```

실무 코드에서는 아예 저장을 시도하기 전에 값이 같은지 먼저 걸러내는 패턴도 흔하다.

```ruby
# 값이 같으면 애초에 체크인 이력 자체를 만들지 않음
next if key_result.value == new_value
```

## 처음엔 헷갈렸던 것

"업데이트를 호출했는데 왜 updated_at이 그대로지?"라는 의문에서 출발했다. 처음엔 버그인가 싶었는데, 실은 "값이 실제로 바뀌지 않으면 저장 자체가 no-op"이라는 ActiveRecord의 최적화 동작이었다. `changed?`, `attribute_changed?`, `saved_change_to_*?` 같은 메서드로 이 상태를 직접 확인할 수 있다는 것도 함께 알게 됐다.

## 배운 작업

- [2026-07-01 Objective updated_at 갱신 시점 & 핵심성과 이력 기록 구조 파악](../work-log/2026-07-01-objective-updated-at-and-key-result-history.md)

## 관련 개념

- [자동 타임스탬프 관리](timestamps-and-callbacks.md)
