// Electron user agent는 브라우저와 같은 OS 토큰을 담는다. 기기 구분은 이 수준까지만 된다 (#92).
export function platformLabel(userAgent: string | null): string {
  if (!userAgent) return '알 수 없는 기기'
  if (/Windows/.test(userAgent)) return 'Windows'
  if (/Macintosh|Mac OS X/.test(userAgent)) return 'macOS'
  if (/Linux/.test(userAgent)) return 'Linux'
  return '알 수 없는 기기'
}

// 현재 세션 id는 access token(JWT)의 session_id 클레임에만 있다. 서명 검증은 서버 몫이라 디코드만 한다.
export function sessionIdFromToken(accessToken: string): string | null {
  try {
    const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload)).session_id ?? null
  } catch {
    return null
  }
}

const RELATIVE = new Intl.RelativeTimeFormat('ko-KR', { numeric: 'auto' })
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000]
]

export function formatLastActive(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return RELATIVE.format(Math.round(diff / ms), unit)
  }
  return '방금 전'
}
