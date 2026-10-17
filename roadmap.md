# Roadmap

## 2026-10-17 · Tranche 2B correction — runtime presentation
- [x] Change MCBookingsPage header/KPIs/controls/cards/bulk bar without changing business logic.
- [x] Verify RU/EN heading, overflow and isolated interactions at 375/390/430 and desktop (8/8 browser, 12/12 component tests).
- [x] Report exact runtime files, reviewed screenshots, automatic build and SHA; see docs/convergence/TRANCHE2B_UI_TESTS.md.

## 2026-10-17 · Tranche 2B isolated UI regression tests
- [x] Add synthetic RU/EN fixtures and isolated checkbox/card/bulk-confirmation tests (12/12).
- [x] Exercise the actual page with fixtures at 375/390/430; block all external requests and real writes (6/6).
- [x] Report tests, viewport evidence and source SHA without changing business behavior; see docs/convergence/TRANCHE2B_UI_TESTS.md.

## 2026-10-17 · Tranche 2A — documentation and architecture only
- [x] Create canonical connected-product blueprint, layered identity model and Rent/Buy Homes IA.
- [x] Audit current consumer Homes and PMS UX from source; distinguish proven code facts from runtime-only risks.
- [x] Cross-link PROJECT.md and convergence mapping without duplicating the blueprint.
- [x] Report exact files, evidence, SHA and smallest-blast-radius first UX implementation tranche.
- [x] No feature implementation, identity tables, CRM migration or inventory-contract reopening.

## 2026-10-17 · Remaining Tranche 1 verification (no Tranche 2)
- [ ] Obtain an independently reported typecheck result through permitted remote CI — blocked: no accessible GitHub connection/token or identified Actions repository.
- [ ] Verify the full Stripe test booking journey — blocked: no positively identified isolated test inventory or contained webhook side effects in the shared production database.
- [x] Report verification evidence and tested source SHA; see docs/convergence/TRANCHE1_REMAINING_CHECKS.md. Payment mode unchanged; Tranche 2 not started.

## 2026-10-17 · Tranche 1 correction pass (no Tranche 2)
- [x] Verify and align inventory status predicates, writers and availability; add regression coverage.
- [x] Verify Drizzle snapshot convention and replace instruction-only rollback with exact SQL.
- [x] Document transaction boundaries and exercise the assignment/hold race without production writes.
- [x] Verify quote parity and focused tests plus semantic checks; report harness build evidence.
- [ ] Standalone typecheck result — blocked by workspace policy: manual typechecks/builds are prohibited; harness supplies build log only.

## Done (2026-08-28 · architecture pass)
- [x] Security: anon доступ к `management_companies` закрыт, публичные данные через вью `management_companies_public`
- [x] 8 отсутствовавших таблиц созданы (платежи/ваучеры/лиды/CRM/трансферы)
- [x] `magnet-submit` → `property_projects`
- [x] `scripts/architecture-scan.mjs` + `npm run scan:architecture` (DB drift / routes / orphans)
- [x] `docs/canonical/architecture/ARCHITECTURE_SCAN.md`
- [x] Удалены 32 неиспользуемых модуля (Home V1 остатки, PWA-дубли, мёртвые хуки/либы)

## Next: «Phuket One-Stop Platform» transformation
1. [x] Аудит (docs/canonical/architecture/ONE_STOP_IA.md): карта существующих маршрутов/фич → новая IA (Stay / Live / Buy / Sell / Services / Own / Manage / Developers / CRM)
2. [~] Role-aware (меню гостя обновлено; переключатель ролей — существующий в меню профиля) app shell + переключатель ролей (My Phuket / Owner / Operations / Provider / Developer / Admin-CRM)
3. [x] Публичная навигация: Home · Stay · Live · Buy · Services · Explore/Map · Trips · Profile
4. [ ] Новый Home («One Phuket. One app.») + goal-first вход, премиальный 3D-hero с CSS-фолбэком и reduced-motion
5. [ ] Единый Explore/Map shell со слоями (stays / long-term / sale / newbuilds / services / POI), синхронизация карты, списка и фильтров в URL
6. [~] Entry-страницы Stay / Live / Buy / Services готовы (Sell — далее) на существующих данных
7. [ ] Рабочие пространства: Owner Hub, Operations (PMS Today/календарь/housekeeping/maintenance/rates), Provider, Developer, Admin-CRM — на существующих фичах
8. [ ] Убрать «мертвые» маршруты и дубли страниц одной сущности; пометить legacy-флоу как migration TODO
9. [ ] i18n: все новые строки в ключах, EN по умолчанию, RU/TH сохранены, без смешения языков на экране
10. [ ] Производительность и адаптивность: ленивые тяжёлые визуалы, мобильные фолбэки, отсутствие обрезанных экранов
11. [ ] Отчёт: что изменено, что сохранено, что требует миграции схемы, что функционально vs только UI

### Ограничения
- Не удалять работающую функциональность ради упрощения UI
- Не создавать «мертвые» кнопки и фейковые метрики (occupancy/ROI/рейтинги)
- Без рискованного массового переписывания БД в одном шаге — только TODO-заметки о консолидации

## 2026-10-06 · Госуслуги-копирайт и исправления
- [x] Главная: убрана стартовая заставка, первый экран переписан (заголовок, описание, кнопки «Подать заявку» / «Каталог услуг»)
- [x] Закрыт доступ к оценкам заявок и документам проектов (клининги и цены на карте открыты)
- [x] Каталог: ~70 названий разделов и услуг переписаны
- [ ] Каталог: цены и графики приёма — ждут реальных данных от Павла
- [x] Кабинет собственника: тексты виджетов главной панели
- [ ] Кабинет собственника: остальные страницы (80+) — следующий заход
- [x] Ночная сверка платежей запускается напрямую в базе (234 расхождения выявлено)
- [x] Синхронизация календаря: не отменяет уже отменённые брони и не стирает всё при пустом ответе площадки
- [x] Заполнить часы работы у 5 исполнителей (пн–сб 09:00–18:00)

## 2026-10-17 · Tranche 2B — MC bookings-list UX simplification (done)
- [x] Single primary action (New Booking); Export/sort secondary; compact KPIs.
- [x] Six status filters as bounded grid — no page-level overflow (verified 375/390/430/1280).
- [x] Checkbox selection isolated from card click (44px zone, stopPropagation, aria-labels).
- [x] Bulk actions: selected count, clear, two-step confirm; same mutations/statuses.
- [x] Backend/query/pricing/inventory logic untouched; build OK; commit d7dfb2719.
- Isolated correction checks now cover checkbox/card and stub-only bulk interactions in RU/EN; live order mutations remain deliberately untested.
