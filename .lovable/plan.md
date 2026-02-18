
# Очистка и починка Build/PWA инфраструктуры

## Что будет исправлено

### Проблема 1 — Сломанный CACHE_SOS (нет обработчика в SW)
`useOfflineStatus.ts` отправляет `postMessage({ type: 'CACHE_SOS' })` в Service Worker, но `sw.ts` не обрабатывает это сообщение. Функция "Сохранить SOS офлайн" никогда не работала.

**Исправление:** добавить обработчик `CACHE_SOS` в `sw.ts`, который кэширует `/sos` страницу в `uno-sos-cache-v1`. Также добавить `uno-sos-cache-v1` в список актуальных кэшей (чтобы SW не удалял его при активации).

### Проблема 2 — PWAUpdatePrompt показывается при каждом перезапуске
`dismissed` хранится только в `React.useState` (in-memory). После перезагрузки страницы промпт появляется снова, если Service Worker ещё не установился.

**Исправление:** хранить `dismissed` в `sessionStorage` (сброс при закрытии вкладки — разумный TTL).

### Проблема 3 — Накопленный мусор в localStorage
Ключи `manifest_version`, `last_cache_cleanup`, `pwa_installed` прописаны в `Install.tsx` как "нужно удалить при сбросе", но нигде не создаются с TTL. При каждой загрузке `app_version` перезаписывается, но старые значения могут оставаться.

**Исправление:** в `appVersion.ts` добавить разовую очистку устаревших ключей при несовпадении версий.

### Проблема 4 — Автоматическая проверка обновлений каждые 2 минуты — избыточно
`PWAUpdatePrompt` ставит `setInterval` на 2 минуты. Для типичного PWA достаточно одной проверки при фокусе вкладки (`visibilitychange`).

**Исправление:** заменить `setInterval(2 min)` на `document.addEventListener('visibilitychange')`.

---

## Технические детали

### `src/sw.ts`
- Добавить `uno-sos-cache-v1` в `CURRENT_CACHES` (чтобы не удалялся при активации)
- Добавить обработчик сообщения `CACHE_SOS`:
  ```ts
  if (event.data?.type === 'CACHE_SOS') {
    const cache = await caches.open('uno-sos-cache-v1');
    await cache.add('/sos');
  }
  ```

### `src/components/pwa/PWAUpdatePrompt.tsx`
- Заменить `setInterval(2 min)` на `visibilitychange` listener
- Сохранять `dismissed` в `sessionStorage` с ключом `pwa_prompt_dismissed_v3.35.0`

### `src/lib/appVersion.ts`
- При несовпадении сохранённой версии с `APP_VERSION` — очищать устаревшие localStorage ключи (`manifest_version`, `last_cache_cleanup`, `pwa_installed`)

---

## Что НЕ изменится
- Визуальный UI не меняется
- Логика кэширования статики (workbox precache) не трогается
- Версия `3.35.0` и имена кэшей `*-v3` остаются
- Авторизация и данные пользователей не затрагиваются
