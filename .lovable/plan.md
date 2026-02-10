

## ✅ Объединение модулей Собственника и Управляющего — ВЫПОЛНЕНО

### Что сделано

1. **Создан `useMyProperties`** — единый хук, объединяющий owned + managed объекты
2. **Расширен `OwnerGuard`** — пропускает `owner`, `property_owner`, `property_manager`, `admin`
3. **Адаптивный Sidebar** — скрывает Financials/Documents/Settings для чистых управляющих
4. **Объединённый Dashboard** — секции "Мои объекты" и "Под управлением" с бейджами
5. **Календарь** — показывает все доступные объекты (owned + managed)
6. **Удалён модуль Manager** — 8 файлов, маршруты `/manager/*` → `/owner/*`
7. **`property_manager.defaultPath`** → `/owner`
8. **`PropertyThumbnailSelector`** — переведён на `PropertyReference` вместо `OwnerProperty`
