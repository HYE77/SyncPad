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
      className={`shrink-0 rounded border px-2.5 py-1 text-xs ${
        active
          ? 'border-term-accent text-term-accent'
          : 'border-term-line text-term-dim hover:text-term-fg'
      }`}
    >
      {name ? `#${name}` : 'ALL'}
    </button>
  )
}
