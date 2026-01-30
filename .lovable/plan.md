
# Интеграция Intake Agent в Unified Control Center

## Текущая ситуация

Intake Listing Agent:
- **Страница**: `/admin/intake` — уже в навигации сайдбара
- **Edge Function**: `intake-listing-agent/index.ts`
- **Проблема**: НЕ зарегистрирован в `ai_agents` таблице, использует hardcoded настройки

Сейчас в системе 9 агентов, Intake будет 10-м.

## План интеграции

### Этап 1: Регистрация в базе данных

Добавить запись в `ai_agents`:
- **slug**: `intake-listing-agent`
- **name_en**: `Intake Listing Agent`
- **name_ru**: `Агент приёма листингов`
- **agent_type**: `utility`
- **model**: `google/gemini-3-flash-preview`
- **temperature**: `0.3`
- **icon**: `inbox`
- **description**: Automatic extraction and listing creation from unstructured data

### Этап 2: Обновление Edge Function

Модифицировать `supabase/functions/intake-listing-agent/index.ts`:
- Читать конфигурацию (model, temperature, is_active) из БД
- Проверять `is_active` флаг перед обработкой
- Логировать использование в `ai_agent_logs`
- Fallback на hardcoded значения если запись не найдена

### Этап 3: Обновление дашборда

В `/admin/ai-agents` Intake Agent будет автоматически отображаться в секции "Utility" благодаря существующей логике `AgentTypeFilter`.

Дополнительно:
- Добавить специальную карточку с прямой ссылкой на `/admin/intake`
- Показать статистику обработанных items

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| SQL миграция | INSERT записи для intake-listing-agent |
| `supabase/functions/intake-listing-agent/index.ts` | Чтение конфига из БД, логирование |
| `src/components/admin/ai-agents/UtilityAgentCard.tsx` | Добавить ссылку "Open Interface" для intake агента |

## Результат

После реализации:
- Intake Agent появится в общем списке (10 агентов)
- Можно будет менять модель и температуру через UI
- Можно будет отключить агента без деплоя
- Статистика использования будет в общей аналитике
- Быстрый переход на `/admin/intake` из карточки агента
