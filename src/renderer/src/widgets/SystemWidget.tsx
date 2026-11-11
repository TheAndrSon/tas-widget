import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type { SystemSample } from '@shared/types'
import { useWidgetPlacement } from './useWidgetPlacement'
import { defaultWindowStyle } from '@shared/windowStyle'
import { WindowStyleLayers, windowStyleClass, windowStyleVars } from './WindowStyleLayers'
import './SystemWidget.css'

function bytes(value: number): string {
  const gb = value / 1024 ** 3
  return gb >= 100 ? `${Math.round(gb)} ГБ` : `${gb.toFixed(1)} ГБ`
}

function percent(used: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, (used / total) * 100))
}

interface MetricProps {
  label: string
  value: string
  fill: number
  tone: 'cpu' | 'ram' | 'gpu'
  title?: string
}

function Metric({ label, value, fill, tone, title }: MetricProps): ReactElement {
  return (
    <div className={`metric metric--${tone}`} title={title}>
      <div className="metric__row">
        <span className="metric__label">{label}</span>
        <span className="metric__value">{value}</span>
      </div>
      <div className="meter">
        <div className="meter__fill" style={{ width: `${fill.toFixed(1)}%` }} />
      </div>
    </div>
  )
}

export function SystemWidget(): ReactElement {
  const [sample, setSample] = useState<SystemSample | null>(null)
  const placement = useWidgetPlacement('system')
  const style = placement?.style ?? defaultWindowStyle()

  useEffect(() => window.api.onSystemSample(setSample), [])

  const cpu = sample?.cpu ?? 0
  const ram = sample ? percent(sample.memUsed, sample.memTotal) : 0
  const disks = (sample?.disks ?? []).slice(0, 3)
  const cpuTemp = sample?.cpuTemp
  const gpuLoad = sample?.gpuLoad
  const gpuTemp = sample?.gpuTemp

  return (
    <div
      className={`widget system${placement?.locked ? ' is-locked' : ''} ${windowStyleClass(style)}`}
      style={windowStyleVars(style)}
      onContextMenu={event => {
        event.preventDefault()
        void window.api.showContextMenu()
      }}
    >
      <WindowStyleLayers style={style} accent />
      <header className="system__head">
        <span className="system__title">Система</span>
        <span className={`system__live ${sample ? 'is-online' : ''}`}>
          {sample ? 'онлайн' : 'подключение'}
        </span>
      </header>

      <Metric
        label="ЦП"
        value={`${Math.round(cpu)}%${cpuTemp ? ` · ${cpuTemp}°` : ''}`}
        fill={cpu}
        tone="cpu"
        title={cpuTemp ? `Температура процессора: ${cpuTemp}°C` : undefined}
      />
      <Metric
        label="ОЗУ"
        value={`${bytes(sample?.memUsed ?? 0)} / ${bytes(sample?.memTotal ?? 0)}`}
        fill={ram}
        tone="ram"
      />
      {(sample?.gpuName || typeof gpuLoad === 'number') && (
        <Metric
          label="ГП"
          value={`${typeof gpuLoad === 'number' ? `${Math.round(gpuLoad)}%` : '—'}${
            gpuTemp ? ` · ${gpuTemp}°` : ''
          }`}
          fill={gpuLoad ?? 0}
          tone="gpu"
          title={sample?.gpuName || 'Видеокарта'}
        />
      )}

      <div className="system__disks">
        {disks.length === 0 && <span className="system__disk system__disk--muted">диски…</span>}
        {disks.map(disk => {
          const load = percent(disk.used, disk.size)
          return (
            <span
              className="system__disk"
              key={disk.mount}
              title={`${bytes(disk.used)} из ${bytes(disk.size)}`}
            >
              <span className="system__disk-name">{disk.mount.replace(':', '')}</span>
              <span className="system__disk-bar">
                <span style={{ width: `${load.toFixed(1)}%` }} />
              </span>
              <span className="system__disk-value">{Math.round(load)}%</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
