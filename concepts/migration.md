# 마이그레이션 (Migration)

> 섹션: 섹션 3. Rails 기초

## 한 줄 정의

DB 테이블 구조를 코드로 변경하는 "설계도 변경서". 실행하면 실제 DB에 반영된다.

## 이해한 대로 설명

프론트에서 TypeScript 타입에 필드를 추가하면 코드에만 반영된다. 백엔드는 실제 DB 테이블에도 컬럼이 생겨야 하기 때문에 마이그레이션이 필요하다.

마이그레이션 파일을 만들고 `rails db:migrate`를 실행하면, Rails가 그 파일을 읽어서 DB에 적용한다. 실행 기록도 DB에 남기기 때문에 같은 파일이 두 번 실행되지 않는다.

## 코드 예시

```ruby
class AddUseRequiredTemplateToOneOnOneSettings < ActiveRecord::Migration[7.1]
  def change
    add_column :one_on_one_settings, :use_required_template, :boolean, default: false, null: false
    #          ↑ 테이블 이름              ↑ 컬럼 이름              ↑ 타입    ↑ 기본값         ↑ 빈값 허용 안 함
  end
end
```

## 처음엔 헷갈렸던 것

"마이그레이션은 클래스이다"는 말이 낯설었다.
→ `class MyMigration < ActiveRecord::Migration` 구조가 React의 `class MyComponent extends React.Component`와 동일한 패턴이라는 걸 알고 연결됐다.

`def change`는 내가 만드는 메서드지만, Rails가 migrate 실행 시 자동으로 호출한다. 프레임워크가 타이밍을 잡고, 내가 내용을 채우는 구조.

## 배운 작업

- [2026-06-25 use_required_template 추가](../work-log/2026-06-25-add-use-required-template.md)

## 관련 개념

- [클래스와 인스턴스](class-and-instance.md)
- [상속과 오버라이드](inheritance-and-override.md)
