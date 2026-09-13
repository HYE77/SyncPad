const KEY = 'syncpad.accent'

// Claude Design에서 확정되기 전까지 쓰는 터미널 팔레트 후보 4색.
export const ACCENTS = [
  { name: '그린', hex: '#4ade80' },
  { name: '앰버', hex: '#fbbf24' },
  { name: '시안', hex: '#22d3ee' },
  { name: '마젠타', hex: '#e879f9' }
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
