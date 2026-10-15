# [평가] 다중 평가 방식 묶음 키(method_group_number) 분리 — R1 백엔드 확장

> 날짜: 2026-10-15  
> PR: [hcgtheplus/ppback#5651](https://github.com/hcgtheplus/ppback/pull/5651) · 백로그 ssq-backlog#1721  
> 소스: Performance Plus(실무) — Rails 8.1 · Grape · MySQL 8  
> 내 역할: 설계·구현 — 백엔드 단독. 프론트 전환(R2)은 FE 담당, PRD는 hnlee

## 작업 한 줄 요약

평가와 360 피드백이 함께 쓰는 `elements` 테이블에서, 평가가 360 조건부 문항용 컬럼(`number`/`parent_element_number`)을 "한 문항의 여러 평가 방식" 묶음 용도로 빌려 쓰던 것을 전용 컬럼 `method_group_number`로 분리했다. 사용자 체감 변화는 없다.

## 성과

**Before → After**

- 평가 하위 방식 문항의 `is_optional`: `true`(조건부 문항이 아닌데 조건부로 표시되는 오염) → `false`. 360 조건부 문항은 그대로 `true`
- 평가에 조건부 문항을 도입할 수 없던 상태 → `number`/`parent_element_number`/`parent_standard_*`를 조건부 문항 전용으로 비워, 도입 시 그대로 쓸 수 있는 상태
- "방식 묶음"의 의미가 프론트 규약에만 있던 상태 → 백엔드 컬럼 + 모델 검증(평가 양식·영역 전용) + API 문서로 계약화
- 백필 대상: 평가 elements 181,501행 중 79,210행. 다중 방식 묶음 8,083개

**측정 방법**

- 실측: 프로덕션 replica에서 `connected_to(role: :reading)`로 조회한 값이다(remocon.sh로 rails console 접속).
  - 평가 row 181,501건, 그중 `number`가 null인 row 102,291건(57%)
  - 다음 이상 데이터는 모두 0건이었다: 부모를 찾지 못하는 자식, 체인, `number` 중복, null 혼재, 자식이 부모보다 앞선 순서
- 실측: 로컬 dev DB 백필 결과는 270행 채움, 761행 null 유지, 계산식과 다른 값 0건이었다.

**검증 근거**

- 신규·변경 스펙 176건 + 360·평가 회귀 871건, 모두 실패 0
- 로컬에서 migrate → rollback(2단계) → migrate 왕복, 백필 `redo` 확인
- impl-verifier가 plan 수용 기준 전 항목을 PASS로 판정

## 이번 작업에서 처음 배운 개념

- [x] [보편] **같은 컬럼, 다른 의미(의미 과적)**
  - 공유 테이블의 컬럼을 제품마다 다른 용도로 쓰면, 한쪽 기능을 확장하는 순간 다른 쪽과 충돌한다.
  - 분리 기준은 "컬럼을 공유하느냐"가 아니라 **"의미가 갈렸느냐"**다. `number`는 처음에 두 제품이 같은 의미(양식 안의 지역 식별자)라고 봤다. 그런데 "평가도 나중에 진짜 조건부 문항을 쓴다"는 제품 방향을 듣고 나니, 평가의 묶음 용도도 결국 떼어내야 했다.
- [x] [보편] **부모 포인터(인접 리스트) vs 공유 묶음 키**
  - 부모 포인터는 "누가 부모인가"를 데이터로 저장한다. 그래서 부모를 지우거나 순서를 바꿀 때마다 자식을 다시 지정해야 한다.
  - 공유 키는 "누구와 같은 묶음인가"만 저장하고 부모는 순서(`order_tag`)로 정한다. 삭제나 정렬에 강하다.
  - 저장 전 새 행끼리도 묶어야 해서 DB id(FK)가 아니라 클라이언트가 붙이는 지역 키가 필요했다.
- [x] [보편] **확장 → 전환 → 정리(expand/contract) 배포**
  - 컬럼의 의미를 옮기는 일은 3번에 나눠 배포한다.
    - R1 백엔드: 새 컬럼 + 구 필드 유지 + 호환 보정
    - R2 프론트 전환
    - R3 백엔드: 구 필드와 호환 코드 정리
  - R1만 나가 있어도 구 프론트가 동작해야 배포 순서에 묶이지 않는다.
  - 그리고 "동기화 없이 단순 추가"로 가면 **빈 값은 재백필로 메울 수 있지만, 틀린 값은 메울 수 없다**는 걸 예시로 확인했다(아래 막혔던 것 3번).
- [x] [보편] **멱등 백필과 배치 갱신**
  - `WHERE method_group_number IS NULL` 조건이면 다시 돌려도 결과가 같다. 배포 중 구 코드가 저장한 행도 재실행으로 메울 수 있다.
  - 공유 테이블은 한 문장으로 전체를 UPDATE하지 않고 id 범위 배치로 row lock을 짧게 유지한다. `down`도 같은 배치로 맞춘다(리뷰 지적).
- [x] [Rails 전용] **ActiveRecord `#dup`/`deep_clone`의 복사 범위**
  - `#dup`은 id와 타임스탬프만 비우고 모든 컬럼을 복사하며, 연관은 복사하지 않는다. `deep_clone(include:)`은 지정한 연관만 따라간다.
  - 그래서 묶음 키를 **컬럼**으로 두면 평가 시작, 양식 교체, 복사 경로에 코드 수정이 필요 없다. 별도 테이블이나 FK였다면 5곳 이상에서 id를 다시 매핑해야 했다.
  - 부수 발견: `deep_clone(includes: ...)`처럼 옵션 키에 오타가 나도 젬은 `:include`만 읽고 **조용히 무시**한다.
- [x] [Rails 전용] **Grape `declared(params, include_missing: false)`로 "키 없음"과 "null" 구분**
  - 호환 보정을 모델 콜백이 아니라 요청 단위에 둔 이유다. 모델에서는 "이번 요청에 키가 없었다"와 "기존 값이 있다"를 구분할 수 없다.
  - 그래서 부모 방식을 지운 뒤 방식을 추가하면 같은 문항이 두 키로 갈라진다.
  - 이 앱의 `declared`는 중첩 배열까지 HashWithIndifferentAccess라 symbol 키로 접근하는 게 안전하다(Grape 3.2.1 기본 param_builder).
- [x] [Rails 전용] **Grape::Entity `expose :predicate?, as: :is_x`로 같은 값을 두 이름으로 노출**
  - deprecated alias(`is_optional`)와 새 이름(`is_conditional`)을 함께 내려줄 때 쓴다.
  - 엔티티에 `def is_x` 메서드를 만들면 rubocop `Naming/PredicateMethod`에 걸린다. 레포에 이미 이 관례가 있었다.

## 작업하면서 막혔던 것과 해결 방법

1. **마이그레이션 생성기가 다른 체크아웃에 파일을 만들었다**
   - 떠 있던 Docker 컨테이너의 코드 볼륨이 `~/Desktop/ppback`(dev 체크아웃)에 바인드돼 있었다.
   - 두 디렉터리 이름이 모두 `ppback`이라 compose 프로젝트명이 같았고, 그래서 다른 디렉터리에서 `docker compose exec`를 해도 같은 컨테이너로 붙었다.
   - 해결: 작업 위치를 그 체크아웃으로 옮겼다. 기존 미커밋 변경은 GitHub Desktop 규칙의 이름으로 stash했다.
2. **`schema.rb` dump에 무관한 컬럼이 섞였다**
   - 로컬 DB에 다른 브랜치 마이그레이션의 컬럼(`objective_settings.ai_recommendation_prompt`)이 남아 있어서, `db:migrate` 때마다 dump에 끼었다. annotate도 다른 모델 주석을 다시 썼다.
   - 해결: 이번 변경 한 줄만 남기고 수동으로 걷어냈다. 마이그레이션을 실행할 때마다 다시 확인해야 한다.
3. **"동기화 없이 단순 추가" 안의 함정**
   - 백필 후 구 어드민이 부모 방식을 지우면 남은 방식의 `parent_element_number`가 재지정된다. 그 상태에서 방식을 추가하면, 새 행은 바뀐 부모 번호(2)를, 기존 행은 백필 값(1)을 갖는다.
   - 재백필은 빈 값만 채우므로 이 불일치를 고칠 수 없다.
   - 해결: 요청 단위 호환 보정으로 바꾸고 이 시나리오를 스펙으로 고정했다.
4. **스펙이 엉뚱한 이유로 통과할 뻔했다**
   - "360에 `method_group_number`를 보내면 400" 테스트가 실제로는 `Feedbackpool`의 `icon` 필수 검증 때문에 400을 받고 있었다. 같은 이유로 실패한 옆 테스트를 디버깅하다 발견했다.
   - 해결: `icon`을 넣고 오류 메시지(`requires_appraisal`)까지 확인하도록 고쳤다.
5. **테스트 compose의 Elasticsearch 이미지가 ECR 인증 없이는 pull되지 않았다**
   - 해결: DB와 redis가 이미 떠 있으니 `--no-deps`로 실행했다.
6. **설계 결정이 세 번 바뀌었다**
   - 처음 추천은 "포인터만 분리하고 `number`는 공유"였다. 이 안은 "평가도 `number`를 쓰지 않게"라는 방향과 충돌했다.
   - 그다음 "식별자까지 분리"는 "지역 식별자는 필요 없다"는 피드백을 받았다.
   - 최종적으로 공유 묶음 키로 정했다.
   - `number`가 null인 레거시 10만 행에 연번을 부여하자는 제안은 "그룹이 아닌데 번호가 붙는다"는 이유로 기각돼 null로 유지했다.
   - 배운 점: 데이터 형태를 정할 때는 **지금의 충돌**만이 아니라 **그 컬럼이 앞으로 누구의 것이 될지(제품 로드맵)**를 먼저 물어야 한다.

## 다음에 더 공부하고 싶은 것

- MySQL 8 INSTANT DDL이 되는 조건과 안 되는 조건(기본값, 컬럼 위치, 인덱스 추가)
- R3 정리 단계: 이미 응답이 붙은 영역 element의 구 필드를 비울 때 안전 범위, 키 공백 검증 마이그레이션 설계
- 옵션 해시 키 오타가 조용히 무시되는 API(`deep_clone(includes:)`)를 막는 방법 — 키워드 인자 vs 옵션 해시 검증
- 윈도 함수(`ROW_NUMBER() OVER (PARTITION BY ...)`) 기반 백필 — 이번에 제안만 하고 쓰지 않음

## 참고 — ROADMAP.md 대조 결과

- 신규 추가
  - (섹션 3 ActiveRecord) 컬럼 의미를 옮기는 확장 → 전환 → 정리 배포
  - (섹션 3 ActiveRecord) 같은 컬럼, 다른 의미
  - (섹션 3 ActiveRecord) 멱등 배치 백필 마이그레이션
  - (섹션 4 Grape) `declared(include_missing: false)`로 키 없음과 null 구분
- 신규 체크: (섹션 2 Ruby) `freeze`, `dup`, `clone` — AR `#dup`/`deep_clone`의 복사 범위로 체크
- 기존 항목 심화
  - (섹션 4 Grape) 고객사 전용 엔티티 복제 — `Daekyo::Elements::BaseEntity`도 상속 없이 같은 필드를 노출해 두 곳을 함께 고쳤다
  - (섹션 3) 폴리모픽 연관관계 — 공유 테이블의 의미 과적
- 미체크 유지: Grape `present`, `before` 블록
