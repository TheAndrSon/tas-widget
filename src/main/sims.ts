import type { SimsState } from '../shared/types'
import type { Store } from './store'

export class SimsService {
  private timer: NodeJS.Timeout | null = null

  constructor(
    private readonly store: Store,
    private readonly onUpdate: (groups: Record<string, SimsState>) => void
  ) {}

  start(): void {
    this.stop()
    this.timer = setInterval(() => this.tick(), 15 * 60 * 1000)
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  tick(): Record<string, SimsState> {
    const groups = this.store.tickSims()
    this.onUpdate(groups)
    return groups
  }
}
