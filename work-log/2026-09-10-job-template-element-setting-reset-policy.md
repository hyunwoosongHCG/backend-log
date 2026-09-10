# 직무직군 문항 설정(element_setting) 데이터 재설정 — 정책 기획

> 날짜: 2026-09-10
> PR: 없음 (기획 단계 — 코드 변경 없이 정책 설계 문서·PRD만 작성)

## 작업 한 줄 요약

Slack 스레드([평가 문항 설정 프로세스 진행 후 응답 리셋](https://hcgtheplus.slack.com/archives/C01A1FYK0D7/p1788228974988669))를 출발점으로, ppback의 데이터 재설정 로직을 프로세스별·대상자별·영역별로 비교하고, 직무직군 문항 설정 프로세스에 데이터 재설정을 지원한다면 어떤 정책이 맞을지 코드 근거로 설계했다. 산출물은 두 문서: 정책 비교 문서(`job-template-reset-policy.html`)와 그 정책을 얹을 위치를 정하는 PRD(`reset-granularity-prd.html`) — 아직 배치(영역 모달 vs 기존 데이터 재설정 모달) 등 일부는 미결.

## 이 작업에서 다룬 것 (구현 전, 조사·설계 단계)

- 일반 양식(복제 후 평가에 귀속) vs 직무직군 양식(`job_category_target_ids` 라이브 재조회)의 구조적 차이 — 왜 직무직군만 "데이터 재설정 시 문항 최신화 미지원"으로 결정됐는지의 근거
- 소프트 리셋(`appraisees_soft_reset`/`_bulk_soft_reset`)과 하드 리셋(`appraisees_reset`/`_bulk_reset`)이 `AppraisalScopeElement`를 다루는 방식 차이, 하드 리셋이 이미 job_template까지 재스냅샷한다는 사실 확인
- 상태(`AppraisalAppraiser#status`)만 되돌려도 하위 응답 레코드가 남아 있으면 프론트 잠금 로직(`RESPONDED_STATUSES`가 tempsaved도 "이미 응답"으로 취급)에 걸린다는 것을 프론트·백엔드 양쪽 코드로 대조 확인 → "응답만 지우기" 정책의 "필요한 변경"이 상태 전이가 아니라 데이터 폐기여야 하는 이유
- `after_soft_reset_appraisee_scope_element_service.rb:109`, `after_bulk_soft_reset_appraisee_scope_element_service.rb:218`에서 `closed!`이 프로세스 종류를 가리지 않고 전 평가자에 적용되는 기존 버그 확인(문항 설정 평가자도 강제 종료됨)

## 작업하면서 막혔던 것

- 처음에는 부분 영역 선택을 "정의되지 않은 상태"로 보고 스코프에서 제외했는데, `getIsElementSettingSubmitDisabledByNoSelection`과 점수 계산 서비스 코드를 직접 확인한 뒤 정정 — 영역별 부분 선택은 의도된 유효 상태였다.
- 정책 설계 중간에 "응답만 지우기"(선택 유지, 응답만 폐기)와 "문항 선택 되돌리기"(선택까지 삭제, soft-delete 마이그레이션 필요)를 혼동해 PRD가 후자 쪽으로 기울어졌던 것을 사용자 피드백으로 재정렬 중.

## 다음에 더 공부하고 싶은 것

- `Discard::Model` 소프트 삭제 패턴을 컬럼이 없는 테이블(`appraisal_appraisee_element_settings`)에 새로 얹을 때의 마이그레이션/정책 설계 — 이번엔 결국 필요 없다고 결론났지만 패턴 자체는 별도로 정리해볼 것
- enum 기반 `status`를 여러 프로세스 타입이 공유하는 서비스에서 다룰 때, "무조건 전이" 대신 "타입별 조건부 전이"로 안전하게 분기하는 설계 관례
