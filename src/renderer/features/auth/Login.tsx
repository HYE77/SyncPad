import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export function Login(): React.JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // 로그인/가입은 응답 모양이 같아서 한 핸들러로 처리한다.
  async function submit(mode: 'signIn' | 'signUp'): Promise<void> {
    setBusy(true)
    setError(null)
    const { error } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    // 성공하면 onAuthStateChange가 화면을 갈아끼우므로 여기서 할 일이 없다.
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <main className="flex h-screen items-center justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit('signIn')
        }}
        className="flex w-72 flex-col gap-3"
      >
        <h1 className="text-term-accent text-sm">SyncPad</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          placeholder="이메일"
          className="border-term-dim/30 placeholder:text-term-dim border bg-transparent px-3 py-2 text-sm outline-none select-text"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="비밀번호"
          className="border-term-dim/30 placeholder:text-term-dim border bg-transparent px-3 py-2 text-sm outline-none select-text"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="border-term-accent/50 text-term-accent flex-1 border py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            로그인
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit('signUp')}
            className="border-term-dim/30 text-term-dim flex-1 border py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            가입
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </main>
  )
}
