import { useState, type JSX } from 'react'
import type { TodoSettings } from '@shared/types'
import { dayLabel, isToday, shortDate, toIso, uid, weekDates } from '@shared/todo'
import { IconPlus } from '../../ui/icons'

export function TodoWidget({
  settings,
  interactive,
  instanceId
}: {
  settings: TodoSettings
  interactive: boolean
  instanceId: string
}): JSX.Element {
  const [text, setText] = useState('')
  const [selectedDay, setSelectedDay] = useState(toIso(new Date()))

  const week = weekDates()
  const visibleDates = settings.view === 'today' ? [toIso(new Date())] : week

  const save = (patch: Partial<TodoSettings>): void => {
    if (!instanceId) return
    void window.widgets.updateWidgetSettings(instanceId, patch)
  }

  const items = settings.items
  const visibleItems = items.filter((item) => visibleDates.includes(item.date))
  const filtered = settings.showCompleted
    ? visibleItems
    : visibleItems.filter((item) => !item.done)

  const addItem = (): void => {
    const value = text.trim()
    if (!value) return
    save({
      items: [
        ...items,
        { id: uid('todo'), text: value.slice(0, 120), date: selectedDay, done: false }
      ]
    })
    setText('')
  }

  const toggleItem = (id: string): void => {
    save({
      items: items.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    })
  }

  const removeItem = (id: string): void => {
    save({ items: items.filter((item) => item.id !== id) })
  }

  return (
    <div className="todo">
      <div className="todo__head">
        <div>
          <div className="todo__title">Дела на неделю</div>
          <div className="todo__sub">
            {settings.view === 'today' ? 'Только сегодня' : 'Понедельник — воскресенье'}
          </div>
        </div>
        <div className="todo__segmented">
          <button
            type="button"
            className={settings.view === 'today' ? 'is-active' : ''}
            onClick={() => save({ view: 'today' })}
          >
            Сегодня
          </button>
          <button
            type="button"
            className={settings.view === 'week' ? 'is-active' : ''}
            onClick={() => save({ view: 'week' })}
          >
            Неделя
          </button>
        </div>
      </div>

      <div className="todo__add">
        <input
          value={text}
          placeholder={`Добавить на ${shortDate(selectedDay)}…`}
          maxLength={120}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addItem()
          }}
        />
        <button type="button" onClick={addItem} title="Добавить дело">
          <IconPlus size={13} />
        </button>
      </div>

      <div className="todo__days">
        {settings.view === 'week' && (
          <div className="todo__day-strip">
            {week.map((iso) => (
              <button
                type="button"
                key={iso}
                className={`${selectedDay === iso ? 'is-active' : ''}${isToday(iso) ? ' is-today' : ''}`}
                onClick={() => setSelectedDay(iso)}
              >
                <span>{dayLabel(iso)}</span>
                <b>{Number(iso.slice(8, 10))}</b>
              </button>
            ))}
          </div>
        )}

        <div className="todo__list">
          {visibleDates.map((iso) => {
            const dayItems = filtered.filter((item) => item.date === iso)
            if (settings.view === 'week' && dayItems.length === 0) return null
            return (
              <div className="todo-group" key={iso}>
                <div className={`todo-group__date${isToday(iso) ? ' is-today' : ''}`}>
                  {isToday(iso) ? 'Сегодня' : `${dayLabel(iso)}, ${shortDate(iso)}`}
                </div>
                {dayItems.map((item) => (
                  <div className={`todo-item${item.done ? ' is-done' : ''}`} key={item.id}>
                    <button
                      type="button"
                      className="todo-item__check"
                      disabled={!interactive}
                      onClick={() => toggleItem(item.id)}
                      title={item.done ? 'Снять отметку' : 'Выполнено'}
                    >
                      {item.done ? '✓' : ''}
                    </button>
                    <span className="todo-item__text">{item.text}</span>
                    <button
                      type="button"
                      className="todo-item__remove"
                      title="Удалить"
                      onClick={() => removeItem(item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {settings.view === 'today' && dayItems.length === 0 && (
                  <div className="todo__empty">На сегодня дел нет — можно добавить выше.</div>
                )}
              </div>
            )
          })}
          {settings.view === 'week' && filtered.length === 0 && (
            <div className="todo__empty">Список пуст. Добавьте первое дело на выбранный день.</div>
          )}
        </div>
      </div>

      {!interactive && (
        <div className="todo__hint">Разблокируйте виджет или включите интерактивность в настройках.</div>
      )}
    </div>
  )
}
