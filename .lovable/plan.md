
# Редизайн Discover — из списка в визуальный хаб

## Проблема

Текущий Discover — это плоский список кнопок с иконками. Нет фото, нет визуальной иерархии, нет "wow-эффекта". Страница не вызывает желания исследовать платформу.

## Концепция: "Visual Life Hub"

Вдохновление: Airbnb Experiences + Klook + Apple TV. Фото-первый подход с чистой типографикой и мягкими анимациями.

## Структура новой страницы

```text
+--------------------------------------------------+
|  Header: "Life in Phuket" + Search               |
+--------------------------------------------------+
|                                                    |
|  [Hero Banner — full-width photo card]            |
|  "Your life, simplified"                           |
|  Large atmospheric photo with soft gradient        |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  FEATURED STRIP (horizontal scroll)               |
|  [Photo]  [Photo]  [Photo]  [Photo]               |
|  Yachts   Beauty   Dining   Experiences           |
|  4 top-tier services with large photo cards        |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  LIFE SITUATIONS (2-col cards with subtle color)  |
|  [Arrival]      [Daily Life]                      |
|  [Leisure]      [Health]                          |
|  [Family]       [Property]                        |
|  [Relocation]   [Business]                        |
|  Each card: icon + title + description + arrow    |
|  Subtle unique bg color per card (no gradients)   |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  ALL SERVICES (compact 4-col icon grid)           |
|  30+ mini-apps as small icon+label tiles          |
|  Grouped by category with section headers         |
|  Minimizes scrolling for power users              |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  SUPPORT BLOCK (unchanged)                        |
|  WhatsApp + Call CTA                              |
|                                                    |
+--------------------------------------------------+
```

## Детали реализации

### 1. Hero Banner (новый блок)
- Полноширинный фото-блок с атмосферной картинкой Пхукета
- Мягкий градиент overlay (from-black/60 to-transparent)
- Заголовок "Your life, simplified" и подзаголовок
- Высота: ~200px мобайл, ~280px десктоп
- Без кнопок — чисто эмоциональный якорь

### 2. Featured Strip (новый блок)
- Горизонтальный скролл с 4-6 фото-карточками топ-сервисов
- Каждая карточка: 160x200px, фото + название + badge с ценой
- Сервисы: Experiences, Yachts, Beauty, Transport, Restaurants, Flowers
- Snap scrolling на мобайле

### 3. Life Situations (редизайн)
- Из плоского списка в 2-колоночную сетку с цветными карточками
- Каждая карточка получает уникальный мягкий bg (amber-50 для Arrival, sky-50 для Leisure, etc.)
- Иконка в цветном кружке + заголовок + описание + стрелка
- Без фото (отличие от Featured Strip — здесь фокус на навигации)
- Hover: мягкий shadow и приподнятие

### 4. All Services Grid (новый блок)
- Компактная сетка 4 колонки всех мини-аппов
- Маленькие тайлы: иконка 32px + название
- Группировка по категориям из VERTICAL_GROUPS (Home, Transport, Leisure, etc.)
- Заголовки секций — мелкий uppercase текст
- Сворачиваемый блок (по умолчанию показываются первые 2 группы)

### 5. Поиск
- Остается в хедере через MiniAppLayout (без изменений)

## Технический план

### Файлы:

1. **`src/pages/Discover.tsx`** — полная переработка:
   - Убираем плоский список ситуаций
   - Добавляем 4 секции: Hero, Featured, Situations Grid, All Services
   - Используем существующие данные из LIFE_CONTEXTS и VERTICAL_GROUPS
   
2. **`src/components/discover/DiscoverHero.tsx`** (новый) — атмосферный фото-баннер

3. **`src/components/discover/FeaturedStrip.tsx`** (новый) — горизонтальный скролл фото-карточек

4. **`src/components/discover/LifeSituationsGrid.tsx`** (новый) — 2-колоночная сетка ситуаций с цветами

5. **`src/components/discover/AllServicesGrid.tsx`** (новый) — компактная иконочная сетка всех сервисов

### Визуальные стандарты:
- Никаких градиентов на карточках (кроме фото-overlay)
- rounded-2xl везде
- Мягкие тени вместо бордеров
- framer-motion для появления секций (stagger)
- Семантические токены цветов (bg-amber-50/50, bg-sky-50/50, etc.)
