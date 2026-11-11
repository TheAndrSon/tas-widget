import { useCallback, useEffect, useRef, useState, type CSSProperties, type JSX } from 'react'
import type {
  DeepPartial,
  GeneralSettings,
  RuntimeInfo,
  SettingsTab,
  WidgetInstance,
  WidgetSettings,
  WidgetStyle,
  WidgetType
} from '@shared/types'
import { DUPLICABLE_TYPES, MAX_COPIES_PER_TYPE, WIDGET_META, WIDGET_TYPES } from '@shared/types'
import { instanceDetail, instanceLabel } from '@shared/labels'
import { useAppState } from '../hooks'
import { ACCENT, WIDGET_ICON } from '../theme'
import { capitalize } from '../format'
import { WidgetPanel } from './panels'
import { Chip, Row, Section, Slider, Toggle } from './controls'
import {
  IconClose,
  IconChevronDown,
  IconChevronUp,
  IconLock,
  IconPlus,
  IconSliders,
  IconTrash
} from '../ui/icons'

const SOON_TYPES: WidgetType[] = ['clock', 'weekday', 'twitch']

function readHash(): SettingsTab {
  return window.location.hash.replace(/^#/, '')
}

function Titlebar({
  collapsed,
  onToggle
}: {
  collapsed: boolean
  onToggle: () => void
}): JSX.Element {
  return (
    <header
      className="titlebar"
      onDoubleClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) return
        onToggle()
      }}
    >
      <div className="brand">
        <span className="brand__mark" />
        <span className="brand__name">TAS Widget</span>
        <span className="brand__tag">{collapsed ? 'свёрнуто' : 'настройки'}</span>
      </div>
      <div className="titlebar__actions">
        <button
          type="button"
          className="titlebar__collapse"
          title={collapsed ? 'Развернуть' : 'Свернуть'}
          onClick={onToggle}
        >
          {collapsed ? <IconChevronDown size={15} /> : <IconChevronUp size={15} />}
        </button>
        <button
          type="button"
          className="titlebar__close"
          title="Закрыть"
          onClick={() => window.widgets.closeSettings()}
        >
          <IconClose size={15} />
        </button>
      </div>
    </header>
  )
}

function rowTitle(instance: WidgetInstance, all: WidgetInstance[]): string {
  const detail = instanceDetail(instance)
  if (!detail) return WIDGET_META[instance.type].title
  const same = all.filter((item) => item.type === instance.type && instanceDetail(item) === detail)
  const suffix =
    same.length > 1 ? ` (${same.findIndex((item) => item.id === instance.id) + 1})` : ''
  return `${capitalize(detail)}${suffix}`
}

function statusHint(instance: WidgetInstance): string {
  if (!instance.enabled) return 'скрыт'
  return instance.locked ? 'заблокирован' : ''
}

