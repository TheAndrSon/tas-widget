import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type PointerEvent as ReactPointerEvent
} from 'react'
import { instanceLabel } from '@shared/labels'
import type {
  AstroSettings,
  CalendarSettings,
  ClockSettings,
  DiceSettings,
  EqualizerSettings,
  FinanceSettings,
  ImageSlot,
  MusicSettings,
  SimsSettings,
  SystemSettings,
  TarotSettings,
  TodoSettings,
  TwitchSettings,
  WeatherSettings,
  WeekdaySettings,
  WidgetInstance
} from '@shared/types'
import { WIDGET_META } from '@shared/types'
import { useAppState } from '../hooks'
import {
  backgroundCss,
  cropImageStyle,
  frameImageStyle,
  frameLayerStyle,
  imageUrl,
  slotLayerStyle,
  styleVars
} from '../style'
import { CursorEffect } from './CursorEffect'
import { WeatherWidget } from './widgets/WeatherWidget'
import { MusicWidget } from './widgets/MusicWidget'
import { ClockWidget } from './widgets/ClockWidget'
import { WeekdayWidget } from './widgets/WeekdayWidget'
import { CalendarWidget } from './widgets/CalendarWidget'
import { AstroWidget } from './widgets/AstroWidget'
import { TarotWidget } from './widgets/TarotWidget'
import { DiceWidget } from './widgets/DiceWidget'
import { EqualizerWidget } from './widgets/EqualizerWidget'
import { TodoWidget } from './widgets/TodoWidget'
import { SimsWidget } from './widgets/SimsWidget'
import { FinanceWidget } from './widgets/FinanceWidget'
import { TwitchWidget } from './widgets/TwitchWidget'
import { SystemWidget } from './widgets/SystemWidget'
import { WeatherEffect } from './widgets/WeatherEffect'
import { WeatherAtmosphere } from './widgets/WeatherAtmosphere'
import { AmbientEffect } from './widgets/AmbientEffect'
import { Visualizer } from './widgets/Visualizer'
import { IconGear, IconLock, IconMove } from '../ui/icons'

function EditBar({ instance, label }: { instance: WidgetInstance; label: string }): JSX.Element {
  return (
    <div className="editbar">
      <span className="editbar__grip" aria-hidden="true" />
      <span className="editbar__title">{label}</span>
      <span className="editbar__spacer" />
      <button
        type="button"
        className="editbar__button editbar__button--move"
        title="Перетащить виджет"
      >
        <IconMove size={12} />
      </button>
      <button
        type="button"
        className="editbar__button"
        title="Настройки виджета"
        onClick={() => window.widgets.openSettings(instance.id)}
      >
        <IconGear size={12} />
      </button>
      <button
        type="button"
        className="editbar__button"
        title="Заблокировать (сделать некликабельным)"
        onClick={() => void window.widgets.setLocked(instance.id, true)}
      >
        <IconLock size={12} />
      </button>
    </div>
  )
}

function ImageLayer({
  slot,
  className
}: {
  slot: ImageSlot | null
  className: string
}): JSX.Element | null {
  if (!slot || !slot.imageId) return null
  return (
    <div className={`img-layer ${className}`} style={slotLayerStyle(slot)}>
      <img
        src={imageUrl(slot.imageId)}
        style={cropImageStyle(slot.crop)}
        alt=""
        draggable={false}
      />
    </div>
  )
}

function FrameLayer({ slot }: { slot: ImageSlot | null }): JSX.Element | null {
  if (!slot || !slot.imageId) return null
  return (
    <div className={`frame-layer ${slot.position}`} style={frameLayerStyle(slot)}>
      <img src={imageUrl(slot.imageId)} style={frameImageStyle()} alt="" draggable={false} />
    </div>
  )
}

