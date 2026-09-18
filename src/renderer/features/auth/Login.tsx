import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/Button'
import { TextInput } from '../../components/TextInput'

// main/index.ts의 CALLBACK_PREFIX, Supabase 콘솔의 Redirect URLs와 같아야 한다.
const REDIRECT_TO = 'syncpad://auth/callback'

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

  async function signInWithGoogle(): Promise<void> {
    setBusy(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // 앱 창을 Google로 보내면 안 된다. URL만 받아서 외부 브라우저로 연다.
      options: { redirectTo: REDIRECT_TO, skipBrowserRedirect: true }
    })
    if (error) {
      setError(error.message)
      setBusy(false)
      return
    }
    // main의 setWindowOpenHandler가 shell.openExternal로 넘긴다.
    // busy는 콜백이 돌아올 때까지 유지한다 (브라우저에서 취소하면 새로고침으로 푼다).
    window.open(data.url)
  }

  // syncpad:// 콜백은 외부 브라우저 → main(open-url/second-instance) → 이 창으로 온다.
  useEffect(() => {
    const { ipcRenderer } = window.electron
    ipcRenderer.on('auth:callback', (_event, url: string) => {
      const params = new URL(url).searchParams
      const failed = params.get('error_description') ?? params.get('error')
      const code = params.get('code')
      if (failed || !code) {
        setError(failed ?? '로그인 응답에 code가 없다')
        setBusy(false)
        return
      }
      // PKCE verifier가 이 창의 localStorage에 있어서 교환도 여기서 해야 한다.
      void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError(error.message)
        setBusy(false)
      })
    })
    return () => ipcRenderer.removeAllListeners('auth:callback')
  }, [])

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
        <TextInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          placeholder="이메일"
          bordered
        />
        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="비밀번호"
          bordered
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={busy} variant="outline" tone="accent" className="flex-1">
            로그인
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => void submit('signUp')}
            variant="outline"
            tone="dim"
            className="flex-1"
          >
            가입
          </Button>
        </div>
        <Button
          type="button"
          disabled={busy}
          onClick={() => void signInWithGoogle()}
          variant="outline"
          tone="dim"
        >
          Google로 계속하기
        </Button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </main>
  )
}
