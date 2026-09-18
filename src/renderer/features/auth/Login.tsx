import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/Button'
import { TextInput } from '../../components/TextInput'

// main/index.ts의 CALLBACK_PREFIX, Supabase 콘솔의 Redirect URLs와 같아야 한다.
const REDIRECT_TO = 'syncpad://auth/callback'

// 브랜드 로고라 토큰 대신 Google 공식 색을 쓴다.
function GoogleLogo(): React.JSX.Element {
  return (
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z"
      />
    </svg>
  )
}

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
        className="flex w-80 flex-col gap-3"
      >
        <div className="mb-4 flex flex-col items-center gap-2">
          <h1 className="text-[28px] font-bold tracking-tight">&gt;_ SyncPad</h1>
          <p className="text-term-dim text-[12.5px]">terminal notes, synced everywhere</p>
        </div>
        <TextInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          placeholder="이메일"
          bordered
          className="bg-term-surface2 rounded-md"
        />
        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="비밀번호"
          bordered
          className="bg-term-surface2 rounded-md"
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={busy}
            variant="outline"
            tone="accent"
            className="flex-1 rounded-md"
          >
            로그인
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => void submit('signUp')}
            variant="outline"
            tone="dim"
            className="flex-1 rounded-md"
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
          className="flex items-center justify-center gap-2.5 rounded-md"
        >
          <GoogleLogo />[ continue with google ]
        </Button>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <p className="text-term-faint mt-2 text-center text-[11px]">
          Mac &amp; Windows · synced everywhere
        </p>
      </form>
    </main>
  )
}
