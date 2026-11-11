# HANDOFF

## Состояние на 2026-11-11

Каркас, окно настроек и виджет музыки готовы. Проверено: `typecheck`, `build`, запуск Electron,
CDP-проба (окно, настройки, живые изменения, остановка SMTC-процесса).

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
- Музыка (SMTC): `main/music.ts`, `main/paths.ts`, `resources/smtc.ps1`,
  `resources/smtc-control.ps1`. Старт при открытии виджета, стоп при закрытии.
- `shared/types.ts`: `MusicSettings`, `MusicStatus`, `MusicSnapshot`, `MusicAction`.
- IPC: `music:get`, `music:control`, broadcast `music:sample`; `settings:changed` для живых
  настроек виджетов.
- `MusicWidget.tsx` + `MusicWidget.css`: обложка, трек, плеер, прогресс, перемотка, кнопки.
  Порт старого вида, зелёный акцент, фикс залипания фокуса кнопок (`blur` + `:focus-visible`).
- Вкладка «Музыка» в настройках: вкл/выкл виджета, обложка, прогресс, кнопки, название плеера.
- `package.json`: `build.extraResources` для `smtc*.ps1` (упаковка).

## Проверено

- `npm run typecheck` — без ошибок.
- `npm run build` — main, preload, renderer, settings.html.
- Запуск `electron .`: окно «TAS Widget», `settings.json` создаётся.
- CDP: окно настроек открывается, вкладки и текст на месте; смена периода опроса
  сохраняется в `settings.json` (проверено 5000 мс, затем возвращено 2000).
- Музыка: окно 340×150, трек и обложка приходят из Chrome SMTC; переключение
  `showArt` в настройках применяется на живом виджете; закрытие виджета завершает
  `smtc.ps1`; вкладка «Музыка» без бейджа «скоро».

## Следующий шаг

Сессия 3 — погода:

1. Перенести `main/weather.ts` на open-meteo без ключей.
2. Несколько экземпляров (города) — сменить модель настроек с `Record<WidgetId>` на список.
3. `WeatherWidget.tsx` + вкладка «Погода», проверка `typecheck`, `build`, CDP.

## Решения по процессу

- Один виджет за сессию, последовательно: параллельные сессии конфликтуют (single instance,
  порт 5173, общие `shared/*`, `ipc.ts`, `App.tsx`).
- Параллельно можно только читать старый код субагентом, без правок.
- Глубина — минимум, но качественно; настройки в отдельном окне; приоритет стабильности.

## Известные мелочи

- CSP разрешает `unsafe-inline` ради dev-режима; для релиза можно ужесточить.
- Кнопки сброса позиции нет — позиция правится через `settings.json`.
- `dist`-скрипты есть, но `electron-builder.yml` ещё не создан.
