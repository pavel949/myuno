
# План: Полнофункциональный UX для проектов/комплексов

## Обзор
Создание полноценного опыта просмотра жилых комплексов для гостей (Agoda/Airbnb style) + улучшение интеграции проектов по всей платформе.

---

## Текущее состояние (Аудит)

### Что уже есть:

| Компонент | Статус | Комментарий |
|-----------|--------|-------------|
| Admin Panel (`AdminProjects.tsx`) | Готово | AI Intake, медиа, юрлицо, CAM-сборы |
| Выбор проекта для owner | Готово | `ProjectSelector.tsx` |
| Info-карточка в объекте | Готово | `ProjectInfoCard.tsx` |
| Фильтр по проектам в поиске | Готово | `QuickFiltersRibbon.tsx` |
| База данных | Готово | 38 полей, медиа, juristic data |

### Что отсутствует:

| Функция | Статус |
|---------|--------|
| Страница проекта для гостей | НЕТ |
| Каталог всех комплексов | НЕТ |
| Кнопка "Исследовать комплекс" в объекте | НЕТ |
| Fullscreen галерея проекта | НЕТ |

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         ГОСТЕВОЙ ОПЫТ                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  /complexes ─────────────────────────────────────────────────────►  │
│  │                                                                  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  │ The Title   │  │ Laguna Park │  │ Kamala      │              │
│  │  │ [VIDEO]     │  │ [PHOTO]     │  │ [PHOTO]     │              │
│  │  │ 12 units    │  │ 8 units     │  │ 5 units     │              │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│  │         │                │                │                      │
│  │         ▼                ▼                ▼                      │
│  │  /property/project/:id ──────────────────────────────────────►  │
│  │  │                                                               │
│  │  │  ┌─────────────────────────────────────────────────────┐     │
│  │  │  │ HERO MEDIA (Video/Photo Carousel)                   │     │
│  │  │  │ "The Title Legendary"                               │     │
│  │  │  │ Rawai • 2023 • 150 units • Sansiri Developer        │     │
│  │  │  └─────────────────────────────────────────────────────┘     │
│  │  │  ┌─────────────────────────────────────────────────────┐     │
│  │  │  │ AMENITIES GRID: Pool, Gym, Security, Parking...    │     │
│  │  │  └─────────────────────────────────────────────────────┘     │
│  │  │  ┌─────────────────────────────────────────────────────┐     │
│  │  │  │ AVAILABLE UNITS: [Scroll carousel of properties]   │     │
│  │  │  │ Studio from ฿8k • 1BR from ฿15k • 2BR from ฿25k    │     │
│  │  │  └─────────────────────────────────────────────────────┘     │
│  │  │  ┌─────────────────────────────────────────────────────┐     │
│  │  │  │ LOCATION MAP + Infrastructure                       │     │
│  │  │  └─────────────────────────────────────────────────────┘     │
│  │  │                                                               │
│  └──┴───────────────────────────────────────────────────────────►  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                         ИНТЕГРАЦИЯ                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PropertyDetail.tsx:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ProjectInfoCard                                              │   │
│  │ [Исследовать комплекс] → /property/project/:id               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  QuickFiltersRibbon.tsx:                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [The Title] [Laguna] [Kamala] → фильтрация + клик → детали  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Фазы реализации

### Фаза 1: Страница проекта для гостей

**Новый файл: `src/pages/property/ProjectDetail.tsx`**

Полнофункциональная витрина комплекса:

1. **Hero Section**
   - Видео-баннер (autoplay, muted) если есть video_url
   - Fallback на cover_image с кнопкой "Все фото"
   - Название, район, год, застройщик, кол-во юнитов

2. **Amenities Grid**
   - Визуальная сетка удобств территории (pool, gym, security...)
   - Иконки + подписи на 2 языках

3. **Available Units Section**
   - Загрузка properties WHERE project_id = current
   - Горизонтальная карусель с PropertyCard
   - Счётчики: "12 доступных квартир"
   - Диапазоны цен по типам (Studio от X, 1BR от Y...)

4. **Location Section**
   - Карта с маркером комплекса
   - Инфраструктура рядом (если заполнена)

5. **Photo Gallery**
   - Полноэкранный просмотр images[]
   - Lightbox с navigation

---

### Фаза 2: Каталог комплексов

**Новый файл: `src/pages/property/ProjectsIndex.tsx`**

Лендинг со всеми ЖК Пхукета:

1. **Hero Section**
   - "Жилые комплексы Пхукета"
   - Subtitle: "Выберите резиденцию для вашего идеального отдыха"

2. **Featured Projects Carousel**
   - Большие карточки (is_featured = true)
   - Видео-превью где доступно

3. **All Projects Grid**
   - Rich-карточки с cover_image
   - Счётчики: "8 вилл доступно", "От 15,000 ฿/ночь"
   - Бейджи: Featured, New (по created_at)

4. **Filter/Search**
   - Поиск по названию
   - Фильтр по району (district)
   - Сортировка (по популярности, по цене, по количеству юнитов)

---

### Фаза 3: Компоненты проекта

**Новый файл: `src/components/property/ProjectHeroMedia.tsx`**

Медиа-компонент для hero section:
- Поддержка video_url (YouTube embed или direct)
- Fallback на cover_image
- Кнопка "Все фото" → открывает галерею

**Новый файл: `src/components/property/ProjectAmenitiesGrid.tsx`**

Визуальная сетка удобств территории:
- Mapping amenities[] на иконки
- 2/3/4 колонки адаптивно

**Новый файл: `src/components/property/ProjectUnitsSection.tsx`**

