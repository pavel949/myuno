
# Аудит качества Marketing Command Center (MCC)

## Резюме текущего состояния

MCC представляет собой 7-модульную систему на `/admin/marketing` с базовым функционалом Campaign Factory. Проведённый анализ выявил **критические пробелы в бизнес-логике** и **отсутствие интеграции с существующими данными платформы**.

---

## 1. Критические проблемы (P0)

### 1.1 🔴 Нет интеграции с существующими лидами

**Проблема:** MCC использует отдельную таблицу `mcc_leads` (0 записей), полностью игнорируя `consultation_requests` (1+ записей с реальными данными).

| Таблица | Записей | Статус |
|---------|---------|--------|
| `mcc_leads` | 0 | Пустая |
| `consultation_requests` | 1+ | Реальные лиды |
| `mcc_campaigns` | 0 | Пустая |

**Последствия:**
- Невозможно работать с зарегистрированными пользователями
- Дублирование данных
- AI-скоринг (`ai_score`, `ai_priority`) в `consultation_requests` не используется MCC

**Решение:**
- Добавить `MCCLeadsTab` интеграцию с `consultation_requests`
- Отобразить `ai_score`, `ai_priority`, `ai_reasoning` из реальных лидов
- Добавить переключатель источника: MCC Leads / Consultation Requests / All

---

### 1.2 🔴 Mock-данные вместо реальных

**Модули с mock-данными:**

| Модуль | Компонент | Статус |
|--------|-----------|--------|
| Overview | `MCCOverviewTab` | Mock KPIs, mock recent leads |
| Leads | `MCCLeadsTab` | Fallback на `mockLeads` (строка 106) |
| Funnels | `MCCFunnelsTab` | 100% mock-данные |
| Content Lab | `MCCContentLabTab` | Mock-генерация (setTimeout) |
| Analytics | `MCCAnalyticsTab` | 100% mock-данные |
| Automation | `MCCAutomationTab` | 100% mock правила |

**Проблема:** Только Campaign Factory подключён к реальной БД.

---

### 1.3 🔴 RLS использует устаревшую логику

```sql
-- Текущая функция is_mcc_admin():
SELECT 1 FROM public.profiles 
WHERE id = auth.uid() 
AND role IN ('admin', 'super_admin')
```

**Проблема:** Проверяет `role` напрямую в `profiles`, а не через `user_roles` таблицу. Это нарушает security guidelines проекта.

**Правильная реализация:**
```sql
SELECT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'super_admin')
)
```

---

## 2. Серьёзные проблемы (P1)

### 2.1 🟠 AI Content Lab — заглушка

Текущая реализация в `MCCContentLabTab.tsx`:

```typescript
// Строки 37-47: Mock-генерация
const handleGenerate = async () => {
  setIsGenerating(true);
  setTimeout(() => {  // ← Нет реального AI
    setGeneratedContent([
      "🌴 Discover Phuket's Hidden Gems...",
      // Захардкоженный контент
    ]);
    setIsGenerating(false);
  }, 2000);
};
```

**Решение:** Интегрировать с `ai-agent` edge function и агентом `mcc-content`.

---

### 2.2 🟠 Нет связи User ↔ Lead

Нет механизма для:
1. Конвертации `mcc_leads.converted_to` → `auth.users.id`
2. Отслеживания пользователей, которые уже зарегистрировались
3. Связи `consultation_requests.user_id` → MCC лид

**Пользователи, уже на платформе:**
- Данные в `profiles` (registered users)
- Данные в `consultation_requests` (leads)
- Нет связки между ними в MCC

---

### 2.3 🟠 Funnels и Automation — только UI

- `MCCFunnelsTab` — визуализация без CRUD
- `MCCAutomationTab` — mock-правила, Switch не работает
- Нет связи с `mcc_funnels`, `mcc_automation_rules` таблицами

---

## 3. Умеренные проблемы (P2)

### 3.1 🟡 Linter warnings: RLS Always True

```
WARN: RLS Policy Always True (8 warnings)
- mcc_events: Anyone can create events (INSERT без условий)
- mcc_leads: Anyone can create leads (INSERT без условий)
```

**Риск:** Любой анонимный пользователь может вставлять записи.

---

