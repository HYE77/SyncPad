import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { QuickAdd } from './features/items/QuickAdd'

// 트레이 팝업 창은 같은 renderer를 '#quick' 해시로 열어 화면만 갈라 쓴다 (main/tray.ts).
const isQuick = location.hash === '#quick'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isQuick ? <QuickAdd /> : <App />}</StrictMode>
)
