const KEY = 'syncpad.accent'

// Claude Design 목업(메모 할일 통합 앱 UI)에서 확정한 터미널 팔레트 후보 4색.
export const ACCENTS = [
  { name: '앰버', hex: '#dba86a' },
  { name: '시안', hex: '#5ec9d6' },
  { name: '그린', hex: '#7fd08a' },
  { name: '마젠타', hex: '#d68fd6' }
] as const

// 저장값이 없거나 후보에 없는 값(구버전·손댄 값)이면 기본색으로 되돌린다.
export function resolveAccent(saved: string | null): string {
  return ACCENTS.find((accent) => accent.hex === saved)?.hex ?? ACCENTS[0].hex
}

export function loadAccent(): string {
  return resolveAccent(localStorage.getItem(KEY))
}

// Tailwind 유틸이 var(--color-term-accent)를 읽으니 루트에 덮어쓰면 전역에 반영된다.
export function applyAccent(hex: string): void {
  document.documentElement.style.setProperty('--color-term-accent', hex)
}

export function saveAccent(hex: string): void {
  localStorage.setItem(KEY, hex)
  applyAccent(hex)
}
