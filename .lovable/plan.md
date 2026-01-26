
# План: Исправление ошибок управления календарём

## Обнаруженные проблемы

Проведён детальный анализ кода управления календарём. Выявлены следующие баги:

### Критические баги

| Компонент | Проблема | Влияние |
|-----------|----------|---------|
| `AddBookingFromCalendarDialog` | Некорректная синхронизация `initialDate` с состоянием | При повторном открытии диалога с другой датой — показывается старая дата |
| `BlockDatesDialog` | Состояние `dateRange` не обновляется при изменении `initialDate` | Блокировка привязывается к неправильной дате |
| `CreateServiceTaskDialog` | `defaultDate` и `defaultPropertyId` игнорируются после первого рендера | Задачи создаются не на тех объектах/датах |

### UX-проблемы

- Жёстко закодированные сообщения на английском в хуке доступности
- Нет возможности изменить дату заезда в диалоге бронирования
- Отсутствует индикатор загрузки при блокировке/разблокировке дат

---

## Решение

### 1. AddBookingFromCalendarDialog — синхронизация props

**Проблема**: `useState` с функцией-инициализатором не реагирует на изменение props

**Исправление**:
- Добавить `useEffect` для синхронизации `checkIn` с `initialDate` при изменении `open` или `initialDate`
- Удалить некорректный блок `useState(() => {...})`
- Сбрасывать форму при закрытии диалога

```typescript
// Добавить useEffect для синхронизации
useEffect(() => {
  if (open && initialDate) {
    setCheckIn(initialDate);
    setCheckOut(undefined);
  }
}, [open, initialDate]);

// При закрытии диалога — сбросить форму
const handleClose = (isOpen: boolean) => {
  if (!isOpen) {
    resetForm();
  }
  onOpenChange(isOpen);
};
```

---

### 2. BlockDatesDialog — синхронизация dateRange

**Проблема**: Состояние инициализируется один раз и не обновляется

**Исправление**:
- Добавить `useEffect` для установки `dateRange` при открытии диалога
- Сбрасывать состояние при закрытии

```typescript
useEffect(() => {
  if (open && initialDate) {
    setDateRange({ from: initialDate, to: initialDate });
    setNote('');
  }
}, [open, initialDate]);

const handleClose = (isOpen: boolean) => {
  if (!isOpen) {
    setDateRange(undefined);
    setNote('');
  }
  onOpenChange(isOpen);
};
```

---

### 3. CreateServiceTaskDialog — синхронизация formData

**Проблема**: `defaultPropertyId` и `defaultDate` игнорируются после первого рендера

**Исправление**:
- Добавить `useEffect` для синхронизации при открытии диалога
- Корректно сбрасывать форму с актуальными значениями по умолчанию

```typescript
useEffect(() => {
  if (open) {
    setFormData(f => ({
      ...f,
      property_id: defaultPropertyId || f.property_id || '',
      scheduled_date: defaultDate || new Date(),
    }));
  }
}, [open, defaultPropertyId, defaultDate]);
```

---

### 4. Локализация сообщений

**Файл**: `usePropertyAvailabilityManagement.ts`

**Исправление**: Добавить хук `useLanguage` и локализовать toast-сообщения

```typescript
const { language } = useLanguage();
const isRu = language === 'ru';

// В onSuccess:
toast({
  title: isRu ? 'Сохранено' : 'Saved',
  description: isRu ? 'Доступность обновлена' : 'Availability updated successfully',
});
```

---

### 5. Возможность изменить дату заезда

**Файл**: `AddBookingFromCalendarDialog.tsx`

**Исправление**: Сделать дату заезда редактируемой через `Popover` с календарём (аналогично дате выезда)

---

### 6. Индикатор загрузки в CalendarDayEventsSheet

**Файл**: `CalendarDayEventsSheet.tsx`

**Исправление**: Передать `isLoading` prop и показывать spinner на кнопках блокировки

---

## Порядок исправлений

1. **AddBookingFromCalendarDialog** — добавить `useEffect` для синхронизации `initialDate`
2. **BlockDatesDialog** — добавить `useEffect` для синхронизации `initialDate` 
3. **CreateServiceTaskDialog** — добавить `useEffect` для синхронизации `defaultDate` и `defaultPropertyId`
4. **usePropertyAvailabilityManagement** — локализация сообщений
5. **AddBookingFromCalendarDialog** — сделать дату заезда редактируемой
6. **CalendarDayEventsSheet** — добавить индикатор загрузки

---

## Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/components/owner/AddBookingFromCalendarDialog.tsx` | useEffect для синхронизации, редактируемый check-in, сброс формы |
| `src/components/owner/BlockDatesDialog.tsx` | useEffect для синхронизации, обработка закрытия |
| `src/components/owner/CreateServiceTaskDialog.tsx` | useEffect для синхронизации props |
| `src/hooks/usePropertyAvailabilityManagement.ts` | Локализация toast-сообщений |
| `src/components/owner/CalendarDayEventsSheet.tsx` | Индикатор загрузки на кнопках |

---

## Ожидаемый результат

После исправлений:
- ✅ Диалоги всегда открываются с актуальной выбранной датой
- ✅ Формы корректно сбрасываются при закрытии
- ✅ Сообщения отображаются на языке пользователя
- ✅ Дата заезда редактируема
- ✅ Пользователь видит индикатор загрузки при операциях
