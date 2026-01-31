
# Анализ хардкода в платформе myUNO

## Краткое резюме

Проведён глубокий анализ кодовой базы для выявления хардкода (жёстко закодированных значений). Найдено **3 категории проблем**:

---

## 1. Проблема: Кнопка "Скачать" не меняет язык

### Где найдено
| Файл | Строка | Проблема |
|------|--------|----------|
| `src/components/pwa/InstallBanner.tsx` | 97, 114 | Текст `"Установить приложение"` и `"Скачать"` — только на русском |

### Причина
В компоненте `InstallBanner.tsx` тексты захардкожены на русском языке:
```text
Line 97: "Установить приложение"
Line 114: 'Скачать'
```
Компонент **не использует** `useLanguage()` для переключения языка.

### Решение
Добавить объект переводов и использовать `language` из контекста (по аналогии с `DownloadAppButton.tsx`):
```typescript
const texts = {
  en: { install: "Install app", download: "Download" },
  ru: { install: "Установить приложение", download: "Скачать" }
};
const t = texts[language] || texts.en;
```

**Безопасность исправления**: ✅ Полностью безопасно — изолированный компонент

---

## 2. Проблема: Хардкод валюты (฿ / THB)

### Статистика
- **83+ файла** содержат жёстко закодированную валюту
- **957+ строк** с паттерном `currency.*THB` или `sourceCurrency`

### Типы хардкода

#### A. Символ валюты в UI компонентах (13 файлов)
| Файл | Пример |
|------|--------|
| `LegalServicesIndex.tsx` | `currency="฿"` |
| `BabysitterIndex.tsx` | `currency="฿"` |
| `DeliveryCheckout.tsx` | `currency="฿"` |
| `TransportIndex.tsx` | `currency="฿"` |
| `ToursIndex.tsx` | `currency="฿"` |
| `PetsIndex.tsx` | `currency="฿"` |
| `WaterActivitiesIndex.tsx` | `currency="฿"` |
| `CleaningIndex.tsx` | `currency="฿"` |
| `EducationIndex.tsx` | `currency="฿"` |
| `EventsIndex.tsx` | `currency="฿"` |
| `MedicalIndex.tsx` | `currency="฿"` |
| `TableReservation.tsx` | `currency="฿"` |
| `SetMenuBooking.tsx` | `currency="฿"` |

#### B. Логика конвертации внутри компонентов (4 файла)
| Файл | Строка | Проблема |
|------|--------|----------|
| `BookingParticipants.tsx` | 27 | Ручная конвертация: `currency === 'THB' ? '฿' : ...` |
| `BookingBottomBar.tsx` | 22 | Ручная конвертация вместо `useCurrency()` |
| `FinancialCharts.tsx` | 116 | `formatCurrency = (value) => '฿${value}'` |
| `MarketCheckout.tsx` | 129-130 | `฿0`, `฿{threshold}` — прямой хардкод |

#### C. Данные для отображения (информационные страницы)
| Файл | Пример |
|------|--------|
| `VisaImmigrationPage.tsx` | Стоимость виз: `฿1,900`, `฿2,000`, `฿600,000` |
| `VendorDemo.tsx` | Демо-данные: `฿128,450` |

### Решение

**Этап 1 — Исправление UI компонентов** (безопасно):
Заменить `currency="฿"` на использование `useCurrency()`:
```typescript
const { currencyInfo, formatPrice } = useCurrency();
// Вместо currency="฿"
<Component currency={currencyInfo.symbol} />
// Или использовать formatPrice(priceInTHB) напрямую
```

**Этап 2 — Исправление внутренней логики**:
В компонентах типа `BookingParticipants.tsx` удалить ручную конвертацию:
```typescript
// Было
const currencySymbol = currency === 'THB' ? '฿' : currency === 'USD' ? '$' : ...;
// Станет
const { currencyInfo } = useCurrency();
const currencySymbol = currencyInfo.symbol;
```

**Этап 3 — Информационные данные** (требует обсуждения):
Визовые сборы — это реальные цены в THB, их можно оставить как есть или добавить пометку "(в тайских батах)".

**Безопасность исправления**:
- ✅ Этап 1, 2 — безопасно, если использовать существующий `CurrencyContext`
- ⚠️ Этап 3 — требует решения: конвертировать или оставить как справочные данные

---

## 3. Прочий хардкод текстов

### Статистика
- **138 файлов** содержат inline-тексты RU/EN
- Большинство используют паттерн `isRu ? 'Текст RU' : 'Text EN'`

### Оценка
Это **допустимый подход**, но не масштабируемый:
- Уже существует система переводов через `t()` и `LanguageContext`
- Около **35 файлов** активно используют `t('key')` 
- Остальные используют inline-переводы

### Рекомендация
Постепенная миграция на `t()` при рефакторинге каждого компонента. Не критично для немедленного исправления.

---

## Сводная таблица приоритетов

| Приоритет | Проблема | Файлов | Безопасность | Сложность |
|-----------|----------|--------|--------------|-----------|
| 🔴 Высокий | InstallBanner.tsx — язык | 1 | ✅ Безопасно | Низкая |
| 🟠 Средний | `currency="฿"` в Index-страницах | 13 | ✅ Безопасно | Средняя |
| 🟠 Средний | Ручная конвертация валюты | 4 | ✅ Безопасно | Средняя |
| 🟡 Низкий | Inline RU/EN переводы | 100+ | ✅ Безопасно | Высокая |
| ⚪ Справочные данные | Visa costs, demo | 2 | N/A | — |

---

## Технический план исправления

### Фаза 1: Критические исправления (быстрые)

1. **InstallBanner.tsx** — добавить `useLanguage()` и объект переводов
2. **BookingParticipants.tsx** — заменить ручную конвертацию на `useCurrency()`
3. **BookingBottomBar.tsx** — использовать `currencyInfo.symbol`

### Фаза 2: UI-компоненты с `currency="฿"` (13 файлов)

Для каждого файла:
- Импортировать `useCurrency`
- Заменить `currency="฿"` на `currency={currencyInfo.symbol}`
- Если нужна полная конвертация — использовать `formatPrice()`

Список файлов:
```text
- LegalServicesIndex.tsx
- BabysitterIndex.tsx
- DeliveryCheckout.tsx
- TransportIndex.tsx
- ToursIndex.tsx
- PetsIndex.tsx
- WaterActivitiesIndex.tsx
- CleaningIndex.tsx
- EducationIndex.tsx
- EventsIndex.tsx
- MedicalIndex.tsx
- TableReservation.tsx
- SetMenuBooking.tsx
```

### Фаза 3: Финансовые графики

- **FinancialCharts.tsx** — интегрировать `useCurrency()` для форматирования в тултипах

---

## Итого

| Метрика | Значение |
|---------|----------|
| Всего проблемных файлов | ~20 |
| Критичных (ломают UX) | 1 |
| Средних (валюта) | 17 |
| Низких (inline-тексты) | 100+ (не срочно) |
| Безопасно исправить сейчас | ✅ Все 18 файлов |
