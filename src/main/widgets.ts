import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { instanceLabel } from '../shared/labels'
import type {
  AlignAction,
  DiceSettings,
  EqualizerSettings,
  MoveModifiers,
  MusicSettings,
  Position,
  SimsSettings,
  Size,
  TarotSettings,
  TodoSettings,
  WidgetInstance
} from '../shared/types'
import { WIDGET_META } from '../shared/types'
import { resolveTargetDisplay } from './displays'
import type { Store } from './store'
import type { NativeLayer } from './window-layer'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

function overlaps(a: Rect, b: Rect, gap = 0): boolean {
  return (
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y
  )
}

function rectDistance(rect: Rect, x: number, y: number, w: number, h: number): number {
  const dx = Math.max(rect.x - (x + w), x - (rect.x + rect.width), 0)
  const dy = Math.max(rect.y - (y + h), y - (rect.y + rect.height), 0)
  return dx * dx + dy * dy
}

export class WidgetManager {
  private wins = new Map<string, BrowserWindow>()
  private layoutWins = new Map<number, BrowserWindow>()
  private layoutRestoreLocks = new Map<string, boolean>()
  private gridHidden = false
  private moveTimers = new Map<string, NodeJS.Timeout>()
  private suppressMove = new Set<string>()
  private quitting = false

  constructor(
    private readonly store: Store,
    private readonly onChange: () => void,
    private readonly nativeLayer?: NativeLayer
  ) {}

  setQuitting(): void {
    this.quitting = true
  }

  syncAll(): void {
    const ids = new Set(this.store.state.widgets.map((widget) => widget.id))
    for (const id of [...this.wins.keys()]) {
      if (!ids.has(id)) this.destroy(id)
    }
    for (const widget of this.store.state.widgets) this.sync(widget.id)
  }

  sync(id: string): void {
    const instance = this.store.get(id)
    if (!instance || !instance.enabled) {
      this.destroy(id)
      return
    }
    const existing = this.get(id)
    const win = existing ?? this.create(instance)
    this.apply(win, instance)
    if (instance.type === 'equalizer') this.applyEqualizerDock(id, win, instance)
  }

  get(id: string): BrowserWindow | undefined {
    const win = this.wins.get(id)
    return win && !win.isDestroyed() ? win : undefined
  }

  bounds(id: string): Electron.Rectangle | null {
    const win = this.get(id)
    return win ? win.getBounds() : null
  }

  private create(instance: WidgetInstance): BrowserWindow {
    const size = this.windowSize(instance)
    const pos = this.resolvePosition(instance, size)

    const win = new BrowserWindow({
      x: pos.x,
      y: pos.y,
      width: size.width,
      height: size.height,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      backgroundMaterial: 'none',
      resizable: false,
      movable: true,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      hasShadow: false,
      roundedCorners: false,
      show: false,
      acceptFirstMouse: true,
      title: `TAS Widget — ${WIDGET_META[instance.type].title}`,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        sandbox: false,
        spellcheck: false,
        backgroundThrottling: false
      }
    })

    win.setMenu(null)
    win.setBackgroundColor('#00000000')
    // Убираем серую нативную рамку DWM, которая проступает у прозрачных
    // click-through окон на Windows 11.
    this.nativeLayer?.removeBorder(win)
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    win.webContents.on('will-navigate', (event) => event.preventDefault())

    win.on('move', () => this.schedulePositionSave(instance.id, win))
    win.on('moved', () => this.savePosition(instance.id, win))

