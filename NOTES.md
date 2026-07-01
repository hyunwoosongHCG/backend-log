# Teaching Notes

## 사용자 프로필

- **배경**: React/TypeScript 프론트엔드 개발자 → Rails 백엔드 개발자 전환 중
- **현재 프로젝트**: Performance Plus (Rails 7.2, Ruby 3.4, Grape API, MySQL, Sidekiq, Pundit)
- **학습 방식**: 실무 작업을 통해 배운다 — 강의 순서가 아닌 작업 순서로

## 교육 선호

- **React 비유를 최대한 활용**: 이미 아는 개념으로 연결하면 이해 속도가 빠름
  - `extends React.Component` → `< ActiveRecord::Migration`
  - TypeScript 타입 → DB 스키마
  - 이벤트 핸들러 → 컨트롤러 액션
- **개념 먼저, 코드 나중**: 왜 필요한지 → 어떻게 생겼는지 → 실무 예시 순서
- **코드는 실무 코드 기반**: Performance Plus 실제 코드를 예시로 사용할 것
- **A-Z 설명**: 당연한 것도 설명한다 (백엔드 기초가 없으므로)

## 이미 알고 있는 것 (가르치지 않아도 됨)

- React, TypeScript, 컴포넌트 구조
- HTTP 메서드 (GET, POST 등) — 프론트 개발 경험으로 알고 있음
- JSON 형식
- Git 기본 사용

## 이미 학습한 개념 (기초 설명 불필요)

- 마이그레이션(Migration) — 2026-06-25
- 클래스와 인스턴스 — 2026-06-25
- 상속과 오버라이드 — 2026-06-25
- 자동 타임스탬프 관리 (created_at/updated_at, 숨은 콜백) — 2026-07-01
- Dirty Tracking / Partial Writes (changed?, attribute_changed?) — 2026-07-01

## 주의사항

- 한국어로 가르친다
- 전문 용어는 영어 원문 병기 (예: 마이그레이션(Migration))
- 퀴즈 보기는 글자 수를 맞춘다 (힌트 방지)
