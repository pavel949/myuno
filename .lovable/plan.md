

# Исправление "перескакивания" на старый билд

## Что уже сделано
Версия синхронизирована: `index.html`, `version.json`, `appVersion.ts` — все `3.26.0`.

## Что осталось (2 проблемы)

### Проблема 1: Молчаливое обновление SW без перезагрузки
В `PWAUpdatePrompt.tsx` строки 36-41 вызывают `updateServiceWorker(true)` автоматически. Это активирует новый SW, но **старый JavaScript продолжает работать в памяти**. Пользователь видит старый UI, хотя SW уже новый.

**Решение**: Убрать авто-обновление. Вместо этого показывать prompt и при нажатии "Обновить" делать `updateServiceWorker(true)` + принудительный `window.location.reload()`.

### Проблема 2: SW не сообщает клиентам об обновлении
Когда новый SW активируется, он чистит кеши, но не говорит странице "перезагрузись". Если `controllerchange` не сработал (race condition), страница продолжает работать на старом коде.

**Решение**: В `sw.ts` при активации отправлять `postMessage({ type: 'SW_UPDATED' })` всем клиентам. В `index.html` слушать это сообщение и делать hard reload.

## Изменения по файлам

### 1. `src/components/pwa/PWAUpdatePrompt.tsx`
- Удалить `useEffect` с авто-обновлением (строки 35-41)
- В `handleUpdate` добавить `window.location.reload()` после `updateServiceWorker(true)`

### 2. `src/sw.ts`
- В обработчике `activate` добавить рассылку `SW_UPDATED` всем клиентам через `self.clients.matchAll()` + `client.postMessage()`
- Добавить обработчик `message` для команды `SKIP_WAITING`

### 3. `index.html`
- Добавить слушатель `navigator.serviceWorker.addEventListener('message')` для сообщения `SW_UPDATED` — при получении делать `window.location.href = window.location.href` (hard navigation, не просто reload)

## Ожидаемый результат
- При обновлении SW страница **гарантированно** перезагружается с новыми ассетами
- Старый JS-бандл никогда не останется в памяти после обновления SW
- "Перескакивание" на старый билд исчезнет полностью
