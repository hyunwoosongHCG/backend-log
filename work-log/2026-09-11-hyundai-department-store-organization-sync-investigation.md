# 현대백화점 조직 미연동 Slack 문의 — synchronizations 테이블 기반 원인 진단

> 날짜: 2026-09-11
> PR: 없음 (Slack CS 문의 대응 + 개인 인프라 스크립트 개선)
> 레포: theplus-aws-lambda(people-sync 코드 분석), theplus-back(production 조회), `~/Desktop/remocon.sh`(개인 원격 콘솔 도구)

## 작업 한 줄 요약

Slack 문의("특정 구성원 조직이 연동 안 됨")를 받아 `people-sync` Lambda 코드(`organizationMemberSynchronizer.js` 등)만 보고 "발령 피드의 uid 계산(COMPANY_CODE)이 어긋나 매칭이 실패했을 것"이라는 가설을 세웠다. 이어서 theplus-back production의 `synchronizations` 테이블 실데이터로 그 가설을 검증했더니 틀렸고, 실제로는 **고객사 HR 시스템이 그 사번을 발령 피드에서 계속 누락**하고 있는 것으로 확인됐다. 조사 도중 개인 원격 콘솔 스크립트(`remocon.sh`)에 CloudWatch 로그 조회 기능(`-L/--logs`)도 추가했다.

## 이번 작업에서 처음 배운 개념

- **외부 연동 실패의 두 계층 — "매칭 실패"(로그 있음) vs "소스 데이터 자체 부재"(로그 없음)** — `organizationMemberSynchronizer.js`는 발령 레코드가 있는데 그 안의 `member_uid`/`organization_uid`가 기존 데이터와 안 맞을 때만 `member Not Found`/`organization Not Found` 에러를 로그로 남긴다. 대상 사번이 피드에 아예 없으면 이 코드 경로 자체가 실행되지 않아 **아무 로그도 없이** `synchronization.status=completed / error_code=ok`로 끝난다. "에러 로그가 없다"가 "그 회차가 정상이었다"를 보장하지 않는다는 걸 실제 프로덕션 데이터로 확인했다 → ROADMAP "섹션 4 · 외부 시스템 연동"
- **동기화 스냅샷(JSON 컬럼)으로 원본 피드를 그대로 재현해서 검증하기** — `Synchronization#data`(JSON, ActiveRecord가 Hash로 캐스팅)에 그 회차의 `users`/`organizations`/`appointments` 배열 전체가 보존돼 있다. 코드 추측이 아니라 이 컬럼을 직접 까서 "그 사번이 그날 피드에 실제로 있었는지"를 확인할 수 있다. theplus-back의 ActiveRecord `Synchronization` 모델과 people-sync Lambda의 Sequelize `Synchronization` 모델이 같은 DB 테이블을 공유한다는 것도 이번에 확인 → ROADMAP "섹션 4 · 외부 시스템 연동"
- **`Synchronization#member_id`는 동기화 대상이 아니라 수동 트리거한 관리자다** — `POST /workspaces/:hash_id/synchronizations`(`app/api/v1/workspaces.rb`)에서 `synchronization.member = current_user.members.find_by(workspace:)`로 세팅되는 필드였다. 특정 직원을 찾으려면 이 컬럼이 아니라 `data` JSON 내부를 EMP_ID로 뒤져야 한다 → ROADMAP "섹션 4 · 외부 시스템 연동"
- **`last_activate_at`을 실제 배치 시각과 대조해 수동/자동을 구분하기** — 대상 멤버의 `active=true`/`last_activate_at`이 최근 10일치 배치 시각(매일 같은 시각 1회) 중 어디와도 안 맞아서, 이번 활성화는 HR 배치가 아니라 수동 조치(관리자/CS)였다고 추론할 수 있었다 → ROADMAP "섹션 4 · 외부 시스템 연동"
- **awslogs 로그 그룹은 클러스터/서비스가 아니라 Task Definition의 컨테이너별 `logConfiguration.options`에 있다** — `ecs describe-task-definition`으로 `awslogs-group`/`awslogs-stream-prefix`를 그때그때 읽으면 하드코딩 없이 정확한 그룹을 찾을 수 있고, 스트림명 규칙(`{prefix}/{컨테이너명}/{taskId}`)으로 같은 그룹을 공유하는 다른 컨테이너(app/sidekiq)의 로그와 안 섞이게 좁힐 수 있다 → ROADMAP "섹션 6 · ECS 기본 개념"
- **컨테이너 이미지의 `base64`가 BusyBox(Alpine)면 GNU 롱옵션(`--decode`)이 없다** — `-d`만 지원해서, 로컬(macOS)에서 만든 명령을 그대로 넣으면 `unrecognized option`으로 조용히 실패한다. 세션이 1~2초 만에 끝나는 증상만 보면 완전히 다른 원인(S3 세션로그 검증 실패)으로 오판하기 쉽다 → ROADMAP "섹션 6 · 개발 도구"
- **`aws logs filter-log-events`의 `nextToken` 페이지네이션엔 직접 상한(cap)을 걸어야 한다** — 안 그러면 넓은 기간·느슨한 필터에서 무한히 페이지를 따라가며 출력이 폭주할 수 있다 → ROADMAP "섹션 6 · 개발 도구"

