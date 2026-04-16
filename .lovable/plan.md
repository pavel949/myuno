

# Полная реализация исправлений системы отчётности + проверка билда

## Выявленные проблемы (из предыдущего аудита)

1. **Транзакции в PDF обрезаются до 20** — `.slice(0, 20)` в `generateReportPdf.ts:463`
2. **Дата в футере PDF захардкожена на `ru-RU`** — даже для английских отчётов (строка 715)
3. **`formatDate` захардкожена на `ru-RU`** — строка 191, не учитывает `language`
4. **Батч-генерация идёт последовательно** — `ReportsPage.tsx:252` использует `for...of` вместо параллельного запуска
5. **`owner_net_income` не вычитает комиссию УК** — строка 397 в `usePropertyReports.ts` считает `income.total - expenses.total`, но не вычитает `mgmtCommission`
6. **ResizeObserver ошибка** — безвредная, но нужно подавить

## План изменений

### 1. `src/utils/generateReportPdf.ts`
- **Убрать `.slice(0, 20)`** на строке 463 — показывать все транзакции расходов, добавляя страницы по необходимости через autoTable (он автоматически переносит на новую страницу)
- **Исправить `formatDate`** — принимать `language` параметр, использовать `en-GB` для английского
- **Исправить дату в футере** — строка 715: использовать `language === 'ru' ? 'ru-RU' : 'en-GB'`

### 2. `src/hooks/usePropertyReports.ts`
- **Строка 397**: изменить `owner_net_income` на `income.total - expenses.total - mgmtCommission`
- **Строка 408**: `owner_payout` уже правильно рассчитывается

### 3. `src/pages/owner/ReportsPage.tsx`
- **Батч-генерация (строки 251-263)**: заменить `for...of` на `Promise.allSettled` для параллельной генерации (ограничить до 5 параллельных)

### 4. Подавление ResizeObserver
- В `src/lib/errorHandler.ts` или глобально: игнорировать `ResizeObserver loop` ошибки (стандартная практика)

## Файлы для изменения
1. `src/utils/generateReportPdf.ts` — 3 правки
2. `src/hooks/usePropertyReports.ts` — 1 правка
3. `src/pages/owner/ReportsPage.tsx` — 1 правка
4. `src/lib/errorHandler.ts` — подавление ResizeObserver

## Результат
- PDF отчёты показывают все транзакции без обрезки
- Даты в PDF корректно локализуются
- Комиссия УК правильно вычитается из дохода собственника
- Батч-генерация отчётов работает в 3-5x быстрее
- Нет спама ResizeObserver в консоли

