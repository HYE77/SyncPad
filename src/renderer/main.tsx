import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Items } from './features/items/Items'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Items />
  </StrictMode>
)
