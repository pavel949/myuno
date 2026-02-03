
# План: Унификация UX и Дизайн-Системы Главной Страницы

## Обзор проблем

Главная страница имеет критические проблемы с визуальной консистентностью:
- Разные радиусы скругления (xl vs 2xl)
- Несогласованные тени и границы
- Три разных паттерна заголовков секций
- Разная высота изображений в карусках
- Хаотичная система бейджей
- Переполненность блоками (12 секций)
- Дублирование контента (рекомендации показываются 2-3 раза)

---

## Фаза 1: Создание унифицированных компонентов

### 1.1 Создать `UnifiedSectionHeader`

Единый компонент для всех заголовков секций:

```text
┌─────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                   │
│  │ 🎯   │  Заголовок секции            [Смотреть всё →]    │
│  │icon  │  Подзаголовок                                     │
│  └──────┘                                                   │
└─────────────────────────────────────────────────────────────┘
```

Параметры:
- `icon`: emoji или LucideIcon
- `title` / `titleRu`: заголовок
- `subtitle` / `subtitleRu`: опционально
- `seeAllPath`: ссылка "Смотреть всё"
- `variant`: `default` | `gradient` (с фоновой подложкой)

### 1.2 Создать `UnifiedContentCard`

Единая карточка контента с вариантами:

```text
Варианты:
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   [IMAGE 4:3]    │  │   [IMAGE 1:1]    │  │  HERO VARIANT    │
│                  │  │                  │  │   [IMAGE 16:9]   │
├──────────────────┤  ├──────────────────┤  │   + overlay      │
│ Title            │  │ Title            │  │   + big text     │
│ Subtitle • ⭐4.8 │  │ Price            │  │                  │
│ Price            │  │ [+] cart         │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
   experience           product              featured
```

Фиксированные параметры:
- Радиус: `rounded-2xl` (16px) — везде
- Тень: `shadow-sm` → `shadow-md` on hover
- Изображение: `aspect-[4/3]` для опыта, `aspect-square` для товаров
- Hover: `scale-[1.03]` на изображении, `-translate-y-0.5` на карточке

### 1.3 Унифицировать систему бейджей

Создать `BadgeSystem` в `designTokens.ts`:

| Тип | Цвет | Использование |
|-----|------|---------------|
| `new` | `bg-blue-500` | Новый товар/услуга |
| `hot` | `from-amber-500 to-orange-500` | Популярное |
| `sale` | `bg-red-500` | Скидка (-X%) |
| `featured` | `from-primary to-primary-600` | Рекомендуем |
| `type` | `bg-muted` | Категория (Тур/Активность) |
| `urgent` | `bg-destructive` | SOS/24/7 |

---

## Фаза 2: Упрощение структуры страницы

### 2.1 Новая иерархия (6 блоков вместо 12)

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. HERO BLOCK (объединённый)                                │
│    ┌─────────────────────────────────────────────────────┐  │
│    │ 📍 Phuket  |  myUNO  |  🔍 Search                   │  │
│    │ "Экосистема для жизни за рубежом"                   │  │
│    │ [UNO ALERT 24/7]                                    │  │
│    └─────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ 2. MODE + CATEGORIES                                        │
│    [Услуги] [Товары]                                        │
│    🔥 Популярное  📍 Рядом  🎁 Акции  💅 Красота ...       │
├─────────────────────────────────────────────────────────────┤
│ 3. SMART WIDGET (персонализация)                            │
│    Добрый день! Погода 31°C | Сегодня: Фестиваль           │
├─────────────────────────────────────────────────────────────┤
│ 4. QUICK ACTIONS (6 кнопок вместо 9)                        │
│    [Жильё] [Транспорт] [Яхты] [Туры] [Маркет] [Ещё]        │
├─────────────────────────────────────────────────────────────┤
│ 5. DISCOVERY CAROUSEL (единый)                              │
│    "Лучшее на Пхукете"                                      │
│    [HERO] [card] [card] [card] →                            │
├─────────────────────────────────────────────────────────────┤
│ 6. B2B SECTION (внизу)                                      │
│    [Владельцам] [Партнёрам] [Кошелёк]                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Что объединяем

