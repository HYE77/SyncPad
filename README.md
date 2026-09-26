# SyncPad

Mac/Windows 크로스 플랫폼 메모·할일 앱. 터미널 감성 UI에 계정 기반 실시간 동기화를 얹었다. (Electron + React + Supabase)

[![다운로드](https://img.shields.io/github/v/release/HYE77/SyncPad?label=%EB%8B%A4%EC%9A%B4%EB%A1%9C%EB%93%9C&style=for-the-badge)](https://github.com/HYE77/SyncPad/releases/latest)

![메인 화면](docs/images/main.png)

|                로그인                 |             트레이 팝업              |
| :-----------------------------------: | :----------------------------------: |
| ![로그인 화면](docs/images/login.png) | ![트레이 팝업](docs/images/tray.png) |

**목차** — 사용자: [주요 기능](#주요-기능) · [설치](#설치) · [사용법](#사용법) · [데이터 저장 위치](#데이터-저장-위치) · [문제 해결](#문제-해결) / 개발자: [로컬에서 실행하기](#로컬에서-실행하기) · [기술 스택](#기술-스택) · [릴리스](#릴리스-관리자용)

## 주요 기능

- **메모/할일 통합 아이템** — 체크박스 옵션, 클릭하면 그 줄에서 바로 수정
- **실시간 동기화** — 로그인한 계정의 모든 기기에 Supabase Realtime으로 반영
- **로그인** — 이메일/비밀번호, Google
- **검색·정렬**, 상단 탭 카테고리 필터(ALL 포함)
- **퀵 액세스** — macOS 메뉴바 / Windows 트레이 팝업에서 바로 추가

# 다운로드해서 쓰기

## 지원 환경

| OS      | 버전                    | 받을 파일                                                                             |
| ------- | ----------------------- | ------------------------------------------------------------------------------------- |
| macOS   | 12 Monterey 이상        | Apple Silicon(M1 이후): `syncpad-<버전>-arm64.dmg`<br>Intel: `syncpad-<버전>-x64.dmg` |
| Windows | Windows 10, 11 (64비트) | `syncpad-<버전>-setup.exe`                                                            |

내 Mac이 어느 쪽인지는 화면 왼쪽 위 Apple 메뉴 → 이 Mac에 관하여 → "칩"(Apple M…이면 Apple Silicon) 또는 "프로세서"(Intel)로 확인한다.

## 설치

위 **다운로드** 버튼 → 최신 릴리스 페이지 아래쪽 Assets에서 내 OS에 맞는 파일을 받는다.

SyncPad는 코드 서명을 하지 않은 무료 앱이라 처음 실행할 때 OS가 경고를 띄운다. 아래 순서대로 한 번만 풀어주면 그다음부터는 평소처럼 열린다.

### macOS

1. 받은 `.dmg`를 열고 SyncPad 아이콘을 Applications 폴더로 끌어다 놓는다.
2. SyncPad를 처음 열면 아래 경고가 뜬다. Apple 유료 인증서로 서명하지 않은 앱이라 나오는 메시지다. **완료**를 누른다(휴지통으로 이동 X).

   <img src="docs/images/macos-blocked.png" alt="macOS 열지 않음 경고" width="262">

3. 화면 왼쪽 위 Apple 메뉴 → **시스템 설정** → **개인정보 보호 및 보안**을 열고 맨 아래 "보안"까지 내린다. "SyncPad을(를) 차단했습니다" 옆의 **그래도 열기**를 누른다.

   <img src="docs/images/macos-open-anyway.png" alt="시스템 설정 그래도 열기" width="470">

4. 한 번 더 뜨는 확인 창에서 **그래도 열기**를 누르고 Mac 암호(또는 Touch ID)를 입력한다. 이후로는 경고 없이 열린다.

> "그래도 열기" 버튼은 2번 경고를 본 뒤 약 1시간 동안만 보인다. 없으면 SyncPad를 다시 한 번 열어 2번부터 반복한다.

### Windows

1. 받은 `syncpad-<버전>-setup.exe`를 실행한다.
2. 파란 **"Windows의 PC 보호"** 창이 뜨면 **추가 정보**를 누르고, 나타난 **실행** 버튼을 누른다.
3. 설치가 끝나면 바탕화면과 시작 메뉴에 SyncPad가 생긴다.

## 사용법

1. **로그인** — 처음 열면 로그인 화면이 나온다.
   - 이메일/비밀번호: 처음이면 이메일과 비밀번호(6자 이상)를 입력하고 **가입**, 이후에는 **로그인**.
   - Google: **continue with google**을 누르면 브라우저가 열린다. Google 로그인 후 브라우저가 "SyncPad 열기"를 물으면 허용한다.
2. **쓰기** — **+ 새 항목**으로 줄을 만들고 적는다. 줄을 클릭하면 그 자리에서 고친다. 줄 앞 마커를 누를 때마다 메모(`-`) → 할일(`[ ]`) → 완료(`[x]`)로 바뀐다.
3. **다른 기기에서** — 다른 Mac/PC에도 SyncPad를 설치하고 **같은 계정**으로 로그인하면 된다. 한쪽에서 고친 내용이 다른 쪽에 바로 나타난다. 따로 동기화 버튼은 없다.
4. **퀵 액세스** — 창을 닫아도 macOS 메뉴바(Windows는 작업 표시줄 오른쪽 트레이)에 아이콘이 남는다. 누르면 작은 팝업에서 바로 추가할 수 있다. 완전히 끄려면 트레이 아이콘을 우클릭 → **종료**.

## 데이터 저장 위치

- 메모와 할일은 내 컴퓨터가 아니라 **SyncPad 개발자가 운영하는 클라우드 서버([Supabase](https://supabase.com))** 에 저장된다. 그래서 여러 기기에서 같은 내용이 보인다. 사용자가 서버를 따로 준비할 필요는 없다.
- 저장되는 것: 로그인 이메일, 작성한 메모/할일과 카테고리. 다른 사용자는 내 데이터를 읽을 수 없도록 서버에서 계정별로 막혀 있다.
- 서버 관리자는 기술적으로 데이터베이스에 접근할 수 있다. 비밀번호·민감한 정보는 적지 않기를 권한다.
- 인터넷 연결이 필요하다. 오프라인에서는 쓰거나 불러올 수 없다.
- 계정·데이터 삭제를 원하면 [Issues](https://github.com/HYE77/SyncPad/issues)로 요청한다.

## 문제 해결

- **가입했는데 로그인이 안 된다** — 가입 메일함(스팸함 포함)에 인증 메일이 왔다면 링크를 먼저 누른다. 비밀번호는 6자 이상이어야 한다.
- **Google 로그인 후 앱으로 돌아오지 않는다** — 브라우저의 "SyncPad 열기" 확인 창을 허용했는지 본다. 막혔다면 앱을 껐다 켜고 다시 시도한다.
- **다른 기기에 반영이 안 되거나 늦다** — 두 기기가 같은 계정으로 로그인했는지, 인터넷이 연결돼 있는지 확인한다. 연결이 돌아오면 자동으로 다시 불러오고, 그래도 안 되면 앱을 재시작한다.
- **macOS 시스템 설정에 "그래도 열기"가 없다** — SyncPad를 한 번 열어 경고를 띄운 뒤 **완료**를 누르고 다시 확인한다. 그래도 안 되면 터미널에서 `xattr -cr /Applications/SyncPad.app` 실행 후 연다.
- 그 밖의 문제는 [Issues](https://github.com/HYE77/SyncPad/issues)에 남긴다.

# 개발자용

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
