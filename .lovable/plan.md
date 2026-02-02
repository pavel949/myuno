

# План: Устранение хардкода на платформе

## Цель
Централизовать все захардкоженные данные (цены, телефоны, email, координаты, демо-данные) в единые конфигурационные файлы и/или таблицы базы данных для управления без изменения кода.

---

## Часть 1: Критические проблемы (Приоритет 1)

### 1.1 Контактные данные — КРИТИЧНО

| Данные | Где встречается | Количество файлов |
|--------|-----------------|------------------|
| `+66 92 240 7355` | ContactPage, Footer, FAB | 5+ файлов |
| `wa.me/66922407355` | CompactFooter, ChatFAB | 10+ файлов |
| `support@uno.ae` | ContactPage, CookiePolicy | 5 файлов |
| `partners@uno.app` | PartnersPage | 2 файла |

**Решение:** Создать `src/lib/config/contacts.ts`:
```typescript
export const COMPANY_CONTACTS = {
  phone: {
    hotline: '+66 92 240 7355',
    display: '+66 92 240 7355',
  },
  whatsapp: {
    number: '66922407355',
    link: 'https://wa.me/66922407355',
  },
  email: {
    support: 'support@uno.ae',
    partners: 'partners@uno.ae',
    press: 'press@uno.ae',
    privacy: 'privacy@uno.ae',
  },
  address: {
    full: '88/88 Moo 3, Chalong, Muang, Phuket 83130, Thailand',
  },
} as const;
```

### 1.2 Географические координаты — КРИТИЧНО

| Данные | Файлы |
|--------|-------|
| `7.8804, 98.3923` (Phuket center) | 10+ map компонентов |
| Координаты ресторанов | RestaurantMap.tsx |
| Координаты салонов | BeautyMap.tsx |

**Решение:** Расширить `useCities.ts` hook или создать `src/lib/config/geography.ts`:
```typescript
export const CITY_DEFAULTS = {
  phuket: {
    center: { lat: 7.8804, lng: 98.3923 },
    zoom: 11,
    bounds: { sw: [98.2, 7.7], ne: [98.5, 8.2] },
  },
  // Другие города из DB
};
```

---

## Часть 2: Демо-данные и моки (Приоритет 2)

### 2.1 Найденные моки

| Файл | Тип данных | Строки |
|------|-----------|--------|
| `src/lib/searchData.ts` | searchDemoData | ~80 записей |
| `src/pages/team/TeamModerationPage.tsx` | MOCK_ITEMS | 5 записей |
| `src/pages/team/TeamInboxPage.tsx` | MOCK_TASKS | 5 записей |
| `src/pages/team/TeamSupportPage.tsx` | MOCK_TICKETS | 5 записей |
| `src/pages/restaurants/restaurantsData.ts` | Статические рестораны | 100+ записей |
| `src/pages/cleaning/CleaningDetail.tsx` | cleaningServices | 6 сервисов |
| `src/pages/transport/TransportBooking.tsx` | demoVehicles | 5 записей |
| `src/pages/property/PropertyMap.tsx` | Статические объекты | 10+ записей |

**Решение:**
1. Перенести демо-данные в Supabase таблицы или seed-файлы
2. Добавить fallback на моки только если DB пуста
3. Добавить комментарий `// TODO: Replace with DB query` для будущего рефакторинга

### 2.2 Unsplash изображения

Найдено **1273+ использований** `images.unsplash.com` — это placeholder изображения.

**Решение:**
- Для демо-режима: оставить как fallback
- Для production: загружать реальные изображения в Storage
- Добавить константу `DEFAULT_IMAGES` в config

---

## Часть 3: Бизнес-логика (Приоритет 3)

### 3.1 Цены и комиссии

Уже частично централизовано в `src/lib/constants.ts`:
- `OWNER_COMMISSION` (10%, 70/30) ✅
- `CASHBACK` (5%, max 20%) ✅

Но найдены дополнительные хардкоды:

| Данные | Файлы |
|--------|-------|
| `$2M Valuation` | FinancialsSlide.tsx |
| `$0, $49/mo, $149/mo` | BusinessModelSlide.tsx |
| `10% prepayment` | BookingTermsCard.tsx |
| `+฿150` (цена услуги) | FlowersOrder.tsx |
| `฿1,900`, `฿2,000` (визы) | VisaImmigrationPage.tsx |

