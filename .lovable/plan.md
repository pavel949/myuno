

User wants comprehensive check of Real Estate block — what works, what doesn't, what's good, what's bad. Different from prior audit (which gave scores) — now wants concrete operational status: какие страницы открываются, какие формы шлют данные, какие показывают ошибки.

Plan: live operational check, not theoretical scoring.

## План: Операционная проверка блока «Недвижимость»

### Что сделаю

**1. Проверка маршрутов (живая)**
Через preview пройду по всем ключевым URL real-estate блока и зафиксирую:
- HTTP статус (200 / 404 / blank)
- Console errors (если есть)
- Загружаются ли данные

Список (≈18 страниц):
- `/property` — главный хаб
- `/property/rent`, `/property/buy`, `/property/resale`, `/property/my`
- `/property/:id` — карточка объекта
- `/newbuilds` — новостройки
- `/newbuilds/:slug` — карточка ЖК
- `/newbuilds/area/:slug` — район
- `/newbuilds/developer/:slug` — застройщик
- `/p/:slug` — микросайт
- `/property/offplan/:id` → редирект
- `/developer-portal` — портал застройщика
- `/developer-portal/register`, `/login`, `/dashboard`, `/projects`
- `/admin/properties`, `/admin/newbuilds`, `/admin/developers`

**2. Проверка функционала (через БД + код)**
- **Формы лидов:** свежесть записей в `nb_leads`, `viewing_requests`, `consultation_requests`, `property_viewings` за 7 дней
- **CRM связка:** идут ли лиды в `crm_contacts` (UTM, source)
- **Бронирования:** последние записи в `property_bookings` + статус
- **Платежи:** `payment_intents` для real-estate сценариев
- **Микросайты:** сколько проектов имеют `landing_enabled = true`, какие slugs работают
- **Модерация:** очередь `approval_status = 'pending'` в `property_projects`
- **Developer Portal:** есть ли реальные регистрации в `developer_users` (на прошлой проверке было 0)

**3. Проверка качества данных**
- `property_projects` — сколько без `cover_image`, без `developer_id`, без `slug`, без `lat/lng`
- `developers` — сколько без `logo_url`, без `description_ru`
- `properties` — сколько `is_active=true` но без фото
- Битые ссылки (cover_image указывает на 404)

**4. Edge Functions health**
Логи за 24h по функциям:
- `newbuilds-search`, `newbuilds-lead-create`
- `property-viewing-request`, `property-inquiry`
- `developer-portal-*`
Считаем error rate.

**5. Mobile UX spot-check**
На viewport 375px проверю:
- `/property` — фильтры (sheet vs dialog)
- `/newbuilds` — карточки
- `/p/:slug` — микросайт
- Sticky CTA на детальных страницах

### Формат отчёта

Markdown в чате (~40 строк), 4 секции:

**✅ Работает хорошо**
- Список 5-10 пунктов с доказательствами

**⚠️ Работает, но с проблемами**
- 5-8 пунктов: что именно ломается, какой сценарий

**❌ Не работает**
- Конкретные баги с reproduction steps

**📊 Качество данных**
- Таблица: метрика → значение → норма → статус

Плюс **Top-5 quick wins** — что починить за 30 минут.

### Что НЕ делаю
- Никаких правок кода
- Не запускаю смоук-тест Developer Portal через регистрацию (только смотрю текущее состояние)
- Не правлю битые данные

### Время
~5-7 минут.

