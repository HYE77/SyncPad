import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App(): React.JSX.Element {
  const { electron, chrome, node } = window.electron.process.versions

  // ponytail: 연결 확인용 임시 표시. #5 로그인 붙으면 지운다.
  const [db, setDb] = useState('connecting…')
  useEffect(() => {
    supabase
      .from('items')
      .select('id')
      .limit(1)
      .then(({ error }) => setDb(error ? `db error: ${error.message}` : 'db ok'))
  }, [])

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-2xl">
        <span className="text-term-accent">$</span> SyncPad
      </h1>
      <p className="text-sm text-term-dim">
        electron {electron} · chromium {chrome} · node {node}
      </p>
      <p className="text-sm text-term-dim">{db}</p>
    </main>
  )
}

export default App
