# nhqv 리더십 진단 — 조직/구성원 엑셀 갱신 방식 검토 (theplus-back 발행 vs ppback 직접수정)

> 날짜: 2026-09-16
> PR: 없음 (nhqv 리더십 진단 워크스페이스 대응, Slack 스레드 리뷰 + ppback 코드 조사)
> 레포: ppback(코드 조사), Slack(#C01E8V7RR8R 2025-08-19 스레드)

## 작업 한 줄 요약

nhqv 리더십 진단 워크스페이스의 조직·구성원 정보를 엑셀 기준으로 갱신할 때 "theplus-back에서 고치고 ppback으로 메세지 발행" vs "ppback에서 직접 수정" 중 뭐가 나은지 검토하기 위해, 작년 Slack 스레드(전체 삭제 후 재등록 스크립트)와 ppback의 Team/Member/`Performance::*Worker` 코드를 조사했다.

## 이번 작업에서 처음 배운 개념

- **서비스 간 동기화가 항상 Kafka는 아니다 — Sidekiq 크로스 앱 job push 패턴** — `app/workers/performance/organization_worker.rb`, `member_worker.rb` 등은 `SyncMessage::Type`(CREATE/UPDATE/DELETE) 메세지를 받아 Team/Member를 갱신하는데, ppback 안에는 이 worker를 enqueue하는 코드가 없다. `karafka.rb`엔 활성 consumer route가 아예 없고 `docs/agent/architecture.md`도 ppback을 producer 쪽으로 문서화한다 — 즉 theplus-back이 공유 Redis에 job class 이름 문자열만으로 직접 push하는 구조로 보인다. 2026-07-06 카프카 조사(`work-log/2026-07-06-kafka-data-flow-investigation.md`)가 "theplus-back/ppback(Karafka)"로 뭉뚱그렸던 걸 다시 읽어보니, 실제로 확인한 건 theplus-back의 Karafka consumer까지였고 ppback 구간은 조사한 적이 없었다는 것도 이번에 알았다 → ROADMAP "섹션 4 · 외부 시스템 연동(HR 동기화)"
- **`SyncMessage::Type` envelope 패턴** — CREATE/UPDATE/DELETE 정수 상수로 동기화 메세지 종류를 구분하고, 각 worker가 `case`로 분기해서 처리 → ROADMAP "섹션 4 · 외부 시스템 연동(HR 동기화)"
- **`Team#update`의 diff 기반 멤버십 반영** — 원하는 멤버 목록(`organization_members`)과 현재 `end_team_joins`를 비교해서 빠진 사람만 `mark_for_destruction`, 새로 온 사람만 `end_team_joins.new`로 추가한다. 삭제 후 재생성이 아니라 in-place 갱신이 이미 프로덕션에 있는 실사례 → ROADMAP "섹션 4 · 외부 시스템 연동(HR 동기화)"
- **크로스 서비스 id 공유** — `Performance::MemberWorker#create`가 `member.find_or_initialize_by(id: data['id'])`로 theplus-back이 내려준 id를 그대로 쓴다. 기존 ROADMAP 항목("크로스 서비스 auto-increment 시퀀스 정합성", 섹션1)과 같은 결의 문제라, ppback에서 직접 레코드를 쓰면 이 id 정합성이 깨질 위험이 있다.

## 작업하면서 막혔던 것과 해결 방법

- 작년 Slack 스크립트의 모델명(`Organization`/`organization_members`)이 지금 ppback 스키마(`Team`/`TeamJoin`)와 안 맞아서 다른 레포 스크립트인가 헷갈렸다 → `git log -S`로 뒤져서 `[조직] Team labels 중복 이슈 수정` 커밋을 찾아 ppback에서 "조직" = `Team`임을 실코드로 확인했다.
- ppback이 theplus-back의 조직/구성원 변경을 어떻게 받는지 `karafka.rb`만 봐서는 안 나왔다(활성 consumer 없음) → `app/workers/performance/*.rb`를 훑어서 `SyncMessage` 처리 코드를 찾아 실제 경로가 Sidekiq cross-app push임을 확인했다.

## 다음에 더 공부하고 싶은 것

- theplus-back이 실제로 이 Sidekiq job을 어떻게 push하는지(호출부, `Sidekiq::Client.push` 여부) — 이번엔 ppback 쪽만 봐서 theplus-back 레포 확인이 필요하다.
- theplus-back에 엑셀 규모(수백~수천 명) 대량 반영 UI/API가 있는지 — ppback 레포로는 확인 불가, nhqv 건 최종 방식 결정 전에 확인 필요.

## 참고 — ROADMAP.md 대조 결과

"섹션 4 · 외부 시스템 연동(HR 동기화)"에 새 항목 3개 추가(Sidekiq 크로스 앱 push, SyncMessage envelope, Team#update diff 반영). 기존 "섹션 1 · 크로스 서비스 auto-increment 시퀀스 정합성" 항목과 연결되는 사례라 별도 체크는 안 하고 참조만 남겼다.
