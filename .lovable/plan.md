

# Аудит блока Developers

## ✅ Что готово и работает

### Публичная часть (B2C)
| Маршрут | Файл | Статус |
|---|---|---|
| `/property/developers` | `DevelopersIndex.tsx` | ✅ Работает (40 застройщиков из `developers`, фильтр `is_active`) |
| `/property/developers/:id` | `DeveloperDetail.tsx` | ✅ Профиль + список offplan-проектов |
| `/newbuilds/developers` | `NewbuildsDevelopers.tsx` | ✅ Каталог с тёмной темой, счётчик проектов |
| `/newbuilds/developers/:slug` | `NewbuildDeveloperDetail.tsx` | ✅ |
| `/for-developers` | `ForDevelopers.tsx` | ✅ Лендинг "стать застройщиком" |

### Developer Portal (B2B кабинет) — структура есть, **9 страниц зарегистрированы**
| Маршрут | Страница | Готовность |
|---|---|---|
| `/developer-portal/apply` | DeveloperApply | ✅ Форма заявки → `devmod-apply` edge |
| `/developer-portal/onboarding[/:step]` | DeveloperOnboarding (467 строк) | ✅ Onboarding wizard + Stripe Connect |
| `/developer-portal/pending` | DeveloperPending | ✅ Поллинг `devmod_status` |
| `/developer-portal/accept-invite` | DeveloperAcceptInvite | ✅ Приём инвайта |
| `/developer-portal` | DeveloperOverview | ✅ KPI, recent leads, attention items |
| `/developer-portal/projects` | DeveloperProjects | ✅ |
| `/developer-portal/projects/new` и `/:id` | DeveloperProjectEditor (758 строк!) | ✅ Самый крупный — юниты, документы, floor plans |
| `/developer-portal/company` | DeveloperCompany | ✅ Профиль компании |
| `/developer-portal/leads` | DeveloperLeads + LeadDetail | ✅ CRM-таблица + CSV экспорт |
| `/developer-portal/analytics` | DeveloperAnalytics | ✅ Recharts (3 графика) |

### Backend (полностью готов)
- **11 edge-функций**: `devmod-apply`, `devmod-approve`, `devmod-buyer-kyc`, `devmod-create-booking-checkout`, `devmod-invite-team`, `devmod-masked-channel-create`, `devmod-release-holds`, `devmod-resend-inbound`, `devmod-stripe-onboard`, `devmod-stripe-webhook`, `devmod-unit-hold`
- **Таблицы БД**: `developers` (40 записей), `developer_users` (0!), `nb_leads` (3), `property_projects` (267, из них 53 с `developer_id`), `project_units`, `floor_plans`, `property_documents`, `commission_agreements`, `reservations`, `rln_events` — все есть.
- RLS policies: ✅ настроены (admin + devmod broker)

---

## ❌ Что НЕ работает / не сделано

### 🔴 Критично — ломает поток

1. **`/developer-portal/team` — НЕ зарегистрирован в роутере**  
   `DeveloperPortalLayout.tsx:20` имеет ссылку "Команда" → `APP_ROUTES.DEVELOPER_PORTAL_TEAM`, страница `DeveloperTeam.tsx` существует и подключает `devmod-invite-team`, но в `AnimatedRoutes.tsx` (строки 285–298) **route отсутствует** → клик по "Команда" даст 404. `developer_users` = 0 записей.

2. **`/capital/developers/pending` — НЕ зарегистрирован**  
   `APP_ROUTES.CAPITAL_DEVELOPERS_PENDING` определён, страница `CapitalDevelopersPending.tsx` (231 строка) с approve/reject + `usePendingDevelopers`/`useApproveDeveloper` готова, но route в `AnimatedRoutes.tsx` отсутствует → админ не может одобрять заявки через UI. Сейчас все 40 девелоперов в БД уже `devmod_status='active'`, новые заявки повиснут.

3. **`/developer-portal/onboarding/stripe-return` — НЕ зарегистрирован**  
   `APP_ROUTES.DEVELOPER_PORTAL_STRIPE_RETURN` определён (для return_url из Stripe Connect), но route отсутствует → пользователь после onboarding в Stripe вернётся на 404.

