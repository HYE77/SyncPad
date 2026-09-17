import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export type Item = {
  id: string
  content: string
  is_task: boolean
  is_completed: boolean
  category: string | null
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

export type SortKey = 'newest' | 'oldest' | 'completed'

const newestFirst = (a: Item, b: Item): number =>
  Date.parse(b.created_at) - Date.parse(a.created_at)

// 완료여부는 미완료를 먼저 보여주고, 같은 그룹 안에서는 최신순.
export function sortItems(items: Item[], key: SortKey): Item[] {
  if (key === 'oldest') return [...items].sort((a, b) => newestFirst(b, a))
  if (key === 'completed')
    return [...items].sort(
      (a, b) => Number(a.is_completed) - Number(b.is_completed) || newestFirst(a, b)
    )
  return [...items].sort(newestFirst)
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

  return { items, error, create, update, setFlags, remove, flush }
}
