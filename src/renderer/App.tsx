function App(): React.JSX.Element {
  const { electron, chrome, node } = window.electron.process.versions

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-2xl">
        <span className="text-term-accent">$</span> SyncPad
      </h1>
      <p className="text-sm text-term-dim">
        electron {electron} · chromium {chrome} · node {node}
      </p>
    </main>
  )
}

export default App