function Sidebar({
  state,
  selected,
  onSelect,
  onToggle,
  onAdd
}: {
  state: NonNullable<ReturnType<typeof useAppState>>
  selected: SettingsTab
  onSelect: (tab: SettingsTab) => void
  onToggle: (id: string, enabled: boolean) => void
  onAdd: (type: WidgetType) => void
}): JSX.Element {
  return (
    <aside className="sidebar">
      <div className="sidebar__label">Виджеты</div>
      <nav className="sidebar__nav">
        {WIDGET_TYPES.map((type) => {
          const instances = state.widgets.filter((widget) => widget.type === type)
          const Icon = WIDGET_ICON[type]
          const duplicable = DUPLICABLE_TYPES.includes(type)
          const atLimit = instances.length >= MAX_COPIES_PER_TYPE
          return (
            <div className="sidebar__group" key={type}>
              <div className="sidebar__group-head">
                <span>{WIDGET_META[type].title}</span>
                {SOON_TYPES.includes(type) && <span className="sidebar__soon">скоро</span>}
                {instances.length > 1 && (
                  <span className="sidebar__group-count">{instances.length}</span>
                )}
                {duplicable && (
                  <button
                    type="button"
                    className="sidebar__add"
                    title={atLimit ? 'Достигнут лимит копий' : 'Добавить копию'}
                    disabled={atLimit}
                    onClick={() => onAdd(type)}
                  >
                    <IconPlus size={12} />
                  </button>
                )}
              </div>

              {instances.map((widget) => (
                <div
                  key={widget.id}
                  className={`nav nav--instance${selected === widget.id ? ' is-active' : ''}${
                    widget.enabled ? '' : ' is-off'
                  }`}
                  onClick={() => onSelect(widget.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onSelect(widget.id)
                  }}
                >
                  <span className="nav__icon" style={{ color: ACCENT[type] }}>
                    <Icon size={15} />
                  </span>
                  <span className="nav__text">
                    <span className="nav__title">{rowTitle(widget, state.widgets)}</span>
                    <span className="nav__hint">{statusHint(widget)}</span>
                  </span>
                  <span
                    className="nav__switch"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <Toggle
                      checked={widget.enabled}
                      onChange={(value) => onToggle(widget.id, value)}
                    />
                  </span>
                </div>
              ))}
            </div>
          )
        })}

        <div className="sidebar__divider" />

        <div
          className={`nav${selected === 'general' ? ' is-active' : ''}`}
          onClick={() => onSelect('general')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') onSelect('general')
          }}
        >
          <span className="nav__icon">
            <IconSliders size={16} />
          </span>
          <span className="nav__text">
            <span className="nav__title">Общие</span>
            <span className="nav__hint">запуск, монитор и все виджеты</span>
          </span>
        </div>
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => window.widgets.setLockedAll(false)}
        >
          Разблокировать все
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => window.widgets.setLockedAll(true)}
        >
          Заблокировать все
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => window.widgets.resetPositions()}
        >
          Сбросить положение
        </button>
        <div className="sidebar__hint">Правый клик по иконке в трее открывает быстрое меню.</div>
      </div>
    </aside>
  )
}

