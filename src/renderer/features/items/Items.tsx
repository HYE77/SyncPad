import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { firstLine, nextFlags, sortItems, useItems, type Item, type SortKey } from './useItems'

// 마커가 항목 종류를 겸한다. 클릭하면 nextFlags 순서로 순환한다.
function marker(item: Item): string {
  if (!item.is_task) return '-'
  return item.is_completed ? '[x]' : '[ ]'
}

export function Items({ onOpenSettings }: { onOpenSettings: () => void }): React.JSX.Element {
  const { items, error, create, update, setFlags, remove, flush } = useItems()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const q = query.trim().toLowerCase()
  const visible = sortItems(
    q ? items.filter((item) => item.content.toLowerCase().includes(q)) : items,
    sort
  )

  return (
    <main className="flex h-screen flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-term-dim/30 px-3 py-2">
        <button
          onClick={async () => {
            const item = await create()
            if (item) setEditingId(item.id)
          }}
          className="text-sm text-term-accent hover:text-term-fg"
        >
          + 새 항목
        </button>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색"
          aria-label="항목 검색"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none select-text placeholder:text-term-dim"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="정렬 기준"
          className="shrink-0 bg-term-bg text-sm text-term-dim outline-none"
        >
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
          <option value="completed">완료여부</option>
        </select>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {visible.map((item) => (
          <li key={item.id} className="group flex items-start gap-2 px-3 py-1 hover:bg-white/5">
            <button
              onClick={() => void setFlags(item.id, nextFlags(item))}
              aria-label={`${firstLine(item.content)} 마커 (${marker(item)})`}
              className="shrink-0 py-0.5 font-mono text-sm text-term-accent"
            >
              {marker(item)}
            </button>
            {editingId === item.id ? (
              <textarea
                autoFocus
                value={item.content}
                onChange={(e) => update(item.id, e.target.value)}
                onBlur={() => {
                  setEditingId(null)
                  // 빈 행은 남겨두면 목록만 지저분해진다.
                  if (item.content.trim()) flush()
                  else void remove(item.id)
                }}
                aria-label="항목 내용"
                // field-sizing으로 내용만큼만 늘린다. 높이 계산용 JS가 필요 없다.
                className="min-w-0 flex-1 resize-none bg-transparent py-0.5 text-sm outline-none select-text [field-sizing:content]"
              />
            ) : (
              <button
                onClick={() => setEditingId(item.id)}
                className={`min-w-0 flex-1 truncate py-0.5 text-left text-sm ${
                  item.is_completed ? 'text-term-dim line-through' : 'text-term-fg'
                }`}
              >
                {firstLine(item.content)}
              </button>
            )}
            <button
              onClick={() => void remove(item.id)}
              aria-label={`${firstLine(item.content)} 삭제`}
              className="shrink-0 py-0.5 text-sm text-term-dim opacity-0 group-hover:opacity-100 hover:text-red-400"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="flex shrink-0 border-t border-term-dim/30">
        <button
          onClick={onOpenSettings}
          className="px-3 py-2 text-sm text-term-dim hover:bg-white/5 hover:text-term-fg"
        >
          설정
        </button>
        <button
          onClick={() => void supabase.auth.signOut()}
          className="px-3 py-2 text-sm text-term-dim hover:bg-white/5 hover:text-term-fg"
        >
          로그아웃
        </button>
      </div>

      {error && (
        <p className="fixed inset-x-0 bottom-0 bg-red-950 px-4 py-1 text-xs text-red-300">
          {error}
        </p>
      )}
    </main>
  )
}
