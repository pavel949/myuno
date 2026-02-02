
# Фаза 3: UX-улучшения финансов

## Обзор улучшений

Фаза 3 сосредоточена на улучшении пользовательского опыта при работе с расходами и чеками:

| Улучшение | Описание | Приоритет |
|-----------|----------|-----------|
| Drag & Drop | Перетаскивание чеков для загрузки | Высокий |
| Автозаполнение | Подсказки на основе истории расходов | Высокий |
| Голосовой ввод | Диктовка описания расхода | Средний |

---

## 1. Drag & Drop для чеков

### Что будет реализовано

- Зона перетаскивания файлов с визуальной обратной связью
- Поддержка на мобильных (касание для выбора остаётся)
- Визуальный индикатор при наведении файла
- Обработка невалидных файлов

### Компонент: DragDropReceiptUpload

```
┌─────────────────────────────────────┐
│                                     │
│   ┌─────────────────────────────┐   │
│   │   ╭───────────────────────╮ │   │
│   │   │  📷 Перетащите чек    │ │   │
│   │   │   или нажмите для     │ │   │
│   │   │       загрузки        │ │   │
│   │   ╰───────────────────────╯ │   │
│   └─────────────────────────────┘   │
│                                     │
│   При перетаскивании:               │
│   ┌─────────────────────────────┐   │
│   │  ● ● ● ● ● ● ● ● ● ● ● ●  │   │
│   │       Отпустите файл       │   │
│   │  ● ● ● ● ● ● ● ● ● ● ● ●  │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 2. Автозаполнение на основе истории

### Что будет реализовано

- Хук для получения недавних вендоров
- Хук для популярных категорий пользователя  
- Комбобокс с подсказками для поля "Vendor"
- Быстрые кнопки недавних категорий

### Хук: useExpenseAutocomplete

```typescript
// Возвращает:
{
  recentVendors: ['7-Eleven', 'Big C', 'Makro', ...],
  frequentCategories: ['cleaning', 'utilities', 'supplies'],
  suggestVendor: (input: string) => string[],
  suggestCategory: (vendor: string) => string | null
}
```

### UI: Поле с подсказками

```
┌─────────────────────────────────────┐
│ Поставщик                           │
│ ┌─────────────────────────────────┐ │
│ │ 7-El...                     │ ▼ │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 7-Eleven              (5 раз) │ │ │
│ │ 7-Eleven Rawai        (3 раз) │ │ │
│ │ 7-Eleven Chalong      (2 раз) │ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 3. Голосовой ввод описания

### Что будет реализовано

- Кнопка микрофона рядом с полем описания
- Использование Web Speech API
- Поддержка русского и английского языков
- Fallback для неподдерживаемых браузеров

### UI: Поле с микрофоном

```
┌─────────────────────────────────────┐
│ Что купили?                         │
│ ┌───────────────────────────────┬─┐ │
│ │ Средства для уборки...        │🎤│ │
│ └───────────────────────────────┴─┘ │
│                                     │
│ При записи:                         │
│ ┌───────────────────────────────┬─┐ │
│ │ Моющее средство для пола      │🔴│ │
│ └───────────────────────────────┴─┘ │
│         🔊 Говорите...              │
└─────────────────────────────────────┘
```

---

## План реализации

### Шаг 1: Drag & Drop компонент

**Файл:** `src/components/upload/DragDropReceiptUpload.tsx`

Функции:
- `onDragEnter`, `onDragOver`, `onDragLeave`, `onDrop` хендлеры
- Визуальный стейт `isDragging`
- Валидация типа файла
- Интеграция с существующим `uploadFile` из DocumentUpload
- Пульсирующая анимация зоны при перетаскивании

### Шаг 2: Хук автозаполнения

**Файл:** `src/hooks/useExpenseAutocomplete.ts`

Логика:
- Запрос последних 50 транзакций пользователя
- Извлечение уникальных vendor_name с подсчётом частоты
- Группировка по категориям для vendor → category маппинга
- Fuzzy-поиск для подсказок

### Шаг 3: VendorCombobox компонент

**Файл:** `src/components/owner/expense/VendorCombobox.tsx`

Использует `cmdk` (уже установлен) для:
- Поиск с подсказками
- Показ частоты использования
- Автовыбор категории при выборе вендора

### Шаг 4: VoiceInput компонент

**Файл:** `src/components/ui/voice-input.tsx`

Функции:
- Проверка поддержки `webkitSpeechRecognition` / `SpeechRecognition`
- Выбор языка на основе текущей локали
- Визуальный индикатор записи
- Кнопка остановки

### Шаг 5: Интеграция в QuickExpense

Обновить `QuickExpense.tsx`:
- Заменить DocumentUpload на DragDropReceiptUpload
- Добавить VendorCombobox для поля вендора
- Добавить VoiceInput к полю описания

---

## Технические детали

### DragDropReceiptUpload (ключевой код)

```typescript
const [isDragging, setIsDragging] = useState(false);

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);
  const file = e.dataTransfer.files[0];
  if (file) uploadFile(file);
};
```

### useExpenseAutocomplete (ключевой код)

```typescript
const { data: transactions } = useQuery({
  queryKey: ['expense-autocomplete', user?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('property_financials')
      .select('vendor_name, category')
      .eq('owner_id', user.id)
      .eq('transaction_type', 'expense')
      .order('created_at', { ascending: false })
      .limit(100);
    return data;
  }
});

const recentVendors = useMemo(() => {
  // Группировка и подсчёт частоты
  const vendorCounts = new Map<string, number>();
  transactions?.forEach(t => {
    if (t.vendor_name) {
      vendorCounts.set(t.vendor_name, 
        (vendorCounts.get(t.vendor_name) || 0) + 1);
    }
  });
  return [...vendorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}, [transactions]);
```

### VoiceInput (ключевой код)

```typescript
const SpeechRecognition = window.SpeechRecognition || 
                          window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.lang = language === 'ru' ? 'ru-RU' : 'en-US';
recognition.continuous = false;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  onTranscript(transcript);
};
```

---

## Новые файлы

```
src/components/upload/
└── DragDropReceiptUpload.tsx    # Drag & Drop зона

src/hooks/
└── useExpenseAutocomplete.ts    # Автозаполнение

src/components/owner/expense/
├── VendorCombobox.tsx           # Комбобокс поставщика
└── index.ts

src/components/ui/
└── voice-input.tsx              # Голосовой ввод
```

---

## Итог

После реализации Фазы 3:

| Метрика | До | После |
|---------|-----|-------|
| Время ввода расхода | ~60 сек | ~20 сек |
| Количество нажатий | 8-10 | 3-5 |
| Удобство на мобильном | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

Это завершит полный цикл улучшений модуля управления недвижимостью.