function GeneralPanel({
  state,
  runtime,
  patchGeneral
}: {
  state: NonNullable<ReturnType<typeof useAppState>>
  runtime: RuntimeInfo | null
  patchGeneral: (patch: Partial<GeneralSettings>) => void
}): JSX.Element {
  const general = state.general
  const [alignId, setAlignId] = useState(state.widgets[0]?.id ?? '')
  const [alignBusy, setAlignBusy] = useState(false)
  const align = (
    action: 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom' | 'grid'
  ): void => {
    if (!alignId) return
    setAlignBusy(true)
    void window.widgets.alignWidget(alignId, action).finally(() => setAlignBusy(false))
  }
  return (
    <>
      <header className="panel__head">
        <div>
          <h1>Общие</h1>
          <p>Поведение приложения, монитор, сетка и массовые действия</p>
        </div>
      </header>

      <Section title="Запуск">
        <Row
          label="Автозапуск с Windows"
          hint={
            runtime?.packaged
              ? 'Приложение будет стартовать вместе с системой'
              : 'Появится в собранной версии приложения'
          }
        >
          <Toggle
            checked={general.autostart}
            disabled={!runtime?.packaged}
            onChange={(value) => patchGeneral({ autostart: value })}
          />
        </Row>
        <Row label="Горячая клавиша" hint="Разблокировать или заблокировать все виджеты">
          <kbd className="kbd">{runtime?.hotkey ?? 'Ctrl + Alt + W'}</kbd>
        </Row>
        <Row label="Монитор" hint="Где запускать новые виджеты и открывать это окно">
          <select
            className="select"
            value={general.defaultDisplayId}
            onChange={(event) => patchGeneral({ defaultDisplayId: Number(event.target.value) })}
          >
            <option value={0}>Монитор с курсором</option>
            {(runtime?.displays ?? []).map((display) => (
              <option key={display.id} value={display.id}>
                {display.label}
              </option>
            ))}
          </select>
        </Row>
      </Section>

      <Section title="Раскладка и сетка" hint="точное размещение виджетов">
        <Row
          label="Режим раскладки"
          hint="Показывает сетку, разблокирует виджеты и включает привязку при перетаскивании"
        >
          <Toggle
            checked={general.layoutMode}
            onChange={(value) => patchGeneral({ layoutMode: value })}
          />
        </Row>
        <Row label="Шаг сетки">
          <Slider
            min={4}
            max={64}
            step={1}
            value={general.grid.step}
            onChange={(step) => patchGeneral({ grid: { ...general.grid, step } })}
            format={(value) => `${value}px`}
          />
        </Row>
        <Row label="Показывать сетку">
          <Toggle
            checked={general.grid.showGrid}
            onChange={(showGrid) => patchGeneral({ grid: { ...general.grid, showGrid } })}
          />
        </Row>
        <Row
          label="Перемещение стрелками"
          hint="Выберите виджет кликом; стрелки двигают на 1 px, удержание ускоряет"
        >
          <Toggle
            checked={general.arrowMove}
            onChange={(value) => patchGeneral({ arrowMove: value })}
          />
        </Row>
        <Row
          label="Сетка"
          hint="Центральные линии монитора чуть жирнее; свободное перемещение без привязки"
        >
          <div className="layout-keys">
            <span>
              <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>G</kbd> скрыть/показать сетку
            </span>
            <span>
              <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>W</kbd> блокировка/разблокировка
            </span>
          </div>
        </Row>

        <Row label="Выровнять виджет" stacked>
          <div className="layout-align">
            <select
              className="select"
              value={alignId}
              onChange={(event) => setAlignId(event.target.value)}
            >
              {state.widgets.map((widget) => (
                <option value={widget.id} key={widget.id}>
                  {widget.type} · {widget.id}
                </option>
              ))}
            </select>
            <div className="layout-align__grid">
              <button type="button" className="btn btn--small" onClick={() => align('left')}>
                Влево
              </button>
              <button type="button" className="btn btn--small" onClick={() => align('centerX')}>
                Центр X
              </button>
              <button type="button" className="btn btn--small" onClick={() => align('right')}>
                Вправо
              </button>
              <button type="button" className="btn btn--small" onClick={() => align('top')}>
                Вверх
              </button>
              <button type="button" className="btn btn--small" onClick={() => align('centerY')}>
                Центр Y
              </button>
              <button type="button" className="btn btn--small" onClick={() => align('bottom')}>
                Вниз
              </button>
              <button
                type="button"
                className="btn btn--small"
                disabled={alignBusy}
                onClick={() => align('grid')}
              >
                Прилипить к сетке
              </button>
            </div>
          </div>
        </Row>
      </Section>

      <Section title="Все виджеты">
        <Row label="Слой" hint="Применить ко всем виджетам сразу">
          <div className="btn-row">
            <button
              type="button"
              className="btn"
              onClick={() => window.widgets.setLayerAll('always')}
            >
              Все поверх окон
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => window.widgets.setLayerAll('desktop')}
            >
              Все на рабочем столе
            </button>
          </div>
        </Row>
        <Row label="Редактирование">
          <div className="btn-row">
            <button
              type="button"
              className="btn"
              onClick={() => window.widgets.setLockedAll(false)}
            >
              Разблокировать все
            </button>
            <button type="button" className="btn" onClick={() => window.widgets.setLockedAll(true)}>
              Заблокировать все
            </button>
          </div>
        </Row>
        <Row label="Положение" hint="Вернуть виджеты на стандартные места выбранного монитора">
          <button type="button" className="btn" onClick={() => window.widgets.resetPositions()}>
            Сбросить позиции
          </button>
        </Row>
      </Section>

      <Section title="О приложении">
        <Row label="Версия">{runtime?.version ?? '0.4.0'}</Row>
        <Row label="Electron">{runtime?.electron ?? '—'}</Row>
        <Row label="Сборка">{runtime?.packaged ? 'упакованная' : 'разработка'}</Row>
        <Row label="Мониторы">{runtime?.displays.length ?? '—'}</Row>
        <Row label="Погода" hint="Open-Meteo, MET Norway и wttr.in; резерв — 7timer">
          Open-Meteo · MET Norway · wttr.in
        </Row>
        <Row label="Музыка" hint="Читает медиа-сессию Windows, токены не нужны">
          Windows Media Session
        </Row>
      </Section>

      <div className="panel__footer">
        <button type="button" className="btn btn--danger" onClick={() => window.widgets.quit()}>
          Выйти из приложения
        </button>
      </div>
    </>
  )
}

