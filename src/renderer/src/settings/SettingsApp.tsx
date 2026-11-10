import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type { AppSettings, SettingsPatch, WidgetId } from '@shared/types'
import { WIDGETS } from '@shared/widgets'

const TAB_ORDER: WidgetId[] = ['system', 'music', 'weather', 'equalizer', 'plumbob']

const TAB_HINTS: Record<WidgetId, string> = {
  system: 'Процессор, память и загрузка дисков',
  music: 'Трек из любого плеера через Windows SMTC',
  weather: 'Погода по городу, без ключей и регистрации',
  equalizer: 'Аудиовизуализация для рабочего стола',
  plumbob: 'Кристалл над симом'
}

function Switch({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (value: boolean) => void
}): ReactElement {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span className="switch__track">
        <span className="switch__thumb" />
      </span>
    </label>
  )
}

interface PanelProps {
  settings: AppSettings
  patch: (value: SettingsPatch) => void
  toggleWidget: (id: WidgetId, enabled: boolean) => void
}

function SystemPanel({ settings, patch, toggleWidget }: PanelProps): ReactElement {
  return (
    <section className="panel">
      <div className="row">
        <div className="row__text">
          <span className="row__label">Показывать виджет</span>
          <span className="row__hint">Окно на рабочем столе поверх остальных приложений</span>
        </div>
        <Switch
          checked={settings.widgets.system.enabled}
          onChange={value => toggleWidget('system', value)}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Период опроса</span>
          <span className="row__hint">Как часто обновлять процессор, память и диски</span>
        </div>
        <select
          className="select"
          value={settings.system.intervalMs}
          onChange={event => patch({ system: { intervalMs: Number(event.target.value) } })}
        >
          <option value={1000}>1 секунда</option>
          <option value={2000}>2 секунды</option>
          <option value={5000}>5 секунд</option>
          <option value={10000}>10 секунд</option>
        </select>
      </div>

      <p className="note">
        Позиция окна запоминается автоматически. Скрыть виджет или открыть настройки можно правым
        кликом по нему.
      </p>
    </section>
  )
}

function PlannedPanel({ id }: { id: WidgetId }): ReactElement {
  return (
    <section className="panel panel--empty">
      <div className="empty__badge">скоро</div>
      <h2 className="empty__title">{WIDGETS[id].title}</h2>
      <p className="empty__text">
        {TAB_HINTS[id]}. Виджет появится в одном из ближайших обновлений — следи за роадмапом в
        docs/PROJECT_GUIDE.md.
      </p>
    </section>
  )
}

export function SettingsApp(): ReactElement {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [tab, setTab] = useState<WidgetId>('system')

  const refresh = useCallback(async () => {
    setSettings(await window.api.getSettings())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const patch = useCallback(async (value: SettingsPatch) => {
    setSettings(await window.api.patchSettings(value))
  }, [])

  const toggleWidget = useCallback(
    async (id: WidgetId, enabled: boolean) => {
      if (enabled) await window.api.openWidget(id)
      else await window.api.closeWidget(id)
      await refresh()
    },
    [refresh]
  )

  return (
    <div className="settings">
      <aside className="settings__side">
        <div className="brand">
          <span className="brand__logo">T</span>
          <div className="brand__text">
            <strong>TAS Widget</strong>
            <span>настройки</span>
          </div>
        </div>

        <nav className="nav">
          {TAB_ORDER.map(id => (
            <button
              type="button"
              key={id}
              className={`nav__item ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              <span>{WIDGETS[id].title}</span>
              {!WIDGETS[id].ready && <span className="nav__badge">скоро</span>}
            </button>
          ))}
        </nav>

        <div className="settings__foot">Изменения сохраняются автоматически</div>
      </aside>

      <main className="settings__main">
        <header className="settings__head">
          <h1>{WIDGETS[tab].title}</h1>
          <p>{TAB_HINTS[tab]}</p>
        </header>

        {!settings && <div className="loading">Загружаю настройки…</div>}

        {settings && tab === 'system' && (
          <SystemPanel settings={settings} patch={patch} toggleWidget={toggleWidget} />
        )}

        {settings && tab !== 'system' && <PlannedPanel id={tab} />}
      </main>
    </div>
  )
}
