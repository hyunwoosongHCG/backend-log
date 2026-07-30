# ppback PR #5504 리뷰 — 탈렌트 세션 대상자 비교 API 추가

> 날짜: 2026-07-30
> PR: https://github.com/hcgtheplus/ppback/pull/5504
> 레포: hcgtheplus/ppback (Rails/Grape), 관련 프론트: hcgtheplus/ppfront#11255

## 작업 한 줄 요약

탈렌트 세션 대상자 비교 화면을 위한 신규 조회 API(`GET .../comparison_snapshots`) PR을 review-ppback 스킬로 리뷰했다. 코드 리뷰 외에 로컬 데모 시드 스크립트(300명 → 900명으로 스케일업)를 직접 돌려서 실제 동작을 검증했고, 그 과정에서 N+1 쿼리 1건을 실측으로 잡아냈다(실제로 해당 커밋이 반영됨). 추가로 ppfront PR을 직접 열어서 엑셀 다운로드가 페이지네이션 없이 `size=totalCount`로 전체를 한 번에 요청한다는 것도 코드로 확인했고, 그 패턴 그대로 재현했더니 900행 응답에 17~37초가 걸리는 것도 실측했다.

## 이번 작업에서 처음 배운 개념

- **`has_one` 연관과 N+1** — `Appraisal.sections_by_appraisal_id`가 `section.score?`/`section.rating?`를 호출하는데, 이 둘은 `appraisal_sections` 테이블의 컬럼이 아니라 `has_one :score_setting`/`has_one :rating_setting`으로 연결된 **별도 테이블**이었다. `.includes(:appraisal_sections)`는 `appraisal_sections`까지만 미리 로드하고 그 안의 `has_one` 체인은 preload 안 해서, 섹션 하나당 쿼리 2개가 추가로 나갔다. `db/schema.rb`에서 FK(`appraisal_section_id`)가 `appraisal_section_score_settings`/`appraisal_section_rating_settings` 쪽에 있는 걸 보고 "`has_one`은 FK가 상대 테이블에 있다"는 걸 역으로 확인했다. 고치는 법은 중첩 preload: `includes(appraisal_sections: [:score_setting, :rating_setting])`.
- **`ActiveSupport::Notifications.subscribed`로 쿼리 카운트 실측** — N+1을 "말로 추측"하지 않고 직접 재현하는 법. `ActiveSupport::Notifications.subscribed(cb, "sql.active_record") { ... }` 블록으로 감싸서 실행 전후 쿼리 카운트를 비교했다. `sections_by_appraisal_id`가 8쿼리 → 중첩 preload 적용 후 4쿼리(섹션 수 무관 고정)로 줄어드는 걸 이 방법으로 증명했다.
- **이미 로드된 Relation에서 `Enumerable#select`(블록) vs `scope`(`.where`)의 쿼리 발생 여부 차이** — `reference_data.select {|rd| rd.category == "appraisal"}`처럼 블록 있는 `select`는 Ruby의 `Enumerable#select`라 이미 로드된 배열 안에서만 필터링하고 쿼리가 안 나가지만, `reference_data.where(category: "appraisal")`은 원본이 로드돼 있는지와 무관하게 "조건이 추가된 새 Relation"을 만들어서 평가 시점에 **새 SQL을 또 쏜다**. 실측으로 케이스 A(`.where`)는 +2쿼리, 케이스 B(재-select)는 +0쿼리로 확인했다. 이게 왜 `TalentSessionReferenceDatum`에 `scope :appraisal, -> {...}`가 아니라 인스턴스 predicate(`def appraisal?; category == "appraisal"; end`)를 둬야 하는 이유였다.
- **JSON 컬럼을 여러 파일이 독립적으로 파싱할 때 shape 계약이 갈라지는 문제** — 같은 `talent_session_snapshots.snapshot_data` 컬럼을 `ComparisonRowsService`(String 키로 직접 `['sections']`, `.dig('rating_scale', 'items')`)와 `ComparisonSnapshotEntity`(`deep_symbolize_keys` 해서 Symbol 키로 `[:sections]`)가 각자 따로 읽고 있었다. 리뷰 반영 커밋이 서비스 쪽만 `deep_symbolize_keys`를 뺐고 엔티티는 그대로 둬서, 지금은 String/Symbol 접근 방식까지 갈라진 상태다. `[]`/`dig`는 없는 키에 예외 없이 `nil`을 반환하니, 필드 이름이 어긋나도 조용히 값만 틀려지는 위험이 있다.
- **레이어별 상수(화이트리스트) 소유권** — `SORTABLE_FIELDS`가 `ComparisonRowsService`(서비스 레이어)에 있는데 컨트롤러의 `params do` 블록과 커스텀 validator가 그걸 끌어다 쓰는 구조라, 라우팅 계층이 서비스 클래스 내부 상수를 역참조하고 있었다. 반면 "이 reference_data가 appraisal 카테고리인가"처럼 모델 자신의 컬럼(`category`)에 대한 predicate는 모델에 두는 게 맞다 — 같은 "중복 제거" 문제라도 **어느 레이어가 그 개념의 진짜 주인인가**에 따라 정답이 달라진다는 걸 두 사례를 대조하며 체감했다.
- **배치 잡에서 트랜잭션 범위를 좁게 유지하는 이유** — `RefreshWorker`가 900명 대상자 스냅샷을 만드는데, 트랜잭션은 대상자 루프 전체가 아니라 그 앞의 `ReferenceDataSnapshotService`(참고데이터 11건짜리 작은 루프) 안에만 걸려 있다. 대상자 루프는 트랜잭션 밖에서 개별 `rescue`로 실패를 격리한다(1명 실패해도 나머지 899명은 계속 처리, 실패자만 Sentry로 리포트). 대상자 수가 늘어도 트랜잭션 자체의 부담(락 유지 시간, 롤백 범위)은 안 커지는 구조.
- **크로스 서비스 auto-increment 시퀀스 정합성** — 로컬 데모 시드 스크립트가 ppback에서 만든 유저 id를 그대로 theplus-back에 복제 삽입한 뒤 `setval('users_id_seq', max_id)`로 시퀀스를 강제로 맞추는데, 이 값이 **theplus-back 자신의 현재 max_id는 전혀 확인하지 않고** ppback 쪽 id 스냅샷에만 의존했다. 두 DB를 초기화하지 않은 상태에서 실행하면 시퀀스가 기존 데이터보다 뒤로 밀려서, 다음 정상 유저 생성이 이미 존재하는 id와 PK 충돌을 일으킬 수 있는 위험한 패턴이었다.

