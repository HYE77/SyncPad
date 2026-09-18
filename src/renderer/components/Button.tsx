type Variant = 'ghost' | 'outline'
type Tone = 'accent' | 'dim'

// 화면들에 흩어져 있던 조합만큼만 표로 남긴다. 새 조합이 필요해지면 그때 추가한다.
const STYLES: Record<`${Variant}-${Tone}`, string> = {
  'ghost-dim': 'text-term-dim hover:text-term-fg',
  'ghost-accent': 'text-term-accent hover:text-term-fg',
  'outline-accent':
    'border-term-accent/50 text-term-accent border py-2 hover:bg-white/5 disabled:opacity-50',
  'outline-dim': 'border-term-line text-term-dim border py-2 hover:bg-white/5 disabled:opacity-50'
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  tone?: Tone
}

export function Button({
  variant = 'ghost',
  tone = 'dim',
  className = '',
  ...props
}: ButtonProps): React.JSX.Element {
  return <button className={`text-sm ${STYLES[`${variant}-${tone}`]} ${className}`} {...props} />
}
