
# План: Интеграция Investment Hub с недвижимостью Пхукета

## Обзор текущего состояния

### Что уже есть:
- **property_projects** — 6 комплексов с полями: `developer_name`, `investment_enabled`, `funding_goal`, `min_investment`, `roi_projected`, `muuno_score`, `risk_level`
- **investment_projects** — отдельная таблица с `property_project_id` (FK к property_projects)
- **5 застройщиков** в базе: Phuket Premier Developers, Laguna Phuket Development, Andaman Luxury Homes, и др.
- **11 категорий инвестиций** в lookup_values (включая Off-Plan Property, Hospitality, Yacht Charter и др.)
- **Компоненты**: InvestmentCard, MuunoScoreWidget, FundingProgress, ScoreBreakdown

### Проблемы текущей архитектуры:
1. Нет таблицы `developers` — застройщики хранятся как текст в `property_projects.developer_name`
2. Нет связи между investment_projects и property_projects в UI
3. Нет специализированного каталога новостроек с фильтрами
4. ProjectCard и ProjectCarouselCard не показывают инвестиционные метрики
5. Нет карусели "Новостройки Пхукета" на главном экране

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  УРОВЕНЬ ДАННЫХ                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  developers (НОВАЯ ТАБЛИЦА)                                                 │
│  ├─ id, name_en, name_ru, slug                                             │
│  ├─ logo_url, cover_image                                                  │
│  ├─ description_en, description_ru                                         │
│  ├─ founded_year, projects_completed                                       │
│  ├─ total_units_sold, average_rating                                       │
│  ├─ website, phone, email                                                  │
│  ├─ is_verified, is_featured                                               │
│  └─ muuno_developer_score (0-100)                                          │
│                                                                             │
│  property_projects (ОБНОВЛЕНИЕ)                                             │
│  ├─ developer_id (FK → developers)  ← НОВОЕ                                │
│  ├─ project_status: 'offplan' | 'under_construction' | 'completed'         │
│  ├─ completion_date, construction_progress (0-100%)                        │
│  ├─ price_from, price_to                                                   │
│  └─ ... (существующие поля сохраняются)                                   │
│                                                                             │
│  investment_projects (СВЯЗЬ)                                                │
│  └─ property_project_id (FK) ← уже есть!                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Визуальная архитектура

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ГЛАВНЫЙ ЭКРАН (Index.tsx)                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [HeroBlock с AudienceCards]                                                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 🏗️ НОВОСТРОЙКИ ПХУКЕТА                           [Смотреть все →]   │ │
│  │                                                                       │ │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │ │ [Рендер]    │ │ [Рендер]    │ │ [Рендер]    │ │ [Рендер]    │  →   │ │
│  │ │             │ │             │ │             │ │             │      │ │
│  │ │ 🏗️ Offplan │ │ 🔨 Строится│ │ ✅ Готово   │ │ 🏗️ Offplan │      │ │
│  │ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤      │ │
│  │ │ Kamala      │ │ Laguna      │ │ Patong      │ │ Rawai       │      │ │
│  │ │ Residence   │ │ Park        │ │ Tower       │ │ Beach       │      │ │
│  │ │─────────────│ │─────────────│ │─────────────│ │─────────────│      │ │
│  │ │ 🏛️ Andaman │ │ 🏛️ Laguna  │ │ 🏛️ Premier │ │ 🏛️ Southern│      │ │
│  │ │ от ฿4.5M   │ │ от ฿6.2M   │ │ от ฿3.8M   │ │ от ฿5.1M   │      │ │
│  │ │ ROI 8%     │ │ ROI 6%     │ │ ROI 7%     │ │ ROI 9%     │      │ │
│  │ │ ⭐85 Score │ │ ⭐78 Score │ │ ⭐82 Score │ │ ⭐88 Score │      │ │
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [QuickAccessChips + QuickActionsGrid]                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Новая карточка новостройки

```text
┌───────────────────────────────────────┐
│  [Рендер/Фото комплекса]              │
│                                       │
│  🏗️ Offplan  ───  ⚡ Горячее          │  ← Статус проекта + Badge
│                                       │
│  ████████░░░░░░░░ 45%                 │  ← Прогресс строительства
└───────────────────────────────────────┘
  Kamala Luxury Residence
  📍 Kamala · 🏛️ Andaman Luxury Homes   ← Застройщик!
  
  Цена: от ฿4,500,000
  
  ┌─────────┬─────────┬─────────┐
  │ ROI 8%  │ Q2 2025 │ Score 85│
  │ годовых │ сдача   │ muUNO   │
  └─────────┴─────────┴─────────┘
  
  [Подробнее] [Инвестировать]
```

