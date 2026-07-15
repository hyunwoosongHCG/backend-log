# aws-infra-architecture PR #273 리뷰 — ECS EC2→Fargate 전환 (Phase 1)

> 날짜: 2026-07-15
> PR: https://github.com/hcgtheplus/aws-infra-architecture/pull/273
> 레포: hcgtheplus/aws-infra-architecture (CDK/TypeScript, performance-plus 스택)

## 작업 한 줄 요약

인프라 지식이 전혀 없는 상태에서 performance-plus의 ECS 서비스 4개(PerplBack/Sidekiq, PeopleBack/Sidekiq)를 EC2에서 Fargate로 전환하는 PR을 리뷰. 레포를 로컬에 클론해 PR 브랜치를 체크아웃하고, `npm test`와 `cdk synth`(오프라인, 캐시된 `cdk.context.json` 이용)를 직접 돌려 PR 설명의 주장을 코드 레벨에서 검증했다. 그 과정에서 이 PR이 건드리지 않은 `account-stack.ts`가 공용 `ECSService` construct 변경의 부작용으로 잠재적 배포 실패 위험을 안게 된 것을 발견.

## 이번 작업에서 처음 배운 개념

- **ECS(Elastic Container Service)** — 컨테이너를 어디서(EC2 서버 위 or 서버리스) 실행할지, 몇 개 띄울지, 죽으면 재시작할지 등을 관리해주는 AWS의 컨테이너 오케스트레이터. "클러스터" 안에 "서비스"가 있고, 서비스는 "태스크 정의(Task Definition)"라는 명세서(이미지, CPU/메모리, 환경변수)대로 "태스크"(컨테이너 묶음)를 여러 개 띄운다.
- **EC2 launch type vs Fargate launch type** — EC2 타입은 회사가 직접 관리하는 가상서버(EC2 인스턴스) 위에 컨테이너를 올리는 방식이라 AMI 관리, 보안 패치, 서버 용량(오토스케일링) 튜닝을 직접 해야 한다. Fargate는 "서버리스" 컨테이너 실행 방식으로, AWS가 서버 자체를 관리해주고 우리는 컨테이너 스펙(CPU/메모리)만 지정하면 된다. 이 PR의 핵심은 이 전환.
- **Task Definition의 `compatibility`/`RequiresCompatibilities`** — 태스크 정의를 만들 때 EC2용인지 FARGATE용인지 명시해야 하고, 이게 실제로 실행할 수 있는 launch type을 결정한다. Fargate 서비스에 EC2 전용 태스크 정의를 올리면 배포 자체가 실패한다 (이번에 발견한 이슈의 핵심 원인).
- **Fargate의 CPU/메모리 quantization** — Fargate는 임의의 CPU/메모리 조합을 못 쓰고, AWS가 정해놓은 조합(256/512/1024/2048... CPU 단위, 메모리는 1GiB 배수 등 CPU별 허용 범위)만 써야 한다. 그래서 기존 EC2용 값(예: CPU 1536)이 Fargate에서 유효하지 않아 이번 PR에서 값들을 재산정했다.
- **runtimePlatform (CPU 아키텍처 명시)** — 이미지가 ARM64(Graviton)로 빌드된 경우, Fargate 태스크 정의에 `runtimePlatform: { cpuArchitecture: ARM64 }`를 명시하지 않으면 기본값(X86_64)으로 간주되어 "exec format error"로 컨테이너가 기동 실패한다. EC2에서는 인스턴스 자체가 이미 ARM64라 이 설정이 필요 없었는데, Fargate로 오면서 명시가 필수가 됐다.
- **Placement Strategy는 Fargate 미지원** — EC2 launch type에서는 여러 서버(가용 영역) 중 어디에 태스크를 분산 배치할지(`spreadAcross`, `packedByMemory` 등) 직접 정할 수 있었지만, Fargate는 AWS가 자동으로 서브넷 간 분산시켜주기 때문에 이 설정 자체가 없다.
- **CloudFormation의 in-place Update vs Replacement** — CDK가 CloudFormation 코드를 생성하고, CloudFormation은 리소스 속성이 바뀔 때 "그냥 업데이트"할지 "삭제 후 재생성(Replacement)"할지 리소스 타입/속성마다 정해진 규칙으로 판단한다. 이번 PR에서 `SchedulingStrategy` 속성을 완전히 생략하면 Replacement가 발생해서 기존 `serviceName`과 충돌 → 배포 실패로 이어진다는 걸 `cdk diff`로 실측 확인한 사례를 봤다. 속성을 "생략"하는 것과 "명시적으로 같은 값을 넣는 것"이 CloudFormation 입장에서 다르게 취급될 수 있다는 게 인상적이었다.
- **CDK L1 escape hatch (`node.defaultChild`)** — CDK의 L2 construct(`ecs.FargateService`처럼 사람이 쓰기 편하게 감싼 고수준 API)가 특정 속성(`PlacementStrategies`, `SchedulingStrategy`)을 노출하지 않을 때, `construct.node.defaultChild as ecs.CfnService`로 그 밑에 깔린 L1(CloudFormation 리소스 그 자체) 객체에 직접 접근해서 `addPropertyOverride`로 값을 강제 지정하는 패턴. "CDK 라이브러리가 지원 안 하는 세부 설정"을 다뤄야 할 때 쓰는 탈출구라는 걸 처음 알았다.
- **ECS Exec** — 컨테이너에 SSH 없이 접속하는 방법. AWS Systems Manager(SSM)의 "세션 관리" 채널을 통해 실행 중인 컨테이너에 셸로 들어갈 수 있게 해주는 기능(`enableExecuteCommand: true`). EC2 호스트가 사라지는 Fargate 전환에서 SSH 접속 경로를 대체하는 용도.
- **Deployment Circuit Breaker** — ECS 서비스 배포 시 새 태스크가 계속 기동 실패하면, 기본은 CloudFormation이 최대 3시간 대기하다 타임아웃되는데, circuit breaker를 켜면 실패를 감지하자마자 바로 이전 버전으로 롤백해준다.
- **CDK Nested Stack vs Construct** — `cdk.NestedStack`으로 만들면 CloudFormation이 "부모 스택 안의 별도 스택"으로 취급해 리소스 논리 ID 앞에 스택 계층이 붙는다. 반면 그냥 `Construct`로 만들면 부모 스택에 리소스가 "평평하게(flat)" 포함된다. 이 PR의 `dump` 환경은 과거에 flat 구조로 배포돼 있어서, 같은 리소스 생성 로직을 함수로 뽑아 Nested/Flat 두 클래스에서 재사용하는 방식으로 기존 리소스 논리 ID를 안 건드리고 호환성을 맞췄다.