export function WidgetApp({ instanceId }: { instanceId: string }): JSX.Element {
  const state = useAppState()
  const instance = state?.widgets.find((widget) => widget.id === instanceId)
  const stageRef = useRef<HTMLDivElement>(null)
  const minRef = useRef({ width: 0, height: 0 })
  const lastClamp = useRef('')
  const dragRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const layoutDrag = useRef<{ x: number; y: number } | null>(null)
  const lastSend = useRef(0)
  const lastContent = useRef({ width: 0, height: 0 })
  const [resizing, setResizing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sizeLabel, setSizeLabel] = useState('')
  const [framePad, setFramePad] = useState({ top: 30, right: 16, bottom: 16, left: 16 })
  const framePadRef = useRef({ top: 30, right: 16, bottom: 16, left: 16 })
  const padInitialized = useRef(false)

  const type = instance?.type
  const style = instance?.style
  const layoutMode = Boolean(state?.general.layoutMode)
  const unlocked = Boolean(instance && !instance.locked)
  const manual = instance?.manualSize ?? null
  const dockedEqualizer =
    instance?.type === 'equalizer' && (instance.settings as EqualizerSettings).dock !== 'free'
  const resizable = unlocked && !layoutMode && !dockedEqualizer && instance?.type !== 'equalizer'

  useEffect(() => {
    return window.widgets.onSettingsFocus((id) => setSettingsOpen(id === instanceId))
  }, [instanceId])

  useLayoutEffect(() => {
    const element = stageRef.current
    if (!element || !instance) return
    let queued = 0
    const run = (): void => {
      if (instance.manualSize) return
      if (instance.type === 'equalizer' && (instance.settings as EqualizerSettings).stretch) return
      const rect = element.getBoundingClientRect()
      const eqScale =
        instance.type === 'equalizer'
          ? Math.min(5, Math.max(0.5, Number((instance.settings as EqualizerSettings).scale) || 1))
          : 1
      const width = Math.ceil(rect.width / eqScale)
      const height = Math.ceil(rect.height / eqScale)
      if (width === lastContent.current.width && height === lastContent.current.height) return
      lastContent.current = { width, height }
      window.widgets.setContentSize(instance.id, width, height)
    }
    const send = (): void => {
      if (queued) return
      queued = requestAnimationFrame(() => {
        queued = 0
        run()
      })
    }
    const observer = new ResizeObserver(() => send())
    observer.observe(element)
    const frame = requestAnimationFrame(send)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      if (queued) cancelAnimationFrame(queued)
    }
  }, [
    instanceId,
    instance,
    instance?.scale,
    instance?.locked,
    instance?.manualSize,
    instance?.style
  ])

  // Минимальный размер: контент + запас на пару символов с каждой стороны.
  useLayoutEffect(() => {
    if (!instance) return
    if (instance.type === 'equalizer' && (instance.settings as EqualizerSettings).dock !== 'free') {
      return
    }
    const stage = stageRef.current
    if (!stage) return
    const content = stage.querySelector<HTMLElement>('.content')
    if (!content) return
    const contentRect = content.getBoundingClientRect()
    const shell = stage.querySelector<HTMLElement>('.shell')
    const computed = shell ? getComputedStyle(shell) : null
    const contentStyle = getComputedStyle(content)
    const scaledContentWidth = contentRect.width / Math.max(0.01, instance.scale)
    const scaledContentHeight = contentRect.height / Math.max(0.01, instance.scale)
    const padH = computed
      ? parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight)
      : 36
    const padV = computed
      ? parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom)
      : 32
    const fontSize = parseFloat(contentStyle.fontSize) || 12
    const charWidth = Math.max(7, fontSize * 0.62)
    const charHeight = Math.max(12, fontSize * 1.2)
    const scale = instance.scale
    const minWidth = Math.ceil((scaledContentWidth + padH + charWidth * 2 + 10) * scale + 10)
    const minHeight = Math.ceil((scaledContentHeight + padV + charHeight + 10) * scale + 10)
    minRef.current = { width: minWidth, height: minHeight }

    if (instance.manualSize) {
      if (instance.manualSize.width < minWidth - 1 || instance.manualSize.height < minHeight - 1) {
        const next = {
          width: Math.max(instance.manualSize.width, minWidth),
          height: Math.max(instance.manualSize.height, minHeight)
        }
        const key = `${next.width}x${next.height}`
        if (lastClamp.current !== key) {
          lastClamp.current = key
          window.widgets.setManualSize(instance.id, next)
        }
      }
    } else {
      lastClamp.current = ''
    }
  })

  // Рамка может выходить за карточку: увеличиваем прозрачные поля окна,
  // чтобы она не обрезалась краем окна.
  useLayoutEffect(() => {
    if (!style) return
    const stage = stageRef.current
    const shell = stage?.querySelector<HTMLElement>('.shell')
    const frames = stage?.querySelectorAll<HTMLElement>('.frame-layer') ?? []
    const glowPad = style.border.enabled
      ? Math.ceil(style.border.width * 2 + style.border.glowSize + style.border.glow * 16)
      : 0
    const base = {
      top: 30 + glowPad,
      right: 16 + glowPad,
      bottom: 16 + glowPad,
      left: 16 + glowPad
    }
    const applyPad = (next: typeof base): void => {
      const previous = framePadRef.current
      // При первом запуске окно уже сохранено с текущими полями: не сдвигаем его,
      // иначе виджеты с обводкой будут уезжать при каждом старте.
      if (
        padInitialized.current &&
        !instance.locked &&
        (previous.left !== next.left || previous.top !== next.top)
      ) {
        void window.widgets.offsetWindowBy(
          instance.id,
          previous.left - next.left,
          previous.top - next.top
        )
      }
      padInitialized.current = true
      framePadRef.current = next
      setFramePad((current) =>
        current.top === next.top &&
        current.right === next.right &&
        current.bottom === next.bottom &&
        current.left === next.left
          ? current
          : next
      )
    }
    if (!stage || !shell || frames.length === 0) {
      applyPad(base)
      return
    }
    const shellRect = shell.getBoundingClientRect()
    let left = 0
    let right = 0
    let top = 0
    let bottom = 0
    frames.forEach((frame) => {
      const rect = frame.getBoundingClientRect()
      left = Math.max(left, Math.ceil(shellRect.left - rect.left))
      right = Math.max(right, Math.ceil(rect.right - shellRect.right))
      top = Math.max(top, Math.ceil(shellRect.top - rect.top))
      bottom = Math.max(bottom, Math.ceil(rect.bottom - shellRect.bottom))
    })
    const next = {
      top: base.top + Math.max(0, top),
      right: base.right + Math.max(0, right),
      bottom: base.bottom + Math.max(0, bottom),
      left: base.left + Math.max(0, left)
    }
    applyPad(next)
  })

  const startResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!instance) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      x: event.screenX,
      y: event.screenY,
      w: instance.manualSize?.width ?? window.innerWidth,
      h: instance.manualSize?.height ?? window.innerHeight
    }
    setResizing(true)
  }

  const moveResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const start = dragRef.current
    if (!start || !instance) return
    const min = minRef.current
    const width = Math.max(min.width, Math.round(start.w + (event.screenX - start.x)))
    const height = Math.max(min.height, Math.round(start.h + (event.screenY - start.y)))
    setSizeLabel(`${width} × ${height}`)
    const now = performance.now()
    if (now - lastSend.current < 28) return
    lastSend.current = now
    window.widgets.setManualSize(instance.id, { width, height })
  }

  const endResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragRef.current) return
    dragRef.current = null
    setResizing(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* pointer уже отпущен */
    }
  }

  const startLayoutDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!instance || !layoutMode) return
    const target = event.target as HTMLElement
    if (target.closest('button, input, textarea, select, .no-drag, .todo__sticker')) return
    void window.widgets.selectLayoutWidget(instance.id)
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    layoutDrag.current = { x: event.screenX, y: event.screenY }
  }

  const moveLayoutDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const start = layoutDrag.current
    if (!start || !instance) return
    const dx = event.screenX - start.x
    const dy = event.screenY - start.y
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
    layoutDrag.current = { x: event.screenX, y: event.screenY }
    void window.widgets.moveWidgetBy(instance.id, dx, dy, {
      alt: event.altKey,
      ctrl: event.ctrlKey,
      shift: event.shiftKey
    })
  }

  const endLayoutDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!layoutDrag.current) return
    layoutDrag.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* pointer уже отпущен */
    }
  }

  useEffect(() => {
    if (!instance || !layoutMode || !state?.general.arrowMove) return
    if (state.general.layoutFocusId !== instance.id) return
    let repeat: number | null = null
    let delay: number | null = null
    const move = (dx: number, dy: number): void => {
      void window.widgets.moveWindowBy(instance.id, dx, dy)
    }
    const mapKey = (key: string): boolean =>
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select')) return
      const map: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1]
      }
      const delta = map[event.key]
      if (!delta) return
      event.preventDefault()
      if (repeat !== null) return
      move(delta[0], delta[1])
      delay = window.setTimeout(() => {
        repeat = window.setInterval(() => move(delta[0] * 3, delta[1] * 3), 28)
      }, 360)
    }
    const onKeyUp = (event: KeyboardEvent): void => {
      if (!mapKey(event.key)) return
      if (repeat !== null) window.clearInterval(repeat)
      if (delay !== null) window.clearTimeout(delay)
      repeat = null
      delay = null
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      if (repeat !== null) window.clearInterval(repeat)
      if (delay !== null) window.clearTimeout(delay)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [instance, layoutMode, state?.general.arrowMove, state?.general.layoutFocusId])

  if (!state || !instance || !type || !style) {
    return <div className="stage" ref={stageRef} />
  }

  const stageStyle: CSSProperties = { ...styleVars(style, type), zoom: instance.scale }
  stageStyle.paddingTop = framePad.top
  stageStyle.paddingRight = framePad.right
  stageStyle.paddingBottom = framePad.bottom
  stageStyle.paddingLeft = framePad.left
  if (manual) {
    stageStyle.width = manual.width / instance.scale
    stageStyle.height = manual.height / instance.scale
  }
  const eqSettings = type === 'equalizer' ? (instance.settings as EqualizerSettings) : null
  const eqFill =
    eqSettings !== null &&
    (eqSettings.stretch || (eqSettings.dock === 'free' && (Number(eqSettings.scale) || 1) !== 1))
  if (type === 'equalizer') stageStyle.boxSizing = 'border-box'
  if (eqFill) {
    stageStyle.paddingTop = 0
    stageStyle.paddingRight = 0
    stageStyle.paddingBottom = 0
    stageStyle.paddingLeft = 0
  }
  if (eqSettings && !manual && eqSettings.dock === 'free') {
    const eqScale = Math.min(5, Math.max(0.5, Number(eqSettings.scale) || 1))
    const base = instance.contentSize ?? WIDGET_META.equalizer.defaultSize
    stageStyle.width = Math.round(base.width * eqScale)
    stageStyle.height = Math.round(base.height * eqScale)
  }
  if (eqSettings?.stretch && !manual) {
    stageStyle.width = '100%'
    stageStyle.height = '100%'
  }

  const label = instanceLabel(instance, state.widgets)
  const musicSettings = instance.settings as MusicSettings
  const tarotSettings = instance.settings as TarotSettings
  const diceSettings = instance.settings as DiceSettings
  const todoSettings = instance.settings as TodoSettings
  const simsSettings = instance.settings as SimsSettings
  const musicInteractive = !instance.locked || Boolean(musicSettings.interactiveWhenLocked)
  const tarotInteractive = !instance.locked || Boolean(tarotSettings.interactiveWhenLocked)
  const diceInteractive = !instance.locked || Boolean(diceSettings.interactiveWhenLocked)
  const todoInteractive = !instance.locked || Boolean(todoSettings.interactiveWhenLocked)
  const simsInteractive = !instance.locked || Boolean(simsSettings.interactiveWhenLocked)

  const shellClass = [
    'shell',
    `shape-${style.shape}`,
    `align-${style.align.primary}`,
    style.windowless ? 'is-windowless' : '',
    unlocked && !layoutMode ? 'is-editing' : '',
    layoutMode ? 'is-layout' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div
        className={`stage${manual ? ' is-manual' : ''}${resizable ? ' is-resizable' : ''}${dockedEqualizer ? ' is-docked-eq' : ''}${eqFill ? ' is-eq-fill' : ''}${settingsOpen ? ' is-settings-open' : ''}${style.font.pattern !== 'none' ? ` is-text-pattern-${style.font.pattern}` : ''}${layoutMode && state.general.layoutFocusId === instance.id ? ' is-selected' : ''}`}
        ref={stageRef}
        style={stageStyle}
        data-widget-id={instance.id}
        onPointerDown={startLayoutDrag}
        onPointerMove={moveLayoutDrag}
        onPointerUp={endLayoutDrag}
        onPointerCancel={endLayoutDrag}
      >
        {unlocked && !layoutMode && <EditBar instance={instance} label={label} />}
        {layoutMode && <div className="layout-badge no-drag">раскладка · тяните карточку</div>}

        <div className={`shell-wrap shape-${style.shape}`}>
          {!style.windowless && (
            <FrameLayer slot={style.frame?.position === 'behind' ? style.frame : null} />
          )}

          <div className={shellClass}>
            {!style.windowless && (
              <>
                <div className="bg-base" style={backgroundCss(style)}>
                  {style.background.kind === 'image' && style.background.imageId && (
                    <img
                      src={imageUrl(style.background.imageId)}
                      style={cropImageStyle(style.background.crop)}
                      alt=""
                      draggable={false}
                    />
                  )}
                </div>
                <div className="bg-darken" />
                <div className="bg-texture" data-texture={style.texture} />
              </>
            )}

            {type === 'weather' && (instance.settings as WeatherSettings).atmosphere && (
              <WeatherAtmosphere settings={instance.settings as WeatherSettings} />
            )}
            {style.ambient.kind === 'weather' && type === 'weather' && (
              <WeatherEffect settings={instance.settings as WeatherSettings} />
            )}
            <AmbientEffect settings={style.ambient} />
            {type === 'music' && musicSettings.visualizer.mode !== 'off' && (
              <Visualizer settings={musicSettings.visualizer} className="music-visualizer" />
            )}

            <div className="content" style={{ zoom: style.fontScale }}>
              {type === 'weather' && (
                <WeatherWidget
                  settings={instance.settings as WeatherSettings}
                  instanceId={instance.id}
                />
              )}
              {type === 'music' && (
                <MusicWidget settings={musicSettings} interactive={musicInteractive} />
              )}
              {type === 'clock' && <ClockWidget settings={instance.settings as ClockSettings} />}
              {type === 'weekday' && (
                <WeekdayWidget settings={instance.settings as WeekdaySettings} />
              )}
              {type === 'calendar' && (
                <CalendarWidget
                  settings={instance.settings as CalendarSettings}
                  unlocked={unlocked}
                />
              )}
              {type === 'astro' && (
                <AstroWidget
                  settings={instance.settings as AstroSettings}
                  instanceId={instance.id}
                />
              )}
              {type === 'tarot' && (
                <TarotWidget
                  settings={tarotSettings}
                  interactive={tarotInteractive}
                  instanceId={instance.id}
                />
              )}
              {type === 'dice' && (
                <DiceWidget
                  settings={diceSettings}
                  interactive={diceInteractive}
                  instanceId={instance.id}
                />
              )}
              {type === 'equalizer' && (
                <EqualizerWidget settings={instance.settings as EqualizerSettings} />
              )}
              {type === 'todo' && (
                <TodoWidget
                  settings={todoSettings}
                  interactive={todoInteractive}
                  instanceId={instance.id}
                />
              )}
              {type === 'sims' && (
                <SimsWidget
                  settings={simsSettings}
                  interactive={simsInteractive}
                  instanceId={instance.id}
                />
              )}
              {type === 'finance' && (
                <FinanceWidget
                  settings={instance.settings as FinanceSettings}
                  instanceId={instance.id}
                />
              )}
              {type === 'twitch' && <TwitchWidget settings={instance.settings as TwitchSettings} />}
              {type === 'system' && <SystemWidget settings={instance.settings as SystemSettings} />}
            </div>
          </div>

          {unlocked && !layoutMode && <div className="edit-ring" />}

          {!style.windowless && (
            <FrameLayer slot={style.frame?.position === 'above' ? style.frame : null} />
          )}

          {style.border.enabled && !style.windowless && (
            <div
              className={`ring-layer${style.border.animated ? ' is-animated' : ''}`}
              data-border={style.border.style}
            >
              {style.border.style === 'fireflies' &&
                [0, 1, 2, 3, 4].map((index) => <i key={index} />)}
            </div>
          )}
        </div>

        {resizable && (
          <div
            className={`resize-handle no-drag${resizing ? ' is-active' : ''}`}
            title="Потяните, чтобы изменить размер. Двойной клик — авторазмер"
            onPointerDown={startResize}
            onPointerMove={moveResize}
            onPointerUp={endResize}
            onPointerCancel={endResize}
            onDoubleClick={() => void window.widgets.setManualSize(instance.id, null)}
          >
            {resizing && sizeLabel && <span className="resize-badge">{sizeLabel}</span>}
          </div>
        )}
      </div>

      <div className="cursor-scope" style={styleVars(style, type)}>
        <CursorEffect effect={style.cursorEffect} />
      </div>
    </>
  )
}
