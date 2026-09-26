# Contributing

SyncPad 개발 환경 설정과 릴리스 절차입니다. 앱 소개와 사용법은 [README](README.md)를 참고하세요.

## 로컬에서 실행하기

필요한 것: Node.js 24, [Supabase](https://supabase.com) 프로젝트 하나.

1. 의존성을 설치합니다.

   ```bash
   npm ci
   ```

2. Supabase를 준비합니다.
   - 프로젝트를 만들고 SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql)을 실행합니다.
   - Authentication에서 Email 로그인을 켭니다. Google 로그인을 쓰려면 Google provider를 켜고 Redirect URL에 `syncpad://auth/callback`을 추가합니다.

3. 환경 변수 — `.env.example`을 `.env`로 복사하고 프로젝트 Settings → API의 값을 채웁니다.

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```

   anon key만 사용합니다. service role key는 넣지 않습니다.

4. 실행합니다.

   ```bash
   npm run dev
   ```

### 명령어

| 명령                                      | 설명                                  |
| ----------------------------------------- | ------------------------------------- |
| `npm run dev`                             | 개발 모드 실행                        |
| `npm run build:mac` / `npm run build:win` | 설치 파일 빌드 (`dist/`, `.env` 필요) |
| `npm run lint` / `npm run typecheck`      | 린트 / 타입 검사                      |
| `npm test`                                | Vitest                                |

## 릴리스

1. `package.json`의 `version`을 올리고 커밋합니다.
2. `git tag vX.Y.Z && git push origin vX.Y.Z` — `release.yml`이 mac/win을 빌드해 Release에 올립니다.
3. 사전 준비: 저장소 Secrets에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 등록합니다.
