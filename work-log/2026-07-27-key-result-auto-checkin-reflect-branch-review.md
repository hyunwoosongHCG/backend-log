# 핵심성과 체크인 자동 반영 기능 — 브랜치 전체 셀프 리뷰

> 날짜: 2026-07-27
> 브랜치: `feature/key-result-auto-checkin-reflect` (hcgtheplus/ppback)
> 레포: hcgtheplus/ppback (Rails/Grape)

## 작업 한 줄 요약

직접 구현한 "핵심성과 체크인 자동 반영" 기능(커밋 7개, 23파일, +826/-24)을 PR 올리기 전에 전체 셀프 리뷰했다. 관련 스펙 241개를 Docker에서 돌려 전부 통과하는 걸 확인하고, 신규 파일 RuboCop도 클린인 상태에서 **스펙이 통과한다고 안전한 건 아닌 지점들**을 찾는 데 집중했다. 결과적으로 N+1 1건(확실), 제품 결정이 필요한 semantics 3건, 참고 4건을 정리했다. 그리고 가장 크게 지적했던 1건은 **기존 코드 컨벤션을 확인한 뒤 스스로 철회**했다 — 이번 세션에서 제일 많이 배운 게 그 과정이다.

## 이번 작업에서 처음 배운 개념

- **`nil`(값을 안 보냄)과 `false`(false라는 값)는 다르고, Grape optional 파라미터 + NOT NULL boolean 컬럼 조합에서 이게 충돌한다.** Grape에서 `optional :auto_checkin_reflect, type: Boolean`으로 선언한 파라미터를 클라이언트가 안 보내면 `params`에 **키 자체가 없어서** `item[:auto_checkin_reflect]`가 `nil`이 된다. 반면 DB 컬럼은 `null: false, default: false`라 `original.as_json`을 하면 **항상 `true`/`false`**가 나온다. 이 둘을 `==`로 비교하는 diff 로직에서는 `nil != false`라 "변경 없음"이 "변경 있음"으로, 그리고 저장 단계에서 `nil || false`가 "false로 바꿔달라"로 둔갑한다. FE에서 `undefined`와 `false`를 구분하는 것과 완전히 같은 문제인데, 백엔드에서는 diff 계산 → 승인 리비전 생성 → 실제 UPDATE까지 연쇄된다는 게 달랐다.

- **⭐ 지적하기 전에 그 코드베이스가 이미 채택한 컨벤션을 먼저 확인해야 한다.** 위 `nil` vs `false`를 재현까지 해놓고 "반드시 고쳐야 할 것 1번"으로 올렸는데, **바로 옆의 `tag_ids`가 이미 정확히 같은 구조**였다. `prev_data[:tag_ids]`는 `original.tag_ids&.sort` → `[]`, `next_data[:tag_ids]`는 미전송 시 `nil`. 저장하면 태그가 통째로 날아간다. 이 브랜치 이전부터 그랬고 아무도 안 고쳤다. 즉 이 서비스는 **"FE가 모든 필드를 항상 보낸다"를 이미 계약으로 받아들이고 있었고**, 내가 새 필드에만 더 엄격한 잣대를 댄 거였다. 같은 결함이 기존에 이미 있다면 그건 "버그 발견"이 아니라 "컨벤션 확인 실패"에 가깝다. 새 필드 하나만 방어하면 오히려 일관성이 깨진다.

- **`preload`와 `includes`는 다르고, 공유 엔티티에 필드를 추가하면 그 엔티티를 쓰는 호출처를 전부 갱신해야 한다.** 지금까지 배운 N+1은 "쿼리를 잘못 짜서" 생기는 거였는데, 이번 건은 **쿼리는 그대로인데 엔티티에 노출 필드를 하나 추가해서** 생겼다. `Entities::AdminObjectives::ObjectivesEntity`를 쓰는 엔드포인트가 3곳인데 그중 1곳만 preload를 고쳤다. 엔티티는 "어느 컨트롤러에서 렌더되는지" 자기가 모르기 때문에, 필드를 추가할 땐 역방향으로(엔티티 → 호출처) 검색해서 preload를 맞춰야 한다는 걸 배웠다.

