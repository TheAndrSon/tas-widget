import { createRoot } from 'react-dom/client'
import { WidgetApp } from './App'
import '../styles/tokens.css'
import './widget.css'

const instanceId = decodeURIComponent(window.location.hash.replace(/^#/, ''))

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(<WidgetApp instanceId={instanceId} />)
}
