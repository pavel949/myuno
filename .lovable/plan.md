
# AI Leads Factory Agent — План Реализации

## Обзор

Создаём 11-го агента в системе — **Leads Factory Agent** — который автоматизирует обработку заявок (consultation_requests) с использованием AI для скоринга, приоритизации и генерации персонализированных follow-up сообщений.

## Существующая Инфраструктура

| Компонент | Статус | Назначение |
|-----------|--------|------------|
| `consultation_requests` | ✅ 38 полей | Хранение лидов |
| `lead_activity_log` | ✅ 10 полей | История активностей |
| `/admin/consultations` | ✅ Готово | Управление заявками |
| `/admin/leads` | ✅ Готово | Воронка и аналитика |
| `ai-agent` функция | ✅ Готово | Универсальный gateway |
| SLA система | ✅ `sla_deadline` | Дедлайны по типам |

## Архитектура Leads Factory

```text
┌─────────────────────────────────────────────────────────────────┐
│                    LEADS FACTORY AGENT                          │
├─────────────────────────────────────────────────────────────────┤
│  INPUTS                                                         │
│  ├─ consultation_requests (lead data)                           │
│  ├─ lead_activity_log (interaction history)                     │
│  ├─ profiles (assigned manager info)                            │
│  └─ context (request type, budget, urgency)                     │
├─────────────────────────────────────────────────────────────────┤
│  AI PROCESSING (via ai-agent gateway)                           │
│  ├─ Lead Scoring (0-100)                                        │
│  ├─ Priority Classification (hot/warm/cold)                     │
│  ├─ Follow-up Message Draft                                     │
│  └─ Next Action Recommendation                                  │
├─────────────────────────────────────────────────────────────────┤
│  OUTPUTS                                                        │
│  ├─ ai_artifacts (stored analysis)                              │
│  ├─ UI recommendations in dashboard                             │
│  └─ Draft messages (WhatsApp/Email)                             │
└─────────────────────────────────────────────────────────────────┘
```

## Функционал Агента

### 1. Lead Scoring (Скоринг лидов)
Автоматический расчёт "горячести" лида (0-100):

| Фактор | Вес | Логика |
|--------|-----|--------|
| Бюджет | 25% | Высокий бюджет = больше очков |
| Срочность | 20% | Даты скоро = высокий приоритет |
| Тип запроса | 15% | vacation_rental горячее investment |
| Полнота данных | 15% | Email + Phone + Districts = +очки |
| Активность | 15% | Количество взаимодействий |
| SLA статус | 10% | Просроченные = приоритет |

### 2. Follow-up Generator
Генерация персонализированных сообщений:
- **WhatsApp шаблоны** — короткие, с эмодзи
- **Email шаблоны** — формальные, с деталями
- **Язык** — RU/EN по preferred_language

### 3. Smart Assignment
Рекомендации по назначению менеджера:
- Анализ загрузки команды
- Специализация (vacation vs investment)
- История конверсий

### 4. SLA Monitor
- Напоминания о просроченных лидах
- Автоматические уведомления

## Этапы Реализации

### Этап 1: Регистрация агента в БД

```sql
-- Добавляем leads-factory в ai_agents
INSERT INTO ai_agents (
  slug, name_en, name_ru, agent_type, model,
  temperature, icon, description_en, description_ru,
  target_audience, is_active
) VALUES (
  'leads-factory',
  'Leads Factory',
  'Фабрика лидов',
  'utility',
  'google/gemini-3-flash-preview',
  0.4,
  'factory',
  'AI-powered lead scoring, follow-up generation and smart assignment',
  'AI-скоринг лидов, генерация follow-up и умное назначение',
  ARRAY['admin', 'manager'],
  true
);

-- Добавляем колонку для хранения AI-скора
ALTER TABLE consultation_requests 
  ADD COLUMN IF NOT EXISTS ai_score INTEGER,
  ADD COLUMN IF NOT EXISTS ai_priority TEXT,
  ADD COLUMN IF NOT EXISTS ai_analysis_at TIMESTAMPTZ;
```

### Этап 2: Создание Knowledge Base

Создаём версию knowledge для агента с правилами скоринга и шаблонами сообщений.

### Этап 3: Edge Function `leads-factory`

```text
supabase/functions/leads-factory/index.ts

Endpoints:
- POST /score — скоринг одного лида
- POST /batch-score — скоринг всех pending лидов
- POST /generate-followup — генерация сообщения
- POST /analyze — полный анализ лида
```

### Этап 4: UI Интеграция

| Компонент | Изменение |
|-----------|-----------|
| `AdminConsultations.tsx` | Добавить AI Score badge, кнопку "Analyze" |
| `AdminLeadsDashboard.tsx` | Виджет "AI Recommendations" |
| `LeadCard` (новый) | Компактная карточка с AI insights |
| `FollowUpDialog` (новый) | Генерация и копирование сообщений |

### Этап 5: Batch Processing

Фоновый процесс для автоматического скоринга новых лидов:
- Триггер при создании нового лида
- Пересчёт при изменении статуса

## Файлы для Создания/Изменения

| Файл | Действие |
|------|----------|
| SQL миграция | INSERT агента + ALTER TABLE |
| `supabase/functions/leads-factory/index.ts` | Новый — Edge Function |
| `src/hooks/useLeadsFactory.ts` | Новый — React hook |
| `src/components/admin/leads/LeadAIInsights.tsx` | Новый — AI виджет |
| `src/components/admin/leads/FollowUpGenerator.tsx` | Новый — Генератор сообщений |
| `src/pages/admin/AdminConsultations.tsx` | Интеграция AI Score |
| `src/pages/admin/AdminLeadsDashboard.tsx` | AI Recommendations |

## Пример AI Output

```json
{
  "score": 85,
  "priority": "hot",
  "reasoning": "High budget vacation rental for next week, complete contact info",
  "recommended_action": "Call within 2 hours",
  "followup_message": {
    "whatsapp": "Здравствуйте, Pavel! 🌴 Спасибо за заявку на аренду виллы. Мы подобрали 3 варианта в вашем бюджете. Удобно созвониться сегодня?",
    "email": "Уважаемый Pavel, благодарим за обращение в UNO Properties..."
  },
  "assignment_suggestion": {
    "manager_id": "uuid",
    "reason": "Specializes in vacation rentals, has capacity"
  }
}
```

## Результат

После реализации:
- Автоматический скоринг всех новых лидов
- AI-приоритизация в списке заявок
- Генерация follow-up за 1 клик
- Рекомендации по назначению менеджеров
- Аналитика эффективности AI-скоринга
- 11 агентов в системе (был 10)

## Технические Детали

### Edge Function Structure

```typescript
// leads-factory/index.ts
interface ScoreRequest {
  leadId: string;
}

interface ScoreResponse {
  score: number;
  priority: 'hot' | 'warm' | 'cold';
  reasoning: string;
  recommended_action: string;
  followup?: {
    whatsapp: string;
    email: string;
  };
}
```

### Knowledge Base Template

```markdown
# Leads Factory Agent

Ты — AI-ассистент для скоринга и обработки лидов в системе UNO Properties.

## Правила скоринга

### Vacation Rental (базовый вес 1.2x)
- Даты < 7 дней: +20
- Бюджет > 10000 THB/ночь: +15
- Полный контакт: +10

### Property Purchase (базовый вес 1.0x)
- Бюджет > 10M THB: +25
- Указаны районы: +10
...
```
