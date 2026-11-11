import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } from 'electron'
import { copyFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  AlignAction,
  DeepPartial,
  GeneralSettings,
  ImageAsset,
  MoveModifiers,
  RuntimeInfo,
  SettingsTab,
  SimsAction,
  SimsMood,
  Size,
  StylePreset,
  TarotDeck,
  WeatherProvider,
  WidgetInstance,
  WidgetSettings,
  WidgetStyle,
  WidgetType,
  ZodiacPack
} from '../shared/types'
import { WIDGET_TYPES } from '../shared/types'
import type { MusicService } from './music'
import type { SettingsWindow } from './settings-window'
import type { Store } from './store'
import type { TrayController } from './tray'
import type { WeatherService } from './weather'
import type { WidgetManager } from './widgets'
import type { FinanceService } from './finance'
import type { TwitchService } from './twitch'
import type { SystemMonitorService } from './system-monitor'
import type { SimsMenu } from './sims-menu'
import type { RewardsWindow } from './rewards-window'
import type { FontService } from './fonts'

export interface AppContext {
  store: Store
  widgets: WidgetManager
  settingsWindow: SettingsWindow
  weather: WeatherService
  music: MusicService
  finance: FinanceService
  twitch: TwitchService
  system: SystemMonitorService
  simsMenu: SimsMenu
  rewards: RewardsWindow
  fonts: FontService
  tray: TrayController
  refresh: () => void
  applyAutostart: (enabled: boolean) => void
  getHotkey: () => string
  getRuntime: () => RuntimeInfo
}

function isWidgetType(value: unknown): value is WidgetType {
  return typeof value === 'string' && (WIDGET_TYPES as string[]).includes(value)
}

