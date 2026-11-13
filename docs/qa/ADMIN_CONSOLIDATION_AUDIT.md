# Admin consolidation audit — 2026-11-13

Scope of the original audit: 92 page files in `src/pages/admin`, 103 `/admin*` routes, 73 menu links. At audit time no code, data or permissions had changed. Visit counts per admin page were not available (not tracked separately) — usage marked UNKNOWN.

Implementation status: Pavel approved all recommendations on 2026-11-13. The completed implementation and verification evidence are recorded in `docs/qa/ADMIN_CONSOLIDATION_IMPLEMENTATION_2026_11_13.md`.

## Routes without a menu entry (24)
Redirects already (keep as legacy aliases): /admin/bouquets, /investor-demo, /leads, /lifeos, /marketplace/*, /moderation, /pitch-deck, /tours, /user-analytics.
Real pages hidden from menu: /admin/activities, /analytics, /analytics/events, /claims, /diagnostics/google-maps, /intake-configs, /lead-configs, /restaurants/data-quality, /services, /settings/google-maps, /thai-business, /transfers/sla.

## Decision table (recommendation → needs approval)

| # | Pages | Evidence | Recommendation |
|---|---|---|---|
| D1 | Сегодня (/admin), Центр управления (/control, 25 lines, links only), Операции (/operations: orders+tickets+prospects) | Control Center is a link hub duplicating the menu | Remove /control from menu, redirect → /admin; keep Операции |
| D2 | Аналитика (/analytics, analytics_events), Метрики привлечения, Метрики инвесторов (orders/bookings GMV), Маркетинг | Three overlapping KPI pages | One «Аналитика» page with tabs: Посещения · Привлечение · Выручка · Маркетинг; old URLs redirect |
| D3 | Единый каталог, Мастер-каталог (categories), Таксономия, Справочники, Услуги (/services, not in menu) | Unified Catalog wraps others | «Каталог» = Unified Catalog with tabs Категории · Таксономия · Справочники; /services keep, add to menu under Каталог or hide |
| D4 | ~20 vertical pages (салоны, клиники, яхты, цветы, питомцы, аптеки, спортзалы, няни, страхование, образование, водные активности, экскурсии, рестораны, магазины, клининг, мероприятия) | Same pattern: list of providers per vertical | Keep pages; menu → one collapsible «Вертикали» group, sorted A–Я |
| D5 | Входящие, Консультации, CRM, Лиды новостроек, Тикеты | Different sources (consultations, nb_leads, support_tickets) | Keep; Входящие stays single entry point; Лиды новостроек moves under Новостройки |
| D6 | Настройки заявок (lead-configs), Настройки приёма (intake-configs) | Both hidden, similar config editors (sys_lead_configs / sys_intake_configs) | One «Настройки форм» page with two tabs, in Настройки |
| D7 | Новостройки (/newbuilds), Консоль новостроек (KPI only, 81 lines), Проекты, Застройщики | Console = KPI header of Новостройки | Merge Console KPIs into top of Новостройки; keep Проекты, Застройщики as tabs |
| D8 | Добавить (/add), Быстрые объявления, Массовая публикация, Импорт данных, Приём (/intake), Контент партнёров | Six entry points for adding data | One «Добавление данных» hub (/admin/add) linking all; remove the rest from top menu |
| D9 | Трансферы, Операторы трансферов, SLA (hidden), Транспорт (59 lines) | One domain split in 4 | Трансферы page with tabs Заказы · Операторы · SLA · Транспорт |
| D10 | Настройки Google Maps, Диагностика Google Maps | Both hidden | One page with tabs, under Система |
| D11 | Тайский бизнес (/thai-business, hidden) | GA module, moderation needed | Add to menu «На проверке» |
| D12 | QA Test Runner, Корзина, API-ключи | Technical tools | Keep under «Система» only |
| D13 | Mixed RU/EN titles: «Newbuilds Console», «Taxonomy Manager», «Airport Transfers», «Аналитика кликов и просмотров» | Inconsistent copy | Rename to plain RU/EN pairs |

No page is proposed for deletion: deletion needs usage evidence that is UNKNOWN.
