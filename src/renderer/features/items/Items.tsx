import { useState } from 'react'
import { useItems } from './useItems'

// 스키마에 title이 없다. 목록에는 첫 줄을 제목처럼 쓴다.
function firstLine(content: string): string {
  return content.split('\n', 1)[0].trim() || '(빈 메모)'
}

export function Items(): React.JSX.Element {
  const { items, error, create, update, remove, flush } = useItems()
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
            <li key={item.id}>
              <button
                onClick={() => setSelectedId(item.id)}
                className={`w-full truncate px-3 py-2 text-left text-sm hover:bg-white/5 ${
                  item.id === selectedId ? 'bg-white/10 text-term-fg' : 'text-term-dim'
                }`}
              >
                {firstLine(item.content)}
              </button>
            </li>
          ))}
        </ul>
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
            <button
              onClick={() => remove(selected.id)}
              className="border-t border-term-dim/30 px-4 py-2 text-left text-sm text-term-dim hover:text-red-400"
            >
              삭제
            </button>
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
