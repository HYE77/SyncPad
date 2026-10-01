import { useState } from 'react'
import { Login } from './features/auth/Login'
import { useSession } from './features/auth/useSession'
import { Items } from './features/items/Items'
import { Settings } from './features/settings/Settings'

export function App(): React.JSX.Element | null {
  const session = useSession()
  const [isSettings, setIsSettings] = useState(false)
  if (session === undefined) return null
  if (!session) return <Login />
  return (
    <>
      {/* 언마운트하지 않고 감춘다. Items를 다시 마운트하면 Realtime 재구독이
          소켓 재연결과 겹쳐 목록 조회가 걸린다. display:none이라 탭 순서에서도 빠진다. */}
      <div className={isSettings ? 'hidden' : ''}>
        <Items onOpenSettings={() => setIsSettings(true)} />
      </div>
      {isSettings && <Settings user={session.user} onClose={() => setIsSettings(false)} />}
    </>
  )
}
