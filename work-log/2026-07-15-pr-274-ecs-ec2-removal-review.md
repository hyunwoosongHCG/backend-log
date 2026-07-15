# aws-infra-architecture PR #274 리뷰 — ECS EC2 인프라 완전 제거 (Phase 2) + Fargate/CDK 개념 정리

> 날짜: 2026-07-15
> PR: https://github.com/hcgtheplus/aws-infra-architecture/pull/274 (base: Phase 1 #273)
> 레포: hcgtheplus/aws-infra-architecture (CDK/TypeScript, performance-plus 스택)

## 작업 한 줄 요약

PR #273(Phase 1) 리뷰 도중 "사이드킥 태스크가 파이프라인을 안 타는 것 같다"는 의심을 `codepipeline-stack.ts`/`people-stack.ts`/`ecs-service.ts` 코드 추적으로 검증해 배선 자체는 정상임을 확인. 이어서 PR #274(Phase 2 — Fargate 전환 후 안 쓰는 EC2 인프라 완전 제거)를 4축(구조/데드코드/변수명/로직중복) 기준으로 리뷰하고, 격리된 git worktree에서 `npm ci` + `npx jest`로 실제 테스트 통과(12개 전부)까지 확인. 리뷰 중 나온 ECS/EC2/Fargate/CDK 개념 질문들에 답하며 정리했다.

## 이번 작업에서 처음 배운 개념

- **Task Definition vs Service** — Task Definition은 "무슨 이미지를, CPU/메모리 얼마로, 어떤 커맨드로 띄울지"를 적은 설계도이고, Service는 그 설계도대로 N개를 실제로 복제해서 계속 떠 있게 관리(죽으면 재시작, ALB 연결, 오토스케일링)하는 쪽이라는 역할 구분.
- **CodePipeline의 ECS 배포 방식(`EcsDeployAction` + imageDef.json)** — CodeBuild 단계가 만든 아티팩트 안의 `appImageDef.json`/`sidekiqImageDef.json` 같은 파일 경로를 `EcsDeployAction`의 `imageFile`로 지정해서, 어떤 서비스에 어떤 이미지를 배포할지 결정한다는 것. 이 JSON 파일 자체는 CodeBuild의 buildspec(이번엔 앱 레포인 theplus-back에 있어 코드로 확인은 못 함)이 만들어낸다.
- **`CodeStarConnectionsSourceAction`의 `triggerOnPush`** — GitHub push가 파이프라인을 자동으로 실행시킬지 여부를 결정하는 별개 옵션. `false`면 push해도 자동 실행 안 되고 수동/외부 트리거가 필요하다는 것을 처음 알았다(이 레포는 계속 `false`로 고정돼 있었음 — 이번 PR이 바꾼 부분 아님).
- **배포 가드 패턴(opt-in context flag)** — production/demo처럼 위험한 스택을 기본 CDK assembly(`cdk deploy --all`)에서 아예 제외하고, `-c allowXxxDeployment=true`처럼 명시적 플래그를 줘야만 포함시키는 패턴. 하나의 헬퍼(`isDeploymentExplicitlyAllowed`)를 demo와 production Phase 2 양쪽에서 재사용하고 있었다.
- **CDK 컨텍스트 키의 두 종류** — `app.node.tryGetContext('allowProductionPhase2Deployment')`처럼 사용자가 임의로 지어서 쓰는 커스텀 키와, `cdk.json`의 `@aws-cdk/aws-lambda:recognizeLayerVersion` 같은 CDK 프레임워크가 정의한 예약된 feature-flag 네임스페이스(`@aws-cdk/<모듈>:<플래그명>`)는 완전히 다른 것. 전자는 이름 규칙 없이 팀이 정한 것이고, CLI에서 넘기는 값(`-c 키=값`)과 코드에서 읽는 키 문자열만 일치하면 된다.
- **Fargate 전환 후에도 "서버 레벨"과 "태스크 레벨" 결정은 분리된다** — 인스턴스 타입/AMI/패치/오토스케일링 같은 "서버(호스트)" 조율은 Fargate가 가져가지만, CPU/메모리 크기, CPU 아키텍처(ARM64/x86), 서비스 desired count/오토스케일링 임계치 같은 "태스크·서비스" 스펙은 Fargate에서도 여전히 직접 지정해야 한다.
- **ARM64/Graviton 선택은 EC2→Fargate 전환과 독립적으로 유지된다** — Phase 2에서 `ecs.ts`의 M7G(Graviton3) EC2 인스턴스 타입/LaunchTemplate은 삭제됐지만, Task Definition의 `runtimePlatform.cpuArchitecture: ARM64`와 CodeBuild의 `LinuxArmBuildImage`는 그대로 남아 있었다. 즉 "호스트를 뭘로 할지"만 EC2→Fargate로 바뀐 거고, "이미지를 ARM으로 빌드해서 쓴다"는 결정 자체는 계속 이득을 보고 있는 구조.
- **git worktree로 PR 브랜치 격리 테스트** — 현재 로컬 작업 브랜치(uncommitted 변경 포함)를 건드리지 않고, `git worktree add <경로> origin/<다른-브랜치>`로 별도 디렉토리에 다른 브랜치를 체크아웃해서 `npm ci`/`npx jest`를 안전하게 돌릴 수 있다는 것. 끝나고 `git worktree remove`로 정리.

