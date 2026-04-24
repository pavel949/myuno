## Что я нашёл

Я прочитал канон (`docs/canonical/05-visual-design-system.md` §5 и §8.1) и сверил его с кодом.

### Канон говорит так

- **§5 Radius:** дефолт = `rounded-none` (0px). Радиус 8–16px **прямо запрещён**. Разрешены только `rounded-none`, `rounded-sm` (2px, для мини-бейджей), `rounded-full` (аватары, статус-точки).
- **§8.1 Button:** ровно **4 варианта** — Primary (navy), Secondary (outline), Ghost, Destructive. Все с `radius: 0`, padding 12×24, font 15/500, без теней, без gradients, без translate-y, без glow.

### Что сейчас в коде

**Хорошее (канон уже почти соблюдён по углам):**
- `src/styles/tokens.css` — `--radius` форсирован в 0, легаси-алиасы (`--radius-md`, `--radius-lg`) тоже занулены.
- `src/styles/canon-overrides.css` — глобальный safety-net `:where(.rounded-md, .rounded-lg, .rounded-xl, …) { border-radius: 0 !important }`. Поэтому **визуально на странице углы уже квадратные** — даже там, где в classNames осталось `rounded-xl`.
- В `src/components/ui/button.tsx` базовые классы уже содержат `rounded-none`.

**Плохое (расхождения с каноном, которые видно глазом):**

1. **Button.tsx нарушает §8.1 в нескольких местах:**
   - `font-semibold` вместо канонического `weight 500` (medium).
   - `hover:-translate-y-0.5` на 4 вариантах — каноном не предусмотрено (это «soft-UI»-приём).
   - `active:scale-[0.97]` — то же самое.
   - `[box-shadow:var(--shadow-btn-hover)]` — кнопки в каноне **без теней**.
   - Variant `outline` использует `glow-border` (свечение) и `bg-card` — канон требует transparent + 1.5px navy border.
   - Variant `destructive` залит фоном — канон требует transparent + red border + red text.
   - `triggerRipple` (волна по клику) — материаловский эффект, не из канона.
   - Размеры `sm`/`lg` имеют дублирующее `rounded-none`, но не имеют канонического padding (`12×24` для default, `8×16` для ghost).

2. **113 файлов в `src/components/ui/*` всё ещё содержат литералы `rounded-md/lg/xl`** — visualно их давит safety-net, но это техдолг и риск: если кто-то выключит overrides, всё «расскруглится» обратно. Те же 195 совпадений по `src/`.

3. **134 «ручных» `<button>`** (минуя shadcn-обёртку) разбросаны по проекту — у них нет единого размера, веса шрифта, hover-поведения. Самые заметные на главной: tabs в `HeroIntro`, popular-task pills, CTA в `Install.tsx`, концирж-чат и т.п.

4. **`size="lg"`/`"sm"`/`"icon"` используется 1695 раз** — то есть в проекте де-факто 3+ размерных линии кнопок, а канон описывает только один базовый размер (44px touch).

### Ответ на твой вопрос про скругление

То, что ты видишь на превью — это **уже работа safety-net**, который силой убирает скругление до 0. Это и есть канон. Скруглённых кнопок в духе Airbnb/SaaS быть **не должно**. Если где-то на экране ты видишь округлую кнопку — это либо (а) `rounded-full` (аватар/статус-точка/иконка-кружок — это разрешено), либо (б) место, куда `:where()`-правило не достало (inline `style={{borderRadius}}`, svg-кнопка, сторонний компонент).

---

## План работ

### Этап 1. Привести `Button` к канону §8.1 (1 файл)

В `src/components/ui/button.tsx`:
- убрать `hover:-translate-y-0.5`, `active:scale-[0.97]`, `triggerRipple`, `[box-shadow:…]`;
- заменить `font-semibold` на `font-medium`;
- переписать варианты:
  - **default** → `bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))]`, без теней;
  - **outline** → `bg-transparent text-primary border-[1.5px] border-primary hover:bg-[hsl(var(--brand-navy-50))]`, убрать `glow-border`;
  - **secondary** → оставить как «второй CTA»: `bg-secondary text-secondary-foreground border border-border` без теней;
  - **ghost** → padding `8px 16px`, `text-[hsl(var(--text-body))]`, `hover:bg-[hsl(var(--surface-raised))]`;
  - **destructive** → `bg-transparent text-destructive border border-destructive hover:bg-[hsl(var(--danger-bg))]`;
  - **link** — оставить как есть (это не кнопка, а ссылка-link).
