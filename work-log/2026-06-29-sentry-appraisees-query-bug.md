# Sentry PERPL-BACK-44B — appraisees_query JOIN 누락 버그 수정

## 작업 한 줄 요약

`AppraiseesQuery#objection_status`가 JOIN 없이 서브쿼리 안에서 외부 테이블 컬럼을 참조해 MySQL 에러가 발생한 것을 수정했다.

## 이번 작업에서 처음 배운 개념

- **[SQL JOIN](../lessons/0004-sql-joins.html)** — INNER JOIN vs LEFT OUTER JOIN의 차이와 서브쿼리 안에서 JOIN이 없으면 에러가 나는 이유
- **서브쿼리(Subquery)** — `WHERE id IN (SELECT id FROM ...)` 패턴, 컨트롤러에서 쿼리 결과를 다시 감싸는 이유
- **preload vs joins** — JOIN은 필터링/정렬용, preload는 N+1 방지용으로 역할이 다르다
- **has_one** — 1:1 연관관계 선언, 외래키가 상대 테이블에 있다

## 막혔던 것과 해결 방법

- `is_objection=false`에 단순히 `joins`만 추가하면 안 된다는 것을 놓쳤다. 찾으려는 대상(이의신청 없는 사람)이 INNER JOIN에서 이미 제거되기 때문에 LEFT OUTER JOIN + WHERE NULL 패턴이 필요하다.

## 다음에 더 공부할 것

- 서브쿼리가 생성되는 조건과 그 이유
- N+1 문제 상세 — preload / includes / eager_load 차이
- ActiveRecord 연관관계 선언 (`has_one`, `has_many`, `belongs_to`)
