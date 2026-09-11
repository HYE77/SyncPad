import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../../lib/supabase'
import { MarkdownEditor } from './MarkdownEditor'
import { firstLine, sortItems, useItems, type SortKey } from './useItems'

export function Items(): React.JSX.Element {
  const { items, error, create, update, setFlags, remove, flush } = useItems()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  // 메모를 바꿔도 유지한다. 읽기 모드로 여러 메모를 훑을 때 편하다.
  const [isPreview, setIsPreview] = useState(false)
  // 선택은 목록 필터와 무관하게 유지한다. 검색 중에 편집하던 메모가 닫히면 곤란하다.
  const selected = items.find((item) => item.id === selectedId) ?? null
  const q = query.trim().toLowerCase()
  const visible = sortItems(
    q ? items.filter((item) => item.content.toLowerCase().includes(q)) : items,
    sort
  )

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
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색"
          aria-label="메모 검색"
          className="border-b border-term-dim/30 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-term-dim"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="정렬 기준"
          className="border-b border-term-dim/30 bg-term-bg px-3 py-2 text-sm text-term-dim outline-none"
        >
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
          <option value="completed">완료여부</option>
        </select>
        <ul className="flex-1 overflow-y-auto">
          {visible.map((item) => (
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
            {isPreview ? (
              <div className="md-preview min-h-0 flex-1 overflow-y-auto p-4 text-sm leading-relaxed select-text">
                <ReactMarkdown>{selected.content}</ReactMarkdown>
              </div>
            ) : (
              <MarkdownEditor
                key={selected.id}
                value={selected.content}
                onChange={(content) => update(selected.id, content)}
                onBlur={flush}
              />
            )}
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
                onClick={() => {
                  // 미리보기로 넘어가면 에디터가 사라져 onBlur가 안 온다.
                  if (!isPreview) flush()
                  setIsPreview(!isPreview)
                }}
                aria-pressed={isPreview}
                className="ml-4 text-term-dim hover:text-term-fg"
              >
                {isPreview ? '편집' : '미리보기'}
              </button>
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
