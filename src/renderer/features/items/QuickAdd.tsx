import { useState } from 'react'
import { TextInput } from '../../components/TextInput'
import { useSession } from '../auth/useSession'
import { firstLine, useItems } from './useItems'

// 팝업은 좁다. 최근 것만 보여주고 나머지는 본 창에서 본다.
const VISIBLE = 8

// App→Items와 같은 순서. 세션이 확인되기 전에 useItems를 붙이면
// 첫 조회가 RLS에 막혀 빈 목록으로 굳는다(다시 조회하지 않는다).
export function QuickAdd(): React.JSX.Element {
  const session = useSession()
  if (session === undefined) return <div />
  if (!session) {
    return <p className="p-4 text-sm text-term-dim">SyncPad 창에서 먼저 로그인하자.</p>
  }
  return <QuickList />
}

function QuickList(): React.JSX.Element {
  const { items, error, create, setFlags } = useItems()
  const [content, setContent] = useState('')
  const [isTask, setIsTask] = useState(false)

  async function submit(): Promise<void> {
    const text = content.trim()
    if (!text) return
    setContent('')
    if (!(await create(text, isTask))) setContent(text)
  }

  return (
    <div className="flex h-screen flex-col">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="flex items-center gap-2 border-b border-term-dim/30 px-3 py-2"
      >
        <TextInput
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
          placeholder="빠른 메모 (Enter)"
          aria-label="빠른 메모"
          className="min-w-0 flex-1"
        />
        <label className="flex shrink-0 items-center gap-1 text-xs text-term-dim">
          <input
            type="checkbox"
            checked={isTask}
            onChange={(e) => setIsTask(e.target.checked)}
            className="accent-term-accent"
          />
          할일
        </label>
      </form>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {items.slice(0, VISIBLE).map((item) => (
          <li key={item.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
            {item.is_task && (
              <input
                type="checkbox"
                checked={item.is_completed}
                onChange={(e) => void setFlags(item.id, { is_completed: e.target.checked })}
                aria-label={`${firstLine(item.content)} 완료`}
                className="accent-term-accent"
              />
            )}
            <span
              className={`truncate ${
                item.is_completed ? 'text-term-dim line-through' : 'text-term-fg'
              }`}
            >
              {firstLine(item.content)}
            </span>
          </li>
        ))}
      </ul>

      <p className="border-t border-term-dim/30 px-3 py-1 text-xs text-term-dim">Esc로 닫는다</p>
      {error && <p className="bg-red-950 px-3 py-1 text-xs text-red-300">{error}</p>}
    </div>
  )
}
