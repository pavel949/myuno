# myUNO · Visual Design System v1.0
## Канонический документ дизайн-системы

> **Статус:** эталонный. Источник истины для всех визуальных решений в продукте — UI, лендинги, email, документы, презентации, партнёрские материалы.
>
> **Назначение.** Один файл, в который заглядывает любой дизайнер, разработчик или AI-агент (Lovable, Cursor, v0) и получает полный ответ: какой цвет, какой шрифт, какой отступ, какой компонент. Без импровизации.
>
> **Философия дизайна.** myUNO выглядит как цифровая инфраструктура государственного класса с человеческим лицом. Эталоны: GOV.UK (структура), e-Estonia (цифровая компетентность), The Economist (точность), Apple support docs (забота без снисхождения). **Не Booking, не Airbnb, не крипто-проект, не тайский туристический лендинг.**

---

## 1 · Три дизайн-принципа

Всё в этой системе выводится из трёх принципов. Когда встаёт вопрос «как оформить это?» — сверься с ними.

### 1.1 · Информация важнее украшения

Каждый пиксель должен обслуживать информацию, которую несёт экран. Если декоративный элемент не помогает понять или действовать — его нет. Никаких стоковых иллюстраций, градиентных фонов, glassmorphism, parallax-эффектов, скевоморфизма, «живых» фонов с частицами.

### 1.2 · Структура важнее свободы

myUNO выглядит как **спроектированный документ**, а не как «лента впечатлений». Чёткая сетка. Выраженные границы блоков. Предсказуемые отступы. Типографская иерархия, а не визуальные «вау». Это роднит нас с Bloomberg Terminal, Financial Times, Apple Developer Documentation. И отличает от стартаперских лендингов.

### 1.3 · Цвет — сигнал, а не украшение

Основная масса интерфейса — **почти монохромная** (чёрный текст на кремовом фоне, серые границы). Цвет появляется только когда нужно что-то **обозначить**: категорию услуги, приоритет, статус, действие. Если на экране три основных цвета — это ошибка.

---

## 2 · Цветовая система

### 2.1 · Основные бренд-цвета (brand colors)

Три цвета формируют визуальную подпись бренда. Они используются редко, сильно и только по назначению.

| Токен | HEX | RGB | Tailwind | Назначение |
|---|---|---|---|---|
| `brand-navy` | `#0A2240` | `10 34 64` | `bg-[#0A2240]` | Авторитет · primary CTA · footer · заголовки экранов sections |
| `brand-orange` | `#D96B1A` | `217 107 26` | `bg-[#D96B1A]` | Человечность · акцент · активный элемент · emergency hover |
| `brand-cream` | `#F7F5F1` | `247 245 241` | `bg-[#F7F5F1]` | Нейтральный фон страниц · не использовать белый |

**Правило использования.**
- `navy` покрывает не больше **10% площади экрана** (блоки, CTA, графика).
- `orange` покрывает не больше **3% площади экрана** (акценты, подчёркивания, одиночные кнопки).
- `cream` — почти всегда фон страницы.

### 2.2 · Расширенная палитра navy (для глубины и иерархии)

| Токен | HEX | Когда использовать |
|---|---|---|
| `navy-900` | `#051428` | Hover / pressed state для navy CTA, deep backgrounds |
| `navy-800` | `#0A2240` | **= brand-navy** — основной navy |
| `navy-700` | `#1B4F8A` | Вторичный navy (ссылки, outline кнопки) |
| `navy-500` | `#2B6CB0` | Информационные плашки, акценты |
| `navy-100` | `#EBF4FF` | Фон для info-блоков, подсветка hover |
| `navy-50` | `#F4F8FD` | Самый светлый tint |

### 2.3 · Расширенная палитра orange

| Токен | HEX | Когда использовать |
|---|---|---|
| `orange-700` | `#AE5013` | Hover / pressed для orange кнопки |
| `orange-600` | `#D96B1A` | **= brand-orange** |
| `orange-400` | `#F59E5A` | Осветлённый акцент |
| `orange-100` | `#FEF3EA` | Фон для акцент-блоков |

### 2.4 · Нейтральная шкала (stone) — основа интерфейса

Nine steps. Всё серое и чёрное в интерфейсе — отсюда. **Не используй произвольные hex.**

| Токен | HEX | Tailwind | Назначение |
|---|---|---|---|
| `ink` | `#1C1917` | `text-stone-900` | Основной текст, иконки |
| `text-primary` | `#292524` | `text-stone-800` | Альтернатива ink, секундарный заголовок |
| `text-body` | `#44403C` | `text-stone-700` | Body text, длинное чтение |
| `text-muted` | `#78716C` | `text-stone-500` | Вторичный текст, метаданные, caption |
| `text-subtle` | `#A8A29E` | `text-stone-400` | Плейсхолдеры, labels, иконки decorative |
| `border-strong` | `#E7E5E4` | `border-stone-200` | Основные границы карточек и таблиц |
| `border-subtle` | `#F5F5F4` | `border-stone-100` | Тонкие границы внутри таблиц |
| `surface-raised` | `#FAFAF9` | `bg-stone-50` | Фон для hover state, selected state, читаемых блоков |
| `surface-white` | `#FFFFFF` | `bg-white` | Фон карточек (поверх cream) |

