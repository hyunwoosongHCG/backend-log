# 클래스(Class)와 인스턴스(Instance)

> 섹션: 섹션 2. Ruby 기초

## 한 줄 정의

클래스는 붕어빵 틀(설계도), 인스턴스는 그 틀로 찍어낸 실물. `new`로 인스턴스를 만든다.

## 이해한 대로 설명

클래스 하나로 여러 인스턴스를 만들 수 있다. 각 인스턴스는 같은 구조를 가지지만 독립된 데이터를 가진다.

## 코드 예시

JavaScript (이미 알던 것):
```js
class User {
  constructor(name) {
    this.name = name
  }
  greet() {
    return `안녕, 나는 ${this.name}`
  }
}

const user1 = new User("현우")  // 인스턴스 1
const user2 = new User("지수")  // 인스턴스 2

user1.greet() // "안녕, 나는 현우"
user2.greet() // "안녕, 나는 지수"
```

Ruby (같은 개념):
```ruby
# Rails가 마이그레이션 실행 시 내부적으로 하는 일
migration = AddUseRequiredTemplateToOneOnOneSettings.new
migration.change
```

## 처음엔 헷갈렸던 것

"인스턴스 생성"이라는 말이 추상적으로 느껴졌다.
→ React가 클래스 컴포넌트를 화면에 그릴 때 내부적으로 `new MyComponent()`를 하고 `render()`를 호출한다는 걸 알고 나서, 이미 써온 개념이라는 걸 알았다.

## 배운 작업

- [2026-06-25 use_required_template 추가](../work-log/2026-06-25-add-use-required-template.md)

## 관련 개념

- [상속과 오버라이드](inheritance-and-override.md)
- [마이그레이션](migration.md)
