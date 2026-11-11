---
name: Widget Dev
description: Добавление и починка виджетов TAS Widget — путь настройки, IPC-контракт, окна, чек-лист проверки
---

# Widget Dev

## Когда применять
- Добавить новый виджет.
- Добавить или изменить настройку существующего виджета.
- Починить поведение окна: размер, позиция, клики, слой.
- Разобраться, почему настройка не сохраняется или не применяется.

## Карта проекта
| Что | Файл |
|---|---|
| Типы виджетов, `WIDGET_META`, `WIDGET_TYPES` | `src/shared/types.ts` |
| Дефолты состояния | `src/shared/defaults.ts`, `src/shared/default-design.ts` |
| Слияние настроек | `src/shared/merge.ts` (`deepMerge`) |
| Хранение и запись | `src/main/store.ts` |
| IPC-обработчики | `src/main/ipc.ts` |
| Мост в renderer | `src/preload/index.ts` |
| Окна и размеры | `src/main/widgets.ts` |
| Слой, клики, закрепление | `src/main/window-layer.ts` |
| UI виджета | `src/renderer/src/widget/widgets/<Name>Widget.tsx` |
| Оболочка и подписка на state | `src/renderer/src/widget/App.tsx` |
| Панели настроек | `src/renderer/src/settings/panels.tsx` |
| Стили и фон | `src/renderer/src/settings/StyleEditor.tsx` |
| Пресеты и стили | `src/shared/presets.ts` |

## Путь новой настройки
1. `src/shared/types.ts` — поле в `WidgetSettings` (или в типе конкретного виджета).
2. `src/shared/defaults.ts` / `default-design.ts` — дефолт.
3. `src/main/store.ts` — проверить, что `deepMerge` сохраняет поле.
4. `src/preload/index.ts` — если нужно новое событие/метод.
5. `src/renderer/src/settings/panels.tsx` — контрол в панели.
6. `src/renderer/src/widget/widgets/<Name>Widget.tsx` — чтение и отображение.
7. Если меняется форма сохранённого состояния — поднять `STATE_VERSION` и добавить миграцию.

## Путь нового IPC
1. `src/preload/index.ts` — метод в API.
2. `src/main/ipc.ts` — `ipcMain.handle` или `ipcMain.on`.
3. `src/shared/types.ts` — типы запроса/ответа.
4. Renderer — вызов через `window.api`.

## Диагностика бага
1. Определи тип виджета и его компонент в `widgets/`.
2. Проверь, приходит ли значение: state → `onState` → props компонента.
3. Если значение есть, но не применяется — ищи в компоненте.
4. Если значения нет — иди назад: панель → preload → ipc → store → defaults.
5. Если проблема в размере/позиции/кликах — это `main/widgets.ts` и `main/window-layer.ts`, не renderer.

## Проверка
- `npm run typecheck`
- `npx prettier --check <изменённые файлы>`
- `npm run build`
- Визуально: `npm run dev`, проверить именно этот виджет и его настройки.

## Не делать
- Не читать все виджеты подряд — только нужный.
- Не менять глобальные дефолты ради одного экземпляра.
- Не обходить `store` прямым изменением файла состояния.
- Не трогать `styles`/`presets` без задачи.
