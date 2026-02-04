
# План: Визуальный каталог комплексов и интеграция пути клиента

## Оценка идеи

### ✅ Почему это хорошо для всех пользователей, не только туристов:
1. **Туристы** — ищут отпуск, хотят видеть "готовые решения" в комплексах с удобствами
2. **Резиденты** — ищут долгосрочную аренду, комплексы дают контекст (охрана, бассейн, фитнес)
3. **Инвесторы** — хотят видеть ROI и доступные юниты на продажу
4. **Владельцы** — могут добавить свой объект в каталог комплекса

**Рекомендация:** Показывать карусель комплексов ВСЕМ пользователям, но с адаптивным текстом в зависимости от персоны.

---

## Текущее состояние

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  СЕЙЧАС: PropertyIndex.tsx                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Поиск]                                                                    │
│  [Тип: Все | Кондо | Вилла | Ещё▾]                                         │
│  [Спальни: Студия | 1 | 2 | 3...]                                          │
│  [Теги: ⚡Instant | 🏖️Beach...]                                            │
│  [📍Локации: Patong | Kata...]                                              │
│                                                                             │
│  [🏢 Комплексы: Chip | Chip | Chip...]  ← МЕЛКИЕ ЧИПЫ                      │
│                                                                             │
│  Результаты поиска: Карточки объектов                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

ПРОБЛЕМЫ:
❌ Комплексы показаны как мелкие чипы — не привлекают внимание
❌ Нет маркетингового промо-блока "Посмотрите комплексы!"
❌ Нет карусели с визуальными карточками комплексов
❌ Карточки комплексов не показывают аренду/продажу
❌ Нет deep-link для перехода к конкретному комплексу
```

---

## Целевой UX

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  НОВЫЙ: PropertyIndex.tsx                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Поиск]                                                                    │
│  [Тип: Все | Кондо | Вилла | Ещё▾]  [⚙️]                                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 🏢 Ищете жильё для отпуска или инвестиций?                           │ │
│  │    Посмотрите наши жилые комплексы!                                  │ │
│  │                                                                       │ │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                  │ │
│  │ │ [Фото]   │ │ [Фото]   │ │ [Фото]   │ │ [Фото]   │ →               │ │
│  │ │ Patong   │ │ Laguna   │ │ Rawai    │ │ Kamala   │                  │ │
│  │ │ Tower    │ │ Park     │ │ Beach    │ │ Hills    │                  │ │
│  │ │ 6 rent   │ │ 4 rent   │ │ 4 rent   │ │ 5 rent   │                  │ │
│  │ │ 1 sale   │ │ —        │ │ 1 sale   │ │ —        │                  │ │
│  │ │ от ฿12K  │ │ от ฿42K  │ │ от ฿15K  │ │ от ฿32K  │                  │ │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘                  │ │
│  │                                                                       │ │
│  │ [Смотреть все комплексы →]                                           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [Спальни: Студия | 1 | 2 | 3...]                                          │
│  [Теги: ⚡Instant | 🏖️Beach...]                                            │
│  [📍Локации: Patong | Kata...]                                              │
│                                                                             │
│  45 объектов найдено                                                        │
│  Результаты поиска: Карточки объектов                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Данные в БД (уже готовы!)

### property_projects (6 комплексов)
| Название | Район | Аренда | Продажа | Мин. цена |
|----------|-------|--------|---------|-----------|
| Patong Tower | Patong | 6 | 1 | ฿12,000 |
| Laguna Park | Laguna | 4 | 0 | ฿42,000 |
| Rawai Beachfront | Rawai | 4 | 1 | ฿15,000 |
| Kamala Hills | Kamala | 5 | 0 | ฿32,000 |
| Chalong Bay | Chalong | 2 | 0 | ฿38,000 |
| Title Legendary | — | 0 | 0 | — |

**Вывод:** Данные уже связаны! Можно сразу показывать rent_count / sale_count.

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  НОВЫЕ КОМПОНЕНТЫ                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. ProjectPromoSection.tsx (NEW)                                           │
│     ├─ Промо-заголовок (адаптивный по персоне)                             │
│     ├─ ProjectCarousel (горизонтальная карусель)                           │
│     └─ CTA "Смотреть все комплексы"                                        │
│                                                                             │
│  2. ProjectCarouselCard.tsx (NEW)                                           │
│     ├─ Фото обложки (aspect 16:9)                                          │
│     ├─ Название + район                                                     │
│     ├─ Badges: X rent | Y sale                                              │
│     └─ Мин. цена "от ฿..."                                                  │
│                                                                             │
│  3. usePropertyProjectsWithStats.ts (NEW hook)                              │
│     └─ Агрегация rent_count, sale_count, min_rent_price                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ОБНОВЛЯЕМЫЕ ФАЙЛЫ                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  4. PropertyIndex.tsx (UPDATE)                                              │
│     ├─ Добавить ProjectPromoSection после типов                            │
│     └─ Убрать старые чипы комплексов из QuickFiltersRibbon                 │
│                                                                             │
│  5. ProjectsIndex.tsx (UPDATE)                                              │
│     └─ Deep-link scroll к выбранному комплексу (?highlight=id)             │
│                                                                             │
│  6. QuickFiltersRibbon.tsx (UPDATE)                                         │
│     └─ Удалить секцию проектов (переносится в карусель)                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Фазы реализации

### Фаза 1: Новый хук с агрегацией данных

**Файл:** `src/hooks/usePropertyProjectsWithStats.ts`

```typescript
interface ProjectWithStats {
  id: string;
  nameEn: string;
  nameRu: string;
  coverImage: string | null;
  district: string | null;
  isFeatured: boolean;
  rentCount: number;
  saleCount: number;
  minRentPrice: number | null;
  minSalePrice: number | null;
}

