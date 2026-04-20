

## План: починить SW + убрать видимые ошибки на `/index`

### Что не так
1. **Service Worker «Not found»** — runtime error в консоли превью. Браузер пытается обновить SW по URL, который не отдаётся. Это ломает PWA-кэш и засоряет логи.
2. Других runtime-ошибок на `/index` сейчас нет — новая структура (HeroIntro / PrimaryActions / ActiveSituation / AllSectionsAccordion) рендерится чисто.

### Корневая причина SW
В проекте используется `vite-plugin-pwa` (PWA-стратегия из `mem://architecture/mobile/hybrid-pwa-capacitor-strategy`). На preview-домене Lovable файл `sw.js` не публикуется, но в браузере остаётся **зарегистрированный SW от прошлой сессии**. При попытке обновления он получает 404 → `Failed to update a ServiceWorker … Not found`.

Нужно: на не-production хостах (превью, sandbox, localhost) **не регистрировать SW и снимать с регистрации старый**, если он остался.

### Изменения

**1. Файл `src/main.tsx` (или где регистрируется SW — проверю при реализации):**
- Добавить guard: регистрировать SW **только** на `myuno.app` / `www.myuno.app`.
- На остальных хостах — пройтись по `navigator.serviceWorker.getRegistrations()` и `unregister()` всё, что осталось. Один раз очистит браузер у всех, кто видел старый SW.

**2. `vite.config.ts`:**
- Убедиться, что `VitePWA` собирается с `registerType: 'autoUpdate'` и не пытается генерировать SW для preview-сборки (`disable` через env флаг, если потребуется).

**3. Не трогаем:**
- Production-PWA на `myuno.app` продолжит работать как раньше.
- Capacitor-сборки (iOS/Android) не используют web SW.

### Файлы
- `src/main.tsx` — добавить hostname-guard и cleanup старого SW
- `vite.config.ts` — проверить конфиг VitePWA, при необходимости отключить SW в dev/preview

### Проверка после фикса
1. Открыть превью в новой сессии браузера → в консоли нет `Failed to update a ServiceWorker`.
2. На `myuno.app` (production) SW по-прежнему регистрируется (DevTools → Application → Service Workers).
3. Старые пользователи превью при следующем заходе автоматически чистятся.

### Что не входит
- Не меняем визуал `/index` — там сейчас всё в порядке после прошлого упрощения.
- Не трогаем checkout / Stripe (Step 3 launch-плана отдельно).
- Не правим `system_settings` и RPC (Step 1 уже готов).

