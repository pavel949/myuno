

# План: Исправление touch-событий календаря на мобильных устройствах

## Обнаруженные проблемы

### 1. Отсутствие `touch-manipulation` на Calendar

**Проблема**: Компонент `Calendar` и кнопки дней не используют CSS-класс `touch-manipulation`, который критически важен для мобильных устройств:
- Без него браузер ждёт 300мс перед обработкой tap для проверки double-tap zoom
- Это делает клики "залипающими" или не отзывчивыми

**Сравнение**: Другие интерактивные элементы (BackButton, BookingBottomBar) уже используют `touch-manipulation`

### 2. Z-index конфликт между Sheet и BottomNav

| Компонент | Z-index | Позиция |
|-----------|---------|---------|
| BottomNav | z-50 | fixed bottom-0 |
| SheetOverlay | z-50 | fixed inset-0 |
| SheetContent | z-50 | fixed bottom-0 |

**Результат**: Sheet может появляться "под" навигацией или конкурировать за touch-события

### 3. Отсутствие safe-area padding

Календарь не учитывает высоту BottomNav, из-за чего нижние даты могут быть визуально доступны, но клики по ним перехватываются навигацией

---

## Решение

### 1. Добавить `touch-manipulation` в Calendar UI

**Файл**: `src/components/ui/calendar.tsx`

```typescript
classNames={{
  // ... existing classes
  day: cn(
    buttonVariants({ variant: "ghost" }), 
    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 touch-manipulation"
  ),
  // ...
}}
```

### 2. Увеличить z-index для Sheet

**Файл**: `src/components/ui/sheet.tsx`

Увеличить z-index для SheetOverlay и SheetContent до `z-[100]`, чтобы гарантированно показывать поверх всех элементов:

```typescript
// SheetOverlay
"fixed inset-0 z-[100] bg-black/80 ..."

// sheetVariants
"fixed z-[100] gap-4 bg-background ..."
```

### 3. Добавить padding-bottom для контента страницы

**Файл**: `src/pages/owner/OwnerCalendar.tsx`

Добавить отступ снизу для учёта высоты BottomNav:

```typescript
<div className="p-4 pb-24 space-y-4">
```

### 4. Добавить touch-manipulation в UnifiedPropertyCalendar

**Файл**: `src/components/owner/UnifiedPropertyCalendar.tsx`

Явно добавить `touch-manipulation` к контейнеру календаря:

```typescript
<Calendar
  ...
  className="pointer-events-auto touch-manipulation"
/>
```

---

## Порядок исправлений

1. **`src/components/ui/calendar.tsx`** — добавить `touch-manipulation` к классу `day`
2. **`src/components/ui/sheet.tsx`** — увеличить z-index до `z-[100]`
3. **`src/components/owner/UnifiedPropertyCalendar.tsx`** — добавить `touch-manipulation`
4. **`src/pages/owner/OwnerCalendar.tsx`** — добавить `pb-24` для safe-area

---

## Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/components/ui/calendar.tsx` | Добавить `touch-manipulation` к day кнопкам |
| `src/components/ui/sheet.tsx` | Z-index `z-50` → `z-[100]` |
| `src/components/owner/UnifiedPropertyCalendar.tsx` | Добавить `touch-manipulation` |
| `src/pages/owner/OwnerCalendar.tsx` | Добавить `pb-24` для BottomNav spacing |

---

## Ожидаемый результат

После исправлений:
- Tap на дату календаря моментально откроет Sheet-меню
- Sheet гарантированно отобразится поверх BottomNav
- Нижние даты календаря не будут перекрываться навигацией
- Улучшенная отзывчивость touch-событий на всех мобильных устройствах

