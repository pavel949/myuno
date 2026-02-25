

# Редактирование плановых задач обслуживания

## Что сейчас есть
- Добавление из шаблонов (фиксированные параметры, без возможности настроить)
- Отметка "Выполнено" и удаление
- **Нет** возможности изменить частоту, стоимость, дату, заметки у существующей задачи

## Что будет добавлено

### 1. Диалог редактирования существующей задачи
При нажатии на карточку задачи открывается диалог, где можно изменить:
- **Частоту** (еженедельно / ежемесячно / ежеквартально / раз в полгода / ежегодно)
- **Следующую дату** выполнения
- **Примерную стоимость** и валюту
- **Приоритет** (low / normal / high)
- **Заметки** (свободный текст)

### 2. Настройка параметров при добавлении
Сейчас при добавлении параметры шаблона применяются без возможности изменить. Добавлю второй шаг — после выбора шаблона можно скорректировать частоту и стоимость перед сохранением.

### 3. Мутация `updateSchedule` в хуке
Добавить `useMutation` для UPDATE полей существующей записи в `property_maintenance_schedules`.

---

## Технические изменения

### Файлы

| Файл | Изменение |
|------|-----------|
| `src/hooks/useMaintenanceSchedules.ts` | Добавить мутацию `updateSchedule` |
| `src/components/owner/maintenance/EditScheduleDialog.tsx` | Новый компонент — форма редактирования |
| `src/components/owner/maintenance/AddScheduleDialog.tsx` | Добавить шаг настройки параметров перед сохранением |
| `src/components/owner/maintenance/ScheduleCard.tsx` | Добавить кнопку/клик для открытия редактирования |
| `src/pages/owner/MaintenancePlan.tsx` | Подключить EditScheduleDialog |

### Новый хук: `updateSchedule`
```text
updateSchedule.mutate({
  id: "...",
  frequency: "monthly",
  next_due_date: "2026-04-01",
  estimated_cost: 3000,
  priority: "high",
  notes: "Проверить дренаж"
})
```

### EditScheduleDialog
Поля формы:
- Frequency (Select из FREQUENCY_LABELS)
- Next due date (Input type="date")
- Estimated cost (Input type="number")
- Priority (Select: low / normal / high)
- Notes (Textarea)

### AddScheduleDialog — улучшение
После выбора шаблона показать дополнительные поля (frequency, cost), которые предзаполнены из шаблона, но доступны для изменения.

### ScheduleCard
Добавить иконку "Edit" (Pencil) рядом с кнопками "Done" и "Delete", которая вызывает `onEdit(schedule)`.
