import { app, desktopCapturer, globalShortcut, Menu, protocol, screen, session } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import type { RuntimeInfo } from '../shared/types'
import { getDisplayList } from './displays'
import { broadcastToAll, registerIpc } from './ipc'
import { MusicService } from './music'
import { FinanceService } from './finance'
import { TwitchService } from './twitch'
import { SystemMonitorService } from './system-monitor'
import { SimsMenu } from './sims-menu'
import { FontService } from './fonts'
import { SettingsWindow } from './settings-window'
import { Store } from './store'
import { TrayController, type TrayActions } from './tray'
import { WeatherService } from './weather'
import { WidgetManager } from './widgets'
import { NativeLayer } from './window-layer'
import { seedDefaultAssets } from './default-assets'

const HOTKEY = 'Control+Alt+W'
const HOTKEY_LABEL = 'Ctrl + Alt + W'
const GRID_HOTKEY = 'Control+Alt+G'
const GRID_HOTKEY_LABEL = 'Ctrl + Alt + G'
const APP_NAME = 'TAS Widget'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tasimage',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
])

app.setName(APP_NAME)
app.setAppUserModelId('local.taswidget')

// Переезд с прежнего имени: сохраняем state.json пользователя.
const APP_DATA = app.getPath('appData')
const USER_DATA = join(APP_DATA, APP_NAME)
try {
  app.setPath('userData', USER_DATA)
} catch (error) {
  console.error('[app] не удалось задать userData', error)
}

function migrateState(): void {
  try {
    const target = join(USER_DATA, 'state.json')
    if (existsSync(target)) return
    const candidates = [
      join(APP_DATA, 'glass-widgets', 'state.json'),
      join(APP_DATA, 'tas-widget', 'state.json')
    ]
    for (const source of candidates) {
      if (existsSync(source)) {
        mkdirSync(USER_DATA, { recursive: true })
        copyFileSync(source, target)
        console.log('[app] перенёс настройки из', source)
        return
      }
    }
  } catch (error) {
    console.error('[app] миграция настроек не удалась', error)
  }
}
migrateState()

if (!app.isPackaged) {
  app.commandLine.appendSwitch('remote-debugging-port', '9222')
}

let store: Store
let widgets: WidgetManager
let settingsWindow: SettingsWindow
let weather: WeatherService
let music: MusicService
let finance: FinanceService
let twitch: TwitchService
let system: SystemMonitorService
let simsMenu: SimsMenu
let fonts: FontService
let tray: TrayController
let nativeLayer: NativeLayer
let cursorTimer: NodeJS.Timeout | null = null
let layerTimer: NodeJS.Timeout | null = null
let simsTimer: NodeJS.Timeout | null = null

function refresh(): void {
  broadcastToAll('state:changed', store.state)
  tray?.refresh()
}

function applyAutostart(enabled: boolean): void {
  if (!app.isPackaged) return
  try {
    app.setLoginItemSettings({ openAtLogin: enabled })
  } catch (error) {
    console.error('[autostart] failed', error)
  }
}

function getRuntime(): RuntimeInfo {
  return {
    version: app.getVersion(),
    electron: process.versions.electron,
    platform: process.platform,
    displays: getDisplayList(),
    hotkey: HOTKEY_LABEL,
    packaged: app.isPackaged
  }
}

function toggleAllLocks(): void {
  if (store.state.general.layoutMode) {
    store.updateGeneral({ layoutMode: false })
    widgets.setLayoutMode(false)
    broadcastToAll('state:changed', store.state)
    return
  }
  const anyUnlocked = store.state.widgets.some((widget) => widget.enabled && !widget.locked)
  widgets.setLockedAll(anyUnlocked)
}

