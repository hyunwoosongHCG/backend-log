# 상위 KR 락이 왜 "대기 후 최신값"을 보게 해주는지 직접 실측 검증

> 날짜: 2026-08-12
> 브랜치: `feature/key-result-auto-checkin-reflect`
> 관련 문서: [2026-08-11 PR #5532 리뷰](2026-08-11-ppback-pr-5532-lost-update-lock-review.md), [레슨 44](../lessons/0044-transaction-isolation-level.html)

## 작업 한 줄 요약

어제 리뷰에서 "락을 트랜잭션이 열리기 전에 잡아야 한다"는 규칙 자체는 정리했지만, 그 근거인 "왜 대기 후에 최신 커밋값을 보게 되는가"는 코드 주석을 인용하는 수준이었다. 오늘은 이 project가 실제로 쓰는 MySQL(docker `db` 컨테이너, 8.4.11)에 두 세션을 직접 열어 그 메커니즘을 재현하고, 레슨 44에 심화 섹션으로 반영했다.

## 이 작업에서 처음 배운 개념

- [x] **Locking Read는 최신값을 보여주지만, 그 사실이 트랜잭션의 스냅샷 자체를 갱신하진 않는다** — 어제는 "잠금 읽기는 read view를 안 연다"까지만 알았는데, 오늘 4단계 실측으로 그 다음 단계까지 확인했다: `SELECT ... FOR UPDATE`가 최신 커밋값(999)을 보여준 **직후에도**, 같은 트랜잭션에서 다시 평범한 `SELECT`를 하면 원래 고정됐던 스냅샷 값(0)으로 돌아간다. 즉 트랜잭션의 read view는 "첫 Consistent Read 시점"에 딱 한 번 고정되는 값이고, Locking Read가 몇 번을 왕복하며 최신값을 보고 가도 그 고정 시점 자체는 바뀌지 않는다. → [레슨 44 심화 섹션](../lessons/0044-transaction-isolation-level.html)
- [x] **두 MySQL 세션을 셸에서 직접 살려서 순서대로 명령을 주입하는 법** — `mysql -e`는 매번 새 연결이라 트랜잭션이 안 이어진다. 이름 있는 파이프(FIFO)를 만들고, **백그라운드로 읽는 쪽(mysql 클라이언트)을 먼저 띄운 뒤에** `exec 3>fifo`로 쓰기용 파일 디스크립터를 여는 순서를 지켜야 한다 — 반대로 하면(쓰기 open을 먼저) 리더가 없어 open 자체가 블로킹된다. 그리고 이 파일 디스크립터(`exec 3>...`)는 **하나의 Bash 도구 호출(하나의 셸 프로세스) 안에서만 유지**된다 — 호출이 끝나면 셸도 끝나서 다음 호출에서 같은 fd를 쓰면 "bad file descriptor"가 난다.

## 이번에 직접 검증한 것

docker `db` 컨테이너(`perpl_development`, MySQL 8.4.11, 기본 REPEATABLE READ)에 스크래치 테이블(`zz_lock_test`, 실험 후 즉시 DROP)을 만들어 재현:

```
세션1: START TRANSACTION; SELECT value ...;              → 0   (여기서 스냅샷 고정)
세션2: UPDATE ... SET value=999; COMMIT;                  (세션1 트랜잭션이 열려 있는 동안 커밋)
세션1: SELECT value ...;                                  → 0   (여전히 고정된 스냅샷 — REPEATABLE READ대로)
세션1: SELECT value ... FOR UPDATE;                       → 999 (Locking Read는 스냅샷 무시, 최신 커밋)
세션1: SELECT value ...;                                  → 0   (FOR UPDATE로 최신값 봤어도 스냅샷은 안 바뀜)
```

마지막 줄이 이번에 새로 확인한 부분이다. 이게 곧 `reflect_to_super_key_result_service.rb`의 `lock`(`:88-111`)이 왜 "트랜잭션의 **첫 문장**으로" 조상 KR을 잠그는지의 근거다 — 락이 첫 문장이면 스냅샷이 아직 안 열린 상태로 형제의 커밋을 기다리고, 통과한 **뒤에야** 계산에 쓰이는 평범한 조회(`super_key_result.value` 등)들이 그 시점 기준으로 스냅샷을 연다. 반대로 평범한 조회가 하나라도 먼저 실행되면, 그 순간 스냅샷이 옛값으로 고정돼버려서 뒤에서 `FOR UPDATE`가 아무리 잘 기다려도 계산값은 계속 옛값이다 — `FOR UPDATE` 자신의 반환값만 최신이고, 그 옆의 다른 평범한 조회들은 구제되지 않는다.

## 작업하면서 막혔던 것

- FIFO 쓰기용 파일 디스크립터를 배경 프로세스보다 먼저 열어서 스크립트 전체가 2분 타임아웃으로 죽었다. `exec 3>fifo`는 리더가 없으면 블로킹된다는 걸 몰랐던 것이 원인 — 순서를 (1) 백그라운드 리더 시작 (2) `sleep` (3) 쓰기 fd 오픈으로 바꿔서 해결.
- 그 다음엔 fd를 연 Bash 호출과 그 fd에 명령을 이어서 쓰려는 Bash 호출을 분리했다가 "bad file descriptor"가 났다. Bash 도구는 작업 디렉터리는 유지해도 셸 프로세스 자체(따라서 fd)는 호출마다 새로 뜬다는 걸 이번에 알았다 — 전체 시퀀스(테이블 생성 → 세션1 시작 → 세션2 커밋 → 세션1 재조회 → cleanup)를 반드시 한 Bash 호출 안에 넣어야 했다.

## 다음에 더 공부하고 싶은 것

- range scan(`WHERE`가 인덱스 범위를 긁는 경우)에서 Locking Read가 next-key lock/gap lock과 만나면 오늘 본 단일 PK 조회와 다르게 동작하는지 (레슨 43 심화).
- `performance_schema.data_locks`, `SHOW ENGINE INNODB STATUS`로 락 대기 시간을 실측하는 법 — 어제 기록에 남긴 미해결 항목이기도 하다.
- 오늘 쓴 FIFO 기법을 낙관적 락(`lock_version`, `ActiveRecord::StaleObjectError`) 충돌 재현에도 그대로 쓸 수 있을지.

## 참고 — ROADMAP.md 대조 결과

- 항목 52(트랜잭션 격리 수준)는 이미 어제 체크돼 있었다 — 오늘은 새 체크가 아니라 **같은 항목의 심화**다. 레슨 44에 "Consistent Read vs Locking Read" 섹션 + 실측 결과 + 퀴즈 4를 추가하고, ROADMAP 해당 항목에 이 문서 링크를 덧붙였다.
