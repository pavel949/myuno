# UX/UI Аудит myUNO + план упрощения

## 0. Что я нашёл (краткая диагностика)

**Масштаб:**
- 94 top-level директорий страниц, 702 объявления `<Route>`, 59 микро-приложений, 6 surfaces × 10 JTBD × 25 personas, role-stack из 18 ролей.
- Главная (`Index.tsx`) — 9 вертикальных секций: Hero, WorkspaceBanner, Pending, ActiveSituation, LifecycleTip, PersonalGrid, до 4 ClusterRail, NowInPhuket, OfficialNews, «Все приложения».
- 3 параллельные навигации: `NavShell` (TopBar+BottomBar+SideRail), `AppDrawer`, `RoleSheet`, плюс `Navigator v3` на `/discover`.

**Главные UX-проблемы:**
1. **Перегрузка Home.** 9 секций × несколько rails = пользователь скроллит «стену иконок» вместо одного фокусного экрана. Нет визуальной иерархии «что сделать сейчас».
2. **Невидимость персонализации.** Система ранжирует по role+persona, но юзер не понимает *почему* видит именно это. Нет «бейджа причины» («Потому что вы Owner + Investor»), нет управления видимостью прямо из карточки.
3. **Двойные двери в каталог.** Home rails ↔ `/discover` (Navigator v3) ↔ AppDrawer ↔ Cluster pages — четыре способа найти то же. Юзер не знает, какой канонический.
4. **702 маршрута, нет карты.** Часть маршрутов осиротевшая (нет ссылок из UI), часть дублируется (`/property/*`, `/newbuilds`, `/invest/*`). Нет inventory-страницы.
5. **Нет онбординг-подсказок in-app.** Role/Persona Sheet существует, но не подсвечивается. Новый юзер не знает, что приложение подстраивается.
6. **Cognitive load на ролях.** 18 app_role + 7 consumer ролей + role-stack — это внутренняя модель, утёкшая в UI (RoleSheet перечисляет всё подряд).
7. **Mobile chrome.** На 375px Hero + Banner + Pending + ActiveSituation + LifecycleTip съедают весь первый экран ещё до контента.

---

## 1. Скоуп аудита (что произведём как deliverable)

В `/docs/audits/2026-06-ux-ia-audit.md` — единый документ:
- **A. Route inventory** — авто-скрипт `scripts/audit-routes.mjs` собирает все `<Route>`, помечает осиротевших (нет `Link to=`), дубли, неиспользуемые `pages/*`. CSV + markdown.
- **B. Heatmap главных экранов** — Home, /discover, /me, /wallet, /operate, /property, кластерные хабы. Скриншоты через Playwright @ 375/768/1280, аннотации проблем.
- **C. User journey audit** — 5 канонических персон (P01 Tourist, P05 Resident, P10 Owner, P15 Investor, P20 Developer): «от старта до целевого действия за N тапов». Цель ≤3 тапа.
- **D. Heuristic checklist** — Nielsen-10 × текущий код, с file:line ссылками.

## 2. Концептуальные изменения IA

### 2.1 Home → «Один экран — одна задача»
Сжать 9 секций в **3 фиксированных зоны** + 1 опциональную:

```text
┌────────────────────────────────┐
│ Z1 HERO (compact, 1 экран)     │
│  Привет, Павел · Owner ▾       │  ← один тап → RoleSwitch
│  [AI search:  «что вам нужно?»]│
│  Почему так? ⓘ                 │  ← объясняет персонализацию
├────────────────────────────────┤
│ Z2 NEXT BEST ACTION (1 карточка)│
│  «У вас 2 платежа · оплатить»  │  ← Pending + LifecycleTip + Situation
│                          [→]    │   агрегированы в одну приоритетную
├────────────────────────────────┤
│ Z3 FOR YOU (max 6 иконок)      │
│  «Подобрано: Owner + Investor» │  ← бейдж причины
│  [icon] [icon] ... [Все →]     │
└────────────────────────────────┘
   (Z4 — кластерные rails только под кнопкой "Развернуть")
```

Эффект: первый экран = приветствие + 1 CTA + 6 иконок. Всё остальное — за свайпом/тапом.

### 2.2 Один канонический каталог
- **Home Z3 = быстрый доступ (top-6).**
- **/discover = единственная «карта приложений»** (Navigator v3 уже там).
- **AppDrawer убрать** или превратить в command-palette `⌘K` (поиск по 59 апам) — без визуального дублирования.
- Все «Все приложения», «Show more» с других экранов ведут на `/discover`.

### 2.3 Видимая персонализация (главный запрос пользователя)
Ввести системный паттерн **«Why-chip»** — маленький бейдж под каждым персонализированным блоком:

```text
[Для вас сейчас]  ⓘ Owner · Investor · был на Property вчера
```

При тапе — `WhyPanel` (Sheet снизу):
- Какие роли/персоны активны.
- Какие сигналы использованы (last visit, bookings, situation).
- **Кнопка «Изменить»** → RoleSheet.
- **Кнопка «Скрыть это»** → персональное правило.

Это превращает «магическую ленту» в **управляемую экосистему**, как просит пользователь.