---

## Фазы реализации

### Фаза 1: Расширение базы данных

**1.1 Создать таблицу developers**
```sql
CREATE TABLE public.developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  cover_image TEXT,
  description_en TEXT,
  description_ru TEXT,
  founded_year INTEGER,
  projects_completed INTEGER DEFAULT 0,
  total_units_sold INTEGER DEFAULT 0,
  average_rating NUMERIC(2,1) DEFAULT 0,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  muuno_score INTEGER CHECK (muuno_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Миграция существующих застройщиков
INSERT INTO developers (name_en, name_ru, slug)
SELECT DISTINCT 
  developer_name, 
  developer_name, 
  lower(replace(developer_name, ' ', '-'))
FROM property_projects 
WHERE developer_name IS NOT NULL;
```

**1.2 Обновить property_projects**
```sql
ALTER TABLE property_projects 
ADD COLUMN developer_id UUID REFERENCES developers(id),
ADD COLUMN project_status TEXT DEFAULT 'offplan' 
  CHECK (project_status IN ('offplan', 'under_construction', 'completed')),
ADD COLUMN completion_date DATE,
ADD COLUMN construction_progress INTEGER DEFAULT 0 
  CHECK (construction_progress BETWEEN 0 AND 100),
ADD COLUMN price_from NUMERIC,
ADD COLUMN price_to NUMERIC,
ADD COLUMN units_available INTEGER DEFAULT 0,
ADD COLUMN units_sold INTEGER DEFAULT 0;

-- Связать существующие проекты с застройщиками
UPDATE property_projects pp
SET developer_id = d.id
FROM developers d
WHERE pp.developer_name = d.name_en;
```

---

### Фаза 2: Хуки и типы

**2.1 Новый hook: useDevelopers.ts**
```typescript
interface Developer {
  id: string;
  nameEn: string;
  nameRu: string;
  logoUrl: string | null;
  projectsCompleted: number;
  isVerified: boolean;
  muunoScore: number | null;
}

export function useDevelopers() { ... }
export function useDeveloper(id: string) { ... }
```

**2.2 Обновить usePropertyProjectsWithStats.ts**
Добавить поля: `developerName`, `developerLogo`, `projectStatus`, `completionDate`, `constructionProgress`, `priceFrom`, `roiProjected`, `muunoScore`

**2.3 Новый hook: useOffplanProjects.ts**
Специализированный hook для новостроек с фильтрами:
- По застройщику
- По району
- По статусу (offplan/under_construction)
- По ценовому диапазону
- По muUNO Score

---

### Фаза 3: UI Компоненты

**3.1 OffplanProjectCard.tsx** (НОВЫЙ)
Расширенная карточка для новостроек:
- Статус проекта (badge)
- Прогресс строительства (progress bar)
- Информация о застройщике
- muUNO Score
- Цена "от"
- ROI
- Дата сдачи

**3.2 OffplanPromoSection.tsx** (НОВЫЙ)
Промо-блок для главного экрана:
- Заголовок "Новостройки Пхукета"
- Горизонтальная карусель OffplanProjectCard
- CTA "Смотреть все"

**3.3 DeveloperBadge.tsx** (НОВЫЙ)
Компактный бейдж застройщика:
- Лого + название
- Verified галочка
- Кликабельный → страница застройщика

**3.4 Обновить ProjectCarouselCard.tsx**
Добавить: застройщик, статус проекта, muUNO Score (опционально)

---

### Фаза 4: Страницы

**4.1 /offplan — Каталог новостроек**
```text
[Hero: Новостройки Пхукета 2024-2025]

Фильтры:
[Район ▾] [Застройщик ▾] [Цена ▾] [Статус ▾] [muUNO Score ▾]

Сортировка:
[По Score] [По цене] [По дате сдачи]

Результаты:
┌────────────┐ ┌────────────┐ ┌────────────┐
│ [Project1] │ │ [Project2] │ │ [Project3] │
└────────────┘ └────────────┘ └────────────┘
```

**4.2 /offplan/:id — Детали новостройки**
Расширенная страница проекта:
- Галерея рендеров и 3D-туры
- Информация о застройщике
- График строительства (timeline)
- Планировки и цены
- muUNO Scoring breakdown
- Инвестиционные метрики
- Документы проекта
- CTA: "Записаться на просмотр" / "Инвестировать"

