import { Login } from './features/auth/Login'
import { useSession } from './features/auth/useSession'
import { Items } from './features/items/Items'

export function App(): React.JSX.Element | null {
  const session = useSession()
  if (session === undefined) return null
  return session ? <Items /> : <Login />
}