### 2.4 Подсказки и онбординг in-app
- **First-run coachmarks** (4 шага) на Home: Hero/Role · Next Action · For You · Discover. Один раз, dismissable, хранить в `profiles.ui_flags.home_coach_v1`.
- **Empty states с микро-туром** на /discover, /wallet, /me — вместо пустого экрана объясняют, что появится после действия.
- **Tooltip-«i»** на каждом непонятном термине (ClearView AAA, Operate, Wallet) → ссылка на `/help/<slug>`.
- **Командная палитра ⌘K / иконка поиска** в TopBar — мгновенный доступ к любому из 59 апов + команды («открыть кошелёк», «сменить роль»).

### 2.5 Чистота UI
- Удалить из Home: WorkspaceHomeBanner (показывать только в workspace вариантах), NowInPhuket и OfficialNews → перенести на `/discover` как нижние секции.
- Свернуть PendingPaymentsChip + LifecycleSmartTip + ActiveSituation в один компонент `NextBestAction` с приоритезатором (показывает только #1 по весу).
- Все cluster rails → за кнопкой «Развернуть категории» (по умолчанию свёрнуты).
- Соблюдать DS 2.1: убрать остаточные `bg-card/0.06`, скруглённые 12–16px, glow — gate'нуть линтером в CI.

## 3. Конкретные wireframe-изменения (по экранам)

| Экран | Сейчас | Станет |
|---|---|---|
| **/ (Home)** | 9 секций, 4+ rails, 30+ иконок | 3 зоны: Hero, NextBestAction, ForYou(6) + Why-chip |
| **/discover** | Situation grid | + поиск ⌘K + табы Surfaces/Situations + footer «Что нового» |
| **/me** | Список ссылок | Профиль-карточка с прогрессом «насколько персонализировано» + быстрый Role/Persona edit |
| **/wallet** | Списки | Виджет «Что оплатить сейчас» наверху + история свёрнута |
| **/operate** | Workspace dashboard | Без изменений (это другой режим), но Home-баннер появляется только тут |
| **Cluster /arrive, /live…** | Длинные списки | Hero + 6 топ-сервисов + «Все сервисы кластера →» |
| **Property/Invest detail** | Длинная страница | Sticky bottom-bar CTA «Запросить просмотр», Why-chip «Подходит вам, потому что…» |

## 4. Маршруты — план чистки

1. Авто-инвентаризация `scripts/audit-routes.mjs` → 3 списка: **Active**, **Orphaned**, **Duplicate**.
2. Канонизация: для каждой пары дубликатов выбрать SSOT, остальные → 301 redirect через `<Navigate replace>` в `routes/*.tsx`.
3. Гейт: PR-чек, что новые `<Route>` имеют хотя бы один `Link to=` или явно помечены `// internal-only`.
4. Документ `/docs/ROUTE_MAP.md` — авто-генерируется из аудита.

## 5. Поэтапная реализация (после аппрува)

| Wave | Что | Срок |
|---|---|---|
| **W1 — Audit & Inventory** | Скрипт маршрутов + Playwright screenshots + аудит-документ | 1 день |
| **W2 — Home compact** | Сжать Index.tsx до 3 зон, агрегировать NextBestAction, спрятать rails | 1 день |
| **W3 — Why-chip + WhyPanel** | Новый shared компонент, подключить к PersonalGrid/ClusterRail/Detail | 1 день |
| **W4 — Command palette ⌘K** | TopBar search → fuzzy по 59 апам, заменяет AppDrawer | 1 день |
| **W5 — Coachmarks + tooltips** | First-run тур, `ui_flags`, помощь по терминам | 0.5 дня |
| **W6 — Cluster/detail polish** | Top-6 паттерн на кластерных хабах, sticky CTA на detail | 1 день |
| **W7 — Routes cleanup** | Redirects, удаление осиротевших страниц, ROUTE_MAP.md | 1 день |

**Рекомендую начать с W1 (аудит-документ + скрипт маршрутов).** Почему: даст объективную карту, без которой W2–W7 — догадки. Параллельно я подготовлю прототип Home-3-зоны как визуальный референс для аппрува до того, как трогать прод-код.

## 6. Технические детали

- Новые файлы: `src/components/home/NextBestAction.tsx`, `src/components/personalization/WhyChip.tsx` + `WhyPanel.tsx`, `src/components/nav/CommandPalette.tsx`, `src/components/onboarding/HomeCoachmarks.tsx`.
- Хук `usePersonalizationReason(blockId)` — возвращает массив сигналов для Why-panel.
- Таблица `system_settings` → `feature_flag:home_v2` для постепенной раскатки.
- Скрипт `scripts/audit-routes.mjs` (Node, читает `src/components/layout/routes/**`, ast-grep по `<Route`).
- Хранение прогресса онбординга: `profiles.ui_flags jsonb` (миграция).
- i18n: новые ключи `home.why.*`, `home.next_action.*`, `palette.*`, `coach.*` (RU+EN).
- DS: всё через токены `tokens.css`, sharp corners, без новых цветов.

## 7. Что НЕ входит в скоуп

- Реструктуризация Master Taxonomy (6 surfaces / 10 JTBD / 25 personas) — она остаётся SSOT.
- Backend / RLS изменения, кроме одной миграции `ui_flags`.
- Редизайн брендинга, шрифтов, палитры — DS 2.1 фиксирован.
- Перевод 610 RU-литералов — отдельный i18n cleanup трек.
