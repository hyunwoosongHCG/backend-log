# Workspace.self.find 오버라이드 제거

> 날짜: 2026-07-06 ~ 2026-07-07
> PR: delete-workspace-self-find (dev 대상)
> 관련 이슈: Sentry PERPL-BACK-44J

## 작업 한 줄 요약

Sentry에 올라온 `WorkspaceInactiveAlertWorker`의 `NoMethodError: undefined method 'objectives' for nil`을 추적해 `Workspace` 모델에 7년 전부터 있던 `def self.find(*args); find_by(hash_id: args); end` 오버라이드가 근본 원인임을 확인했다. 우선 해당 워커만 `find_by!(id:)`로 급한 불을 껐고, 이후 팀 논의(Slack) 끝에 오버라이드 자체를 완전히 제거하기로 결정해, 여기에 의존하던 검증기 6곳·잡 2곳·컨트롤러 1곳(2줄)을 `Workspace.find_by!(hash_id: ...)`로 명시 전환했다. 우회용으로 남아있던 `# rubocop:disable Rails/FindById` 주석도 워커 2곳에서 같이 정리했다.

## 이번 작업에서 처음 배운 개념

- **클래스 메서드 오버라이드가 프레임워크 위임을 완전히 가로챌 수 있다는 것** — `Model.find(id)`는 원래 `ActiveRecord::Querying`이 `all.find(id)`로 위임하는 구조인데, 클래스에 직접 `def self.find`를 정의하면 이 위임 자체가 사라지고 완전히 다른 동작(hash_id 기준 조회)으로 바뀐다. [상속과 오버라이드](../concepts/inheritance-and-override.md)에서 본 "프레임워크가 호출 타이밍을 잡고 내가 내용을 채우는" 정상적인 오버라이드와 달리, 이번 케이스는 이미 의미가 정해진 메서드(PK 조회)를 완전히 다른 의미로 바꿔치기한 위험한 오버라이드였다.
- **연관관계(association) 기반 `.find`는 클래스 레벨 오버라이드와 무관하다는 것** — `user.workspaces.find(id)`처럼 관계(Relation)에서 호출하는 `find`는 `ActiveRecord::FinderMethods`가 붙은 별개의 메서드라서, `Workspace.self.find` 오버라이드를 지워도 전혀 영향을 안 받는다. 이걸 몰랐으면 오버라이드 제거의 영향 범위를 훨씬 넓게(모든 `.find` 호출) 잘못 잡을 뻔했다.
- **`find` / `find_by` / `find_by!`의 차이가 실제 장애로 이어지는 과정** — 오버라이드가 예외를 던지는 `find_by!`가 아니라 `nil`을 반환하는 `find_by`로 구현되어 있었던 게 이번 버그의 핵심이다. PK(정수)를 넘겼는데 hash_id 컬럼과 매칭되는 게 없으니 조용히 `nil`을 반환했고, 그 `nil`에 `.objectives`를 호출하면서 `NoMethodError`가 터졌다. `find_by!`였다면 훨씬 읽기 쉬운 `ActiveRecord::RecordNotFound`로 바로 실패했을 것.
- [공개 식별자(Public ID)와 내부 PK 분리 패턴](../concepts/public-id-vs-primary-key.md) — 수정한 11개 파일이 `find`(PK)와 `find_by!(hash_id:)`로 갈리는 이유는 문법 차이가 아니라, 그 값이 API 요청(hash_id)에서 왔는지 서버 내부 FK(진짜 PK)에서 왔는지의 차이였다.

## 작업하면서 막혔던 것

- 오버라이드 제거 후 동작을 직접 확인하려고 `rails runner`에서 `Workspace.find(어떤_hash_id_문자열)`을 실행했는데, `RecordNotFound`가 날 거라 예상한 것과 달리 엉뚱한 workspace(id=4)가 조회됐다. 원인은 MySQL이 `WHERE id = '04dfe596...'` 같은 쿼리에서 문자열의 선행 숫자만 파싱해 정수로 캐스팅하기 때문(`04dfe...` → `4`). 실제 코드 경로에는 영향 없는 순전한 테스트 데이터 우연이었지만, "타입이 안 맞는 값을 조회 조건에 넘기면 조용히 엉뚱한 결과가 나올 수 있다"는 게 이번 Sentry 버그와 같은 계열의 위험이라 인상 깊었다.
- 로컬 docker-compose Redis(5.0.3)가 Sidekiq 7의 RESP3(HELLO 커맨드) 요구사항을 지원하지 못해 전날엔 워커 스펙 실행이 막혔었는데, 오늘은 `rspec-sidekiq`이 fake 모드로 동작해서 실제 Redis 연결 없이도 관련 워커·잡·검증기 스펙 22+8+10건이 전부 정상 통과했다.

## 다음에 더 공부하고 싶은 것

- `notification_settings.rb`처럼 애초에 스펙이 없는 엔드포인트를 고칠 때, 기존 동작과 완전히 동일한 치환이라도 테스트를 새로 추가해야 하는 팀 기준선이 어디인지
- 지금처럼 `# rubocop:disable`로 계속 우회되고 있는 코드가 저장소에 더 있는지, 그리고 그게 "일시적 예외"인지 "관례로 굳어진 기술부채"인지 구분하는 방법
