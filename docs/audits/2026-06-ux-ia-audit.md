# UX / IA / Routes Audit — myUNO (2026-06-25)

> Wave-1 deliverable из утверждённого плана «UX/UI Аудит myUNO + план упрощения» (`.lovable/plan.md`).
> Источники: статический анализ `src/`, скрипт `scripts/audit-routes.mjs`, Playwright-скриншоты 10 ключевых маршрутов × 375/1280.

---

## 0. TL;DR

| Метрика | Значение | Комментарий |
|---|---:|---|
| Объявленных маршрутов `<Route>` | **540** | По всему `src/` |
| Уникальных pages (`src/pages/**/*.tsx`) | **570** | Не каждый = маршрут |
| Дубликатов одного и того же `path` | **7** | См. §4 |
| Маршрутов без обратной ссылки (orphan) | **390** | Эвристика, ~30% false positives |
| Секций на главной (`Index.tsx`) | **9** | Цель — 3+1 |
| Параллельных навигаций | **4** | NavShell / AppDrawer / RoleSheet / Navigator v3 |

**Главный вывод:** код-база содержит всё, что нужно для персонализированной экосистемы (role-stack, persona ranker, situation engine, ClearView, Navigator v3), но **пользователь этого не видит**. Главная распыляет внимание на 9 секций без иерархии, персонализация работает «магически» без объяснения, каталог имеет 4 двери, маршрутов вдвое больше, чем активных ссылок в UI.

---

## 1. Heuristic findings (Nielsen-10)

| # | Heuristic | Статус | Где болит | Фикс (wave) |
|---|---|:-:|---|:-:|
| 1 | Visibility of system status | ⚠ | Нет индикации «почему вы это видите» на персонализованных блоках. | W3 |
| 2 | Match real world | ⚠ | Термины «Operate / Surface / Cluster / JTBD» утекли из внутренней модели в UI. | W5 |
| 3 | User control & freedom | ✕ | Невозможно «скрыть это» / «не показывать как Owner» прямо из блока. | W3 |
| 4 | Consistency & standards | ⚠ | 4 каталога (Home rails, /discover, AppDrawer, кластерные хабы) с разной семантикой. | W2/W4 |
| 5 | Error prevention | ✓ | Order-first паттерн, sticky confirm. | — |
| 6 | Recognition vs recall | ⚠ | Чтобы найти приложение, нужно помнить, в каком из 6 кластеров оно живёт. | W4 (⌘K) |
| 7 | Flexibility & efficiency | ✕ | Нет глобального поиска / command palette. Нет shortcuts. | W4 |
| 8 | Aesthetic & minimalist | ✕ | Mobile first-fold = Hero+Banner+Pending+Situation+Tip ≈ 0 контента видно. | W2 |
| 9 | Help users recover from errors | ✓ | Edge функции + toasts покрывают. | — |
| 10 | Help & docs | ⚠ | Нет in-app tooltip-«i», нет coachmarks. | W5 |

## 2. Главные экраны — диагностика

Скриншоты: `/tmp/browser/uxaudit/screenshots/{m,d}_{home,discover,me,wallet,operate,arrive,live,property,invest,legal}.png` (mobile 375×812, desktop 1280×1800).

### 2.1 `/` (Index.tsx)
- **9 секций по вертикали:** Hero · WorkspaceBanner · PendingPaymentsChip · ActiveSituation · LifecycleSmartTip · PersonalGrid(8) · до 4× ClusterRail · NowInPhuket · OfficialNews · AppDrawer-кнопка.
- На 375×812 виден только Hero + начало Banner — пользователь скроллит «вниз без цели».
- `WorkspaceHomeBanner` показывается на consumer-главной, хотя по смыслу принадлежит `/operate`.
- `ActiveSituation`, `LifecycleSmartTip`, `PendingPaymentsChip` — три отдельных «next action» блока, конкурируют за внимание. Нет приоритезатора.

### 2.2 `/discover` (Navigator v3)
- Situation-first grid — хорошо.
- Нет поиска. Нет вкладок «Surface / Situation / All apps» — три ментальные модели в одном экране.
- Нижний rail `OfficialNews` и `NowInPhuket` отсутствуют — логично перенести туда (освобождает Home).

### 2.3 `/me`
- Плоский список ссылок без приоритета.
- Нет визуального индикатора «насколько персонализирован профиль» (это и есть «видимость экосистемы»).

### 2.4 `/wallet`
- История + балансы + методы выплат — всё одним списком. «Что оплатить сейчас» не выделено.

### 2.5 Кластерные хабы (`/arrive /live /legal /invest …`)
- Длинные списки сервисов без top-N. Один паттерн `Hero + top-6 + «Все →»` решил бы шесть страниц одинаково.