- **`BigDecimal#round`는 인자를 안 주면 정수로 반올림한다.** `value` 컬럼이 `decimal(26, 6)`인데 `.round`로 소수점을 버린다. `progress` kind는 target이 항상 100으로 강제돼서, `boolean`은 0/1이라서 눈에 안 띄고, target이 임의값인 `unit` kind에서만 드러난다(target 3 + 하위 50% → 1.5 → 2). **이것도 결국 지적을 철회했는데, 그 과정이 배울 점이었다.** 백엔드만 보면 "컬럼은 소수 6자리인데 왜 정수로 자르지?"가 맞는 질문이고 체크인 API도 `type: BigDecimal`이라 소수를 받는다. 그런데 프론트(ppfront) `Table.jsx`를 열어보니 kind별로 입력 컴포넌트가 갈렸다 — `interval`만 `NumberFormat decimalScale={6}`으로 소수를 받고, `unit`·`progress`는 `IntegerInput`으로 "정수만 입력 가능합니다" 툴팁을 띄운다. 즉 **소수 허용은 컬럼 스펙이지 제품 계약이 아니었다.** 백엔드 코드만으로는 판단할 수 없고 프론트까지 봐야 하는 종류의 질문이 있다는 걸 배웠다.

- **문자열 상수로 분기하는 도메인 이벤트를 추가하면 손댈 곳이 코드 전체에 흩어진다.** `AutoCheckedIn`이라는 `event_type`을 하나 추가했는데 실제로 얽힌 곳이 6군데였다 — `ObjectiveMessageFactory#receiver_ids`(여기 안 넣으면 `raise ArgumentError`로 터진다), `Objective#objective_histories` 스코프, `History::OBJ_VISIT_EXCEPTION`(안 넣으면 안읽음 카운트가 올라간다), `UNSHOWING_EVENT_TYPES`, `HistorySerializer`, `ObjectiveHistoryEntity`의 `case`. enum이나 타입이 아니라 문자열이라 컴파일러/타입체커가 누락을 안 잡아준다. FE의 discriminated union이 `switch` 문에서 exhaustiveness 체크를 해주는 것과 정확히 대비된다. 실제로 추적해보니 필수 지점(`receiver_ids`)은 제대로 처리돼 있었고 나머지는 의도된 미노출이었지만, **"어디를 봐야 하는지 알아내는 데만 6개 파일을 뒤져야 했다"**는 게 이 패턴의 비용이다.

- **스코프가 걸린 `has_one` 연관은 캐시에 의존하면 위험하다.** `has_one :pending_check_in_revision, -> { where(status: :pending) }`인데, 서비스가 호출되는 시점엔 이미 status가 `accepted`로 바뀐 뒤다. 지금은 앞 단계에서 연관이 메모리에 로드돼 있어서 동작하지만, 누가 중간에 `objective.reload` 한 줄을 넣으면 재조회 시 스코프에 안 걸려서 `nil` → `NoMethodError`가 난다. "지금 동작한다"와 "안전하다"가 다른 대표적인 경우.

## 작업하면서 막혔던 것과 해결 방법

- **증거를 뽑는 것과 증거를 끝까지 읽는 것은 다르다.** `nil` vs `false`를 재현하려고 임시 spec 파일(`spec/tmp_diff_probe_spec.rb`)을 만들어 diff 출력을 통째로 찍었는데, 그 출력에 `tag_ids: []` (prev) 옆에 `tag_ids: nil` (next)이 **같이 찍혀 있었는데도 못 봤다.** 내가 찾으려던 필드만 보고 나머지를 흘려 읽었다. 사용자가 "FE 작업 끝나면 항상 올 값인데 이렇게까지 대응해야 하냐"고 되물어서 다시 열어보고서야 알았다. 앞으로는 재현 출력을 필드 단위로 훑는 습관을 들여야겠다.

- **임시 spec 파일로 재현하는 방식이 `rails runner`보다 편했다.** 서비스 객체 하나의 동작을 확인하려고 처음엔 `rails runner`를 생각했는데, 워크스페이스·주기·목표·핵심성과를 다 만들어야 해서 factory를 쓸 수 있는 spec 쪽이 훨씬 빨랐다. `spec/` 밑에 임시 파일을 만들고 `puts`로 중간값을 찍은 뒤 확인이 끝나면 지우는 식. `let_it_be`/`create` 조합을 그대로 쓸 수 있는 게 컸다.

