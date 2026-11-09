import { useRef, useState, type JSX, type PointerEvent as ReactPointerEvent } from 'react'
import type { ImageAsset, ImageCrop } from '@shared/types'
import { cropImageStyle, imageUrl } from '../style'

export function CropModal({
  asset,
  initial,
  aspect = 4 / 3,
  title = 'Кадрирование',
  onSave,
  onClose
}: {
  asset: ImageAsset
  initial: ImageCrop
  aspect?: number
  title?: string
  onSave: (crop: ImageCrop) => void
  onClose: () => void
}): JSX.Element {
  const [crop, setCrop] = useState<ImageCrop>({
    x: Math.min(100, Math.max(0, initial.x)),
    y: Math.min(100, Math.max(0, initial.y)),
    zoom: Math.min(3, Math.max(1, initial.zoom))
  })
  const frameRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; crop: ImageCrop } | null>(null)

  const start = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.screenX, y: event.screenY, crop }
  }
  const move = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current
    const frame = frameRef.current
    if (!drag || !frame) return
    const rect = frame.getBoundingClientRect()
    const dx = ((event.screenX - drag.x) / rect.width) * 100
    const dy = ((event.screenY - drag.y) / rect.height) * 100
    setCrop({
      ...drag.crop,
      x: Math.min(100, Math.max(0, drag.crop.x - dx)),
      y: Math.min(100, Math.max(0, drag.crop.y - dy))
    })
  }
  const end = (): void => {
    dragRef.current = null
  }

  return (
    <div className="crop-overlay">
      <div className="crop-panel">
        <div className="crop-head">
          <div>
            <div className="crop-title">{title}</div>
            <div className="crop-sub">{asset.name}</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} title="Закрыть">
            ×
          </button>
        </div>

        <div
          className="crop-frame"
          ref={frameRef}
          style={{ aspectRatio: String(aspect) }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <img src={imageUrl(asset.id)} style={cropImageStyle(crop)} alt="" draggable={false} />
          <div className="crop-grid" />
        </div>

        <div className="crop-zoom">
          <span>Масштаб</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={crop.zoom}
            onChange={(event) =>
              setCrop((previous) => ({ ...previous, zoom: Number(event.target.value) }))
            }
          />
          <span className="crop-zoom__value">{Math.round(crop.zoom * 100)}%</span>
          <button type="button" className="btn" onClick={() => setCrop({ x: 50, y: 50, zoom: 1 })}>
            Центр
          </button>
        </div>

        <div className="crop-actions">
          <span className="crop-hint">Перетаскивайте изображение и меняйте масштаб</span>
          <div className="btn-row">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="button" className="btn btn--primary" onClick={() => onSave(crop)}>
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