**Решение:** 
1. Investor pitch данные — отдельный конфиг `src/lib/config/investorData.ts`
2. Визовые цены — таблица `visa_types` в DB
3. Цены услуг — только из DB, убрать хардкод

### 3.2 Дубликат DISTRICTS

`src/lib/constants.ts` содержит старый массив из 10 районов, а `propertyTaxonomy.ts` — 22.

**Решение:** Удалить `DISTRICTS` из `constants.ts`, использовать только `PHUKET_DISTRICTS` из taxonomy.

---

## Часть 4: Создание централизованной структуры конфигов

### 4.1 Новая структура `src/lib/config/`

```
src/lib/config/
├── index.ts              # Re-exports
├── contacts.ts           # Телефоны, email, адреса
├── geography.ts          # Координаты, bounds, города
├── branding.ts           # Логотипы, названия, версии
├── defaults.ts           # Дефолтные изображения, fallback данные
├── investorData.ts       # Investor Pitch данные (отдельно)
└── platformFees.ts       # Комиссии, скидки, лимиты
```

### 4.2 Таблицы DB для динамических данных

Уже есть:
- `cities` — города с координатами
- `experience_categories` — категории экспириенсов

Нужно добавить:
- `platform_config` — key-value для runtime конфигов
- `contact_info` — контакты компании (редактируемые админом)

---

## Файлы для изменения

### Новые файлы
| Файл | Описание |
|------|----------|
| `src/lib/config/contacts.ts` | Централизованные контакты |
| `src/lib/config/geography.ts` | Координаты и geo-данные |
| `src/lib/config/defaults.ts` | Fallback изображения |
| `src/lib/config/index.ts` | Re-exports |

### Файлы для рефакторинга (Фаза 1 — контакты)
| Файл | Изменение |
|------|-----------|
| `src/pages/info/ContactPage.tsx` | Импорт из contacts.ts |
| `src/components/layout/CompactFooter.tsx` | Импорт из contacts.ts |
| `src/components/chat/UnifiedChatFAB.tsx` | Импорт из contacts.ts |
| `src/pages/Support.tsx` | Импорт из contacts.ts |

### Файлы для рефакторинга (Фаза 2 — координаты)
| Файл | Изменение |
|------|-----------|
| `src/pages/restaurants/RestaurantMap.tsx` | Использовать geography.ts |
| `src/pages/beauty/BeautyMap.tsx` | Использовать geography.ts |
| `src/components/transport/LocationPickerMap.tsx` | Использовать geography.ts |
| Все map компоненты | Убрать хардкод координат |

### Файлы для рефакторинга (Фаза 3 — удаление моков)
| Файл | Изменение |
|------|-----------|
| `src/lib/constants.ts` | Удалить дубликат DISTRICTS |
| `src/pages/team/Team*.tsx` | Пометить моки как TODO |
| `src/pages/cleaning/CleaningDetail.tsx` | Перенести в DB или config |

---

## Миграция базы данных

```sql
-- Таблица для runtime конфигурации
CREATE TABLE IF NOT EXISTS platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Начальные данные для контактов
INSERT INTO platform_config (key, value) VALUES
('contacts', '{
  "phone": "+66 92 240 7355",
  "whatsapp": "66922407355",
  "email_support": "support@uno.ae",
  "email_partners": "partners@uno.ae"
}'),
('default_city', '{
  "id": "phuket",
  "center": {"lat": 7.8804, "lng": 98.3923},
  "zoom": 11
}');
```

---

## Порядок реализации

### Шаг 1: Создать конфигурационные файлы
- `contacts.ts` с телефонами/email
- `geography.ts` с координатами
- `defaults.ts` с fallback изображениями

### Шаг 2: Рефакторинг контактов (5 файлов)
- ContactPage, CompactFooter, ChatFAB, Support

### Шаг 3: Рефакторинг координат (10+ файлов)
- Все map компоненты

### Шаг 4: Очистка дубликатов
- Удалить DISTRICTS из constants.ts

### Шаг 5: Миграция DB
- Создать platform_config таблицу
- Добавить admin UI для редактирования

---

## Ожидаемый результат

После реализации:
1. Все контактные данные в одном месте
2. Все координаты централизованы и привязаны к городам
3. Нет дубликатов таксономий
4. Моки помечены и готовы к замене на DB
5. Администраторы могут менять базовые настройки без кода
6. Добавление нового города = 1 запись в DB

