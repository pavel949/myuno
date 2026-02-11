
# Desktop UX Overhaul — Airbnb-Level Professional Design

## Текущая проблема

Сейчас десктопная версия выглядит как увеличенная мобильная: мелкие карточки, много пустого пространства, визуально бедно. Нет ощущения "настоящего" веб-приложения.

## Референс: Airbnb Desktop

Ключевые принципы, которые делают Airbnb профессиональным:

1. **Полноширинный контент** — карточки занимают всю ширину, контент дышит
2. **Крупная поисковая строка** в центре header — главный элемент
3. **Горизонтальные карусели** с большими фото-карточками
4. **Четкая визуальная иерархия** — крупные заголовки секций, много воздуха
5. **Минимализм навигации** — header + контент, никаких sidebar-ов
6. **Карточки с фотографиями** вместо текстовых списков

## План изменений

### 1. Header — центрированный поиск (как Airbnb)

На десктопе поиск переедет в центр header, станет крупнее и заметнее с сегментами "Where / When / Who":

```text
[myUNO]  [Home  Discover  Market  Me]  [Where | When | Who 🔍]  [🌐 🛒 👤]
```

**Файл**: `src/components/layout/AppHeader.tsx`
- Расширить поиск из HeroBlock в header на десктопе
- Убрать дублирование поиска на главной (на desktop он будет только в header)

### 2. Hero Block — десктопная адаптация

На десктопе HeroBlock трансформируется: приветствие становится крупным (text-3xl), поисковая строка скрывается (она уже в header), добавляется визуальный акцент.

**Файл**: `src/components/home/HeroBlock.tsx`
- Desktop: крупный greeting без поиска (поиск в header)
- Mobile: без изменений

### 3. Quick Actions — горизонтальная полоса на всю ширину

Вместо 4-колоночной сетки на десктопе — одна полноширинная строка из 8 иконок в формате Airbnb categories (горизонтальный скролл-ribbon):

**Файл**: `src/components/home/QuickActionsGrid.tsx`
- Desktop: `flex` в одну строку, увеличенные иконки (64x64), подписи text-xs
- Mobile: без изменений (4-col grid)

### 4. Explore Sections — карточки с фотографиями в grid

Главное визуальное изменение: вместо текстовых списков (icon + text) — карточки в 3-4 колонки с фоновыми изображениями, как у Airbnb:

```text
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  [photo bg]  │ │  [photo bg]  │ │  [photo bg]  │ │  [photo bg]  │
│              │ │              │ │              │ │              │
│  Things to do│ │  Transport   │ │  Yachts      │ │  Beauty      │
│  Tours, ...  │ │  Cars, ...   │ │  Day trips   │ │  Salons, ... │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Файл**: `src/components/home/HomeExploreSections.tsx`
- Desktop (lg+): 3- или 4-колоночная grid с aspect-ratio карточками, фоновые gradient overlays
- Mobile: текущий компактный формат без изменений

### 5. Index Layout — убрать тесноту

Правая колонка (4/12) слишком узкая. Контент перераспределится:

```text
Desktop layout:
┌───────────────────────────────────────────────────────────┐
│  Header: [myUNO] [Nav] [Search bar] [Utils]               │
├───────────────────────────────────────────────────────────┤
│  Greeting (large)        │  Weather widget (compact)      │
│  Persona chips           │                                │
│  Quick Actions (full-width ribbon)                        │
├───────────────────────────────────────────────────────────┤
│  Explore (4-col photo grid)                               │
├───────────────────────────────────────────────────────────┤
│  Services (3-col)   │  LifeOS Focus  │  Emergency         │
├───────────────────────────────────────────────────────────┤
│  Footer                                                   │
└───────────────────────────────────────────────────────────┘
```

**Файл**: `src/pages/Index.tsx`
- Quick Actions и Explore — полноширинные (12 cols) на десктопе
- Вторичный контент (Emergency, LifeOS, Support) — 3-колоночная grid внизу
- Погода интегрируется рядом с greeting вместо отдельной колонки

### 6. Typography — масштаб для десктопа

Заголовки секций увеличатся на десктопе:
- Greeting: `text-xl` -> `lg:text-3xl`
- Section headers: `text-xs uppercase` -> `lg:text-lg font-semibold`  (нормальный регистр)
- Body: останется `text-sm`

Затронутые файлы: `HeroBlock.tsx`, `HomeExploreSections.tsx`, `EmergencyQuickAccess.tsx`

### 7. SmartWidget — горизонтальный на десктопе

Вместо вертикальной карточки в узкой колонке — компактная горизонтальная полоса рядом с greeting:

**Файл**: `src/components/home/SmartWidget.tsx`
- Desktop: inline рядом с hero, горизонтальный формат
- Mobile: без изменений

## Затрагиваемые файлы

| Файл | Тип изменения |
|------|--------------|
| `src/components/layout/AppHeader.tsx` | Центрированный поиск на desktop |
| `src/components/home/HeroBlock.tsx` | Крупный greeting, скрыть search на lg |
| `src/components/home/QuickActionsGrid.tsx` | Полноширинная полоса на desktop |
| `src/components/home/HomeExploreSections.tsx` | Фото-карточки в 3-4 col grid |
| `src/pages/Index.tsx` | Новый layout: full-width секции |
| `src/components/home/SmartWidget.tsx` | Горизонтальный формат на desktop |
| `src/components/home/EmergencyQuickAccess.tsx` | Desktop typography |

## Не затрагивается

- Мобильная версия — все изменения через responsive breakpoints (lg:)
- Бренд-бук и дизайн-токены — соблюдаются
- Backend / данные — только UI
