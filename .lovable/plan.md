

# Аудит блока «Недвижимость» myUNO — комплексная диагностика

## 0. Что я просканировал

- **БД**: `developers` (40), `developer_users` (0), `property_projects` (267), `properties` (32), `resale_properties` (3), `project_units` (50), `development_units` (5), `nb_leads` (3), `nb_project_updates` (0), `floor_plans` (1), `property_documents` (0).
- **Маршруты**: 90+ роутов в `/property/*`, `/newbuilds/*`, `/developer-portal/*`, `/capital/*`, `/mc/*`, `/my-property/*`, `/owner/*` (legacy).
- **Страницы**: 12 в `/developer-portal`, 18 в `/property`, 11 в `/newbuilds`, 11 в `/capital`, 80+ в `/owner|/mc`, 6 в `/invest`.
- **Хуки**: 60+ файлов, читающих недвижимостные таблицы.
- **Edge functions**: 11 `devmod-*` + 5 property/scraping.

---

## 1. КРИТИЧЕСКИЕ ПРОБЛЕМЫ (ломают сценарий «увидеть/купить»)

### 1.1. Каталоги недвижимости физически пустые публично
- **`/newbuilds/projects`**: фильтр `is_active=true AND is_approved=true`. В БД из 267 проектов: `is_active=true` — **1 проект**, `is_approved=true` — 29.
- **`/property/offplan`**: то же — фильтр `is_active=true`, в выдаче ~1 запись.
- **`/newbuilds/developers`**: `is_active=true` для застройщиков → 40 девелоперов есть, но 32 без описания, 34 без логотипа.
- **`property_projects.public_listing_enabled` = 0 у всех.**
- **`landing_enabled` = 0 у всех** → лендинги по проектам нигде не активированы.
- **`properties.listing_type='sale'` = 0** — таб «Купить» в PropertyHub пустой; у всех 27 одобренных listing_type='rent'.

### 1.2. Дублирование данных и таблиц-близнецов
| Назначение | Таблица 1 | Таблица 2 | Конфликт |
|---|---|---|---|
| Юниты проекта | `project_units` (50) | `development_units` (5) | Используются параллельно. `DeveloperProjectEditor` пишет в одну, `useProjectUnits` читает из `development_units` |
| Цена «от» | `price_from` | `price_from_thb` | Дублирование, нет правила |
| Изображение обложки | `cover_image` | `cover_image_url` | Оба поля, разные хуки читают разные |
| Локация | `lat/lng` | `location_lat/location_lng` | То же |
| Approval | `is_approved` (bool) | `approval_status` ('approved') | Разные таблицы используют разные системы |

### 1.3. Дублирующиеся точки входа для застройщиков
- **`/newbuilds/projects`** vs **`/property/offplan`** — обе ведут к **одной и той же** таблице `property_projects`, но через разные хуки (`useNewbuildProjects` vs `useOffplanProjects`), с разной логикой фильтров и UI (Dark Luxury vs стандартная тема).
- **`/newbuilds/developers`** vs **`/property/developers`** — то же самое.
- **`/newbuilds/projects/:slug`** — по slug, **`/property/offplan/:id`** — по UUID. Один и тот же проект имеет два URL.

### 1.4. Discontinuity между PMS и публичным каталогом
- `properties` (PMS, 32 объекта, 2 уникальных владельца) и `property_projects` (267, оффплан) — **никак не связаны**. Объект в PMS не привязан к проекту-новостройке.
- Owner Portal (`/my-property`) показывает только PMS-объекты, нет интеграции с тем, что человек купил в /newbuilds.

### 1.5. Маршрутные пустоты
- `/property/projects` (`ProjectsIndex`) — есть страница, но в навигации `PropertyHubTabs` отсутствует.
- `/property/project/:id` — отдельный маршрут, но в `PropertyHub`-табах не упоминается.
- `/developer-portal/apply` — после моих правок умеет редиректить, но **отдельного UI «Apply» больше нет** → юзер с публичной страницы попадает прямо в `/onboarding`, минуя welcome.
- `/admin/newbuilds`, `/admin/developers` — есть в роутере, но нет в основной navigation для Pavel.

---

## 2. UX И НАВИГАЦИЯ

### 2.1. Разница mobile / desktop — слабая
- **PropertyHub табы**: `flex overflow-x-auto` — на mobile скроллируются, на desktop одинаково (нет sticky/expanded layout для больших экранов).
- **PropertyDetail (1035 строк!)** — единственная страница с явной mobile/desktop логикой через `useIsMobile`. Остальные (OffplanDetail 453, NewbuildDetail 328, DeveloperDetail 190) — практически идентичный layout на всех размерах.
- **`/newbuilds/*` (Dark Luxury)** — внутри `MobileInstallSheet` и floating buttons выглядят чужеродно на тёмном фоне.
- **Sidebar в `/developer-portal`, `/mc`, `/capital`** — на mobile отдельные навигаторы (хорошо), на desktop одинаковый паттерн `SidebarProvider`. Но **нет hover-state для desktop sidebar** на главных вертикалях `/property` (там вообще нет sidebar — только табы).
- **Карточки `PropertyListingCard`** не имеют отдельного desktop-варианта (компактнее grid). На 1920px одна колонка кажется огромной.

