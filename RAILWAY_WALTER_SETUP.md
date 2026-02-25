# Railway × Walter Queue Monitor 연동

## 개요
이 설정은 `walter_commands` 큐를 Railway에서 상시 모니터링합니다.

- 현재 단계(Phase 1): **읽기 전용 모니터링**
- 기능: queued/running/done/error 카운트 + 오래된 queued 감지
- 실행 파일: `scripts/walter-worker.mjs`

---

## 1) Railway에서 GitHub 연결
1. Railway Dashboard → **New Project**
2. **Deploy from GitHub repo** 선택
3. 저장소: `EUO-oma/blog` 선택
4. Root는 repo root 그대로 사용

---

## 2) 환경변수 설정 (Railway Variables)
아래 값 추가:

- `SUPABASE_URL` = `https://<your-project>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `<service_role_key>` (권장)
- `WALTER_OWNER_ID` = `8497629423`
- `WALTER_POLL_MS` = `30000`
- `WALTER_OFF_HOURS_POLL_MS` = `300000` (오프시간 5분 간격)
- `WALTER_STALE_HOURS` = `12`
- `WALTER_TZ` = `Asia/Seoul`
- `WALTER_ACTIVE_START_HOUR` = `8`
- `WALTER_ACTIVE_END_HOUR` = `19`

> 참고: 읽기만 할 경우 anon key도 가능하지만, 안정성을 위해 service_role_key 권장.

---

## 3) 배포 확인
`railway.json`에 start command가 지정되어 있음:

- `node scripts/walter-worker.mjs`

배포 후 Logs에서 아래 형태 로그 확인:

- `[walter-worker] tick=... queued=... running=... done=... error=... staleQueued=...`

---

## 4) 로컬 테스트
```bash
npm run worker:walter
```

로컬에서 테스트할 때도 동일 env가 필요합니다.

---

## 다음 단계 (Phase 2)
- stale queued 자동 재분류
- error 재시도 자동화
- Telegram 알림 연동
- 규칙 기반 자동 처리기
