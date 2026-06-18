## Что сделаем

Четыре связанных блока: 1) кнопка «Помощь myUNO» на сервисных страницах, 2) новая вертикаль «Переезд» + 5 поставщиков в БД, 3) скрытие контактов вендоров во всём публичном UI, 4) аудит иконок мини-аппов.

---

### 1. CTA «Помощь myUNO» — единая точка обращений

**База:**
- Новая таблица `help_requests`: `topic` (visa | invest | business | relocation | property | legal | finance | general), `subject`, `message`, `urgency`, `user_id` (nullable — гостям тоже можно), `contact_email`, `contact_phone`, `preferred_channel` (in_app | whatsapp | email), `source_page`, `source_route`, `referral_code`, `status` (new/triaged/in_progress/closed), `assigned_to`, `language`. RLS: владелец видит свои + автор; staff/admin — все.
- Edge-функция `submit-help-request`:
  1. валидирует Zod-схему,
  2. INSERT в `help_requests`,
  3. UPSERT в `crm_contacts` по email/phone и создаёт `crm_tasks` (или `agent_deals` для invest/business) на менеджера через `crm_assignment_rules`,
  4. шлёт WhatsApp-алерт через существующий UltraMSG (admin number из `system_settings.admin_whatsapp`) + email менеджеру через Resend,
  5. возвращает `request_id` для UI.
- analytics events: `help_request_open`, `help_request_submit` с `topic` и `source_route`.

**UI:**
- Новый компонент `<ConciergeHelpCTA topic="visa" variant="card|inline|fab" />`:
  - card — большой блок «Нужна помощь с визой? Эксперт myUNO ответит в течение часа» + кнопка «Запросить помощь».
  - inline — компактная плашка после hero.
  - fab — плавающая кнопка снизу справа для длинных страниц.
- Открывает `<ConciergeHelpSheet>` (shadcn Sheet): topic уже выбран, поля subject/message/urgency/preferred_channel, для гостя — email + phone. Success-state «Менеджер свяжется через myUNO», ссылка на `/me/requests`.

**Куда встраиваем (приоритет):**
- Visa: `legal/VisaComparePage`, `legal/TaxStructuringLanding`, `legal/LegalServicesIndex`, все `/legal/visa/*` детальные.
- Invest: `invest/InvestInThailand`, `InvestmentHub`, `InvestmentProjectDetail`, `property/OffplanIndex`, `property/OffplanDetail`.
- Business: `ForBusinessPage`, `ForDevelopers`, `services/legal-services` (incorporation).
- Relocation: новая `relocate/MoversIndex`, `relocate/RelocationDashboard`.
- Общий fab — на всех `/*Index` каталогах (через `MiniAppLayout`-проп `helpTopic`).

---

### 2. Вертикаль «Переезд» (movers, packing, storage transfer)

**Таксономия и роутинг:**
- В `src/lib/catalog/taxonomy.ts` в кластер `live` добавить категорию `relocation-services` → сервисы `movers`, `packing`, `storage-transfer`, `international-moving`, `pet-relocation` с тегами persona=`relocation,family`, jtbd=`B`.
- Routes: `/relocate/movers` (`MoversIndex`), `/relocate/movers/:slug` (`MoverDetail` — без контактов), `/relocate/movers/book` (`MoversBookingForm` — заявка через единый ConciergeHelp флоу с topic=relocation).
- Регистрация в `pageRegistry.ts` + `AnimatedRoutes.tsx`.

**Контент-страница `MoversIndex`:**
- Hero «Переезд под ключ» + список 5 типов услуг (упаковка, локальные перевозки, международный переезд, хранение, питомцы).
- Карточки 5 поставщиков (имя, район, специализация, бейдж «Проверен myUNO») **без контактов** — кнопка «Запросить через myUNO» вместо телефона/email.
- Блок «Как это работает» (3 шага) + CTA-форма.

**База — 5 реальных поставщиков:**
- Через Firecrawl (web search «moving company Phuket» + scrape) собираем 5 компаний: Allied Pickfords Thailand, Asian Tigers Mobility, Santa Fe Relocation, AGS Movers Thailand, Crown Relocations.
- INSERT в `vendor_prospects` с `category='relocation-services'`, `status='prospect'`, заполненными `business_name/website/phone/email/address/district`, `ai_recommended_plan='outreach'`.
- На фронте `MoversIndex` показывает их через VIEW `v_public_movers` (SELECT business_name, district, source_data->'specialties' — БЕЗ phone/email/whatsapp), которая отдаётся anon-роли.

---

### 3. Скрытие контактов поставщиков во всём B2C-UI

**Принцип:** на публичных страницах (anon + authenticated consumer) кнопка `«Запросить через myUNO»` вместо телефона/email/whatsapp. Контакты остаются доступны staff/admin/management_company через свои дашборды.

**Скоуп правок (по результатам аудита `rg`):**
- `src/pages/market/VendorPage.tsx`
- `src/pages/services/ServiceProviderDetail.tsx`
- `src/pages/classifieds/ClassifiedDetailPage.tsx`
- `src/pages/property/DeveloperDetail.tsx` (телефон/whatsapp застройщика → CTA)
- `src/pages/property/PropertyDetail*` (контакты управляющей компании)
- Карточки в `src/components/listings/*`, `src/components/services/ServiceProviderCard.tsx`, `src/components/vendor/*Card.tsx`
- Везде, где есть `WhatsAppOrderContact` для B2C-флоу — заменить на `<ConciergeRequestButton listingId vendorId topic="services">`.
- Исключения (не трогаем): `owner/VendorDirectoryPage`, `admin/*`, `mc/*`, partner-onboarding, support-страницы.

