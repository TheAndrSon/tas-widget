import os from 'node:os'
import type { SystemResult, SystemSnapshot } from '../shared/types'

interface SystemInformation {
  graphics(): Promise<{ controllers?: Array<{ model?: string; utilizationGpu?: number }> }>
  networkStats(): Promise<Array<{ rx_sec?: number; tx_sec?: number; operstate?: string }>>
}

export class SystemMonitorService {
  private last = { at: Date.now(), idle: 0, total: 0 }
  private si: SystemInformation | null | undefined = undefined
  private gpuName: string | null = null
  private gpuLoad: number | null = null
  private cache: { at: number; data: SystemSnapshot } | null = null
  private gpuAt = 0
  private netAt = 0
  private netRx = 0
  private netTx = 0

  private async module(): Promise<SystemInformation | null> {
    if (this.si !== undefined) return this.si
    try {
      const imported = (await import('systeminformation')) as unknown as {
        default?: SystemInformation
      } & SystemInformation
      this.si = imported.default ?? imported
    } catch {
      this.si = null
    }
    return this.si
  }

  private cpuUsage(): number {
    const cpus = os.cpus()
    let idle = 0
    let total = 0
    for (const cpu of cpus) {
      idle += cpu.times.idle
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq
    }
    const idleDelta = idle - this.last.idle
    const totalDelta = total - this.last.total
    this.last = { at: Date.now(), idle, total }
    if (totalDelta <= 0) return 0
    return Math.min(100, Math.max(0, 100 - (idleDelta / totalDelta) * 100))
  }

  async get(): Promise<SystemResult> {
    try {
      if (this.cache && Date.now() - this.cache.at < 1500) {
        return { ok: true, data: this.cache.data }
      }
      const cpu = this.cpuUsage()
      const total = os.totalmem()
      const used = total - os.freemem()
      const si = await this.module()

      if (si && Date.now() - this.gpuAt > 8000) {
        this.gpuAt = Date.now()
        try {
          const graphics = await si.graphics()
          const controller = graphics.controllers?.[0]
          this.gpuName = controller?.model ?? null
          this.gpuLoad =
            typeof controller?.utilizationGpu === 'number' ? controller.utilizationGpu : null
        } catch {
          this.gpuName = null
          this.gpuLoad = null
        }
      }
      if (si && Date.now() - this.netAt > 2000) {
        this.netAt = Date.now()
        try {
          const stats = await si.networkStats()
          this.netRx = stats.reduce((sum, item) => sum + (item.rx_sec ?? 0), 0)
          this.netTx = stats.reduce((sum, item) => sum + (item.tx_sec ?? 0), 0)
        } catch {
          this.netRx = 0
          this.netTx = 0
        }
      }

      const data: SystemSnapshot = {
        cpu: Math.round(cpu),
        ramUsed: Math.round(used / 1024 / 1024),
        ramTotal: Math.round(total / 1024 / 1024),
        gpu: this.gpuName,
        gpuLoad: this.gpuLoad === null ? null : Math.round(this.gpuLoad),
        netRx: Math.round(this.netRx),
        netTx: Math.round(this.netTx),
        fetchedAt: Date.now()
      }
      this.cache = { at: Date.now(), data }
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
}
