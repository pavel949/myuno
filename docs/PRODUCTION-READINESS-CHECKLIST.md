# Чеклист перед запуском в прод (myUNO)

Дата-ориентир: март 2026. Используйте вместе с [`VERCEL-SUPABASE-PRODUCTION-SETUP.md`](./VERCEL-SUPABASE-PRODUCTION-SETUP.md) и [`ENV.md`](./ENV.md).

---

## 1. Источники данных (как связано)

| Слой | Роль |
|------|------|
| **Supabase (PostgreSQL + Auth + Realtime)** | Единственный источник правды для пользователей, каталога, CRM, заказов. Клиент: `src/integrations/supabase/client.ts`. |
| **React Query** | Кэш и повторные запросы для данных с сервера (`defaultQueryClientOptions` в `src/lib/queryConfig.ts`). |
| **Edge Functions** | Бизнес-логика вне браузера (платежи, письма, AI). Секреты только в Supabase Dashboard, не в Vite. |
| **Переменные `VITE_*`** | Встраиваются **на этапе сборки**. После смены в Vercel обязателен **Redeploy**. |

**Риск рассинхрона:** Lovable/preview и прод должны указывать на **один и тот же** проект Supabase (`VITE_SUPABASE_URL` + publishable key). Иначе вход/данные «не сходятся». См. [`AUTH-LOGIN-LOVABLE-VERCEL.md`](./AUTH-LOGIN-LOVABLE-VERCEL.md).

---

## 2. Критично для «открытого» продакшена: Coming Soon

В `App.tsx` компонент **`ComingSoonGate`** для **неавторизованных** пользователей показывает **`UnderConstruction`** («Coming Soon») на **большинстве маршрутов**, кроме явного списка (`/auth`, `/for-management-companies`, `/vendor/join`, `/vendor/onboarding`, `/ref/*` и т.д.).

**Итог:** гости **не увидят** главную/Discover/каталог, пока:

- не задано **`VITE_BYPASS_COMING_SOON=true`** в Vercel (осознанное решение на запуск), **или**
- не расширен список публичных маршрутов в коде под ваш сценарий запуска.

Перед релизом **явно решите:** открываем каталог всем или оставляем закрытую бету.

---

## 3. Окружение и сборка

| Проверка | Команда / действие |
|----------|-------------------|
| TypeScript | `npm run typecheck` |
| Unit / интеграционные (Vitest) | `npm run test:run` |
| Production bundle | `npm run build` |
| Линт (по необходимости) | `npm run lint` |

**Vercel:** заданы `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, при необходимости `VITE_PUBLIC_APP_URL`, флаги Coming Soon / карты.

---

## 4. E2E smoke (Playwright)

```bash
# Убедитесь, что порт 8080 свободен или дайте Playwright самому поднять dev-сервер
npm run test:e2e:smoke
```

Тесты: `e2e/tests/smoke/platform-smoke.spec.ts` — главная, `/auth`, `/discover`.

Если таймауты: первый запуск Vite может быть долгим; в `playwright.config.ts` заданы таймауты webServer и навигации.

**Порт 8080 занят** (уже запущен `npm run dev`): снимите переменную `CI` в сессии (`Remove-Item Env:CI`) — Playwright переиспользует сервер (`reuseExistingServer`).

**Чистый прогон** (Playwright сам поднимает dev): свободный порт 8080 и:

```powershell
$env:CI='1'; npx playwright test e2e/tests/smoke --project=chromium
```

---

## 5. Ручной smoke после деплоя (15 мин)

1. Открыть прод в **инкогнито** — нет белого экрана, в консоли нет `[env]` fatal.
2. **Главная** — ожидаемое поведение: Coming Soon **или** контент (согласно п. 2).
3. **`/auth`** — форма входа открывается.
4. Вход тестовым пользователем (если прод открыт) — редирект без вечного спиннера.
5. Один **вертикальный** сценарий (например Discover → карточка → назад) — без 404 при F5 (SPA rewrites на Vercel).
6. **Supabase Dashboard** — Auth → Users, при необходимости логи Edge Functions для критичных сценариев.

---

## 6. Известные зоны внимания (из спринта)

- CRM/MC: часть экранов помечена в `CLAUDE.md` как с багами — не используйте как единственный критерий готовности всего продукта.
- **`/api/*` на чистом Vite-хосте** не существует без отдельных Vercel Functions — для Chat/Admin login нужны `VITE_*_URL` на edge. См. [`ENV.md`](./ENV.md).

---

*Обновляйте этот файл при смене стратегии Coming Soon или основного домена.*
