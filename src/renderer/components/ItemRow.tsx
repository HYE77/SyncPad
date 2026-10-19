import { useRef, useState } from 'react'
import { firstLine, type Item } from '../features/items/useItems'

// 왼쪽으로 이만큼 밀면 삭제 버튼이 열린 채로 멈춘다.
const REVEAL_WIDTH = 64
// 카테고리 목록의 '새 카테고리' 값. 카테고리 이름은 trim해서 저장하므로 앞 공백 값과 겹치지 않는다.
const NEW_CATEGORY = ' new'

// 마커가 항목 종류를 겸한다. 클릭하면 nextFlags 순서로 순환한다.
function marker(item: Item): string {
  if (!item.is_task) return '*'
  return item.is_completed ? '[x]' : '[ ]'
}

export function ItemRow({
  item,
  categories,
  editing,
  draggable,
  dragging,
  onDragEnter,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onBlurRow,
  onToggleFlag,
  onStartEdit,
  onChangeContent,
  onChangeCategory,
  onDelete
}: {
  item: Item
  categories: string[]
  editing: boolean
  draggable: boolean
  dragging: boolean
  onDragEnter: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent<HTMLLIElement>) => void
  onDrop: () => void
  onBlurRow: (e: React.FocusEvent<HTMLLIElement>) => void
  onToggleFlag: () => void
  onStartEdit: () => void
  onChangeContent: (value: string) => void
  onChangeCategory: (value: string | null) => void
  onDelete: () => void
}): React.JSX.Element {
  // 트랙패드 두 손가락 가로 스와이프(wheel deltaX)만 받는다. 마우스 드래그는 순서 바꾸기(네이티브 DnD)가 쓴다.
  const [offset, setOffset] = useState(0)
  const settle = useRef<number>(undefined)
  const categoryRef = useRef<HTMLInputElement>(null)
  // '새 카테고리'로 편집에 들어오면 내용 대신 카테고리 입력에 포커스를 준다.
  const [isNewCategory, setIsNewCategory] = useState(false)

  function onWheel(e: React.WheelEvent): void {
    if (editing || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
    setOffset((o) => Math.min(REVEAL_WIDTH * 1.5, Math.max(0, o + e.deltaX)))
    // 관성 스크롤 이벤트까지 끝나면 열림/닫힘 중 가까운 쪽으로 붙인다.
    clearTimeout(settle.current)
    settle.current = window.setTimeout(
      () => setOffset((o) => (o > REVEAL_WIDTH / 2 ? REVEAL_WIDTH : 0)),
      120
    )
  }

  return (
    <li
      // textarea에 걸면 카테고리 입력을 누르는 순간 편집이 닫힌다. 행 밖으로 나갈 때만 닫는다.
      onBlur={onBlurRow}
      // 편집 중에는 textarea 드래그 선택과 겹치므로 끄지 않으면 텍스트 선택이 안 된다.
      draggable={draggable && !editing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-id={item.id}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onWheel={onWheel}
      onMouseLeave={() => setOffset(0)}
      // transform은 Items의 FLIP 애니메이션이 쓰므로 스와이프는 안쪽 div를 민다.
      className={`group relative overflow-hidden border-b border-term-line hover:bg-white/5 ${dragging ? 'opacity-40' : ''}`}
    >
      {offset > 0 && (
        <button
          onClick={onDelete}
          style={{ width: offset }}
          className="absolute inset-y-0 right-0 overflow-hidden bg-red-900 text-sm whitespace-nowrap text-red-200 transition-[width] duration-100"
        >
          삭제
        </button>
      )}
      <div
        style={{ transform: `translateX(${-offset}px)` }}
        // 열린 상태에서 줄을 누르면 편집 대신 닫기만 한다.
        onClickCapture={(e) => {
          if (!offset) return
          e.stopPropagation()
          setOffset(0)
        }}
        className="flex items-start gap-2.5 px-4 py-2 transition-transform duration-100"
      >
        <button
          onClick={onToggleFlag}
          aria-label={`${firstLine(item.content)} 마커 (${marker(item)})`}
          className="w-8 shrink-0 py-0.5 text-left font-mono text-sm text-term-accent"
        >
          {marker(item)}
        </button>
        {editing ? (
          <textarea
            autoFocus={!isNewCategory}
            // 편집 중에는 DOM이 원본이다. value로 묶으면 한글 조합 입력이
            // 리렌더마다 끊겨 커서가 튄다.
            defaultValue={item.content}
            onChange={(e) => onChangeContent(e.target.value)}
            // Enter는 작성 완료, 줄바꿈은 Shift+Enter. 한글 조합 중 Enter는 글자 확정이라 건드리지 않는다.
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
              e.preventDefault()
              e.currentTarget.blur()
            }}
            aria-label="항목 내용"
            // field-sizing으로 내용만큼만 늘린다. 높이 계산용 JS가 필요 없다.
            className="min-w-0 flex-1 resize-none bg-transparent py-0.5 text-sm break-words outline-none select-text [field-sizing:content]"
          />
        ) : (
          <button
            onClick={onStartEdit}
            className={`min-w-0 flex-1 py-0.5 text-left text-sm break-words whitespace-pre-wrap ${
              item.is_completed ? 'text-term-dim line-through' : 'text-term-fg'
            }`}
          >
            {item.content}
          </button>
        )}
        {editing ? (
          // datalist로 기존 카테고리를 고르고, 새 이름을 타이핑하면 그게 새 카테고리다.
          // 네이티브 ▾는 입력 오른쪽 끝에 붙고 옮길 수 없어서 숨기고, 앞에 직접 그린다.
          <div className="flex w-18 shrink-0 items-center gap-1.5 py-0.5 text-xs text-term-dim">
            <span
              aria-hidden
              // 누르는 순간 포커스가 빠지면 편집이 닫힌다. 포커스는 입력으로 직접 옮긴다.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                categoryRef.current?.focus()
                categoryRef.current?.showPicker()
              }}
              className="cursor-pointer select-none"
            >
              ▾
            </span>
            <input
              ref={categoryRef}
              autoFocus={isNewCategory}
              list="syncpad-categories"
              defaultValue={item.category ?? ''}
              // 목록에서 고르면(클릭, 방향키+Enter) 타이핑이 아닌 값 교체로 들어온다. 바로 확정한다.
              onInput={(e) => {
                const event = e.nativeEvent
                if (!(event instanceof InputEvent) || event.inputType === 'insertReplacementText')
                  e.currentTarget.blur()
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              onBlur={(e) => {
                setIsNewCategory(false)
                onChangeCategory(e.target.value.trim() || null)
              }}
              placeholder="카테고리"
              aria-label="항목 카테고리"
              // 목록 후보를 고를 때 Chromium이 !important로 흰 자동완성 배경을 칠한다.
              // transition은 그보다 우선하므로, 색 변화를 끝나지 않게 늦춰 원래 색을 유지한다.
              className="min-w-0 flex-1 bg-transparent transition-[background-color,color] duration-[1000000s] outline-none select-text placeholder:text-term-dim/50 [&::-webkit-calendar-picker-indicator]:hidden!"
            />
          </div>
        ) : (
          // 편집에 들어가지 않고 바로 고른다. 보이는 건 ▾ #카테고리이고, 그 위에 투명한 select를 덮어
          // 클릭 한 번에 네이티브 목록이 열리고 고르면 바로 바뀐다.
          <label
            className={`relative flex w-18 shrink-0 cursor-pointer items-center gap-1.5 py-0.5 text-xs ${
              item.category ? '' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
            }`}
          >
            <span aria-hidden className="text-term-dim">
              ▾
            </span>
            {item.category && <span className="truncate text-term-accent">#{item.category}</span>}
            <select
              value={item.category ?? ''}
              onChange={(e) => {
                if (e.target.value !== NEW_CATEGORY) return onChangeCategory(e.target.value || null)
                setIsNewCategory(true)
                onStartEdit()
              }}
              aria-label={`${firstLine(item.content)} 카테고리`}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="">카테고리 없음</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  #{name}
                </option>
              ))}
              <option value={NEW_CATEGORY}>+ 새 카테고리</option>
            </select>
          </label>
        )}
        <button
          onClick={onDelete}
          aria-label={`${firstLine(item.content)} 삭제`}
          className="shrink-0 py-0.5 text-sm text-term-dim opacity-0 group-hover:opacity-100 hover:text-red-400"
        >
          ×
        </button>
      </div>
    </li>
  )
}
