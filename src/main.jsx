import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { useGameStore } from './store/gameStore.js'
import { ZONES } from './data/zones/index.js'

if (import.meta.env.DEV) {
  // Debug hooks only — never included in a production build.
  window.__gameStore = useGameStore
  window.__ZONES = ZONES
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
