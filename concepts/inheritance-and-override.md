# 상속(Inheritance)과 오버라이드(Override)

> 섹션: 섹션 2. Ruby 기초

## 한 줄 정의

상속은 부모 클래스의 기능을 물려받는 것. 오버라이드는 물려받은 메서드를 자식 클래스에서 덮어쓰는 것.

## 이해한 대로 설명

부모 클래스가 이미 만들어둔 기능을 `<`(Ruby) 또는 `extends`(JS)로 물려받아 쓴다. 부모가 "이 이름의 메서드를 나중에 호출할게, 네가 내용 채워"라고 약속한 메서드를 자식이 구현하는 게 오버라이드다.

핵심: **프레임워크(부모)가 타이밍을 잡고, 내가(자식) 내용을 채운다.**

## 코드 예시

React (JS):
```jsx
class MyComponent extends React.Component {
  // render()는 React가 호출 타이밍을 잡음
  // 내가 하는 건 내용을 정의하는 것
  render() {
    return <div>hello</div>
  }
}
```

Rails 마이그레이션 (Ruby):
```ruby
class MyMigration < ActiveRecord::Migration[7.1]
  # change()는 Rails가 db:migrate 시 호출함
  # 내가 하는 건 내용을 정의하는 것
  def change
    add_column :table, :column, :boolean
  end
end
```

`extends` = `<` — 언어만 다를 뿐 동일한 의미.

## 상속으로 얻는 것

`< ActiveRecord::Migration`을 쓰면 아래 메서드를 내가 만들지 않아도 쓸 수 있다:
- `add_column` — 컬럼 추가
- `remove_column` — 컬럼 삭제
- `create_table` — 테이블 생성

React에서 `extends React.Component`로 `setState`, `componentDidMount`를 공짜로 쓴 것과 같은 원리.

## 처음엔 헷갈렸던 것

`render()`를 내가 "끌어쓰는" 건지, 내가 "만드는" 건지 헷갈렸다.
→ 내가 만드는(오버라이드) 것이고, 프레임워크가 호출하는 것이다. 나는 내용만 채운다.

## 배운 작업

- [2026-06-25 use_required_template 추가](../work-log/2026-06-25-add-use-required-template.md)
- [2026-07-07 Workspace.self.find 오버라이드 제거](../work-log/2026-07-07-delete-workspace-self-find.md) — 프레임워크가 기대하는 정상적인 오버라이드가 아니라, 이미 의미가 정해진 메서드(`Model.find`)를 완전히 다른 의미로 바꿔치기한 위험한 사례

## 관련 개념

- [클래스와 인스턴스](class-and-instance.md)
- [마이그레이션](migration.md)
- [공개 식별자(Public ID)와 내부 PK 분리 패턴](public-id-vs-primary-key.md) — 이 두 값을 구분 안 하고 하나의 오버라이드로 뭉뚱그린 게 실제 버그로 이어진 사례
