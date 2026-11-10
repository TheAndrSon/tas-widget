# HANDOFF

## Состояние на 2026-11-10

Каркас и окно настроек готовы. Проверено: `typecheck`, `build`, запуск Electron, CDP-проба.
Git инициализирован, коммит каркаса `cb6043c`.

## Что сделано

- Electron 45 + React 19 + TS, electron-vite 6, Vite 8, `systeminformation`.
- Окна виджетов: прозрачные, без рамки, always-on-top, перетаскивание, сохранение позиции.
- Трей: чекбоксы виджетов, «Открыть все», «Закрыть все», «Настройки…», «Выход».
- Настройки: `%APPDATA%\tas-widgets\settings.json`, отдельно от старого TAS Widget.
- IPC: `settings:get/patch/open`, `widget:open/close`, `app:quit`, `ui:context-menu`, `system:sample`.
- Системный виджет: CPU/RAM/диски, период опроса из настроек.
- Окно настроек: вкладки по виджетам, готовая вкладка «Система» (вкл/выкл, период опроса),
  planned-вкладки «Музыка», «Погода», «Эквалайзер», «Пламбоб».
- Общие стили: `styles/tokens.css` (цвета, радиусы, тени, шрифт), `settings/settings.css`.
- Открытие настроек: трей, правый клик по виджету, `window.api.openSettings()`.
- Документация: `AGENTS.md`, `docs/PROJECT_GUIDE.md`, `README.md`.

## Проверено

- `npm run typecheck` — без ошибок.
- `npm run build` — main, preload, renderer, settings.html.
- Запуск `electron .`: окно «TAS Widget», `settings.json` создаётся.
- CDP: окно настроек открывается, вкладки и текст на месте; смена периода опроса
  сохраняется в `settings.json` (проверено 5000 мс, затем возвращено 2000).

## Следующий шаг

Сессия 2 — музыка (SMTC):

1. Скопировать `resources/smtc.ps1` и `resources/smtc-control.ps1` из `D:\OpenCode_Projects\Widget`.
2. Перенести `main/music.ts`, адаптировать под `store`/`ipc`: старт при открытии виджета,
   стоп при закрытии, broadcast `music:sample`.
3. Добавить `MusicSettings` в `shared/types.ts`, `defaults.ts`, `store.ts` (normalize).
4. `preload`: `onMusicSample`; компонент `MusicWidget.tsx`; вкладка «Музыка» в настройках.
5. Проверка: `typecheck`, `build`, CDP; SMTC при запущенном плеере.

## Решения по процессу

- Один виджет за сессию, последовательно: параллельные сессии конфликтуют (single instance,
  порт 5173, общие `shared/*`, `ipc.ts`, `App.tsx`).
- Параллельно можно только читать старый код субагентом, без правок.
- Глубина — минимум, но качественно; настройки в отдельном окне; приоритет стабильности.

## Известные мелочи

- CSP разрешает `unsafe-inline` ради dev-режима; для релиза можно ужесточить.
- Кнопки сброса позиции нет — позиция правится через `settings.json`.
- `dist`-скрипты есть, но `electron-builder.yml` ещё не создан.
