# TAS Widget (`tas-widget`)

Electron + React + TypeScript. Десктопные виджеты Windows: погода, музыка, время,
день недели, календарь, астро, таро, кубик, эквалайзер, дела, Sims, финансы, Twitch, система.

## Команды
- dev: `npm run dev`
- typecheck: `npm run typecheck`
- build: `npm run build`
- portable: `npm run dist:dir`
- инсталлятор: `npm run dist:one`

## Структура
- `src/main/index.ts` — точка входа main
- `src/main/ipc.ts` — IPC-каналы, главный контракт
- `src/main/widgets.ts` — создание и позиционирование окон виджетов
- `src/main/window-layer.ts` — z-order, click-through, закрепление
- `src/main/store.ts` — сохранение настроек
- `src/main/<фича>.ts` — weather, music, finance, system-monitor, twitch, sims-menu
- `src/preload/index.ts` — мост renderer → main
- `src/renderer/src/widget/widgets/<Name>Widget.tsx` — UI виджета
- `src/renderer/src/widget/App.tsx` — общая оболочка и роутинг виджетов
- `src/renderer/src/settings/panels.tsx` — панели настроек
- `src/renderer/src/settings/StyleEditor.tsx` — стили и фон
- `src/shared/types.ts` — типы настроек и данных
- `src/shared/defaults.ts`, `merge.ts` — дефолты и слияние
- `resources/*.ps1` — SMTC и оконные трюки Windows

## Правила
- Не читать: `node_modules`, `release`, `dist`, `package-lock.json`, `resources/*.png`.
- Новая настройка проходит путь: `shared/types.ts` → `shared/defaults.ts` → `main/store.ts` → `settings/panels.tsx` → компонент виджета.
- Новый IPC: `preload/index.ts` → `main/ipc.ts` → renderer.
- Не менять размер окна при смене контента без необходимости (см. auto-resize).
- Проверка после правок: `npm run typecheck`, `npx prettier --check <файл>`, затем `npm run build`.

## Грабли
- Окно «прыгает» или обрезает контент → auto-resize и минимальный размер в `main/widgets.ts`.
- Клики не проходят / проходят сквозь → `main/window-layer.ts`, `setIgnoreMouseEvents`.
- Настройка не сохраняется → `shared/defaults.ts` + `shared/merge.ts` + `main/store.ts`.
- Стиль не применяется → `shared/default-design.ts` и `shared/presets.ts`.

## Текущая задача
`.opencode/HANDOFF.md`
