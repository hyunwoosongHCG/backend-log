# 도메인(Domain)과 엔티티(Entity)의 차이 인지

2026-06-25 선배 개발자의 Spring 코드(HrAppointmentWorkDeleteCommandService)를 보며 학습했다.
3레이어 아키텍처에서 Entity가 빈 데이터 그릇인 것과 달리, DDD 방식에서는 Entity가 자기 비즈니스 로직을 직접 가진다는 것을 파악했다.
Service가 얇아지고 도메인 객체가 "스스로 삭제 가능 여부를 검증하고, 자식 데이터를 정리하고, 상태를 변경"하는 패턴을 코드로 확인했다.

**Evidence**: 실제 Spring 코드 스크린샷을 분석하며 `appointmentWork.delete()` 내부 로직을 직접 읽음.

**Implications**: Rails의 Fat Model 철학(before_destroy, validates 등)이 DDD 방식과 같은 맥락임을 연결할 수 있다. 다음 레슨에서 ORM 영속성 추적 개념으로 연결될 수 있다.