### 2.5 · Семантические цвета (system)

Используются только когда нужно **обозначить статус или тип действия**. Не для декора.

| Токен | HEX | Название | Использование |
|---|---|---|---|
| `success` | `#166534` | green-800 | Подтверждение, завершённое действие, positive metric |
| `success-bg` | `#DCFCE7` | green-100 | Фон для success-плашки |
| `warning` | `#92400E` | amber-800 | Предупреждение, дедлайн приближается |
| `warning-bg` | `#FEF3C7` | amber-100 | Фон для warning |
| `danger` | `#991B1B` | red-800 | Emergency (SOS), критическая ошибка, deprecation |
| `danger-bg` | `#FEE2E2` | red-100 | Фон для danger |
| `info` | `#1B4F8A` | navy-700 | Нейтральная информация |
| `info-bg` | `#EBF4FF` | navy-100 | Фон для info |

### 2.6 · Цвета категорий каталога

Каждая из **16 категорий** имеет свой цвет — строго. Менять нельзя. Используется для: плашек, иконок категорий, акцент-линий в карточках, border-левых внутри секций.

| # | Категория | Цвет (HEX) |
|---|---|---|
| 01 | Emergency | `#DC2626` |
| 02 | Home & Living | `#92400E` |
| 03 | Food & Entertainment | `#9D174D` |
| 04 | Health & Wellness | `#065F46` |
| 05 | Family & Kids | `#1E40AF` |
| 06 | Transport | `#1E3A8A` |
| 07 | Business & Legal | `#4C1D95` |
| 08 | Finance | `#0F4C81` |
| 09 | Tourism & Activities | `#0F766E` |
| 10 | Real Estate | `#7C3AED` |
| 11 | Pet Services | `#C2410C` |
| 12 | Wedding & Events | `#BE185D` |
| 13 | Halal & Faith | `#047857` |
| 14 | Sports & Training | `#991B1B` |
| 15 | Community & Social | `#6D28D9` |
| 16 | Partner Portal | `#1F2937` |

### 2.7 · Запрещённые цвета и приёмы

Никогда в интерфейсе myUNO:
- Ярко-зелёный «успех» в стиле Robinhood (`#00D672`)
- Неон / «crypto-цвета» (розово-фиолетовые градиенты, cyan)
- Градиенты вообще, кроме редких заглавных блоков (и только navy → navy-deep)
- Прозрачные blur-фоны поверх картинок (glassmorphism)
- «Rainbow» фоны, dot patterns под заголовками
- Любые цвета за пределами этой палитры

---

## 3 · Типографика

### 3.1 · Две системы шрифтов — по языку

**Русская кириллица:**
- Заголовки — **Unbounded** (весы 400, 500, 600)
- Body — **Golos Text** (весы 400, 500)

**Латиница и международные языки (EN, DE, CN, и т.д.):**
- Заголовки — **Noto Serif** (весы 400, 600, 700)
- Body — **Noto Sans** (весы 300, 400, 500, 600, 700)

**Числа, деньги, коды, технические значения:**
- Везде — **JetBrains Mono** (весы 400, 500). tabular-nums.

### 3.2 · Подключение шрифтов

Google Fonts URL (единый):
```
https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600&family=Golos+Text:wght@400;500&family=Noto+Serif:wght@400;600;700&family=Noto+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap
```

