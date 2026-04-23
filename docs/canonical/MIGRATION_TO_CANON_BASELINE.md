# Migration to Canonical Design System — Baseline

> **Дата:** 2026-04-23
> **Версия приложения до миграции:** 3.43.0
> **Канонический документ:** [`05-visual-design-system.md`](./05-visual-design-system.md) v1.0
> **Инициатор:** Pavel Ignatev
> **Статус:** Phase 1 in progress

---

## Зачем этот файл

Это **фиксация точки** перед началом большой визуальной миграции. Если что-то пойдёт не так — этот файл объясняет, к чему откатываться и как.

Параллельно с ним каждый шаг миграции записан как Lovable checkpoint и доступен через **History** (кнопка над чатом).

---

## Контекст

До миграции в проекте сосуществовали **три параллельные дизайн-системы**:

1. **Super-App Dark Theme** (фактический дефолт) — навигация: `#08101E` фон, `#00D68F` mint primary, glassmorphism, `rounded-xl`. Описана в `mem://style/super-app-visual-identity` и `mem://style/design-system-ds2-standards`.
2. **Dark Luxury Editorial** — Newbuilds (`/newbuilds`): `#0F0F0F` + золото `#C9A84C` + Playfair Display. В `src/styles/newbuilds-theme.css`.
3. **Vercel-минимализм** — WelcomeLanding (`/index`), inline-токены, hairline-сетка.

**Канон** (`05-visual-design-system.md`) описывает **четвёртую систему** — «GOV.UK / e-Estonia»: cream `#F7F5F1` + navy `#0A2240` + orange `#D96B1A`, шрифты Unbounded/Golos Text (RU) + Noto Serif/Noto Sans (EN), `rounded-none` по дефолту.

Решение от 2026-04-23: **привести весь код к канону** (Путь A). Поэтапно, 4 фазы.

---

## Решения, зафиксированные перед стартом

| Вопрос | Решение |
|---|---|
| Dark mode | Удаляется как дефолт. Остаётся опцией для `/admin` и `/mc` (navy-инверсия, без mint, без glassmorphism). |
| Newbuilds (Playfair + золото) | Унифицируется с каноном. Файл `newbuilds-theme.css` удаляется. |
| Радиусы | 0px по канону везде. Допускаются `rounded-sm` (2px) для chips и `rounded-full` для аватаров. |
| Темп миграции | 4 фазы с review checkpoint между ними. |

---

## Фазы миграции

| Фаза | Содержание | Длительность |
|---|---|---|
| **1. Фундамент** | tokens.css, tailwind.config.ts, index.html (шрифты), themeSwitch | 1-2 дня |
| **2. Внешний контур** | WelcomeLanding, Property, Invest, Newbuilds, ds-компоненты | 3-5 дней |
| **3. Внутренний app** | Home, CRM, MC, Bookings, Auth, Admin (~80 экранов) | 1-2 недели |
| **4. Финал** | Радиусы 0px, ESLint правила, чистка memory | 3-5 дней |

---

## Файлы, которые меняет Фаза 1

- `src/styles/tokens.css` — полная перезапись на каноническую палитру
- `tailwind.config.ts` — новые шрифты, type-scale, удаление mint/gold/glass токенов
- `index.html` — Google Fonts URL заменён на канонический набор; критический inline CSS перенастроен на cream/navy
- `src/index.css` — добавлен глобальный язык-зависимый `font-family`
- `src/lib/themeSwitch.ts` — light как дефолт
- `src/contexts/ThemeContext.tsx` — light как дефолт, dark только в admin/MC контекстах

## Файлы, которые удаляет Фаза 2

- `src/styles/newbuilds-theme.css` — после миграции `/newbuilds` на канон

---

## Как откатить полностью

**Способ 1 — через UI Lovable (рекомендуется):**
1. Открыть **History** (кнопка над чатом)
2. Найти точку «До Фазы 1 миграции к канону» (от 2026-04-23)
3. Revert

**Способ 2 — через chat:**
Найти AI-сообщение перед началом миграции и нажать кнопку Revert под ним.

После отката этот файл будет удалён вместе с остальными изменениями миграции.

---

## Snapshot ключевых токенов «до миграции»

### tokens.css (light mode, фрагмент)
```css
--background: 40 10% 97%;       /* #fafaf9 — НЕ канон, должно быть #F7F5F1 */
--primary: 160 79% 24%;         /* #0d6e4f emerald — НЕ канон, должно быть #0A2240 navy */
--accent: 224 55% 32%;          /* navy — канон, но в роли accent, не primary */
--radius: 16px;                 /* НЕ канон, должно быть 0 */
--font-display: 'Golos Text';   /* частично канон (Golos OK для body, но heading должен быть Unbounded) */
```

### tailwind.config.ts (фрагмент)
```ts
fontFamily: {
  sans: ['DM Sans', ...],         // НЕ канон — должно быть Golos Text (RU) / Noto Sans (EN)
  display: ['Golos Text', ...],   // НЕ канон — должно быть Unbounded (RU) / Noto Serif (EN)
  serif: ['Playfair Display'],    // используется только в Newbuilds, удаляется
}
```

