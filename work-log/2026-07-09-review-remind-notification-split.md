# 리뷰 미완료자 알림 대상자/관리자 분리 발송

> 날짜: 2026-07-09 ~
> PR: split-review-alert (dev 대상)
> 관련 Slack: https://hcgtheplus.slack.com/archives/C60TEJMB7/p1783500567486629

## 작업 한 줄 요약

어드민 리뷰 현황의 "미작성자 알림 발송"(`POST .../admins/reviews/remind_notifications`)이 현재 대상자(assignee)/관리자(manager)에게 항상 함께 알림을 보내는 구조라, 두 그룹에게 각각 독립적으로 발송할 수 있도록 API를 분리하는 작업. 착수 전 기존 알림 발행 파이프라인(`History` 모델 → `notify_*` → `MessageFactory` → `push`)을 코드로 추적하고, Slack에서 과제 배경(2026-04 고객 문의 → 2026-07 스프린트 배정)을 확인해 설계 방향을 정리했다.

## 이번 작업에서 처음 배운 개념

- **폴리모픽 연관관계(polymorphic association)** — `History`가 `belongs_to :target, polymorphic: true`로 `target_type`(문자열 컬럼)과 `target_id` 두 컬럼만으로 Review, Objective, Task 등 여러 모델을 가리킬 수 있다는 것. `ABLE_TYPE` 상수가 이 `target_type`에 올 수 있는 값의 화이트리스트 역할을 한다.
- **동적 메서드 디스패치 (`send`, 메타프로그래밍)** — `History#notify`의 `send("notify_#{target_type.underscore}")`처럼 문자열을 조합해 런타임에 메서드를 호출하는 패턴. IDE의 "정의로 이동"이 통하지 않기 때문에, 같은 클래스 안에서 `def notify_`로 그렙하거나 `ABLE_TYPE` 목록과 대조해서 실제 호출될 메서드를 추론해야 한다는 걸 배웠다.
- **`after_commit`과 `after_save`/`after_create`의 차이** — `after_commit :notify, on: :create`는 트랜잭션이 실제로 커밋된 뒤에만 실행된다. 알림 발행처럼 "레코드가 진짜로 저장 완료된 뒤에만 일어나야 하는 부수효과"에 왜 `after_save`가 아니라 `after_commit`을 쓰는지 이해했다.
- **작성자 제외(exclude_creator) 알림 패턴** — `History#push`가 기본값으로 `user_ids -= [user_id]`(히스토리를 만든 사람 = 현재 로그인한 유저 본인)를 실행해서, 알림을 발행시킨 사람 본인은 절대 자기 알림을 받지 않는다는 시스템 전역 규칙. `not_exclude_creator`가 이 규칙을 끄는 화이트리스트 역할을 한다는 것도 함께 확인. (이번 과제에서 "관리자가 HR admin 본인일 때 알림이 안 간다"는 관찰이 바로 이 패턴 때문이었고, 버그가 아니라 유지하기로 결정.)
- **Grape `params do` + 모델 상수 재사용** — `requires :writer_type, type: String, values: Review::WRITER_TYPES`처럼, 모델에 정의한 상수 배열(`WRITER_TYPES = %w[assignee manager].freeze`)을 Grape 파라미터 검증(`values:`)에 그대로 재사용하는 패턴. 값의 출처가 모델 쪽 단일 소스(single source of truth)로 유지되고, 컨트롤러 파라미터 정의와 모델이 어긋날 일이 없다.
- **Grape는 top-level JSON 배열 body를 못 읽는다** — FE가 `[{ids:[...], writer_type:"assignee"}, {...}]`처럼 body 전체를 배열로 보내고 싶어했는데, `grape-2.0.0`의 `Formatter#read_rack_input`을 직접 읽어서 확인: JSON 파서가 body를 파싱한 뒤 `if body.is_a?(Hash)`일 때만 그 내용을 `params`가 읽는 곳(`RACK_REQUEST_FORM_HASH`)에 채워 넣는다. body가 배열이면 이 조건이 거짓이라 `params[:아무거나]`가 전부 `nil`이 되고, `requires`가 실패해서 400이 난다. (참고로 Rails 컨트롤러 단독이면 관례상 `params[:_json]`으로 접근 가능한데, Grape는 `Rack::Request`로 자체 파싱 파이프라인을 돌기 때문에 그 관례가 적용되지 않는다는 것도 확인.) 결론: body는 항상 JSON 객체여야 하고, 배열을 보내려면 이름 있는 키로 감싸거나 — 이번처럼 애초에 값 자체를 키로 쓰는 `{ assignee: [...], manager: [...] }` 구조로 설계하면 이 문제가 원천적으로 사라진다.
- **Grape `at_least_one_of`와 `default:`의 실행 순서 충돌** — `optional :assignee, type: Array[Integer], default: []` + `optional :manager, ..., default: []` + `at_least_one_of :assignee, :manager`를 같이 쓰면, `default:`가 `at_least_one_of` 검증보다 먼저 적용돼서 두 파라미터 모두 항상 "존재하는" 상태(빈 배열)가 돼버려 검증이 무력화된다. 테스트로 직접 재현(둘 다 안 보내도 400이 아니라 201이 남)해서 확인했고, `default:`를 빼서 해결 — 값이 없으면 진짜로 `nil`이 되게 두고, 사용하는 쪽에서 `ids.blank?`로 처리.