## 작업하면서 막혔던 것과 해결 방법

- **`run_in_background`로 백그라운드 실행한 `docker exec ... bin/rails runner <<'RUBY' ... RUBY` heredoc이 빈 스크립트처럼 동작해서 아무 것도 생성 안 됐다.** 포그라운드에서는 정상 동작했는데, 백그라운드로 넘기니 heredoc(stdin)이 프로세스에 제대로 전달이 안 돼서 `bin/rails runner /dev/stdin`이 빈 입력을 읽고 즉시 종료된 것으로 보인다(Sentry 종료 로그만 찍히고 본문 `puts`는 하나도 안 나옴). 스크립트를 파일로 먼저 써서(`docker cp`) 컨테이너에 넣고 `bin/rails runner /tmp/script.rb`처럼 **파일 경로**로 실행하니 정상 동작했다 — 백그라운드 실행에는 stdin 의존적인 방식을 쓰지 않는 게 안전하다는 걸 배웠다.
- **파일 기반으로 바꾼 뒤에도 `uninitialized constant FactoryBot` 에러로 한 번 더 실패했다.** 매 `bin/rails runner` 호출이 완전히 새 프로세스라 이전 실행에서 로드했던 `FactoryBot`이 이어지지 않는다는 걸 놓쳤다. 원본 시드 스크립트에 있던 `require 'factory_bot_rails'` + `FactoryBot.find_definitions` 초기화 블록을 다시 넣어서 해결했다. (다행히 실패 지점이 루프의 첫 반복이어서 부분 생성 없이 안전하게 재시도할 수 있었다.)
- **`&`와 `disown`을 내부에 쓴 명령을 harness의 `run_in_background: true`와 같이 쓰면 이중 백그라운딩이 돼서 진짜 작업이 죽는다.** 셸 내부에서 자체적으로 백그라운드+disown 처리한 명령을 harness가 다시 감싸서 백그라운드로 돌리니, wrapper 스크립트는 즉시 "완료"로 보이지만 실제 무거운 프로세스는 disown된 채 샌드박스 셸이 종료되며 같이 죽어버린 것으로 보인다. harness의 background 옵션만 쓰고 내부에서 별도로 backgrounding하지 않는 게 맞았다.

## 다음에 더 공부하고 싶은 것

- 프론트가 페이지네이션 없이 `size=totalCount`로 한 번에 요청하는 패턴(엑셀 다운로드)에서, 실제 코드 레벨 벤치마크(≈5초)와 실제 HTTP 요청 시간(17~37초) 사이의 큰 격차 — 이번엔 원인을 다 못 파봤는데, development 환경 오버헤드인지 다른 병목인지 이어서 확인
- `deep_symbolize_keys`/String-key 직접 접근처럼 같은 JSON 데이터를 여러 파일이 각자 파싱하는 패턴을 PORO(값 객체)로 캡슐화하는 실제 리팩터링 사례를 다른 PR에서도 찾아보기

## 참고 — ROADMAP.md 대조 결과

"데이터베이스 기초" 섹션에 "쿼리 프로파일링/N+1 실측(`ActiveSupport::Notifications`)"과 "크로스 서비스 시퀀스 정합성" 두 항목을 새로 추가했다. "연관관계"·"연관 캐시"·"트랜잭션과 ACID"는 이미 체크되어 있어 이번 작업 링크만 추가했고, "서비스 레이어(Service Layer)란?"은 이번에 처음 체크했다.
