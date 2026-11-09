import { createRoot } from 'react-dom/client'
import { SettingsApp } from './App'
import '../styles/tokens.css'
import './settings.css'

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(<SettingsApp />)
}
