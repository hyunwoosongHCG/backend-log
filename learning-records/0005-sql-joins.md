# SQL JOIN 개념 습득

2026-06-29 Sentry 에러 디버깅 중 직접 마주쳐서 학습했다.

`appraisees_query.rb`에서 `objection_status` 필터가 JOIN 없이 서브쿼리 안에서 다른 테이블 컬럼을 참조해 `Unknown column` 에러가 발생했고, 수정 과정에서 INNER JOIN과 LEFT OUTER JOIN의 차이를 실무로 체득했다.

**Evidence**: Sentry 이슈 PERPL-BACK-44B 디버깅 및 `appraisees_query.rb` 수정 완료.

**Implications**:
- JOIN 없이 WHERE를 쓰는 것이 단순 쿼리에서는 운 좋게 동작할 수 있지만 서브쿼리에서는 반드시 에러가 난다
- `is_objection=false` (없는 것을 찾는 경우)는 LEFT OUTER JOIN + WHERE NULL 패턴이 필요하다
- 다음으로 서브쿼리(`WHERE id IN (SELECT ...)`) 개념 학습 예정
