

# Анализ: Объединение Tours и Water Activities в Experiences

## Текущая архитектура myUNO

```text
┌──────────────────────────────────────────────────────────────────┐
│                         ТЕКУЩЕЕ СОСТОЯНИЕ                        │
├──────────────────────────────────────────────────────────────────┤
│  category_groups:                                                 │
│  ├── "Travel & Transport" → Tours (/tours)                       │
│  ├── "Water Sports"       → Water Activities (/water)            │
│  └── ... другие группы                                           │
├──────────────────────────────────────────────────────────────────┤
│  Базы данных:                                                     │
│  ├── tours (29 записей) - islands, culture, nature, adventure    │
│  └── water_activities (31 запись) - diving, jet-ski, kayaking    │
├──────────────────────────────────────────────────────────────────┤
│  Vendor Portal:                                                   │
│  ├── /vendor/tours      → VendorTours.tsx                        │
│  └── /vendor/activities → VendorActivities.tsx                   │
├──────────────────────────────────────────────────────────────────┤
│  Admin Panel:                                                     │
│  ├── /admin/tours            → AdminTours.tsx                    │
│  └── /admin/water-activities → AdminWaterActivities.tsx          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Таксономия Klook / Arival (индустриальный стандарт)

Согласно исследованию Arival (ведущий аналитик travel experiences), индустрия использует 4-уровневую таксономию:

```text
Operator Type (5)
├── Activities    ← Все, где турист участвует: дайвинг, снорклинг, классы...
├── Attractions   ← Билеты: музеи, зоопарки, парки...
├── Events        ← Концерты, фестивали, спорт-события
├── Tours         ← Экскурсии: пешие, автобусные, морские...
└── Transportation ← Трансферы, паромы

Business Type (22)
├── Active / Adventure   ← Активный отдых
├── Cultural             ← Культурные
├── Food & Drink         ← Гастро-туры
├── Sightseeing          ← Обзорные
├── Water-based          ← Водные активности
├── Wellness             ← Спа, йога
└── ...

Experience Type (133)
└── Experience Detail (343)
```

Airbnb использует упрощенную версию:
- Adventures (мультидневные, экстремальные)
- Animal experiences
- Food and cooking
- Entertainment
- Nature and outdoors
- Sports

---

## Рекомендация: ДА, объединять

Объединение Tours + Water Activities в единую сущность **"Experiences"** имеет смысл по нескольким причинам:

### 1. Пользовательский опыт становится чище

**Текущая проблема:**
- Турист думает: "Хочу снорклинг на острова" 
- Это ТУР (поездка на острова) или WATER ACTIVITY (снорклинг)?
- На Klook это одна карточка в "Things to Do"

**После объединения:**
- Один раздел "Experiences" / "Впечатления" с фильтрами
- Пользователь выбирает по тегам/типам, а не думает о структуре

### 2. Схемы таблиц на 90% идентичны

```text
tours                        water_activities
─────────────────────────    ─────────────────────────
✓ id, provider_id            ✓ id, provider_id
✓ title_en, title_ru         ✓ title_en, title_ru
✓ description_en/ru          ✓ description_en/ru
✓ price, currency            ✓ price, currency, price_per
✓ duration_hours             ✓ duration_minutes
✓ difficulty                 ✓ difficulty
✓ max_participants           ✓ max_participants, min_participants
✓ meeting_point              ✓ meeting_point
✓ includes                   ✓ includes
✓ rating, review_count       ✓ rating, review_count
✓ is_active, is_featured     ✓ is_active, is_featured
✓ approval_status            ✓ approval_status
✓ category                   ✓ category
─────────────────────────    ─────────────────────────
  itinerary (JSONB)            requirements (array)
  excludes (array)             equipment_included (bool)
  highlights (array)           is_certified (bool)
                               age_restriction (int)
                               safety_briefing_required
