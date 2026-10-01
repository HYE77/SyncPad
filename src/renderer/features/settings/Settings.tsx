import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Button } from '../../components/Button'
import { ACCENTS, loadAccent, saveAccent } from './accent'

export function Settings({
  user,
  onClose
}: {
  user: User
  onClose: () => void
}): React.JSX.Element {
  const [accent, setAccent] = useState(loadAccent)

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
        <p className="text-sm">{user.email}</p>
        <p className="text-sm text-term-dim">
          {user.app_metadata.provider === 'google' ? 'Google' : '이메일'} 로그인
        </p>
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
