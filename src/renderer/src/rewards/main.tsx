import { createRoot } from 'react-dom/client'
import { Rewards } from './Rewards'
import '../styles/tokens.css'
import './rewards.css'

const groupId = decodeURIComponent(window.location.hash.replace(/^#/, '')) || 'default'
const container = document.getElementById('root')
if (container) {
  createRoot(container).render(<Rewards groupId={groupId} />)
}
