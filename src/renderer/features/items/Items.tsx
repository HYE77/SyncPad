import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useItems } from './useItems'

// 스키마에 title이 없다. 목록에는 첫 줄을 제목처럼 쓴다.
function firstLine(content: string): string {
  return content.split('\n', 1)[0].trim() || '(빈 메모)'
}

export function Items(): React.JSX.Element {
  const { items, error, create, update, setFlags, remove, flush } = useItems()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((item) => item.id === selectedId) ?? null

  return (
    <main className="flex h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-term-dim/30">
        <button
          onClick={async () => {
            const item = await create()
            if (item) setSelectedId(item.id)
          }}
          className="border-b border-term-dim/30 px-3 py-2 text-left text-sm text-term-accent hover:bg-white/5"
        >
          + 새 메모
        </button>
        <ul className="flex-1 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-2 pl-3 hover:bg-white/5 ${
                item.id === selectedId ? 'bg-white/10' : ''
              }`}
            >
              {item.is_task && (
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={(e) => void setFlags(item.id, { is_completed: e.target.checked })}
                  aria-label={`${firstLine(item.content)} 완료`}
                  className="accent-term-accent"
                />
              )}
              <button
                onClick={() => setSelectedId(item.id)}
                className={`flex-1 truncate py-2 pr-3 text-left text-sm ${
                  item.id === selectedId ? 'text-term-fg' : 'text-term-dim'
                } ${item.is_completed ? 'text-term-dim line-through' : ''}`}
              >
                {firstLine(item.content)}
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={() => void supabase.auth.signOut()}
          className="border-term-dim/30 text-term-dim border-t px-3 py-2 text-left text-sm hover:bg-white/5"
        >
          로그아웃
        </button>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <>
            <textarea
              key={selected.id}
              value={selected.content}
              onChange={(e) => update(selected.id, e.target.value)}
              onBlur={flush}
              spellCheck={false}
              autoFocus
              placeholder="마크다운으로 메모를 쓰자"
              className="flex-1 resize-none bg-transparent p-4 text-sm leading-relaxed outline-none select-text placeholder:text-term-dim"
            />
            <div className="flex items-center border-t border-term-dim/30 px-4 py-2 text-sm">
              <label className="flex items-center gap-2 text-term-dim">
                <input
                  type="checkbox"
                  checked={selected.is_task}
                  onChange={(e) =>
                    void setFlags(selected.id, {
                      is_task: e.target.checked,
                      is_completed: false
                    })
                  }
                  className="accent-term-accent"
                />
                할일
              </label>
              <button
                onClick={() => remove(selected.id)}
                className="ml-auto text-term-dim hover:text-red-400"
              >
                삭제
              </button>
            </div>
          </>
        ) : (
          <p className="m-auto text-sm text-term-dim">메모를 선택하거나 새로 만들자</p>
        )}
      </section>

      {error && (
        <p className="fixed inset-x-0 bottom-0 bg-red-950 px-4 py-1 text-xs text-red-300">
          {error}
        </p>
      )}
    </main>
  )
}
