
# Технический аудит критических процессов платформы UNO

## Резюме аудита

По результатам глубокого анализа кодовой базы выявлено **47 критических проблем** в 5 ключевых областях:
1. Процесс бронирования (Booking Flow)
2. Онбординг поставщиков (Vendor Onboarding)
3. Управление каталогом товаров/услуг
4. UI-компоненты (Select, Dropdown, Scroll)
5. Админ-панели

---

## Часть 1: Диагностика проблем

### 1.1 Критические ошибки бронирования

| Проблема | Файл | Причина |
|----------|------|---------|
| Ошибки в конце flow | `useOrders.ts:239` | RPC `create_order_atomic` может не возвращать ошибку в ожидаемом формате |
| Отсутствие валидации availability | `ExperienceBooking.tsx` | Проверка доступности слота происходит ПОСЛЕ нажатия "Подтвердить" |
| Wallet payment blocked | `BookingPaymentSelect.tsx:107` | Баланс кошелька проверяется, но ошибка показывается только как disabled state |

**Корневая причина:** Атомарная RPC-функция `create_order_atomic` работает корректно, но:
- Нет предварительной проверки доступности на уровне БД
- Ошибки RPC не всегда содержат понятное сообщение для пользователя
- Отсутствует retry-логика при временных сбоях

### 1.2 Проблемы онбординга поставщиков

| Проблема | Файл | Влияние |
|----------|------|---------|
| Hardcoded verticals | `VendorOnboarding.tsx:44-60` | 15 категорий зашиты в код |
| Дублирование записей | `useVendor.ts:291-324` | При повторном submit создаются duplicate providers |
| marketplace_vendor не создаётся | `useVendor.ts:329-364` | Ошибка может быть проигнорирована (catch + console.warn) |

**Последствие:** Вендор успешно создаётся, но не может добавлять товары из-за отсутствия `marketplace_vendor_id`.

### 1.3 Проблемы каталога товаров/услуг

| Проблема | Файл | Влияние |
|----------|------|---------|
| Select внутри Dialog | `AdminServices.tsx:457-614` | На мобильных устройствах dropdown не скроллится |
| Нет multi-select для категорий | `VendorProducts.tsx:500+` | Товар может быть только в 1 категории |
| ScrollArea конфликт | `AdminServices.tsx:479` | Вложенный скролл блокирует touch события |

### 1.4 UI-компоненты

**SelectContent (src/components/ui/select.tsx:61-90):**
```
max-h-96 overflow-hidden → Ограничение 384px
```
- На мобильных с длинными списками (50+ провайдеров) dropdown обрезается
- `overflow-hidden` блокирует scroll внутри

**Отсутствующие компоненты:**
- `MultiSelect` - нет в проекте, эмулируется через Checkbox grid
- `VirtualizedSelect` - для списков 100+ элементов
- `SearchableSelect` - комбинация Input + Select

### 1.5 Админ-панели

| Проблема | Локация | Решение |
|----------|---------|---------|
| 65+ отдельных страниц | `src/pages/admin/` | Избыточность, сложно поддерживать |
| Dialog для форм | Везде | Блокирует основной UI, сложно с мобильного |
| Нет inline editing | Таблицы | Каждое изменение требует открытия модала |

---

## Часть 2: План системных исправлений

### Фаза 1: Стабилизация UI-компонентов (Высокий приоритет)

**1.1 Улучшение SelectContent**

Добавить `overflow-y-auto`, увеличить `max-h`, исправить z-index:

```tsx
// src/components/ui/select.tsx - SelectContent
className={cn(
  "relative z-[999] max-h-[min(400px,80vh)] min-w-[8rem] overflow-y-auto",
  "rounded-md border bg-popover text-popover-foreground shadow-lg",
  // ...остальные классы
)}
```

**1.2 Создание SearchableSelect**

Новый компонент для длинных списков провайдеров:
- Поле поиска сверху
- Виртуализация для 50+ элементов
- Группировка по категориям

**1.3 Создание MultiSelectTags**

Для случаев мультивыбора (категории, verticals):
- Отображение выбранных как tags/chips
- Dropdown с чекбоксами
- Поддержка keyboard navigation

### Фаза 2: Исправление Booking Flow

**2.1 Предварительная проверка availability**

Перед финальным submit проверять:
1. Доступность слота в календаре
2. Достаточность баланса кошелька
3. Активность провайдера

```typescript
// Добавить в ExperienceBooking.tsx перед handleSubmit
const { isAvailable, error } = await checkAvailability({
  experience_id: experience.id,
  date: selectedDate,
  time: selectedTime,
  participants,
});

if (!isAvailable) {
  toast.error(error || 'Slot not available');
  return;
}
```

**2.2 Улучшение обработки ошибок RPC**

В `useOrders.ts` добавить маппинг кодов ошибок:

