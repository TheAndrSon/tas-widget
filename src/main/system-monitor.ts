import os from 'node:os'
import type { DiskSample, SystemSample } from '../shared/types'

interface SystemInformation {
  fsSize(): Promise<Array<{ mount?: string; size?: number; used?: number }>>
}

export class SystemMonitor {
  private timer: NodeJS.Timeout | null = null
  private busy = false
  private last = { idle: 0, total: 0 }
  private si: SystemInformation | null = null
  private disks: DiskSample[] = []
  private disksAt = 0

  constructor(private readonly onSample: (sample: SystemSample) => void) {}

  start(intervalMs: number): void {
    this.stop()
    void this.tick()
    this.timer = setInterval(() => void this.tick(), intervalMs)
  }

  restart(intervalMs: number): void {
    this.start(intervalMs)
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  private cpuLoad(): number {
    const cpus = os.cpus()
    let idle = 0
    let total = 0
    for (const cpu of cpus) {
      idle += cpu.times.idle
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq
    }
    const idleDelta = idle - this.last.idle
    const totalDelta = total - this.last.total
    this.last = { idle, total }
    if (totalDelta <= 0) return 0
    return Math.min(100, Math.max(0, 100 - (idleDelta / totalDelta) * 100))
  }

  private async readDisks(): Promise<DiskSample[]> {
    try {
      if (!this.si) {
        const imported = (await import('systeminformation')) as unknown as {
          default?: SystemInformation
        } & SystemInformation
        this.si = imported.default ?? imported
      }
      const list = await this.si.fsSize()
      const seen = new Set<string>()
      const disks: DiskSample[] = []
      for (const item of list) {
        const mount = item.mount ?? ''
        if (!/^[A-Za-z]:/i.test(mount) || !item.size || item.size <= 0) continue
        if (seen.has(mount)) continue
        seen.add(mount)
        disks.push({ mount, size: item.size, used: item.used ?? 0 })
      }
      return disks.sort((a, b) => a.mount.localeCompare(b.mount))
    } catch {
      return []
    }
  }

  private async tick(): Promise<void> {
    if (this.busy) return
    this.busy = true
    try {
      const cpu = this.cpuLoad()
      const memTotal = os.totalmem()
      const memUsed = memTotal - os.freemem()
      if (Date.now() - this.disksAt > 15000) {
        this.disksAt = Date.now()
        this.disks = await this.readDisks()
      }
      this.onSample({ cpu, memUsed, memTotal, disks: this.disks, at: Date.now() })
    } finally {
      this.busy = false
    }
  }
}
