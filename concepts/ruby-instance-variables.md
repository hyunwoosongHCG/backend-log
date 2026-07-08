# Ruby 인스턴스 변수(@)와 변수 종류

> 섹션: 섹션 2. Ruby 기초

## 한 줄 정의

`@변수명`은 어노테이션/데코레이터가 아니라 "이 객체(인스턴스)에 속한 변수"를 나타내는 접두사다. Ruby는 접두사 기호로 변수의 스코프(지역/인스턴스/클래스/전역)를 구분한다.

## 이해한 대로 설명

Java의 `@Override`, Python의 `@property` 같은 데코레이터/어노테이션을 먼저 접한 배경에서는 `@badge_stats`를 보고 같은 종류의 문법이라고 오해하기 쉽다. 하지만 Ruby에는 언어 차원의 데코레이터/어노테이션 문법 자체가 없다. `@`는 오직 변수의 범위(scope)를 표시하는 접두사일 뿐이다.

```ruby
변수명        # 지역 변수 — 정의된 메서드/블록 안에서만 유효
@변수명       # 인스턴스 변수 — 해당 객체 전체에서 유효
@@변수명      # 클래스 변수 — 클래스와 모든 인스턴스가 공유 (사실상 사용 지양)
$변수명       # 전역 변수 — 프로세스 전체 (사실상 사용 지양)
```

## 코드 예시

`app/controllers/entities/feedbacks/datum_entity.rb`에서 본 예:

```ruby
def badge_stats
  @badge_stats ||= badgepool_group.transform_values do |badge_count|
    {
      median: badge_count.median(user_count),
      max: badge_count.max || 0,
      average: user_count.zero? ? 0 : (badge_count.sum.to_f / user_count).round,
    }
  end
end
```

- `@badge_stats`는 이 `DatumEntity` 인스턴스에 저장되는 변수.
- `||=`와 결합하면 **메모이제이션(memoization)** 패턴이 된다 — `@badge_stats`가 `nil`이면 오른쪽 계산을 실행해 대입하고, 이미 값이 있으면 그대로 재사용한다.
- 이 메서드는 리팩터링 전에 `percentile_series`·`radar_indicator`·`radar_series` 세 곳에서 각각 중복 수행되던 median 정렬(O(n log n))·max 스캔을 하나로 모아 렌더당 한 번만 계산하도록 만든 것이다.

## JS와 대응시켜 헷갈리지 않기

- JS: `this.badgeStats = this.badgeStats || computeStats()` — `this.속성명`으로 인스턴스 속성에 접근.
- Ruby: `@badge_stats ||= compute_stats` — `@변수명`으로 인스턴스 변수에 접근.
- 즉 Ruby의 `@`는 JS의 `this.`와 가장 비슷한 역할이다. Python 데코레이터(`@property`)나 Java 어노테이션(`@Override`)과는 아예 다른 개념이므로 별도로 기억해야 한다.

## 관련 개념

- [클래스와 인스턴스](class-and-instance.md)
- [Symbol vs String](symbol-vs-string.md)