// SQL-запрос с агрегацией (как мы проверили выше — работает!)
SELECT 
  pp.id, pp.name_en, pp.name_ru, pp.cover_image, pp.district, pp.is_featured,
  COUNT(p.id) FILTER (WHERE p.listing_type = 'rent') as rent_count,
  COUNT(p.id) FILTER (WHERE p.listing_type = 'sale') as sale_count,
  MIN(p.price) FILTER (WHERE p.listing_type = 'rent') as min_rent_price,
  MIN(p.price) FILTER (WHERE p.listing_type = 'sale') as min_sale_price
FROM property_projects pp
LEFT JOIN properties p ON p.project_id = pp.id AND p.is_active = true
WHERE pp.is_active = true
GROUP BY pp.id
ORDER BY pp.is_featured DESC, pp.name_en
```

---

### Фаза 2: Карточка комплекса для карусели

**Файл:** `src/components/property/ProjectCarouselCard.tsx`

Компактная карточка для горизонтальной карусели:

```text
┌───────────────────────────────────────┐
│  [Фото комплекса - 16:9]              │
│                                       │
│  ⭐ Featured (если is_featured)       │
└───────────────────────────────────────┘
  Patong Tower Residence
  📍 Patong
  
  🏠 6 rent  |  💰 1 sale
  от ฿12,000/мес
```

**Характеристики:**
- Ширина фиксированная: 280px (мобильная) / 320px (десктоп)
- Клик → переход на `/complexes?highlight={id}`
- Hover эффект: lift + shadow

---

### Фаза 3: Промо-секция с каруселью

**Файл:** `src/components/property/ProjectPromoSection.tsx`

```typescript
interface ProjectPromoSectionProps {
  className?: string;
}

// Адаптивный заголовок по персоне пользователя
const getPromoText = (personas: UserPersona[], isRu: boolean) => {
  const isInvestor = personas.includes('property_owner');
  
  if (isInvestor) {
    return {
      title: isRu ? 'Инвестиционные проекты Пхукета' : 'Phuket Investment Projects',
      subtitle: isRu ? 'Выберите комплекс для прибыльных вложений' : 'Choose a complex for profitable investment',
    };
  }
  
  return {
    title: isRu ? 'Ищете жильё для отпуска или инвестиций?' : 'Looking for vacation or investment property?',
    subtitle: isRu ? 'Посмотрите наши жилые комплексы!' : 'Check out our residential complexes!',
  };
};
```

**Структура:**
1. Градиентный фон (primary/5 → accent/5)
2. Иконка + Заголовок + Подзаголовок
3. Горизонтальная карусель ProjectCarouselCard[]
4. CTA кнопка "Смотреть все комплексы →"

---

### Фаза 4: Deep-link в каталоге комплексов

**Файл:** `src/pages/property/ProjectsIndex.tsx`

При переходе с `/property` на `/complexes?highlight=abc123`:
1. Найти карточку с данным ID
2. scrollIntoView({ behavior: 'smooth', block: 'center' })
3. Добавить кратковременную анимацию highlight (ring-2 ring-primary)

```typescript
const [searchParams] = useSearchParams();
const highlightId = searchParams.get('highlight');