## 작업하면서 막혔던 것과 해결 방법

- **코드 분석만으로 세운 가설("COMPANY_CODE가 두 피드 간에 달라 uid 매칭이 깨진다")이 실제 데이터와 달랐다.** 최근 10회차 `data.users`/`data.appointments` 어디에도 그 사번 자체가 없어서, uid 불일치가 아니라 소스 피드 누락이 원인이었다. 코드만 보고 세운 가설을 프로덕션 데이터로 반증/수정한 사례 — 다음엔 이런 종류 이슈에서 코드 가설을 세우자마자 바로 데이터로 검증하는 순서를 앞당길 것.
- **AWS 자격증명(weep) 갱신이 브라우저 승인을 필요로 해서 에이전트가 직접 못 처리** — 사용자가 `weep file <role> --profile <profile>`을 직접 실행해 승인한 뒤 이어서 진행.
- **프로덕션 DB 조회 자체가 Claude Code 자동모드 정책("Production Reads")에 막혔다** — 우회하지 않고, 실행하려던 정확한 명령과 base64 인코딩된 조회 스크립트를 그대로 사용자에게 넘겨 사용자가 직접 실행하는 방식으로 전환.
- **`remocon.sh --cmd`로 넣은 rails 스크립트가 두 번 연속 2초 만에 끝났다.** 1차는 예시의 `<base64>` 플레이스홀더를 치환 안 하고 그대로 실행한 것이었고, 2차는 컨테이너의 `base64`가 BusyBox라 `--decode` 롱옵션을 모르는 문제였다. `--sh`로 직접 붙어 `pwd`/`ls Gemfile`부터 한 줄씩 확인하며 원인을 좁혔다.

## 다음에 더 공부하고 싶은 것

- `Hunel::Synchronizer`(`People::SyncWorker`가 호출)가 실제로 theplus-back 어디에 정의돼 있는지 — grep으로 못 찾음, 별도 private gem/엔진일 가능성. 실제 SOAP 호출부와 `people-sync` Lambda 사이의 정확한 관계(둘이 같은 흐름인지, 레거시/현행이 나뉘어 있는지)를 더 확인하고 싶다.
- 현대백화점 SOAP 피드가 특정 사번을 왜 계속 빠뜨리는지(재직상태 필터, 조직코드 매핑, 계열사 그룹핑 등) — 이건 고객사 HR 시스템 쪽이라 우리 레포로는 확인 불가능한 영역이고, 고객사 담당자 확인이 필요하다.
- `ecs execute-command` 권한이 없는 롤에서 `ssm start-session`만으로 커버 안 되는 케이스(태스크가 하나도 안 떠 있을 때 등)의 대안.

## 참고 — ROADMAP.md 대조 결과

"섹션 4 · 실무 패턴"에 없던 "외부 시스템 연동(HR 동기화)" 서브섹션을 새로 추가(4개 항목). "섹션 6 · AWS 인프라"의 ECS 기본 개념에 1개, 개발 도구에 2개 항목을 추가했다.
