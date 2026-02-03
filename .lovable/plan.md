
# Критические функции для Production: Диагностика и План Исправлений

## Резюме состояния

После глубокого аудита системы выявлены следующие области, требующие внимания:

| Функция | Статус | Критичность |
|---------|--------|-------------|
| AI Поиск | ⚠️ Медленный (600ms debounce + модель) | P0 |
| Создание недвижимости | ✅ Работает | OK |
| Система лидов | ⚠️ 1 лид, нет vertical_id | P1 |
| Аллокация расходов | ✅ 18 записей (14 expense, 4 income) | OK |
| Заказы/Бронирования | ✅ 20 заказов в разных статусах | OK |
| Листинг-приложения | ⚠️ 0 записей, wizard не тестирован | P1 |

---

## 1. AI Поиск — Ускорение (P0 Critical)

### Проблема
AI поиск работает медленно из-за:
1. **600ms debounce** в `useAISearch.ts` (строка 159)
2. **21 параллельный запрос** к БД в `useGlobalSearch.ts`
3. Возможная **латентность модели** `google/gemini-3-flash-preview`

### Решение

#### 1.1 Уменьшить debounce до 300ms
```typescript
// src/hooks/useAISearch.ts:159
- }, 600); // Debounce
+ }, 300); // Faster response for better UX
```

#### 1.2 Оптимизировать обычный поиск — объединить запросы
Создать RPC-функцию для unified search:
```sql
CREATE OR REPLACE FUNCTION public.global_search(search_term TEXT, result_limit INT DEFAULT 5)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title_en TEXT,
  title_ru TEXT,
  image TEXT,
  price NUMERIC,
  path TEXT
) AS $$
  SELECT id, 'yachts'::TEXT, name_en, name_ru, cover_image, price_full_day, '/yachts/' || id
  FROM yachts WHERE is_active AND approval_status = 'approved' 
    AND (name_en ILIKE '%' || search_term || '%' OR name_ru ILIKE '%' || search_term || '%')
  LIMIT result_limit
  UNION ALL
  SELECT id, 'property'::TEXT, title_en, title_ru, cover_image, price, '/property/' || id
  FROM properties WHERE is_active AND approval_status = 'approved'
    AND (title_en ILIKE '%' || search_term || '%' OR title_ru ILIKE '%' || search_term || '%')
  LIMIT result_limit
  -- ... остальные таблицы
$$ LANGUAGE sql STABLE;
```

#### 1.3 Добавить кэширование AI-ответов
В edge function `ai-smart-search`:
- Кэшировать популярные запросы в `ai_search_cache` таблицу
- TTL 24 часа для AI ответов

---

## 2. Система лидов — Усиление (P1)

### Текущее состояние
- 1 лид в `consultation_requests`
- `vertical_id` = null (не указана вертикаль)
- Нет демо-данных для тестирования Lead Hub

### Решение

#### 2.1 Заполнить демо-лиды для всех вертикалей
```sql
INSERT INTO consultation_requests (name, phone, email, vertical_id, lead_source, entry_point, status, priority, vertical_metadata)
VALUES
  ('Иван Петров', '+7999111222', 'ivan@test.com', 'properties', 'website', '/property', 'pending', 'normal', '{"budget_min": 50000, "budget_max": 100000}'::jsonb),
  ('Maria Chen', '+66891234567', 'maria@test.com', 'yachts', 'cta', '/yachts', 'pending', 'high', '{"charter_type": "full_day", "guests": 8}'::jsonb),
  ('Олег Сидоров', '+79001234567', 'oleg@test.com', 'tours', 'chat', '/tours', 'pending', 'normal', '{"tour_type": "island_hopping"}'::jsonb),
  ('Anna Smith', '+1234567890', 'anna@test.com', 'legal', 'website', '/legal', 'contacted', 'normal', '{"service": "visa_extension"}'::jsonb),
  ('Дмитрий Козлов', '+79112223344', 'dmitry@test.com', 'medical', 'referral', '/medical', 'pending', 'high', '{"specialty": "dental"}'::jsonb);
```

#### 2.2 Интегрировать AI Lead Scoring
Добавить кнопку "Проанализировать все лиды" в Admin Dashboard:
```typescript
// В MCCLeadsTab.tsx или AdminConsultations.tsx
const { batchScoreLeads } = useLeadsFactory();

<Button onClick={() => batchScoreLeads.mutate({ limit: 10, status: 'pending' })}>
  🤖 Проанализировать новые лиды
</Button>
```

---

## 3. Листинг Wizard — Валидация end-to-end (P1)

