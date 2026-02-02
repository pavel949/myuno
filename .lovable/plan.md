
# Рекомендация: Единый User Dashboard

## Анализ текущей ситуации

У тебя сейчас **3 пересекающиеся страницы** для пользователя:

| Страница | Роут | Назначение |
|----------|------|------------|
| **Profile.tsx** | `/profile` | Настройки аккаунта, документы, меню |
| **UserAccountDashboard.tsx** | `/account` | Обзор: профиль + заказы + роли |
| **Bookings.tsx** | `/bookings` | Полный список бронирований |

**Проблема**: UserAccountDashboard частично дублирует Profile и Bookings, но при этом недостаточно функционален для полноценного dashboard.

---

## Моя рекомендация

### Объединить `/account` и улучшить как главную точку входа

```text
/account  →  "Мой кабинет" (главный dashboard пользователя)
/profile  →  "Настройки" (редактирование данных, безопасность)
/bookings →  "Все бронирования" (детальный список)
```

**Почему так:**
1. Пользователь приходит в `/account` → видит всё важное одним взглядом
2. Детали и настройки — по ссылкам в глубину
3. Нет дублирования, чёткая иерархия

---

## Структура нового User Dashboard (`/account`)

### Визуальная архитектура

```text
┌─────────────────────────────────────────────────┐
│  Header: "Мой кабинет" + Logout                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 👤 Profile Card (avatar + name + role)  │   │
│  │     → Edit Profile                       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🏨 Active Stay (if any)                 │   │  ← Контекст текущего пребывания
│  │     Check-in: 15 Jan | Check-out: 20    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────┬──────────┬──────────┐            │
│  │ Bookings │  Wallet  │ Favorites│            │  ← Stats Bar (3 ключевые метрики)
│  │    3     │  ฿1,500  │    12    │            │
│  └──────────┴──────────┴──────────┘            │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 📦 Upcoming (предстоящие)               │   │
│  │   → Tour: Phi Phi Islands | 18 Jan 10:00│   │
│  │   → Beauty: Massage | 19 Jan 14:00      │   │
│  │   [View All →]                          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🛒 Recent Purchases (покупки)           │   │
│  │   → Flowers bouquet | ฿890 | Delivered  │   │
│  │   → Grocery order | ฿450 | In Transit   │   │
│  │   [Order History →]                     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ⚡ Quick Services                        │   │  ← Персонализированные Quick Actions
│  │   🚕 🌸 💆 🍽️ 🎫 🚤 ⋯                     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🔧 Account Menu                          │   │  ← Компактный доступ к настройкам
│  │   Settings | Documents | Wallet | Help   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Компоненты для реализации

### Новые виджеты

| Компонент | Назначение |
|-----------|------------|
| `DashboardStatsBar` | 3 метрики: активные бронирования, баланс, избранное |
| `UpcomingBookingsWidget` | Предстоящие бронирования (max 3) с таймером до события |
| `RecentPurchasesWidget` | Последние покупки из marketplace (max 3) |
| `DashboardQuickServices` | Персонализированная сетка сервисов (последние использованные) |

### Существующие компоненты (переиспользуем)

- `AccountProfileCard` → уже есть, оставляем
- `AccountActiveStay` → уже есть, оставляем  
- `AccountQuickLinks` → преобразуем в компактный `AccountMenu`

### Удаляем/упрощаем

- `AccountRolesBlock` → перенести функционал в Profile Settings
- `AccountOrdersSummary` → заменить на `UpcomingBookingsWidget` + `RecentPurchasesWidget`

---

## Техническая реализация

### Файловая структура

```text
src/components/account/
├── index.ts                      # exports
├── AccountProfileCard.tsx        # (существует)
├── AccountActiveStay.tsx         # (существует)
├── AccountMenu.tsx               # НОВЫЙ - компактное меню настроек
├── DashboardStatsBar.tsx         # НОВЫЙ - 3 метрики
├── UpcomingBookingsWidget.tsx    # НОВЫЙ - предстоящие бронирования
├── RecentPurchasesWidget.tsx     # НОВЫЙ - последние покупки
└── DashboardQuickServices.tsx    # НОВЫЙ - персонализированные сервисы
```

### Источники данных

```typescript
// DashboardStatsBar
const stats = await supabase.rpc('get_user_dashboard_stats', { user_id });
// Returns: { active_bookings: 3, wallet_balance: 1500, favorites_count: 12 }

// UpcomingBookingsWidget  
const { data } = await supabase
  .from('bookings')
  .select('*, booking_items(*)')
  .eq('user_id', user.id)
  .in('status', ['confirmed', 'pending'])
  .gte('scheduled_at', new Date().toISOString())
  .order('scheduled_at', { ascending: true })
  .limit(3);

// RecentPurchasesWidget
const { data } = await supabase
  .from('orders')
  .select('*, order_items(*)')
  .eq('user_id', user.id)
  .eq('order_type', 'product')
  .order('created_at', { ascending: false })
  .limit(3);
```

---

## Навигация после изменений

### Основной flow

```text
Home (/)
   ↓ click avatar
Account (/account) ← ГЛАВНЫЙ DASHBOARD
   ├── [Edit Profile] → /profile/edit
   ├── [Settings] → /profile/settings  
   ├── [View All Bookings] → /bookings
   ├── [Order History] → /orders/history
   ├── [Wallet] → /wallet
   └── [Quick Service] → /beauty, /tours, etc.
```

### Где показывать ссылку на Dashboard

1. **AppHeader**: Avatar → переход на `/account` (вместо `/profile`)
2. **AdaptiveBottomNav**: Иконка пользователя → `/account`
3. Старый `/profile` остаётся для глубоких настроек

---

## Что конкретно делаем

### Шаг 1: Создать новые виджеты
- `DashboardStatsBar.tsx` — 3 карточки с числами
- `UpcomingBookingsWidget.tsx` — карточки предстоящих событий
- `RecentPurchasesWidget.tsx` — карточки последних покупок
- `DashboardQuickServices.tsx` — сетка 4x2 иконок сервисов

### Шаг 2: Обновить `UserAccountDashboard.tsx`
- Заменить `AccountOrdersSummary` на новые виджеты
- Добавить `DashboardStatsBar`
- Заменить `AccountQuickLinks` на `AccountMenu` + `DashboardQuickServices`
- Убрать `AccountRolesBlock` (переносим в Settings)

### Шаг 3: Обновить навигацию
- `AppHeader`: avatar → `/account`
- Добавить breadcrumbs в `/profile` ("← Мой кабинет")

### Шаг 4: Создать RPC функцию (опционально)
- `get_user_dashboard_stats` для агрегированных метрик

---

## Итог

**Преимущества подхода:**
1. Один экран для всего важного — no hunting
2. Чёткое разделение: Dashboard (обзор) vs Profile (настройки)
3. Персонализация через Quick Services
4. Использование существующих компонентов + минимум нового кода
5. Соответствует паттерну Airbnb/Uber (dashboard первым, settings вторичны)

---

## Техническая сложность

| Компонент | Сложность | Время |
|-----------|-----------|-------|
| DashboardStatsBar | Низкая | 15 мин |
| UpcomingBookingsWidget | Средняя | 25 мин |
| RecentPurchasesWidget | Средняя | 20 мин |
| DashboardQuickServices | Низкая | 15 мин |
| Обновление навигации | Низкая | 10 мин |
| **Итого** | | **~1.5 часа** |