useEffect(() => {
  if (highlightId) {
    const element = document.getElementById(`project-${highlightId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-primary', 'animate-pulse');
      setTimeout(() => {
        element.classList.remove('animate-pulse');
      }, 2000);
    }
  }
}, [highlightId]);
```

---

### Фаза 5: Интеграция в PropertyIndex

**Файл:** `src/pages/property/PropertyIndex.tsx`

Расположение компонентов:

```text
<AirbnbSearchBar />
<PropertyTypeSelector />  ← Типы (Все/Кондо/Вилла/Ещё)

<ProjectPromoSection />   ← НОВЫЙ БЛОК

<BedroomChips />          ← Спальни
<QuickFiltersRibbon />    ← Теги + Локации (БЕЗ проектов!)

<PropertyCards />         ← Результаты
```

---

### Фаза 6: Очистка QuickFiltersRibbon

**Файл:** `src/components/property/QuickFiltersRibbon.tsx`

Удалить секцию "Projects / Complexes Section" (строки 93-123), так как комплексы теперь в визуальной карусели.

---

## Визуальный макет (мобильный)

```text
┌─────────────────────────────────────────────────┐
│  ← Аренда жилья                                 │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │  🔍 Куда • Даты • 2 гостя              │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [Все] [🏢 Кондо] [🏡 Вилла] [📋 Ещё▾] [⚙️]   │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 🏢 Ищете жильё для отпуска              │    │
│  │    или инвестиций?                      │    │
│  │                                         │    │
│  │ ┌───────────┐ ┌───────────┐ ┌────────   │    │
│  │ │ [Фото]    │ │ [Фото]    │ │ [Фото]   │    │
│  │ │ Patong    │ │ Laguna    │ │ Rawai   →│    │
│  │ │ Tower     │ │ Park      │ │ Beach    │    │
│  │ │ ─────     │ │ ─────     │ │ ─────    │    │
│  │ │ 6 rent    │ │ 4 rent    │ │ 4 rent   │    │
│  │ │ 1 sale    │ │           │ │ 1 sale   │    │
│  │ │ от ฿12K   │ │ от ฿42K   │ │ от ฿15K  │    │
│  │ └───────────┘ └───────────┘ └────────   │    │
│  │                                         │    │
│  │ [Смотреть все комплексы →]              │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Спальни:                                       │
│  [Студия] [1] [2] [3] [4] [5+]                 │
│                                                 │
│  [⚡ Instant] [🏖️ У пляжа] [🌊 Sea View]...    │
│                                                 │
│  📍 [Patong] [Kata] [Kamala] [Rawai]...        │
│                                                 │
│  ─────────────────────────────────────────────  │
│  45 объектов найдено            📍 На карте   │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │ [Фото виллы]                   ❤️       │    │
│  │ ⚡ Мгновенное                           │    │
│  └─────────────────────────────────────────┘    │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

---

## Файлы для изменения

| Файл | Тип | Описание |
|------|-----|----------|
| `src/hooks/usePropertyProjectsWithStats.ts` | NEW | Хук с агрегацией rent/sale count |
| `src/components/property/ProjectCarouselCard.tsx` | NEW | Карточка для карусели |
| `src/components/property/ProjectPromoSection.tsx` | NEW | Промо-блок с каруселью |
| `src/pages/property/PropertyIndex.tsx` | UPDATE | Интеграция промо-секции |
| `src/pages/property/ProjectsIndex.tsx` | UPDATE | Deep-link scroll + highlight |
| `src/components/property/QuickFiltersRibbon.tsx` | UPDATE | Удаление чипов проектов |
| `src/components/property/index.ts` | UPDATE | Экспорт новых компонентов |

---

## Персона-адаптация

| Персона | Заголовок промо-блока | Акцент карточки |
|---------|----------------------|-----------------|
| Турист | "Ищете жильё для отпуска?" | rent_count, min_rent_price |
| Резидент | "Выберите комплекс для жизни" | rent_count, удобства |
| Владелец | "Инвестиционные проекты" | sale_count, ROI метрики (future) |
| Все | "Жильё для отпуска или инвестиций?" | rent + sale |

---

## Техническое резюме

| Метрика | Значение |
|---------|----------|
| Новые файлы | 3 |
| Обновляемые файлы | 4 |
| Данные в БД | ✅ Готовы (6 проектов, 20+ связанных объектов) |
| SQL-агрегация | ✅ Проверена |
| Риск регрессии | Низкий — старые чипы заменяются, не удаляются фильтры |
| UX улучшения | Визуальная карусель, промо-блок, deep-link навигация |
