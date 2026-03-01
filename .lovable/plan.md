

# Раздел управления подписками УК в админ-панели

## Текущее состояние

Существует `AdminMCDashboard` (`/admin/mc-dashboard`) с обзором всех УК, KPI-карточками и деталями в Sheet. Однако **нет отдельного раздела для управления подписками** — только базовые badge-статусы (Subscribed/Trial) и Stripe ID в деталях компании. Администратор не может:
- Видеть историю платежей и MRR
- Управлять слотами компании вручную (добавить/убрать бесплатные слоты)
- Приостановить или отменить подписку
- Видеть сводную аналитику по доходам от подписок

## Что будет реализовано

### 1. Новая вкладка "Subscriptions" в AdminMCDashboard

Добавить Tabs-навигацию в существующий `AdminMCDashboard.tsx` с двумя вкладками:
- **Overview** (текущий контент) — список компаний с фильтрами
- **Subscriptions** (новый) — сводка подписок и управление

### 2. Компонент AdminMCSubscriptions

Новый файл `src/components/admin/mc/AdminMCSubscriptions.tsx`:

**Блок KPI (верхняя полоса):**
- MRR (Monthly Recurring Revenue) — сумма paid_slots x $25 по всем активным подпискам
- Всего подписчиков / Пробный период / Отменённые
- Средний чек / Средний размер портфолио

**Таблица подписок:**
- Название УК, план (Starter/Professional/Enterprise/Custom), оплаченные слоты, использованные слоты, статус (Active/Trial/Cancelled/Past Due), дата начала, следующий платёж
- Фильтры: All / Active / Trial / Cancelled / Past Due
- Поиск по названию

**Действия администратора (в строке или в Sheet):**
- "Grant Free Slots" — добавить бесплатные слоты компании (обновление `paid_slots` напрямую в БД без Stripe)
- "View in Stripe" — ссылка на Stripe Dashboard (для stripe_customer_id)
- "Toggle Active" — приостановка/активация компании

### 3. Миграция БД

Добавить колонку `free_slots` (integer, default 0) в `management_companies` — для учёта бесплатных/промо-слотов, выданных администратором (отдельно от paid_slots через Stripe).

### 4. Edge Function: admin-manage-mc-subscription

Новый `supabase/functions/admin-manage-mc-subscription/index.ts`:
- Принимает: `company_id`, `action` (grant_slots | revoke_slots | toggle_active)
- Проверяет: JWT + роль admin через `has_role()`
- Действия:
  - `grant_slots`: обновляет `free_slots` в management_companies
  - `toggle_active`: переключает `is_active`
- Аудит: записывает действие в audit_logs

---

## Технические детали

### Новые файлы
1. `src/components/admin/mc/AdminMCSubscriptions.tsx` — UI таблицы подписок с KPI
2. `supabase/functions/admin-manage-mc-subscription/index.ts` — Edge Function для управления

### Изменяемые файлы
3. `src/pages/admin/AdminMCDashboard.tsx` — добавить Tabs (Overview / Subscriptions)
4. `src/integrations/supabase/types.ts` — автообновление после миграции

### Миграция
- `ALTER TABLE management_companies ADD COLUMN free_slots integer NOT NULL DEFAULT 0;`
- Обновить Edge Function `check-mc-subscription` чтобы учитывать `paid_slots + free_slots` как общее количество доступных слотов

### Безопасность
- Edge Function проверяет `has_role(user_id, 'admin')` перед любым действием
- Все изменения логируются в `admin_audit_logs`