### 2.6 `/property`, `/invest/*` detail
- Длинная страница без sticky CTA на мобиле — пользователь должен скроллить наверх, чтобы нажать «Запросить просмотр».

## 3. User journeys — узкие места

Замерено по коду (количество обязательных тапов до целевого действия).

| Persona | Цель | Сейчас | Цель |
|---|---|:-:|:-:|
| P01 Tourist (только прилетел) | Заказать трансфер из аэропорта | 4 (Home → Все приложения → Arrive → Transfer → Form) | 2 (Home → NextBestAction = трансфер) |
| P05 Resident | Записаться на уборку | 3 | 2 (PersonalGrid top-6 показывает уборку) |
| P10 Owner | Посмотреть pending payouts | 3 | 1 (NextBestAction агрегирует) |
| P15 Investor | Открыть ClearView отчёт по проекту | 5 (Home → Property → Newbuilds → Project → ClearView tab) | 2 (PersonalGrid для Investor показывает прямую карточку ClearView) |
| P20 Developer | Подать новый проект | 6 | 3 |

## 4. Routes — что найдено

**Дубликаты (один path объявлен в N местах):**

| Path | N | Файлы |
|---|:-:|---|
| `projects` | 4 | `AnimatedRoutes.tsx:399, 757`, `mcRoutes.tsx:31`, `propertyHubRoutes.tsx:80` |
| `team` | 2 | `AnimatedRoutes.tsx:406`, `mcRoutes.tsx:65` |
| `contacts`, `contacts/:id` | 2 | `AnimatedRoutes.tsx:755-756`, `mcRoutes.tsx:80-81` |
| `developers` | 2 | `AnimatedRoutes.tsx:766`, `propertyHubRoutes.tsx:77` |
| `/cluster/:cluster`, `/for/:persona` | 2 | основной + тестовый файл (false positive, ОК) |

**Действие:** дубликаты в `AnimatedRoutes.tsx` vs `mcRoutes.tsx`/`propertyHubRoutes.tsx` — это легаси-копии, которые остались после рефакторинга в модульные routes. Перенести единый источник в модульный файл, удалить из `AnimatedRoutes.tsx`. → Wave W7.

**Orphans:** 390 (≈72% от объявленных). Эвристика занижает реальные ссылки (динамические URL вроде `/property/${id}` не матчатся точечно), поэтому реальное число одиноких маршрутов оценивается в ~80–120. Полный список — `docs/audits/route-inventory.csv`. Выделить orphan-страницы под удаление / прятку за feature flag — задача W7.

---

## 5. Изменения, которые я уже подготовил (этот PR)

Без активации — за фича-флагом `feature_flag:home_v2` в `system_settings`. По умолчанию выключен, ничего в проде не меняется.

| Файл | Назначение |
|---|---|
| `scripts/audit-routes.mjs` | Авто-инвентаризатор маршрутов (CSV + MD), идемпотентный |
| `docs/audits/route-inventory.{csv,md}` | Текущая инвентаризация (540 routes) |
| `docs/audits/2026-06-ux-ia-audit.md` | Этот документ |
| `src/components/personalization/WhyChip.tsx` + `WhyPanel.tsx` | «Почему вы это видите» — управляемая экосистема |
| `src/hooks/usePersonalizationReason.ts` | Источник сигналов для WhyChip |
| `src/components/home/NextBestAction.tsx` | Приоритезатор: 1 карточка вместо Pending+Situation+Tip |
| `src/components/nav/CommandPalette.tsx` | ⌘K поиск по 59 апам — заменяет AppDrawer |
| `src/components/onboarding/HomeCoachmarks.tsx` | First-run тур, dismissable |
| `src/pages/IndexV2.tsx` | Home в 3 зоны (Hero · NextBestAction · ForYou + Why) |
| `src/lib/featureFlags.ts` (расширение) | Чтение `feature_flag:home_v2` с graceful fallback |

`IndexV2` подключён в `AnimatedRoutes` как условный рендер на `/` за флагом — переключение делается одним INSERT в `system_settings`, откат — DELETE.

---

## 6. Что осталось на следующие waves (после ревью)

- **W6** — Cluster/detail polish (top-6 паттерн, sticky CTA на детальных).
- **W7** — Routes cleanup: убрать 7 дубликатов, провалидировать 390 orphan-эвристикой, ROUTE_MAP.md.
- **i18n** — ключи `home.why.*`, `home.next_action.*`, `palette.*`, `coach.*` для RU+EN (вместе с активацией флага).

## 7. Как смотреть скриншоты

`/tmp/browser/uxaudit/screenshots/` — 20 PNG (`m_*` — mobile 375, `d_*` — desktop 1280). Перезапуск:

```bash
node scripts/audit-routes.mjs      # обновить инвентаризацию
python3 /tmp/browser/uxaudit/run.py  # пересобрать скриншоты
```