- **스펙 241개가 전부 통과하는데도 회귀가 숨어 있었다.** `auto_checkin_reflect`를 다루는 request spec이 `update_spec.rb`, `create_spec.rb`, `objective_update_diff_spec.rb` 어디에도 없어서, 그 필드에 관한 한 테스트가 아무것도 검증하지 않고 있었다. "전부 초록불"이 "커버됐다"는 뜻이 아니라는 걸 실제로 확인한 셈이다. 스펙 개수보다 **새로 추가한 필드/분기가 스펙에 이름으로 등장하는지**를 grep으로 확인하는 게 빠르다.

## 다음에 더 공부하고 싶은 것

- `tag_ids`도 같은 결함인데 왜 계속 남아 있을까 — "알면서 두는 부채"와 "고쳐야 할 버그"를 가르는 실무 기준. 지금 내 판단 근거는 "FE 계약이 지켜지고 있고, 깨지면 눈에 보인다" 정도인데 더 명확한 기준이 있을 것 같다.
- Grape의 `params`와 `declared(params, include_missing: true/false)`의 정확한 차이. 이번에 `declared(..., include_missing: false)`(생성)와 raw `params`(수정)가 섞여 쓰이는 걸 봤는데, 어느 쪽이 언제 키를 채워주는지 확실히 정리하고 싶다.
- 1:N 관계에서 "여러 하위 → 하나의 상위"로 값을 반영할 때의 semantics(마지막이 이김 / 평균 / 합계). 이번 팬인 케이스에서 처음 마주쳤는데, OKR 도메인에서 일반적으로 어떻게 푸는지 궁금하다.

## 참고 — ROADMAP.md 대조 결과

**이미 체크되어 있어 그대로 둔 항목** (이번 리뷰에서 재확인만 함)

- "데이터베이스 기초 > 중첩 트랜잭션과 `requires_new`(SAVEPOINT)" — 이 브랜치의 `auto_close_if_complete`가 정확히 그 패턴이라 리뷰에서 잘된 부분으로 꼽았다 (레슨 45)
- "ActiveRecord > N+1 문제란?" — 이번 건은 결이 달라서 항목을 보강했다 (아래)
- "ActiveRecord > 자기참조 관계와 순환 참조 방지" — DB 레벨 방지는 이미 정리돼 있고, 이번엔 런타임 순회에서 `Set`으로 막는 쪽이라 항목을 보강했다 (아래)
- "테스트 > `let_it_be` 공유 객체 오염" — 이 브랜치 스펙의 `workspace.reload` / `let` 전환 주석이 레슨 48 내용 그대로였다
- "Grape API > `params do` 블록으로 파라미터 정의" — 미전송 시맨틱스는 없어서 새 항목으로 추가했다 (아래)
- "권한 > `authorize`는 컨트롤러에서만 강제됨" — 레슨 46, 07-27 수동 테스트 work-log

**새로 추가·보강한 항목**

- 섹션2 "자료형과 변수"에 **"`nil`(미전송)과 `false`(값)의 구분 — optional 파라미터와 NOT NULL boolean 컬럼"** 추가
- 섹션2 "자료형과 변수"에 **"`BigDecimal`의 정밀도와 `#round` — 인자 없으면 정수 반올림"** 추가
- 섹션3 "ActiveRecord"의 N+1 항목에 **`preload` vs `includes`, 그리고 공유 엔티티에 필드 추가 시 호출처 전부 갱신** 내용 보강
- 섹션3 "ActiveRecord"에 **"연관 캐시(association cache) — 스코프가 걸린 `has_one`은 상태가 바뀌면 재조회 시 사라진다"** 추가
- 섹션4 "실무 패턴"에 **"문자열 상수로 분기하는 도메인 이벤트를 추가할 때의 파급 범위"** 추가

**개념 정리 파일 후보**

`nil` vs `false` 건은 재현 코드까지 남아 있어서 레슨(0051)으로 따로 쓸 만하다. 다만 결론이 "그래서 안 고쳤다"라 단순 버그 레슨이 아니라 **"기술적으로 맞는 지적이 항상 고쳐야 할 지적은 아니다"**라는 판단 사례로 쓰는 게 맞을 것 같다.