CSS font-family fallback stacks:
```css
--font-heading-ru: 'Unbounded', 'Noto Serif', Georgia, serif;
--font-body-ru: 'Golos Text', 'Noto Sans', system-ui, sans-serif;
--font-heading-en: 'Noto Serif', Georgia, serif;
--font-body-en: 'Noto Sans', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

### 3.3 · Типографическая шкала

Единая шкала. Все размеры берутся отсюда — не придумывай свои.

| Токен | Size | Line-height | Weight | Использование |
|---|---|---|---|---|
| `display` | 48px (3rem) | 1.1 | 400 | Hero на главной, очень редко |
| `h1` | 36px (2.25rem) | 1.2 | 400 | Заголовок страницы |
| `h2` | 28px (1.75rem) | 1.25 | 400 | Раздел страницы |
| `h3` | 22px (1.375rem) | 1.3 | 500 | Под-раздел, заголовок карточки |
| `h4` | 18px (1.125rem) | 1.4 | 500 | Блок внутри карточки |
| `body-lg` | 17px | 1.6 | 400 | Lead paragraph, intro |
| `body` | 15px | 1.7 | 400 | Основной текст |
| `body-sm` | 13px | 1.6 | 400 | Вторичный текст, описания |
| `caption` | 11px | 1.5 | 500 | Metadata, timestamps, footer |
| `label` | 10px | 1.4 | 600 | Labels с letter-spacing 0.25em uppercase |
| `mono` | 12px | 1.5 | 500 | JetBrains Mono для чисел и кодов |

### 3.4 · Правила использования

**Weight.** Заголовки почти всегда weight 400 (regular) или 500 (medium). Никогда 700 или 800 для display — это даст слишком агрессивный вид. Жирность создаётся размером, не весом.

**Letter-spacing.**
- Display и h1 — `-0.01em` (чуть плотнее)
- Body — `0` (нейтральное)
- Labels и caps — `0.1em` до `0.3em` (вразрядку)

**Line-height.**
- Заголовки — 1.1–1.3 (плотные)
- Body — 1.6–1.75 (просторные)

**Italic.** Разрешён только в:
- Цитатах и pullquotes
- Латинских scientific terms (*in lieu of*)
- Авторских подписях под блоками

**Uppercase.** Только для labels, tabs, section headers. Всегда с letter-spacing ≥ 0.15em.

### 3.5 · Текстовые цвета

Ранжирование важности:

| Роль | Цвет | Вес |
|---|---|---|
| Primary heading | `ink` (#1C1917) | 400–500 |
| Secondary heading | `text-primary` (#292524) | 500 |
| Body | `text-body` (#44403C) | 400 |
| Metadata | `text-muted` (#78716C) | 400 |
| Subtle (placeholders) | `text-subtle` (#A8A29E) | 400 |
| Links | `navy-700` (#1B4F8A) + underline on hover | 500 |
| Emphasis (редко) | `ink` bold | 600 |

**Не используй** цветной текст для эмоции (красный для ошибки — OK, синий для «важного» — нет). Цвет — только для статуса.

---

## 4 · Spacing (система отступов)

Единая шкала на base-4. Все отступы — **кратны 4px**.

| Токен | px | rem | Tailwind |
|---|---|---|---|
| `space-0` | 0 | 0 | `0` |
| `space-1` | 4 | 0.25 | `1` |
| `space-2` | 8 | 0.5 | `2` |
| `space-3` | 12 | 0.75 | `3` |
| `space-4` | 16 | 1 | `4` |
| `space-5` | 20 | 1.25 | `5` |
| `space-6` | 24 | 1.5 | `6` |
| `space-8` | 32 | 2 | `8` |
| `space-10` | 40 | 2.5 | `10` |
| `space-12` | 48 | 3 | `12` |
| `space-16` | 64 | 4 | `16` |
| `space-20` | 80 | 5 | `20` |
| `space-24` | 96 | 6 | `24` |

**Правила применения:**

- **Внутри компонента** (Button, Card): `space-2`, `space-3`, `space-4`
- **Между связанными блоками:** `space-6`, `space-8`
- **Между секциями страницы:** `space-12`, `space-16`
- **Крупные разделы:** `space-20`, `space-24`

**Правило вертикального ритма:** отступ **сверху** у заголовка должен быть вдвое больше отступа **снизу**. Это создаёт группировку.

---

## 5 · Radius (скругление углов)

**myUNO почти не использует скругление.** Это часть визуального языка — документная строгость, не soft-UI.

| Токен | px | Tailwind | Использование |
|---|---|---|---|
| `radius-none` | 0 | `rounded-none` | **Дефолт для большинства** — кнопки, карточки, inputs, плашки |
| `radius-sm` | 2 | `rounded-sm` | Мелкие бейджи, category chips |
| `radius-md` | 4 | Не использовать | — |
| `radius-full` | 9999 | `rounded-full` | Аватары, круглые иконки, статусные точки |

**Ключевое правило.** Скругление радиуса 8–16px — **запрещено**. Это визуальный язык Airbnb и SaaS-стартапов, не myUNO.

---

## 6 · Shadow (тени)

Тени используются **крайне сдержанно**. Основной инструмент разделения блоков — **бордер**, не тень.

| Токен | CSS | Использование |
|---|---|---|
| `shadow-none` | — | Дефолт — большинство компонентов |
| `shadow-xs` | `0 1px 2px rgba(28, 25, 23, 0.04)` | Тонкие карточки, floating labels |
| `shadow-sm` | `0 2px 6px rgba(28, 25, 23, 0.06)` | Dropdown меню, popovers |
| `shadow-md` | `0 8px 20px rgba(28, 25, 23, 0.08)` | Модальные окна, sticky элементы |
| `shadow-lg` | Не использовать | — |

**Запрещены:** неоновые тени, цветные тени, inset shadows, несколько слоёв теней.

---

## 7 · Сетка и адаптив

### 7.1 · Breakpoints

Mobile-first. Все базовые стили — для 375px.

| Breakpoint | Width | Использование |
|---|---|---|
| `sm` | 640px | Большие смартфоны |
| `md` | 768px | Планшеты portrait |
| `lg` | 1024px | Планшеты landscape, small desktop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

### 7.2 · Container

Максимальная ширина контента:

| Тип страницы | Max-width | Horizontal padding |
|---|---|---|
| Лендинг | `1280px` | 24px mobile → 40px desktop |
| Документ / статья | `720px` | 20px → 32px |
| Dashboard | `1400px` | 16px → 40px |
| Форма / регистрация | `480px` | 20px → 32px |

### 7.3 · Grid

12-колоночная сетка для lg+, gap 24px. На mobile — стек (одна колонка). На md — обычно 2 колонки.

**Типовые layouts:**
- `1 / 12` — full-bleed блок
- `2 / 10` — хедеры, центрированный контент
- `4 / 8` — узкий контент (документ, FAQ)
- `1 / 4 + 5 / 12` — sidebar + content (каталог услуг)
- `1 / 6 + 7 / 12` — equal columns (two-up cards)

### 7.4 · Правила mobile

На 375px все эти вещи должны работать:
- Один CTA на экран (не два рядом)
- Sticky bottom CTA разрешён на формах и lending конверсии
- Минимальный touch-target — 44×44px
- Нет горизонтального скролла
- Font-size не меньше 14px для body

---

## 8 · Компоненты

### 8.1 · Button

Четыре варианта. Больше не добавлять.

**Primary (navy)**
```
bg: #0A2240  |  text: #FFFFFF  |  border: none
hover: bg #051428
disabled: bg #A8A29E (stone-400), text #FFFFFF, cursor-not-allowed
padding: 12px 24px  |  font: body 15px  |  weight: 500
radius: 0
```
Использование: главный CTA на экране. **Не больше одного на экран.**

**Secondary (outline)**
```
bg: transparent  |  text: #0A2240  |  border: 1.5px solid #0A2240
hover: bg #F4F8FD (navy-50)
padding: 12px 24px  |  font: body 15px  |  weight: 500
radius: 0
```
Использование: альтернативное действие рядом с primary.

**Ghost**
```
bg: transparent  |  text: #44403C  |  border: none
hover: bg #FAFAF9 (stone-50)
padding: 8px 16px  |  font: body 14px  |  weight: 400
```
Использование: nav-кнопки, actions в таблицах.

**Destructive (для отмены, удаления)**
```
bg: transparent  |  text: #991B1B  |  border: 1px solid #991B1B
hover: bg #FEE2E2 (red-100)
padding: 12px 24px
```

### 8.2 · Input / Form field

```
height: 44px  (mobile-friendly touch)
bg: #FFFFFF
border: 1.5px solid #E7E5E4 (border-strong)
padding: 0 14px
font: body 15px, text #1C1917
placeholder: text #A8A29E

