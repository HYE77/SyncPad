import { expect, test, vi } from 'vitest'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { applyChange, categoriesOf, nextFlags, reorder, sortItems, type Item } from './useItems'

// applyChange는 순수 함수인데 모듈이 supabase client를 끌고 온다. .env 없이 돌게 막아둔다.
vi.mock('../../lib/supabase', () => ({ supabase: {} }))

function item(id: string, content: string): Item {
  return {
    id,
    content,
    is_task: false,
    is_completed: false,
    category: null,
    sort_order: 0,
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

function at(id: string, created_at: string, is_completed = false): Item {
  return { ...item(id, id), created_at, is_completed }
}

const 옛것 = at('old', '2026-09-01T00:00:00Z')
const 새것 = at('new', '2026-09-10T00:00:00+09:00')
const 완료 = at('done', '2026-09-11T00:00:00Z', true)

test('최신순은 created_at 내림차순', () => {
  expect(sortItems([옛것, 완료, 새것], 'newest')).toEqual([새것, 옛것, 완료])
})

test('오래된순은 최신순의 역순', () => {
  expect(sortItems([새것, 완료, 옛것], 'oldest')).toEqual([옛것, 새것, 완료])
})

test('내 순서는 sort_order 오름차순이고 완료 항목은 항상 아래', () => {
  const a = { ...at('a', '2026-09-01T00:00:00Z'), sort_order: 2 }
  const b = { ...at('b', '2026-09-02T00:00:00Z'), sort_order: 1 }
  const c = { ...at('c', '2026-09-03T00:00:00Z', true), sort_order: 0 }
  expect(sortItems([c, a, b], 'manual')).toEqual([b, a, c])
})

test('reorder는 같은 그룹 안에서 옮기고 바뀐 행만 돌려준다', () => {
  const [a, b, c] = ['a', 'b', 'c'].map((id, i) => ({
    ...at(id, `2026-09-0${i + 1}T00:00:00Z`),
    sort_order: i + 1
  }))
  // a b c 에서 a를 c 자리로 → b c a
  expect(reorder([a, b, c], 'a', 'c')).toEqual([
    { id: 'b', sort_order: 1 },
    { id: 'c', sort_order: 2 },
    { id: 'a', sort_order: 3 }
  ])
})

test('reorder는 완료/미완료 그룹을 넘나들 수 없다', () => {
  expect(reorder([옛것, 완료], 'done', 'old')).toEqual([])
})

test('탭 목록은 중복·빈값을 걸러 정렬한다', () => {
  const withCategory = (id: string, category: string | null): Item => ({
    ...item(id, id),
    category
  })
  expect(
    categoriesOf([
      withCategory('a', '일'),
      withCategory('b', null),
      withCategory('c', ' '),
      withCategory('d', '일'),
      withCategory('e', '개인')
    ])
  ).toEqual(['개인', '일'])
})

test('정렬은 원본 배열을 건드리지 않는다', () => {
  const 원본 = [옛것, 새것]
  sortItems(원본, 'newest')
  expect(원본).toEqual([옛것, 새것])
})

test('마커는 평문 → 할일 → 완료 → 평문으로 순환한다', () => {
  let it = item('a', '장보기')
  const cycle = [
    { is_task: true, is_completed: false },
    { is_task: true, is_completed: true },
    { is_task: false, is_completed: false }
  ]
  for (const expected of cycle) {
    it = { ...it, ...nextFlags(it) }
    expect({ is_task: it.is_task, is_completed: it.is_completed }).toEqual(expected)
  }
})
