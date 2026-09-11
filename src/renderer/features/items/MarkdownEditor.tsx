import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'

// oneDark의 배경/폰트만 벗겨서 터미널 테마(body) 위에 얹는다.
const transparent = EditorView.theme({
  '&, .cm-gutters': { backgroundColor: 'transparent' },
  '.cm-content': { fontFamily: 'inherit', padding: '1rem' },
  '&.cm-focused': { outline: 'none' }
})

type Props = {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
}

export function MarkdownEditor({ value, onChange, onBlur }: Props): React.JSX.Element {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      height="100%"
      className="min-h-0 flex-1 overflow-y-auto text-sm"
      autoFocus
      theme={oneDark}
      extensions={[markdown(), transparent, EditorView.lineWrapping]}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false
      }}
    />
  )
}
