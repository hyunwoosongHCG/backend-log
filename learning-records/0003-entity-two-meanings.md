# "Entity"가 Java와 Grape에서 다른 의미로 쓰임을 인지

Java/Spring의 `@Entity`(DB 테이블 매핑)와 Grape의 `Grape::Entity`(JSON 직렬화)가 같은 단어를 쓰지만 전혀 다른 개념이라는 것을 혼동했다가 정리했다. Rails에서 DB와 연결된 것은 Model(ActiveRecord)이고, Grape::Entity는 응답 필드를 선별하는 Java의 DTO에 해당한다.

**Evidence**: 직접 질문을 통해 혼동을 발견하고 비교표로 정리.

**Implications**: 앞으로 "Entity"라는 단어가 나오면 어느 맥락인지 확인할 것. ActiveRecord Model 레슨에서 Java Entity와의 대응 관계를 다시 언급하면 강화된다.
