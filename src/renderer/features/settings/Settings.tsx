import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Button } from '../../components/Button'
import { GoogleLogo } from '../../components/GoogleLogo'
import { supabase } from '../../lib/supabase'
import { ACCENTS, loadAccent, saveAccent } from './accent'

function formatDate(iso: string | undefined): string {
  return iso ? new Date(iso).toLocaleDateString('ko-KR') : '-'
}

export function Settings({
  user,
  onClose
}: {
  user: User
  onClose: () => void
}): React.JSX.Element {
  const [accent, setAccent] = useState(loadAccent)
  const isGoogle = user.app_metadata.provider === 'google'
  // Google은 이름을 주고, 이메일 가입은 이름이 없어 이메일 앞부분을 쓴다.
  const displayName: string = user.user_metadata.full_name ?? user.email?.split('@')[0] ?? ''

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center border-b border-term-dim/30 px-4 py-2 text-sm">
        <h1>설정</h1>
        <Button onClick={onClose} className="ml-auto">
          닫기
        </Button>
      </header>
      <section className="p-4">
        <h2 className="mb-3 text-sm text-term-dim">계정</h2>
        <div className="rounded border border-term-line bg-term-surface">
          <div className="flex items-center gap-3 p-4">
            {/* 프로필 사진은 CSP(img-src 'self')에 막혀 이니셜로 대신한다. */}
            <div
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-term-accent/15 text-term-accent"
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{displayName}</p>
              <p className="truncate text-xs text-term-dim">{user.email}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded border border-term-line px-2 py-1 text-xs text-term-dim">
              {isGoogle && <GoogleLogo />}
              {isGoogle ? 'Google' : '이메일'} 로그인
            </span>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 border-t border-term-line px-4 py-3 text-xs">
            <dt className="text-term-faint">가입일</dt>
            <dd className="text-term-dim">{formatDate(user.created_at)}</dd>
            <dt className="text-term-faint">마지막 로그인</dt>
            <dd className="text-term-dim">{formatDate(user.last_sign_in_at)}</dd>
          </dl>
          <div className="flex border-t border-term-line px-4 py-2">
            <Button onClick={() => void supabase.auth.signOut()} className="ml-auto">
              로그아웃
            </Button>
          </div>
        </div>
      </section>
      <section className="p-4">
        <h2 className="mb-3 text-sm text-term-dim">하이라이트 컬러</h2>
        <div className="flex gap-3">
          {ACCENTS.map(({ name, hex }) => (
            <button
              key={hex}
              onClick={() => {
                saveAccent(hex)
                setAccent(hex)
              }}
              aria-label={name}
              aria-pressed={accent === hex}
              title={name}
              style={{ backgroundColor: hex }}
              className={`size-8 rounded-full ring-offset-2 ring-offset-term-bg ${
                accent === hex ? 'ring-2 ring-term-fg' : ''
              }`}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
