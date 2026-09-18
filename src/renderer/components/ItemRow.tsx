import { firstLine, type Item } from '../features/items/useItems'

// 마커가 항목 종류를 겸한다. 클릭하면 nextFlags 순서로 순환한다.
function marker(item: Item): string {
  if (!item.is_task) return '-'
  return item.is_completed ? '[x]' : '[ ]'
}

export function ItemRow({
  item,
  editing,
  onBlurRow,
  onToggleFlag,
  onStartEdit,
  onChangeContent,
  onChangeCategory,
  onDelete
}: {
  item: Item
  editing: boolean
  onBlurRow: (e: React.FocusEvent<HTMLLIElement>) => void
  onToggleFlag: () => void
  onStartEdit: () => void
  onChangeContent: (value: string) => void
  onChangeCategory: (value: string | null) => void
  onDelete: () => void
}): React.JSX.Element {
  return (
    <li
      // textarea에 걸면 카테고리 입력을 누르는 순간 편집이 닫힌다. 행 밖으로 나갈 때만 닫는다.
      onBlur={onBlurRow}
      className="group flex items-start gap-2 px-3 py-1 hover:bg-white/5"
    >
      <button
        onClick={onToggleFlag}
        aria-label={`${firstLine(item.content)} 마커 (${marker(item)})`}
        className="shrink-0 py-0.5 font-mono text-sm text-term-accent"
      >
        {marker(item)}
      </button>
      {editing ? (
        <textarea
          autoFocus
          // 편집 중에는 DOM이 원본이다. value로 묶으면 한글 조합 입력이
          // 리렌더마다 끊겨 커서가 튄다.
          defaultValue={item.content}
          onChange={(e) => onChangeContent(e.target.value)}
          aria-label="항목 내용"
          // field-sizing으로 내용만큼만 늘린다. 높이 계산용 JS가 필요 없다.
          className="min-w-0 flex-1 resize-none bg-transparent py-0.5 text-sm outline-none select-text [field-sizing:content]"
        />
      ) : (
        <button
          onClick={onStartEdit}
          className={`min-w-0 flex-1 truncate py-0.5 text-left text-sm ${
            item.is_completed ? 'text-term-dim line-through' : 'text-term-fg'
          }`}
        >
          {firstLine(item.content)}
        </button>
      )}
      {editing ? (
        // datalist로 기존 카테고리를 고르고, 새 이름을 타이핑하면 그게 새 카테고리다.
        <input
          list="syncpad-categories"
          defaultValue={item.category ?? ''}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          onBlur={(e) => onChangeCategory(e.target.value.trim() || null)}
          placeholder="카테고리"
          aria-label="항목 카테고리"
          className="w-24 shrink-0 bg-transparent py-0.5 text-xs text-term-dim outline-none select-text placeholder:text-term-dim/50"
        />
      ) : (
        item.category && (
          <span className="shrink-0 py-0.5 text-xs text-term-dim">#{item.category}</span>
        )
      )}
      <button
        onClick={onDelete}
        aria-label={`${firstLine(item.content)} 삭제`}
        className="shrink-0 py-0.5 text-sm text-term-dim opacity-0 group-hover:opacity-100 hover:text-red-400"
      >
        ×
      </button>
    </li>
  )
}