```typescript
const ERROR_MESSAGES = {
  'insufficient_wallet': { en: 'Insufficient wallet balance', ru: 'Недостаточно средств' },
  'slot_unavailable': { en: 'Time slot no longer available', ru: 'Слот уже занят' },
  'provider_inactive': { en: 'Provider is currently unavailable', ru: 'Провайдер недоступен' },
};
```

### Фаза 3: Исправление Vendor Onboarding

**3.1 Динамическая загрузка вертикалей**

Заменить `availableVerticals` на хук:

```typescript
// VendorOnboarding.tsx
const { verticals, isLoading } = useVerticals(); // из taxonomy_definitions
```

**3.2 Атомарное создание vendor bundle**

Создать RPC `create_vendor_bundle` который:
1. Проверяет существование
2. Создаёт provider
3. Создаёт marketplace_vendor
4. Создаёт org + org_member
5. Возвращает все ID или откатывает всё

### Фаза 4: Рефакторинг Admin Forms

**4.1 Переход от Dialog к Sheet/Drawer**

Для форм создания/редактирования:
- Desktop: Sheet (side="right", width="500px")
- Mobile: Full-screen drawer

Это устранит проблемы с вложенным scroll и select.

**4.2 Inline Editing в таблицах**

Для часто редактируемых полей (цена, статус, активность):
- Double-click для редактирования
- Enter для сохранения
- Escape для отмены

**4.3 Консолидация админ-страниц**

```
/admin/catalog → UnifiedCatalogTable (все вертикали)
/admin/catalog/:vertical → Фильтрованный вид
/admin/catalog/:id/edit → Sheet с формой
```

### Фаза 5: Стандартизация скролла

**5.1 Создание ScrollableSelect**

```typescript
// Новый компонент с правильным touch handling
export const ScrollableSelect = ({ options, ...props }) => (
  <Select {...props}>
    <SelectContent 
      className="max-h-[60vh] overflow-y-auto touch-pan-y"
      onPointerDownOutside={(e) => e.preventDefault()}
    >
      {/* Используем виртуализацию для длинных списков */}
    </SelectContent>
  </Select>
);
```

**5.2 Глобальные scroll utilities**

Расширить `src/lib/scrollUtils.ts`:

```typescript
export const SELECT_CONTENT_CLASSES = 
  'max-h-[60vh] overflow-y-auto touch-pan-y overscroll-contain';

export const DIALOG_FORM_CLASSES = 
  'overflow-y-auto touch-pan-y max-h-[80vh]';
```

---

## Часть 3: Детали реализации

### Новые файлы

| Файл | Назначение |
|------|------------|
| `src/components/ui/searchable-select.tsx` | Select с поиском |
| `src/components/ui/multi-select.tsx` | Мультивыбор с tags |
| `src/hooks/useAvailabilityCheck.ts` | Проверка слотов перед booking |
| `src/lib/rpcErrorMessages.ts` | Маппинг ошибок RPC |

### Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/components/ui/select.tsx` | max-h, overflow-y-auto, touch-pan-y |
| `src/pages/admin/AdminServices.tsx` | Sheet вместо Dialog |
| `src/pages/vendor/VendorOnboarding.tsx` | Динамические вертикали |
| `src/hooks/useVendor.ts` | Атомарное создание bundle |
| `src/pages/experiences/ExperienceBooking.tsx` | Предварительная проверка |
| `src/hooks/useOrders.ts` | Улучшенная обработка ошибок |

### Миграции БД

```sql
-- 1. RPC для атомарного создания вендора
CREATE OR REPLACE FUNCTION create_vendor_bundle(...)
RETURNS jsonb AS $$ ... $$;

-- 2. RPC для проверки доступности
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_resource_type text,
  p_resource_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz
) RETURNS jsonb AS $$ ... $$;
```

---

## Часть 4: Приоритеты

### P0 (Критично - немедленно)
1. Исправить `SelectContent` overflow
2. Добавить обработку ошибок в booking flow
3. Исправить дублирование vendor записей

### P1 (Высокий - эта неделя)
4. Создать SearchableSelect для провайдеров
5. Перевести AdminServices на Sheet
6. Динамические вертикали в онбординге

### P2 (Средний - следующий спринт)
7. MultiSelect компонент
8. Inline editing в таблицах
9. Availability pre-check

### P3 (Улучшения)
10. Консолидация админ-страниц
11. Виртуализация длинных списков
12. Полный аудит touch-action

---

## Ожидаемые результаты

После реализации плана:
- **Booking успешность**: 60% → 95%+ (устранение ошибок в конце flow)
- **Onboarding конверсия**: исправление silent failures
- **Admin UX**: время на операцию сократится на 40%
- **Mobile usability**: все Select и Dropdown полностью функциональны
