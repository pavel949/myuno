
# Таксономия Thumbtack для myUNO Home Services

## Почему Thumbtack?

**Thumbtack** — крупнейший американский marketplace домашних услуг (оценка $3.2B, 10M+ клиентов). Их таксономия идеально подходит для myUNO по следующим причинам:

| Критерий | Thumbtack | TaskRabbit | Helpling |
|----------|-----------|------------|----------|
| Смешанный рынок (мастера + компании) | ✅ | ⚠️ Только фрилансеры | ❌ Только компании |
| Глубина категорий | 4 домена → 25+ категорий | 8 flat categories | 5 категорий |
| Локальная адаптация | ✅ Региональные услуги | ⚠️ Только крупные города | ❌ |
| Подходит для Азии | ✅ | ⚠️ | ❌ |

---

## Адаптированная таксономия для myUNO

### Структура: 4 домена → 16 категорий

```
🏠 HOME MAINTENANCE (Обслуживание дома)
├── handyman      → Мастер на час (общие работы)
├── plumbing      → Сантехник
├── electrical    → Электрик  
├── ac            → Кондиционеры / HVAC
├── repair        → Ремонт техники
└── security      → Системы безопасности

✨ CLEANING (Уборка и гигиена)
├── home-cleaning → Уборка дома
├── deep-cleaning → Генеральная уборка
├── laundry       → Прачечная
├── pest          → Дезинсекция
└── pool          → Бассейн (химия + чистка)

🌿 OUTDOOR (Двор и территория)
├── garden        → Садовник / ландшафт
├── pool-tech     → Техобслуживание бассейна
└── exterior      → Мойка фасадов / крыш

🚚 LOGISTICS (Логистика)
├── moving        → Переезд и грузчики
├── water-delivery→ Доставка воды
└── road-assistance → Помощь на дороге
```

---

## Исправление текущих проблем

### Проблема 1: Несинхронизированные ID

| Файл | Текущие ID | Нужные ID |
|------|------------|-----------|
| ServicesIndex.tsx | `ac`, `repair` | `ac`, `repair` ✓ |
| ServicesFilters.tsx | `ac-service`, `pest-control`, `gardening` | `ac`, `pest`, `garden` ✗ |
| useHomeServices.ts | `hvac`, `tech` | Объединить в `ac`, `repair` |

**Решение:** Единый источник правды в `homeServicesTaxonomy.ts`

### Проблема 2: Нет различия мастер/компания

Добавить в `providers`:
- `provider_type`: `'individual'` | `'company'`
- `response_time_minutes`: число (для "⚡ Отвечает за 15 мин")
- `has_insurance`: boolean
- `has_guarantee`: boolean

### Проблема 3: Дублирование с /cleaning

**Решение:** Cleaning становится поддоменом Home Services:
- `/services` — главная страница с 4 доменами
- Домен "Cleaning" показывает контент из `cleaning_services` table
- `/cleaning` — остается как shortcut (redirect на `/services?domain=cleaning`)

---

## Новая структура UI

```
┌─────────────────────────────────────────────────────────────┐
│  🔧 Домашние услуги              [🔍] [⚙️]                  │
│  48 профессионалов                                          │
├─────────────────────────────────────────────────────────────┤
│  Domain Tabs:                                               │
│  [Все] [🏠 Ремонт] [✨ Уборка] [🌿 Двор] [🚚 Логистика]     │
├─────────────────────────────────────────────────────────────┤
│  Quick Grid (4 самых популярных в выбранном домене):        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │   🔨   │ │   🚿   │ │   ⚡   │ │   ❄️   │               │
│  │ Мастер │ │Сантехн │ │Электрик│ │   AC   │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
├─────────────────────────────────────────────────────────────┤
│  Provider Type Toggle:                                       │
│  [Все] [👤 Мастера] [🏢 Компании]                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [Logo] ProFix Electrical    ⭐ 4.9 (156)                ││
│  │        🏢 Компания • ✅ Верифицирован                   ││
│  │        ⚡ Электрик • 🛡️ Страховка • ⚡ 30 мин           ││
│  │        от ฿500/вызов                                    ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [Photo] Сергей М.           ⭐ 4.8 (89)                 ││
│  │         👤 Частный мастер • 🔨 Мастер на час            ││
│  │         🇷🇺 Русский • ⚡ 15 мин отклик                   ││
│  │         от ฿300/час                                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Файлы для изменения

### Новые файлы

| Файл | Назначение |
|------|------------|
| `src/lib/config/homeServicesTaxonomy.ts` | Единый источник категорий (Thumbtack-based) |
| `src/components/services/ServiceProviderCard.tsx` | Карточка с визуальным различием мастер/компания |
| `src/components/services/ProviderTypeToggle.tsx` | Переключатель типа исполнителя |
| `src/components/services/DomainTabs.tsx` | Табы по доменам |

### Изменяемые файлы

| Файл | Изменения |
|------|-----------|
| `src/pages/services/ServicesIndex.tsx` | Новая структура: Domains → Quick Grid → Type Toggle → Cards |
| `src/components/filters/ServicesFilters.tsx` | Импорт категорий из taxonomy, добавление providerType |
| `src/hooks/useHomeServices.ts` | Синхронизация категорий, поддержка provider_type |

### Миграция БД

```sql
-- Добавить поля для различения типов исполнителей
ALTER TABLE providers 
  ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS has_insurance BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_guarantee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_domains TEXT[] DEFAULT '{}';

-- Нормализовать существующие категории
UPDATE providers SET business_category = 'ac' WHERE business_category = 'hvac';
UPDATE providers SET business_category = 'repair' WHERE business_category = 'tech';
```

---

## Порядок реализации

### Шаг 1: Таксономия и БД
1. Создать `homeServicesTaxonomy.ts` с Thumbtack-структурой
2. Миграция БД: добавить `provider_type`, `has_insurance`, `has_guarantee`
3. Нормализовать `business_category` в существующих записях

### Шаг 2: Компоненты
1. `DomainTabs.tsx` — навигация по 4 доменам
2. `ProviderTypeToggle.tsx` — переключатель Все/Мастера/Компании
3. `ServiceProviderCard.tsx` — карточка с бейджами и типом

### Шаг 3: Интеграция
1. Обновить `ServicesIndex.tsx` с новой структурой
2. Синхронизировать `ServicesFilters.tsx` с taxonomy
3. Обновить `useHomeServices.ts` для фильтрации по домену и типу

### Шаг 4: Проверка
1. Тестирование фильтров по категориям
2. Тестирование фильтров по типу исполнителя
3. Тестирование поиска
4. Проверка корректной работы на мобильных устройствах

---

## Ожидаемый результат

| До | После |
|----|-------|
| Плоский список 8 категорий | 4 домена → 16 категорий |
| Фильтры не работают (разные ID) | Единая таксономия |
| Мастера и компании выглядят одинаково | Визуальное различие + бейджи |
| Дублирование с /cleaning | Cleaning как домен внутри Services |
| Нет информации о скорости отклика | "⚡ 15 мин" badge |
