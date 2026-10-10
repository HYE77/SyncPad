import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/Button'
import { CategoryTab } from '../../components/CategoryTab'
import { ItemRow } from '../../components/ItemRow'
import { TextInput } from '../../components/TextInput'
import { categoriesOf, filterItems, nextFlags, sortItems, useItems, type SortKey } from './useItems'

// README "사용법" 표를 앱 안에 맞게 줄인 것. README를 고치면 여기도 맞춘다.
const HELP = [
  ['새 항목', '+ 새 항목, 또는 목록 아래 빈 곳 클릭'],
  ['수정', '줄을 클릭'],
  ['삭제', '줄을 왼쪽으로 밀기(트랙패드) → 삭제, 또는 줄 끝 ×'],
  ['메모 ↔ 할일', '줄 앞 마커 클릭: * 메모 → [ ] 할일 → [x] 완료'],
  ['순서 바꾸기', '"내 순서" 정렬에서 줄을 끌어다 놓기'],
  ['동기화', '다른 기기에서 같은 계정으로 로그인하면 자동'],
  ['퀵 액세스', '메뉴바(Windows는 트레이) 아이콘 클릭'],
  ['완전히 종료', '메뉴바/트레이 아이콘 우클릭 → 종료']
]

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
  const visible = sortItems(filterItems(items, active, showCompleted, query), sort)

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
    // 방금 만든 빈 항목이 아직 입력 중이면 또 만들지 않는다.
    if (items.some((item) => item.id === editingId && !item.content.trim())) return
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
              draggable={sort === 'manual' && !query.trim()}
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
        <div
          onMouseDown={(e) => e.preventDefault()} // 입력 중인 행이 blur로 지워지지 않게 포커스를 지킨다.
          onClick={() => void addItem()}
          aria-hidden
          className="min-h-8 flex-1"
        />
      </div>
      <datalist id="syncpad-categories">
        {categories.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="border-term-line text-term-faint flex shrink-0 border-t">
        {/* 네이티브 popover라 바깥 클릭·Esc 닫기를 브라우저가 처리한다. */}
        <Button popoverTarget="help" aria-label="사용법" title="사용법" className="px-3 py-2">
          ?
        </Button>
        <Button onClick={() => void supabase.auth.signOut()} className="ml-auto px-3 py-2">
          로그아웃
        </Button>
        {/* FE0E: 이모지가 아닌 텍스트 글리프로 그려 터미널 톤을 유지한다. */}
        <Button onClick={onOpenSettings} aria-label="설정" title="설정" className="px-3 py-2">
          {'⚙︎'}
        </Button>
      </div>
      <div
        id="help"
        popover="auto"
        className="border-term-line bg-term-surface text-term-fg m-auto rounded border p-4 text-xs backdrop:bg-black/50"
      >
        <h2 className="text-term-dim mb-3 text-sm">사용법</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
          {HELP.map(([what, how]) => (
            <Fragment key={what}>
              <dt className="text-term-faint">{what}</dt>
              <dd>{how}</dd>
            </Fragment>
          ))}
        </dl>
      </div>

      {error && (
        <p className="fixed inset-x-0 bottom-0 bg-red-950 px-4 py-1 text-xs text-red-300">
          {error}
        </p>
      )}
    </main>
  )
}
