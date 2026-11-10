# TAS Widget — карта для агента

## Что это

Отдельное приложение десктопных виджетов Windows. Electron 45 + React 19 + TypeScript,
electron-vite. Первый срез — системный виджет; дальше музыка (SMTC), погода, эквалайзер, пламбоб.
Старая версия живёт отдельно в `D:\OpenCode_Projects\Widget` — это не тот же проект.

## Команды

- install: `npm install`
- dev: `npm run dev`
- typecheck: `npm run typecheck`
- build: `npm run build`
- preview собранного: `npm run start`
- portable / инсталлятор: `npm run dist:dir` / `npm run dist` (позже)

## Структура (только важное)

- `src/main/index.ts` — точка входа, single instance, `userData` = `%APPDATA%\tas-widgets`
- `src/main/widgets.ts` — окна виджетов, позиции, always-on-top, broadcast
- `src/main/ipc.ts` — контракт IPC (единственное место регистрации каналов)
- `src/main/store.ts` — `settings.json`, нормализация, отложенное сохранение
- `src/main/system-monitor.ts` — CPU/RAM/диски, опрос раз в `system.intervalMs`
- `src/main/tray.ts` — трей: открыть/закрыть виджеты, настройки, выход
- `src/main/settings-window.ts` — отдельное окно настроек (одно на приложение)
- `src/preload/index.ts` — мост `window.api`
- `src/renderer/src/App.tsx` — роутинг по `?widget=<id>`
- `src/renderer/src/widgets/<Name>Widget.tsx` — UI виджета + его css
- `src/renderer/src/settings/SettingsApp.tsx` — окно настроек, вкладки по виджетам
- `src/renderer/src/styles/tokens.css` — общие цвета, радиусы, тени
- `src/shared/types.ts` — типы настроек и данных
- `src/shared/widgets.ts` — каталог виджетов: `id`, размер, `ready`
- `src/shared/defaults.ts` — дефолтные настройки
- `resources/icon.png` — иконка трея

## Правила

- Не читать: `node_modules`, `out`, `dist`, `release`, `package-lock.json`, `resources/*.png`.
- Новый виджет проходит путь: `shared/types.ts` → `shared/widgets.ts` (`ready: true`) → `shared/defaults.ts` → main-модуль данных (если нужен) → `preload/index.ts` → `renderer/src/widgets/*` → `App.tsx`.
- Новый IPC: `preload/index.ts` → `main/ipc.ts` → renderer.
- Новая настройка: `shared/types.ts` → `defaults.ts` → `main/store.ts` (normalize) → UI.
- Новая вкладка настроек: `shared/widgets.ts` (готовность) → `renderer/src/settings/SettingsApp.tsx` (панель) → `tokens.css` для стиля.
- Старый `Widget` — источник кода для переноса, но переносить по одному виджету, без копирования всего проекта.
- Проверка перед сдачей: `npm run typecheck` и `npm run build`; визуально — `npm run dev`.
- Не менять размер окна при смене контента; размеры — в `shared/widgets.ts`.
- Сессии последовательные: одна сессия = один виджет. Параллельный `npm run dev` невозможен (single instance, порт 5173), общие файлы контракта конфликтуют.

## Грабли

- Окно не появилось → смотри `did-fail-load` в `main/widgets.ts`, файл `out/renderer/index.html`.
- Виджета нет в трее → `ready: false` в `shared/widgets.ts`.
- Настройки не сохраняются → `normalize` в `main/store.ts` + `shared/defaults.ts`.
- Данные не доходят до UI → `preload/index.ts` → `ipc.ts`/`broadcast` в `widgets.ts` → подписка в компоненте.
- Пустой трей → `resources/icon.png` и путь в `main/tray.ts`.
- Прозрачность, клики, перетаскивание → опции `BrowserWindow` в `main/widgets.ts` и `-webkit-app-region`.

## Текущая задача

`.opencode/HANDOFF.md`
