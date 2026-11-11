import { useEffect, useState, type JSX } from 'react'
import type { SystemResult, SystemSettings } from '@shared/types'

function fmtNet(value: number): string {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} МБ/с`
  if (value >= 1024) return `${(value / 1024).toFixed(0)} КБ/с`
  return `${Math.round(value)} Б/с`
}

export function SystemWidget({ settings }: { settings: SystemSettings }): JSX.Element {
  const [data, setData] = useState<SystemResult | null>(null)

  useEffect(() => {
    let alive = true
    const load = (): void => {
      void window.widgets.getSystem().then((result) => {
        if (alive) setData(result)
      })
    }
    load()
    const timer = window.setInterval(load, 2000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])

  const snapshot = data?.ok ? data.data : null
  const rows: Array<{ label: string; value: string; tone?: string }> = []
  if (settings.showCpu)
    rows.push({
      label: 'CPU',
      value: snapshot
        ? `${snapshot.cpu}%${snapshot.cpuTemp != null ? ` · ${snapshot.cpuTemp}°` : ''}`
        : '—'
    })
  if (settings.showRam)
    rows.push({
      label: 'RAM',
      value: snapshot
        ? `${(snapshot.ramUsed / 1024).toFixed(1)} / ${(snapshot.ramTotal / 1024).toFixed(0)} ГБ`
        : '—'
    })
  if (settings.showGpu)
    rows.push({
      label: 'GPU',
      value: snapshot?.gpu
        ? `${snapshot.gpuLoad == null ? '' : `${snapshot.gpuLoad}%`}${
            snapshot.gpuTemp != null ? ` · ${snapshot.gpuTemp}°` : ''
          }${snapshot.gpuLoad == null && snapshot.gpuTemp == null ? '' : ' · '}${snapshot.gpu}`
        : '—'
    })
  if (settings.showNetwork)
    rows.push({
      label: 'NET',
      value: snapshot ? `↓ ${fmtNet(snapshot.netRx)}  ↑ ${fmtNet(snapshot.netTx)}` : '—'
    })
  if (settings.showDisks)
    rows.push({
      label: 'DISK',
      value: snapshot
        ? snapshot.disks
            .map(
              (disk) =>
                `${disk.mount.replace(':', '')} ${Math.round((disk.used / Math.max(1, disk.size)) * 100)}%`
            )
            .join(' · ') || '—'
        : '—'
    })

  return (
    <div className={`sys${settings.orientation === 'vertical' ? ' is-vertical' : ''}`}>
      {rows.map((row) => (
        <div className="sys__row" key={row.label}>
          <span className="sys__label">{row.label}</span>
          <span className="sys__value">{row.value}</span>
        </div>
      ))}
      {!snapshot && (
        <div className="sys__empty">{data && !data.ok ? data.error : 'Сбор данных…'}</div>
      )}
    </div>
  )
}
