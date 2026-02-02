
# Сравнительный анализ: myUNO Yacht Charter vs. Мировые лидеры

## Обзор платформ для сравнения
- **Premium:** YachtCharterFleet, Boatbookings
- **Marketplace:** YACHTICO, Sailo, Sailogy
- **P2P:** Boatsetter, Viravira

---

## 1. Модель листинга и каталогизации судов

### Текущая реализация myUNO
**Структура данных (`yachts` table):**
- Базовые поля: `name_en/ru`, `description_en/ru`, `yacht_type`
- Технические спеки: `length_meters`, `year_built`, `beam`, `draft`, `engines`, `cruising_speed`, `max_speed`, `fuel_capacity`
- Вместимость: `capacity`, `cabins`, `bathrooms`
- Сервис: `has_crew`, `has_catering`
- Медиа: `cover_image`, `images[]`
- Фичи: `features_en[]`, `features_ru[]`

**Типы яхт:** yacht, catamaran, speedboat, sailboat

**Фильтрация (`YachtsFilters.tsx`):**
- По типу (6 категорий)
- По вместимости (4 диапазона)
- По продолжительности (5 опций)
- По направлениям (6 маршрутов Пхукета)
- По удобствам (9 опций)
- По уровню цен

### Сравнение с лидерами

| Параметр | myUNO | YachtCharterFleet | YACHTICO | Boatsetter |
|----------|-------|-------------------|----------|------------|
| Технические спеки | ✅ Полные | ✅ Расширенные | ✅ Полные | ⚠️ Базовые |
| Видео-туры | ❌ Нет | ✅ 4K видео | ✅ Есть | ⚠️ Опционально |
| 3D-туры | ❌ Нет | ✅ Matterport | ❌ Нет | ❌ Нет |
| Верификация флота | ⚠️ Manual | ✅ Physical inspection | ⚠️ Documents | ✅ Coast Guard |
| Мультиязычность | ✅ EN/RU | ✅ 8+ языков | ✅ 5 языков | ⚠️ EN only |

### Сильные стороны myUNO
- Глубокая билингвальность (RU/EN на уровне БД)
- "Experiences" как уникальный слой каталога (Yacht Yoga, Fishing Trip, Birthday Party)
- Локальная специфика Пхукета (маршруты: Phi-Phi, Similan, James Bond)

### Зоны улучшения
```text
┌─────────────────────────────────────────────────────────────┐
│  КРИТИЧНО:                                                  │
│  • Видео контент — обязателен для luxury-сегмента           │
│  • Deck Plans — стандарт для катамаранов 40ft+              │
│  • Builder/Designer metadata — важно для коллекционеров     │
├─────────────────────────────────────────────────────────────┤
│  ЖЕЛАТЕЛЬНО:                                                │
│  • Crew profiles (капитан, повар)                           │
│  • Sample itineraries с картами                             │
│  • Eco-certifications (Green Yachting)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Поиск и рекомендации

### Текущая реализация myUNO
- **Фильтрация:** Universal Filter с chip-based UI
- **Experience chips:** Quick selection по типу впечатлений
- **Геолокация:** Hardcoded Phuket routes (phi-phi, james-bond, similan)
- **Персонализация:** AI-powered home через `ai-personalize-home` edge function

### Сравнение с лидерами

| Функция | myUNO | Sailogy | Sailo | Boatsetter |
|---------|-------|---------|-------|------------|
| Map-based search | ❌ | ✅ Marina pins | ✅ Interactive | ✅ Full map |
| Real-time availability | ✅ RPC check | ✅ | ✅ | ✅ |
| AI recommendations | ✅ Personas | ❌ | ❌ | ⚠️ Basic |
| Similar yachts | ❌ | ✅ | ✅ | ✅ |
| Price alerts | ❌ | ✅ | ❌ | ✅ |

### Уникальное преимущество myUNO
AI-персонализация на основе user personas — конкурентное преимущество, которого нет у специализированных чартерных платформ.

### Зоны улучшения
- **Map integration:** Добавить Mapbox/Leaflet с маринами и маршрутами
- **"Similar yachts":** Collaborative filtering на основе bookings
- **Saved searches:** Уведомления о новых яхтах по критериям

---

## 3. Ценообразование и доступность

### Текущая реализация myUNO
```typescript
// Модель цен (из YachtBookingQuickSelect.tsx)
price_half_day: number  // 4 часа
price_full_day: number  // 8 часов
currency: 'THB' | 'USD'

