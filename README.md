# SyncPad

Mac/Windows 크로스 플랫폼 메모·할일 앱. 터미널 감성 UI에 계정 기반 실시간 동기화를 얹었다. (Electron + React + Supabase)

![메인 화면](docs/images/main.png)

|                로그인                 |             트레이 팝업              |
| :-----------------------------------: | :----------------------------------: |
| ![로그인 화면](docs/images/login.png) | ![트레이 팝업](docs/images/tray.png) |

## 주요 기능

- **메모/할일 통합 아이템** — 체크박스 옵션, 클릭하면 그 줄에서 바로 수정
- **실시간 동기화** — 로그인한 계정의 모든 기기에 Supabase Realtime으로 반영
- **로그인** — 이메일/비밀번호, Google
- **검색·정렬**, 상단 탭 카테고리 필터(ALL 포함)
- **퀵 액세스** — macOS 메뉴바 / Windows 트레이 팝업에서 바로 추가

## 다운로드

[Releases](https://github.com/HYE77/SyncPad/releases)에서 최신 설치 파일을 받는다.

- **macOS**: `syncpad-<버전>-arm64.dmg`(Apple Silicon) 또는 `syncpad-<버전>-x64.dmg`(Intel)
- **Windows**: `syncpad-<버전>-setup.exe`

코드 서명을 하지 않아 첫 실행 시 경고가 뜬다.

- macOS: 앱을 우클릭 → 열기, 또는 `xattr -cr /Applications/SyncPad.app`
- Windows: SmartScreen에서 "추가 정보" → "실행"

## 로컬에서 실행하기

필요한 것: Node.js 24, [Supabase](https://supabase.com) 프로젝트 하나.

1. 의존성 설치

   ```bash
   npm ci
   ```

2. Supabase 준비
   - 프로젝트를 만들고 SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql)을 실행한다.
   - Authentication에서 Email 로그인을 켠다. Google 로그인을 쓰려면 Google provider를 켜고 Redirect URL에 `syncpad://auth/callback`을 추가한다.

3. 환경 변수 — `.env.example`을 `.env`로 복사하고 프로젝트 Settings → API의 값을 채운다.

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```

   anon key만 쓴다. service role key는 넣지 않는다.

4. 실행

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

## 기술 스택

- Desktop: Electron, electron-vite, electron-builder
- Frontend: React 19, TypeScript, Vite, Tailwind CSS 4
- Backend: Supabase (Postgres, Auth, Realtime) — 인가는 RLS로 처리하며 별도 API 서버는 없다
- Test/Lint: Vitest, ESLint, Prettier

## 릴리스 (관리자용)

1. `package.json`의 `version`을 올리고 커밋한다.
2. `git tag vX.Y.Z && git push origin vX.Y.Z` — `release.yml`이 mac/win을 빌드해 Release에 올린다.
3. 사전 준비: 저장소 Secrets에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 등록한다.