### index.html (фрагмент)
```html
<link href="https://fonts.googleapis.com/css2?family=Golos+Text:...&family=DM+Sans:...&family=Playfair+Display:...&family=Sarabun:..." />
<!-- НЕ канон — должно подгружать Unbounded, Noto Serif, Noto Sans, Golos Text, JetBrains Mono -->
```

---

## Связанные документы

- Канон: [`docs/canonical/05-visual-design-system.md`](./05-visual-design-system.md)
- Стратегия: [`PROJECT.md`](../../PROJECT.md) §2 (двойной тезис), §3 (омбудсмен), §22 (дизайн-стандарты)
- Сегментация: [`docs/canonical/01-segmentation-framework.md`](./01-segmentation-framework.md)
- Memory (требуют пересмотра в Фазе 4):
  - `mem://style/super-app-visual-identity` → archive
  - `mem://style/design-system-ds2-standards` → переписать
  - `mem://style/editorial-dark-luxury-theme` → archive

---

## Фаза 2 — Newbuilds unification (✅ выполнено 2026-04-23)

### Решение
По плану миграции newbuilds объединён с каноном — отказ от "Dark Luxury Editorial" sub-brand.

### Изменения
- **`src/styles/newbuilds-theme.css`** — полностью переписан:
  - Удалён dark luxury режим (чёрный фон `#0F0F0F` + золото `#C9A84C`).
  - Все `--nb-*` токены теперь алиасы к канону: `--nb-bg → --background`, `--nb-gold → --brand-orange`, `--nb-text → --foreground`, и т.д.
  - Убран `backdrop-filter`, glow-анимации, gold-градиенты.
  - Шрифты `Playfair Display`/`DM Sans` заменены на канонические `var(--font-display)`/`var(--font-body)` (Noto Serif / Unbounded).
  - Радиусы `.nb-glass`, `.nb-btn-gold` → `var(--radius-none)` (0px по канону).
  - `.nb-btn-gold` теперь navy primary (без градиента).
  - Бейджи (`construction`, `offplan`, `completed`, `upcoming`) переведены на семантические `--warning/--info/--success/--brand-navy` токены.
  - `.nb-glow-pulse` → no-op (glow запрещён каноном §6).

- **`src/pages/newbuilds/NewbuildsMap.tsx`** — убраны последние инлайн `'Playfair Display"` font-family (заменены на `var(--font-display)`); тёмная тень `rgba(0,0,0,0.45)` → `var(--shadow-sm)`.

### Что осталось работать как раньше
- ~40 компонентов в `src/components/newbuilds/` продолжают использовать `--nb-*` классы — они автоматически получают канонические цвета через aliases. Точечный рефакторинг — Фаза 3.
- WelcomeLanding, RentalLanding, FlowerDeliveryLanding, AirportTransferLanding, NewDevelopmentsLanding используют семантические токены (`--primary`, `--accent`, `--border`, `--muted`) и уже мигрировали через обновление `tokens.css` без правок кода.

### Verify
- `tsc --noEmit` → exit 0.
- Ручная проверка `/newbuilds`, `/newbuilds/map`, `/newbuilds/area-guides` — рекомендуется в превью.

---

## Фаза 3 — Canon overrides (✅ выполнено 2026-04-23)

### Стратегия
Вместо точечной правки 552 хардкод-цветов в 100+ файлах добавлен один глобальный override-слой.

### Изменения
- **`src/styles/canon-overrides.css`** (новый файл, ~250 строк) — маппит legacy Tailwind палитру на канон через `:where()` (specificity 0,0,0) + `!important`:
  - `text/bg/border-emerald|teal|green|lime|mint-*` → `--success` / `--success-bg`
  - `text/bg/border-cyan|sky|blue|indigo-*` → `--brand-navy-700` / `--info-bg`
  - `text/bg/border-purple|violet|fuchsia-*` → `--primary` (navy)
  - `text/bg/border-pink|rose-*` → `--cat-wedding`
  - `text/bg/border-amber|orange|yellow-*` → `--accent` (orange) / `--brand-orange-100`
  - `from-/to-/via-` градиенты также перемаплены (peylaa, invest, services drawer теперь рендерятся navy↔orange).
  - **Glassmorphism вырублен глобально**: `[class*="backdrop-blur"]` → `backdrop-filter: none` (canon §6).

- **`src/index.css`** — добавлен `@import './styles/canon-overrides.css'` сразу после design-tokens (до Tailwind).

### Результат без правок компонентов
- ~552 неканонических цветов в peylaa, GTrust, WelcomeFlow, InvestmentHub, services drawer, capital, legal, property/commercial и др. визуально приведены к канону.
- 142 файла с glassmorphism теперь рендерят solid surfaces.
- TypeScript: `tsc --noEmit` exit 0.
- Vite production build: успешен (1m 21s, 2139 PWA entries).

### Ограничения подхода
- `:where()` используется для матча, но `!important` нужен для победы над Tailwind utility-классами. В Фазе 4 эти classes будут переписаны на семантические (`text-primary`, `bg-success`) и override-файл сократится/удалится.
- Inline-стили с хексами (88 случаев) не покрыты — они правятся точечно в Фазе 4.
- Внешние компоненты (Google Maps маркеры с прямыми hex) тоже требуют точечной правки.