Focus:
  border: 1.5px solid #0A2240
  outline: 2px solid #EBF4FF (navy-100, 2px offset)

Error:
  border: 1.5px solid #991B1B
  error message: text #991B1B, 12px, margin-top 4px

Disabled:
  bg: #F5F5F4
  text: #A8A29E
  cursor: not-allowed

Label (выше input):
  font: 12px, weight 500, color #44403C
  margin-bottom: 6px

Helper text (ниже input):
  font: 11px, color #78716C, margin-top 4px
```

### 8.3 · Card

Базовая карточка:

```
bg: #FFFFFF
border: 1px solid #E7E5E4
radius: 0  (да, без скругления)
padding: 20px 24px  (mobile: 16px 20px)
shadow: none
```

Карточка с цветом категории (для каталога услуг):

```
border-left: 3px solid [категория-цвет]
остальное — как базовая
```

Активная / hovered карточка:

```
border: 2px solid #0A2240  (вместо 1px)
bg: #FAFAF9 (stone-50)
```

### 8.4 · Badge / Chip

Три варианта по смыслу:

**Category badge** (принадлежность к категории):
```
bg: [категория-цвет] + 12% alpha
text: [категория-цвет]
padding: 4px 10px
font: 11px weight 500
radius: 0
```

**Status badge** (success / warning / danger / info):
```
bg: [status-bg]
text: [status]
padding: 3px 8px
font: 10px weight 600 uppercase letter-spacing 0.08em
```

**Metadata tag** (lifecycle, role):
```
bg: #E7E5E4 (border-strong)
text: #44403C
padding: 2px 6px
font: 9px monospace
```

### 8.5 · Table

```
Header row:
  bg: #FAFAF9
  border-bottom: 2px solid #1C1917
  padding: 12px 16px
  font: label 10px weight 600 uppercase letter-spacing 0.1em
  color: #78716C

Body row:
  bg: #FFFFFF
  border-bottom: 1px solid #F5F5F4
  padding: 14px 16px
  font: body-sm 13px

Hover:
  bg: #FAFAF9

Numbers / currency:
  font: JetBrains Mono, tabular-nums
  align: right
```

### 8.6 · Section header

Используется для разделов внутри страницы:

```
Uppercase label:
  font: 10px weight 600 letter-spacing 0.3em
  color: #A8A29E
  margin-bottom: 8px

H2 heading:
  font: 28px weight 400
  color: #1C1917
  margin-bottom: 16px

Subtitle (опционально):
  font: 17px weight 400
  color: #78716C
  max-width: 600px
```

### 8.7 · Empty state

```
Container:
  padding: 48px 24px
  text-align: center
  bg: #FAFAF9
  border: 1px dashed #E7E5E4

Icon:
  size: 32px
  color: #A8A29E

Heading:
  font: h4 18px weight 500
  color: #44403C
  margin-top: 16px

Description:
  font: body-sm 13px
  color: #78716C
  margin-top: 8px
  max-width: 360px

CTA (опционально):
  Ghost button, margin-top 20px
```

Примеры текстов — см. `03-tone-of-voice.md` раздел 7.3.

### 8.8 · Toast / Notification

```
Position: bottom-right (desktop) / bottom-center (mobile)
Max-width: 400px
bg: #FFFFFF
border-left: 3px solid [status color]
border: 1px solid #E7E5E4
shadow: shadow-md
padding: 14px 18px
radius: 0

Title:
  font: 14px weight 500, color #1C1917

Description:
  font: 12px weight 400, color #78716C
  margin-top: 4px