### 3.2 🟡 Overview KPI — hardcoded значения

```typescript
// MCCOverviewTab.tsx
<KPICard
  title="CAC"
  value="$12.50"  // ← Hardcoded
  change={-8}
/>
<KPICard
  title="ROAS"
  value="3.8x"  // ← Hardcoded
/>
```

---

### 3.3 🟡 Нет хука для mcc_leads

Campaign Factory имеет `useCampaignFactory.ts`, но для Leads нет аналогичного хука — используется inline query в компоненте.

---

## 4. Бизнес-логика: что работает ✅

| Функция | Статус | Примечания |
|---------|--------|------------|
| CRUD кампаний | ✅ Работает | Полный цикл |
| Фильтрация кампаний | ✅ Работает | По статусу, цели, поиск |
| Статусный workflow | ✅ Работает | draft → active ↔ paused → completed |
| Дублирование | ✅ Работает | С обнулением performance |
| Валидация форм | ✅ Работает | Zod схема |
| Билингвальность | ✅ Работает | EN/RU для всех labels |

---

## 5. Рекомендуемый план исправлений

### Фаза 1: Критические (1-2 дня)

1. **Интеграция с consultation_requests**
   - Добавить `useConsultationLeads()` хук
   - Объединить данные в `MCCLeadsTab`
   - Показать AI-скоринг из существующих лидов

2. **Исправить RLS**
   - Обновить `is_mcc_admin()` на проверку `user_roles`
   - Добавить условия в INSERT политики

3. **Убрать mock-данные из Overview**
   - Подключить реальные агрегаты из `mcc_campaigns`
   - Добавить fallback для пустых данных

### Фаза 2: Серьёзные (3-5 дней)

4. **AI Content Lab**
   - Создать `mcc-content` AI агент
   - Интегрировать через `ai-agent` edge function
   - Сохранять в `mcc_creatives`

5. **Lead Hub полноценный**
   - Создать `useLeadHub.ts` хук
   - CRUD для `mcc_leads`
   - Синхронизация с `consultation_requests`

6. **Funnels CRUD**
   - Создать `useFunnelEngine.ts`
   - Форма создания воронки
   - Визуальный редактор этапов

### Фаза 3: Улучшения (1 неделя+)

7. **Automation Rules**
   - CRUD для `mcc_automation_rules`
   - Trigger execution engine
   - Интеграция с messaging

8. **Analytics с реальными данными**
   - Агрегация из `mcc_channel_metrics`
   - Attribution model switching
   - Export функционал

---

## 6. Архитектурные замечания

### Текущая структура файлов

```
src/components/admin/marketing/
├── CampaignCard.tsx         ✅ Готов
├── CampaignDetailSheet.tsx  ✅ Готов
├── CampaignFormSheet.tsx    ✅ Готов
├── MCCAnalyticsTab.tsx      ⚠️ Mock
├── MCCAutomationTab.tsx     ⚠️ Mock
├── MCCCampaignsTab.tsx      ✅ Готов
├── MCCContentLabTab.tsx     ⚠️ Mock
├── MCCFunnelsTab.tsx        ⚠️ Mock
├── MCCLeadsTab.tsx          ⚠️ Partial
├── MCCOverviewTab.tsx       ⚠️ Partial
└── index.ts
```

### Недостающие хуки

```
src/hooks/
├── useCampaignFactory.ts    ✅ Существует
├── useLeadHub.ts            ❌ Нужен
├── useFunnelEngine.ts       ❌ Нужен
├── useMCCAnalytics.ts       ❌ Нужен
├── useMCCAutomation.ts      ❌ Нужен
└── useMCCContent.ts         ❌ Нужен
```

---

## 7. Вывод

**MCC построен архитектурно правильно**, но реализован только на 20-25%:

| Готовность | Модули |
|------------|--------|
| 90%+ | Campaign Factory |
| 40-50% | Lead Hub, Overview |
| 10-20% | Funnels, Analytics, Automation, Content Lab |

**Главный блокер:** Отсутствие интеграции с существующими данными (`consultation_requests`, `profiles`). Без этого MCC не может работать как "Growth OS" для текущих пользователей платформы.

**Приоритет #1:** Интегрировать `consultation_requests` в Lead Hub и показать реальные данные вместо mock.