### 2.2. Двусмысленные точки входа
- **«Я застройщик»** — после моих CTA правок есть на `/property/developers` и `/newbuilds/developers`, но нет на `/for-developers` (лендинг!), нет в footer'е, нет в `UserAvatarMenu`.
- **«Я инвестор»** — `/property/invest` существует, но не упоминается в основном меню; `/invest-hub` — параллельный URL.
- **Между Owner / MC / Developer** — Pavel переключается через `UserAvatarMenu`, но переходы не очевидные. Например, из `/my-property` нет прямого пути в `/developer-portal`.

### 2.3. Канонические формы и характеристики — рассинхронизированы
- В `property_projects` 90+ колонок: 30 из них **никогда не используются** UI (`juristic_*`, `cam_*`, `payment_plan_template`, `offplan_catalog`, `description_summary`, `yield_estimate`, `featured_label`, `marketing_materials`).
- `DeveloperProjectEditor.tsx` (758 строк) даёт редактировать ~25 полей. `OffplanDetail.tsx` показывает другие 18. **Нет источника истины** «что должно быть на карточке проекта».
- Канонических форм нет: `PropertyEditor` (PMS), `DeveloperProjectEditor` (B2B), `AdminNewbuilds` форма (admin) — три разных формы для одного типа сущности.

---

## 3. ОТДЕЛЬНЫЙ САЙТ ПОД КАЖДЫЙ ПРОЕКТ — анализ

### Текущее состояние
- В `property_projects` есть колонки `landing_enabled` (bool), `slug`, `tagline`, `tagline_ru`, `featured_label`. Но **`landing_enabled=true` нигде не выставлено**.
- `/newbuilds/projects/:slug` — фактически и есть «landing» проекта (одна страница, hero, units, dev, calculator), но это часть основного приложения, а не отдельный домен.
- Нет subdomain-роутинга, нет custom-домена per project, нет `<MetaPixel/>` или GA per project, нет per-project SEO/OG-image override.

### Что нужно для «отдельного сайта на каждый проект» (мой план)
1. Включить `landing_enabled` как переключатель в `DeveloperProjectEditor`.
2. Маршрут `/p/:slug` — public, без основного хедера/футера, с собственным hero/CTA (Dark Luxury), без bottom-nav.
3. Поддержка custom subdomain (например, `aria-villa.myuno.app`) через DNS wildcard + Edge Middleware (определять project по host). Альтернативно — кастомный путь `/projects/:slug-microsite`.
4. SEO override per project: `meta_title`, `meta_description`, `og_image_url`, `social_share_text` в БД.
5. Конструктор блоков: hero, gallery, units, payment plan, location map, dev-bio, lead form, FAQ — каждый можно вкл/выкл.
6. Аналитика per project: `nb_lead.source='microsite_<slug>'`.

**Удобство для Pavel** (вы ведёте профили): один экран в `/developer-portal/projects/:id` → toggle «Микросайт» → URL копируется → отдельная вкладка «Аналитика микросайта».

---

## 4. ОТЧЁТЫ И ДАННЫЕ

- **`/owner/reports`, `/mc/reports`** — есть, но завязаны на `property_financials` (PMS-only). Нет отчётов по `property_projects` (новостройки), нет отчёта по lead-конверсии в `nb_leads`.
- **DeveloperAnalytics** — 3 графика (views, leads, conversion). Источник данных — JOIN `nb_leads + property_projects`. На 3 nb_leads и 0 nb_project_updates аналитика **визуально пустая**.
- **`/capital/dashboard`** — должен показывать pipeline по застройщикам, но KPI хардкод/моки.
- **Counter `developers.projects_completed=0` у всех 40** — мы добавили trigger, но нужна разовая JOB на пересчёт после миграции.

---

## 5. АРХИТЕКТУРНЫЕ ПРОБЛЕМЫ

1. **Нет Single Source of Truth для проекта**. `property_projects` = inventory + landing + sales pipeline + financial + investment — всё в одной таблице с 90 колонками. Нужен split: `projects` (inventory) + `project_landings` + `project_sales`.
2. **Нет связи `properties ↔ property_projects`** для случая «PMS-объект внутри новостройки».
3. **`/owner` устарел и редиректит на `/mc`** — 14 редиректов в роутере. Грязно. Нужен отдельный шаг по deprecation.
4. **`use-mobile`, `useIsMobile`, `useBreakpoint`, `useIsDesktop`** — 4 хука, делают одно. Один источник `useBreakpoint` есть, остальные — обёртки. Нужен audit потребителей.
5. **`InvestmentHubShell`** используется для 4 разных URL (`market/deals/network/execution`) — внутренняя навигация по табам, но `URL → tab` маппинг в самом компоненте, а не в роутере.
6. **`/property/project/:id` vs `/property/offplan/:id` vs `/newbuilds/projects/:slug`** — три URL для одного проекта. `ProjectDetail.tsx` существует, но непонятно когда показывается.

---

## 6. ПЛАН ДОРАБОТКИ (приоритизирован)

