# 스크럼보드 스크럼 검색 재개발 (미머지로 닫힌 PR #4766의 후속)

> 날짜: 2026-10-22  
> PR: 아직 없음 — 로컬 커밋만 있다. ppback `feat/scrum-board-search` (`d0d7b669a`, `abd6721dc`), ppfront `feat/scrum-board-search` (`16aa92481`). 원 PR은 hcgtheplus/ppback#4766 (closed)  
> 소스: Performance Plus(실무) — Rails/Grape/Elasticsearch, React/TypeScript  
> 내 역할: 구현(+조사·설계) — 백엔드와 프론트를 모두 맡음. 팀 규모는 기록하지 않았다

## 작업 한 줄 요약

스크럼보드의 스크럼 답변이 통합 검색에 나오지 않던 것을, 닫힌 PR을 되살리는 대신 `origin/dev` 기준으로 다시 만들어 검색·권한·재인덱싱·화면 이동까지 이었다.

## 성과

**Before → After**

- Before: 스크럼보드 답변은 ES에 인덱싱만 되고 `SearchService`에 조건이 없어 검색 결과에 한 건도 나오지 않았다. 인덱싱된 권한 값도 틀려 있었다(공개 여부를 boolean으로 저장해 `== 'all'` 비교가 항상 거짓, 허용 사용자는 참조자만).
- After: 열람 권한이 있는 보드의 답변이 "전체" 검색에 나오고, 클릭하면 해당 보드·작성자·날짜 화면으로 이동한다. 보드의 공개 범위·멤버·보관·삭제가 바뀌면 답변 문서가 다시 인덱싱된다.
- 숫자로 말할 수 있는 개선은 없다. **미머지이고 실제 ES에서 돌려 보지 못했다.**

**측정 방법**

- 실측: 컨테이너에서 rspec 실행 결과, `tsc`·eslint 실행 결과, "한 트랜잭션에서 두 번 저장하면 커밋 콜백이 어떻게 보이는지"를 임시 스펙으로 직접 돌려 확인(대조군 1회 큐잉, 두 번째 저장이 있으면 0회).
- 추정: ES가 새 매핑으로 실제 인덱싱·검색되는지, 화면에서 결과가 그려지는지는 확인하지 못했다.

**검증 근거**

- ppback 관련 스펙 80개 통과(새 스펙 27개 포함), RuboCop 남은 2건은 기존 검색 워커와 같은 스타일.
- ppfront: 변경 4개 파일에 `tsc` 오류 없음, eslint 오류 0.
- ES를 쓰는 스펙(`:elasticsearch` 태그)은 환경이 없어 건너뛰어졌다. 검색 쿼리 본문은 ES 요청을 가로채서 검증했다.

## 이번 작업에서 처음 배운 개념

- [ ] [보편] **검색 문서에 복제한 권한은 원본이 바뀌면 stale 해진다.** 답변 문서에 `allowed_user_ids`·`privacy`를 박아 두면, 보드를 비공개로 바꾼 뒤에도 문서는 옛 권한이다. 원본(보드)이 바뀌는 모든 경로에서 하위 문서를 다시 인덱싱해야 하는데, 이 레포의 연쇄 갱신 선례는 `Task`·`TaskList`뿐이었다 → ROADMAP 섹션 4 "검색 (Elasticsearch)"에 신규
- [ ] [보편] **`dynamic: strict` 매핑을 바꾸면 인덱스를 다시 만들어야 하고, 순서는 "코드 배포 → 재생성"이다.** 재생성은 배포된 코드의 매핑으로 인덱스를 만든다. 또 `search:reindex_type`의 가져오기 단계는 예외가 나도 경고만 출력하고 끝나서 일부만 들어가도 성공처럼 보인다(`setup_worker.rb`의 `rescue StandardError`) → 신규
- [ ] [Rails 전용] **한 트랜잭션에서 두 번 저장하면 커밋 콜백은 마지막 저장의 변경분만 본다.** `PUT :id`가 `update!` 뒤에 슬랙 채널 처리용 `save!`를 한 번 더 호출해서, `after_update_commit`의 `saved_change_to_is_private?`가 거짓으로 보인다. 임시 스펙으로 확인: 단일 저장은 1회, 두 번째 저장이 변경 없음이든 다른 컬럼 변경이든 0회 → 기존 `after_commit` 항목을 심화
- [ ] [Rails 전용] **`ActiveRecord.after_all_transactions_commit`** — 보드 행을 건드리지 않고 멤버만 바꾸는 경로에서는 모델의 `after_commit`이 발동하지 않아서, 호출부가 직접 부르되 실행은 커밋 뒤로 미룬다. 진행 중인 트랜잭션이 없으면 즉시 실행하고, 롤백되면 실행하지 않는다 → `after_commit` 항목을 심화
- [ ] [Ruby 전용] **중첩 모듈 안에서 같은 이름의 상수는 모델이 아니라 가장 가까운 모듈을 가리킨다.** `module Search` 안의 워커가 `BoardScrumItemResponse.joins`를 부르면 모델이 아니라 `Search::BoardScrumItemResponse`(검색 concern)가 잡혀 `undefined method 'joins' for module`이 난다. `::BoardScrumItemResponse`로 최상위를 명시해야 한다 → "Ruby 특유 개념"에 신규
- [ ] [Rails 전용] **`let_it_be` 객체는 롤백 뒤에도 메모리 속성이 남는다.** 한 예제가 `update!(is_private: true)`를 하고 DB가 롤백돼도 객체는 `true`를 기억해서, 다음 예제의 `update!(is_private: true)`가 "변경 없음"으로 UPDATE를 건너뛴다. 결과로 요청 시점에 보드가 공개 상태였다 → 기존 `let_it_be` 항목을 심화(저장 없는 변경이 아니라 저장했다 롤백된 경우)
- [ ] [보편] **같은 "열람 대상"을 정책과 검색이 따로 계산하면 어긋난다.** `ScrumBoardPolicy#show?`는 담당자·관리자·참조자를 모두 허용하는데 검색 concern은 참조자만 인덱싱하고 있었다. 검색 권한은 실제로 쓰이는 정책과 같은 범위로 맞추고, 변경 감지(`audience_ids`)와 문서 내용(`allowed_*_ids`)이 같은 정의를 쓰는지 주석으로 연결해 둔다 → "권한"의 기존 항목을 심화
- [ ] [보편] **호출하는 곳이 없는 정책 메서드는 죽은 채 남아 있다.** `BoardScrumItemResponsePolicy#show?`가 `ScrumBoard`에 정의되지 않은 `permitting_user_ids`를 부르는데 호출처가 없어 아무도 몰랐다. 검색 권한의 기준으로 삼으려다 발견했다 → 기존 "정책이 죽었는지 확인하는 세 겹" 항목을 재확인

