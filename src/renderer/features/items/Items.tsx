import { useLayoutEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/Button'
import { CategoryTab } from '../../components/CategoryTab'
import { ItemRow } from '../../components/ItemRow'
import { TextInput } from '../../components/TextInput'
import { categoriesOf, nextFlags, sortItems, useItems, type SortKey } from './useItems'

export function Items({ onOpenSettings }: { onOpenSettings: () => void }): React.JSX.Element {
  const { items, error, create, update, setFlags, remove, move, commitOrder, cancelOrder, flush } =
    useItems()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('manual')
  const [dragId, setDragId] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const tops = useRef<Record<string, number>>({})
  const [showCompleted, setShowCompleted] = useState(
    () => localStorage.getItem('syncpad.showCompleted') !== 'false'
  )
  const [category, setCategory] = useState<string | null>(null)
  const categories = categoriesOf(items)
  // 고른 카테고리의 마지막 항목이 사라지면 탭도 사라진다. 빈 화면에 갇히지 않게 ALL로 돌린다.
  const active = category && categories.includes(category) ? category : null
  const q = query.trim().toLowerCase()
  const visible = sortItems(
    items.filter(
      (item) =>
        (active === null || item.category === active) &&
        (showCompleted || !item.is_completed) &&
        (!q || item.content.toLowerCase().includes(q))
    ),
    sort
  )

  // 행 위치가 바뀌면(드래그 재정렬, 완료로 내려감) 이전 자리에서 새 자리로 미끄러지게 한다 (FLIP).
  useLayoutEffect(() => {
    const next: Record<string, number> = {}
    listRef.current?.querySelectorAll<HTMLElement>('li[data-id]').forEach((el) => {
      const id = el.dataset.id!
      next[id] = el.offsetTop
      const delta = id in tops.current ? tops.current[id] - el.offsetTop : 0
      if (!delta) return
      el.style.transition = 'none'
      el.style.transform = `translateY(${delta}px)`
      void el.offsetHeight // 역전된 상태를 먼저 그리게 강제한다
      el.style.transition = 'transform 150ms ease-out'
      el.style.transform = ''
    })
    tops.current = next
  })

  async function addItem(): Promise<void> {
    const item = await create('', false, active)
    if (item) setEditingId(item.id)
  }

  return (
    <main className="flex h-screen flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-term-line px-4 py-3">
        <Button variant="ghost" tone="accent" onClick={() => void addItem()}>
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
          <option value="manual">내 순서</option>
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
        </select>
      </div>

      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-term-line px-4 py-2">
        {[null, ...categories].map((name) => (
          <CategoryTab
            key={name ?? 'ALL'}
            name={name}
            active={active === name}
            onClick={() => setCategory(name)}
          />
        ))}
        <button
          onClick={() => {
            localStorage.setItem('syncpad.showCompleted', String(!showCompleted))
            setShowCompleted(!showCompleted)
          }}
          aria-pressed={showCompleted}
          className="text-term-dim hover:text-term-fg ml-auto shrink-0 text-xs"
        >
          {showCompleted ? '완료 숨기기' : '완료 보기'}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <ul ref={listRef}>
          {visible.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              editing={editingId === item.id}
              // 순서는 sort_order로 저장되므로 '내 순서'일 때만 끌 수 있다.
              draggable={sort === 'manual' && !q}
              dragging={dragId === item.id}
              onDragStart={() => setDragId(item.id)}
              onDragEnd={() => {
                setDragId(null)
                cancelOrder() // 드롭 없이 끝났으면 되돌린다. 드롭했다면 이미 저장돼 no-op.
              }}
              // 같은 완료 그룹 안에서만 받는다. 지나가는 행 자리로 실시간으로 옮긴다.
              onDragEnter={() => dragId && move(dragId, item.id)}
              onDragOver={(e) => dragId && e.preventDefault()}
              onDrop={commitOrder}
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
        {/* 목록 아래 남는 공간 전체가 클릭 영역이다. */}
        <div onClick={() => void addItem()} aria-hidden className="min-h-8 flex-1" />
      </div>
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
