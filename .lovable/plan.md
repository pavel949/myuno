

## Фаза 3 — UX-полировка админ-интейка

### Что делаю

**3.1 Хаб `/admin/add` — единая точка входа**
- Новый `src/pages/admin/AdminAddHub.tsx` с 4 крупными карточками:
  1. **Один объект** → `/admin/intake` (mode=single)
  2. **Bulk текст/URL** → `/admin/intake` (mode=bulk)
  3. **CSV / Excel** → `/admin/intake` (mode=csv)
  4. **Заявки партнёров** → `/admin/vendor-applications`
- Каждая карточка: иконка, заголовок RU/EN, краткое описание, "когда использовать", счётчик в очереди (для заявок).
- Route добавляю в `App.tsx` под `/admin/add`.
- В `AdminSidebar` (или эквиваленте) — главный пункт «➕ Добавить» наверху, ведёт на `/admin/add`.

**3.2 Keyboard shortcuts в `IntakeQueue`**
- Хук `useIntakeQueueHotkeys` (новый в `src/hooks/`):
  - `A` — approve активной карточки
  - `D` — discard
  - `E` — edit (открыть форму)
  - `↑` / `↓` — навигация по очереди
  - `Shift+A` — approve all valid
- Подсветка активной карточки (ring + scroll-into-view).
- Hint-bar внизу `IntakeQueue` с подсказками клавиш (collapsible).
- Обновлю `AdminKeyboardShortcuts.tsx` — добавлю секцию «Intake Queue» в help-диалог.

**3.3 Mobile-first для `/admin/intake`**
- `IntakeModeSelector` — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (сейчас может быть жёстко 4 колонки).
- `PageHeader` на 384px — collapsible subtitle (показываем только title, остальное под "details" toggle).
- `IntakeItemCard` — компактный режим на мобиле: уменьшенные отступы, бейджи в один ряд, превью изображения 80px.
- Свайпы на карточке (через `@use-gesture/react` или ручной touch-handler):
  - Свайп вправо → approve
  - Свайп влево → discard
  - Визуальный feedback (зелёный/красный фон при свайпе).

**3.4 Audit log + soft-delete confirm**
- В `useIntakeAgent.approveItem` и `approveAll` после успешного INSERT — запись в `admin_audit_logs` через RPC или прямой insert: `{ action: 'intake_approve', target_table, target_id, payload: {vertical, source} }`.
- В `discardItem` / bulk discard — `AlertDialog` с подтверждением «Удалить N черновиков? Это действие необратимо».
- В `IntakeQueue` для bulk-approve тоже подтверждение, если items > 5.

### Файлы

**Новые (2):**
- `src/pages/admin/AdminAddHub.tsx`
- `src/hooks/useIntakeQueueHotkeys.ts`

**Изменяемые (~6):**
- `src/App.tsx` — route `/admin/add`
- `src/components/admin/AdminKeyboardShortcuts.tsx` — секция Intake Queue
- `src/components/admin/intake/IntakeQueue.tsx` — hotkeys, hint-bar, active item state
- `src/components/admin/intake/IntakeItemCard.tsx` — mobile-compact + swipe
- `src/components/admin/intake/IntakeModeSelector.tsx` — responsive grid
- `src/hooks/useIntakeAgent.ts` — audit log writes + confirm flow
- `src/components/admin/AdminSidebar.tsx` (или эквивалент) — пункт «Добавить»

**Не трогаю:**
- Витринные страницы.
- БД-схему (`admin_audit_logs` уже существует — проверю при реализации).
- Логику валидации/health-score (Фазы 1-2).

### Smoke-test после реализации
1. `/admin/add` → клик на «CSV» → редирект на `/admin/intake?mode=csv` с открытым визардом.
2. На `/admin/intake` нажатие `?` → справка содержит секцию Intake Queue.
3. На карточке в очереди: `A` → approve работает, `↓` → переход к следующей.
4. Mobile 384px: свайп вправо на карточке → approve с визуальным feedback.
5. Bulk discard 10 черновиков → AlertDialog с подтверждением → запись в `admin_audit_logs`.

### Риски
- **Свайпы на тач-устройствах** могут конфликтовать с вертикальным скроллом — буду блокировать только при горизонтальном движении > 50px.
- **`admin_audit_logs` схема** может потребовать уточнения полей. Если несостыковка — спрошу отдельно перед миграцией.

### Что НЕ входит (откладываем на Фазу 4)
- Smoke-test чек-лист всего пайплайна.
- Memory обновления (`mem://features/admin/intake-pipeline-v3`).