4. **Все 40 застройщиков имеют `user_id = NULL`**  
   Никто из существующих компаний не привязан к auth-аккаунту → ни один реальный `useDeveloperProfile()` не сработает, портал не откроется. Это data-issue: импорт прошёл без owner-привязки.

### 🟡 Средне — частичный функционал

5. **DeveloperProjectEditor (758 строк) использует `as any` касты**  
   `project_units`, `floor_plans`, `nb_project_updates` обходятся через `(supabase.from(... as any) as any)` — обходные пути после повреждения `types.ts`. Работает, но без типобезопасности; `nb_project_updates` нет в БД (есть только `nb_leads`).

6. **`nb_project_updates` таблица отсутствует в БД**  
   Хук `useDeveloperPortal.ts:228-254` пишет/читает `nb_project_updates` — таблица не создана → "Project updates" feature мёртвая.

7. **`development_units` в БД есть, но в портале не используется**  
   Public-каталог должен показывать витрину юнитов, но используется только operational `project_units`. Маппинг operational → public не реализован.

8. **`useAdminDevelopers` ≠ `Developer`-интерфейсу из `useDevelopers`**  
   Два разных интерфейса (`name_en` vs `nameEn`, `total_units_delivered` vs `totalUnitsSold`) — приводит к мелким багам в админке.

9. **Storage bucket для документов**  
   Есть только `project-images`. Для `property_documents` (юр. документы) bucket не создан → загрузка документов в `DeveloperProjectEditor` упадёт.

10. **Counter `projects_completed` не пересчитывается**  
    `developers.projects_completed = 0` у всех, хотя 53 проекта привязаны к `developer_id`. Trigger/RPC отсутствует → KPI везде нули.

### 🟢 Косметика

11. `DeveloperOverview` использует ссылки `/developer-portal/projects/${p.id}` напрямую (не через `APP_ROUTES`).
12. `DeveloperOnboarding.tsx:174` пишет `devmod_status: 'pending'` вручную — дублирует то, что уже делает `devmod-apply`.
13. `DeveloperApply` страница и `DeveloperOnboarding` пересекаются — два входа в регистрацию, путает пользователя.
14. Нет навигации к `/developer-portal/apply` из публичных страниц `/property/developers` и `/newbuilds/developers` — только через `/for-developers`.

---

## План доводки (5 шагов, ~30 мин)

```text
ШАГ 1. Routing patch (AnimatedRoutes.tsx)
  + <Route path="team" .../>             в блок /developer-portal
  + <Route path="onboarding/stripe-return" .../>
  + <Route path="/capital/developers/pending" .../>

ШАГ 2. Migration: missing infra
  - CREATE TABLE nb_project_updates (project_id, title, body, published_at, ...)
  - CREATE BUCKET developer-documents (private, RLS by developer_id)
  - CREATE TRIGGER refresh developers.projects_completed AFTER INSERT/UPDATE/DELETE on property_projects

ШАГ 3. Data fix — link existing developers to auth
  - Edge func или admin UI чтобы Pavel мог bind developer.user_id
  - Или: показывать в админке кнопку "Send claim invite" → создаёт magic link

ШАГ 4. Unify Developer interface
  - Привести useAdminDevelopers к camelCase из useDevelopers
  - Добавить total_units_delivered / projects_ongoing alias

ШАГ 5. UX склейка
  - На /property/developers + /newbuilds/developers добавить CTA «Я застройщик»
  - Убрать дублирование DeveloperApply ↔ DeveloperOnboarding step 1
  - Заменить хардкод-пути на APP_ROUTES в DeveloperOverview
```

### Итог

- **Каркас на 90% готов**: 11 edge-функций, 12 страниц портала, 4 публичные страницы, БД-схема с RLS — всё есть.
- **3 критичных пропуска роутов** делают портал нерабочим (team / stripe-return / capital pending).
- **3 data-проблемы** (нет user_id-привязки, нет `nb_project_updates`, нет developer-documents bucket) блокируют первый реальный сценарий "новый застройщик регистрируется → грузит документы → шлёт инвайты".
- После 5 шагов выше блок становится production-ready для onboarding первых живых застройщиков.

