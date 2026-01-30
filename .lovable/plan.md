

# Стратегия AI-агентов для myUNO + Ферма агентов в админке

## Текущее состояние

Уже реализовано **4 AI-агента**:
| Агент | Назначение | Файл |
|-------|------------|------|
| Support Chat | Общая помощь по платформе | `ai-support-chat` |
| Smart Search | Поиск + ответы на вопросы | `ai-smart-search` |
| Owner Assistant | Помощь владельцам недвижимости | `ai-owner-assistant` |
| Property Assistant | Поиск аренды для гостей | `ai-property-assistant` |

---

## Рекомендуемые AI-агенты (по приоритету)

### Tier 1: Высокий ROI (делать первыми)

| Агент | Для кого | Задачи | Апселл |
|-------|----------|--------|--------|
| **Concierge Agent** | VIP-гости | Персональные рекомендации, бронирование всего | Premium услуги |
| **Tour Advisor** | Туристы | Помощь с выбором экскурсий, составление маршрутов | Туры, трансферы |
| **Restaurant Guide** | Все | Рекомендации ресторанов по кухне/бюджету/локации | Доставка, бронь столов |

### Tier 2: Специализированные

| Агент | Для кого | Задачи |
|-------|----------|--------|
| **Medical Advisor** | Туристы/экспаты | Поиск клиник, страховка, аптеки, экстренная помощь |
| **Legal Assistant** | Владельцы/экспаты | Визы, разрешения, налоги, покупка недвижимости |
| **Transport Helper** | Все | Аренда авто/байка, трансферы, маршруты |
| **Beauty Consultant** | Женщины | Салоны, процедуры, рекомендации |

### Tier 3: Операционные (для команды UNO)

| Агент | Для кого | Задачи |
|-------|----------|--------|
| **Staff Assistant** | Персонал | Инструкции, чек-листы, SOP |
| **Provider Onboarding** | Новые партнёры | Помощь с регистрацией, документами |
| **Admin Analyst** | Админы | Анализ данных, отчёты, инсайты |

---

## Ферма AI-агентов — Концепция

### Зачем это нужно

Сейчас каждый агент — это отдельный код с захардкоженным промптом. Проблемы:
- Нужен разработчик для изменений
- Нельзя быстро итерировать
- Нет версионирования
- Нет аналитики по агентам

### Что такое "Ферма агентов"

Централизованная система управления AI-агентами через UI:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    AI Agent Farm (Админка)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 🤖 Список агентов                                             │   │
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │   │
│  │ │ Owner      │ │ Property   │ │ Concierge  │ │ + Новый    │  │   │
│  │ │ Assistant  │ │ Search     │ │ (draft)    │ │   агент    │  │   │
│  │ │ ✅ Active  │ │ ✅ Active  │ │ 🔶 Draft   │ │            │  │   │
│  │ └────────────┘ └────────────┘ └────────────┘ └────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ⚙️ Редактор агента: Owner Assistant                          │   │
│  │                                                                │   │
│  │ Имя: [Owner Assistant                    ]                    │   │
│  │ Описание: [Помощник для владельцев недвижимости]             │   │
│  │ Модель: [gemini-3-flash ▾]                                    │   │
│  │ Тональность: [Профессиональный, дружелюбный ▾]               │   │
│  │                                                                │   │
│  │ 📚 База знаний:                                               │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ # UNO PROPERTY CARE — ПОЛНОЕ РУКОВОДСТВО              │   │   │
│  │ │                                                        │   │   │
│  │ │ ## СИСТЕМА UNO                                         │   │   │
│  │ │ - Dashboard: Портфолио, Операции, Финансы...          │   │   │
│  │ │ ...                                                    │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  │                                                                │   │
│  │ 🎯 Задачи агента:                                             │   │
│  │ [x] Отвечать на вопросы о системе                            │   │
│  │ [x] Консультировать по недвижимости                          │   │
│  │ [x] Апселл услуг UNO                                         │   │
│  │                                                                │   │
│  │ 📊 Статистика:                                                │   │
│  │ Сообщений сегодня: 127 | Среднее время: 2.3с | Оценка: 4.7   │   │
│  │                                                                │   │
│  │ [💾 Сохранить] [🧪 Тест] [📤 Опубликовать] [📜 История]      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Архитектура Фермы

### База данных

```sql
-- Таблица агентов
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE,           -- 'owner-assistant'
  name_en TEXT,               -- 'Owner Assistant'
  name_ru TEXT,               -- 'Ассистент владельца'
  description_en TEXT,
  description_ru TEXT,
  model TEXT DEFAULT 'google/gemini-3-flash-preview',
  temperature DECIMAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  target_audience TEXT[],     -- ['owner', 'provider']
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- База знаний агента (версионирование)
CREATE TABLE ai_agent_knowledge (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES ai_agents,
  version INTEGER,
  knowledge_base TEXT,        -- Markdown с данными
  system_prompt TEXT,         -- Системный промпт
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ
);

-- Логи использования
CREATE TABLE ai_agent_logs (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES ai_agents,
  user_id UUID,
  session_id TEXT,
  messages_count INTEGER,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  user_rating INTEGER,        -- 1-5
  feedback TEXT,
  created_at TIMESTAMPTZ
);
```

