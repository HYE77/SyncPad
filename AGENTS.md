# AGENTS.md

이 문서는 Repository에서 항상 지킬 실행 규칙이다.
Notion Development Convention 전체를 복제하지 않고, 이 프로젝트에 필요한 것만 간결하게 담는다.

## 1. 프로젝트 목적과 범위

- Mac/Windows 크로스 플랫폼 메모·할일 앱
- 터미널 감성의 심플한 UI, 계정 기반 기기 간 실시간 동기화
- MVP 범위:
  - 메모/할일 통합 아이템 (체크박스 옵션)
    - 경량 인라인 편집 (클릭 시 해당 줄 바로 수정)
  - 로그인 (Supabase Auth)
  - 실시간 동기화 (Supabase Realtime)
  - 검색, 정렬
  - 메뉴바(macOS)/트레이(Windows) 퀵 액세스 (Electron Tray API)
  - 카테고리 필터 (상단 탭, ALL 포함)
- MVP 제외 (Future): 첨부파일, 오프라인 캐시, 알림

## 2. 기술 스택 & Architecture 경계

- Desktop Shell: Electron
- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend/DB: Supabase (Postgres + Auth + Realtime)
  - 커스텀 REST API 서버를 만들지 않는다. Supabase JS client SDK로만 데이터에 접근한다.
  - 인가는 Row Level Security(RLS)로 처리한다. 클라이언트 코드에 권한 로직을 중복 구현하지 않는다.

## 3. 디렉터리 책임

```
src/
├── main/            # Electron main process (창 생성, IPC, auto-update)
│   └── tray.ts      # 메뉴바/트레이 아이콘, 퀵 액세스 팝업 창
├── preload/         # contextBridge로 노출할 API만 최소한으로 정의
├── renderer/        # React 앱
│   ├── components/  # 재사용 UI 컴포넌트
│   ├── features/    # 기능 단위 (items, auth 등) — 화면/훅/타입을 함께 둔다
│   ├── lib/         # Supabase client 초기화, 공용 유틸
│   └── styles/       # 터미널 테마 (다크, 모노스페이스)
└── shared/          # main ↔ renderer 공유 타입
```

- 빈 하위 폴더를 미리 만들지 않는다.
- `lib`을 잡동사니 보관소로 쓰지 않는다. 두 기능에서 실제 공유할 때만 이동한다.

## 4. Naming (TypeScript/React)

- Component: PascalCase (`ItemList.tsx`)
- Hook: camelCase, `use` 접두사 (`useItems.ts`)
- 변수/함수: camelCase, 상수: UPPER_SNAKE_CASE
- 타입/인터페이스: PascalCase, `I` 접두사 사용하지 않음
- Boolean은 긍정형으로: `isCompleted`, `hasSynced`
- 파일명은 컴포넌트/훅 이름과 동일하게 맞춘다

## 5. Formatter / Lint / Test / Build

- Dev: `npm run dev` (electron-vite)
- Format: `npm run format` (Prettier)
- Lint: `npm run lint` (ESLint)
- Typecheck: `npm run typecheck` (main/preload + renderer 분리)
- Test: 아직 없음. 첫 테스트를 쓸 때 Vitest를 붙인다.
- Build: `npm run build` → `npm run build:mac` / `build:win` (electron-builder → .dmg / .exe)

CI는 format·lint·typecheck·build를 PR과 main push에서 실행한다.

## 6. Git / PR 규칙

Notion Development Convention의 Git/GitHub Convention을 그대로 따른다.

- Commit: `<type>: <한국어 subject>` (예: `feat: 메모 실시간 동기화 구현`)
- Branch: `<type>/<issue-number>-<영문 설명>` (예: `feat/12-realtime-sync`)
- PR 제목: `<type>: <한국어 subject>`, 본문에 `Closes #번호`
- Merge: Squash Merge만 사용. main 직접 Push·Force Push 금지, PR + CI 필수.
- 1 Issue = 1 Branch = 1 PR (Orca에서는 1 Worktree도 동일하게 매핑)
- PR 리뷰는 작업 위험도에 따라 차등 적용한다:
  - Lite: 가볍게 훑어보고 바로 머지
  - Standard: 전체 diff를 한 번 읽고, 걸리는 부분은 코멘트로 남긴 뒤 머지
  - High-Risk: diff를 정독하고, 무엇을 확인했는지를 PR 코멘트로 남긴 뒤 머지
  - 이 리뷰는 자동으로 실행되지 않는다. 사람이 직접 하거나, Orca에서 별도 Agent에게 리뷰를 명시적으로 요청해야 한다.

## 7. Secret & 고위험 변경 제한

- Supabase URL / anon key는 `.env`에 두고 Git에 포함하지 않는다. `.env.example`만 커밋한다.
- Supabase service role key는 클라이언트(Electron renderer/main)에 절대 포함하지 않는다.
- 다음은 Plan 승인 후에만 구현한다 (Orca High-Risk 기준):
  - DB 스키마 변경, RLS 정책 변경
  - 인증/로그인 로직 변경
  - 새로운 Dependency 또는 외부 서비스 도입
- Secret을 조회·출력·Commit하지 않는다.

## 8. Claude Code

- PR 리뷰 봇: `@claude` 멘션으로만 발동한다 (`.github/workflows/claude.yml`).
  - PR 코멘트에 `@claude`를 달면 리뷰가 코멘트로 달린다. 멘션 없이는 아무것도 실행되지 않는다.
  - 리포 소유자의 코멘트만 받는다. private 리포라 Actions 분이 과금되므로 자동 트리거는 도입하지 않는다.
  - 봇은 6번의 위험도 등급을 스스로 판정해 첫 줄에 표시한다. 사람이 그 판정을 검증한다.
  - 포맷·린트·타입·빌드는 CI가 잡으므로 봇은 언급하지 않는다.
  - 봇 리뷰는 6번의 사람 리뷰를 대체하지 않는다. 머지 판단은 사람이 한다.