    win.once('ready-to-show', () => {
      const current = this.store.get(instance.id)
      if (current?.enabled) {
        win.showInactive()
        win.setBackgroundColor('#00000000')
        // На Windows всегда-на-верху нужно применять после показа окна:
        // до первого show флаг может быть потерян.
        this.apply(win, this.store.get(instance.id) ?? current)
        // Рамку DWM убираем после показа и включения click-through: если
        // сделать это до show, Windows может вернуть её при смене стилей.
        this.scheduleBorderCleanup(win)
      }
    })

    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl) {
      void win.loadURL(`${devUrl}/#${instance.id}`)
    } else {
      void win.loadFile(join(__dirname, '../renderer/index.html'), { hash: instance.id })
    }

    win.on('closed', () => this.wins.delete(instance.id))
    this.wins.set(instance.id, win)
    return win
  }

  /**
   * DWM восстанавливает рамку при первом показе окна и смене click-through,
   * поэтому снимаем её сразу и повторно в первые секунды после показа.
   */
  private scheduleBorderCleanup(win: BrowserWindow): void {
    if (!this.nativeLayer) return
    this.nativeLayer.removeBorder(win)
    for (const delay of [450, 1400, 3000]) {
      setTimeout(() => {
        if (!win.isDestroyed()) this.nativeLayer?.removeBorder(win)
      }, delay)
    }
  }

  private windowSize(instance: WidgetInstance): Size {
    return instance.manualSize ?? instance.contentSize ?? WIDGET_META[instance.type].defaultSize
  }

  private schedulePositionSave(id: string, win: BrowserWindow): void {
    if (this.suppressMove.has(id)) return
    const prev = this.moveTimers.get(id)
    if (prev) clearTimeout(prev)
    this.moveTimers.set(
      id,
      setTimeout(() => {
        this.moveTimers.delete(id)
        this.savePosition(id, win)
        this.keepInside(id, win)
      }, 320)
    )
  }

  private savePosition(id: string, win: BrowserWindow): void {
    if (this.suppressMove.has(id) || win.isDestroyed() || this.quitting) return
    const bounds = win.getBounds()
    this.store.move(id, bounds.x, bounds.y)
  }

  private keepInside(id: string, win: BrowserWindow): void {
    if (this.suppressMove.has(id) || win.isDestroyed()) return
    const instance = this.store.get(id)
    // Заблокированный виджет жёстко остаётся на своём месте и мониторе,
    // даже если после изменения контента часть окна выходит за край.
    if (instance?.locked) return
    const bounds = win.getBounds()
    const clamped = this.clampToDisplay(bounds.x, bounds.y, bounds.width, bounds.height)
    if (clamped.x !== bounds.x || clamped.y !== bounds.y) {
      this.suppressMove.add(id)
      win.setBounds({ ...bounds, x: clamped.x, y: clamped.y })
      this.suppressMove.delete(id)
      this.store.move(id, clamped.x, clamped.y)
    }
  }

  private clampToDisplay(x: number, y: number, width: number, height: number): Position {
    const displays = screen.getAllDisplays().map((display) => display.workArea)
    if (displays.length === 0) return { x, y }
    let best = displays[0]
    let bestDistance = Number.POSITIVE_INFINITY
    for (const rect of displays) {
      const distance = rectDistance(rect, x, y, width, height)
      if (distance < bestDistance) {
        bestDistance = distance
        best = rect
      }
    }
    const maxX = best.x + Math.max(0, best.width - width)
    const maxY = best.y + Math.max(0, best.height - height)
    return {
      x: Math.round(Math.min(Math.max(x, best.x), maxX)),
      y: Math.round(Math.min(Math.max(y, best.y), maxY))
    }
  }

  private displayForRect(x: number, y: number, width: number, height: number): Electron.Rectangle {
    const displays = screen.getAllDisplays().map((display) => display.workArea)
    if (displays.length === 0) return { x: 0, y: 0, width, height }
    let best = displays[0]
    let bestDistance = Number.POSITIVE_INFINITY
    for (const rect of displays) {
      const distance = rectDistance(rect, x, y, width, height)
      if (distance < bestDistance) {
        bestDistance = distance
        best = rect
      }
    }
    return best
  }

  /** Сетка, магнит к краям и центрам других виджетов. */
  private snapForLayout(
    id: string,
    bounds: Electron.Rectangle,
    modifiers: MoveModifiers
  ): Position {
    const general = this.store.state.general
    if (!general.layoutMode || modifiers.alt) {
      return { x: bounds.x, y: bounds.y }
    }
    const wa = this.displayForRect(bounds.x, bounds.y, bounds.width, bounds.height)
    const step = Math.max(4, Math.round(general.grid.step || 16))
    let x = bounds.x
    let y = bounds.y
    const guideX: number[] = []
    const guideY: number[] = []

    if (modifiers.ctrl && general.grid.snapEdges) {
      const threshold = 16
      const others = this.occupiedRects(id)
      const xCandidates: Array<{ value: number; kind: 'start' | 'end' | 'center' }> = [
        { value: wa.x, kind: 'start' },
        { value: wa.x + wa.width, kind: 'end' },
        { value: wa.x + wa.width / 2, kind: 'center' }
      ]
      const yCandidates: Array<{ value: number; kind: 'start' | 'end' | 'center' }> = [
        { value: wa.y, kind: 'start' },
        { value: wa.y + wa.height, kind: 'end' },
        { value: wa.y + wa.height / 2, kind: 'center' }
      ]
      for (const rect of others) {
        xCandidates.push(
          { value: rect.x, kind: 'start' },
          { value: rect.x + rect.width, kind: 'end' },
          { value: rect.x + rect.width / 2, kind: 'center' }
        )
        yCandidates.push(
          { value: rect.y, kind: 'start' },
          { value: rect.y + rect.height, kind: 'end' },
          { value: rect.y + rect.height / 2, kind: 'center' }
        )
      }

      let bestX: { delta: number; line: number } | null = null
      for (const candidate of xCandidates) {
        const own =
          candidate.kind === 'start'
            ? x
            : candidate.kind === 'end'
              ? x + bounds.width
              : x + bounds.width / 2
        const delta = candidate.value - own
        if (Math.abs(delta) <= threshold && (!bestX || Math.abs(delta) < Math.abs(bestX.delta))) {
          bestX = { delta, line: candidate.value }
        }
      }
      if (bestX) {
        x = Math.round(x + bestX.delta)
        if (modifiers.shift) x += bestX.delta >= 0 ? step : -step
        guideX.push(bestX.line)
      }

      let bestY: { delta: number; line: number } | null = null
      for (const candidate of yCandidates) {
        const own =
          candidate.kind === 'start'
            ? y
            : candidate.kind === 'end'
              ? y + bounds.height
              : y + bounds.height / 2
        const delta = candidate.value - own
        if (Math.abs(delta) <= threshold && (!bestY || Math.abs(delta) < Math.abs(bestY.delta))) {
          bestY = { delta, line: candidate.value }
        }
      }
      if (bestY) {
        y = Math.round(y + bestY.delta)
        if (modifiers.shift) y += bestY.delta >= 0 ? step : -step
        guideY.push(bestY.line)
      }
    } else if (general.grid.enabled) {
      x = wa.x + Math.round((x - wa.x) / step) * step
      y = wa.y + Math.round((y - wa.y) / step) * step
    }

    this.broadcastGuides(guideX, guideY)
    const clamped = this.clampToDisplay(x, y, bounds.width, bounds.height)
    return { x: Math.round(clamped.x), y: Math.round(clamped.y) }
  }

  private broadcastGuides(xs: number[], ys: number[]): void {
    for (const win of this.layoutWins.values()) {
      if (!win.isDestroyed()) win.webContents.send('layout:guides', { xs, ys })
    }
  }

  private createLayoutOverlays(): void {
    for (const display of screen.getAllDisplays()) {
      const existing = this.layoutWins.get(display.id)
      if (existing && !existing.isDestroyed()) {
        existing.setBounds(display.bounds)
        continue
      }
      const win = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        backgroundMaterial: 'none',
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        skipTaskbar: true,
        focusable: false,
        hasShadow: false,
        show: false,
        webPreferences: {
          contextIsolation: true,
          sandbox: true,
          backgroundThrottling: false
        }
      })
      win.setIgnoreMouseEvents(true, { forward: true })
      win.setAlwaysOnTop(true)
      this.nativeLayer?.removeBorder(win)
      const step = this.store.state.general.grid.step
      const devUrl = process.env['ELECTRON_RENDERER_URL']
      if (devUrl) {
        void win.loadURL(`${devUrl}/grid.html#${display.id}?step=${step}`)
      } else {
        void win.loadFile(join(__dirname, '../renderer/grid.html'), {
          hash: `${display.id}?step=${step}`
        })
      }
      win.once('ready-to-show', () => {
        if (this.store.state.general.layoutMode) win.showInactive()
        this.scheduleBorderCleanup(win)
      })
      win.on('closed', () => this.layoutWins.delete(display.id))
      this.layoutWins.set(display.id, win)
    }
  }

  private destroyLayoutOverlays(): void {
    for (const win of this.layoutWins.values()) {
      if (!win.isDestroyed()) win.destroy()
    }
    this.layoutWins.clear()
  }

  setLayoutMode(enabled: boolean): void {
    if (enabled) {
      this.gridHidden = false
      this.layoutRestoreLocks.clear()
      for (const widget of this.store.state.widgets) {
        this.layoutRestoreLocks.set(widget.id, widget.locked)
      }
      this.store.setLockedAll(false)
      if (this.store.state.general.grid.showGrid && !this.gridHidden) this.createLayoutOverlays()
      for (const widget of this.store.state.widgets) {
        const win = this.get(widget.id)
        if (win) this.nativeLayer?.setTopmost(win, true)
      }
    } else {
      this.destroyLayoutOverlays()
      for (const widget of this.store.state.widgets) {
        const previous = this.layoutRestoreLocks.get(widget.id)
        if (typeof previous === 'boolean') widget.locked = previous
      }
      this.layoutRestoreLocks.clear()
      this.store.scheduleSave()
    }
    for (const widget of this.store.state.widgets) this.sync(widget.id)
    this.onChange()
  }

  /** Пересоздаёт оверлеи, если в режиме раскладки поменяли шаг/видимость сетки. */
  syncLayout(): void {
    if (!this.store.state.general.layoutMode) {
      this.destroyLayoutOverlays()
      return
    }
    if (this.store.state.general.grid.showGrid && !this.gridHidden) {
      this.destroyLayoutOverlays()
      this.createLayoutOverlays()
    } else {
      this.destroyLayoutOverlays()
    }
    for (const widget of this.store.state.widgets) this.sync(widget.id)
  }

  moveWidgetBy(id: string, dx: number, dy: number, _modifiers: MoveModifiers): void {
    if (!this.store.state.general.layoutMode) return
    const win = this.get(id)
    if (!win) return
    this.moveWindowBy(id, dx, dy)
  }

  moveWindowBy(id: string, dx: number, dy: number): void {
    const win = this.get(id)
    if (!win || win.isDestroyed()) return
    const bounds = win.getBounds()
    const x = Math.round(bounds.x + dx)
    const y = Math.round(bounds.y + dy)
    const clamped = this.clampToDisplay(x, y, bounds.width, bounds.height)
    this.suppressMove.add(id)
    win.setBounds({ x: clamped.x, y: clamped.y, width: bounds.width, height: bounds.height })
    this.suppressMove.delete(id)
    this.store.move(id, clamped.x, clamped.y)
  }

  /** Смещение без ограничения рабочей областью: компенсация полей/свечения. */
  offsetWindowBy(id: string, dx: number, dy: number): void {
    const win = this.get(id)
    if (!win || win.isDestroyed()) return
    const bounds = win.getBounds()
    this.suppressMove.add(id)
    win.setBounds({
      x: Math.round(bounds.x + dx),
      y: Math.round(bounds.y + dy),
      width: bounds.width,
      height: bounds.height
    })
    this.suppressMove.delete(id)
    this.store.move(id, bounds.x + dx, bounds.y + dy)
  }

  selectLayoutWidget(id: string | null): void {
    this.store.updateGeneral({ layoutFocusId: id })
    if (id) this.get(id)?.focus()
    this.onChange()
  }

  /** Сообщает виджетам, для какого из них открыты настройки. */
  setSettingsFocus(id: string | null): void {
    for (const widget of this.store.state.widgets) {
      const win = this.get(widget.id)
      if (win) win.webContents.send('settings:focus', widget.id === id ? widget.id : null)
    }
  }

  setArrowMove(enabled: boolean): void {
    this.store.updateGeneral({ arrowMove: enabled })
    this.onChange()
  }

  toggleGrid(): void {
    if (!this.store.state.general.layoutMode) return
    this.gridHidden = !this.gridHidden
    this.syncLayout()
  }

  alignWidget(id: string, action: AlignAction): void {
    const win = this.get(id)
    if (!win) return
    const bounds = win.getBounds()
    const instance = this.store.get(id)
    const chosen =
      instance?.type === 'equalizer' &&
      (instance.settings as EqualizerSettings).displayId != null
        ? screen
            .getAllDisplays()
            .find(
              (display) =>
                display.id === (instance.settings as EqualizerSettings).displayId
            )
        : null
    const wa = chosen?.workArea ?? this.displayForRect(bounds.x, bounds.y, bounds.width, bounds.height)
    const margin = 24
    let x = bounds.x
    let y = bounds.y
    switch (action) {
      case 'left':
        x = wa.x + margin
        break
      case 'right':
        x = wa.x + wa.width - bounds.width - margin
        break
      case 'centerX':
        x = wa.x + Math.round((wa.width - bounds.width) / 2)
        break
      case 'top':
        y = wa.y + margin
        break
      case 'bottom':
        y = wa.y + wa.height - bounds.height - margin
        break
      case 'centerY':
        y = wa.y + Math.round((wa.height - bounds.height) / 2)
        break
      case 'grid': {
        const step = Math.max(4, this.store.state.general.grid.step)
        x = wa.x + Math.round((x - wa.x) / step) * step
        y = wa.y + Math.round((y - wa.y) / step) * step
        break
      }
    }
    this.suppressMove.add(id)
    win.setBounds({ x, y, width: bounds.width, height: bounds.height })
    this.suppressMove.delete(id)
    this.store.move(id, x, y)
  }

  private resolvePosition(instance: WidgetInstance, size: Size): Position {
    if (instance.position) {
      return this.clampToDisplay(instance.position.x, instance.position.y, size.width, size.height)
    }
    return this.defaultPosition(instance, size)
  }

  private defaultPosition(instance: WidgetInstance, size: Size): Position {
    const display = resolveTargetDisplay(this.store.state.general.defaultDisplayId)
    const wa = display.workArea
    const firstOfType =
      this.store.state.widgets.filter((widget) => widget.type === instance.type)[0]?.id === instance.id

    if (firstOfType) {
      const top = wa.y + 48
      const left = wa.x + 56
      const slot: Record<string, Position> = {
        clock: { x: left, y: top },
        weekday: { x: left, y: wa.y + 214 },
        weather: { x: left, y: wa.y + 366 },
        music: { x: left, y: Math.min(wa.y + 610, wa.y + wa.height - size.height - 32) },
        calendar: { x: Math.max(wa.x + 16, wa.x + wa.width - size.width - 72), y: top }
      }
      const preferred = slot[instance.type]
      if (preferred) {
        const rect = { ...preferred, width: size.width, height: size.height }
        if (!this.occupiedRects(instance.id).some((other) => overlaps(rect, other, 8))) {
          return this.clampToDisplay(preferred.x, preferred.y, size.width, size.height)
        }
      }
    }

    return this.findFreeSpot(instance, size)
  }

  private occupiedRects(excludeId: string): Rect[] {
    const rects: Rect[] = []
    for (const widget of this.store.state.widgets) {
      if (widget.id === excludeId || !widget.enabled) continue
      const win = this.get(widget.id)
      if (win) {
        rects.push(win.getBounds())
      } else if (widget.position && widget.contentSize) {
        rects.push({ ...widget.position, ...widget.contentSize })
      }
    }
    return rects
  }

  private findFreeSpot(instance: WidgetInstance, size: Size): Position {
    const display = resolveTargetDisplay(this.store.state.general.defaultDisplayId)
    const wa = display.workArea
    const occupied = this.occupiedRects(instance.id)
    const step = 24
    const minX = wa.x + 24
    const minY = wa.y + 24
    const maxX = wa.x + wa.width - size.width - 16
    const maxY = wa.y + wa.height - size.height - 16

    for (let y = minY; y <= maxY; y += step) {
      for (let x = minX; x <= maxX; x += step) {
        const candidate = { x, y, width: size.width, height: size.height }
        if (!occupied.some((other) => overlaps(candidate, other, 8))) {
          return { x, y }
        }
      }
    }

    const count = this.store.state.widgets.length
    return this.clampToDisplay(
      minX + (count % 6) * 24,
      minY + (count % 6) * 24,
      size.width,
      size.height
    )
  }

  /** Применяет слой/прозрачность/режим кликов к окну. */
  apply(win: BrowserWindow, instance: WidgetInstance): void {
    if (win.isDestroyed()) return
    const interactive = this.isInteractive(instance)
    const nativeClickThrough = process.platform === 'win32' && Boolean(this.nativeLayer)
    if (interactive) {
      win.setIgnoreMouseEvents(false)
      if (nativeClickThrough) this.nativeLayer?.setClickThrough(win, false)
    } else if (nativeClickThrough) {
      // На Windows клики сквозь окно включаем без WS_EX_LAYERED: встроенный
      // setIgnoreMouseEvents добавляет layered-режим, и Windows 11 рисует
      // вокруг прозрачного окна серую рамку.
      this.nativeLayer?.setClickThrough(win, true)
    } else {
      win.setIgnoreMouseEvents(true)
    }

    // Слой применяем после click-through: нативный помощник снимает рамку DWM
    // уже после смены Z-порядка, иначе Windows рисует серый контур окна.
    const always = instance.layer === 'always'
    win.setAlwaysOnTop(always)
    this.nativeLayer?.setTopmost(win, always)
    if (process.platform === 'darwin') {
      win.setVisibleOnAllWorkspaces(always, { visibleOnFullScreen: true })
    }
    win.setTitle(`TAS Widget — ${instanceLabel(instance, this.store.state.widgets)}`)
  }

  isInteractive(instance: WidgetInstance): boolean {
    if (this.store.state.general.layoutMode) return true
    if (!instance.locked) return true
    if (instance.type === 'astro') return true
    if (instance.type === 'music') {
      return Boolean((instance.settings as MusicSettings).interactiveWhenLocked)
    }
    if (instance.type === 'tarot') {
      return Boolean((instance.settings as TarotSettings).interactiveWhenLocked)
    }
    if (instance.type === 'dice') {
      return Boolean((instance.settings as DiceSettings).interactiveWhenLocked)
    }
    if (instance.type === 'todo') {
      return Boolean((instance.settings as TodoSettings).interactiveWhenLocked)
    }
    if (instance.type === 'sims') {
      return Boolean((instance.settings as SimsSettings).interactiveWhenLocked)
    }
    return false
  }

  setContentSize(id: string, width: number, height: number): void {
    const instance = this.store.get(id)
    if (!instance) return
    const w = Math.min(2400, Math.max(40, Math.round(width)))
    const h = Math.min(1800, Math.max(40, Math.round(height)))
    this.store.setContentSize(id, w, h)
    if (instance.manualSize) return
    this.applyBounds(id, w, h)
  }

  setManualSize(id: string, size: Size | null): void {
    const instance = this.store.get(id)
    if (!instance) return
    if (size) {
      const clamped = {
        width: Math.min(1600, Math.max(120, Math.round(size.width))),
        height: Math.min(1200, Math.max(80, Math.round(size.height)))
      }
      this.store.setManualSize(id, clamped)
      this.applyBounds(id, clamped.width, clamped.height)
    } else {
      this.store.setManualSize(id, null)
      const fallback = instance.contentSize ?? WIDGET_META[instance.type].defaultSize
      this.applyBounds(id, fallback.width, fallback.height)
    }
    this.onChange()
  }

  alignEqualizer(id: string, edge: 'top' | 'bottom' | 'left' | 'right'): void {
    const win = this.get(id)
    const instance = this.store.get(id)
    if (!win || !instance) return
    const settings = instance.settings as EqualizerSettings
    const bounds = win.getBounds()
    const chosen =
      settings.displayId != null
        ? screen.getAllDisplays().find((display) => display.id === settings.displayId)
        : null
    const wa = chosen?.workArea ?? this.displayForRect(bounds.x, bounds.y, bounds.width, bounds.height)
    const margin = 12
    let x = bounds.x
    let y = bounds.y
    if (edge === 'top') {
      x = wa.x + Math.round((wa.width - bounds.width) / 2)
      y = wa.y + margin
    } else if (edge === 'bottom') {
      x = wa.x + Math.round((wa.width - bounds.width) / 2)
      y = wa.y + wa.height - bounds.height - margin
    } else if (edge === 'left') {
      x = wa.x + margin
      y = wa.y + Math.round((wa.height - bounds.height) / 2)
    } else {
      x = wa.x + wa.width - bounds.width - margin
      y = wa.y + Math.round((wa.height - bounds.height) / 2)
    }
    this.suppressMove.add(id)
    win.setBounds({ x, y, width: bounds.width, height: bounds.height })
    this.suppressMove.delete(id)
    this.store.move(id, x, y)
    this.onChange()
  }

  private applyEqualizerDock(id: string, win: BrowserWindow, instance: WidgetInstance): void {
    const settings = instance.settings as EqualizerSettings
    if (!settings.dock || settings.dock === 'free') return
    const bounds = win.getBounds()
    const chosen = settings.displayId == null
      ? null
      : screen.getAllDisplays().find((display) => display.id === settings.displayId)
    const targetDisplay =
      chosen ??
      screen.getDisplayMatching({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      })
    const wa = targetDisplay.workArea
    if (!chosen) {
      this.store.updateSettings(id, { displayId: targetDisplay.id })
      this.store.scheduleSave()
    }
    const thickness = Math.max(48, Math.min(360, Math.round(settings.dockThickness || 96)))
    let next: Electron.Rectangle
    if (settings.dock === 'bottom') {
      next = {
        x: wa.x,
        y: wa.y + wa.height - thickness,
        width: wa.width,
        height: thickness
      }
    } else if (settings.dock === 'top') {
      next = { x: wa.x, y: wa.y, width: wa.width, height: thickness }
    } else if (settings.dock === 'left') {
      next = { x: wa.x, y: wa.y, width: thickness, height: wa.height }
    } else {
      next = {
        x: wa.x + wa.width - thickness,
        y: wa.y,
        width: thickness,
        height: wa.height
      }
    }
    if (
      bounds.x === next.x &&
      bounds.y === next.y &&
      bounds.width === next.width &&
      bounds.height === next.height
    ) {
      return
    }
    this.store.setManualSize(id, { width: next.width, height: next.height })
    this.suppressMove.add(id)
    win.setBounds(next)
    this.suppressMove.delete(id)
    this.store.move(id, next.x, next.y)
    this.nativeLayer?.setTopmost(win, instance.layer === 'always')
  }

  private applyBounds(id: string, width: number, height: number): void {
    const win = this.get(id)
    if (!win) return
    const bounds = win.getBounds()
    if (Math.abs(bounds.width - width) < 2 && Math.abs(bounds.height - height) < 2) return
    this.suppressMove.add(id)
    win.setBounds({ x: bounds.x, y: bounds.y, width, height })
    this.suppressMove.delete(id)
    this.keepInside(id, win)
    const current = this.store.get(id)
    if (current) this.nativeLayer?.setTopmost(win, current.layer === 'always')
  }

  updateWidget(id: string, patch: Partial<WidgetInstance>): void {
    const moved = patch.position !== undefined
    this.store.update(id, patch)
    if (moved && patch.position) {
      const win = this.get(id)
      if (win) {
        const bounds = win.getBounds()
        this.suppressMove.add(id)
        win.setBounds({
          x: Math.round(patch.position.x),
          y: Math.round(patch.position.y),
          width: bounds.width,
          height: bounds.height
        })
        this.suppressMove.delete(id)
      }
    }
    this.sync(id)
    this.onChange()
  }

  setLocked(id: string, locked: boolean): void {
    const win = this.get(id)
    if (!win) {
      this.updateWidget(id, { locked })
      return
    }
    const display = screen.getDisplayMatching(win.getBounds())
    this.updateWidget(id, {
      locked,
      displayId: locked ? display.id : null
    })
  }

  setLockedAll(locked: boolean): void {
    for (const widget of this.store.state.widgets) this.setLocked(widget.id, locked)
  }

  setLayerAll(layer: 'always' | 'desktop'): void {
    this.store.setLayerAll(layer)
    for (const widget of this.store.state.widgets) this.sync(widget.id)
    this.onChange()
  }

  setAllEnabled(enabled: boolean): void {
    this.store.setAllEnabled(enabled)
    for (const widget of this.store.state.widgets) this.sync(widget.id)
    this.onChange()
  }

  resetPositions(): void {
    this.store.clearPositions()
    for (const widget of this.store.state.widgets) {
      widget.displayId = null
    }
    this.store.scheduleSave()
    for (const widget of this.store.state.widgets) {
      const size = this.windowSize(widget)
      const pos = this.defaultPosition(widget, size)
      this.store.move(widget.id, pos.x, pos.y)
      const win = this.get(widget.id)
      if (win) {
        this.suppressMove.add(widget.id)
        win.setBounds({ x: pos.x, y: pos.y, width: size.width, height: size.height })
        this.suppressMove.delete(widget.id)
        this.keepInside(widget.id, win)
      }
    }
    this.onChange()
  }

  reflow(): void {
    for (const widget of this.store.state.widgets) {
      const win = this.get(widget.id)
      if (win) this.keepInside(widget.id, win)
    }
    this.onChange()
  }

  destroy(id: string): void {
    const win = this.wins.get(id)
    if (!win) return
    this.wins.delete(id)
    if (!win.isDestroyed()) win.destroy()
  }

  destroyAll(): void {
    for (const id of [...this.wins.keys()]) this.destroy(id)
    this.destroyLayoutOverlays()
  }
}
