import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { platformLabel, sessionIdFromToken } from './deviceSessions'

type DeviceSession = {
  id: string
  user_agent: string | null
}

export function Devices({ accessToken }: { accessToken: string }): React.JSX.Element {
  const [sessions, setSessions] = useState<DeviceSession[] | null>(null)
  const [hasError, setHasError] = useState(false)
  const currentId = sessionIdFromToken(accessToken)

  // public.my_sessions()는 supabase/schema.sql에 있다. 본인 세션만 돌려준다.
  useEffect(() => {
    void supabase.rpc('my_sessions').then(({ data, error }) => {
      if (error) setHasError(true)
      else setSessions(data as DeviceSession[])
    })
  }, [])

  return (
    <section className="p-4">
      <h2 className="mb-3 text-sm text-term-dim">로그인된 기기</h2>
      <div className="rounded border border-term-line bg-term-surface">
        {hasError && (
          <p className="px-4 py-3 text-xs text-red-300">기기 목록을 불러오지 못했습니다.</p>
        )}
        {!hasError && !sessions && (
          <p className="px-4 py-3 text-xs text-term-faint">불러오는 중…</p>
        )}
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