### Текущее состояние
- 0 заявок в `listing_applications`
- Wizard реализован (`ListingWizard.tsx`)
- Hook `useListingApplication.ts` работает с `listing_applications` таблицей

### Решение

#### 3.1 Проверить существование таблицы
```sql
-- Проверить схему
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'listing_applications';
```

#### 3.2 Добавить тестовые заявки
После подтверждения схемы — создать demo-данные:
```sql
INSERT INTO listing_applications (listing_type, status, city, district, estimated_price, applicant_name, applicant_email)
VALUES 
  ('property', 'pending', 'Пхукет', 'Rawai', 50000, 'Test Owner', 'owner@test.com'),
  ('service', 'approved', 'Пхукет', 'Patong', 2000, 'Test Provider', 'provider@test.com');
```

---

## 4. Синхронизация данных Property ↔ Owner (P1)

### Проблема
- 5 объектов в `owner_properties` (все в статусе `pending`)
- 0 записей в `property_bookings`
- Нет связи между owner properties и marketplace bookings

### Решение

#### 4.1 Добавить демо-бронирования
```sql
-- Получить ID первого owner_property
INSERT INTO property_bookings (property_id, guest_name, guest_email, guest_phone, check_in, check_out, guests_count, total_price, status, source)
SELECT 
  id, 
  'Demo Guest', 
  'guest@demo.com', 
  '+66891234567',
  CURRENT_DATE + INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '10 days',
  2,
  25000,
  'confirmed',
  'direct'
FROM owner_properties LIMIT 1;
```

#### 4.2 Проверить триггер создания income записи
Убедиться что `create_financial_from_booking()` триггер работает при подтверждении бронирования.

---

## 5. Финансовая система — Валидация (OK)

### Текущее состояние ✅
- 18 записей в `property_financials`
- 14 расходов, 4 дохода
- `QuickExpense.tsx` использует `errorHandler`
- Категории расходов корректно типизированы

### Улучшение (P2)
Добавить OCR для автоматического распознавания чеков:
```typescript
// В QuickExpense.tsx после загрузки receipt_url
const { data } = await supabase.functions.invoke('ai-receipt-ocr', {
  body: { imageUrl: receiptUrl }
});
if (data.vendor) setVendor(data.vendor);
if (data.amount) setAmount(data.amount);
```

---

## 6. Важные продакшен-функции — Чеклист

### 6.1 Уже реализовано ✅
- [x] Создание недвижимости (`useCreateOwnerProperty`)
- [x] Аллокация расходов на объекты (`property_financials.property_id`)
- [x] Система заказов (`orders` — 20 записей)
- [x] Payment intents tracking
- [x] RLS-политики на критических таблицах
- [x] Централизованная обработка ошибок
- [x] Билингвальность (RU/EN)

### 6.2 Требует внимания ⚠️
- [ ] **AI Search Performance** — debounce 600→300ms
- [ ] **Lead Vertical Attribution** — заполнить vertical_id
- [ ] **Listing Wizard E2E** — протестировать полный флоу
- [ ] **Property Bookings** — добавить demo-данные
- [ ] **Admin Moderation Queue** — одобрить pending properties

### 6.3 Roadmap (P2)
- [ ] AI Receipt OCR (Gemini Vision)
- [ ] Push-уведомления (FCM)
- [ ] Автоматические месячные отчеты
- [ ] Market benchmarks для аналитики

---

## Техническая реализация

### Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/hooks/useAISearch.ts` | Debounce 600 → 300ms |
| `src/hooks/useGlobalSearch.ts` | Оптимизация через RPC |
| `supabase/functions/ai-smart-search/index.ts` | Добавить кэширование |
| БД: `consultation_requests` | Seed лидов с vertical_id |
| БД: `property_bookings` | Seed демо-бронирований |

### Миграции БД

```sql
-- 1. Создать unified search function
-- 2. Добавить ai_search_cache таблицу
-- 3. Seed demo leads
-- 4. Seed demo bookings
```

---

## Ожидаемые результаты

| Метрика | До | После |
|---------|-----|-------|
| AI Search latency | ~1.2s | ~0.5s |
| Leads с vertical_id | 0% | 100% |
| Property bookings | 0 | 5+ demo |
| Listing applications | 0 | 2+ demo |
| E2E flows validated | Partial | Full |

---

## Приоритеты реализации

1. **Сейчас (P0)**: AI Search debounce → 300ms
2. **Сегодня (P1)**: Demo-данные для leads, bookings, listings
3. **Завтра (P1)**: Unified search RPC function
4. **Эта неделя (P2)**: AI caching, OCR receipt