## 작업하면서 막혔던 것

- Slack MCP 연동이 세션 초반엔 인증되지 않아 `context-search` 스킬이 바로 동작하지 않았음 → claude.ai 커넥터 인증 후 재실행해서 스레드 원문(2026-04 고객 문의 스레드 포함)을 확보.
- `Review#remind_noti_target_user_ids`가 다건 review id를 받아 내부에서 for문을 도는 구조인지, 단건 전용인지 헷갈렸음 → 코드 추적으로 확인: 이 메서드는 항상 review 인스턴스 하나(`self`) + `writer_type` 하나만 받는 단건 전용 메서드이고, 다건 처리는 컨트롤러(`app/controllers/v2/admins/reviews.rb`)의 `reviews.includes(:cycle, :review_template).each do |review| create_history(review, ...) end` 루프에서 리뷰별로 `History`를 하나씩 만드는 방식으로 이미 분리돼 있었다. `History`의 `after_commit :notify, on: :create`가 레코드마다 독립적으로 실행되면서 `notify_target` → `ReviewMessageFactory.for(self)` → `remind_noti_target_user_ids(writer_type)`을 단건 기준으로 다시 호출하는 구조라, 다건 ids가 들어와도 안전하다고 결론.
- FE가 "assignee 발송/manager 발송을 각각 버튼으로 나눌 줄 알았는데 한 버튼에서 한 번에 보내고 싶어한다"는 요구가 나오면서, `{ids, writer_type}` 하나짜리 요청 → 여러 개 묶은 배열(`[{ids,writer_type}, ...]`) → 최종적으로 `{ assignee: [...], manager: [...] }` 세 가지 설계를 순서대로 검토했다. 배열 형태는 Grape가 top-level array body를 못 읽는 문제에 걸렸고, 객체-키 형태가 그 문제도 피하고 "같은 writer_type이 중복으로 오는" 엣지 케이스도 스키마 레벨에서 막아줘서 최종 채택. `remind_noti_target_user_ids`, `History`/`notify` 파이프라인은 이 논의 내내 한 줄도 안 바뀜 — 애초에 단건-전용으로 설계돼 있었던 덕분.

## 다음에 더 공부하고 싶은 것

- `after_commit`의 `on: :create/:update/:destroy` 옵션과, 트랜잭션이 롤백될 때 콜백이 스킵되는 동작
- Grape `values:` 검증 실패 시 에러 응답 포맷 (400 vs 422 등)
- Grape `mutually_exclusive`, `exactly_one_of`, `all_or_none_of` 같은 다른 파라미터 상호 검증 헬퍼들도 `default:`와 같은 순서 문제가 있는지