// Типы чартера
type CharterType = 'half_day' | 'full_day'

// Дополнительные опыты (add-ons)
YACHT_EXPERIENCES: YachtExperience[] // 13 опций от ฿3,000 до ฿15,000
```

**Проверка доступности:**
- RPC `check_availability` с vertical='yacht'
- Проверка пересечений в таблице `orders`
- Real-time блокировка при бронировании

### Сравнение с лидерами

| Аспект | myUNO | YachtCharterFleet | YACHTICO | Boatsetter |
|--------|-------|-------------------|----------|------------|
| Модель цен | Статичная | Динамическая | Статичная + торг | Динамическая |
| Сезонность | ❌ | ✅ High/Low | ✅ | ✅ |
| Day-of-week | ❌ | ✅ Weekend premium | ⚠️ | ✅ |
| Мультивалютность | ⚠️ THB/USD | ✅ 20+ валют | ✅ EUR/USD | ✅ USD |
| Прозрачность fees | ✅ 5% service | ⚠️ Hidden | ⚠️ Negotiable | ✅ Clear |
| Deposit system | ❌ | ✅ 50% advance | ✅ | ✅ |

### Критические пробелы
```text
┌────────────────────────────────────────────────────────────────────┐
│  БЛОКЕРЫ для scale:                                                │
│                                                                    │
│  1. Отсутствие iCal sync для яхт                                   │
│     → Риск double-booking при листинге на нескольких платформах    │
│                                                                    │
│  2. Нет "Blackout dates" UI для владельцев                         │
│     → Владельцы не могут закрыть даты для личного использования    │
│                                                                    │
│  3. Статичные цены                                                 │
│     → Потеря revenue в high-season (Songkran, NYE)                 │
│                                                                    │
│  4. Нет APA (Advance Provisioning Allowance) калькулятора          │
│     → Стандарт для недельных чартеров                              │
└────────────────────────────────────────────────────────────────────┘
```

---

## 4. Бронирование и оплата

### Текущая реализация myUNO
**Booking flow (`YachtBooking.tsx`):**
1. Select charter type (half/full day)
2. Pick date + departure time
3. Set guest count
4. Add experiences (upsell)
5. Contact info
6. Payment method (card, wallet, cash)
7. Submit → `createBooking()` → `order_item_yacht_details`

**Двойной flow:**
- "Add to Cart" — уникальный ID: `${yacht.id}-${date}-${time}-${charterType}`
- "Book Now" — прямой checkout

### Сравнение с лидерами

| Функция | myUNO | Premium Charters | P2P Platforms |
|---------|-------|------------------|---------------|
| Instant booking | ✅ | ❌ Request only | ✅ |
| Split payment | ❌ | ✅ Group split | ✅ Boatsetter |
| Deposit + balance | ❌ | ✅ 50%/50% | ✅ |
| Escrow | ❌ | ✅ | ✅ Stripe Connect |
| Insurance upsell | ❌ | ✅ Integrated | ✅ Boatsetter |
| Cancellation tiers | ❌ | ✅ 7-30-60 days | ✅ Flexible/Moderate/Strict |

### Сильные стороны myUNO
- **Mobile-first checkout** — Sheet-based quick booking
- **Experience upsells** — 13 add-ons directly in flow
- **Wallet integration** — Cashback & loyalty

### Критические улучшения
- **Deposit logic:** 50% при бронировании, 50% за 48 часов
- **Cancellation policies:** Tiered refund rules
- **Insurance integration:** Партнёрство со страховщиками

---

## 5. Управление собственниками (Vendor Dashboard)

### Текущая реализация myUNO (`VendorYachts.tsx`)

**4-step Wizard:**
1. **Basic Info:** Name, type, description (EN/RU)
2. **Specifications:** Prices, capacity, technical specs
3. **Photos:** Cover + gallery upload
4. **Review:** Preview before submission

**Moderation:**
- `approval_status`: pending → approved/rejected
- Non-admin edits reset to pending
- `ApprovalStatusBadge` component

**Draft system:**
- `useFormDraft` hook с localStorage
- `DraftRestorationBanner` при возврате

### Сравнение с лидерами

| Функция | myUNO | YACHTICO | Boatsetter | GetMyBoat |
|---------|-------|----------|------------|-----------|
| Listing wizard | ✅ 4-step | ✅ 6-step | ✅ Guided | ✅ |
| Calendar management | ❌ | ✅ Full | ✅ Full | ✅ |
| iCal import/export | ❌ | ✅ | ✅ | ✅ |
| Pricing rules | ❌ | ✅ Seasons | ✅ Smart | ⚠️ Basic |
| Booking requests | ⚠️ Auto-confirm | ✅ Accept/Decline | ✅ | ✅ |
| Revenue analytics | ❌ | ✅ | ✅ Full | ⚠️ |
| Crew profiles | ❌ | ✅ | ⚠️ | ❌ |
| Insurance upload | ❌ | ✅ Required | ✅ | ✅ |

### Критический Gap
```text
┌─────────────────────────────────────────────────────────────────┐
│  ОБЯЗАТЕЛЬНО для B2B adoption:                                  │
│                                                                 │
│  • Yacht Calendar UI (аналог Property Calendar)                 │
│  • iCal sync с Booking Manager / YachtBooker / MMK Systems      │
│  • Blackout dates для техобслуживания                           │
│  • Request/Accept flow вместо auto-confirm                      │
│  • Financial reports (earnings, fees, payouts)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Коммуникация

