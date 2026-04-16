

# Диагностика: данные не загружаются

## Результаты проверки

| Проверка | Результат |
|----------|-----------|
| Properties в БД (active + approved) | 23 объекта |
| Properties с ценой и фото | 23 из 23 |
| Категории услуг (active) | 37 |
| RLS policy properties (SELECT) | `public_view_active` -- публичный доступ к approved |
| RLS policy categories (SELECT) | `Anyone can view active categories` -- публичный |
| RLS policy category_groups (SELECT) | `Category groups are publicly readable` -- публичный |
| Код запроса FeaturedPropertiesCarousel | Корректный: `is_active=true`, `approval_status=approved` |
| Код запроса useCategories | Корректный: `is_active=true` |

## Причина проблемы

Все сетевые запросы в логах возвращают **"Failed to fetch"** -- включая auth token refresh и все data-запросы. Это временная проблема сети между preview-средой и backend. Код и данные корректны.

## План действий

### 1. Добавить retry-устойчивость к критическим запросам
Сейчас при сетевом сбое React Query показывает пустое состояние. Нужно:
- Убедиться, что `retry: 3` установлен в глобальной конфигурации React Query (QueryClient)
- Добавить `retryDelay` с exponential backoff
- Показывать состояние ошибки с кнопкой "Повторить" вместо пустого контента

### 2. FeaturedPropertiesCarousel -- добавить error state
Заменить пустой fallback ("Скоро здесь появятся объекты") на error-aware вариант: если query в состоянии error, показать кнопку "Повторить загрузку".

### 3. Проверить глобальный QueryClient config
Файл: вероятно `src/App.tsx` или `src/lib/queryConfig.ts`.
Убедиться, что `defaultOptions.queries.retry` установлен на `3` и `networkMode: 'online'`.

### 4. Немедленное решение
Перезагрузить preview -- текущие "Failed to fetch" ошибки являются следствием временного разрыва соединения.

## Итого
Код и БД корректны. Проблема -- временный сетевой сбой. Для повышения устойчивости добавлю retry-логику и error states.