Секция с доступными юнитами:
- Горизонтальная карусель PropertyCard
- Статистика по типам и ценам
- CTA "Смотреть все" → /property?project=uuid

**Новый файл: `src/components/property/ProjectGalleryModal.tsx`**

Fullscreen галерея:
- Swipe navigation
- Zoom
- Counter (1/12)

---

### Фаза 4: Интеграция в существующие страницы

**Файл: `src/components/property/ProjectInfoCard.tsx`**

Добавить кнопку навигации:
```tsx
<Button onClick={() => navigate(`/property/project/${project.id}`)}>
  <ExternalLink className="h-4 w-4 mr-2" />
  {isRu ? 'Исследовать комплекс' : 'Explore Complex'}
</Button>
```

**Файл: `src/components/property/QuickFiltersRibbon.tsx`**

Сделать ProjectChip ссылкой:
- Primary click → фильтрация (как сейчас)
- Secondary action (иконка) → navigate to project page

**Файл: `src/components/layout/AnimatedRoutes.tsx`**

Добавить новые маршруты:
```tsx
<Route path="/complexes" element={<LazyPage><ProjectsIndex /></LazyPage>} />
<Route path="/property/project/:id" element={<LazyPage><ProjectDetail /></LazyPage>} />
```

---

### Фаза 5: Улучшение хуков

**Файл: `src/hooks/useProperties.ts`**

Добавить фильтр по project_id:
```tsx
export function usePropertiesByProject(projectId: string) {
  return useQuery({
    queryKey: ['properties-by-project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('price');
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}
```

**Файл: `src/hooks/usePropertyProjects.ts`**

Добавить статистику:
```tsx
export function useProjectStats(projectId: string) {
  // Считаем юниты, min/max цены по типам
}
```

---

## Новые файлы

| Файл | Назначение |
|------|------------|
| `src/pages/property/ProjectDetail.tsx` | Страница проекта для гостей |
| `src/pages/property/ProjectsIndex.tsx` | Каталог всех комплексов |
| `src/components/property/ProjectHeroMedia.tsx` | Hero с video/photo |
| `src/components/property/ProjectAmenitiesGrid.tsx` | Сетка удобств |
| `src/components/property/ProjectUnitsSection.tsx` | Карусель юнитов |
| `src/components/property/ProjectGalleryModal.tsx` | Fullscreen галерея |
| `src/components/property/ProjectCard.tsx` | Rich-карточка для каталога |

---

## Изменяемые файлы

| Файл | Изменение |
|------|-----------|
| `src/components/layout/AnimatedRoutes.tsx` | Новые маршруты |
| `src/components/property/ProjectInfoCard.tsx` | Кнопка "Исследовать" |
| `src/components/property/QuickFiltersRibbon.tsx` | Ссылка на проект |
| `src/hooks/useProperties.ts` | usePropertiesByProject() |
| `src/hooks/usePropertyProjects.ts` | useProjectStats() |

---

## UX Flow для гостя

```text
Гость ищет жильё на Пхукете
           │
           ▼
   ┌───────────────────────────────────────────┐
   │  /property                                │
   │  QuickFiltersRibbon: [The Title] [Laguna] │
   └───────────────────┬───────────────────────┘
                       │ Клик на "The Title"
                       ▼
           ┌───────────────────────┐
           │ Два варианта:         │
           │ A) Фильтровать список │
           │ B) Открыть проект →   │
           └───────────────────────┘
                       │ B
                       ▼
   ┌───────────────────────────────────────────┐
   │  /property/project/:id                    │
   │  • Hero video/photo                       │
   │  • "The Title Legendary"                  │
   │  • Amenities: Pool, Gym, Security...      │
   │  • 12 доступных юнитов [карусель]         │
   │  • Карта + инфраструктура                 │
   └───────────────────┬───────────────────────┘
                       │ Клик на юнит
                       ▼
   ┌───────────────────────────────────────────┐
   │  /property/:unitId                        │
   │  PropertyDetail + ProjectInfoCard         │
   └───────────────────────────────────────────┘
```

---

## Альтернативный путь: Каталог комплексов

```text
Гость хочет жить в конкретном комплексе
           │
           ▼
   ┌───────────────────────────────────────────┐
   │  /complexes                               │
   │  "Жилые комплексы Пхукета"                │
   │                                           │
   │  Featured: [The Title] [Laguna]           │
   │                                           │
   │  All Projects:                            │
   │  ┌────────┐ ┌────────┐ ┌────────┐        │
   │  │ Patong │ │ Rawai  │ │ Kamala │        │
   │  │ 15 un. │ │ 8 un.  │ │ 5 un.  │        │
   │  └────────┘ └────────┘ └────────┘        │
   └───────────────────┬───────────────────────┘
                       │ Клик
                       ▼
   ┌───────────────────────────────────────────┐
   │  /property/project/:id                    │
   │  (та же страница проекта)                 │
   └───────────────────────────────────────────┘
```

---

## Навигация (добавить в меню)

В Discover или отдельной секции Home:
```text
🏢 Комплексы  →  /complexes
```

В QuickFiltersRibbon добавить секцию:
```text
🏢 Комплексы: [The Title ↗] [Laguna ↗] [Kamala ↗]
              ↑ иконка External = переход на страницу проекта
```

---

## Техническое резюме

**Всего:**
- 7 новых файлов (pages + components)
- 5 изменяемых файлов
- 2 новых маршрута
- 2 новых хука

**Существующая инфраструктура:** Админка проектов полностью готова, база данных содержит все необходимые поля (медиа, amenities, juristic). Нужен только frontend для гостевого опыта.

**Риск регрессии:** Низкий — создаём новые страницы, минимально трогаем существующий код.
