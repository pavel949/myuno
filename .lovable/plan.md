

# Аудит мертвого и неиспользуемого кода суперприложения

## Резюме

Обнаружено **~25 единиц** мертвого или дублированного кода в 4 категориях: неиспользуемые файлы, deprecated-обертки без потребителей, мертвые Edge Functions, и дублирующие компоненты.

---

## Категория 1: Полностью мертвые файлы (0 импортов)

| Файл | Описание | Действие |
|------|----------|----------|
| `src/components/NavLink.tsx` | Обертка над react-router NavLink. 0 импортов | Удалить |
| `src/hooks/useAsync.ts` | Универсальный async-хук. 0 импортов извне | Удалить |
| `src/hooks/useSimulation.ts` | Хук для simulation_runs. 0 импортов | Удалить |
| `src/hooks/useWebVitals.ts` | Web Vitals трекер. Только self-reference | Удалить |
| `src/hooks/useImagePreload.ts` | Предзагрузка изображений. 0 импортов | Удалить |
| `src/hooks/useLifeSituations.ts` | @deprecated обертка. 0 реальных импортов | Удалить |
| `src/lib/currencyUtils.ts` | @deprecated обертка. 0 импортов | Удалить |
| `src/components/venue/VenueCard.tsx` | Компонент используется только из `useVenues`, но сам VenueCard не импортируется напрямую | Проверить, используется ли в VenueDetail (через JSX, не import) |

---

## Категория 2: Redirect-заглушки (можно удалить после проверки роутов)

| Файл | Перенаправляет на | Действие |
|------|-------------------|----------|
| `src/pages/admin/AdminTours.tsx` | `/admin/experiences` | Удалить (убрать роут из AnimatedRoutes) |
| `src/pages/vendor/VendorTours.tsx` | `/vendor/experiences` | Удалить (убрать роут из AnimatedRoutes) |

Перенаправления уже обработаны в `LEGACY_REDIRECTS`. Отдельные компоненты-заглушки избыточны.

---

## Категория 3: Мертвые Edge Functions (0 вызовов из фронтенда)

| Функция | Описание | Действие |
|---------|----------|----------|
| `ignatev-scrape-rentals` | Одноразовый скрейпер. 0 вызовов | Удалить |
| `firecrawl-scrape` | Скрейпер через Firecrawl. 0 вызовов | Удалить |
| `calculate-metrics` | Расчет метрик. 0 вызовов | Удалить |
| `calculate-advanced-metrics` | Расширенные метрики. 0 вызовов | Удалить |
| `cache-property-images` | Кеширование изображений. 0 вызовов | Удалить |
| `cache-yacht-images` | Кеширование изображений яхт. 0 вызовов | Удалить |
| `scrape-yacht-images` | Скрейпинг изображений яхт. 0 вызовов | Удалить |
| `import-project-images` | Импорт изображений проектов. 0 вызовов | Удалить |

---

## Категория 4: Deprecated Edge Functions (проксируют на ai-agent)

| Функция | Проксирует на | Действие |
|---------|---------------|----------|
| `ai-property-assistant` | `ai-agent` (slug: property-search) | Мигрировать вызов в `usePropertyAIChat.ts` на ai-agent, затем удалить |
| `ai-owner-assistant` | `ai-agent` (slug: owner-assistant) | Мигрировать вызов в `useOwnerAIChat.ts` на ai-agent, затем удалить |

Оба хука (`usePropertyAIChat`, `useOwnerAIChat`) напрямую вызывают deprecated эндпоинты. Нужно переключить URL на `ai-agent` с передачей `agentSlug`.

---

## Категория 5: Дублирующие компоненты-директории

| Дубль | Оригинал | Действие |
|-------|----------|----------|
| `src/components/yacht/` (4 файла) | `src/components/yachts/` (8 файлов) | Объединить в `yachts/`, обновить 3 импорта |

---

## План действий

### Фаза 1 — Безопасное удаление (без изменения логики)
1. Удалить 7 мертвых файлов из `src/` (NavLink, useAsync, useSimulation, useWebVitals, useImagePreload, useLifeSituations, currencyUtils)
2. Удалить 8 мертвых Edge Functions
3. Удалить 2 redirect-заглушки + их роуты из AnimatedRoutes

### Фаза 2 — Миграция deprecated AI-функций
4. Обновить `usePropertyAIChat.ts` — заменить URL на `/ai-agent` + body `{ agentSlug: 'property-search', ... }`
5. Обновить `useOwnerAIChat.ts` — аналогично с slug `owner-assistant`
6. Удалить Edge Functions `ai-property-assistant` и `ai-owner-assistant`

### Фаза 3 — Консолидация yachts
7. Переместить 4 файла из `yacht/` в `yachts/`
8. Обновить 3 файла с импортами

### Ожидаемый результат
- Минус ~15 файлов фронтенда
- Минус 10 Edge Functions
- Чистая кодовая база без мертвых зависимостей