export function registerIpc(ctx: AppContext): void {
  ipcMain.handle('state:get', () => ctx.store.state)

  ipcMain.handle('widget:update', (_event, id: unknown, patch: Partial<WidgetInstance>) => {
    if (typeof id !== 'string') return ctx.store.state
    ctx.widgets.updateWidget(id, patch ?? {})
    return ctx.store.state
  })

  ipcMain.handle(
    'widget:update-settings',
    (_event, id: unknown, patch: DeepPartial<WidgetSettings>) => {
      if (typeof id !== 'string') return ctx.store.state
      if (!ctx.store.updateSettings(id, (patch ?? {}) as Record<string, unknown>)) {
        return ctx.store.state
      }
      ctx.widgets.sync(id)
      ctx.refresh()
      return ctx.store.state
    }
  )

  ipcMain.handle('general:update', (_event, patch: Partial<GeneralSettings>) => {
    const safe = patch ?? {}
    if (typeof safe.autostart === 'boolean') {
      ctx.store.state.general.autostart = safe.autostart
      ctx.applyAutostart(safe.autostart)
    }
    ctx.store.updateGeneral(safe)
    if (typeof safe.layoutMode === 'boolean') {
      ctx.widgets.setLayoutMode(safe.layoutMode)
    } else if (ctx.store.state.general.layoutMode) {
      ctx.widgets.syncLayout()
    }
    ctx.refresh()
    return ctx.store.state
  })

  ipcMain.handle('layout:set', (_event, enabled: unknown) => {
    ctx.store.updateGeneral({ layoutMode: Boolean(enabled) })
    ctx.widgets.setLayoutMode(Boolean(enabled))
    ctx.refresh()
    return ctx.store.state
  })

  ipcMain.handle('layout:arrow-move', (_event, enabled: unknown) => {
    ctx.widgets.setArrowMove(Boolean(enabled))
    return ctx.store.state
  })

  ipcMain.handle('layout:select', (_event, id: unknown) => {
    ctx.widgets.selectLayoutWidget(typeof id === 'string' ? id : null)
    return ctx.store.state
  })

  ipcMain.handle('layout:toggle-grid', () => {
    ctx.widgets.toggleGrid()
    return ctx.store.state
  })

  ipcMain.handle('layout:align', (_event, id: unknown, action: unknown) => {
    if (typeof id === 'string') {
      ctx.widgets.alignWidget(id, action as AlignAction)
    }
    return ctx.store.state
  })

  ipcMain.handle(
    'layout:move',
    (_event, id: unknown, dx: unknown, dy: unknown, modifiers: unknown) => {
      if (typeof id !== 'string') return
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return
      const mods = (modifiers ?? {}) as MoveModifiers
      ctx.widgets.moveWidgetBy(id, Number(dx), Number(dy), {
        alt: Boolean(mods.alt),
        ctrl: Boolean(mods.ctrl),
        shift: Boolean(mods.shift)
      })
    }
  )

  ipcMain.handle('widget:move-window', (_event, id: unknown, dx: unknown, dy: unknown) => {
    if (typeof id !== 'string') return
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return
    ctx.widgets.moveWindowBy(id, Number(dx), Number(dy))
  })

  ipcMain.handle('widget:offset-window', (_event, id: unknown, dx: unknown, dy: unknown) => {
    if (typeof id !== 'string') return
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return
    ctx.widgets.offsetWindowBy(id, Number(dx), Number(dy))
  })

  ipcMain.handle('widget:add', (_event, type: unknown, sourceId: unknown) => {
    if (!isWidgetType(type)) return null
    const instance = ctx.store.add(type, typeof sourceId === 'string' ? sourceId : undefined)
    if (!instance) return null
    ctx.widgets.sync(instance.id)
    ctx.refresh()
    ctx.settingsWindow.select(instance.id)
    return instance
  })

  ipcMain.handle('widget:remove', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    const removed = ctx.store.remove(id)
    if (removed) {
      ctx.widgets.destroy(id)
      ctx.refresh()
    }
    return removed
  })

  ipcMain.handle('widget:set-locked', (_event, id: unknown, locked: boolean) => {
    if (typeof id === 'string') ctx.widgets.setLocked(id, Boolean(locked))
  })

  ipcMain.handle('widget:set-locked-all', (_event, locked: boolean) => {
    ctx.widgets.setLockedAll(Boolean(locked))
  })

  ipcMain.handle('widget:set-layer-all', (_event, layer: unknown) => {
    ctx.widgets.setLayerAll(layer === 'desktop' ? 'desktop' : 'always')
  })

  ipcMain.handle('widget:reset-positions', () => {
    ctx.widgets.resetPositions()
  })

  ipcMain.on('widget:content-size', (_event, id: unknown, width: number, height: number) => {
    if (typeof id !== 'string') return
    if (!Number.isFinite(width) || !Number.isFinite(height)) return
    ctx.widgets.setContentSize(id, width, height)
  })

  ipcMain.on('widget:set-manual-size', (_event, id: unknown, size: unknown) => {
    if (typeof id !== 'string') return
    if (size === null) {
      ctx.widgets.setManualSize(id, null)
      return
    }
    if (typeof size === 'object' && size) {
      const candidate = size as Partial<Size>
      if (Number.isFinite(candidate.width) && Number.isFinite(candidate.height)) {
        ctx.widgets.setManualSize(id, {
          width: Number(candidate.width),
          height: Number(candidate.height)
        })
      }
    }
  })

  ipcMain.on('settings:open', (_event, tab: unknown) => {
    ctx.settingsWindow.open(
      typeof tab === 'string' ? (tab as SettingsTab) : undefined,
      ctx.store.state.general.defaultDisplayId
    )
  })

  ipcMain.on('settings:close', () => ctx.settingsWindow.close())

  ipcMain.on('settings:active', (_event, tab: unknown) => {
    ctx.widgets.setSettingsFocus(typeof tab === 'string' && tab !== 'general' ? tab : null)
  })

  ipcMain.on('settings:set-collapsed', (_event, collapsed: unknown) => {
    ctx.settingsWindow.setCollapsed(Boolean(collapsed))
  })

  ipcMain.handle('weather:search', (_event, query: unknown) => {
    return ctx.weather.search(typeof query === 'string' ? query : '')
  })

  ipcMain.handle('weather:forecast', (_event, city, units, provider, yandexKey) => {
    return ctx.weather.forecast(
      city,
      units === 'imperial' ? 'imperial' : 'metric',
      (provider === 'metno' || provider === 'wttr' || provider === 'yandex'
        ? provider
        : 'open-meteo') as WeatherProvider,
      typeof yandexKey === 'string' ? yandexKey : ''
    )
  })

  ipcMain.handle('music:get', () => ctx.music.getSnapshot())

  ipcMain.handle('finance:get', (_event, codes: unknown) => {
    return ctx.finance.get(
      Array.isArray(codes) ? codes.filter((code): code is string => typeof code === 'string') : []
    )
  })

  ipcMain.handle('twitch:get', (_event, settings: unknown) => {
    const value = (settings ?? {}) as {
      channels?: unknown
      clientId?: unknown
      clientSecret?: unknown
    }
    return ctx.twitch.get({
      channels: Array.isArray(value.channels)
        ? value.channels.filter((channel): channel is string => typeof channel === 'string')
        : [],
      clientId: typeof value.clientId === 'string' ? value.clientId : '',
      clientSecret: typeof value.clientSecret === 'string' ? value.clientSecret : ''
    })
  })

  ipcMain.handle('system:get', () => ctx.system.get())
  ipcMain.handle('fonts:list', () => ctx.fonts.list())

  ipcMain.on('music:control', (_event, action: unknown, positionMs: unknown) => {
    if (action === 'seek') {
      if (typeof positionMs === 'number' && Number.isFinite(positionMs)) {
        ctx.music.seek(positionMs)
      }
      return
    }
    if (action === 'toggle' || action === 'next' || action === 'prev') {
      ctx.music.control(action)
    }
  })

  ipcMain.handle('image:pick', async () => {
    const imagesDir = join(app.getPath('userData'), 'images')
    try {
      mkdirSync(imagesDir, { recursive: true })
      const options: Electron.OpenDialogOptions = {
        title: 'Выберите изображение',
        properties: ['openFile'],
        filters: [{ name: 'Изображения', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }]
      }
      const parent = ctx.settingsWindow.window
      const result = parent
        ? await dialog.showOpenDialog(parent, options)
        : await dialog.showOpenDialog(options)
      if (result.canceled || !result.filePaths[0]) return null
      const source = result.filePaths[0]
      const extension = extname(source).toLowerCase() || '.png'
      const id = `img-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`
      const destination = join(imagesDir, `${id}${extension}`)
      copyFileSync(source, destination)
      const size = nativeImage.createFromPath(destination).getSize()
      const asset: ImageAsset = {
        id,
        name: basename(source),
        file: destination,
        width: size.width,
        height: size.height
      }
      ctx.store.addImage(asset)
      ctx.refresh()
      return asset
    } catch (error) {
      console.error('[images] не удалось добавить изображение', error)
      return null
    }
  })

  ipcMain.handle('preset:save', (_event, name: unknown, style: unknown) => {
    const preset = ctx.store.addPreset(
      typeof name === 'string' ? name : 'Мой пресет',
      style as WidgetStyle
    )
    ctx.refresh()
    return preset as StylePreset
  })

  ipcMain.handle('preset:delete', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    const removed = ctx.store.removePreset(id)
    if (removed) ctx.refresh()
    return removed
  })

  ipcMain.handle('image:delete', (_event, id: unknown) => {
    if (typeof id !== 'string') return { ok: false }
    const asset = ctx.store.state.images.find((image) => image.id === id)
    const result = ctx.store.deleteImage(id)
    if (result.ok && asset) {
      try {
        unlinkSync(asset.file)
      } catch {
        /* файл уже удалён */
      }
      ctx.refresh()
    }
    return result
  })

  ipcMain.handle('zodiac:save', (_event, pack: unknown) => {
    const saved = ctx.store.saveZodiacPack(pack as ZodiacPack)
    ctx.refresh()
    return saved
  })

  ipcMain.handle('zodiac:delete', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    const removed = ctx.store.deleteZodiacPack(id)
    if (removed) ctx.refresh()
    return removed
  })

  ipcMain.handle('tarot:save-deck', (_event, deck: unknown) => {
    const saved = ctx.store.saveTarotDeck(deck as TarotDeck)
    ctx.refresh()
    return saved
  })

  ipcMain.handle('tarot:delete-deck', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    const removed = ctx.store.deleteTarotDeck(id)
    if (removed) ctx.refresh()
    return removed
  })

  ipcMain.handle(
    'sims:action',
    (_event, groupId: unknown, action: unknown, difficulty: unknown, need: unknown) => {
      if (typeof groupId !== 'string') return ctx.store.state
      const mood: SimsMood = ctx.store.simsAction(
        groupId,
        action as SimsAction,
        difficulty === 'hard' ? 'hard' : 'classic',
        typeof need === 'string'
          ? (need as 'hunger' | 'energy' | 'fun' | 'social' | 'hygiene')
          : undefined
      )
      for (const widget of ctx.store.state.widgets) {
        if (
          widget.type === 'sims' &&
          (widget.settings as { groupId?: string }).groupId === groupId
        ) {
          ctx.widgets.sync(widget.id)
        }
      }
      ctx.refresh()
      return { ...ctx.store.state, sims: { ...ctx.store.state.sims, [groupId]: mood } }
    }
  )

  ipcMain.on('sims:open-menu', (_event, id: unknown) => {
    if (typeof id !== 'string') return
    const bounds = ctx.widgets.bounds(id)
    if (!bounds) return
    ctx.simsMenu.open(id, bounds)
  })

  ipcMain.on('sims:close-menu', () => ctx.simsMenu.close())

  ipcMain.on('sims:open-rewards', (_event, id: unknown, groupId: unknown) => {
    if (typeof id !== 'string' || typeof groupId !== 'string') return
    ctx.rewards.open(groupId, ctx.widgets.bounds(id) ?? null)
  })

  ipcMain.on('sims:close-rewards', () => ctx.rewards.close())

  ipcMain.handle('equalizer:stretch', (_event, id: unknown, stretch: unknown) => {
    if (typeof id !== 'string') return ctx.store.state
    ctx.widgets.setEqualizerStretch(id, Boolean(stretch))
    ctx.refresh()
    return ctx.store.state
  })

  ipcMain.handle('equalizer:position', (_event, id: unknown, x: unknown, y: unknown) => {
    if (typeof id !== 'string' || !Number.isFinite(x) || !Number.isFinite(y)) return ctx.store.state
    ctx.widgets.setEqualizerPosition(id, Number(x), Number(y))
    ctx.refresh()
    return ctx.store.state
  })

  ipcMain.handle('equalizer:reset-position', (_event, id: unknown) => {
    if (typeof id !== 'string') return ctx.store.state
    ctx.widgets.resetEqualizerPosition(id)
    ctx.refresh()
    return ctx.store.state
  })

  ipcMain.handle('equalizer:align', (_event, id: unknown, edge: unknown) => {
    if (typeof id !== 'string') return
    if (edge !== 'top' && edge !== 'bottom' && edge !== 'left' && edge !== 'right') return
    ctx.widgets.alignEqualizer(id, edge)
  })

  ipcMain.handle('app:runtime', () => ctx.getRuntime())

  ipcMain.on('external:open', (_event, url: unknown) => {
    if (typeof url !== 'string') return
    if (!/^https?:\/\//i.test(url)) return
    void shell.openExternal(url)
  })

  ipcMain.on('app:quit', () => {
    ctx.store.saveNow()
    app.quit()
  })
}

export function broadcastToAll(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload)
  }
}
