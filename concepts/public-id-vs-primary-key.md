# 공개 식별자(Public ID)와 내부 기본키(PK) 분리 패턴

> 섹션: 섹션 1. 백엔드 기초 / 데이터베이스 기초

## 한 줄 정의

DB가 자동으로 매기는 순번(PK, `id`)을 URL이나 API 응답 등 외부에 그대로 노출하지 않고, 별도의 불투명한 문자열 컬럼(ppback에서는 `hash_id`)을 하나 더 만들어서 그걸 "진짜 얼굴"로 대신 내보내는 패턴. `id`와 `hash_id`는 같은 로우를 가리키는 서로 다른 두 개의 컬럼일 뿐, 값 자체는 완전히 무관하다.

## 이해한 대로 설명

`id`(1, 2, 3...)를 그대로 URL에 노출하면 두 가지가 샌다.

1. **순번 추측이 가능해진다** — `/workspaces/5`가 보이면 `/workspaces/4`, `/workspaces/6`도 존재할 확률이 높다는 걸 알 수 있다(enumeration). 남의 워크스페이스 데이터를 순서대로 찔러볼 수 있는 통로가 생긴다.
2. **비즈니스 지표가 샌다** — 마지막으로 가입한 워크스페이스가 `id: 8420`이면 "지금까지 워크스페이스가 대략 8420개 생성됐다"는 게 외부에 드러난다.

그래서 앱은 `id`와 별개로 `hash_id`(32자리 랜덤 문자열)를 만들어 저장해두고, **외부와 주고받는 모든 값은 `hash_id`, 서버 내부(모델 간 연관관계, FK)에서만 진짜 `id`를 쓴다**는 원칙을 둔다. 두 컬럼은 같은 테이블에 나란히 존재하고, 조회할 때 "지금 손에 든 값이 어느 쪽인지"에 맞춰 컬럼을 골라 찾으면 된다.

- 값이 **API 요청(URL, 요청 바디)에서 왔다** → 그건 `hash_id`다 → `Workspace.find_by!(hash_id: 값)`
- 값이 **서버 내부 연관관계(`belongs_to :workspace`의 FK)나 `.id`에서 왔다** → 그건 진짜 PK다 → `Workspace.find(값)`

## 코드 예시

```ruby
# app/controllers/application_controller.rb — 모든 컨트롤러의 공통 워크스페이스 조회 진입점
# params[:workspace_id]는 이름과 달리 실제로는 hash_id다 (프론트는 진짜 id를 모른다)
@workspace = Workspace.find_by!(hash_id: workspace_id)
```

```ruby
# app/models/objective_setting.rb — belongs_to :workspace의 FK 컬럼을 크론 잡 인자로 그대로 사용
belongs_to :workspace

Sidekiq::Cron::Job.create(name: "workspace-#{workspace_id}-objective-checking",
                          class: 'WorkspaceObjectiveCheckingJob',
                          args: workspace_id)   # 여기 workspace_id는 진짜 정수 PK
```

```ruby
# app/workers/workspace_objective_checking_job.rb — 위에서 넘어온 값은 진짜 PK이므로 find(PK 조회) 사용
def setup(workspace_id)
  @workspace = Workspace.find(workspace_id)
end
```

## 처음엔 헷갈렸던 것

`workspace_id`라는 변수명이 코드 경로에 따라 완전히 다른 걸 가리킨다는 걸 몰랐다 — 어떤 곳에선 hash_id 문자열, 어떤 곳에선 진짜 정수 PK. 이름만 보고는 절대 구분이 안 되고, **그 값이 API 요청을 거쳐왔는지 아니면 서버 내부 연관관계에서 나왔는지 출처를 추적해야만** 어느 컬럼으로 찾아야 하는지 알 수 있었다.

실제로 `Workspace` 모델엔 한때 `def self.find(*args); find_by(hash_id: args); end`라는 오버라이드가 있어서, 이 구분을 코드가 대신 숨겨주고 있었다. 문제는 이 오버라이드가 hash_id만 처리하고 진짜 PK가 들어오는 경우를 생각 안 해서, PK가 들어오면 조용히 `nil`을 반환하고 그 nil을 호출한 곳에서 `NoMethodError`가 터졌다(Sentry PERPL-BACK-44J). 오버라이드를 걷어내고 나서야 "아, 애초에 이 둘을 하나의 메서드로 뭉뚱그리면 안 되는 거였구나"를 알게 됐다.

## 배운 작업

- [2026-07-07 Workspace.self.find 오버라이드 제거](../work-log/2026-07-07-delete-workspace-self-find.md)

## 관련 개념

- [상속과 오버라이드](inheritance-and-override.md) — 이 두 값을 구분 안 하고 하나의 메서드로 뭉뚱그린 오버라이드가 버그의 근본 원인이었다
