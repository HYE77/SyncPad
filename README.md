<p align="center"><img src="docs/images/banner.png" alt="SyncPad" width="100%"></p>

# SyncPad

Mac/Windows 크로스 플랫폼 메모·ToDo 앱입니다.

터미널 감성 UI에 계정 기반 실시간 동기화를 더했습니다.

[![다운로드](https://img.shields.io/github/v/release/HYE77/SyncPad?label=%EB%8B%A4%EC%9A%B4%EB%A1%9C%EB%93%9C&style=for-the-badge)](https://github.com/HYE77/SyncPad/releases/latest)

![메인 화면](docs/images/main.png)

|                로그인                 |             트레이 팝업              |
| :-----------------------------------: | :----------------------------------: |
| ![로그인 화면](docs/images/login.png) | ![트레이 팝업](docs/images/tray.png) |

**목차** — [주요 기능](#-주요-기능) · [설치](#-설치) · [사용법](#-사용법) · [데이터 저장 위치](#-데이터-저장-위치) · [문제 해결](#-문제-해결) · [기술 스택](#-기술-스택)

## ✨ 주요 기능

- **메모 + 할일** — 한 줄 클릭으로 바로 수정, 체크박스 전환
- **실시간 동기화** — 같은 계정의 모든 기기에 즉시 반영
- **로그인** — 이메일 또는 Google
- **검색·정렬·카테고리 탭**
- **퀵 액세스** — macOS 메뉴바 / Windows 트레이에서 바로 추가

# 📥 다운로드

## 💻 지원 환경

| OS      | 버전             | 받을 파일                                                                    |
| ------- | ---------------- | ---------------------------------------------------------------------------- |
| macOS   | 12 Monterey 이상 | Apple Silicon: `syncpad-<버전>-arm64.dmg`<br>Intel: `syncpad-<버전>-x64.dmg` |
| Windows | 10, 11 (64비트)  | `syncpad-<버전>-setup.exe`                                                   |

> 💡 내 Mac 확인: Apple 메뉴 → 이 Mac에 관하여 → "칩"이 Apple M…이면 Apple Silicon, "프로세서"가 보이면 Intel

## 📦 설치

위 **다운로드** 버튼 → 릴리스 페이지 **Assets**에서 내 OS 파일을 받습니다.

무료 앱이라 유료 코드 서명이 없어서, **처음 한 번만** OS 경고를 풀어 줘야 합니다.

### macOS

1. `.dmg`를 열고 SyncPad를 **Applications** 폴더로 끌어다 놓습니다.
2. SyncPad를 열면 경고가 뜹니다. **완료**를 누릅니다. (휴지통 X)

   <img src="docs/images/macos-blocked.png" alt="macOS 열지 않음 경고" width="260">

3. **시스템 설정 → 개인정보 보호 및 보안** 맨 아래에서 **그래도 열기**를 누릅니다.

   <img src="docs/images/macos-open-anyway.png" alt="시스템 설정 그래도 열기" width="470">

4. 확인 창에서 한 번 더 **그래도 열기** → Mac 암호(또는 Touch ID) 입력. 끝!

> "그래도 열기" 버튼은 경고 후 약 1시간만 보입니다. 없으면 2번부터 다시 하세요.

### Windows

1. `setup.exe`를 실행합니다.
2. **"Windows의 PC 보호"** 창이 뜨면 **추가 정보 → 실행**을 누릅니다.
3. 설치가 끝나면 바탕화면과 시작 메뉴에 SyncPad가 생깁니다.

## 📝 사용법

| 하고 싶은 것     | 방법                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| 가입 / 로그인    | 이메일 + 비밀번호(6자 이상) → **가입** 또는 **로그인**                |
| Google 로그인    | **continue with google** → 브라우저에서 로그인 → "SyncPad 열기" 허용  |
| 새 항목          | **+ 새 항목**                                                         |
| 수정             | 줄을 클릭                                                             |
| 메모 ↔ 할일      | 줄 앞 마커 클릭: `*` 메모 → `[ ]` 할일 → `[x]` 완료                   |
| 다른 기기 동기화 | 그 기기에도 설치하고 **같은 계정**으로 로그인 (동기화 버튼 없이 자동) |
| 퀵 액세스        | 메뉴바(Windows는 트레이) 아이콘 클릭                                  |
| 완전히 종료      | 메뉴바/트레이 아이콘 우클릭 → **종료** (창을 닫아도 아이콘은 남음)    |

## 💾 데이터 저장 위치

- 메모는 내 컴퓨터가 아니라 **개발자가 운영하는 클라우드([Supabase](https://supabase.com))** 에 저장됩니다. 서버를 따로 준비할 필요는 없습니다.
- 저장 항목: 로그인 이메일, 메모/할일, 카테고리
- 다른 사용자는 내 데이터를 볼 수 없습니다. 단, 서버 관리자는 접근할 수 있으니 **비밀번호 같은 민감 정보는 적지 마세요.**
- 인터넷 연결이 필요합니다. (오프라인 사용 불가)
- 계정·데이터 삭제는 [Issues](https://github.com/HYE77/SyncPad/issues)로 요청해 주세요.

## 🔧 문제 해결

<details>
<summary><b>가입했는데 로그인이 안 돼요</b></summary>

메일함(스팸함 포함)의 인증 메일 링크를 먼저 누르세요. 비밀번호는 6자 이상이어야 합니다.

</details>

<details>
<summary><b>Google 로그인 후 앱으로 돌아오지 않아요</b></summary>

브라우저의 "SyncPad 열기" 창을 허용했는지 확인하세요. 막혔다면 앱을 재시작하고 다시 시도합니다.

</details>

<details>
<summary><b>다른 기기에 반영이 안 되거나 늦어요</b></summary>

두 기기가 같은 계정인지, 인터넷이 연결돼 있는지 확인하세요. 연결이 돌아오면 자동으로 다시 불러오고, 그래도 안 되면 앱을 재시작합니다.

</details>

<details>
<summary><b>macOS에 "그래도 열기" 버튼이 없어요</b></summary>

SyncPad를 한 번 열어 경고를 띄우고 **완료**를 누른 뒤 다시 확인하세요. 그래도 없으면 터미널에서 아래를 실행한 뒤 엽니다.

```bash
xattr -cr /Applications/SyncPad.app
```

</details>

그 밖의 문제는 [Issues](https://github.com/HYE77/SyncPad/issues)에 남겨 주세요.

## 🧰 기술 스택

| 영역      | 사용 기술                                                     |
| --------- | ------------------------------------------------------------- |
| Desktop   | Electron, electron-vite, electron-builder                     |
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS 4                    |
| Backend   | Supabase (Postgres, Auth, Realtime) — RLS 인가, API 서버 없음 |
| Test/Lint | Vitest, ESLint, Prettier                                      |

개발·기여 관련 문서는 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.
