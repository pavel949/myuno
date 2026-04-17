
## План: Шаги 3 и 4 (привязка девелоперов и унификация типов)

### Шаг 3 — Claim Invite (привязка существующих 40 девелоперов к auth)

**Edge function `devmod-claim-invite`** (admin-only):
- Вход: `{ developer_id, email }`
- Логика: создаёт magic link через `supabase.auth.admin.generateLink({ type: 'magiclink', email })`, redirect на `/developer-portal/accept-claim?developer_id=...`
- Отправляет письмо через Resend (шаблон RU/EN: «Заявите права на профиль застройщика»)
- Возвращает `{ success, link, expires_at }`

**Страница `/developer-portal/accept-claim`** (новая):
- Читает `developer_id` из query
- Если юзер залогинен и `developers.user_id IS NULL` → UPDATE `user_id = auth.uid()`, INSERT в `developer_users` (role='owner', status='active')
- Редирект на `/developer-portal`

**Маршрут**: добавить в `AnimatedRoutes.tsx` + `routes.ts` (`DEVELOPER_PORTAL_ACCEPT_CLAIM`).

**Admin UI в `CapitalDevelopersPending.tsx`**:
- Добавить вкладку «All developers» (поверх pending)
- Для каждого с `user_id IS NULL` — кнопка «Send claim invite» → input email → invoke `devmod-claim-invite`
- Бейдж статуса: «Unclaimed» / «Claimed by {email}»

**Обновить хук** `useDeveloperOnboarding.ts`:
- Добавить `useAllDevelopersForClaim()` (все девелоперы + информацию о user_id)
- Добавить `useSendClaimInvite()` mutation

### Шаг 4 — Унификация Developer-интерфейса

Сейчас 2 несовместимых типа:
- `useDevelopers.ts` → camelCase (`nameEn`, `totalUnitsSold`)
- `useAdminDevelopers.ts` → snake_case (`name_en`, `total_units_delivered`)

**Решение** (минимальный риск): держим snake_case как канон (БД-нативно), camelCase делаем алиасами через адаптер.

1. Создать `src/lib/adapters/developerAdapter.ts`:
   ```ts
   export type DeveloperRow = { /* snake_case из БД */ }
   export type DeveloperUI = DeveloperRow & {
     nameEn: string; nameRu: string; logoUrl: string|null;
     coverImage: string|null; descriptionEn: string|null;
     descriptionRu: string|null; projectsCompleted: number;
     totalUnitsSold: number; totalUnitsDelivered: number;
     projectsOngoing: number; isVerified: boolean;
     isFeatured: boolean; muunoScore: number|null;
   }
   export function toDeveloperUI(row: DeveloperRow): DeveloperUI
   ```
2. `useDevelopers.ts` — переписать через `toDeveloperUI`, экспорт `Developer = DeveloperUI` (обратная совместимость).
3. `useAdminDevelopers.ts` — расширить `Developer` interface полями `total_units_sold`, `founded_year`, `address` (которые есть в БД, но отсутствуют в admin-типе).
4. Все потребители продолжают работать без правок (camelCase поля сохраняются).

### Файлы

| Файл | Изменение |
|---|---|
| `supabase/functions/devmod-claim-invite/index.ts` | Новый (Deno + Resend + admin auth) |
| `src/pages/developer-portal/DeveloperAcceptClaim.tsx` | Новая страница |
| `src/components/layout/pageRegistry.ts` | + lazy import |
| `src/components/layout/AnimatedRoutes.tsx` | + route `/developer-portal/accept-claim` |
| `src/lib/config/routes.ts` | + `DEVELOPER_PORTAL_ACCEPT_CLAIM` |
| `src/hooks/useDeveloperOnboarding.ts` | + `useAllDevelopersForClaim`, `useSendClaimInvite` |
| `src/pages/capital/CapitalDevelopersPending.tsx` | + Tabs «Pending / All» + кнопка claim invite |
| `src/lib/adapters/developerAdapter.ts` | Новый (унификация типов) |
| `src/hooks/useDevelopers.ts` | Использовать адаптер |
| `src/hooks/useAdminDevelopers.ts` | Расширить Developer interface |

**Секреты**: `RESEND_API_KEY` уже есть в проекте (используется `notify-admin-partner-application`). Дополнительные секреты не нужны.

**Время**: ~15 минут.
