# 1:1 미팅 설정에 use_required_template 옵션 추가

> 날짜: 2026-06-25
> 브랜치: add-required-one-on-one-template

## 작업 한 줄 요약

`one_on_one_settings` 테이블에 템플릿 필수 사용 여부 boolean 컬럼(`use_required_template`, 기본값 false)을 추가하고, API 파라미터 수신 및 응답 JSON 노출까지 연결했다.

## 변경 파일 4개

| 순서 | 파일 | 역할 |
|------|------|------|
| 1 | `db/migrate/20260625103034_add_use_required_template_to_one_on_one_settings.rb` | DB 테이블에 컬럼 추가 |
| 2 | `app/models/one_on_one_setting.rb` | 스키마 주석 동기화 |
| 3 | `app/controllers/v1/workspaces.rb` | API params로 받도록 선언 |
| 4 | `app/controllers/entities/workspaces/one_on_one_setting_entity.rb` | 응답 JSON에 expose |

## 이 작업에서 처음 배운 개념

- [x] [마이그레이션(Migration)](../concepts/migration.md)
- [x] [클래스와 인스턴스](../concepts/class-and-instance.md)
- [x] [상속과 오버라이드](../concepts/inheritance-and-override.md)

## 작업하면서 막혔던 것

**"마이그레이션은 클래스이다"가 이해 안 됐다.**
→ React 클래스 컴포넌트(`class MyComponent extends React.Component`)와 구조가 동일하다는 걸 보고 연결됐다.

**인스턴스가 뭔지 몰랐다.**
→ 클래스는 붕어빵 틀, 인스턴스는 찍어낸 붕어빵. `new`로 만든다. Rails가 마이그레이션 실행 시 내부적으로 `MigrationClass.new`를 호출한다.

**render()가 어디서 오는지 혼란스러웠다.**
→ 내가 호출하는 게 아니라 프레임워크(React/Rails)가 적절한 타이밍에 호출한다. 내가 하는 건 내용을 "정의"하는 것뿐.

## 다음에 더 공부하고 싶은 것

- `declared(params, include_missing: false)` 가 정확히 뭘 하는지
- `expose`가 내부적으로 어떻게 동작하는지
- 마이그레이션 롤백(`db:rollback`)은 어떻게 되는지
