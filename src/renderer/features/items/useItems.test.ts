import { expect, test, vi } from 'vitest'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { applyChange, type Item } from './useItems'

// applyChange는 순수 함수인데 모듈이 supabase client를 끌고 온다. .env 없이 돌게 막아둔다.
vi.mock('../../lib/supabase', () => ({ supabase: {} }))

function item(id: string, content: string): Item {
  return {
    id,
    content,
    is_task: false,
    is_completed: false,
    created_at: '2026-09-11T00:00:00Z',
    updated_at: '2026-09-11T00:00:00Z'
  }
}

// applyChange가 보는 필드만 채운다.
function event(
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  row: Partial<Item>
): RealtimePostgresChangesPayload<Item> {
  const isDelete = eventType === 'DELETE'
  return {
    eventType,
    new: isDelete ? {} : row,
    old: isDelete ? row : {}
  } as RealtimePostgresChangesPayload<Item>
}

test('원격 INSERT는 맨 앞에 붙는다', () => {
  expect(applyChange([item('a', 'A')], event('INSERT', item('b', 'B')), {})).toEqual([
    item('b', 'B'),
    item('a', 'A')
  ])
})

test('내 create()가 이미 넣은 행은 중복되지 않는다', () => {
  expect(applyChange([item('a', 'A')], event('INSERT', item('a', 'A')), {})).toEqual([
    item('a', 'A')
  ])
})

test('원격 UPDATE는 로컬 행을 덮는다', () => {
  expect(applyChange([item('a', 'A')], event('UPDATE', item('a', '원격')), {})).toEqual([
    item('a', '원격')
  ])
})

test('타이핑 중인 content는 원격 UPDATE가 덮지 않는다', () => {
  expect(
    applyChange([item('a', '내입력')], event('UPDATE', item('a', '원격')), { a: '내입력' })
  ).toEqual([item('a', '내입력')])
})

test('원격 DELETE는 id만으로 지운다', () => {
  expect(applyChange([item('a', 'A'), item('b', 'B')], event('DELETE', { id: 'a' }), {})).toEqual([
    item('b', 'B')
  ])
})

test('모르는 id의 DELETE는 아무것도 바꾸지 않는다', () => {
  expect(applyChange([item('a', 'A')], event('DELETE', { id: 'z' }), {})).toEqual([item('a', 'A')])
})