Duration: 5 seconds default, dismissible
Animation: slide in from edge, 200ms ease
```

### 8.9 · Modal / Dialog

```
Backdrop:
  bg: rgba(28, 25, 23, 0.4)
  backdrop-filter: none (никакого blur)

Container:
  bg: #FFFFFF
  max-width: 520px
  radius: 0
  shadow: shadow-md
  padding: 32px

Header:
  font: h3 22px weight 500
  border-bottom: 1px solid #F5F5F4
  padding-bottom: 16px

Body:
  font: body 15px
  padding: 20px 0

Footer:
  border-top: 1px solid #F5F5F4
  padding-top: 20px
  display: flex, gap 12px, justify-content: flex-end

На mobile: full-width, без max-width, border-radius 0
```

### 8.10 · SOS button (специальный)

```
Position: fixed, bottom-right (mobile: bottom-center)
Size: 56×56px
Shape: circle (radius-full)
bg: #DC2626 (danger)
text/icon: #FFFFFF
shadow: shadow-md
z-index: 9999

Icon: AlertTriangle from Lucide, 24px

Hover:
  bg: #991B1B (danger-hover)
  scale: 1.05

Touch-target: минимум 44×44 — но здесь 56×56 для заметности

Label on hover (desktop):
  бейдж слева с текстом "SOS" + 11px uppercase
```

Это единственный компонент, который **всегда** показывается поверх всего. Никогда не скрывается, не уходит за меню.

---

## 8a · Логотип

Логотип myUNO — **единственный декоративный элемент**, которому позволено существовать в интерфейсе без функциональной нагрузки. Поэтому к нему предъявлены жёсткие требования: ничего лишнего, никакой импровизации, никаких альтернативных версий, кроме описанных здесь.

### 8a.1 · Два знака — wordmark и symbol

| Знак | Что это | Когда использовать |
|---|---|---|
| **Wordmark** `myUNO` | Полное написание: `my` строчными в Unbounded Regular + `UNO` капителью в Unbounded SemiBold с трекингом `0.08em` | Лендинги, header desktop ≥1024px, документы, email signature, презентации, договоры |
| **Symbol** `U` | Глиф U из Unbounded SemiBold, центрированный в квадратном canvas | Favicon, app icon, share-thumbnails, avatar fallback, watermark, контексты ≤32px высоты |

**Правило переключения.** В макете, где высота логотипа меньше 24px **или** ширина контейнера меньше 120px — используется symbol. Никогда не сжимать wordmark до нечитаемого размера.

### 8a.2 · Цветовые варианты

Только **три** тональности. Никаких других цветов в логотипе — никогда.

| Тон | Применение | Fill | Background (если на цветной поверхности) |
|---|---|---|---|
| **Navy** (primary) | Дефолт: на cream и белом фоне | `#0A2240` | — |
| **Cream** (reverse) | На navy / тёмных surfaces / фото с overlay 40%+ | `#F7F5F1` | — |
| **Ink mono** | Чёрно-белая печать, факс, гос-документы | `#1C1917` | — |

**`brand-orange` в логотипе НЕ используется.** Это нарушит правило 2.1 (orange ≤ 3% площади, зарезервирован под акцент действия).

### 8a.3 · Clear space (зона тишины)

Минимальная свободная область вокруг знака — **высота буквы `U`** (или, для wordmark, высота cap-line) со всех четырёх сторон. Это пространство нельзя занимать ничем — ни текстом, ни иконками, ни рамкой, ни фоновым изображением.

```
┌─────────────────────────┐
│   [U]                   │  ← H = высота U
│   [U] myUNO         [U] │
│       [U]               │  ← H снизу
└─────────────────────────┘
```

### 8a.4 · Минимальные размеры

| Знак | Минимум на экране | Минимум в печати |
|---|---|---|
| Wordmark | высота 16px (≈ ширина 64px) | 8mm высота |
| Symbol | 16×16px | 5×5mm |

Ниже минимума — знак становится нечитаемым и **запрещён** к использованию.

### 8a.5 · Запрещено (категорически)

- Растягивать, наклонять, поворачивать, искажать пропорции
- Перекрашивать в `brand-orange`, в категорийные цвета каталога, в неон
- Добавлять обводку, тень, glow, gradient fill
- Размещать на градиентной или хаотичной фотоподложке без overlay 40%
- Ставить рядом с tagline в шрифте, отличном от Unbounded / Noto Serif
- Использовать растровую версию там, где доступен SVG
- Вводить «декоративные» вариации к праздникам (никаких snowflake-логотипов на Новый год)
- Сочетать с другими лого партнёров без вертикальной разделительной линии в `border-strong` и одинаковой оптической высоты

### 8a.6 · Файлы и где они лежат

Источник истины — SVG в `/public/brand/`. Растры (PNG/WebP/ICO) генерируются из них и **не редактируются вручную** — ре-генерация через `/tmp/myuno-brand/build_svg.py` + `/tmp/myuno-brand/build_rasters.sh`.

