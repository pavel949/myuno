

# Комплексный план устранения gaps в CRM-модуле

## Обзор выявленных проблем

| # | Gap | Критичность | Описание |
|---|-----|-------------|----------|
| 1 | Context Loss: "New Deal" из ContactDetail | Высокая | Кнопка "Новая сделка" на странице контакта ведёт на `/owner/sales` без передачи данных контакта |
| 2 | Type Safety: `useContactDeals` возвращает `any[]` | Средняя | Нет типизации, возможны runtime-ошибки |
| 3 | Scalability: нет серверной пагинации | Средняя | `useAgentDeals` и `useCrmContacts` загружают ВСЕ записи разом |
| 4 | CSV Import/Export | Средняя | Невозможно мигрировать данные из других CRM |
| 5 | Удаление заметок в Timeline | Низкая | Нет кнопки удаления заметок в ContactDetail |

---

## 1. Context Loss: Pre-fill контакта при создании сделки

**Проблема**: В `ContactDetail.tsx` кнопка "Новая сделка" просто делает `navigate('/owner/sales')`, теряя контекст контакта.

**Решение**:
- Добавить кнопку "Создать сделку" прямо в `ContactDetail`, которая открывает `CreateDealSheet` с передачей `prefilledContact`
- Добавить prop `prefilledContact?: CrmContact` в `CreateDealSheet`
- При наличии `prefilledContact` -- автоматически заполнять поля формы и устанавливать `selectedContact`

**Файлы**:
- `src/components/owner/sales/CreateDealSheet.tsx` -- добавить prop `prefilledContact`, при его наличии вызывать `setSelectedContact` и заполнять форму в `useEffect`
- `src/pages/owner/ContactDetail.tsx` -- заменить `navigate('/owner/sales')` на локальное открытие `CreateDealSheet` с передачей текущего контакта

---

## 2. Type Safety: типизация `useContactDeals`

**Проблема**: `useContactDeals` возвращает `any[]`, и в `ContactDetail` deals отображаются через `(d: any)`.

**Решение**:
- Типизировать возвращаемое значение `useContactDeals` как `AgentDeal[]`
- Убрать `as any` из шаблона в `ContactDetail`

**Файлы**:
- `src/hooks/useCrmContacts.ts` -- изменить возвращаемый тип `useContactDeals` на `Promise<AgentDeal[]>` с импортом `AgentDeal`
- `src/pages/owner/ContactDetail.tsx` -- убрать `(d: any)` в map, использовать типизированный объект

---

## 3. Серверная пагинация для контактов и сделок

**Проблема**: При 500+ контактах или сделках загрузка всех записей замедлит приложение.

**Решение**: Добавить offset-based пагинацию с параметрами `page` и `pageSize`.

**Файлы**:

- `src/hooks/useCrmContacts.ts`:
  - Добавить параметры `page: number`, `pageSize: number` в `useCrmContacts`
  - Использовать `.range(from, to)` в запросе
  - Добавить `useCrmContactsCount(companyId, filters)` для получения общего количества (с `.select('id', { count: 'exact', head: true })`)

- `src/hooks/useAgentDeals.ts`:
  - Аналогично добавить пагинацию в `useAgentDeals`
  - Добавить `useAgentDealsCount`

- `src/pages/owner/ContactsList.tsx`:
  - Добавить состояние `page`, передавать в хук
  - Добавить компонент `Pagination` из `@/components/ui/pagination` внизу списка
  - Показывать "1-20 из 150"

- `src/pages/owner/SalesPipeline.tsx` (или аналогичный файл списка сделок):
  - Аналогичная пагинация

---

## 4. CSV Import / Export контактов

**Проблема**: Нет возможности массово загрузить/выгрузить контакты для миграции с других CRM.

**Решение**: Добавить кнопки Import/Export на странице контактов.

**Файлы**:

- `src/components/owner/contacts/ContactExportButton.tsx` (новый):
  - Кнопка "Export CSV"
  - Использовать библиотеку `papaparse` (уже установлена) для генерации CSV
  - Экспорт всех не-архивированных контактов текущей компании

- `src/components/owner/contacts/ContactImportSheet.tsx` (новый):
  - Sheet с drag-and-drop зоной для CSV файла
  - Парсинг через `papaparse`
  - Маппинг колонок: автоматическое определение `first_name`, `last_name`, `phone`, `email` и т.д.
  - Предпросмотр первых 5 строк перед импортом
  - Batch-insert через supabase `.insert(rows)`
  - Обработка дубликатов по телефону (skip / overwrite)

- `src/pages/owner/ContactsList.tsx`:
  - Добавить кнопки Import/Export в header рядом с "Новый"

---

## 5. Удаление заметок в Timeline

**Проблема**: В `ContactDetail` заметки нельзя удалить.

**Решение**:
- Добавить кнопку удаления (иконка Trash2) в каждую заметку
- Использовать существующий хук `useDeleteContactNote`

**Файлы**:
- `src/pages/owner/ContactDetail.tsx` -- добавить кнопку удаления в рендер заметок, подключить `useDeleteContactNote`

---

## Порядок реализации

1. Type Safety (Gap 2) -- быстрый fix, 2 файла
2. Context Loss (Gap 1) -- 2 файла, критичный UX
3. Удаление заметок (Gap 5) -- 1 файл, простой fix
4. Серверная пагинация (Gap 3) -- 4-5 файлов, масштабируемость
5. CSV Import/Export (Gap 4) -- 3 новых файла, полезная фича

---

## Технические детали

### Пагинация -- формат запроса
```text
const pageSize = 20;
const from = page * pageSize;
const to = from + pageSize - 1;

supabase
  .from('crm_contacts')
  .select('*', { count: 'exact' })
  .eq('company_id', companyId)
  .range(from, to)
```

### CSV Import -- формат маппинга
```text
CSV колонка    -->  DB поле
Name           -->  first_name + last_name (split по пробелу)
Phone          -->  phone
Email          -->  email
Type           -->  contact_type
Source         -->  source
Budget         -->  budget_max
```

### Pre-fill контакта -- prop interface
```text
CreateDealSheet props:
  + prefilledContact?: CrmContact

При наличии prefilledContact:
  - selectedContact = prefilledContact
  - form.client_name = "first_name last_name"
  - form.client_phone = contact.phone
  - form.client_email = contact.email
```

