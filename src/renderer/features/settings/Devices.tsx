import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { supabase } from '../../lib/supabase'
import { formatLastActive, platformLabel, sessionIdFromToken } from './deviceSessions'

type DeviceSession = {
  id: string
  user_agent: string | null
  created_at: string
  last_active_at: string
}

export function Devices({ accessToken }: { accessToken: string }): React.JSX.Element {
  const [sessions, setSessions] = useState<DeviceSession[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const currentId = sessionIdFromToken(accessToken)

  // public.my_sessions()는 supabase/schema.sql에 있다. 본인 세션만 돌려준다.
  const load = useCallback(
    () =>
      supabase.rpc('my_sessions').then(({ data, error }) => {
        if (error) setError('기기 목록을 불러오지 못했습니다.')
        else setSessions(data as DeviceSession[])
      }),
    []
  )

  useEffect(() => {
    void load()
  }, [load])

  async function signOutOthers(): Promise<void> {
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    if (error) setError(error.message)
    else void load()
  }

  const hasOthers = sessions?.some(({ id }) => id !== currentId) ?? false

  return (
    <section className="p-4">
      <h2 className="mb-3 text-sm text-term-dim">로그인된 기기</h2>
      <div className="rounded border border-term-line bg-term-surface">
        {error && <p className="px-4 py-3 text-xs text-red-300">{error}</p>}
        {!error && !sessions && <p className="px-4 py-3 text-xs text-term-faint">불러오는 중…</p>}
        <ul>
          {sessions?.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 border-b border-term-line px-4 py-3 text-sm last:border-b-0"
            >
              <span>{platformLabel(s.user_agent)}</span>
              {s.id === currentId && (
                <span className="rounded border border-term-accent/50 px-1.5 text-xs text-term-accent">
                  이 기기
                </span>
              )}
              <span className="ml-auto text-xs text-term-dim">
                마지막 사용 {formatLastActive(s.last_active_at)}
              </span>
            </li>
          ))}
        </ul>
        {hasOthers && (
          <div className="flex border-t border-term-line px-4 py-2">
            <Button onClick={() => void signOutOthers()} className="ml-auto">
              다른 기기 모두 로그아웃
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
