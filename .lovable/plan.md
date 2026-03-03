

# Редактирование цен по клику + аудит-лог изменений

## Что сделаем

1. **Клик по дате в календаре** -- открывает попавер редактирования цены для одной конкретной даты (сейчас работает только drag-selection нескольких дат)
2. **Логирование всех изменений** -- каждое изменение цены, блокировки или условий аренды записывается в `property_activity_log` с указанием кто, что, когда и какое значение было/стало
3. **Доступ директора к логу** -- директор УК видит полную историю изменений по всем объектам компании

---

## Шаг 1. Клик по дате в календаре

**Файл:** `src/components/property/PropertyCalendar.tsx`

Сейчас popover открывается только после drag-selection (mouseDown -> mouseUp). Добавим обработку обычного клика:
- Если mouseDown и mouseUp на одной дате (без перетаскивания) -- открывается попавер для одной даты
- Попавер показывает текущую цену, статус, и позволяет изменить стоимость, min nights, заметку
- Добавить кнопку "Сохранить цену" которая применяет изменение только к этой дате

Техническая деталь: различать клик и drag по расстоянию -- если selectionStart === selectionEnd, это клик по одной дате.

## Шаг 2. Логирование изменений цен и условий

**Файлы:** `PropertyCalendar.tsx`, `CalendarSection.tsx`, `RateManagementPage.tsx`

Добавить callback `onLogActivity` в PropertyCalendar, который вызывается при каждом изменении:
- Изменение цены конкретной даты: action = `price_override`, details = `{date, old_value, new_value}`
- Блокировка/разблокировка дат: action = `availability_changed`, details = `{dates, status}`
- Изменение базовой цены (на странице тарифов): action = `base_price_changed`, details = `{old_value, new_value}`
- Создание/изменение/удаление сезона: action = `season_created/updated/deleted`

Все записи сохраняются в существующую таблицу `property_activity_log` через `supabase.from('property_activity_log').insert(...)`.

## Шаг 3. RLS для доступа директора УК

**Миграция:** Добавить RLS-политику, позволяющую директорам/админам УК видеть логи всех объектов компании:

```text
CREATE POLICY "MC directors can view company property activity"
ON property_activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    WHERE p.id = property_activity_log.property_id
      AND mcm.user_id = auth.uid()
      AND mcm.role IN ('director', 'admin')
      AND mcm.status = 'active'
  )
);
```

## Шаг 4. UI лога для директора

**Файл:** Новый компонент или расширение существующего `ActivityFeed.tsx`

На странице тарифов (`RateManagementPage.tsx`) добавить секцию "История изменений" (collapsible), показывающую последние записи из `property_activity_log` отфильтрованные по action типам: `price_override`, `base_price_changed`, `season_created`, `season_updated`, `season_deleted`, `availability_changed`. Каждая запись показывает:
- Имя сотрудника (из profiles через join)
- Действие и детали (старое -> новое значение)
- Дата и время

---

## Технические детали

**Изменяемые файлы:**
- `src/components/property/PropertyCalendar.tsx` -- обработка клика, callback логирования
- `src/components/owner/property-manage/CalendarSection.tsx` -- передача propertyId и логирования
- `src/pages/owner/RateManagementPage.tsx` -- логирование изменений базовой цены и сезонов, секция истории
- `supabase/migrations/` -- RLS-политика для MC директоров
- `src/hooks/usePropertyRateSeasons.ts` -- добавить логирование в мутации save/delete

**Существующая инфраструктура:** Таблица `property_activity_log` уже существует с полями `property_id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details` (JSONB). RLS включен, политики для владельцев и делегатов есть. Хук `usePropertyActivityLog` уже реализован.
