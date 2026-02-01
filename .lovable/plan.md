
# Стратегический аудит: myUNO как "The Only App You Need Abroad"

## Текущее состояние платформы

myUNO уже имеет впечатляющую инфраструктуру:
- **40+ вертикалей**: туры, яхты, транспорт, недвижимость, красота, медицина, образование, юристы, страховки и т.д.
- **Полная бэкенд-инфраструктура**: 100+ таблиц, Edge Functions, AI-агенты
- **Vendor/Owner/Admin порталы**: полноценные дашборды для всех типов пользователей
- **Wallet + Cashback система**: лояльность и удержание
- **Персонализация**: персоны (турист/резидент/владелец), AI-рекомендации

---

## Анализ лидеров вертикалей и GAP-анализ

### 1. ТУРЫ И АКТИВНОСТИ (Klook, GetYourGuide, Viator)

**Что есть у лидеров:**
- Мгновенное подтверждение бронирования
- Мобильные ваучеры с QR-кодами
- Бесплатная отмена за 24 часа
- Групповые скидки
- Комбо-предложения (тур + трансфер)
- Отзывы с фото от реальных путешественников
- Multi-language audio guides

**Текущий статус myUNO:**
- ✅ Базовое бронирование туров
- ✅ Add to Cart + Book Now (только что реализовано)
- ⚠️ Нет QR-ваучеров
- ⚠️ Нет гибкой политики отмены
- ❌ Нет комбо-предложений
- ❌ Нет групповых скидок

**Необходимые доработки:**
1. **Voucher System** - генерация PDF/QR ваучеров после бронирования
2. **Flexible Cancellation Engine** - настраиваемые политики отмены
3. **Bundle Builder** - комбо-предложения (тур + трансфер + обед)
4. **Group Discounts** - автоматические скидки от 4+ человек

---

### 2. ТРАНСПОРТ (Grab, Bolt, Uber)

**Что есть у лидеров:**
- Real-time GPS tracking водителя
- Динамическое ценообразование
- Мгновенный матчинг с ближайшим водителем
- Chat/Call с водителем в приложении
- Split payment между друзьями
- Subscription passes (10 поездок за месяц)

**Текущий статус myUNO:**
- ✅ Форма заказа такси с выбором точек на карте
- ✅ Расчёт стоимости по расстоянию
- ⚠️ Нет real-time tracking
- ❌ Нет live-матчинга с водителями
- ❌ Нет in-app chat с водителем

**Необходимые доработки:**
1. **Driver App / Portal** - интерфейс для водителей принимать заказы
2. **Real-time Tracking** - Supabase Realtime для обновления позиции
3. **In-App Communication** - чат между клиентом и водителем
4. **Ride Passes** - подписки на пакеты поездок

---

### 3. ДОСТАВКА ЕДЫ (Grab Food, Foodpanda, Glovo)

**Что есть у лидеров:**
- Live order tracking (готовится → в пути → доставлен)
- Estimated delivery time с real-time updates
- Scheduled delivery (заказ на завтра)
- Re-order previous orders одним кликом
- Subscription (бесплатная доставка за $9.99/мес)
- Multiple delivery addresses

**Текущий статус myUNO:**
- ✅ Меню ресторанов с категориями
- ✅ Корзина и checkout
- ⚠️ Нет live tracking доставки
- ❌ Нет scheduled delivery
- ❌ Нет re-order функции

**Необходимые доработки:**
1. **Order Status Pipeline** - статусы с push-уведомлениями
2. **Delivery Tracking** - карта с позицией курьера
3. **Quick Re-order** - кнопка "Повторить заказ" в истории
4. **Delivery Subscriptions** - UNO Pass с бесплатной доставкой

---

### 4. НЕДВИЖИМОСТЬ (Airbnb, Booking.com)

