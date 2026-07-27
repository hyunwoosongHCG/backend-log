# 핵심성과 체크인 자동 반영 기능 — 수동 시나리오 테스트 중 발견한 Pundit 인가 구조

> 날짜: 2026-07-27
> 브랜치: feature/key-result-auto-checkin-reflect
> 관련 커밋: `fb67dbb6d`(자동 반영 상위 목표 자동 마감) 기능을 실제 화면/승인 흐름으로 검증하는 과정
> 이어지는 작업: [2026-07-24 자동 마감 구현 작업](2026-07-24-key-result-auto-checkin-reflect-auto-close-and-review-fixes.md)

## 작업 한 줄 요약

푸시 전 기능 확인을 위해 dev DB 실제 유저 정보로 목표 일괄 생성 엑셀을 채우고, 담당자/관리자/HR admin을 다르게 조합한 시나리오 5개를 실제 체크인·승인·일괄승인 서비스로 직접 실행해 반영 체인이 정상 동작하는지 확인했다. 그 과정에서 이 코드베이스의 "HR admin"이 서로 무관한 두 가지 개념으로 나뉘어 있다는 것과, 서비스 객체를 직접 호출하면 Pundit 인가 체크가 통째로 우회된다는 것을 발견했다.

## 이 작업에서 처음 배운 개념

- [x] `authorize`(Pundit)는 **컨트롤러 레이어에서만 강제**된다 — `CheckIns::UpdateService`나 `Admin::BulkUpdateService` 같은 서비스 객체를 직접 호출하면 `approve_check_in?` 같은 정책 체크를 아예 거치지 않고 실행된다. 실제로 정책상 승인 권한이 없는 유저로 서비스를 직접 호출했더니 "성공"해버리는 걸 확인했다 — 실제 API/화면이었다면 403이 났을 상황이다. → [레슨 46](../lessons/0046-pundit-authorize-scope-and-hr-admin-duality.html)
- [x] `ObjectivePolicy#hr_admin?`은 기본 구현을 오버라이드해서 "본인이 담당자인 목표는 hr_admin 자동승인 대상에서 제외"하는 가드를 갖고 있다(`return false if record.assignee_user?(user)`) — HR admin이 자기 자신의 체크인을 셀프 승인하지 못하게 막는 실제 이해충돌 방지 장치다.
- [x] **이 코드베이스에 "HR admin"이 서로 무관한 두 가지 방식으로 존재한다.** `workspace.hr_admins`(`work_hr_administrations` 조인 테이블)와, Pundit 정책이 실제로 보는 `Member#hr_admin?`(`admin_roles` 비트마스크 컬럼, `has_flags` 젬)는 완전히 다른 테이블/컬럼이다. 이 dev workspace의 test1 유저는 전자엔 있지만 후자엔 없어서, "HR admin이니까 승인될 것"이라는 가정이 실제로는 틀렸다 — 직접 두 값을 대조해보고서야 알았다. → [레슨 46](../lessons/0046-pundit-authorize-scope-and-hr-admin-duality.html)
- [x] `has_flags`(비트마스크 플래그 컬럼) 패턴 — 하나의 정수 컬럼(`admin_roles`)에 비트 하나씩을 이름 붙은 boolean 메서드(`hr_admin?`, `system_admin?`, `sub_admin?`)로 매핑하는 방식. `has_flags 1 => :hr_admin, 2 => :system_admin, ...` 선언 하나로 여러 개의 boolean 컬럼을 안 만들어도 되는 대신, 값이 정수라 DB만 봐서는 무슨 뜻인지 바로 안 보인다.
- [x] `WorkHrAdministration.status`(`super`/`hr`) — 슈퍼 어드민은 `Workspace#*_not_super_admin` 스코프(`where.not(id: super_admin_ids)`)로 여러 관리자 화면의 "구성원 선택" 목록에서 의도적으로 배제된다. 엑셀 업로드에서 실제로 "일치하는 구성원이 없습니다" 에러를 만났는데, 원인이 이 스코프였다 — 담당자로 지정한 유저가 super 상태라 애초에 후보 목록에 없었던 것.

## 작업하면서 막혔던 것

- **test1 유저를 "HR admin"으로 가정하고 시나리오를 설계했는데, 실행해보니 정책 체크가 계속 `false`로 나왔다.** 처음엔 버그인가 싶었는데, `ObjectivePolicy`/`ApplicationPolicy` 코드를 직접 읽고 `member.hr_admin?`을 콘솔에서 직접 찍어보고서야 test1이 `work_hr_administrations`에만 있고 `Member#admin_roles`엔 hr_admin 비트가 없다는 걸 확인했다. 같은 워크스페이스의 손예진 유저는 둘 다 만족해서, 이 유저로 시나리오를 다시 짰다.
- **엑셀 업로드에서 특정 행만 "일치하는 구성원이 없습니다" 오류가 났다.** 같은 이메일로 다른 행은 잘 되는데 유독 그 유저만 안 됐다 — `WorkHrAdministration.find_by(...).status`를 직접 조회해서 그 유저가 `super`(슈퍼 어드민)라는 걸 확인하고, 코드베이스 전반에서 슈퍼 어드민을 구성원 목록에서 빼는 스코프를 찾아 원인을 특정했다.
- **`Objective::Admin::BulkUpdateService`로 일괄 승인을 직접 호출했을 때, 실제로는 권한이 없는 유저로도 승인이 성공해버렸다.** 처음엔 이걸 보고 "이 유저도 진짜 hr_admin이구나" 착각할 뻔했는데, `WorkspacePolicy#hr_admin?`을 별도로 직접 호출해서 확인해보니 `false`였다. 서비스 객체가 컨트롤러의 `authorize` 호출 없이는 정책을 아예 안 본다는 걸 알고 나서야 앞뒤가 맞았다.

## 다음에 더 공부하고 싶은 것

- `policy_scope`란 무엇이고 `authorize`와 어떻게 다른지 (ROADMAP에 미체크 항목으로 남아있음)
- 이 코드베이스에서 `has_flags` 같은 비트마스크 컬럼과 별도 조인 테이블(`work_hr_administrations`)이 같은 개념(관리자 권한)을 왜 두 가지 방식으로 구현하게 됐는지 — 히스토리 조사

## 참고 — ROADMAP.md 대조 결과

"권한" 섹션에 `authorize`가 컨트롤러 레이어 전용이라는 항목과 `has_flags`/`Member#hr_admin?` 이중 개념 항목을 레슨 46 링크로 추가했다.
