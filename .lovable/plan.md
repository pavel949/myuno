
# AI Agent Unified Control Center

## Цель
Собрать все 9 AI агентов (5 DB-managed + 4 standalone) в единый дашборд с возможностью настройки и мониторинга.

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────┐
│                     AI Agent Control Center                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │CONVERSATIONAL│ │   UTILITY   │  │       ANALYZER          │  │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────────┤  │
│  │owner-assist │  │ai-translate │  │listing-quality-analyzer │  │
│  │property-srch│  │ai-generate  │  │(future: review-scorer)  │  │
│  │support-chat │  │ai-smart-data│  │                         │  │
│  │smart-search │  │ai-personalize│ │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          ▼                                       │
│              ┌──────────────────────┐                           │
│              │     ai_agents        │                           │
│              │  (unified registry)  │                           │
│              └──────────┬───────────┘                           │
│                         ▼                                        │
│              ┌──────────────────────┐                           │
│              │   ai_agent_logs      │                           │
│              │ (unified analytics)  │                           │
│              └──────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Этап 1: Расширение схемы данных

### 1.1 Добавить поле `agent_type` в `ai_agents`
```sql
ALTER TABLE ai_agents 
ADD COLUMN agent_type TEXT DEFAULT 'conversational' 
CHECK (agent_type IN ('conversational', 'utility', 'analyzer'));
```

### 1.2 Добавить standalone агентов в БД
```sql
INSERT INTO ai_agents (slug, name_en, name_ru, agent_type, model, temperature, is_active, ...)
VALUES 
  ('ai-translate', 'Translator', 'Переводчик', 'utility', 'google/gemini-2.5-flash', 0.3, true, ...),
  ('ai-generate-description', 'Description Generator', 'Генератор описаний', 'utility', ...),
  ('ai-smart-data', 'Smart Data Processor', 'Обработчик данных', 'utility', ...),
  ('ai-personalize-home', 'Home Personalizer', 'Персонализация', 'utility', ...);
```

### 1.3 Обновить существующие агенты
- Conversational: owner-assistant, property-search, support-chat, smart-search
- Analyzer: listing-quality-analyzer

---

## Этап 2: Модификация Edge Functions

### Принцип: Edge functions читают конфиг из БД

Для каждой standalone функции добавить в начало:
```typescript
// Fetch config from DB
const { data: agentConfig } = await supabase
  .from('ai_agents')
  .select('model, temperature, is_active')
  .eq('slug', 'ai-translate')
  .single();

if (!agentConfig?.is_active) {
  return new Response(JSON.stringify({ error: 'Agent disabled' }), { status: 503 });
}

// Use config
const model = agentConfig.model || 'google/gemini-2.5-flash';
const temperature = agentConfig.temperature || 0.3;
```

### Файлы для обновления:
1. `supabase/functions/ai-translate/index.ts`
2. `supabase/functions/ai-generate-description/index.ts`
3. `supabase/functions/ai-smart-data/index.ts`
4. `supabase/functions/ai-personalize-home/index.ts`

### Добавить логирование:
```typescript
// Log usage (async, non-blocking)
supabase.from('ai_agent_logs').insert({
  agent_id: agentConfig.id,
  response_time_ms: Date.now() - startTime,
  messages_count: 1,
});
```

---

## Этап 3: Unified Dashboard UI

### 3.1 Переработать `/admin/ai-agents`

Новая структура табов:
- **Все агенты** — сводная таблица всех 9 агентов
- **По типам**:
  - Conversational (4) — чат-боты
  - Utility (4) — translate, generate, smart-data, personalize
  - Analyzer (1+) — listing-quality-analyzer
- **Аналитика** — существующий Insights tab

### 3.2 Новый компонент: `AgentTypeFilter`
```typescript
// Фильтр по типу агента
<ToggleGroup type="single" value={filter}>
  <ToggleGroupItem value="all">Все (9)</ToggleGroupItem>
  <ToggleGroupItem value="conversational">💬 Чаты (4)</ToggleGroupItem>
  <ToggleGroupItem value="utility">⚙️ Утилиты (4)</ToggleGroupItem>
  <ToggleGroupItem value="analyzer">🔍 Анализаторы (1)</ToggleGroupItem>
</ToggleGroup>
```

### 3.3 Новый компонент: `UtilityAgentCard`
Упрощённая карточка для utility-агентов:
- Название + иконка
- Модель (выпадающий список)
- Температура (slider)
- Статус (вкл/выкл)
- Статистика за 24ч

### 3.4 Quick Stats Row
```text
┌────────────────┬────────────────┬────────────────┬────────────────┐
│  ВСЕГО: 9      │  АКТИВНЫХ: 8   │  ВЫЗОВОВ 24ч   │  AVG RESPONSE  │
│  агентов       │  агентов       │  1,247         │  340ms         │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

---

## Этап 4: Unified Analytics

### 4.1 Расширить `useAIInsights` хук
- Агрегация по `agent_type`
- Сравнение conversational vs utility vs analyzer
- Top-5 агентов по использованию

### 4.2 Новая визуализация
- Pie chart: распределение вызовов по типам
- Bar chart: использование по агентам
- Timeline: активность за неделю

---

## Файлы для создания/изменения

### Новые файлы:
1. `src/components/admin/ai-agents/AgentTypeFilter.tsx`
2. `src/components/admin/ai-agents/UtilityAgentCard.tsx`
3. `src/components/admin/ai-agents/AgentQuickStats.tsx`
4. `src/components/admin/ai-agents/AgentUnifiedTable.tsx`

### Изменяемые файлы:
1. `src/pages/admin/AdminAIAgents.tsx` — новая структура
2. `src/hooks/useAIAgents.ts` — поддержка agent_type
3. `supabase/functions/ai-translate/index.ts` — чтение конфига из БД
4. `supabase/functions/ai-generate-description/index.ts` — чтение конфига из БД
5. `supabase/functions/ai-smart-data/index.ts` — чтение конфига из БД
6. `supabase/functions/ai-personalize-home/index.ts` — чтение конфига из БД

### Миграции:
1. Добавить `agent_type` в `ai_agents`
2. INSERT записи для 4 standalone агентов

---

## Ожидаемый результат

После реализации администратор получит:

1. **Единый экран** со всеми 9 агентами
2. **Фильтрация** по типу (conversational/utility/analyzer)
3. **Быстрая настройка** модели и температуры для любого агента
4. **Включение/выключение** без деплоя
5. **Сводная статистика** использования всех агентов
6. **Сравнительная аналитика** по типам агентов

---

## Технические заметки

### Обратная совместимость
- Существующие вызовы edge functions продолжат работать
- Если запись в БД не найдена — используются hardcoded defaults

### Безопасность
- Utility-агенты не требуют knowledge_base — это нормально
- RLS на ai_agents остаётся прежним (admin/uno_team only)

### Производительность
- Добавить кэширование конфига в edge functions (5 мин TTL)
- Логирование асинхронное — не блокирует ответ
