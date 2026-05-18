# Wave 1 · UNIQUE на `crm_contacts.email`

Цель: убрать существующие дубли по email и предотвратить новые — так, чтобы прод не падал на «duplicate key» при повторном лиде.

## Текущее состояние (по факту БД)

6 групп дублей, всего 7 «лишних» строк:
- `matthenss@me.com` ×3
- `compliance@sidracap.com`, `info@shuaa.com`, `info@squadroncapital.com`, `pavel@ignatevestate.com`, `sasitorn.suppasak@ignatevestate.com` — по 2

FK на `crm_contacts` нет, но 22 таблицы держат «мягкие» ссылки (`contact_id`, `owner_contact_id`, `crm_contact_id`, `buyer_contact_id`, `vendor_contact_id`) — нужно перенаправить до удаления.

## План

### Шаг 1. Миграция `merge + index + trigger` (один файл)

1. **Нормализация:** `UPDATE crm_contacts SET email = lower(trim(email)) WHERE email IS NOT NULL;`
2. **Канонизация дублей:** для каждой группы `lower(email)` выбираем самый старый `id` как canonical, остальные — `duplicates[]`.
3. **Repoint ссылок** во всех 22 таблицах (UPDATE … SET col = canonical WHERE col = ANY(duplicates)).
4. **Слияние данных:** в canonical докатываем непустые поля из дубликатов (`COALESCE`), складываем `tags` через `array_cat + DISTINCT`.
5. **Удаление дубликатов** из `crm_contacts`.
6. **Партиальный UNIQUE-индекс:**
   ```sql
   CREATE UNIQUE INDEX crm_contacts_email_unique
   ON public.crm_contacts (lower(email))
   WHERE email IS NOT NULL AND email <> '';
   ```
7. **BEFORE INSERT/UPDATE триггер `crm_contacts_normalize_email`:** `NEW.email = lower(trim(NEW.email))` если не NULL. Гарантирует, что индекс реально ловит коллизии по любому регистру.

### Шаг 2. Код — защита от падений

Точки записи в `crm_contacts` сейчас используют `.insert()` без `onConflict`:
- `src/hooks/useCrmContacts.ts:246` — основной create
- `src/hooks/useUniversalLead.ts:84` — лид-формы
- intake/import flows (`useIntakeAgent`, `ContactImportPage`, `ImportOdooContactsPage`, `VendorOutreachPanel`, `HotelManagementLeadSheet`, `MCCLeadsTab`)

Меняем `.insert(...).select().single()` → `.upsert(..., { onConflict: 'email', ignoreDuplicates: false }).select().single()` **только там, где email — естественный ключ дедупа** (create-from-form, лиды, intake). Для ручного «Add contact» в CRM оставляем `insert`, но ловим Postgres код `23505` и показываем тост «Контакт с таким email уже существует, открыть?» + переход на карточку существующего.

> Партиальный UNIQUE по `lower(email)` не даёт прямой `onConflict: 'email'`. Решение: вместо `upsert` использовать паттерн «select-then-insert»:
> ```ts
> const { data: existing } = await supabase
>   .from('crm_contacts').select('id').ilike('email', email).maybeSingle();
> if (existing) return existing;            // merge into existing
> const { data, error } = await supabase.from('crm_contacts').insert(...).select().single();
> ```
> Обернуть в один helper `getOrCreateContactByEmail(email, payload)` в `src/lib/crm/getOrCreateContact.ts` и применить во всех 5 публичных точках записи. Чисто, тестируемо, не зависит от deferrable constraints.

### Шаг 3. Smoke-проверка

- `psql` SELECT по 6 email — должно быть по 1 строке.
- Симуляция: повторная отправка лид-формы с тем же email → возвращает существующий контакт, ошибки нет, в `crm_contacts` не плодится.
- Build/типы зелёные.

## Технические детали

**Файлы:**
- `supabase/migrations/<timestamp>_crm_contacts_email_unique.sql` — нормализация, merge, repoint в 22 таблицах, UNIQUE-индекс, триггер.
- `src/lib/crm/getOrCreateContact.ts` — новый helper.
- Точечная правка 5 хуков/страниц на helper.

**Риски и митигация:**
- *Длинный UPDATE на 22 таблицах* — данных мало (десятки строк затронуты), миграция в одной транзакции безопасна.
- *Email с регистром в legacy-коде* — триггер нормализует, ilike в helper'е страхует.
- *Конкурентная вставка двух одинаковых email* — UNIQUE-индекс ловит на DB-уровне; helper ловит `23505` и повторяет SELECT.

## Что НЕ делаю в этой волне

- Не трогаю `phone` (там тоже дубли — отдельная задача, нужен формат E.164 нормализатор).
- Не сливаю `owner_properties` ↔ `properties` (DB-01 — Wave 2).
- Не переписываю архитектуру лид-хуков (LEAD-01 — Wave 3).

После approve — запускаю миграцию через `supabase--migration`, затем правлю код и проверяю билд.