| Файл | Назначение |
|---|---|
| `/public/brand/logo-wordmark-{navy,cream,mono}.svg` | Wordmark, три тона |
| `/public/brand/logo-symbol-{navy,cream,mono}.svg` | Symbol, три тона |
| `/public/brand/logo-symbol-on-{navy,cream}.svg` | Symbol с готовой подложкой |
| `/public/brand/logo-symbol-maskable.svg` | Maskable вариант для Android PWA (60% safe zone) |
| `/public/favicon.svg`, `/public/favicon.ico` | Favicon (multi-resolution ICO: 16/32/48/64) |
| `/public/icons/icon-{72,120,152,180,192,512}x{...}.png` | PWA app icons |
| `/public/icons/apple-touch-180.png` | iOS apple-touch-icon (без альфы) |
| `/public/og-image.png`, `/public/og-image-dark.png` | Open Graph 1200×630 |
| `/mnt/documents/myuno-logo-kit/` | Полный downloadable kit для партнёров: 60+ файлов |

### 8a.7 · React-компонент

В коде **никогда не вставляй `<img>` или inline SVG** для логотипа. Используй единый компонент:

```tsx
import { Logo, LogoBadge } from "@/components/brand";

// Wordmark в header
<Logo size={28} />

// Symbol в footer на тёмном фоне
<Logo variant="symbol" tone="cream" size={20} />

// Брендированная плитка (квадратный значок)
<LogoBadge size={40} />
```

Это гарантирует, что любая будущая замена знака произойдёт в одной точке — не нужно искать `<img src="logo.svg">` по 1000+ компонентов.

---

## 9 · Иконки

### 9.1 · Библиотека

**Lucide React** — единственная разрешённая библиотека иконок. Никаких emoji-иконок в UI, никаких FontAwesome, никаких Heroicons одновременно с Lucide.

```tsx
import { AlertTriangle, Home, Plane, ... } from "lucide-react";
```

### 9.2 · Размеры

| Размер | px | Использование |
|---|---|---|
| `icon-xs` | 12 | Inline метки, badges |
| `icon-sm` | 14 | Кнопки, menu items |
| `icon-md` | 16 | Section headers, cards |
| `icon-lg` | 20 | Empty states, large cards |
| `icon-xl` | 24 | Emergency, hero blocks |
| `icon-2xl` | 32 | Feature illustrations |

### 9.3 · Цвет иконок

