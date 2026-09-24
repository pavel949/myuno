# Roadmap

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