```

### 3. Vendor Portal упрощается

**Сейчас:** 2 отдельные страницы управления
**После:** 1 страница с выбором типа опыта

### 4. Admin Panel упрощается

**Сейчас:** /admin/tours + /admin/water-activities
**После:** /admin/experiences с фильтром по типу

---

## Предлагаемая архитектура

```text
┌──────────────────────────────────────────────────────────────────┐
│                      НОВАЯ АРХИТЕКТУРА                           │
├──────────────────────────────────────────────────────────────────┤
│  Единая таблица: experiences                                     │
│  ├── experience_type: 'tour' | 'activity' | 'workshop' | ...    │
│  ├── category: 'islands', 'diving', 'culture', 'cooking'...     │
│  ├── tags: ['water', 'adventure', 'family', 'snorkeling']       │
│  └── ... все поля из обеих таблиц                                │
├──────────────────────────────────────────────────────────────────┤
│  UI Навигация:                                                   │
│  ├── /experiences          → Все впечатления (MiniApp)          │
│  ├── /experiences?type=tour → Туры                              │
│  ├── /experiences?type=activity → Активности                    │
│  └── /experiences?tag=water → Водные                            │
├──────────────────────────────────────────────────────────────────┤
│  Категории в Discover:                                           │
│  └── "Experiences" (одна иконка в Travel & Transport)           │
├──────────────────────────────────────────────────────────────────┤
│  Фильтры внутри:                                                 │
│  ├── Type: Tours | Activities | Workshops | Attractions         │
│  ├── Theme: Water | Culture | Nature | Adventure | Food         │
│  ├── Duration: 1-3h | Half-day | Full-day | Multi-day           │
│  └── Features: Equipment included | Kid-friendly | Private      │
└──────────────────────────────────────────────────────────────────┘
```

---

## План миграции (если решите объединять)

### Phase 1: Подготовка данных

**1.1 Создать новую таблицу experiences:**
```sql
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id),
  
  -- Titles & descriptions
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  
  -- Type classification (ключевое поле!)
  experience_type TEXT NOT NULL DEFAULT 'tour', 
    -- 'tour' | 'activity' | 'workshop' | 'attraction' | 'event'
  category TEXT, -- 'islands', 'diving', 'culture', etc.
  tags TEXT[] DEFAULT '{}', -- ['water', 'adventure', 'snorkeling']
  
  -- Pricing
  price DECIMAL(10,2),
  price_per TEXT DEFAULT 'person', -- 'person' | 'group' | 'hour'
  currency TEXT DEFAULT 'THB',
  
  -- Duration (unified to minutes)
  duration_minutes INTEGER,
  
  -- Participants
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER DEFAULT 20,
  age_restriction INTEGER,
  
  -- Location
  meeting_point TEXT,
  meeting_point_lat DECIMAL(10,7),
  meeting_point_lng DECIMAL(10,7),
  location_name TEXT,
  
  -- Details
  difficulty TEXT DEFAULT 'easy',
  includes JSONB DEFAULT '[]',
  excludes JSONB DEFAULT '[]',
  highlights JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '[]',
  itinerary JSONB DEFAULT '[]',
  
  -- Equipment/Safety (for activities)
  equipment_included BOOLEAN DEFAULT false,
  is_certified BOOLEAN DEFAULT false,
  certification_details TEXT,
  safety_briefing_required BOOLEAN DEFAULT false,
  
  -- Media
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  
  -- Scheduling
  available_days TEXT[] DEFAULT '{}',
  start_times TEXT[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Approval
  approval_status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Aggregator support
  source_type TEXT DEFAULT 'native',
  partner_id UUID,
  external_link TEXT,
  commission_rate DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для быстрой фильтрации
CREATE INDEX idx_experiences_type ON experiences(experience_type);
CREATE INDEX idx_experiences_category ON experiences(category);
CREATE INDEX idx_experiences_active ON experiences(is_active, is_featured);
CREATE INDEX idx_experiences_provider ON experiences(provider_id);
```

**1.2 Миграция данных:**
```sql
-- Мигрировать туры
INSERT INTO experiences (
  id, provider_id, title_en, title_ru, description_en, description_ru,
  experience_type, category, 
  price, currency, duration_minutes,
  max_participants, meeting_point, difficulty,
  includes, excludes, highlights, itinerary,
  cover_image, images, available_days, start_times,
  is_active, is_featured, rating, review_count,
  approval_status, source_type, partner_id, external_link, commission_rate,
  created_at, updated_at
)
SELECT 
  id, provider_id, title_en, title_ru, description_en, description_ru,
  'tour', category,
  price, currency, (duration_hours * 60)::integer,
  max_participants, meeting_point, difficulty,
  includes, excludes, highlights, itinerary,
  cover_image, images, available_days, start_times,
  is_active, is_featured, rating, review_count,
  approval_status, source_type, partner_id, external_link, commission_rate,
  created_at, updated_at
FROM tours;

-- Мигрировать water_activities
INSERT INTO experiences (
  id, provider_id, title_en, title_ru, description_en, description_ru,
  experience_type, category, 
  price, price_per, currency, duration_minutes,
  min_participants, max_participants, age_restriction,
  meeting_point, meeting_point_lat, meeting_point_lng, location_name,
  difficulty, includes, requirements,
  equipment_included, is_certified, certification_details, safety_briefing_required,
  cover_image, images, available_days, start_times,
  is_active, is_featured, rating, review_count,
  approval_status,
  created_at, updated_at
)
SELECT 
  id, provider_id, title_en, title_ru, description_en, description_ru,
  'activity', category,
  price, price_per, currency, duration_minutes,
  min_participants, max_participants, age_restriction,
  meeting_point, meeting_point_lat, meeting_point_lng, location_name,
  difficulty, includes, requirements,
  equipment_included, is_certified, certification_details, safety_briefing_required,
  cover_image, images, available_days, available_times,
  is_active, is_featured, rating, review_count,
  approval_status,
  created_at, updated_at
FROM water_activities;
```

### Phase 2: Обновление Frontend

**2.1 Новые файлы:**
- `src/pages/experiences/ExperiencesIndex.tsx` - главный лендинг
- `src/pages/experiences/ExperienceDetail.tsx` - детальная страница
- `src/pages/experiences/ExperienceBooking.tsx` - бронирование
- `src/hooks/useExperiences.ts` - новый unified hook
- `src/components/filters/ExperiencesFilters.tsx` - фильтры

**2.2 Редиректы для обратной совместимости:**
- `/tours` → `/experiences?type=tour`
- `/tours/:id` → `/experiences/:id`
- `/water` → `/experiences?type=activity`
- `/water/:id` → `/experiences/:id`

**2.3 Обновить category_groups:**
- Удалить "Water Sports" как отдельную группу
- Обновить "Travel & Transport" → добавить единую категорию "Experiences"

### Phase 3: Обновление Vendor/Admin

**3.1 Vendor Portal:**
- Объединить VendorTours + VendorActivities → VendorExperiences
- Добавить селектор experience_type при создании

**3.2 Admin Panel:**
- Объединить AdminTours + AdminWaterActivities → AdminExperiences
- Добавить фильтр по experience_type

---

## Альтернативный вариант: Виртуальное объединение

Если миграция слишком рискованна, можно создать "виртуальную" объединенную таксономию:

**Оставить две таблицы, но:**
1. Создать `useExperiences` hook, который объединяет данные из обеих таблиц
2. Создать единую страницу `/experiences` с unified UI
3. Оставить `/tours` и `/water` как legacy routes с редиректами

Преимущества: меньше риска, постепенная миграция
Недостатки: дублирование логики, сложнее поддерживать

---

## Резюме: Да, объединять стоит

| Аспект | До | После |
|--------|-----|------|
| Таблицы в БД | 2 (tours, water_activities) | 1 (experiences) |
| Страницы в UI | 2 (/tours, /water) | 1 (/experiences) |
| Vendor страницы | 2 | 1 |
| Admin страницы | 2 | 1 |
| Категории в Discover | 2 иконки | 1 иконка |
| UX ясность | Запутанно | Чисто (как Klook) |
| Фильтрация | По разным таблицам | Единые фильтры |
| Cross-sell | Ограничено | Легко комбинировать |

Рекомендую **Phase 1** как первый шаг - создание таблицы и миграция данных. Это можно сделать без изменения UI, протестировать, и только потом переключить фронтенд.

