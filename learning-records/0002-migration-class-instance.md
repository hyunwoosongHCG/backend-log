# 마이그레이션, 클래스/인스턴스, 상속/오버라이드 이해 완료

2026-06-25 `use_required_template` 컬럼 추가 작업을 통해 세 개념을 실무 코드로 학습했다. `class Migration < ActiveRecord::Migration`이 `class Component extends React.Component`와 동일한 구조임을 확인한 뒤 즉시 이해했다. 인스턴스는 "클래스는 붕어빵 틀, 인스턴스는 찍어낸 실물" 비유로 정착됐다.

**Evidence**: 실제 마이그레이션 파일 작성 및 실행 완료, PR 머지 전 단계까지 진행.

**Implications**: 클래스 문법은 재설명 불필요. 다음 레슨은 요청이 컨트롤러(Grape endpoint)를 거쳐 Entity로 직렬화되는 흐름 — zone of proximal development의 자연스러운 다음 단계.
