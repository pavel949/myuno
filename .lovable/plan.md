
# Аудит качества Marketing Command Center (MCC)

## Резюме текущего состояния

MCC представляет собой 7-модульную систему на `/admin/marketing`. **Фаза 1 критических исправлений выполнена.**

---

## ✅ ВЫПОЛНЕНО: Фаза 1 (Критические исправления)

### 1.1 ✅ Исправлена RLS функция `is_mcc_admin()`

**Было:**
```sql
SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
```

**Стало:**
```sql
SELECT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'uno_team')
)
```

### 1.2 ✅ Интеграция с `consultation_requests`

**Создан хук `useLeadHub.ts`** — объединяет данные из:
- `mcc_leads` (MCC лиды)
- `consultation_requests` (реальные заявки клиентов)

**Возможности:**
- Переключатель источника: All / Consultations / MCC
- Отображение `ai_score`, `ai_priority`, `ai_reasoning`
- Индикатор зарегистрированных пользователей (`user_id`)
- Фильтрация по приоритету (Hot/Warm/Cold)
- Статистика по источникам

### 1.3 ✅ Overview подключён к реальным данным

**MCCOverviewTab теперь использует:**
- `useLeadHub()` — статистика лидов
- `useCampaigns()` — данные кампаний
- `useRecentLeads()` — последние лиды из обеих таблиц

**KPI показывают реальные данные:**
- Total Leads — из `mcc_leads` + `consultation_requests`
- CAC — расчёт из `performance_data` кампаний
- Conversion Rate — реальная конверсия
- Active Campaigns — из `mcc_campaigns`

**AI Insights генерируются динамически:**
- Алерты о горячих лидах
- Предупреждения о низкой конверсии
- Информация об AI-скоринге

---

## ✅ ВЫПОЛНЕНО: Фаза 2.1 (AI Content Lab)

### 2.1 ✅ AI Content Lab интегрирован

**Создан AI агент `mcc-content`:**
- Slug: `mcc-content`
- Model: `google/gemini-3-flash-preview`
- Специализированный system prompt для маркетингового контента

**Создан хук `useMCCContent.ts`:**
- Стриминг ответов от AI agent
- Парсинг вариантов контента
- CRUD для `mcc_creatives`
- Сохранение с metadata

**Обновлён `MCCContentLabTab.tsx`:**
- Убран mock setTimeout
- Реальная интеграция с ai-agent edge function
- UI для сохранения креативов в БД
- Отображение сохранённых креативов
- Quick actions с pre-filled prompts

---

## 🔄 В ПРОЦЕССЕ: Фаза 2 (продолжение)

### 2.2 🟠 Funnels CRUD

- Создать `useFunnelEngine.ts`
- Форма создания воронки
- Визуальный редактор этапов

### 2.3 🟠 Automation Rules

- CRUD для `mcc_automation_rules`
- Интерактивные Switch компоненты

---

## 📋 ЗАПЛАНИРОВАНО: Фаза 3

### 3.1 🔵 Analytics с реальными данными

- Агрегация из `mcc_channel_metrics`
- Attribution model switching
- Export функционал

### 3.2 🔵 RLS политики INSERT

- Добавить условия в INSERT политики для `mcc_events`
- Добавить условия в INSERT политики для `mcc_leads`

---

## Текущее состояние модулей

| Модуль | Готовность | Статус |
|--------|------------|--------|
| Campaign Factory | 90% | ✅ Полный CRUD |
| Lead Hub | 80% | ✅ Интегрирован с consultation_requests |
| Overview | 75% | ✅ Реальные данные, динамические инсайты |
| Funnels | 15% | 🟠 Только UI |
| Analytics | 15% | 🟠 Mock данные |
| Automation | 10% | 🟠 Mock правила |
| Content Lab | 10% | 🟠 Mock генерация |

---

## Новые файлы

| Файл | Описание |
|------|----------|
| `src/hooks/useLeadHub.ts` | Unified lead management hook |
| `src/hooks/useCampaignFactory.ts` | Campaign CRUD operations |
| `src/types/marketing.ts` | MCC type definitions |

---

## Следующие шаги

1. **AI Content Lab** — интеграция с AI агентом
2. **Funnels** — CRUD и визуальный редактор
3. **RLS hardening** — условия в INSERT политиках
