type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  bordered?: boolean
}

export function TextInput({
  bordered = false,
  className = '',
  ...props
}: TextInputProps): React.JSX.Element {
  const border = bordered ? 'border-term-dim/30 border px-3 py-2' : ''
  return (
    <input
      className={`bg-transparent text-sm outline-none select-text placeholder:text-term-dim ${border} ${className}`}
      {...props}
    />
  )
}