**Что есть у лидеров:**
- Instant Book vs Request to Book
- Verified photos (фото проверены платформой)
- Superhost badges
- Flexible cancellation tiers
- Calendar sync (iCal)
- Smart pricing (динамические цены)
- In-app messaging с хозяином

**Текущий статус myUNO:**
- ✅ Листинг недвижимости с фильтрами
- ✅ Owner dashboard с управлением объектами
- ✅ iCal sync
- ✅ Guidebook для гостей
- ⚠️ Нет Instant Book toggle
- ⚠️ Нет Smart Pricing

**Необходимые доработки:**
1. **Instant Book Mode** - переключатель для владельцев
2. **Smart Pricing Suggestions** - AI-рекомендации по ценам
3. **Photo Verification Badge** - метка проверенных фото

---

### 5. КРАСОТА (Booksy, Treatwell, Fresha)

**Что есть у лидеров:**
- Real-time availability slots
- Staff selection (выбор конкретного мастера)
- Service duration & add-ons
- Loyalty points per visit
- Membership packages (5 визитов = скидка)
- Before/After photo gallery

**Текущий статус myUNO:**
- ✅ Каталог салонов и услуг
- ✅ Бронирование с выбором даты/времени
- ⚠️ Нет выбора конкретного мастера
- ❌ Нет membership packages

**Необходимые доработки:**
1. **Staff Profiles** - карточки мастеров с портфолио
2. **Service Packages** - пакеты услуг со скидкой
3. **Before/After Gallery** - галерея работ

---

## Общесистемные улучшения

### A. UNO Pass (Subscription System)

Создать единую подписку, объединяющую преимущества по всем вертикалям:

```text
UNO Pass Basic (฿299/мес):
- Бесплатная доставка из ресторанов
- 5% cashback на все услуги
- Priority support

UNO Pass Premium (฿799/мес):
- Всё из Basic
- Бесплатные отмены бронирований
- 10% cashback
- Эксклюзивные цены на яхты/туры
- VIP concierge доступ
```

### B. Unified Voucher/Ticket System

Единый формат ваучеров для всех бронирований:
- QR-код для check-in
- Офлайн-доступ (сохранение в Wallet)
- Apple Wallet / Google Pay интеграция
- PDF export

### C. Cross-Vertical Bundles

Комбо-предложения, которые невозможны у специализированных конкурентов:

```text
"Perfect Phuket Day" Bundle:
- Утренний тур на острова (Klook competitor)
- Обед в ресторане (Grab Food competitor)  
- Вечерний массаж (Booksy competitor)
- Трансфер туда-обратно (Grab competitor)
= Скидка 15% на весь пакет
```

### D. Real-time Notifications Hub

Единый центр уведомлений:
- Push для всех статусов (заказ, бронь, доставка)
- In-app notification center
- Email digest (ежедневный/еженедельный)
- SMS для критичных (SOS, подтверждения)

### E. Aggregator-to-Native Transition

Архитектура для плавного перехода от агрегации к собственным провайдерам:

**Database:**
```sql
-- Add source tracking to all booking tables
ALTER TABLE tours ADD COLUMN source_type TEXT DEFAULT 'native'; -- 'native' | 'partner' | 'affiliate'
ALTER TABLE tours ADD COLUMN partner_id UUID REFERENCES partners(id);
ALTER TABLE tours ADD COLUMN external_link TEXT;
ALTER TABLE tours ADD COLUMN commission_rate DECIMAL(5,2);
```

**UI Logic:**
- `source_type = 'native'` → полный booking flow внутри myUNO
- `source_type = 'partner'` → booking через API партнёра, но UI myUNO
- `source_type = 'affiliate'` → редирект на внешний сайт (скрыто в начале)

**Commission Visibility:**
- Для пользователя: никаких различий в UI
- Для админа: dashboard с breakdown по source_type и комиссиям

---

## Приоритизация реализации

### Phase 1: Quick Wins (1-2 недели)

