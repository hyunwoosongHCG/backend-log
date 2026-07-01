# 자동 타임스탬프 관리 (created_at / updated_at)

> 섹션: 섹션 3. Rails 기초 — 콜백

## 한 줄 정의

`created_at`/`updated_at` 컬럼만 있으면, ActiveRecord가 레코드 저장 시점마다 알아서 값을 채워주는 프레임워크 기본 기능. 내가 직접 코드로 세팅하지 않아도 된다.

## 이해한 대로 설명

프론트에서 `createdAt: new Date()`처럼 값을 직접 만들어 채워 넣던 것과 다르게, Rails는 테이블에 `created_at`/`updated_at` 두 컬럼만 있으면(보통 `t.timestamps`로 마이그레이션에서 한 번에 생성) 별도 코드 없이도 자동으로 채워준다.

- `created_at`: 레코드가 처음 INSERT될 때 1번만 세팅
- `updated_at`: `save`/`update`/`update!`로 UPDATE가 실제로 발생할 때마다 매번 현재 시각으로 갱신

이건 `ActiveRecord::Timestamp`라는 모듈이 모든 모델에 자동으로 섞여 들어가서, 저장 직전에 "콜백처럼" 동작하기 때문이다. 즉 `before_save`를 내가 직접 안 써도, Rails가 이미 그 자리에 콜백을 걸어둔 셈이다.

## 코드 예시

```ruby
# 마이그레이션 - 이 한 줄이 created_at, updated_at 두 컬럼을 만든다
create_table :objectives do |t|
  t.string :name
  t.timestamps   # ← created_at, updated_at 자동 생성
end

# 모델 코드에는 아무것도 안 써도 된다
objective = Objective.create(name: "Q3 목표")
objective.updated_at # => 방금 생성된 시각 (자동)

objective.update(name: "Q3 목표 수정")
objective.updated_at # => 방금 수정한 시각으로 자동 갱신
```

## 처음엔 헷갈렸던 것

모델 파일(`objective.rb`)을 아무리 찾아봐도 `updated_at`을 세팅하는 코드가 없어서, "이게 어디서 갱신되는 거지?"라는 의문이 들었다.

→ 이건 모델 코드가 아니라 **프레임워크가 내장한 동작**이라는 걸 확인했다. 반면, 같은 레코드가 아니라 **다른 테이블**(예: 이력 테이블)에 뭔가를 기록하려면, 이건 프레임워크가 절대 대신해주지 않고 반드시 내가 명시적으로 `SomeHistory.create!(...)`를 호출해야 한다는 대조점도 함께 배웠다. "같은 row 저장" vs "다른 row 생성"의 차이.

## 배운 작업

- [2026-07-01 Objective updated_at 갱신 시점 & 핵심성과 이력 기록 구조 파악](../work-log/2026-07-01-objective-updated-at-and-key-result-history.md)

## 관련 개념

- [Dirty Tracking](dirty-tracking.md)
- [마이그레이션](migration.md)