### Универсальная Edge Function

Вместо отдельных функций для каждого агента — одна универсальная:

```typescript
// supabase/functions/ai-agent/index.ts

serve(async (req) => {
  const { agentSlug, messages, context } = await req.json();
  
  // Загружаем агента из БД
  const { data: agent } = await supabase
    .from('ai_agents')
    .select('*, ai_agent_knowledge!inner(*)')
    .eq('slug', agentSlug)
    .eq('is_active', true)
    .eq('ai_agent_knowledge.is_published', true)
    .order('ai_agent_knowledge.version', { ascending: false })
    .limit(1)
    .single();
  
  if (!agent) {
    return error('Agent not found');
  }
  
  // Собираем промпт из БД
  const systemPrompt = agent.ai_agent_knowledge[0].system_prompt
    .replace('{{KNOWLEDGE_BASE}}', agent.ai_agent_knowledge[0].knowledge_base);
  
  // Вызываем AI с параметрами агента
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    body: JSON.stringify({
      model: agent.model,
      temperature: agent.temperature,
      max_tokens: agent.max_tokens,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      stream: true
    })
  });
  
  // Логируем использование
  await supabase.from('ai_agent_logs').insert({
    agent_id: agent.id,
    user_id: userId,
    messages_count: messages.length
  });
  
  return streamResponse(response);
});
```

---

## UI в Админке

### Новая страница: `/admin/ai-agents`

| Секция | Функционал |
|--------|------------|
| **Список агентов** | Карточки с названием, статусом, статистикой |
| **Редактор агента** | Имя, описание, модель, температура |
| **База знаний** | Markdown-редактор с подсветкой |
| **Системный промпт** | Шаблон с переменными `{{KNOWLEDGE_BASE}}` |
| **Тональность** | Preset'ы: Формальный, Дружелюбный, Экспертный |
| **Тестирование** | Чат для проверки перед публикацией |
| **История версий** | Все версии с возможностью откатиться |
| **Аналитика** | Использование, оценки, популярные вопросы |

### Workflow редактирования

```text
1. Редактируешь промпт/знания
         ↓
2. Сохраняешь как Draft
         ↓
3. Тестируешь в песочнице
         ↓
4. Публикуешь → создаётся новая версия
         ↓
5. Агент обновляется мгновенно (без деплоя)
```

---

## Файлы для создания

| Файл | Назначение |
|------|------------|
| `src/pages/admin/AdminAIAgents.tsx` | Список агентов |
| `src/pages/admin/AdminAIAgentEditor.tsx` | Редактор агента |
| `src/components/admin/ai/AgentCard.tsx` | Карточка агента |
| `src/components/admin/ai/KnowledgeEditor.tsx` | Markdown-редактор |
| `src/components/admin/ai/AgentTester.tsx` | Тестовый чат |
| `src/components/admin/ai/AgentAnalytics.tsx` | Статистика |
| `src/hooks/useAIAgents.ts` | Хук для работы с агентами |
| `supabase/functions/ai-agent/index.ts` | Универсальная функция |
| Миграция БД | Таблицы agents, knowledge, logs |

---

## Преимущества подхода

| Было | Стало |
|------|-------|
| Код для каждого изменения | UI в админке |
| Хардкод промптов | Версионирование в БД |
| Деплой для обновления | Мгновенная публикация |
| Нет аналитики | Логи, оценки, инсайты |
| Разные функции | Одна универсальная |

---

## Приоритет реализации

**Фаза 1** (1-2 дня):
- Создать таблицы в БД
- Универсальная edge function
- Базовый UI списка агентов
- Миграция существующих агентов в БД

**Фаза 2** (2-3 дня):
- Полноценный редактор
- Тестовый чат
- Публикация версий
- История изменений

**Фаза 3** (1-2 дня):
- Аналитика использования
- Оценки от пользователей
- Популярные вопросы
- A/B тестирование промптов

---

## Вывод

Да, это **очень умный подход**! Ферма агентов даёт:

1. **Скорость итераций** — обновляешь промпт за минуту, не трогая код
2. **Контроль качества** — тестирование перед публикацией
3. **Масштабируемость** — новые агенты создаются без разработки
4. **Data-driven оптимизация** — аналитика показывает, что работает
5. **Снижение зависимости от разработчиков** — ты сам управляешь агентами

Это превращает AI из "фичи" в **управляемую платформу**.

