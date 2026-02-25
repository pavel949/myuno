

# Owner Transparency Portal — "Мой объект глазами собственника"

## Проблема
Собственники живут за рубежом и не доверяют УК из-за отсутствия прозрачности. Им нужно видеть, что происходит с их объектом, без необходимости звонить или просить отчёты.

## Решение
Создать **Owner Transparency Dashboard** — read-only портал для собственников, где они в реальном времени видят всю деятельность УК по управлению их объектом.

```text
┌─────────────────────────────────────────────┐
│  /owner/transparency/:propertyId            │
│                                             │
│  ┌─── Summary Cards ───────────────────┐    │
│  │ Revenue  │ Expenses │ Occupancy │ ★  │    │
│  └──────────────────────────────────────┘    │
│                                             │
│  ┌─── Activity Feed (real-time) ───────┐    │
│  │ 🟢 14:30 Booking confirmed #B123    │    │
│  │ 🔧 12:00 Cleaning completed         │    │
│  │ 💰 10:15 Expense ฿2,500 (cleaning)  │    │
│  │ 📸 09:00 Inspection photos uploaded  │    │
│  │ 📊 Yesterday - Monthly report ready  │    │
│  └──────────────────────────────────────┘    │
│                                             │
│  ┌── Tabs ─────────────────────────────┐    │
│  │ Финансы │ Бронирования │ Документы  │    │
│  │ Задачи  │ Календарь    │ Отчёты    │    │
│  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Что увидит собственник

1. **Сводка по объекту** — доход за месяц, расходы, заполняемость, рейтинг
2. **Лента активности** — все действия УК в хронологическом порядке (новые бронирования, расходы, уборки, осмотры, изменения цен)
3. **Финансы** — доходы, расходы, баланс, чеки (read-only доступ к тому, что уже есть)
4. **Бронирования** — текущие и будущие, с именами гостей и суммами
5. **Документы** — акты, договоры, фото осмотров из Vault
6. **Отчёты** — ежемесячные отчёты УК с возможностью скачивания PDF

## Ключевой UX-принцип
> Собственник НЕ управляет — он НАБЛЮДАЕТ. Интерфейс полностью read-only, но информативный. Все данные берутся из тех же таблиц, что использует УК.

---

## Технический план

### 1. Новая роль делегата: `owner_readonly`
Добавить роль в `property_delegates` специально для собственников:
- Permissions: `{ view: true, financials: true, bookings: true, edit: false, maintenance: false }`
- УК приглашает собственника по email, собственник принимает и получает доступ

### 2. Activity Log — автоматическая запись действий
Создать триггерную функцию в БД, которая при INSERT/UPDATE в ключевые таблицы автоматически пишет запись в `property_activity_log`:
- `property_bookings` — новое бронирование, отмена, изменение
- `property_financials` — новый доход/расход
- `property_operational_tasks` — задача создана/завершена
- `property_service_requests` — запрос на обслуживание
- `inventory_inspections` — осмотр проведён

### 3. Новая страница: `/owner/transparency/:propertyId`
Компонент `OwnerTransparencyDashboard`:
- Summary KPI cards (revenue, expenses, occupancy, rating)
- Real-time activity feed из `property_activity_log`
- Табы: Финансы, Бронирования, Документы, Задачи, Отчёты
- Все данные read-only, привязаны к конкретному `property_id`

### 4. Entry point для собственников
- В "My Property" (`/property/my`) добавить карточку "Мои управляемые объекты"
- Для пользователей с активными делегациями показывать список объектов с переходом в Transparency Dashboard
- Push-уведомления (in-app) при важных событиях (новая бронь, расход > порога)

### 5. Маршрутизация и безопасность
- Новый маршрут в `AnimatedRoutes.tsx`
- Проверка доступа через `property_delegates` — только `active` делегаты с `view: true`
- RLS-политики на `property_activity_log` для делегатов

### Файлы для создания/изменения:

| Файл | Действие |
|------|----------|
| `supabase/migrations/...activity_triggers.sql` | Триггеры для автозаписи в activity_log |
| `src/pages/owner/OwnerTransparencyDashboard.tsx` | Новая страница — основной портал собственника |
| `src/components/owner/transparency/ActivityFeed.tsx` | Компонент ленты активности |
| `src/components/owner/transparency/OwnerKPISummary.tsx` | Сводные карточки |
| `src/components/owner/transparency/OwnerFinanceTab.tsx` | Read-only финансы |
| `src/components/owner/transparency/OwnerBookingsTab.tsx` | Read-only бронирования |
| `src/hooks/usePropertyDelegates.ts` | Добавить роль `owner_readonly` |
| `src/pages/property/PropertyMySection.tsx` | Добавить секцию "Управляемые объекты" |
| `src/components/layout/AnimatedRoutes.tsx` | Новый маршрут |
| `src/components/layout/pageRegistry.ts` | Регистрация страницы |

