import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { QuickAdd } from './features/items/QuickAdd'
import { applyAccent, loadAccent } from './features/settings/accent'

// 트레이 팝업 창은 같은 renderer를 '#quick' 해시로 열어 화면만 갈라 쓴다 (main/tray.ts).
const isQuick = location.hash === '#quick'

// 창마다(본 창, 트레이 팝업) 첫 렌더 전에 저장된 포인트 컬러를 입힌다.
applyAccent(loadAccent())
// 두 창은 localStorage를 공유한다. 다른 창에서 바꾸면 storage 이벤트가 오니 다시 입힌다.
addEventListener('storage', () => applyAccent(loadAccent()))

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isQuick ? <QuickAdd /> : <App />}</StrictMode>
)
