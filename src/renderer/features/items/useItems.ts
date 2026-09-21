import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export type Item = {
  id: string
  content: string
  is_task: boolean
  is_completed: boolean
  category: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type ItemFlags = Partial<Pick<Item, 'is_task' | 'is_completed' | 'category'>>

type UseItems = {
  items: Item[]
  error: string | null
  create: (content?: string, isTask?: boolean, category?: string | null) => Promise<Item | null>
  update: (id: string, content: string) => void
  setFlags: (id: string, flags: ItemFlags) => Promise<void>
  remove: (id: string) => Promise<void>
  move: (dragId: string, targetId: string) => void
  commitOrder: () => void
  cancelOrder: () => void
  flush: () => void
}

// 다른 기기에서 온 변경을 로컬 목록에 합친다. 충돌은 last-write-wins.
export function applyChange(
  prev: Item[],
  payload: RealtimePostgresChangesPayload<Item>,
  pending: Record<string, string>
): Item[] {
  if (payload.eventType === 'DELETE') {
    // 기본 replica identity라 old에는 PK만 온다. 모르는 id면 filter가 no-op.
    const removed = payload.old.id
    return prev.filter((item) => item.id !== removed)
  }
  const row = payload.new
  // 내 create()가 이미 낙관적으로 넣어둔 행이면 중복으로 쌓지 않는다.
  if (!prev.some((item) => item.id === row.id)) return [row, ...prev]
  // 이 기기에서 디바운스 대기 중인 입력은 원격 content로 덮지 않는다. 커서가 튄다.
  const merged = pending[row.id] !== undefined ? { ...row, content: pending[row.id] } : row
  return prev.map((item) => (item.id === row.id ? merged : item))
}

// 스키마에 title이 없다. 목록에는 첫 줄을 제목처럼 쓴다.
export function firstLine(content: string): string {
  return content.split('\n', 1)[0].trim() || '(빈 메모)'
}

// 마커 클릭 한 번으로 종류와 완료여부를 같이 돈다: - → [ ] → [x] → -
export function nextFlags(item: Item): ItemFlags {
  if (!item.is_task) return { is_task: true, is_completed: false }
  if (!item.is_completed) return { is_completed: true }
  return { is_task: false, is_completed: false }
}

// 탭 목록은 별도 저장 없이 항목들의 category에서 파생한다 (#37).
export function categoriesOf(items: Item[]): string[] {
  const names = items.map((item) => item.category?.trim()).filter((name) => !!name) as string[]
  return [...new Set(names)].sort((a, b) => a.localeCompare(b))
}

export type SortKey = 'manual' | 'newest' | 'oldest'

const newestFirst = (a: Item, b: Item): number =>
  Date.parse(b.created_at) - Date.parse(a.created_at)

const byKey: Record<SortKey, (a: Item, b: Item) => number> = {
  // 새 항목은 sort_order 0이라 재정렬된(1..n) 항목들 위에 붙는다.
  manual: (a, b) => a.sort_order - b.sort_order || newestFirst(a, b),
  newest: newestFirst,
  oldest: (a, b) => newestFirst(b, a)
}

// 완료 항목은 어떤 정렬에서도 미완료 아래로 간다. 같은 그룹 안에서 key로 정렬한다.
export function sortItems(items: Item[], key: SortKey): Item[] {
  return [...items].sort(
    (a, b) => Number(a.is_completed) - Number(b.is_completed) || byKey[key](a, b)
  )
}

// dragId를 targetId 자리로 옮기고, 같은 완료 그룹 전체를 1..n으로 다시 매겨 바뀐 행만 돌려준다.
// 필터와 무관하게 전체 그룹 기준이라 숨겨진 카테고리 항목과의 상대 순서도 유지된다.
// 그룹이 다르면(완료 항목을 미완료 위로 등) 빈 배열 = 막는다.
export function reorder(
  items: Item[],
  dragId: string,
  targetId: string
): { id: string; sort_order: number }[] {
  const drag = items.find((item) => item.id === dragId)
  const target = items.find((item) => item.id === targetId)
  if (!drag || !target || dragId === targetId || drag.is_completed !== target.is_completed)
    return []
  const group = sortItems(items, 'manual').filter((item) => item.is_completed === drag.is_completed)
  const from = group.findIndex((item) => item.id === dragId)
  const to = group.findIndex((item) => item.id === targetId)
  group.splice(to, 0, ...group.splice(from, 1))
  return group
    .map((item, i) => ({ item, sort_order: i + 1 }))
    .filter(({ item, sort_order }) => item.sort_order !== sort_order)
    .map(({ item, sort_order }) => ({ id: item.id, sort_order }))
}

export function useItems(): UseItems {
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)

  // 타이핑마다 요청을 보내지 않으려고 content write만 디바운스한다.
  const pending = useRef<Record<string, string>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const load = useCallback(async (): Promise<void> => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setItems(data)
  }, [])

  // 남의 행은 RLS가 막아주므로 필터를 걸지 않는다.
  // (user_id 필터를 걸면 user_id가 없는 DELETE 페이로드가 전부 탈락한다.)
  useEffect(() => {
    const channel = supabase
      .channel('items')
      .on<Item>('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) =>
        setItems((prev) => applyChange(prev, payload, pending.current))
      )
      // 재연결 뒤에도 SUBSCRIBED가 다시 오므로, 끊긴 동안 놓친 변경은 이 refetch가 메꾼다.
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void load()
      })
    return () => void supabase.removeChannel(channel)
  }, [load])

  const save = useCallback(async (id: string): Promise<void> => {
    const content = pending.current[id]
    if (content === undefined) return
    delete pending.current[id]
    clearTimeout(timers.current[id])
    const { error } = await supabase.from('items').update({ content }).eq('id', id)
    if (error) setError(error.message)
  }, [])

  const flush = useCallback((): void => {
    Object.keys(pending.current).forEach((id) => void save(id))
  }, [save])

  // 창을 닫거나 화면을 벗어날 때 미저장 입력을 흘리지 않게.
  useEffect(() => flush, [flush])

  const create = useCallback(
    async (content = '', isTask = false, category: string | null = null): Promise<Item | null> => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        setError('세션이 없다. 로그인이 필요하다.')
        return null
      }
      const { data, error } = await supabase
        .from('items')
        .insert({ user_id: user.id, content, is_task: isTask, category })
        .select()
        .single()
      if (error) {
        setError(error.message)
        return null
      }
      setItems((prev) => [data, ...prev])
      return data
    },
    []
  )

  const update = useCallback(
    (id: string, content: string): void => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, content } : item)))
      pending.current[id] = content
      clearTimeout(timers.current[id])
      timers.current[id] = setTimeout(() => void save(id), 500)
    },
    [save]
  )

  // 체크박스는 디바운스하지 않는다. 클릭은 타이핑처럼 연달아 오지 않는다.
  const setFlags = useCallback(async (id: string, flags: ItemFlags): Promise<void> => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...flags } : item)))
    const { error } = await supabase.from('items').update(flags).eq('id', id)
    if (error) setError(error.message)
  }, [])

  const remove = useCallback(async (id: string): Promise<void> => {
    delete pending.current[id]
    clearTimeout(timers.current[id])
    setItems((prev) => prev.filter((item) => item.id !== id))
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) setError(error.message)
  }, [])

  // 드래그 중에는 화면에서만 실시간으로 옮기고(move), 놓았을 때 한 번에 저장한다(commitOrder).
  // origin은 드래그 시작 시점의 sort_order라서 취소(cancelOrder) 때 되돌린다.
  const origin = useRef<Record<string, number> | null>(null)

  const move = useCallback(
    (dragId: string, targetId: string): void => {
      const changes = reorder(items, dragId, targetId)
      if (!changes.length) return
      origin.current ??= Object.fromEntries(items.map((item) => [item.id, item.sort_order]))
      const order = Object.fromEntries(changes.map((c) => [c.id, c.sort_order]))
      setItems((prev) =>
        prev.map((item) => (item.id in order ? { ...item, sort_order: order[item.id] } : item))
      )
    },
    [items]
  )

  const commitOrder = useCallback((): void => {
    const start = origin.current
    origin.current = null
    if (!start) return
    const changed = items.filter((item) => start[item.id] !== item.sort_order)
    void Promise.all(
      changed.map((item) =>
        supabase.from('items').update({ sort_order: item.sort_order }).eq('id', item.id)
      )
    ).then((results) => {
      const failed = results.find((r) => r.error)
      if (failed?.error) setError(failed.error.message)
    })
  }, [items])

  const cancelOrder = useCallback((): void => {
    const start = origin.current
    origin.current = null
    if (start)
      setItems((prev) =>
        prev.map((item) => (item.id in start ? { ...item, sort_order: start[item.id] } : item))
      )
  }, [])

  return { items, error, create, update, setFlags, remove, move, commitOrder, cancelOrder, flush }
}
