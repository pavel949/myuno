
# Аудит мобильной адаптивности платформы

## Обзор проблемы

Данные «обрезаются» или не умещаются на мобильных экранах (320px–390px) из-за нескольких системных причин в архитектуре CSS.

---

## Выявленные проблемы

### P0 — Критические (блокируют контент)

| # | Проблема | Файлы | Описание |
|---|----------|-------|----------|
| 1 | **Двойной scroll-контейнер** | `PropertyManage.tsx:407-412` | `overflow-auto` на `main` + вложенный `ScrollArea` создают конфликт жестов прокрутки на iOS/Android |
| 2 | **`overflow-x-hidden` скрывает контент** | `AppLayout.tsx:31`, `index.css:30-35` | Широкие элементы (таблицы, карточки) обрезаются без возможности прокрутки |
| 3 | **Фиксированные ширины > viewport** | `CompetitorSlide.tsx:46` — `min-w-[700px]`, `PortfolioSection.tsx:107,114` — `w-[280px]` | На экране 320px карточки/таблицы выходят за границы |
| 4 | **Перегруженный header** | `AppHeader.tsx:79-105`, `OwnerHeader.tsx:143-164` | 6-7 элементов в ряд (язык, валюта, тема, уведомления, роль) не умещаются на 375px |

### P1 — Средние (ухудшают UX)

| # | Проблема | Файлы | Описание |
|---|----------|-------|----------|
| 5 | **Негибкие grid-cols** | Многие формы и секции | `grid-cols-2` или `grid-cols-3` без `xs:grid-cols-1` на узких экранах |
| 6 | **Длинные заголовки без truncate** | `PropertyManage.tsx:369`, `UnifiedHeader.tsx:70` | Русский текст длиннее английского, переполняет строку |
| 7 | **Карусели с фиксированной шириной** | `ServiceProviderCard.tsx:134` — `w-[260px]` | На узком экране видна только 1 карточка с обрезанным краем |

---

## План исправлений

### Фаза 1: Архитектура прокрутки (P0)

**1.1 PropertyManage.tsx** — убрать двойной scroll:
```tsx
// Было (строки 407-412):
<main className="flex-1 overflow-auto pb-20 md:pb-6">
  <ScrollArea className="h-[calc(100vh-56px)]">
    <div className="p-4 md:p-6 max-w-4xl">

// Станет:
<main className="flex-1 overflow-y-auto pb-20 md:pb-6">
  <div className="p-4 md:p-6 max-w-4xl mx-auto">
```

**1.2 index.css** — разрешить горизонтальный scroll для таблиц:
```css
/* Было: */
html, body { overflow-x: hidden; }

/* Добавить класс для таблиц: */
.table-scroll-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

### Фаза 2: Фиксированные ширины (P0)

**2.1 PortfolioSection.tsx** — адаптивные карточки:
```tsx
// Было (строки 107, 114):
<div className="w-[280px] flex-shrink-0">

// Станет:
<div className="w-[85vw] max-w-[280px] flex-shrink-0">
```

**2.2 CompetitorSlide.tsx** — обёртка для таблицы:
```tsx
// Строка 44-46:
<motion.div className="overflow-x-auto -mx-4 px-4 pb-4">
  <table className="w-full min-w-[600px]">
```

### Фаза 3: Оптимизация Header (P1)

**3.1 AppHeader.tsx** — группировка на мобильных:
```tsx
// Скрыть второстепенные на mobile:
<div className="hidden sm:flex items-center gap-0.5">
  <CurrencySwitcher size="sm" />
  <ThemeSwitcher size="sm" />
</div>
// Оставить только: Language, Cart, Notifications, Avatar
```

**3.2 OwnerHeader.tsx** — аналогично скрыть Currency, Theme в sidebar

### Фаза 4: Grid-адаптивность (P1)

**Паттерн для всех grid-секций:**
```tsx
// Было:
<div className="grid grid-cols-2 gap-3">

// Станет:
<div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
```

Применить к файлам:
- `PropertyManagePricingSection.tsx`
- `PropertyManageRulesSection.tsx`  
- `ListingSection.tsx`
- Все формы с полями в 2 колонки

---

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/pages/owner/PropertyManage.tsx` | Убрать двойной ScrollArea |
| `src/index.css` | Добавить `.table-scroll-container` |
| `src/components/layout/AppHeader.tsx` | Скрыть переключатели на mobile |
| `src/components/owner/OwnerHeader.tsx` | Скрыть переключатели на mobile |
| `src/components/owner/dashboard/PortfolioSection.tsx` | Адаптивная ширина карточек |
| `src/components/pitch/slides/CompetitorSlide.tsx` | Scroll-обёртка для таблицы |
| 10+ form-секций | `grid-cols-1 xs:grid-cols-2` |

---

## Ожидаемый результат

| До | После |
|----|-------|
| Контент обрезается справа | Полная видимость или горизонтальный scroll |
| Невозможно прокрутить таблицы | Нативный touch-scroll для таблиц |
| Header элементы наслаиваются | Чистый header с 4 иконками |
| Формы сжаты на 320px | 1 колонка на узких экранах |

---

## Техническое резюме

**Корневые причины:**
1. `overflow-x: hidden` на `html/body` — «заплатка» вместо решения
2. Двойные scroll-контейнеры — конфликт touch-событий
3. `w-[Npx]` без `max-w` или `vw` единиц
4. Отсутствие `xs:` breakpoint в grid-классах

**Приоритет:** Фазы 1-2 (P0) решают 80% проблем с обрезанием данных.