## 작업하면서 막혔던 것과 해결 방법

- **"사이드킥이 파이프라인을 안 탄다"는 질문이 실제로 뭘 가리키는지 처음엔 모호했다.** `codepipeline-stack.ts`/`people-stack.ts`/`ecs-service.ts`를 file:line 단위로 추적해서 CDK 쪽 배선(`sidekiqService` 존재 시 `SidekiqDeploy` 액션 추가)은 항상 정상 동작하는 걸 확인했고, `git diff main...HEAD`로 이번 PR이 그 로직을 건드리지 않았다는 것도 확인. 남은 의심 지점(`triggerOnPush: false`, buildspec의 `sidekiqImageDef.json` 생성)은 이 레포 혼자서는 검증 불가능한 영역(앱 레포 쪽)이라는 걸 명확히 하고 사용자에게 넘겼다 — "이 레포 경계 밖"이라는 걸 인지하는 것 자체가 배움이었다.
- **PR #274 worktree에서 `npx tsc --noEmit`이 `local-cdk-asset` 모듈 해석 에러를 냈다.** 반면 `npx jest`(ts-jest 트랜스폼 경유)는 12개 테스트 전부 통과. worktree의 상대 경로 구조(`../local-cdk-asset`) 때문에 생긴 환경 이슈로 판단하고, 실제 테스트 실행 결과(jest)를 신뢰할 근거로 삼았다.
- **`cdk synth --all`은 `CDK_DEFAULT_ACCOUNT`가 로컬에 없어서 끝까지 못 돌렸다.** 이전 세션(#273 리뷰) 로그를 보니 그때는 레포에 커밋된 `cdk.context.json`(VPC 조회 캐시)으로 오프라인 synth가 가능했다고 적혀 있어서, 다음엔 이 방법을 먼저 시도하면 될 듯.

## 다음에 더 공부하고 싶은 것

- AWS CodeBuild buildspec.yml 문법과 `*ImageDef.json` 아티팩트가 정확히 어떻게 생성되는지 (이번엔 앱 레포가 없어서 코드로 못 봤음)
- `cdk.context.json` 캐시가 정확히 뭘 저장하고 있길래 AWS 자격증명 없이 오프라인 synth가 가능한지
- git worktree와 상대경로/심볼릭 링크 기반 로컬 패키지(`local-cdk-asset`) 사이의 상호작용 — 왜 tsc는 실패하고 jest는 성공했는지 원인을 더 파보고 싶다

## 참고 — ROADMAP.md 대조 결과

지난 로그(`2026-07-15-pr-273-ecs-fargate-migration-review.md`)에서 이미 지적했듯 섹션 1~5가 전부 Ruby/Rails/Kafka 위주라 AWS 인프라(ECS/CDK/CloudFormation) 섹션이 아직 없다. 이번에도 새 개념 7개가 링크 없이 쌓였다 — 인프라 리뷰가 계속 이어지는 추세라, 이번엔 실제로 "섹션 6. AWS 인프라 / CDK"를 만들지 사용자에게 직접 확인하기로 함.
