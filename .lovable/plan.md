## Цель

Любая ссылка `/services?...` (из Discover, кросс-сейлов, SOS, поиска, виджетов) сразу подсвечивает нужный чип, показывает intro/секции и применяет сортировку/поиск — без ручных кликов.

Все правки локально в `src/pages/services/ServicesIndex.tsx`. Каталог (`HOME_SERVICE_FUNCTIONS`, `SERVICE_CATEGORIES`) не трогаем.

## Поддерживаемые параметры

| Параметр | Значения | Поведение |
|---|---|---|
| `category` | slug каталога | Алиас → `SERVICE_CATEGORIES.id`, чип подсвечен, intro по исходному slug |
| `type` | то же, что `category` | Читается, если `category` отсутствует (legacy: `BookingCrossSellSheet`, `TripServicesGrid`, `crossSellConfig`) |
| `sort` | `popular` \| `rating` | `popular` → принудительно показываем блок «Популярные» и сортируем grid по `isPopular` desc; `rating` → сортировка по рейтингу провайдера, fallback на `popular` |
| `q` | строка | Предзаполняет `searchQuery` (триггерит `search()` в `useServiceFunctions`) |

## Расширение алиасов и intro

В `CATEGORY_ALIAS` добавляем:

```
road-assistance     → handyman
photography         → handyman
maintenance         → handyman
property-management → cleaning
```

В `CATEGORY_INTRO` добавляем RU/EN заголовок + описание + WhatsApp-кнопку координатора для всех четырёх slug'ов, чтобы у пользователя был внятный путь, даже если в каталоге нет точных услуг.

## Безопасный фолбэк для неизвестных slug

Если slug после алиаса не нашёлся ни в `SERVICE_CATEGORIES`, ни в `CATEGORY_INTRO`:
- `selectedCategory = 'all'`;
- автозаполняется `searchQuery = slug.replace(/-/g, ' ')`;
- показываем баннер «Не нашли категорию — показываем похожие услуги».

## Изменения в коде (одним проходом)

1. Один `useEffect` на `searchParams` читает `category` || `type`, `sort`, `q` и проставляет `selectedCategory`, `originalSlug`, `searchQuery`, `sortMode`.
2. Ручные изменения чипа/поиска чистят соответствующий ключ через `setSearchParams` (как уже сделано для `category`).
3. В существующем `useMemo` для `filteredFunctions` после `applyPersonaFilter` применяется `sortMode`.
4. Блок «Популярные услуги» отрисовывается, если `sortMode === 'popular'` ИЛИ (`selectedCategory === 'all'` && нет `searchQuery`).

## Проверка после реализации

Открыть в preview:

1. `/services?category=laundry` → чип «Уборка», intro «Прачечная»
2. `/services?type=cleaning` → чип «Уборка», обычный grid
3. `/services?category=road-assistance` → чип «Мастер на час», intro «Помощь на дороге»
4. `/services?category=photography` → чип «Мастер на час», intro «Фото и видео»
5. `/services?sort=popular` → блок «Популярные» сверху, отсортированный grid
6. `/services?q=электрик` → поиск предзаполнен, выдача отфильтрована
7. `/services?category=unknown-slug` → чип `All`, баннер фолбэка, поиск = `unknown slug`