- В навигации и кнопках — берут цвет родительского текста (`currentColor`)
- В категориях — цвет категории
- Decorative — `text-subtle` (#A8A29E)
- **Никогда** не красить иконки в `orange` для декора

### 9.4 · Stroke weight

Везде **1.5px stroke** (Lucide дефолт). Не менять на 2px или 1px.

### 9.5 · Emoji как исключение

Emoji используются **только** как маркеры категорий в каталоге услуг (🆘 Emergency, 🏡 Real Estate и т.д.), где они несут смысл. В обычном UI, кнопках, сообщениях — **запрещены**. См. `03-tone-of-voice.md` раздел 5.6.

---

## 10 · Motion / анимации

### 10.1 · Принцип

Анимация должна **служить пониманию** — показать, что элемент появился, исчез, изменил состояние. Анимация для «красоты» запрещена.

### 10.2 · Duration

| Скорость | ms | Использование |
|---|---|---|
| Instant | 0–50 | Hover state изменения цвета |
| Fast | 100–150 | Toggle, dropdown open |
| Normal | 200 | Modal, toast, menu |
| Slow | 300 | Page transitions |

**Больше 300ms — запрещено.** Пользователь ждёт.

### 10.3 · Easing

Только три:
- `ease` (cubic-bezier(0.25, 0.1, 0.25, 1)) — дефолт для большинства
- `ease-out` (cubic-bezier(0, 0, 0.2, 1)) — для появления
- `linear` — только для индикаторов прогресса

Никаких `bounce`, `elastic`, кастомных bezier.

### 10.4 · Запрещённые анимации

- Parallax scroll
- Skew / rotate transitions (кроме малых индикаторов 180°)
- Scale больше 1.05
- Auto-play карусели
- Typing animations в заголовках
- Анимация текста по буквам (text reveal)

---

## 11 · Data visualisation

### 11.1 · Графики

Основной инструмент — **Recharts** (см. стек PROJECT_v2.2).

**Цветовая схема для графиков:**
- Основная серия — `navy-800` (#0A2240)
- Вторая серия — `orange-600` (#D96B1A)
- Третья серия — `navy-500` (#2B6CB0)
- Четвёртая — `amber-800` (#92400E)
- Grid lines — `border-subtle` (#F5F5F4)
- Axis labels — `text-muted` (#78716C), font-size 11px

### 11.2 · Правила

- **Никаких 3D-графиков.** Никогда.
- **Никакой красоты без данных.** Нет данных — нет графика, а empty state.
- Шрифт в графиках — **JetBrains Mono** для чисел, sans-serif для labels.
- Tooltip — белый фон, 1px border, shadow-sm, 13px body.
- Legend всегда внизу или справа, никогда сверху.
- Decimal places — минимально необходимое. Не «23.00%», а «23%».

### 11.3 · Таблицы с цифрами

```
Column alignment:
  - Текст — left
  - Числа, деньги, проценты — right
  - Дата — right (чтобы выровнялась)

Font:
  - Числа — JetBrains Mono, tabular-nums
  - Текст — body

Форматирование:
  - Валюта: 15 500 THB  (пробел разделитель, не запятая)
  - Проценты: 12.5%
  - Даты: 22.04.2026  (DD.MM.YYYY для RU) / Apr 22, 2026 (для EN)
```

---

## 12 · Фотография и изображения

### 12.1 · Когда использовать фото

- Объекты недвижимости (обязательно, это продукт)
- Хедер лендинга персоны (иногда)
- Портрет автора в статье Knowledge Hub (иногда)

### 12.2 · Когда НЕ использовать фото

- Стоковые фотографии счастливых людей с компьютерами — **никогда**
- Декоративные hero-картинки — **никогда**
- Иллюстрации — **никогда** (только если это функциональная диаграмма)
- Фото пляжей как фон — **никогда**

### 12.3 · Обработка

- Объекты недвижимости — натуральная обработка, без искажений, ровный горизонт
- Без драматических закатов и HDR
- Без чёрно-белой обработки
- Без фильтров инстаграмной стилистики

### 12.4 · Соотношения сторон

- Hero cover: 16:9
- Карточка недвижимости: 4:3
- Thumbnail: 1:1
- Портрет (автор): 1:1 circle

### 12.5 · Lazy loading и оптимизация

- Все изображения — WebP или AVIF
- Lazy loading по умолчанию
- Alt text обязателен, без «картинка» или «photo» — описание сути
- Для hero — preload

---

## 13 · Dark mode

### Статус: **не поддерживается в v1**

Причина: myUNO — инфраструктурный продукт, который чаще всего используется в светлое время (планирование сделок, оформление документов, административные действия). Dark mode удваивает объём дизайн-системы без ясной выгоды для нашей аудитории.

**Это может измениться**, когда у нас будет отдельный продукт для HNW-инвесторов с dashboard-использованием ночью. До тех пор — только light mode.

---

## 14 · Accessibility (доступность)

Не опционально — часть стандарта.

### 14.1 · Контраст

Цветовые пары должны проходить **WCAG AA**:
- Body text на cream (`#44403C` on `#F7F5F1`) — 9.5:1 ✓
- Muted text на cream (`#78716C` on `#F7F5F1`) — 4.8:1 ✓
- Primary button — `#FFFFFF` on `#0A2240` — 14.3:1 ✓

**Не разрешённые пары:**
- Orange (`#D96B1A`) text on cream — недостаточный контраст, **только как background или большой hero**
- Light grey (`#A8A29E`) text — только для placeholder, не для контента

### 14.2 · Touch targets

Минимум **44×44px** для всех интерактивных элементов на mobile.

### 14.3 · Focus states

Все интерактивные элементы имеют видимый focus:
```
outline: 2px solid #0A2240
outline-offset: 2px
```

Никогда не `outline: none` без замены.

### 14.4 · Текст

- Минимум 14px для body на mobile
- Минимум 12px для secondary text
- Line-height минимум 1.5 для длинного текста

### 14.5 · Скрин-ридеры

- Все изображения — `alt`
- Все иконки-кнопки — `aria-label`
- Формы — связаны `<label for>`
- Модалки — trap focus, return focus on close

---

## 15 · CSS переменные (готовый файл для проекта)

Положить в `/packages/shared/styles/tokens.css`:

```css
:root {
  /* Brand */
  --brand-navy: #0A2240;
  --brand-orange: #D96B1A;
  --brand-cream: #F7F5F1;

  /* Navy scale */
  --navy-900: #051428;
  --navy-800: #0A2240;
  --navy-700: #1B4F8A;
  --navy-500: #2B6CB0;
  --navy-100: #EBF4FF;
  --navy-50: #F4F8FD;

  /* Orange scale */
  --orange-700: #AE5013;
  --orange-600: #D96B1A;
  --orange-400: #F59E5A;
  --orange-100: #FEF3EA;

  /* Neutrals (stone) */
  --ink: #1C1917;
  --text-primary: #292524;
  --text-body: #44403C;
  --text-muted: #78716C;
  --text-subtle: #A8A29E;
  --border-strong: #E7E5E4;
  --border-subtle: #F5F5F4;
  --surface-raised: #FAFAF9;
  --surface-white: #FFFFFF;

  /* Semantic */
  --success: #166534;
  --success-bg: #DCFCE7;
  --warning: #92400E;
  --warning-bg: #FEF3C7;
  --danger: #991B1B;
  --danger-bg: #FEE2E2;
  --info: #1B4F8A;
  --info-bg: #EBF4FF;

  /* Spacing (base-4) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Typography */
  --font-heading-ru: 'Unbounded', 'Noto Serif', Georgia, serif;
  --font-body-ru: 'Golos Text', 'Noto Sans', system-ui, sans-serif;
  --font-heading-en: 'Noto Serif', Georgia, serif;
  --font-body-en: 'Noto Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(28, 25, 23, 0.04);
  --shadow-sm: 0 2px 6px rgba(28, 25, 23, 0.06);
  --shadow-md: 0 8px 20px rgba(28, 25, 23, 0.08);

  /* Radius (почти никогда) */
  --radius-none: 0;
  --radius-sm: 2px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 100ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

## 16 · Tailwind config (extend)

Положить в `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0A2240',
          orange: '#D96B1A',
          cream: '#F7F5F1',
        },
        navy: {
          50: '#F4F8FD',
          100: '#EBF4FF',
          500: '#2B6CB0',
          700: '#1B4F8A',
          800: '#0A2240',
          900: '#051428',
        },
        orange: {
          100: '#FEF3EA',
          400: '#F59E5A',
          600: '#D96B1A',
          700: '#AE5013',
        },
      },
      fontFamily: {
        'heading-ru': ['Unbounded', 'Noto Serif', 'Georgia', 'serif'],
        'body-ru': ['Golos Text', 'Noto Sans', 'system-ui', 'sans-serif'],
        'heading-en': ['Noto Serif', 'Georgia', 'serif'],
        'body-en': ['Noto Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        none: '0',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(28, 25, 23, 0.04)',
        sm: '0 2px 6px rgba(28, 25, 23, 0.06)',
        md: '0 8px 20px rgba(28, 25, 23, 0.08)',
      },
    },
  },
};

export default config;
```

---

## 17 · Чек-лист для любого нового экрана

Перед тем как закоммитить новый UI, пройдись по этому списку:

**Цвет**
- [ ] Использованы только цвета из палитры (разделы 2.1–2.6)
- [ ] На экране не больше трёх цветов одновременно (brand + один категориальный + нейтрали)
- [ ] Orange используется точечно (<3% площади)

**Типографика**
- [ ] Шрифт по языку выбран правильно (RU — Unbounded/Golos, EN — Noto)
- [ ] Размеры из типошкалы (раздел 3.3), никаких произвольных
- [ ] Числа в JetBrains Mono

**Spacing и layout**
- [ ] Отступы кратны 4 (раздел 4)
- [ ] Работает на 375px без горизонтального скролла
- [ ] Touch targets ≥ 44×44 на mobile
- [ ] Один primary CTA на экран

**Компоненты**
- [ ] Используются компоненты из раздела 8, не кастомные
- [ ] Radius=0 везде, кроме аватаров
- [ ] Shadow нигде не используется декоративно

**Анимация**
- [ ] Нет анимаций дольше 300ms
- [ ] Нет parallax, нет auto-play
- [ ] Нет «вау»-эффектов

**Доступность**
- [ ] Контраст проверен (WCAG AA)
- [ ] Focus states видны
- [ ] Иконки-кнопки имеют aria-label
- [ ] Alt text у всех изображений

**Tone of voice**
- [ ] Тексты прошли чек-лист из `03-tone-of-voice.md` раздел 14
- [ ] Нет восклицаний, нет «лучший», нет эмодзи в декоре
- [ ] CTA описывает действие, не «узнать больше»

---

## 18 · Промпт для Lovable / v0 / Cursor

Когда даёшь AI-агенту задачу создать новый экран или компонент, прикрепи этот документ и используй шаблон:

```
Создай [экран / компонент / лендинг] для myUNO.

КОНТЕКСТ. Дизайн-система — в прикреплённом /docs/canonical/05-visual-design-system.md.
Ты ОБЯЗАН следовать:
- Цветовой палитре (только из раздела 2, никаких произвольных)
- Типошкале (раздел 3.3)
- Spacing на base-4 (раздел 4)
- Radius = 0 везде (раздел 5)
- Компонентам из раздела 8 (Button, Input, Card и т.д.)

ФИЛОСОФИЯ. myUNO выглядит как цифровая инфраструктура государственного класса:
GOV.UK + e-Estonia + The Economist. НЕ как Airbnb, НЕ как крипто-стартап.
Монохромный интерфейс (чёрный на кремовом, navy для авторитета, orange точечно).

ЧТО НЕ ДЕЛАТЬ.
— Никаких градиентов (кроме редкого navy → navy-deep в hero)
— Никаких скруглений > 2px
— Никаких теней для декора
— Никаких стоковых иллюстраций и фото счастливых людей
— Никаких эмодзи в UI (только как маркеры категорий в каталоге)
— Никаких анимаций дольше 300ms

TONE OF VOICE. Тексты строго по /docs/canonical/03-tone-of-voice.md:
без "лучший/уникальный/революционный", без восклицаний, конкретные цифры и сроки.

СТЕК. React + Tailwind CSS + shadcn/ui + Lucide icons.

ПЕРЕД КОДОМ опиши в комментарии:
1. Какой это экран и для какой персоны (P1-P25, см. 01-segmentation-framework.md)
2. Какие компоненты из раздела 8 используешь
3. Какие цвета из палитры
4. Mobile-first или desktop-first

Только после этого — код.
```

---

## 19 · Эволюция системы

Эта система — **v1.0**. Она фиксирует текущее состояние. Она будет развиваться.

**Правила эволюции:**
1. Новый компонент — только через PR в `/docs/canonical/05-visual-design-system.md`
2. Новый цвет — только через обоснование: почему существующие не подходят
3. Новый шрифт — требует одобрения Павла
4. Все изменения — с записью в CHANGELOG

**Review cycle:** раз в квартал Павел или дизайнер проходит документ и фиксирует устаревшее.

---

*Документ живой. Обновляется при каждом принятом решении. Owner: Pavel / CTO.*
*Связанные документы: `01-segmentation-framework.md` · `02-service-catalogue.md` · `03-tone-of-voice.md`.*
