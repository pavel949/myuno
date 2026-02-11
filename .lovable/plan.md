

# Desktop UX/UI Normalization — Full Audit & Fix Plan

## Выявленные проблемы

### 1. Header отсутствует на 20+ страницах
Большинство mini-app страниц (Experiences, Transport, Yachts, Beauty, Medical, Insurance, Cleaning, Events, Education, Flowers, Pets, Legal, Fitness, Pharmacy, Market, Property Search и др.) используют `showHeader={false}`, заменяя глобальный AppHeader на локальный CatalogHeader. На мобильном это работает, но на десктопе пользователь теряет глобальную навигацию, поиск и утилиты (язык, валюта, корзина, профиль).

### 2. Footer отсутствует почти везде
Только Index и PropertyIndex передают `showFooter`. Остальные 20+ страниц не имеют футера вообще — на десктопе это создает ощущение незавершенности.

### 3. Контрастность текста
- `--muted-foreground` в light mode: `220 10% 46%` — это серый ~46% lightness на почти белом фоне (~98% lightness). Разница всего ~52%, что ниже рекомендуемого WCAG AA для мелкого текста.
- Много текста использует `text-muted-foreground` для важной информации (subtitles, labels, descriptions).
- В dark mode: `220 6% 56%` — тоже слабый контраст на фоне `220 12% 6%`.

### 4. Элементы домашней страницы на десктопе
- Emergency cards слишком мелкие (w-7 h-7 icons, text-[11px])
- SmartWidget нагружен деталями, но визуально тесный
- Секции выглядят разрозненно без визуальной иерархии

## План исправлений

### Фаза 1: Header и Footer на всех страницах (глобально)

**Файл: `src/components/layout/AppLayout.tsx`**

Изменить дефолт `showFooter` с `false` на `true` для десктопа. На десктопе (lg+) footer всегда рендерится. Также на десктопе всегда показывать AppHeader, даже когда `showHeader={false}` — mini-app CatalogHeader будет рендериться ПОД ним.

Логика:
- Добавить `useIsDesktop()` хук
- На десктопе: AppHeader рендерится ВСЕГДА, Footer рендерится ВСЕГДА
- На мобильном: поведение не меняется (showHeader/showFooter работают как раньше)
- CatalogHeader на десктопе теряет BackButton (навигация уже в AppHeader), но сохраняет заголовок и фильтры

**Файл: `src/components/shared/CatalogHeader.tsx`**

На десктопе (lg+): скрыть BackButton, убрать `sticky top-0` (т.к. AppHeader уже sticky), добавить отступ сверху. Заголовок и категории остаются.

### Фаза 2: Контрастность текста

**Файл: `src/index.css`**

Light mode:
- `--muted-foreground`: с `220 10% 46%` на `220 12% 38%` — темнее на 8 пунктов, проходит WCAG AA
- `--border`: с `40 10% 88%` на `40 10% 82%` — чуть заметнее для разделителей

Dark mode:
- `--muted-foreground`: с `220 6% 56%` на `220 8% 64%` — светлее, лучше читается на темном фоне
- `--border`: с `220 8% 18%` на `220 8% 22%` — чуть заметнее

### Фаза 3: Нормализация десктопных элементов Home

**Файл: `src/components/home/EmergencyQuickAccess.tsx`**
- На десктопе: увеличить иконки (lg:w-10 lg:h-10), текст (lg:text-sm), padding (lg:p-4)
- Добавить hover-эффекты для десктопа

**Файл: `src/components/home/SmartWidget.tsx`**
- На десктопе: увеличить padding (lg:p-4), размер шрифтов (lg:text-base для temp, lg:text-sm для labels)

**Файл: `src/components/home/QuickActionsGrid.tsx`**
- Убрать обрезанный вид на 8 элементах — на десктопе все элементы равномерно распределены
- Увеличить label до lg:text-sm

**Файл: `src/components/home/HomeExploreSections.tsx`**
- Увеличить gap между фото-карточками (lg:gap-5)
- Добавить hover-scale для карточек

**Файл: `src/components/layout/CompactFooter.tsx`**
- На десктопе: горизонтальная раскладка (соц.ссылки | навигация | копирайт в одну строку)
- Убрать `pb-20` (bottom nav padding) на десктопе — уже есть `md:pb-0`

### Фаза 4: Типографика десктопа

**Файл: `src/index.css`**
- h1 на десктопе: `lg:text-3xl` (уже есть в md:text-3xl)
- Body text: убедиться, что `text-sm` масштабируется до `lg:text-base` в основных блоках

## Затрагиваемые файлы

| Файл | Изменение |
|------|-----------|
| `src/components/layout/AppLayout.tsx` | Desktop: всегда рендерить header + footer |
| `src/components/shared/CatalogHeader.tsx` | Desktop: убрать sticky/BackButton, стать sub-header |
| `src/index.css` | Контрастность: muted-foreground, border |
| `src/components/home/EmergencyQuickAccess.tsx` | Desktop: увеличить элементы |
| `src/components/home/SmartWidget.tsx` | Desktop: увеличить spacing |
| `src/components/home/QuickActionsGrid.tsx` | Desktop: нормализовать ribbon |
| `src/components/home/HomeExploreSections.tsx` | Desktop: увеличить gap, hover |
| `src/components/layout/CompactFooter.tsx` | Desktop: горизонтальный layout |

## Не затрагивается

- Мобильная версия — все через `lg:` breakpoints
- Backend / данные — только UI
- Дизайн-токены бренда — соблюдаются (цвета primary остаются)

