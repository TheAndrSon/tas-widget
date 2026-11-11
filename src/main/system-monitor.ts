import os from 'node:os'
import type { DiskSample, SystemSample } from '../shared/types'

interface SystemInformation {
  fsSize(): Promise<Array<{ mount?: string; size?: number; used?: number }>>
  graphics(): Promise<{
    controllers?: Array<{
      model?: string
      utilizationGpu?: number
      temperatureGpu?: number
      memoryUsed?: number
      vram?: number
    }>
  }>
  cpuTemperature(): Promise<{ main?: number; max?: number }>
}

export class SystemMonitor {
  private timer: NodeJS.Timeout | null = null
  private busy = false
  private last = { idle: 0, total: 0 }
  private si: SystemInformation | null = null
  private disks: DiskSample[] = []
  private disksAt = 0
  private gpu = {
    name: '',
    load: undefined as number | undefined,
    temp: undefined as number | undefined
  }
  private gpuAt = 0
  private cpuTemp: number | undefined
  private tempAt = 0

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

  private async info(): Promise<SystemInformation> {
    if (!this.si) {
      const imported = (await import('systeminformation')) as unknown as {
        default?: SystemInformation
      } & SystemInformation
      this.si = imported.default ?? imported
    }
    return this.si
  }

  private async readGpu(): Promise<void> {
    try {
      const si = await this.info()
      const data = await si.graphics()
      const list = data.controllers ?? []
      const controller = list.find(item => typeof item.utilizationGpu === 'number') ?? list[0]
      if (!controller) return
      this.gpu = {
        name: controller.model ?? '',
        load:
          typeof controller.utilizationGpu === 'number'
            ? Math.min(100, Math.max(0, controller.utilizationGpu))
            : undefined,
        temp:
          typeof controller.temperatureGpu === 'number'
            ? Math.round(controller.temperatureGpu)
            : undefined
      }
    } catch {
      // GPU может быть недоступен без драйвера/прав.
    }
  }

  private async readTemps(): Promise<void> {
    try {
      const si = await this.info()
      const temperatures = await si.cpuTemperature()
      this.cpuTemp =
        typeof temperatures.main === 'number' && temperatures.main > 0
          ? Math.round(temperatures.main)
          : undefined
    } catch {
      this.cpuTemp = undefined
    }
  }

  private async readDisks(): Promise<DiskSample[]> {
    try {
      const si = await this.info()
      const list = await si.fsSize()
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
      if (Date.now() - this.tempAt > 15000) {
        this.tempAt = Date.now()
        await this.readTemps()
      }
      if (Date.now() - this.gpuAt > 5000) {
        this.gpuAt = Date.now()
        await this.readGpu()
      }
      this.onSample({
        cpu,
        memUsed,
        memTotal,
        disks: this.disks,
        cpuTemp: this.cpuTemp,
        gpuName: this.gpu.name || undefined,
        gpuLoad: this.gpu.load,
        gpuTemp: this.gpu.temp,
        at: Date.now()
      })
    } finally {
      this.busy = false
    }
  }
}
