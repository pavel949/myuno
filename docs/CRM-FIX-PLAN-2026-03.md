# План исправлений CRM / Sales (март 2026) — выполнено

## Цель

Устранить сбои спринта из `CLAUDE.md`: контакты, сохранение сделки, предсказуемая обратная связь при переносе карточек.

## Проблемы и решения

| # | Симптом | Причина | Исправление |
|---|---------|---------|-------------|
| 1 | Сохранение сделки «молча» не применяется | `deal_field_changes` вызывался **до** `update`; при ошибке RLS на аудите транзакция откатывалась по смыслу UX | Сначала **`updateDeal`**, затем аудит в `try/catch` (сбой аудита не блокирует сохранение) |
| 2 | Список контактов падает при странном embed | Запрос `select('*, agent_deals!contact_id(id)')` может ошибиться (PostgREST/RLS) | **Fallback**: повтор запроса с `select('*')`, `deal_count` = 0 |
| 3 | Kanban: дублирование и нет success | Двойная вставка в `deal_field_changes` + нет тоста об успехе | Удалён лишний `insert`, добавлен **toast** после успешного DnD |
| 4 | История полей без VIP/тегов/приоритета | Поля не были в `TRACKED_DEAL_FIELDS` | Добавлены `priority`, `tags`, `is_vip` |
| 5 | Форма редактирования сделки: двойной скролл | Вложенный `max-h` + `ScrollArea` в `ResponsiveModal` | Убран внутренний `max-h`; скролл только в модалке |

## Затронутые файлы

- `src/hooks/useCrmContacts.ts` — fallback запроса
- `src/hooks/useDealFieldChanges.ts` — `TRACKED_DEAL_FIELDS`
- `src/components/owner/sales/EditDealSheet.tsx` — порядок save + аудит, разметка
- `src/pages/owner/SalesDealDetail.tsx` — этап и статус: save → аудит
- `src/components/owner/sales/KanbanBoard.tsx` — DnD: save → аудит, toast, без дубля insert

## Следующие шаги (выполнено)

- **Единый формат аудита:** экспорт `auditFieldValue()` в `useDealFieldChanges.ts` (те же правила, что у `diffDealFields`). Используется в `SalesDealDetail`, `KanbanBoard`, `useBulkUpdateStage` (`useAgentDeals.ts`).
- **CI:** шаг `npm run typecheck` добавлен в `.github/workflows/ci.yml` (после ESLint, таймаут job 25 мин).

## Рекомендации на потом

- При необходимости дублировать правила кодирования в edge functions — импортировать ту же логику из общего модуля или копировать тест из `dealAuditEncoding`.
