import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/Button'
import { CategoryTab } from '../../components/CategoryTab'
import { ItemRow } from '../../components/ItemRow'
import { TextInput } from '../../components/TextInput'
import { categoriesOf, nextFlags, sortItems, useItems, type SortKey } from './useItems'

export function Items({ onOpenSettings }: { onOpenSettings: () => void }): React.JSX.Element {
  const { items, error, create, update, setFlags, remove, flush } = useItems()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [category, setCategory] = useState<string | null>(null)
  const categories = categoriesOf(items)
  // 고른 카테고리의 마지막 항목이 사라지면 탭도 사라진다. 빈 화면에 갇히지 않게 ALL로 돌린다.
  const active = category && categories.includes(category) ? category : null
  const q = query.trim().toLowerCase()
  const visible = sortItems(
    items.filter(
      (item) =>
        (active === null || item.category === active) &&
        (!q || item.content.toLowerCase().includes(q))
    ),
    sort
  )

  return (
    <main className="flex h-screen flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-term-line px-4 py-3">
        <Button
          variant="ghost"
          tone="accent"
          onClick={async () => {
            const item = await create('', false, active)
            if (item) setEditingId(item.id)
          }}
        >
          + 새 항목
        </Button>
        <label className="border-term-line bg-term-surface2 flex min-w-0 flex-1 items-center gap-2 rounded-md border px-3 py-1.5">
          <span className="text-term-faint text-sm">$ grep</span>
          <TextInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색"
            aria-label="항목 검색"
            className="min-w-0 flex-1"
          />
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="정렬 기준"
          className="bg-term-bg text-term-dim shrink-0 text-sm outline-none"
        >
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
          <option value="completed">완료여부</option>
        </select>
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-term-line px-4 py-2">
        {[null, ...categories].map((name) => (
          <CategoryTab
            key={name ?? 'ALL'}
            name={name}
            active={active === name}
            onClick={() => setCategory(name)}
          />
        ))}
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {visible.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            editing={editingId === item.id}
            onBlurRow={(e) => {
              if (editingId !== item.id || e.currentTarget.contains(e.relatedTarget)) return
              setEditingId(null)
              // 빈 행은 남겨두면 목록만 지저분해진다.
              if (item.content.trim()) flush()
              else void remove(item.id)
            }}
            onToggleFlag={() => void setFlags(item.id, nextFlags(item))}
            onStartEdit={() => setEditingId(item.id)}
            onChangeContent={(value) => update(item.id, value)}
            onChangeCategory={(next) => {
              if (next !== item.category) void setFlags(item.id, { category: next })
            }}
            onDelete={() => void remove(item.id)}
          />
        ))}
      </ul>
      <datalist id="syncpad-categories">
        {categories.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="border-term-line text-term-faint flex shrink-0 border-t">
        <Button onClick={onOpenSettings} className="px-3 py-2">
          설정
        </Button>
        <Button onClick={() => void supabase.auth.signOut()} className="px-3 py-2">
          로그아웃
        </Button>
      </div>

      {error && (
        <p className="fixed inset-x-0 bottom-0 bg-red-950 px-4 py-1 text-xs text-red-300">
          {error}
        </p>
      )}
    </main>
  )
}