## 작업하면서 막혔던 것과 해결 방법

- **로컬에서 PR 설명을 실제로 검증할 수 있는지가 관건이었다.** PR 본문에 `cdk synth`/`cdk diff` 결과가 텍스트로만 적혀 있어서 그대로 믿을 수도 있었지만, 레포를 클론해 PR 브랜치(`feat/ecs-migrate-ec2-to-fargate`)를 체크아웃하고 `npm install` 후 `npm test`(11개 테스트 전부 통과)와 `CDK_DEFAULT_ACCOUNT=<계정ID> npx cdk synth <스택명>`을 직접 돌려봤다. 레포에 `cdk.context.json`(VPC 조회 등 AWS API 결과 캐시)이 커밋돼 있어서 AWS 자격증명 없이도 오프라인으로 synth가 가능했다.
- **`cdk synth --all`이 지원되지 않는 CDK 버전이라 스택명을 몰라 헤맸다** → 에러 메시지가 사용 가능한 스택 id 목록을 그대로 출력해줘서(`Supply a stack id (...)`) 거기서 `Staging-PerformancePlusStack`, `Dump-PerformancePlusStack` 등 실제 이름을 확인했다.
- **synth 결과에 ECS::Service가 안 보여서 당황** → Nested Stack은 부모 스택 template에는 `AWS::CloudFormation::Stack` 참조만 남고, 실제 리소스는 `cdk.out/*.nested.template.json`이라는 별도 파일에 들어있다는 걸 확인하고 그 파일을 따로 열어서 `SchedulingStrategy`/`PlacementStrategies`/`RequiresCompatibilities` 값을 python으로 파싱해 대조했다.
- **PR이 명시적으로 언급하지 않은 `account-stack.ts`가 영향받는지 확인** → `grep`으로 `new ECSService` 호출부 3곳(perpl/people/account)과 `Compatibility.` 사용처를 전부 찾아 대조. `account-task.ts`만 여전히 `Compatibility.EC2`인데, `ECSService`가 이제 무조건 `FargateService`를 생성하도록 바뀌어서 이 서비스가 다시 활성화되면 배포가 실패할 잠재 위험을 발견. 다만 `performance-plus-stack.ts`에서 `AccountStack` 인스턴스화 라인 자체가 이미 주석 처리돼 있어(이 PR이 처음 주석 처리한 게 아니라 기존 상태) 현재 배포에는 영향 없음을 synth 결과(계정 리소스 0개)로 재확인.

## 다음에 더 공부하고 싶은 것

- AWS Application Auto Scaling(`ServiceMinCapacity`/`ServiceMaxCapacity`, `ApplicationAutoScaling::ScalableTarget`)이 ECS 서비스의 태스크 개수를 CPU/메모리 알람 기준으로 어떻게 늘리고 줄이는지
- IAM Role의 "누가 assume 할 수 있는지(`assumedBy`)"와 "무엇을 할 수 있는지(managed policy/inline policy)"를 분리해서 보는 법 — taskRole vs executionRole vs serverRole(EC2 인스턴스 프로파일)의 역할 차이
- CloudFormation 파라미터(`CfnParameter`, 이번 `PPSnapshot`/`PESnapshot`)와 CDK 컨텍스트(`app.node.tryGetContext`)의 차이 — 왜 어떤 값은 배포 시점 파라미터로, 어떤 값은 합성(synth) 시점 컨텍스트로 넘기는지

## 참고 — ROADMAP.md 대조 결과

`ROADMAP.md`를 확인했는데 현재 섹션 1~5가 전부 Ruby/Rails/Kafka 등 백엔드 트랙 위주이고 AWS/인프라(ECS, CDK, CloudFormation, IAM 등) 관련 섹션이 없다. 위에서 정리한 개념들을 연결할 기존 체크박스가 없어서 이번엔 링크 없이 새 개념으로만 기록. 인프라 리뷰가 앞으로도 이어질 것 같으면 "AWS 인프라" 같은 별도 섹션을 ROADMAP.md에 추가할지 다음에 논의하면 좋을 듯.
