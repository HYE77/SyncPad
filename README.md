# SyncPad

Mac/Windows 크로스 플랫폼 메모·할일 앱 (터미널 감성 UI, Electron + Supabase)

## 다운로드

[Releases](https://github.com/HYE77/SyncPad/releases)에서 최신 설치 파일을 받는다.

- **macOS**: `syncpad-<버전>-arm64.dmg`(Apple Silicon) 또는 `syncpad-<버전>-x64.dmg`(Intel)
- **Windows**: `syncpad-<버전>-setup.exe`

코드 서명을 하지 않아 첫 실행 시 경고가 뜬다.

- macOS: 앱을 우클릭 → 열기, 또는 `xattr -cr /Applications/SyncPad.app`
- Windows: SmartScreen에서 "추가 정보" → "실행"

## 릴리스 (관리자용)

1. `package.json`의 `version`을 올리고 커밋한다.
2. `git tag vX.Y.Z && git push origin vX.Y.Z` — `release.yml`이 mac/win을 빌드해 Release에 올린다.
3. 사전 준비: 저장소 Secrets에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 등록한다.

로컬 빌드: `npm run build:mac` / `npm run build:win` (`.env` 필요, 산출물은 `dist/`).