1. **Voucher Generation** - PDF ваучер с QR для туров/яхт
2. **Order Status Timeline** - визуальный трекер статусов
3. **Quick Re-order** - кнопка повтора заказа
4. **Staff Selection for Beauty** - выбор мастера

### Phase 2: Competitive Parity (2-4 недели)

1. **UNO Pass Subscription** - базовая подписка
2. **Bundle Builder** - комбо-предложения
3. **Group Discounts** - автоскидки для групп
4. **Real-time Order Tracking** - карта доставки

### Phase 3: Aggregator Foundation (4-6 недель)

1. **Partner Integration Layer** - API для внешних провайдеров
2. **Commission Tracking** - отслеживание комиссий
3. **A/B Testing** - native vs partner offerings
4. **Analytics Dashboard** - метрики по источникам

---

## Конкурентные преимущества myUNO

То, что невозможно у вертикальных лидеров:

1. **Cross-Vertical Bundles** - Klook не продаёт массаж, Grab не продаёт туры
2. **Unified Wallet** - один баланс для всех услуг
3. **Single Loyalty Program** - cashback со всех вертикалей
4. **Local Expertise** - контент на русском для экспатов
5. **SOS Integration** - экстренная помощь 24/7
6. **Property + Services** - владельцам: жильё + клининг + управление

---

## Архитектурные изменения

### Новые таблицы

```sql
-- Subscription system
CREATE TABLE subscription_user_passes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  plan_id UUID REFERENCES subscription_plans,
  status TEXT, -- 'active' | 'paused' | 'cancelled'
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Partner/Affiliate tracking
CREATE TABLE partners (
  id UUID PRIMARY KEY,
  name TEXT,
  api_endpoint TEXT,
  api_key_secret TEXT,
  commission_default DECIMAL(5,2),
  is_active BOOLEAN
);

-- Bundle offers
CREATE TABLE bundle_offers (
  id UUID PRIMARY KEY,
  name_en TEXT,
  name_ru TEXT,
  items JSONB, -- [{type: 'tour', id: 'xxx'}, {type: 'restaurant', id: 'yyy'}]
  discount_percent INTEGER,
  valid_from DATE,
  valid_until DATE
);

-- Vouchers
CREATE TABLE booking_vouchers (
  id UUID PRIMARY KEY,
  booking_id UUID,
  booking_type TEXT,
  qr_code TEXT,
  pdf_url TEXT,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ
);
```

### Новые Edge Functions

1. `generate-voucher` - создание PDF ваучера
2. `partner-booking-proxy` - проксирование booking к партнёрам
3. `bundle-price-calculator` - расчёт цены пакета
4. `subscription-check` - проверка активной подписки
5. `order-status-webhook` - обновление статусов от курьеров

---

## Файлы для создания/изменения

| Категория | Файлы |
|-----------|-------|
| Vouchers | `src/components/booking/VoucherCard.tsx`, `src/pages/vouchers/VoucherView.tsx`, `supabase/functions/generate-voucher/` |
| Subscriptions | `src/pages/subscription/UnoPassPage.tsx`, `src/components/subscription/PassBenefits.tsx` |
| Bundles | `src/components/bundles/BundleCard.tsx`, `src/pages/bundles/BundleBuilder.tsx` |
| Order Tracking | `src/components/orders/LiveTrackingMap.tsx`, `src/components/orders/OrderTimeline.tsx` |
| Staff Selection | `src/components/beauty/StaffPicker.tsx`, `src/hooks/useSalonStaff.ts` |
| Partner Layer | `src/lib/partnerApi.ts`, `supabase/functions/partner-booking-proxy/` |

---

## Метрики успеха

1. **Cross-vertical conversion** - % пользователей, использующих 2+ вертикали
2. **Bundle attachment rate** - % заказов с bundle vs single
3. **Native vs Partner ratio** - доля native провайдеров
4. **UNO Pass adoption** - % платных подписчиков
5. **Repeat booking rate** - повторные бронирования за 30 дней
