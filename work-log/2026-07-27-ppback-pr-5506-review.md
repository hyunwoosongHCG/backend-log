# ppback PR #5506 리뷰 — job_template 가중치 후속 코드 리뷰 대응 검증

> 날짜: 2026-07-27
> PR: https://github.com/hcgtheplus/ppback/pull/5506
> 레포: hcgtheplus/ppback (Rails/Grape)

## 작업 한 줄 요약

동료(epicari)가 올린 PR #5506(job_template 가중치 PR #5480의 후속 — Codex adversarial review를 반복 실행하며 나온 이슈 18개 커밋 대응)을 review-ppback 스킬 4단계 프로세스로 리뷰했다. 이 PR은 이미 같은 스킬로 2차례 자체 리뷰(07-15, 07-23)를 거친 상태여서, 직전 라운드가 지적한 수정 권장 2건(`AppraisalResponse`의 `where.not` NOR→AND 스코프 수정에 회귀 테스트가 없던 것, 마이그레이션 `down`이 `up`과 달리 멱등하지 않던 것)이 마지막 커밋에서 실제로 올바르게 반영됐는지 diff를 직접 대조해 검증했다. 그 과정에서 PR 본문에 없던 별도 커밋(rubocop `Style/CombinableLoops` 자동수정이 깨뜨린 점수 계산 순서 회귀)도 찾아서 함께 확인했다. 새로운 머지 차단급 이슈는 없었고, N+1 가능성 등 선택 사항 몇 건만 남겼다.

## 이번 작업에서 처음 배운 개념

- **Rails `where.not`의 다중 조건 키는 AND가 아니라 NOR로 컴파일된다** — `where.not(a: nil, b: nil)`은 `NOT (a IS NULL AND b IS NULL)`, 즉 드모르간 법칙에 의해 `(a IS NOT NULL OR b IS NOT NULL)`이 된다. "a도 b도 존재해야 포함"이라는 의도로 썼다면 이건 "둘 중 하나만 있어도 포함"이 되는 버그다. AND로 만들려면 `.where.not(a: nil).where.not(b: nil)`처럼 별도 호출로 체이닝해야 한다. rubocop에 이걸 잡아주는 `Rails/WhereNotWithMultipleConditions` cop이 실제로 있다는 것도 이번에 알았다.
- **MySQL은 조건부(partial) 유니크 인덱스가 없다 — 생성 컬럼(Generated Column)으로 흉내낸다.** Postgres는 `CREATE UNIQUE INDEX ... WHERE condition`으로 "조건을 만족하는 행끼리만" 유니크를 강제할 수 있지만 MySQL엔 이 문법이 없다. 이 PR은 "조건에 해당하면 실제 값, 아니면 NULL을 반환하는 생성 컬럼"을 만들고, MySQL 유니크 인덱스가 **NULL끼리는 중복 허용**한다는 성질을 이용해 사실상 조건부 유니크를 구현했다. (`process_is_multi`가 true면 NULL, false면 `appraisee_id`를 반환하는 생성 컬럼 + `(process_id, 그 컬럼)` 유니크 인덱스 → multi 프로세스 행끼리는 전부 NULL이라 충돌 안 하고, non-multi 행만 진짜 유니크 제약을 받음.)
- **생성 컬럼의 STORED vs VIRTUAL** — STORED는 디스크에 값을 실제로 저장하고, VIRTUAL은 저장하지 않고 조회/인덱스 시점에 계산한다. 이번 PR에서 STORED를 쓰려다 `ERROR 1215`(FK 제약 위반)를 만났다 — 참조 컬럼(`appraisee_id`)에 `ON DELETE CASCADE` FK가 걸려 있으면, cascade 삭제 시 STORED 생성 컬럼의 저장된 값도 다시 계산해서 써야 하는데 MySQL이 이 조합을 거부한다. VIRTUAL은 애초에 값을 저장하지 않으니 이 문제가 없다.
- **`accepts_nested_attributes_for` + `marked_for_destruction?` + `inverse_of`로 "교체" 흐름의 false positive 막기** — 같은 `update!` 호출 안에서 `{ _destroy: true }`로 기존 자식을 지우면서 동시에 새 자식을 추가하면(평가자 교체), 검증 시점에 DB 조회를 하면 아직 커밋 전이라 삭제 예정인 형제가 그대로 조회되어 "중복"으로 오판할 수 있다. `belongs_to :appraisee, inverse_of: :appraisers`를 명시해 부모가 들고 있는 인메모리 컬렉션을 자식이 참조하게 만들고, 검증 로직에서 `sibling.marked_for_destruction?`인 형제를 조회 결과에서 제외하는 패턴을 봤다.
- **마이그레이션 멱등성이 왜 중요한지 — MySQL DDL은 트랜잭션이 안 걸린다.** `add_column` 여러 개 + `add_index`로 구성된 마이그레이션이 중간(예: `add_index`)에서 실패하면, 이미 실행된 `add_column`들은 롤백되지 않고 그대로 남는다. 이 상태에서 마이그레이션을 단순 재실행하면 `add_column`이 "컬럼이 이미 있다"는 에러로 또 실패해서 재시도 자체가 막힌다. 이 PR은 `up`/`down` 양쪽에 `column_exists?`/`index_exists?` 가드를 넣어 "이미 되어 있으면 건너뛰기"로 재시도 가능하게 만들었다.

