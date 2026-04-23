

# Миграция myUNO к канонической дизайн-системе

## Ваши решения
- **Dark mode:** удаляется как дефолт, остаётся опцией для admin/MC (navy-инверсия, без mint, без glassmorphism)
- **Newbuilds:** унифицируется с каноном (отказ от Playfair + золота)
- **Радиусы:** строго 0px по канону везде
- **Темп:** 4 фазы с review между ними

## Точка отката

Создаю в первом коммите `docs/canonical/MIGRATION_TO_CANON_BASELINE.md` с фиксацией:
- дата, версия `3.40.0`, ветка
- список затронутых файлов
- инструкция «как откатить» через History
- snapshot ключевых токенов «до»

Дополнительно — каждый шаг сохраняется как Lovable checkpoint, доступен через `View History`.

---

## Фаза 1 · Фундамент (1-2 дня) — старт сразу после approve

**Цель:** заменить токены и шрифты. Внутренний UI временно «потеряет красоту», но ничего не сломается — все компоненты используют CSS-переменные.

1. **`src/styles/tokens.css`** — полная перезапись:
   - Новая палитра: `--brand-navy: 213 73% 15%` (#0A2240), `--brand-orange: 22 79% 47%` (#D96B1A), `--brand-cream: 36 27% 96%` (#F7F5F1)
   - Stone-шкала из 9 ступеней (`--ink`, `--text-body`, `--text-muted`, `--border-strong`...)
   - Семантика: success/warning/danger/info по канону (`#166534`, `#92400E`, `#991B1B`, `#1B4F8A`)
   - 16 фиксированных цветов категорий каталога
   - Удаление: `--cluster-*` mint-палитры, glass-tokens, glow-shadows, mint primary
   - Light = дефолт. `.dark` переписан на navy-инверсию для admin/MC (cream→navy-900, ink→cream)

2. **`tailwind.config.ts`**:
   - Шрифты: `display: ['Unbounded', ...]`, `display-en: ['Noto Serif']`, `sans: ['Golos Text', ...]`, `sans-en: ['Noto Sans']`, `mono: ['JetBrains Mono']`
   - Type-scale из канона (`display`, `h1`-`h4`, `body-lg/sm`, `caption`, `label`)
   - Spacing — без изменений (4px-grid уже совпадает)
   - **Радиусы оставляем как есть в Фазе 1**, перенастроим в Фазе 4 (иначе сломается слишком много за раз)
   - Удаляются: `gold`, `coral`, `cluster.*`, `accent-*` фуксии/violets

3. **`index.html`** — Google Fonts URL по канону (Unbounded + Golos Text + Noto Serif + Noto Sans + JetBrains Mono)

4. **`src/index.css`** — глобальный `font-family` через CSS-логику по `lang` (RU → Unbounded/Golos, EN → Noto Serif/Noto Sans)

5. **`src/lib/themeSwitch.ts`, `src/contexts/ThemeContext.tsx`** — light по дефолту, переключатель доступен только в admin/MC секциях

6. **Создаётся `docs/canonical/MIGRATION_TO_CANON_BASELINE.md`**

**Review checkpoint:** прохожу по 5 ключевым экранам (`/`, `/discover`, `/admin`, `/property`, `/mc`), показываю скриншоты «до/после», ты решаешь идти дальше.

---

## Фаза 2 · Внешний контур — деньги и доверие (3-5 дней)

**Цель:** довести до канона все экраны, которые видит HNWI и инвестор перед сделкой.

- `src/pages/WelcomeLanding.tsx` (`/index`) — переписать в каноническом стиле: cream фон, navy CTA, Unbounded H1, документная сетка с hairline-разделителями, без glassmorphism, без mint
- `src/pages/Discover.tsx` — переход на новые токены
- `src/pages/property/*` — листинги, карточки, detail-экраны
- `src/pages/invest/*` — Investor dashboard, ClearView рейтинги, отчёты
- `src/pages/newbuilds/*` — **унификация:** удалить `.nb-theme`, `nb-glass`, gold, Playfair. Заменить на каноническую navy + Noto Serif для заголовков. Сохранить editorial-ощущение через типографику и spacing, не через цвет/материал
- Удалить файл `src/styles/newbuilds-theme.css`
- Email-шаблоны (если в репо) — обновить под канон

**Новые компоненты в `src/components/ds/`:**
- `MarketingHero` — eyebrow + H1 + sub + CTA-пара по канону
- `StatGrid` — hairline-сетка цифр (mono)
- `ClusterCard` — нумерованная карточка `01...08`
- `TrustStrip` — горизонтальный список доверия
- `DocumentSection` — секция документ-стиля для лендингов и Invest

**Review checkpoint.**

---

## Фаза 3 · Внутренний app (1-2 недели)

**Цель:** привести внутренние экраны к канону. Большая часть автоматически получит правильный вид от Фазы 1 (токены), но ~80 экранов используют hardcoded mint/glass/неканонические радиусы.

Поэтапно по доменам, в порядке частоты использования:

1. **Home / Index** — `src/pages/Index.tsx`, `HeroBlock`, `ActiveSituationBanner`, `QuickActionsGrid`
2. **CRM** — `src/pages/admin/CRM*`, `CreateContactSheet`, contact lists
3. **MC / Operate** — `src/pages/mc/*`, owner dashboards
4. **Bookings / Property care** — экраны с timeline, status history, calendar
5. **Auth / Onboarding** — `WelcomeLanding` уже сделан в Ф2, остальные auth-формы
6. **Admin** — `AdminDashboard`, `AdminKPIGrid` и подразделы

**Что чинится в каждом домене:**
- Замена hardcoded `bg-[#...]`, `text-[hsl(...)]` → семантические токены
- Удаление `nb-glass`, `backdrop-blur-xl`, `bg-card/40` glassmorphism → плотные карточки с `border-border-strong`
- Замена mint accents (`text-primary` где primary был mint) → navy/orange по семантике
- Замена шрифтовых arbitrary values (`text-[40px]`, `tracking-[-0.035em]`) → токены типошкалы
- Тени → `shadow-xs/sm` максимум, по умолчанию `shadow-none` + бордер

**Review checkpoint после каждого домена.**

---

## Фаза 4 · Финальная зачистка и радиусы (3-5 дней)

**Цель:** окончательное соответствие канону.

1. **Радиусы → 0px по канону**:
   - `tailwind.config.ts`: `borderRadius.lg/md/sm` → `0`, оставляем `rounded-sm` (2px) для chips, `rounded-full` для аватаров
   - `tokens.css`: `--radius: 0`, `--card-radius: 0`
   - Глобальный поиск-замена: `rounded-xl` → удалить, `rounded-2xl` → удалить, `rounded-lg` (на CTA/карточках) → удалить
   - Сохраняем `rounded-full` (аватары, статусные точки) и `rounded-sm` (badges, category chips)
   - Ожидается ~200-300 правок в компонентах

2. **ESLint правила** — добавить запрет на:
   - arbitrary color values (`bg-[#...]`, `text-[hsl(...)]`)
   - запрещённые шрифт-классы (Playfair, кроме конкретных editorial-блоков если останутся)
   - `rounded-xl`, `rounded-2xl`, `rounded-md` (8-16px запрещены каноном)
   - `backdrop-blur-*`, `glassmorphism` patterns

3. **Документация:**
   - Обновить `mem://style/super-app-visual-identity` → пометить как archived
   - Обновить `mem://style/design-system-ds2-standards` → переписать под канон
   - Обновить `src/design-system/foundations/README.md` под канон
   - Обновить `mem://style/editorial-dark-luxury-theme` → пометить archived

4. **Удаление мёртвого кода:**
   - `src/styles/newbuilds-theme.css`
   - Cluster-цвета из tokens (заменены 16 категориями)
   - Gold/coral/teal палитры

5. **Финальный визуальный sweep** — пройтись по сайтмэпу, зафиксировать 30+ экранов как «эталонные» в `docs/canonical/screens/`.

---

## Технические детали

### Стратегия отката
- **Глобальный rollback:** через History → выбрать чекпоинт перед началом Фазы 1
- **Частичный rollback:** каждая фаза = отдельный чекпоинт, можно вернуться к любому
- **Файл-якорь:** `MIGRATION_TO_CANON_BASELINE.md` содержит точный snapshot ключевых файлов

### Что НЕ ломается миграцией
- Бизнес-логика (Supabase queries, API, RLS)
- Routing, state management, contexts
- Edge Functions
- БД схема
- i18n строки
- Все hooks

### Риски и митигация
| Риск | Митигация |
|---|---|
| Регрессия в редко-посещаемых экранах | После каждой фазы — review checkpoint, можно остановиться |
| Шрифты не загрузятся → FOUT | Фоллбэки в font-family stack, `font-display: swap` |
| Сломается dark mode для admin | Отдельный re-test в Фазе 1, инверсия navy = читаемость гарантирована |
| Newbuilds потеряет premium-ощущение | Editorial через типографику Noto Serif + правильный spacing вместо золота |
| Большое количество визуальных regressions, которые сложно увидеть | Разбивка на 4 фазы + чекпоинт перед каждой |

### Объём
- Фаза 1: 6 файлов
- Фаза 2: ~25 файлов + 5 новых компонентов
- Фаза 3: ~80 компонентов в 6 доменах
- Фаза 4: ~200-300 точечных правок радиусов + правила линтера

### Длительность
~3-4 недели рабочего времени с твоими review между фазами. Сейчас approve запускает Фазу 1.