### Текущая реализация myUNO
- **UnifiedChatFAB:** AI Agent / WhatsApp / Telegram
- **Booking notes:** Free-text в форме
- **Post-booking:** WhatsApp redirect для cash payments

### Сравнение с лидерами

| Канал | myUNO | YACHTICO | Sailo | Boatsetter |
|-------|-------|----------|-------|------------|
| In-app messaging | ❌ | ✅ Full | ✅ | ✅ |
| Email templates | ⚠️ Generic | ✅ Branded | ✅ | ✅ |
| SMS notifications | ❌ | ❌ | ✅ | ✅ |
| WhatsApp | ✅ Direct | ❌ | ❌ | ❌ |
| Telegram | ✅ Direct | ❌ | ❌ | ❌ |
| Owner-Guest chat | ❌ | ✅ Protected | ✅ | ✅ |

### Уникальное преимущество myUNO
Прямая интеграция WhatsApp/Telegram — критична для азиатского рынка, где эти мессенджеры доминируют.

### Зоны улучшения
- **In-app chat:** Защита от ухода сделок из платформы
- **Booking lifecycle notifications:** Confirmation → Reminder → Day-of → Feedback

---

## 7. Юридические аспекты

### Текущая реализация myUNO
- Нет цифровых договоров
- Нет явных Terms & Conditions для чартера
- Cancellation policy не определена

### Стандарт индустрии
- **MYBA Charter Agreement** — международный стандарт
- **Digital signatures** — DocuSign/PandaDoc интеграция
- **Damage deposits** — Escrow с pre-authorization

