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
  return isSettings ? (
    <Settings onClose={() => setIsSettings(false)} />
  ) : (
    <Items onOpenSettings={() => setIsSettings(true)} />
  )
}
