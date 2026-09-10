import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

export type Item = {
  id: string
  content: string
  is_task: boolean
  is_completed: boolean
  created_at: string
  updated_at: string
}

// ponytail: #5 로그인 전까지 익명 세션으로 RLS(to authenticated)를 통과시킨다. #5 붙으면 지운다.
async function ensureSession(): Promise<void> {
  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    const { error } = await supabase.auth.signInAnonymously()
    if (error) throw error
  }
}

type UseItems = {
  items: Item[]
  error: string | null
  create: () => Promise<Item | null>
  update: (id: string, content: string) => void
  remove: (id: string) => Promise<void>
  flush: () => void
}

export function useItems(): UseItems {
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)

  // 타이핑마다 요청을 보내지 않으려고 content write만 디바운스한다.
  const pending = useRef<Record<string, string>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    void (async () => {
      try {
        await ensureSession()
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        setItems(data)
      } catch (e) {
        setError((e as Error).message)
      }
    })()
  }, [])

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

  const create = useCallback(async (): Promise<Item | null> => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      setError('세션이 없다. 로그인이 필요하다.')
      return null
    }
    const { data, error } = await supabase
      .from('items')
      .insert({ user_id: user.id, content: '' })
      .select()
      .single()
    if (error) {
      setError(error.message)
      return null
    }
    setItems((prev) => [data, ...prev])
    return data
  }, [])

  const update = useCallback(
    (id: string, content: string): void => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, content } : item)))
      pending.current[id] = content
      clearTimeout(timers.current[id])
      timers.current[id] = setTimeout(() => void save(id), 500)
    },
    [save]
  )

  const remove = useCallback(async (id: string): Promise<void> => {
    delete pending.current[id]
    clearTimeout(timers.current[id])
    setItems((prev) => prev.filter((item) => item.id !== id))
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) setError(error.message)
  }, [])

  return { items, error, create, update, remove, flush }
}
