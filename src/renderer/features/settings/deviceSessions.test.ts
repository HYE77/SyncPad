import { expect, test } from 'vitest'
import { platformLabel, sessionIdFromToken } from './deviceSessions'

test('user agent에서 OS를 판별한다', () => {
  expect(platformLabel('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Electron/44.5.1')).toBe(
    'macOS'
  )
  expect(platformLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Electron/44.5.1')).toBe('Windows')
  expect(platformLabel(null)).toBe('알 수 없는 기기')
})

test('access token에서 session_id를 꺼내고, 깨진 토큰은 null', () => {
  const payload = btoa(JSON.stringify({ session_id: 'abc' })).replace(/=+$/, '')
  expect(sessionIdFromToken(`h.${payload}.s`)).toBe('abc')
  expect(sessionIdFromToken('garbage')).toBeNull()
})