## 작업하면서 막혔던 것과 해결 방법

- **워크트리로 들어간 뒤에도 Read 도구에 원래 저장소의 절대경로를 그대로 써서, 다른 브랜치의 오래된 파일 내용을 읽고 "수정이 반영 안 됐다"고 잘못 판단할 뻔했다.** `git worktree add`로 별도 경로(`/private/tmp/pr5506-wt`)에 PR 브랜치를 체크아웃하고 `EnterWorktree`로 세션을 옮겼는데, `EnterWorktree`가 바꿔주는 건 **Bash의 작업 디렉터리**뿐이었다. `Read` 도구는 절대경로를 그대로 받기 때문에, 습관적으로 `/Users/songhyeon-u/Desktop/ppback/app/models/appraisal_response.rb`(원래 메인 워크트리 — 전혀 다른 브랜치 체크아웃 상태)를 넘겼더니 PR 브랜치가 아닌 엉뚱한 내용을 읽었다. `grep`/`sed`(Bash, cwd 기준 상대경로)로 같은 라인을 확인했을 때 내용이 달라서 그제서야 알아차렸다. 이후로는 워크트리 안에서 파일을 읽을 땐 반드시 워크트리 절대경로(`/private/tmp/pr5506-wt/...`)를 명시해야 한다는 걸 체감했다.

## 다음에 더 공부하고 싶은 것

- Postgres의 partial index(`WHERE` 조건부)와 이번에 본 MySQL 생성 컬럼 우회법을 나란히 비교 정리 — 언제 어느 DB가 이런 제약을 더 깔끔하게 표현하는지
- rubocop 자동수정(`-a`)이 스타일만 바꾸는 게 아니라 실제로 로직 순서 의존성을 깨뜨릴 수 있다는 사례(`Style/CombinableLoops`)를 이번에 봤는데, 다른 auto-correctable cop 중에도 비슷하게 "안전해 보이지만 위험한" 것들이 있는지

## 참고 — ROADMAP.md 대조 결과

"ActiveRecord (Model)" 섹션의 "유효성 검사 (`validates`)", "스코프(Scope)란?" 두 항목을 이번 작업 링크로 체크했다. "행 잠금과 동시성 제어"는 이미 체크되어 있어 그대로 뒀다. MySQL 조건부 유니크 인덱스(생성 컬럼 우회) 자체는 아직 대응하는 ROADMAP 항목이 없어 링크 없이 개념만 기록 — "데이터베이스 기초" 섹션에 관련 항목을 추가할지는 다음에 논의.
