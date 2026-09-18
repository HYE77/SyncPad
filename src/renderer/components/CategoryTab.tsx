export function CategoryTab({
  name,
  active,
  onClick
}: {
  name: string | null
  active: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 text-xs ${active ? 'text-term-accent' : 'text-term-dim hover:text-term-fg'}`}
    >
      {name ?? 'ALL'}
    </button>
  )
}