### Критические требования
```text
┌─────────────────────────────────────────────────────────────────┐
│  Юридические must-have:                                        │
│                                                                 │
│  1. Charter Agreement template (MYBA-based)                     │
│  2. Cancellation policy tiers (Flexible/Moderate/Strict)        │
│  3. Damage deposit pre-auth                                     │
│  4. Crew liability disclaimer                                   │
│  5. Weather cancellation clause                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. UX/UI сравнение

### myUNO strengths
- **Mobile-first:** Sheet-based booking, bottom bar CTAs
- **Quick booking:** 2-tap from listing to date selection
- **Visual consistency:** MiniAppLayout, UnifiedFilter
- **Dual flow:** Cart + Book Now

### Comparison with leaders

| Aspect | myUNO | YachtCharterFleet | Sailo | Boatsetter |
|--------|-------|-------------------|-------|------------|
| Mobile UX | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Desktop UX | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Load speed | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Booking friction | Low | High (inquiry) | Medium | Low |
| Image gallery | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

### Improvement opportunities
- **Fullscreen gallery** with swipe gestures
- **Map view** для выбора маршрутов
- **Comparison tool** для нескольких яхт

---

## 9. Экосистема партнёров

### Текущая реализация myUNO
- **Cross-sell matrix:** 8 связанных вертикалей (Restaurants, Transport, Beauty...)
- **Experience providers:** Встроены в booking flow
- **Нет API:** Закрытая система

### Стандарт индустрии

| Интеграция | YachtCharterFleet | YACHTICO | Boatsetter |
|------------|-------------------|----------|------------|
| Channel Managers | ✅ MMK, YachtBooker | ✅ | ❌ |
| Insurance APIs | ✅ | ✅ | ✅ Buoy |
| Crew agencies | ✅ Direct | ⚠️ | ❌ |
| Provisioning | ✅ | ⚠️ | ❌ |
| Concierge networks | ✅ | ❌ | ❌ |
| Public API | ⚠️ Partner only | ✅ | ✅ |

### myUNO advantage
Уникальная супер-апп экосистема: чартер яхты → ресторан на борту → трансфер → цветы.

---

## 10. Метрики успешности

### Рекомендуемые KPIs для myUNO Yacht vertical

| Метрика | Формула | Benchmark |
|---------|---------|-----------|
| Listing-to-Booking | Bookings / Listings | 15-25% monthly |
| View-to-Book | Bookings / Detail views | 2-5% |
| Avg. charter value | Total GMV / Bookings | ฿35,000+ |
| Repeat charter rate | Return customers / Total | 20-30% |
| Experience attach rate | Experience add-ons / Bookings | 40%+ |
| Vendor retention | Active vendors MoM | 85%+ |
| Response time | Median inquiry-to-response | < 2 hours |
| NPS | Promoters - Detractors | 50+ |

---

## Итоговая матрица Gap-анализа

| Приоритет | Gap | Impact | Effort |
|-----------|-----|--------|--------|
| 🔴 P0 | iCal sync для яхт | Критично для scale | Medium |
| 🔴 P0 | Yacht Calendar UI | Блокер для владельцев | High |
| 🔴 P0 | Cancellation policies | Юридический риск | Low |
| 🟠 P1 | Dynamic pricing | Revenue optimization | Medium |
| 🟠 P1 | Deposit/payment splits | Conversion | Medium |
| 🟠 P1 | In-app messaging | Commission protection | High |
| 🟡 P2 | Map-based search | UX improvement | Medium |
| 🟡 P2 | Video/3D tours | Premium positioning | Low |
| 🟡 P2 | Similar yachts | Discovery | Medium |
| 🟢 P3 | Crew profiles | Trust building | Low |
| 🟢 P3 | Insurance integration | Safety | Medium |

---

## Рекомендуемый Roadmap

### Phase 1: Foundation (2-4 weeks)
- [ ] Yacht Calendar component (extend PropertyCalendar)
- [ ] Cancellation policy selector в vendor wizard
- [ ] Blackout dates для владельцев

### Phase 2: Scale (4-8 weeks)
- [ ] iCal sync infrastructure для яхт
- [ ] Dynamic pricing rules (seasons, weekends)
- [ ] Deposit payment flow

### Phase 3: Premium (8-12 weeks)
- [ ] Map-based search с маринами
- [ ] Video upload в listing wizard
- [ ] In-app protected messaging
