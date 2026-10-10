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

  // Enter는 저장하고 닫는다. 빈 칸이면 그냥 닫는다. 한글 조합 중 Enter는 폼 제출이 안 되므로
  // main의 before-input-event 대신 여기서 처리한다.
  async function submit(): Promise<void> {
    const text = content.trim()
    if (text) {
      setContent('')
      if (!(await create(text, isTask))) return setContent(text)
    }
    window.electron.ipcRenderer.send('popup:hide')
  }

  return (
    <div className="bg-term-surface flex h-screen flex-col">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="shrink-0 px-3.5 pt-3.5 pb-2.5"
      >
        <div className="border-term-accent bg-term-surface2 flex items-center gap-2 rounded-md border px-2.5 py-2">
          <span className="text-term-accent text-sm">&gt;</span>
          <TextInput
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
            placeholder="빠른 메모 (Enter)"
            aria-label="빠른 메모"
            className="min-w-0 flex-1"
          />
          <label className="text-term-dim flex shrink-0 items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={isTask}
              onChange={(e) => setIsTask(e.target.checked)}
              className="accent-term-accent"
            />
            할일
          </label>
        </div>
      </form>

      <p className="text-term-faint shrink-0 px-3.5 py-1.5 text-[11px] tracking-wide">
        -- recent --
      </p>
      <ul className="min-h-0 flex-1 overflow-y-auto px-3.5">
        {items.slice(0, VISIBLE).map((item) => (
          <li
            key={item.id}
            className="border-term-line flex items-baseline gap-2 border-b py-1.5 text-[12.5px]"
          >
            {item.is_task ? (
              <input
                type="checkbox"
                checked={item.is_completed}
                onChange={(e) => void setFlags(item.id, { is_completed: e.target.checked })}
                aria-label={`${firstLine(item.content)} 완료`}
                className="accent-term-accent"
              />
            ) : (
              <span className="text-term-accent">*</span>
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

      <p className="border-term-line text-term-faint shrink-0 border-t px-3.5 py-2 text-right text-[11px]">
        Enter/Esc로 닫기
      </p>
      {error && <p className="bg-red-950 px-3 py-1 text-xs text-red-300">{error}</p>}
    </div>
  )
}