**Единый компонент `<ConciergeRequestButton>`** — обёртка над `ConciergeHelpSheet`, прокидывает `listing_id`/`vendor_id` в `source_data`, чтобы менеджер видел контекст. После отправки — сам выдёргивает контакт вендора и связывает обе стороны.

---

### 4. Аудит иконок мини-аппов на главной

- Скрипт-проверка `scripts/audit-icons.ts`: проходит по `FLAT_SERVICES` из `taxonomy.ts`, сверяет с маршрутами в `APP_ROUTES`, проверяет наличие `icon`-поля. Выводит таблицу: сервис → есть ли в PersonalGrid → есть ли в ClusterRail → есть ли в AppDrawer → есть ли иконка.
- На основании отчёта: добавляем недостающие entries в `taxonomy.ts` (movers и др. новые), назначаем lucide-иконки, фиксим персонные теги для visibility в `ROLE_VISIBLE_CLUSTERS`.
- Проверка покрытия: `AppDrawer` (универсальный launcher) должен показывать **все** доступные `FLAT_SERVICES` с фильтром по поиску и кластеру — если каких-то нет, добавляем.
- Добавить в `AppDrawer` явный быстрый доступ к «Помощь myUNO» (отдельная закреплённая иконка сверху).

---

## Технические детали

**Таблицы (migration #1):**

```sql
CREATE TABLE public.help_requests (
  id uuid pk, user_id uuid (nullable, FK auth.users),
  topic text NOT NULL CHECK (topic IN ('visa','invest','business','relocation','property','legal','finance','general')),
  subject text, message text NOT NULL,
  urgency text DEFAULT 'normal',
  contact_email text, contact_phone text,
  preferred_channel text DEFAULT 'in_app',
  language text DEFAULT 'ru',
  source_page text, source_route text, referral_code text,
  vendor_id uuid (nullable), listing_id uuid (nullable),
  status text DEFAULT 'new',
  assigned_to uuid (nullable),
  crm_contact_id uuid, crm_task_id uuid,
  created_at, updated_at
);
GRANT SELECT, INSERT ON public.help_requests TO authenticated;
GRANT INSERT ON public.help_requests TO anon;  -- гостевые заявки
GRANT ALL ON public.help_requests TO service_role;
-- RLS: INSERT всем; SELECT — только owner (user_id = auth.uid()) или staff (has_role).
```

**Edge function:** `supabase/functions/submit-help-request/index.ts` (Deno 2.0, CORS, Zod-валидация, использует `_shared/admin-config.ts` для admin контактов).

**VIEW для публичного списка movers (migration #2):**

```sql
CREATE VIEW public.v_public_movers AS
SELECT id, business_name, business_name_ru, district, city, website,
       source_data->'specialties' AS specialties,
       source_data->'languages' AS languages
FROM public.vendor_prospects
WHERE category='relocation-services' AND status IN ('prospect','active');
GRANT SELECT ON public.v_public_movers TO anon, authenticated;
```

**Список новых/изменённых файлов:**
- `supabase/migrations/*_help_requests.sql`, `*_movers_view.sql`
- `supabase/functions/submit-help-request/index.ts`
- `src/components/concierge/ConciergeHelpSheet.tsx`, `ConciergeHelpCTA.tsx`, `ConciergeRequestButton.tsx`
- `src/hooks/useHelpRequest.ts`
- `src/pages/relocate/MoversIndex.tsx`, `MoverDetail.tsx`
- `src/lib/catalog/taxonomy.ts` (правка), `pageRegistry.ts`, `AnimatedRoutes.tsx`, `routes.ts`
- Точечные правки ~12 страниц/карточек для скрытия контактов
- `scripts/audit-icons.ts` (одноразовый), `AppDrawer.tsx` (доработка)

**Аналитика:** все события (`help_request_open/submit`, `concierge_request_click`, `mover_view`) пишутся в `analytics_events` и появятся в существующем `AdminAnalyticsDashboard`.

---

## Что НЕ делаем сейчас (вне скоупа)

- Не подключаем Stripe для платных консультаций (топик `help_request` — бесплатный pre-sale).
- Не пишем outreach-кампанию к 5 movers — только заносим в БД как `prospect`, дальше ваш существующий `outreach-agent`.
- Не меняем 5-зонную структуру Home — только улучшаем покрытие иконок и `AppDrawer`.
- Не трогаем admin/MC/staff экраны — там контакты остаются видимыми.

---

## Порядок реализации (4 этапа)

```text
1. DB: миграции help_requests + v_public_movers           (≈1 шаг)
2. Backend: edge function submit-help-request             (≈1 шаг)
3. Frontend: ConciergeHelpSheet + Sheet + кнопки          (≈1 шаг)
4. Контент: MoversIndex + 5 prospects + аудит иконок     (≈1 шаг)
5. Скрытие контактов: точечные правки ~12 страниц         (≈1 шаг)
```

**Рекомендую:** идти в указанном порядке. После шага 2 кнопки можно вставлять параллельно с moving-вертикалью.
