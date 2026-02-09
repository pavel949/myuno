
# Аудит дизайна Home-экрана: проблемы и решения

## Общая оценка

Home-экран сейчас выглядит как набор блоков с разным "весом" — некоторые слишком бледные и теряются, а иерархия внимания не ведёт взгляд. Основные проблемы: низкий контраст в light mode, монотонная цветовая палитра и отсутствие визуальных акцентов.

---

## Проблема 1: Бледный Quick Access Strip

**Что не так:** `bg-primary/10` (золотой на 10% прозрачности) на белом фоне практически не виден. Pill-кнопки сливаются с фоном.

**Решение:**
- Увеличить фон до `bg-primary/15` и бордер до `border-primary/25`
- Текст сделать `font-semibold` для лучшей читаемости

**Файл:** `src/components/home/QuickAccessStrip.tsx`

---

## Проблема 2: Иконки Popular Services слишком тусклые

**Что не так:** Иконки `text-muted-foreground` на фоне `bg-muted/50` дают минимальный контраст. Подписи `text-[11px] text-muted-foreground` плохо читаются.

**Решение:**
- Каждой категории назначить свой мягкий цвет фона (teal, coral, purple и т.д.) вместо одинакового серого
- Подписи: увеличить до `text-xs` и `text-foreground/70`
- Иконки: убрать `text-muted-foreground`, дать конкретные цвета

**Файл:** `src/components/home/PopularServicesRow.tsx`

---

## Проблема 3: Trust Banner без визуального веса

**Что не так:** Числа `text-base font-bold` и подписи `text-[11px] text-muted-foreground` на `bg-muted/30` — весь блок выглядит как пустое место.

**Решение:**
- Числа: увеличить до `text-lg font-bold`
- Фон: `bg-muted/50` для большей заметности
- Иконки: дать им `text-primary` вместо `text-muted-foreground`

**Файл:** `src/components/home/TrustBanner.tsx`

---

## Проблема 4: Concierge Banner — слабый CTA

**Что не так:** Баннер использует стандартную Card без выделения. Зелёная кнопка маленькая и теряется.

**Решение:**
- Фон: добавить лёгкий зелёный градиент `bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30`
- Бордер: `border-green-200 dark:border-green-800/40`
- Кнопка: увеличить `size="default"`

**Файл:** `src/components/home/ConciergeBanner.tsx`

---

## Проблема 5: Глобальный `--muted-foreground` слишком бледный

**Что не так:** В light mode `--muted-foreground: 220 10% 38%` — это ~38% lightness, что на белом фоне даёт слабый контраст (WCAG AA не проходит для мелкого текста).

**Решение:**
- Изменить на `220 10% 32%` — более тёмный серый, лучше читается

**Файл:** `src/index.css`, строка 77

---

## Проблема 6: Подзаголовок Hero слишком мелкий

**Что не так:** "Все решения в одном приложении" — `text-[13px] text-muted-foreground` практически не читается.

**Решение:**
- Увеличить до `text-sm` и убрать отрицательный margin `-mt-1.5`

**Файл:** `src/components/home/HeroBlock.tsx`

---

## Проблема 7: LifeSituation карточки — бледный бордер

**Что не так:** `border-border/60` на белом фоне почти невидим. Карточки выглядят "плавающими".

**Решение:**
- Бордер: `border-border` (полная непрозрачность)
- Добавить `shadow-sm` для лёгкой глубины

**Файл:** `src/components/home/LifeSituationSelector.tsx`

---

## Сводка изменений

| Файл | Изменения |
|------|-----------|
| `src/index.css` | `--muted-foreground` lightness 38% -> 32% |
| `src/components/home/HeroBlock.tsx` | Подзаголовок text-sm, убрать -mt-1.5 |
| `src/components/home/QuickAccessStrip.tsx` | bg-primary/15, border-primary/25, font-semibold |
| `src/components/home/ConciergeBanner.tsx` | Зелёный градиентный фон, больше кнопка |
| `src/components/home/PopularServicesRow.tsx` | Индивидуальные цвета иконок, text-xs подписи |
| `src/components/home/TrustBanner.tsx` | Крупнее числа, primary иконки, bg-muted/50 |
| `src/components/home/LifeSituationSelector.tsx` | border-border + shadow-sm |

## Что НЕ меняется

- Структура и порядок блоков
- Роуты и навигация
- Dark mode (там контраст в порядке)
- Шрифты и типографика
- База данных