function bootstrap(): void {
  Menu.setApplicationMenu(null)

  try {
    session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen', 'window'],
          thumbnailSize: { width: 0, height: 0 }
        })
        const source = sources.find((item) => item.id.startsWith('screen')) ?? sources[0]
        if (source) callback({ video: source, audio: 'loopback' })
        else callback({})
      } catch (error) {
        console.error('[audio] display media source', error)
        callback({})
      }
    })
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      callback(permission === 'media' || permission === 'display-capture')
    })
  } catch (error) {
    console.error('[audio] display capture недоступен', error)
  }

  seedDefaultAssets(app.getPath('userData'))
  store = new Store(app.getPath('userData'))
  weather = new WeatherService()
  music = new MusicService()
  finance = new FinanceService()
  twitch = new TwitchService()
  system = new SystemMonitorService()
  simsMenu = new SimsMenu()
  fonts = new FontService()
  nativeLayer = new NativeLayer()
  nativeLayer.start()
  widgets = new WidgetManager(store, refresh, nativeLayer)
  settingsWindow = new SettingsWindow((tab) => widgets.setSettingsFocus(tab))

  const imagesDir = join(app.getPath('userData'), 'images')
  protocol.handle('tasimage', (request) => {
    try {
      const url = new URL(request.url)
      const id = url.pathname.replace(/^\//, '')
      const asset = store.state.images.find((image) => image.id === id)
      if (!asset || !asset.file.startsWith(imagesDir) || !existsSync(asset.file)) {
        return new Response('Not found', { status: 404 })
      }
      const extension = extname(asset.file).toLowerCase()
      const mime =
        extension === '.png'
          ? 'image/png'
          : extension === '.webp'
            ? 'image/webp'
            : extension === '.gif'
              ? 'image/gif'
              : extension === '.bmp'
                ? 'image/bmp'
                : 'image/jpeg'
      return new Response(readFileSync(asset.file), { headers: { 'content-type': mime } })
    } catch (error) {
      console.error('[images] protocol error', error)
      return new Response('Error', { status: 500 })
    }
  })

  const trayActions: TrayActions = {
    openSettings: (tab) => settingsWindow.open(tab, store.state.general.defaultDisplayId),
    setWidgetEnabled: (id, enabled) => widgets.updateWidget(id, { enabled }),
    setLocked: (id, locked) => widgets.setLocked(id, locked),
    setLockedAll: (locked) => widgets.setLockedAll(locked),
    toggleAllWidgets: () => {
      const anyEnabled = store.state.widgets.some((widget) => widget.enabled)
      widgets.setAllEnabled(!anyEnabled)
    },
    resetPositions: () => widgets.resetPositions(),
    quit: () => app.quit()
  }

  tray = new TrayController(store, trayActions)

  registerIpc({
    store,
    widgets,
    settingsWindow,
    weather,
    music,
    finance,
    twitch,
    system,
    simsMenu,
    fonts,
    tray,
    refresh,
    applyAutostart,
    getHotkey: () => HOTKEY_LABEL,
    getRuntime
  })

  music.onUpdate((snapshot) => broadcastToAll('music:updated', snapshot))

  // Синхронизируем автозапуск с системой (только в собранном приложении).
  if (app.isPackaged) {
    try {
      const login = app.getLoginItemSettings().openAtLogin
      if (login !== store.state.general.autostart) {
        store.state.general.autostart = login
        store.scheduleSave()
      }
    } catch {
      /* игнорируем */
    }
  }

  widgets.syncAll()
  if (store.state.general.layoutMode) widgets.setLayoutMode(true)
  tray.create()
  music.start()
  refresh()

  // Периодически подтверждаем «поверх всех окон» нативно: Windows иногда сбрасывает
  // WS_EX_TOPMOST после изменения размера/стиля прозрачного окна.
  layerTimer = setInterval(() => {
    for (const widget of store.state.widgets) {
      if (!widget.enabled || widget.layer !== 'always') continue
      const win = widgets.get(widget.id)
      if (win) nativeLayer.setTopmost(win, true)
    }
  }, 3000)

  // Подсказки в календаре и эффекты курсора: нативные mousemove не доставляются
  // на заблокированном (click-through) виджете, поэтому отдаём позицию курсора вручную.
  cursorTimer = setInterval(() => {
    const targets = store.state.widgets.filter(
      (widget) =>
        widget.enabled && (widget.type === 'calendar' || widget.style?.cursorEffect !== 'none')
    )
    if (targets.length === 0) return
    const point = screen.getCursorScreenPoint()
    for (const widget of targets) {
      const win = widgets.get(widget.id)
      if (win) win.webContents.send('cursor:position', point)
    }
  }, 120)

  // Пламбоб: просадка потребностей, штрафы, бонусы и награды раз в 15 минут.
  simsTimer = setInterval(
    () => {
      if (store.tickSims()) refresh()
    },
    15 * 60 * 1000
  )

  globalShortcut.register(GRID_HOTKEY, () => widgets.toggleGrid())

  const registerHotkey = (attempt = 0): void => {
    if (globalShortcut.register(HOTKEY, toggleAllLocks)) return
    if (attempt < 3) {
      setTimeout(() => registerHotkey(attempt + 1), 4000)
    } else {
      console.warn('[hotkey] не удалось зарегистрировать', HOTKEY)
    }
  }
  registerHotkey()

  const reflow = (): void => widgets.reflow()
  screen.on('display-metrics-changed', reflow)
  screen.on('display-added', reflow)
  screen.on('display-removed', reflow)
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    settingsWindow?.open(undefined, store?.state.general.defaultDisplayId)
  })

  app.whenReady().then(bootstrap)

  app.on('window-all-closed', () => {
    // Приложение живёт в трее — не выходим при закрытии окон.
  })

  app.on('before-quit', () => {
    if (cursorTimer) clearInterval(cursorTimer)
    if (layerTimer) clearInterval(layerTimer)
    if (simsTimer) clearInterval(simsTimer)
    widgets?.setQuitting()
    globalShortcut.unregisterAll()
    music?.stop()
    nativeLayer?.stop()
    tray?.destroy()
    store?.saveNow()
  })

  process.on('uncaughtException', (error) => {
    console.error('[main] uncaught exception', error)
  })
  process.on('unhandledRejection', (reason) => {
    console.error('[main] unhandled rejection', reason)
  })
}