export function SettingsApp(): JSX.Element {
  const state = useAppState()
  const [selected, setSelected] = useState<SettingsTab>(readHash)
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [panelTab, setPanelTab] = useState<'content' | 'style'>('content')

  const instanceTimers = useRef<Record<string, number>>({})
  const instancePending = useRef<Record<string, Partial<WidgetInstance>>>({})
  const settingsTimers = useRef<Record<string, number>>({})
  const settingsPending = useRef<Record<string, Record<string, unknown>>>({})

  useEffect(() => {
    window.widgets
      .getRuntime()
      .then(setRuntime)
      .catch(() => undefined)
    const off = window.widgets.onSelectTab((next) => setSelected(next))
    const unsubscribe = off
    return unsubscribe
  }, [])

  useEffect(() => {
    window.widgets.setSettingsTab(selected)
  }, [selected])

  useEffect(() => {
    if (!state) return
    if (selected !== 'general' && !state.widgets.some((widget) => widget.id === selected)) {
      setSelected(state.widgets[0]?.id ?? 'general')
    }
  }, [state, selected])

  useEffect(() => {
    setPanelTab('content')
  }, [selected])

  useEffect(() => {
    if (!selected) return
    window.history.replaceState(null, '', `${window.location.pathname}#${selected}`)
  }, [selected])

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') window.widgets.closeSettings()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const onResize = (): void => setCollapsed(window.innerHeight < 120)
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toggleCollapsed = (): void => {
    const next = !collapsed
    setCollapsed(next)
    window.widgets.setSettingsCollapsed(next)
  }

  const patchInstance = useCallback((id: string, patch: Partial<WidgetInstance>) => {
    instancePending.current[id] = { ...(instancePending.current[id] ?? {}), ...patch }
    if (instanceTimers.current[id] !== undefined) return
    instanceTimers.current[id] = window.setTimeout(() => {
      const value = instancePending.current[id] ?? {}
      delete instancePending.current[id]
      delete instanceTimers.current[id]
      void window.widgets.updateWidget(id, value)
    }, 60)
  }, [])

  const patchInstanceSettings = useCallback((id: string, patch: Record<string, unknown>) => {
    settingsPending.current[id] = { ...(settingsPending.current[id] ?? {}), ...patch }
    if (settingsTimers.current[id] !== undefined) return
    settingsTimers.current[id] = window.setTimeout(() => {
      const value = settingsPending.current[id] ?? {}
      delete settingsPending.current[id]
      delete settingsTimers.current[id]
      void window.widgets.updateWidgetSettings(id, value as DeepPartial<WidgetSettings>)
    }, 60)
  }, [])

  const addCopy = async (type: WidgetType): Promise<void> => {
    if (!state) return
    const source =
      state.widgets.find((widget) => widget.id === selected && widget.type === type) ??
      state.widgets.find((widget) => widget.type === type)
    const created = await window.widgets.addWidget(type, source?.id)
    if (created) setSelected(created.id)
  }

  const removeCopy = async (id: string): Promise<void> => {
    await window.widgets.removeWidget(id)
    setConfirmRemove(null)
  }

  const patchGeneral = (patch: Partial<GeneralSettings>): void => {
    void window.widgets.updateGeneral(patch)
  }

  const applyStyleAll = (style: WidgetStyle, sourceId: string): void => {
    if (!state) return
    for (const widget of state.widgets) {
      if (widget.id === sourceId) continue
      void window.widgets.updateWidget(widget.id, { style: structuredClone(style) })
    }
  }

  if (!state) {
    return (
      <div className="app app--loading">
        <Titlebar collapsed={collapsed} onToggle={toggleCollapsed} />
        <div className="loading">Загружаем настройки…</div>
      </div>
    )
  }

  const instance = state.widgets.find((widget) => widget.id === selected) ?? null
  const activeType = instance?.type
  const accent = activeType ? ACCENT[activeType] : '#cdd8ff'
  const copies = activeType
    ? state.widgets.filter((widget) => widget.type === activeType).length
    : 0
  const duplicable = activeType ? DUPLICABLE_TYPES.includes(activeType) : false
  const atLimit = copies >= MAX_COPIES_PER_TYPE

  return (
    <div className={`app${collapsed ? ' app--collapsed' : ''}`}>
      <Titlebar collapsed={collapsed} onToggle={toggleCollapsed} />
      <div className="app__body">
        <Sidebar
          state={state}
          selected={selected}
          onSelect={setSelected}
          onToggle={(id, enabled) => patchInstance(id, { enabled })}
          onAdd={(type) => void addCopy(type)}
        />

        <main className="panel" style={{ '--accent': accent } as CSSProperties}>
          {!instance ? (
            <GeneralPanel state={state} runtime={runtime} patchGeneral={patchGeneral} />
          ) : (
            <>
              <header className="panel__head">
                <div>
                  <h1>{instanceLabel(instance, state.widgets)}</h1>
                  <p>{WIDGET_META[instance.type].hint}</p>
                </div>
                <div className="panel__chips">
                  <Chip tone={instance.enabled ? 'on' : 'off'}>
                    {instance.enabled ? 'включён' : 'скрыт'}
                  </Chip>
                  <Chip tone={instance.locked ? 'off' : 'warn'}>
                    {instance.locked ? 'заблокирован' : 'разблокирован'}
                  </Chip>
                </div>
              </header>

              <div className="panel-tabs">
                <button
                  type="button"
                  className={panelTab === 'content' ? 'is-active' : ''}
                  onClick={() => setPanelTab('content')}
                >
                  Содержимое
                </button>
                <button
                  type="button"
                  className={panelTab === 'style' ? 'is-active' : ''}
                  onClick={() => setPanelTab('style')}
                >
                  Стиль и фон
                </button>
              </div>

              <div className="panel__actions">
                {duplicable && (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => void addCopy(instance.type)}
                    disabled={atLimit}
                    title={
                      atLimit ? 'Достигнут лимит копий' : 'Создать копию с теми же настройками'
                    }
                  >
                    <IconPlus size={13} />
                    Добавить копию
                  </button>
                )}
                <button
                  type="button"
                  className={`btn${instance.locked ? ' btn--primary' : ''}`}
                  onClick={() => patchInstance(instance.id, { locked: !instance.locked })}
                >
                  <IconLock size={13} />
                  {instance.locked ? 'Разблокировать' : 'Заблокировать'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => patchInstance(instance.id, { enabled: !instance.enabled })}
                >
                  {instance.enabled ? 'Скрыть виджет' : 'Показать виджет'}
                </button>

                {copies > 1 &&
                  (confirmRemove === instance.id ? (
                    <>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => void removeCopy(instance.id)}
                      >
                        Удалить копию?
                      </button>
                      <button type="button" className="btn" onClick={() => setConfirmRemove(null)}>
                        Отмена
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--danger-ghost"
                      onClick={() => setConfirmRemove(instance.id)}
                    >
                      <IconTrash size={13} />
                      Удалить копию
                    </button>
                  ))}
              </div>

              <WidgetPanel
                instance={instance}
                state={state}
                section={panelTab}
                patchInstance={(patch) => patchInstance(instance.id, patch)}
                patchSettings={(patch) => patchInstanceSettings(instance.id, patch)}
                onApplyAll={(style) => applyStyleAll(style, instance.id)}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
