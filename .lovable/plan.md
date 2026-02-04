

# Редизайн каталога как Супер-Апп — Полная логика

## Проблема
Текущий `ServiceCategoryDrawer` позиционируется как "каталог домашних услуг" (🔧 Wrench, текст "мастера"), хотя `useCategories()` уже возвращает **ВСЕ 39 категорий** супер-аппа включая:
- 🛥️ Яхты и лодки (Travel & Transport)
- ✈️ Туры и экскурсии (Travel & Transport)
- 🍽️ Рестораны (Lifestyle & Leisure)
- 🎭 Мероприятия (Lifestyle & Leisure)
- 🏥 Медицина (Health & Care)
- и т.д.

## Решение: Супер-Апп Каталог

### Новая структура каталога

```text
┌─────────────────────────────────────────────────────┐
│  HEADER: 🌟 myUNO Каталог                          │
│  "Все сервисы для жизни за рубежом"                │
├─────────────────────────────────────────────────────┤
│  🔍 Поиск по всем категориям...                    │
├─────────────────────────────────────────────────────┤
│  ⚡ БЫСТРЫЙ ДОСТУП                                  │
│  🔥 Акции и скидки                                  │
│  ⭐ Популярное сегодня                              │
│  ❤️ Избранное (3)                                   │
│  🕐 История                                         │
├─────────────────────────────────────────────────────┤
│  📍 ВСЕ СЕРВИСЫ (из БД)                            │
│                                                     │
│  ▼ Lifestyle & Leisure (5)                         │
│     🍽️ Рестораны                                   │
│     💅 Красота и СПА                               │
│     🎭 Мероприятия                                 │
│     🛒 Маркетплейс                                 │
│     🍕 Доставка еды                                │
│                                                     │
│  ▼ Travel & Transport (2)                          │
│     🛥️ Яхты и лодки         ⭐HOT                  │
│     🧳 Экскурсии                                   │
│                                                     │
│  ▼ Water Sports (1)                                │
│     🏄 Водный спорт                                │
│                                                     │
│  ▼ Health & Care (4)                               │
│     🏥 Медицина                                    │
│     💊 Аптека                                      │
│     🐕 Питомцы                                     │
│     🏋️ Фитнес                                     │
│                                                     │
│  ▼ Home & Services (16)                            │
│     🏠 Недвижимость                                │
│     🧹 Уборка                                      │
│     🔧 Сантехника, Электрика...                    │
│                                                     │
│  ▼ Expat Services (4)                              │
│     🏦 Банки и финансы                             │
│     📋 Визы и иммиграция                           │
│     ...                                             │
│                                                     │
│  ▼ Professional (4)                                │
│     ⚖️ Юридические                                 │
│     🎓 Образование                                 │
│     ...                                             │
│                                                     │
│  ▼ Quick Services (3)                              │
│     🚗 Трансферы                                   │
│     🚙 Аренда транспорта                           │
│     💐 Цветы                                       │
├─────────────────────────────────────────────────────┤
│  👨‍💼 ДЛЯ ПАРТНЁРОВ                                │
│  🏪 Стать продавцом                                 │
│  🔧 Стать исполнителем                              │
├─────────────────────────────────────────────────────┤
│  FOOTER: RU/EN | v2.5.0                            │
└─────────────────────────────────────────────────────┘
```

### Типы сервисов (Service Types) — Бизнес-логика

Для понимания flow покупателя, каждая категория имеет тип:

| Тип | Описание | Flow | Примеры |
|-----|----------|------|---------|
| `booking` | Бронирование на дату/время | Calendar → Slots → Pay | Яхты, Туры, Рестораны, Отели |
| `order` | Заказ с доставкой | Cart → Checkout → Deliver | Цветы, Аптека, Маркетплейс |
| `request` | Запрос услуги | Form → Match → Contact | Сантехник, Электрик, Юрист |
| `subscription` | Подписка | Plan → Pay → Access | Фитнес, Образование |
| `consultation` | Консультация | Request → Call → Follow-up | Медицина, Страхование, Визы |

Это определяется полем `mini_app_type` в БД + маппинг:

```typescript
const SERVICE_FLOW_MAP: Record<string, ServiceFlowType> = {
  'yachts': 'booking',
  'tours': 'booking',
  'restaurants': 'booking',
  'property': 'booking',
  'flowers': 'order',
  'pharmacy': 'order',
  'marketplace': 'order',
  'market': 'order',
  'services': 'request',  // Home services
  'cleaning': 'request',
  'plumbing': 'request',
  'medical': 'consultation',
  'legal': 'consultation',
  'fitness': 'subscription',
  'education': 'subscription',
};
```

