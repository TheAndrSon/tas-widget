import { createRoot } from 'react-dom/client'
import { SimsMenu } from './SimsMenu'
import '../styles/tokens.css'
import './sims-menu.css'

const instanceId = decodeURIComponent(window.location.hash.replace(/^#/, ''))
const container = document.getElementById('root')
if (container) {
  createRoot(container).render(<SimsMenu instanceId={instanceId} />)
}