**4.3 /developers — Каталог застройщиков**
Список всех застройщиков с:
- Лого, название, рейтинг
- Количество проектов
- muUNO Score
- Кнопка "Проекты"

**4.4 /developers/:id — Страница застройщика**
- Профиль компании
- Портфолио проектов
- Статистика
- Отзывы

---

### Фаза 5: Интеграция

**5.1 Обновить главный экран (Index.tsx)**
Добавить `OffplanPromoSection` после QuickAccessChips

**5.2 Обновить HeroBlock.tsx**
Добавить 4-ю AudienceCard "Инвесторам":
```typescript
{
  id: 'investors',
  persona: 'investor',
  icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
  title: { en: 'Investors', ru: 'Инвесторам' },
  services: { en: 'Off-plan • ROI • Due Diligence', ru: 'Новостройки • ROI • Экспертиза' },
}
```

**5.3 Связать InvestmentIndex с новостройками**
- Секция "Новостройки" использует данные из property_projects с investment_enabled=true
- Клик на карточку → /offplan/:id или /invest/:id в зависимости от наличия investment_project

**5.4 Обновить ProjectDetail.tsx**
Добавить секцию "Инвестиционные возможности" если `investment_enabled=true`

---

## Навигация и связи

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ТОЧКИ ВХОДА                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Главный экран → OffplanPromoSection → /offplan                            │
│                                                                             │
│  HeroBlock → AudienceCard "Инвесторам" → /invest                           │
│                                                                             │
│  QuickAccessChips → "Инвестиции" → /invest                                 │
│                                                                             │
│  /property → ProjectPromoSection → /complexes                              │
│                                                                             │
│  /complexes/:id → "Инвестировать" → /invest/:investmentId                  │
│                                                                             │
│  /invest → "Новостройки" секция → /offplan                                 │
│                                                                             │
│  /offplan/:id → DeveloperBadge → /developers/:developerId                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Файлы для создания/изменения

| Файл | Тип | Описание |
|------|-----|----------|
| `supabase/migrations/xxx_developers.sql` | NEW | Таблица developers + обновление property_projects |
| `src/hooks/useDevelopers.ts` | NEW | CRUD для застройщиков |
| `src/hooks/useOffplanProjects.ts` | NEW | Хук для новостроек с фильтрами |
| `src/components/property/OffplanProjectCard.tsx` | NEW | Карточка новостройки |
| `src/components/property/OffplanPromoSection.tsx` | NEW | Промо-блок для главной |
| `src/components/property/DeveloperBadge.tsx` | NEW | Бейдж застройщика |
| `src/pages/property/OffplanIndex.tsx` | NEW | Каталог новостроек |
| `src/pages/property/OffplanDetail.tsx` | NEW | Детали новостройки |
| `src/pages/property/DevelopersIndex.tsx` | NEW | Каталог застройщиков |
| `src/pages/property/DeveloperDetail.tsx` | NEW | Страница застройщика |
| `src/pages/Index.tsx` | UPDATE | Добавить OffplanPromoSection |
| `src/components/home/HeroBlock.tsx` | UPDATE | Добавить AudienceCard "Инвесторам" |
| `src/hooks/usePropertyProjectsWithStats.ts` | UPDATE | Добавить поля застройщика и инвестиций |
| `src/components/property/ProjectCarouselCard.tsx` | UPDATE | Показывать застройщика |
| `src/pages/invest/InvestmentIndex.tsx` | UPDATE | Связь с новостройками |
| `src/components/layout/AnimatedRoutes.tsx` | UPDATE | Новые маршруты |

---

## Техническое резюме

| Метрика | Значение |
|---------|----------|
| Новые таблицы | 1 (developers) |
| Обновляемые таблицы | 1 (property_projects) |
| Новые страницы | 4 (/offplan, /offplan/:id, /developers, /developers/:id) |
| Новые компоненты | 4 |
| Новые хуки | 2 |
| Обновляемые файлы | 7 |
| Риск регрессии | Низкий — новая функциональность, не ломает существующее |

---

## Порядок реализации

1. **Фаза 1**: Миграция БД (developers + property_projects)
2. **Фаза 2**: Хуки (useDevelopers, useOffplanProjects, обновить usePropertyProjectsWithStats)
3. **Фаза 3**: UI компоненты (OffplanProjectCard, DeveloperBadge, OffplanPromoSection)
4. **Фаза 4**: Страницы (OffplanIndex, OffplanDetail, DevelopersIndex, DeveloperDetail)
5. **Фаза 5**: Интеграция (Index.tsx, HeroBlock.tsx, InvestmentIndex.tsx, маршруты)