| Было | Станет |
|------|--------|
| HeroBanner + InlineSearch + SafetyBanner | **Unified Hero Block** |
| ContentModeToggle + CategoryRibbon | **Mode + Categories** (одна секция) |
| ExperiencesSection + RecommendedCarousel | **Discovery Carousel** (один компонент) |
| QuickActionsGrid (9 элементов) | **6 ключевых действий** |

### 2.3 Убираем дублирование

- **SmartWidget** остаётся (уникальный персонализированный контент)
- **RecommendedCarousel** сливается с ExperiencesSection в единый Discovery блок
- **CategoryRibbon** становится частью Mode Toggle секции

---

## Фаза 3: Технические изменения

### 3.1 Новые/обновляемые файлы

| Файл | Действие |
|------|----------|
| `src/lib/designTokens.ts` | Добавить `BADGE_SYSTEM`, `CARD_VARIANTS` |
| `src/components/ui/unified-section-header.tsx` | Создать |
| `src/components/ui/unified-content-card.tsx` | Создать |
| `src/components/home/HeroBlock.tsx` | Создать (объединение Hero+Search+Safety) |
| `src/components/home/DiscoveryCarousel.tsx` | Создать (замена 2 каруселей) |
| `src/components/home/ExperiencesSection.tsx` | Удалить или рефакторить |
| `src/components/home/RecommendedCarousel.tsx` | Удалить |
| `src/components/home/QuickActionsGrid.tsx` | Упростить до 6 элементов |
| `src/pages/Index.tsx` | Обновить структуру |

### 3.2 Design Tokens (дополнения)

```typescript
// designTokens.ts additions
export const BADGE_SYSTEM = {
  new: 'bg-blue-500 text-white',
  hot: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  sale: 'bg-red-500 text-white',
  featured: 'bg-gradient-to-r from-primary to-primary-600 text-white',
  type: 'bg-muted text-foreground',
  urgent: 'bg-destructive text-destructive-foreground',
} as const;

export const CARD_HEIGHTS = {
  experience: 'aspect-[4/3]',  // 144px на карточке 192px ширины
  product: 'aspect-square',     // 1:1
  hero: 'aspect-[16/9]',        // широкий для hero
} as const;

export const CAROUSEL_CARD_WIDTHS = {
  hero: 'w-80',      // 320px
  standard: 'w-64',  // 256px  
  compact: 'w-56',   // 224px
} as const;
```

---

## Фаза 4: UX Improvements

### 4.1 Визуальная иерархия

- **Hero Block**: Золотой акцент, крупный текст, встроенный поиск
- **Mode Toggle**: Яркий индикатор режима (золото/изумруд)
- **Quick Actions**: 6 элементов в 2 ряда (не 9 в 3 ряда)
- **Discovery Carousel**: Hero-карточка первой + стандартные

### 4.2 Улучшение Discovery

Единая карусель "Лучшее на Пхукете" с миксом контента:
- 1 Featured experience (hero card)
- 2-3 Tours
- 2-3 Activities
- Данные из одного запроса с сортировкой по rating

### 4.3 Responsive поведение

| Breakpoint | Quick Actions | Carousel cards |
|------------|---------------|----------------|
| < 375px | 2 колонки | 200px |
| 375-640px | 3 колонки | 240px hero / 200px |
| > 640px | 3 колонки | 320px hero / 256px |

---

## Ожидаемые результаты

1. **Уменьшение визуального шума**: 6 секций вместо 12
2. **Консистентность**: Единые радиусы, тени, бейджи
3. **Улучшение discovery**: Один сильный discovery-блок вместо 2 слабых
4. **Ускорение загрузки**: Меньше компонентов = меньше рендеров
5. **Профессиональный вид**: Klook/Airbnb-level design consistency