### P0 — Без этого нельзя запускаться (~1.5 часа)
1. **Data activation**: SQL-скрипт массово ставит `is_active=true`, `is_approved=true`, `public_listing_enabled=true` для всех `property_projects` с заполненным `cover_image OR cover_image_url AND price_from`. Сейчас публично видно ~1 объект из 267.
2. **Унификация колонок**: миграция, объединяющая `cover_image ← cover_image_url`, `price_from ← price_from_thb`, `lat ← location_lat`. Хук-адаптер `toProjectUI` (по образцу `developerAdapter`).
3. **Расчётная JOB**: один раз пересчитать `developers.projects_completed/projects_ongoing/total_units_delivered` (наш trigger ловит только новые изменения).
4. **`properties.listing_type`** — добавить хотя бы 5 «sale» объектов в seed, иначе таб «Купить» демонстрационно пустой.

### P1 — Унификация каталога (~3 часа)
5. **Решение «один проект — один URL»**: канон `/newbuilds/projects/:slug`, остальные (`/property/offplan/:id`, `/property/project/:id`) → 301 redirect через slug-резолвер. `/property/offplan` остаётся как табовый каталог, но карточка ведёт на /newbuilds/.
6. **`development_units` → deprecate**, оставить только `project_units` (50 строк уже там). Миграция данных + обновление `useProjectUnits`.
7. **Канонические формы**: один компонент `<ProjectForm />` используется в `DeveloperProjectEditor` и `AdminNewbuilds`. `PropertyEditor` остаётся отдельно (PMS).

### P2 — Microsites per project (~4 часа)
8. **Маршрут `/p/:slug`** — отдельный layout без app shell, Dark Luxury, hero/units/CTA/lead form, кастомные SEO.
9. **`DeveloperProjectEditor`**: вкладка «Микросайт» — toggle landing_enabled, поля meta/og, превью, копирование URL.
10. **Аналитика микросайта**: `nb_leads.source='microsite_:slug'`, отдельная вкладка в `/developer-portal/analytics`.
11. **Custom domain (опционально позже)**: wildcard subdomain `*.myuno.app` через Vercel + Edge Middleware распознаёт host → подставляет slug.

### P3 — UX/Mobile-Desktop разделение (~2 часа)
12. **Desktop layouts**: для `/property/*` каталогов — sidebar с фильтрами + основная сетка (как Airbnb desktop). На mobile — drawer.
13. **PropertyHub табы**: на desktop — пилюли в шапке; на mobile — sticky горизонтальный скролл (текущее).
14. **Унификация хуков**: `useIsMobile/useIsDesktop/useBreakpoint` → один `useBreakpoint`. Codemod на оставшиеся.

### P4 — Pavel solo workflow (~2 часа)
15. **Bulk import** проектов из CSV в `DeveloperProjectEditor`.
16. **«Импорсонировать застройщика»** в `/capital/developers` — Pavel заходит в `/developer-portal` от имени девелопера для ведения профиля без передачи аккаунта.
17. **Quick-edit grid** в `/capital/developers`: inline edit logo/description/featured без захода в каждый.
18. **Auto-fill из URL**: вставить ссылку на сайт девелопера → AI парсит и заполняет профиль (используем существующий `etagi-scrape-projects` шаблон).

### P5 — Отчёты и аналитика (~1 час)
19. **`/capital/dashboard`** — реальные KPI: total dev / unclaimed / leads MTD / conversion / commission earned.
20. **Per-developer отчёт**: PDF экспорт «портфель проектов + leads + commission» для отправки самому застройщику.

---

## 7. РЕКОМЕНДАЦИИ ПО АРХИТЕКТУРЕ

| Что | Решение |
|---|---|
| Дублирование offplan/newbuilds | Сделать `/newbuilds` каноном (Dark Luxury, премиум). `/property/offplan` оставить как «лёгкий вход» из Property Hub-табов с redirect-картами. |
| `property_projects` — 90 колонок | Долгосрочно: split на 4 таблицы (`projects`, `project_inventory`, `project_juristic`, `project_landing`). Краткосрочно — TS-адаптер. |
| Pavel = solo operator | "Pavel impersonation mode" — admin-only, видит весь портал глазами выбранного devеloper'а, может править. |
| Микросайты | Phase 1: путь `/p/:slug`. Phase 2: subdomain routing. |
| Mobile vs Desktop | Принять формальное правило: <768 — mobile shell (bottom nav), 768-1024 — tablet (split-view), >1024 — desktop (sidebar+grid). Применить к каталогам недвижимости первыми. |

---

## 8. ВОПРОСЫ ДЛЯ ВАС (перед реализацией)

1. **Микросайты**: путь `/p/:slug` достаточно, или нужны subdomain (`aria.myuno.app`)?
2. **`/newbuilds` vs `/property/offplan`**: оба нужны, или сливаем в один (с редиректом)?
3. **`development_units` deprecate**: можно удалить таблицу (5 строк) или оставить под другую логику?
4. **«Pavel impersonation»**: согласны ли админ заходит «как застройщик» — это чувствительно с т.з. логирования.

