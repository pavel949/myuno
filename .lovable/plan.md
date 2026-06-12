# План: фиксы онбординга поставщиков

Закрываем 12 багов из аудита + убираем дубль `/provider/onboarding`. Без новых фич — только чистка и безопасность.

## 1. Дедупликация флоу (архитектурно)

- **Удалить** `src/pages/provider/ProviderOnboarding.tsx` (полный дубль `BecomePartnerPage`).
- Маршрут `/provider/onboarding` → 301 redirect на `/become-partner` в `AnimatedRoutes.tsx`.
- Убрать запись в `pageRegistry.ts` и suppress-list в `App.tsx`.
- `BecomePartnerPage` становится единственным «лёгким» флоу (без создания `providers`).
- `VendorOnboarding` остаётся единственным «тяжёлым» флоу (создаёт `providers` + application).

## 2. P0 — критика

**BUG-01** `VendorOnboarding.tsx:99` — добавить guard: если `!user?.email` → блок submit с тостом «Email required», не вставлять application с `null`.

## 3. P1 — серьёзные

- **BUG-02** `BecomePartnerPage.tsx`: валидация email через Zod перед insert; убрать тост «Confirmation sent» если email пустой.
- **BUG-03** `notify-admin-partner-application/index.ts`: добавить проверку JWT через `supabase.auth.getUser(token)` в начале handler; 401 если нет валидной сессии. (Админ-уведомление при approve вызывается из admin-функции с service_role — там auth уже есть.)
- **BUG-04** `PartnerApplicationsAdmin.tsx`: удалить мёртвую `fetchApplications()` (строки 173-195), оставить только `useEffect`-загрузку + кнопка Refresh, вызывающая ту же логику через `useCallback`.
- **BUG-05** `PartnerApplicationsAdmin.tsx:210`: убрать `as never`; типизировать `updateData` через `Database['public']['Tables']['partner_applications']['Update']`.
- **BUG-06** `PartnerStatusPage.tsx`: обернуть в `<AppLayout>` как остальные страницы.
- **BUG-07** `approve-partner-application/index.ts:8`: заменить хардкод origin на `Access-Control-Allow-Origin: *` (или динамически из `req.headers.origin`), как в остальных функциях.
- **BUG-08** `App.tsx:164`: добавить `/provider/onboarding` в suppress-list bottom-nav (на время до удаления маршрута, потом снять).

## 4. P2

- **BUG-09** `VendorOnboarding.tsx`: при ошибке вставки `partner_applications` — rollback: `DELETE` созданного `providers` row, показать пользователю ошибку.
- **BUG-10** Защита от дублей: перед insert проверить существование `partner_applications` с тем же `contact_email` и `status IN ('pending','reviewing')` за последние 7 дней. Если есть — показать «У вас уже есть активная заявка, посмотреть статус» с ссылкой на `/partner/status`.
- **BUG-11** `PartnerApplicationsAdmin.tsx`: расширить `status` тип до `string`, добавить fallback в `statusConfig` для неизвестных значений (`?? statusConfig.pending`).
- **BUG-12** Sender domain: переключить оба edge function с `onboarding@resend.dev` на верифицированный домен через env `SENDER_DOMAIN` (если есть Lovable Emails) или оставить как fallback с TODO. Проверю `email_domain--check_email_domain_status` перед выбором.

## 5. Технические детали

**Файлы к правке:**
- `src/pages/vendor/VendorOnboarding.tsx`
- `src/pages/info/BecomePartnerPage.tsx`
- `src/pages/partner/PartnerStatusPage.tsx`
- `src/pages/admin/PartnerApplicationsAdmin.tsx`
- `src/components/layout/AnimatedRoutes.tsx`
- `src/components/layout/pageRegistry.ts`
- `src/App.tsx`
- `supabase/functions/approve-partner-application/index.ts`
- `supabase/functions/notify-admin-partner-application/index.ts`

**Файлы к удалению:**
- `src/pages/provider/ProviderOnboarding.tsx`

**Без изменений БД** — все правки на уровне кода и edge functions. Существующие данные не трогаем.

**Deploy:** обе edge function пересобрать через `deploy_edge_functions`.

## Acceptance

- `npm run build` зелёный, типы без `as never` в правленых файлах.
- `/provider/onboarding` редиректит на `/become-partner`.
- Vendor onboarding без email → блокируется на UI, в БД мусор не попадает.
- Повторная заявка от того же email за 7 дней → soft-block + ссылка на статус.
- Admin notification функция без JWT → 401.
- `PartnerStatusPage` отображается с шапкой и навигацией.

**Не входит в этот заход:** объединение `VendorOnboarding` и `BecomePartnerPage` в один canonical funnel (это P1-архитектура, отдельный спринт), rate-limiting, analytics_events, переезд email-инфры на Lovable Emails.