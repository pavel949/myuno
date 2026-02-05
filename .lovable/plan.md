

# 🏗️ Стратегический План Работ myUNO
## Системный инженер: Анализ и Приоритизация

---

## Текущее Состояние Платформы

```text
┌─────────────────────────────────────────────────────────────────┐
│                    myUNO Platform Status                        │
├─────────────────────────────────────────────────────────────────┤
│  LifeOS............... ✅ ACTIVE (Manual Mode)                  │
│  AI Infrastructure.... ✅ 8 agents operational                  │
│  Catalog.............. ⚠️  Needs hygiene                        │
│  Security............. ⚠️  6 linter issues                      │
│  Technical Debt....... ⚠️  130 TODO markers                     │
│  Public Status........ 🔒 Coming Soon (Maintenance)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Фаза 1: КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ (P0)
**Срок: 1-2 дня | Риск: Высокий если не исправить**

### 1.1 Безопасность БД
Линтер выявил 6 проблем:
- **3 ERROR**: `SECURITY DEFINER` views (потенциальный обход RLS)
- **2 WARN**: Overly permissive RLS (`USING (true)` для UPDATE/DELETE)
- **1 WARN**: Функции без `search_path`

**Действия:**
- Audit всех views с `SECURITY DEFINER`
- Переработать на `SECURITY INVOKER` где возможно
- Ужесточить RLS политики для записи/удаления

### 1.2 UX-Баги из Ревью
Выявленные проблемы:
- Raw slugs вместо человеческих названий (`babysitter` → "Няни")
- Truncated titles на карточках
- Процентные индикаторы без пояснений (85% — это что?)
- Смешанные языки при переключении EN/RU

**Действия:**
- Создать lookup-таблицу `entity_type_labels` (EN/RU)
- Добавить CSS-правила для полных заголовков
- Добавить "Match" prefix к процентам

---

## Фаза 2: СТАБИЛИЗАЦИЯ КАТАЛОГА (P1)
**Срок: 3-5 дней | Риск: Средний**

### 2.1 Объединение Properties
Согласно `.lovable/plan.md`:
- `owner_properties` + `properties` → единая `unified_properties`
- `listing_modes text[]` для аренды + продажи
- Views для разграничения доступа

```text
[owner_properties] ─┬─▶ [unified_properties] ◀─┬─ [properties]
                    │                          │
                    ▼                          ▼
          [v_owner_properties]       [v_marketplace_listings]
```

### 2.2 Taxonomy Normalization
Применить созданные lookup-таблицы:
- `taxonomy_normalization` → нормализация значений
- `entity_classification_hints` → разделение tours/experiences
- Интеграция с фильтрами без изменения source data

### 2.3 Удаление Дублей в Каталоге
Experiences vs Tours vs Water Activities:
- Добавить classification hints
- Provider guidance в формах
- Не мержить таблицы — только классификация

---

## Фаза 3: ТЕХНИЧЕСКИЙ ДОЛГ (P2)
**Срок: 5-7 дней | Параллельно с другими фазами**

### 3.1 TODO/FIXME Cleanup (130 маркеров)
Приоритетные файлы:
| Файл | Проблема | Действие |
|------|----------|----------|
| `TransportBooking.tsx` | Demo vehicles hardcoded | Подключить к `transport_vehicles` |
| `TeamInboxPage.tsx` | Mock tasks | Создать `team_tasks` таблицу или убрать UI |
| `CleaningDetail.tsx` | Hardcoded services | Фильтр по `services.category='cleaning'` |
| `RestaurantMap.tsx` | Hardcoded coordinates | Добавить lat/lng в `restaurants` |

### 3.2 Deprecated Files Cleanup
Устаревшие файлы для удаления/рефакторинга:
- `useLifeSituations.ts` → замена на `useLifeOS.ts`
- `currencyUtils.ts` → замена на `@/lib/config/currencies`
- `CURRENCY.SYMBOLS` константа → `getCurrencySymbol()`

### 3.3 AI Agent Consolidation
Согласно `deployment_order.md`:
- Удалить legacy duplicates (`ai-owner-assistant`, `ai-property-assistant`)
- Направить всё через canonical `ai-agent` function
- Добавить `correlation_id` и `agent_version` в логи

---

## Фаза 4: АДМИН-ИНСТРУМЕНТЫ (P2)
**Срок: 3-4 дня | Зависит от Фазы 2**

### 4.1 LifeOS Admin Улучшения
Уже реализовано:
- ✅ Health monitoring
- ✅ Governance rules
- ✅ AI Analyst (read-only)
- ✅ Change impact preview

Доработать:
- Entity labels в маппингах (RU/EN)
- Bulk operations (массовое изменение weight)
- Export/Import маппингов

### 4.2 Provider Dashboard Hints
Применить `provider_input_rules`:
- Inline hints в формах создания
- Soft warnings (не блокирующие)
- Suggestions для улучшения качества

### 4.3 AI Observability Dashboard
Per `admin_ai_observability_spec.md`:
- Enhanced stats cards
- Error tracking panel
- Model usage breakdown

---

## Фаза 5: ПРЕДЗАПУСК (P1)
**Срок: 2-3 дня | Перед снятием Coming Soon**

### 5.1 Mobile UX Audit
Пройти все критические paths:
- Home → LifeOS → Entity → Booking
- Search → Results → Detail
- Auth → Profile → Wallet

### 5.2 Performance Check
- Lazy loading валидация
- Image optimization
- Bundle size analysis

### 5.3 Coming Soon → Live
Когда готово:
```typescript
// MaintenanceContext.tsx
const [isMaintenanceMode] = useState(false);
```

---

## Матрица Приоритетов

```text
                     IMPACT
              Low            High
         ┌─────────────┬─────────────┐
    Easy │  P3: Docs   │ P1: UX Bugs │
EFFORT   │  Labels     │ Security    │
         ├─────────────┼─────────────┤
    Hard │  P4: Later  │ P2: Catalog │
         │  New AI     │ Properties  │
         └─────────────┴─────────────┘
```

---

## Порядок Выполнения

```text
Week 1:
├── Day 1-2: Security fixes (P0)
├── Day 3-4: UX bugs + entity labels (P0/P1)
└── Day 5: Mobile audit (P1)

Week 2:
├── Day 1-3: Properties unification (P1)
├── Day 4-5: TODO cleanup (P2)
└── Day 5: Provider hints (P2)

Week 3:
├── Day 1-2: AI consolidation (P2)
├── Day 3: Admin improvements (P2)
├── Day 4: Performance check (P1)
└── Day 5: Going Live 🚀
```

---

## Рекомендация

**Начать с Фазы 1 (Security + UX Bugs)** — это lowest-effort, highest-impact.

После этого переходить к Properties unification, так как это blocking issue для корректной работы Owner Dashboard и Marketplace.

LifeOS уже стабилен и функционален — не трогать без необходимости.

---

## Команда для Старта

Если хотите начать — выберите:
1. **"Исправить безопасность"** — Security fixes (P0)
2. **"Исправить UX баги"** — Entity labels + truncation (P0)
3. **"Объединить properties"** — Catalog merge (P1)
4. **"Убрать TODO"** — Technical debt (P2)