## 작업하면서 막혔던 것과 해결 방법

- **새 스펙 15개가 한꺼번에 실패**: `BoardScrum`의 `after_initialize`가 `user`가 있을 때만 템플릿 항목별 답변을 만드는데, FactoryBot은 객체를 만든 **뒤** 속성을 할당해서 그 시점의 `user`가 비어 있었다. 답변을 스펙에서 명시적으로 만들도록 고쳤다.
- **요청 스펙 두 건이 "큐잉 0회"로 실패**: 서버 코드 문제가 아니라 `let_it_be` 객체의 메모리 속성 오염이었다(위 개념). 디버그 출력으로 요청 시점의 `is_private`가 `false`인 것을 보고 찾았고, 예제마다 `ScrumBoard.find`로 다시 읽게 했다.
- **워커 스펙 5건 실패**: `undefined method 'joins' for module Search::BoardScrumItemResponse` — 상수 탐색(위 개념). 스펙이 없었다면 배포 후 재인덱싱 워커가 전부 실패했을 버그다.
- **테스트 실행 환경**: 워크트리에서 `docker compose`를 돌리면 별도 프로젝트로 인식돼 DB·Redis 포트가 충돌하고, `app-code` named volume이 다른 체크아웃의 경로에 바인드돼 있어 `-p`로 붙으면 엉뚱한 코드가 실행된다. 워크트리를 직접 마운트한 일회성 `docker run`으로 기존 네트워크의 DB·Redis에만 붙었다(ROADMAP에 이미 있는 항목을 다시 겪음).
- **에이전트 보고를 그대로 믿지 않기**: 보안 리뷰 에이전트가 "배포 순서는 인덱스 재생성 → 코드 배포"라고 했는데 재생성은 배포된 코드의 매핑을 쓰므로 반대다. 코드(`setup_worker.rb`)를 읽어 바로잡았다. 또 다른 리뷰의 "DatabaseCleaner 조합 때문에 콜백이 안 돌 수 있다"는 추정은 이미 통과한 스펙 실행으로 반박됐다.

## 다음에 더 공부하고 싶은 것

- 보드가 바뀔 때마다 하위 문서를 전부 다시 쓰는 방식 말고, 검색 시점에 권한을 조회하는 구조(예: ES의 terms lookup)는 어떤 대가가 있는지
- 대량 가져오기가 부분 실패했을 때 이를 자동으로 감지하는 방법(문서 수 비교를 배포 절차에 넣는 것 이상으로)
- 같은 보드에 대한 재인덱싱 요청이 짧은 시간에 반복될 때 중복 job을 줄이는 방법(지금은 한 요청 안에서만 막는다)
- 기존 `dynamic: strict` 인덱스에 필드만 추가하는 `put_mapping`이 가능한지, 재생성 없이 배포할 수 있는지(ES 쪽 동작은 확인하지 않았다)
- `policy_scope`의 쓰임(`BoardScrumItemResponsePolicy::Scope`를 봤지만 이번에 학습하지는 않았다)

## 참고 — ROADMAP.md 대조 결과

- **기존 항목 심화**: `after_commit`과 `after_save`/`after_create`의 차이, `let_it_be`와 `let`/`let!`의 차이, 정책이 죽었는지 확인하는 세 겹, compose named volume과 worktree 격리 실행
- **신규 체크**: 검색(Elasticsearch) 항목 3개, Ruby 상수 탐색
- **미체크 유지**: `policy_scope`란?, Sidekiq란?, Redis란?