- размеры:
  - `default` → `h-11 px-6 py-3` (44px touch, 12×24 padding);
  - `sm` → `h-9 px-4` (для table-actions);
  - `lg` → `h-12 px-8` (sticky bottom CTA);
  - `icon` → `h-11 w-11`.
- оставить `rounded-none` на всех — никаких `rounded-lg/xl`.
- оставить haptic+sound (это поведение, не дизайн), но убрать ripple.

### Этап 2. Очистить ручные `<button>` на ключевых guest-экранах (≈8 файлов)

Прохожусь по самым видным: `HeroIntro.tsx` (вертикальные табы), `Install.tsx` (CTA), `ConciergeIntentChat.tsx` (suggestions), `PersonaWidgets.tsx` (preset-кнопки), `InvestorQuiz.tsx` (option-buttons). Заменяю `<button className="rounded-md/lg …">` на `<Button variant="…" size="…">` или, если это chip/tab, — на канонический паттерн (`rounded-sm` или `rounded-none` + 1.5px navy border при active).

Не трогаю `rounded-full` (аватары, статус-точки, mobile bottom-nav handle, switch — всё разрешено).

### Этап 3. Кодемод по `src/**` для оставшегося техдолга (1 проход скриптом)

Запускаю `scripts/canon-cleanup-codemod.mjs`-style проход (или новый `scripts/canon-strip-rounded.mjs`):
- `rounded-md|rounded-lg|rounded-xl|rounded-2xl|rounded-3xl` → `rounded-none`;
- `rounded-sm` оставляю (канон §5 разрешает для мини-бейджей);
- `rounded-full` не трогаю;
- директивные варианты (`rounded-t-lg` и т.п.) → `rounded-none`.

Это снимает зависимость от safety-net в `canon-overrides.css` и приводит исходники в согласие с тем, что и так уже видно глазом. После прохода фиксирую число замен в комменте скрипта (как сделано в `canon-strip-glassmorphism.mjs`).

### Этап 4. QA на превью (без браузера, по коду)

- `npm run lint` — ловлю случайные нарушения.
- Открываю 5 экранов в превью и убеждаюсь, что:
  1. Кнопки на главной (`/`) — квадратные, navy/outline.
  2. Каталог `/property` — фильтры и CTA согласованы.
  3. `/me` — табы и actions без скруглений.
  4. `/wallet` — sticky CTA без теней.
  5. `/install` — primary CTA соответствует canon.

### Чего я НЕ трогаю

- `rounded-full` (canon §5 разрешает).
- `Skeleton` (canon-overrides уже даёт ему 4px радиус — это исключение).
- shadcn-примитивы, где `rounded-full` встроен в Switch/Slider/Avatar/ScrollArea — они уже канонические.
- Цвет, шрифты, spacing — твой вопрос только про кнопки и углы.

---

## Технические детали

| Файл | Действие |
|---|---|
| `src/components/ui/button.tsx` | Полный рерайт `cva` под §8.1 — 4 варианта, 4 размера, без теней/translate/ripple |
| `src/components/home/HeroIntro.tsx` | Tabs/CTA → `<Button variant="ghost\|default">` |
| `src/pages/Install.tsx` | Primary CTA → canonical default |
| `src/components/concierge/ConciergeIntentChat.tsx` | Suggestion-кнопки → `variant="outline"` + `rounded-none` |
| `src/components/account/PersonaWidgets.tsx` | Preset-кнопки → `variant="ghost"` |
| `src/pages/invest/InvestorQuiz.tsx` | Option-кнопки → `variant="outline"` + active state navy border |
| `scripts/canon-strip-rounded.mjs` (новый) | Кодемод по `src/**`: `rounded-{md,lg,xl,2xl,3xl}` → `rounded-none` |

Объём: ~9 файлов руками + 1 скрипт-проход на ~195 совпадений в 12 файлах.

Готов приступить — подтвердишь?