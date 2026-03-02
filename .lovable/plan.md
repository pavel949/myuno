
# Корзина для удалённых объектов (Soft Delete and Recovery)

## Проблема
Сейчас удаление объектов из базы данных — необратимое. Нет возможности восстановить случайно удалённый объект.

## Решение
Реализовать механизм "мягкого удаления" (soft delete) с корзиной в админ-панели, где удалённые объекты хранятся 30 дней перед окончательным удалением.

---

## Этапы реализации

### 1. Изменение структуры базы данных
Добавить в таблицу `properties` два поля:
- `deleted_at` (timestamp, nullable) — дата удаления
- `deleted_by` (uuid, nullable) — кто удалил

Обновить существующие RLS-политики и представления, чтобы обычные запросы автоматически исключали записи с `deleted_at IS NOT NULL`.

### 2. Обновление логики удаления
Во всех местах, где сейчас выполняется `DELETE FROM properties`, заменить на `UPDATE ... SET deleted_at = now(), deleted_by = auth.uid(), is_active = false`.

Затронутые файлы:
- `src/components/admin/catalog/UnifiedCatalogTable.tsx` — кнопка удаления в каталоге
- Любые другие компоненты, вызывающие `.delete()` на таблице `properties`

### 3. Раздел "Корзина" в админ-панели
Новая страница/вкладка в админ-панели (`/admin/trash` или вкладка в каталоге), показывающая удалённые объекты с возможностью:
- **Восстановить** — обнулить `deleted_at`, `deleted_by`, вернуть `is_active = true`
- **Удалить навсегда** — выполнить настоящий `DELETE`
- Показать дату удаления и кто удалил

### 4. Автоочистка (опционально)
Запланированная backend-функция (cron) для окончательного удаления записей старше 30 дней из корзины.

---

## Технические детали

**Миграция SQL:**
```sql
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid DEFAULT NULL;

CREATE INDEX idx_properties_deleted_at ON public.properties(deleted_at)
  WHERE deleted_at IS NOT NULL;
```

**Фильтрация в запросах:**
Все существующие запросы к `properties` получат дополнительный фильтр `.is('deleted_at', null)`, чтобы удалённые объекты не отображались в обычных списках.

**Новые файлы:**
- `src/pages/admin/AdminTrash.tsx` — страница корзины
- Маршрут в роутере

**Изменяемые файлы:**
- `UnifiedCatalogTable.tsx` — soft delete вместо hard delete
- Хуки загрузки properties — добавить фильтр `deleted_at is null`
- Роутер — добавить маршрут `/admin/trash`
