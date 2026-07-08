# Ruby 인스턴스 변수(@) vs 어노테이션 오해 정리

> 날짜: 2026-07-08
> PR: (없음 — ppback `add_date_on_filter_by_appraisal_in_feedbacks` 브랜치 작업 중 파생된 학습)

## 작업 한 줄 요약

`app/controllers/entities/feedbacks/datum_entity.rb`의 `badge_stats` 메서드를 보다가 `@badge_stats`의 `@` 기호를 Java `@Override`/Python `@decorator` 같은 어노테이션으로 오해해서, Ruby의 변수 스코프 접두사(`@`, `@@`, `$`) 개념과 `||=` 메모이제이션 패턴을 함께 정리했다.

## 이 작업에서 처음 배운 개념

- [x] 변수 종류 (지역, 인스턴스, 클래스, 전역) → [정리](../concepts/ruby-instance-variables.md)

## 작업하면서 막혔던 것

- `@badge_stats`를 보고 데코레이터/어노테이션 문법이라고 생각했다 → Ruby에는 언어 차원의 어노테이션 문법 자체가 없고, `@`는 인스턴스 변수 접두사일 뿐임을 확인.
- 해당 메서드가 왜 존재하는지(주석: "badgepool별 median/max/average를 렌더당 한 번만 계산해 재사용한다") 이해하려다 `||=` 메모이제이션 패턴과 연결지어 학습. 커밋(`b90ea0030 [Fix] 시간복잡도 개선`)을 확인해, 리팩터링 전엔 `percentile_series`·`radar_indicator`·`radar_series` 세 곳에서 median 정렬(O(n log n))·max 스캔이 중복 수행되던 것을 하나로 모은 변경임을 파악.

## 다음에 더 공부하고 싶은 것

- 클래스 변수(`@@`)와 전역 변수(`$`)가 실무에서 왜 지양되는지 (스레드 안전성, 상속 시 공유 문제 등).
- `attr_accessor`가 내부적으로 인스턴스 변수를 어떻게 읽고 쓰는 메서드를 자동 생성하는지.