---

## Изменения

### Фаза 1: Обновить ServiceCategoryDrawer

**Файл**: `src/components/services/ServiceCategoryDrawer.tsx`

Изменения:
- Иконка: `Wrench` → `Sparkles` или `Grid3X3` (универсальный каталог)
- Заголовок: "Каталог услуг" → "myUNO Каталог"
- Подзаголовок: "Все категории услуг" → "Все сервисы для жизни"

### Фаза 2: Редизайн ServiceCategoryAccordion

**Файл**: `src/components/services/drawer/ServiceCategoryAccordion.tsx`

Изменения:
- Использовать **иконку категории** из БД вместо generic Sparkles
- Добавить **счётчик провайдеров/услуг** для каждой категории
- Показывать бейджи `NEW`, `HOT` более заметно

```tsx
// Использовать иконку из category, а не generic Sparkles
const Icon = category.icon; // Уже есть в useCategories!

<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
  <Icon className="w-5 h-5 text-primary" />
</div>
```

### Фаза 3: Редизайн QuickAccess — Универсальные ссылки

**Файл**: `src/components/services/drawer/ServiceQuickAccess.tsx`

Убрать ссылки только на `/services` (мастера), добавить универсальные:

```tsx
const links = [
  { icon: Flame, label: 'Акции', path: '/discover?filter=deals' },
  { icon: TrendingUp, label: 'Популярное', path: '/discover?filter=popular' },
  { icon: Clock, label: 'История', path: '/history' },
  { icon: Heart, label: 'Избранное', path: '/favorites' },
  { icon: CalendarCheck, label: 'Мои бронирования', path: '/bookings' }, // NEW
];
```

### Фаза 4: Редизайн QuickServiceIcons — Топ-категории супер-аппа

**Файл**: `src/components/services/QuickServiceIcons.tsx`

Убрать хардкод домашних услуг, показывать **топ категории по популярности**:

```tsx
// БЫЛО: хардкод cleaning, plumbing...
const SERVICE_SLUGS = ['cleaning', 'plumbing', 'electrical', ...];

// СТАНЕТ: топ категории из всех вертикалей
const TOP_CATEGORIES = [
  'yachts',      // 🛥️ Яхты
  'tours',       // ✈️ Туры  
  'restaurants', // 🍽️ Рестораны
  'transport',   // 🚗 Транспорт
  'beauty-spa',  // 💅 Красота
  'cleaning',    // 🧹 Уборка
  'medical',     // 🏥 Медицина
  'flowers',     // 💐 Цветы
];

// Или загружать из БД: is_featured = true, сортировать по популярности
```

### Фаза 5: Добавить иконки групп

В `ServiceCategoryAccordion` каждая группа использует generic `Sparkles`. Нужен маппинг:

```tsx
const GROUP_ICONS: Record<string, LucideIcon> = {
  'lifestyle': Sparkles,
  'travel': Plane,
  'water': Waves,
  'health': Heart,
  'home': Home,
  'expat-services': Globe,
  'professional': Briefcase,
  'quick-services': Zap,
};
```

---

## Файлы для редактирования

| Файл | Изменения |
|------|-----------|
| `src/components/services/ServiceCategoryDrawer.tsx` | Новый header (иконка, заголовок) |
| `src/components/services/drawer/ServiceCategoryAccordion.tsx` | Иконки категорий + иконки групп |
| `src/components/services/drawer/ServiceQuickAccess.tsx` | Универсальные ссылки |
| `src/components/services/QuickServiceIcons.tsx` | Топ-категории супер-аппа |
| `src/hooks/useCategories.ts` | Добавить groupIcon в CategoryGroup |

---

## Визуальные улучшения (Klook/Airbnb уровень)

1. **Группы с цветовым кодированием**:
   - Lifestyle: Фиолетовый gradient
   - Travel: Синий gradient
   - Health: Зелёный gradient
   - Home: Amber gradient

2. **Анимации**:
   - Плавное раскрытие аккордеона (framer-motion)
   - Hover эффекты на категориях

3. **Счётчики**:
   - Количество провайдеров/услуг в каждой категории
   - Бейджи: "50+ мастеров", "Открыто сейчас"

---

## Результат

- **Единый каталог** всех 39 категорий супер-аппа
- **Иконки из БД** для каждой категории (не generic Sparkles)
- **Группы с правильными иконками** (Lifestyle, Travel, Health...)
- **Топ-категории** на главном экране (яхты, туры, рестораны — не только мастера)
- **Универсальный Quick Access** (бронирования, история, избранное)
- **UX уровня Klook/Airbnb** с цветовым кодированием и анимациями

