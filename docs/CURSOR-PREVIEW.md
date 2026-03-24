# Предпросмотр в Cursor (Simple Browser)

## Почему могло не открываться

Vite по умолчанию **отклоняет** запросы, если заголовок `Host` не из белого списка. Встроенный предпросмотр Cursor/VS Code иногда шлёт другой `Host` (прокси, туннель). В `vite.config.ts` включено **`server.allowedHosts: true`**, чтобы это не блокировало dev-сервер.

## Как открыть

1. Терминал в корне проекта: `npm install` (один раз), затем **`npm run dev`**.
2. Дождитесь строки `Local: http://localhost:8080/` (или другой порт, если 8080 занят).
3. **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **Simple Browser: Show** → введите:
   - `http://127.0.0.1:8080`  
   или  
   - `http://localhost:8080`
4. Скопируйте `.env.example` → `.env` и задайте `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`, иначе в консоли будут предупреждения и часть функций не заработает.

## Если порт занят

Vite сам предложит другой порт (например 8081) — откройте в Simple Browser именно тот URL, который покажет терминал.

## Предпросмотр после сборки

`npm run build` → `npm run preview` — для `preview` тоже заданы `allowedHosts: true` и `host: true`.
