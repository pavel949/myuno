
## Проблема

Календарь в шите бронирования яхты не реагирует на клики. Это классический баг Radix UI `Dialog/Sheet`: оверлей перехватывает все события мыши, а без `pointer-events-auto` на компоненте `CalendarComponent` — даты нельзя выбрать.

Консольный лог подтверждает: `DayPicker → Calendar → Sheet → Dialog` — компонент рендерится внутри `DialogPortal`, который блокирует события.

---

## Решение

Одно изменение в одном файле.

**Файл:** `src/components/yachts/YachtBookingQuickSelect.tsx`

**Строка 246** — добавить `pointer-events-auto` к `className` календаря:

```tsx
// Было:
<CalendarComponent
  mode="single"
  selected={selectedDate}
  onSelect={(date) => { setSelectedDate(date); setShowCalendar(false); }}
  disabled={(date) => date < today}
  locale={language === 'ru' ? ru : enUS}
  className="rounded-xl border p-3"
/>

// Станет:
<CalendarComponent
  mode="single"
  selected={selectedDate}
  onSelect={(date) => { setSelectedDate(date); setShowCalendar(false); }}
  disabled={(date) => date < today}
  locale={language === 'ru' ? ru : enUS}
  className="rounded-xl border p-3 pointer-events-auto"
/>
```

---

## Почему это работает

Компонент `Calendar` уже передаёт `pointer-events-auto` на сам `DayPicker` внутри (`cn("p-3 pointer-events-auto", className)`). Добавление `pointer-events-auto` в `className` через props усиливает этот эффект и гарантирует, что обёртка `div` также не блокирует события.

---

## Технические детали

- **Файлы:** только `src/components/yachts/YachtBookingQuickSelect.tsx`
- **Строк изменено:** 1
- **Риск регрессий:** нулевой — изменение локальное, не затрагивает другие компоненты
- **База данных:** изменений нет
