
# План реорганизации Admin Panel: Unified Command Center

## Анализ текущей ситуации

### Проблемы структуры
- **7 групп в сайдбаре** с неясной логикой (Operations, Catalog, Health & Home, Services & Shops, Marketplace, Analytics & Finance, System)
- **47+ отдельных страниц** - функционал размазан
- **Дублирование аналитики** - Analytics, Finance, Leads Dashboard, User Analytics - частично пересекаются
- **Нет централизованного управления** пользователями с правами
- **Отсутствует мониторинг** системных ошибок и производительности

### Что нужно добавить
- Управление всеми пользователями и правами
- Мониторинг ошибок и производительности системы
- Единая точка входа к любым данным

---

## Новая архитектура: 4 мега-раздела

```text
┌─────────────────────────────────────────────────────────────────┐
│                    UNO COMMAND CENTER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DASHBOARD (/)           - Live overview, alerts, KPIs      │
│                                                                 │
│  2. CATALOG (/catalog)      - All verticals + marketplace      │
│     └─ Unified table with tabs/filters by category             │
│                                                                 │
│  3. OPERATIONS (/ops)       - Daily work center                │
│     └─ Moderation, Leads, Bookings, Tickets, Staff             │
│                                                                 │
│  4. CONTROL (/control)      - System management                │
│     └─ Users, Roles, Analytics, Finance, Settings, Logs        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Детальная структура разделов

### 1. DASHBOARD (Главная)
**Цель**: Мгновенный обзор всего + быстрые действия

| Блок | Содержимое |
|------|------------|
| **Live Stats** | Онлайн пользователи, активные сессии, заказы сегодня |
| **KPI Row** | Users, Providers, Bookings, GMV с динамикой |
| **Alerts Panel** | Срочное: модерация, просроченные заказы, ошибки |
| **Quick Actions** | +Провайдер, +Объект, Импорт данных |
| **Verticals Grid** | Компактная сетка всех 19 вертикалей с counts |
| **Recent Activity** | Последние действия в системе |

### 2. CATALOG (Каталог)
**Цель**: Единая точка управления всем контентом

**Структура страницы**:
```text
┌────────────────────────────────────────────┐
│ [Фильтры]  Тип: [▼ All] Статус: [▼ All]   │
│            Поиск: [_______________] 🔍      │
├────────────────────────────────────────────┤
│ Tabs: Services | Properties | Products     │
├────────────────────────────────────────────┤
│                                            │
│  ┌─────┬──────────┬─────────┬───────────┐ │
│  │ ID  │ Name     │ Category│ Status    │ │
│  ├─────┼──────────┼─────────┼───────────┤ │
│  │ ... │ ...      │ Yachts  │ Active    │ │
│  │ ... │ ...      │ Tours   │ Pending   │ │
│  └─────┴──────────┴─────────┴───────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

**Категории объединены**:
- **Services**: Yachts, Tours, Properties, Restaurants, Salons, Clinics, Gyms, Events, Education, Legal, Pets, Cleaning, Babysitters, Flowers, Pharmacies, Insurance, Water Activities, Transport
- **Properties**: Owner Properties, Rentals
- **Products**: Marketplace товары

### 3. OPERATIONS (Операции)
**Цель**: Центр ежедневной работы

| Таб | Функционал |
|-----|------------|
| **Moderation** | Pending content + approve/reject |
| **Leads** | Воронка заявок + назначение менеджеров |
| **Bookings** | Все заказы со статусами |
| **Tickets** | Обращения клиентов |
| **Staff** | Управление исполнителями |

### 4. CONTROL (Управление)
**Цель**: Полный контроль системы

**Табы**:

| Таб | Содержимое |
|-----|------------|
| **Users** | Все пользователи с ролями, сегментами, активностью |
| **Roles** | Управление правами: Admin, UNO Team, Staff, Vendors |
| **Analytics** | Revenue, Users, Bookings charts - объединённые |
| **Finance** | GMV, Commissions, Payouts в одном месте |
| **System** | Справочники, города, переводы, настройки |
| **Logs** | Системные логи, ошибки, производительность |

---

## Новые компоненты

### A. UnifiedCatalogPage
Заменяет 19 отдельных страниц вертикалей одной умной таблицей:
- Фильтр по типу (вертикали)
- Фильтр по статусу
- Inline редактирование
- Bulk actions

### B. ControlCenterPage  
Объединяет Users + Roles + Analytics + Finance + System:
- Tabs для переключения контекста
- Единый поиск по всему

### C. SystemHealthPanel
Новый виджет для Dashboard:
- Uptime
- Response times
- Error rate
- Active connections

### D. UserManagementTable
Новая таблица пользователей:
- Все profiles с фильтрами
- Роли и права inline
- Сегменты пользователей
- Действия: block, unblock, change role

---

## Изменения в Sidebar

**БЫЛО (7 групп, 30+ пунктов)**:
```text
Operations (6 items)
Catalog (9 items)
Health & Home (5 items)
Services & Shops (5 items)
Marketplace (4 items)
Analytics & Finance (5 items)
System (8 items)
```

**СТАНЕТ (4 раздела)**:
```text
Dashboard        ← Главная с обзором
Catalog          ← Все объекты
Operations       ← Ежедневная работа  
Control          ← Система и аналитика
```

---

## Файлы для создания/изменения

### Новые файлы
1. `src/pages/admin/AdminUnifiedCatalog.tsx` - единый каталог
2. `src/pages/admin/AdminControlCenter.tsx` - центр управления
3. `src/components/admin/catalog/UnifiedCatalogTable.tsx`
4. `src/components/admin/control/UserManagementTab.tsx`
5. `src/components/admin/control/RolesManagementTab.tsx`
6. `src/components/admin/control/SystemHealthTab.tsx`
7. `src/components/admin/dashboard/SystemHealthPanel.tsx`
8. `src/hooks/useUnifiedCatalog.ts` - универсальный хук для всех вертикалей
9. `src/hooks/useSystemHealth.ts` - мониторинг системы

### Изменяемые файлы
1. `src/components/admin/AdminSidebar.tsx` - новая структура навигации
2. `src/pages/admin/AdminDashboard.tsx` - добавить System Health
3. `src/pages/admin/OperationsHub.tsx` - расширить как центр операций
4. `src/components/layout/AnimatedRoutes.tsx` - новые роуты

---

## Техническая реализация

### UnifiedCatalogTable - универсальная таблица
```typescript
interface CatalogConfig {
  type: 'services' | 'properties' | 'products';
  table: string;
  columns: ColumnDef[];
  filters: FilterConfig[];
}

const catalogConfigs: Record<string, CatalogConfig> = {
  yachts: { type: 'services', table: 'yachts', ... },
  tours: { type: 'services', table: 'tours', ... },
  // ... all 19 verticals
};
```

### SystemHealth - мониторинг
Данные из:
- `platform_metrics` - KPIs
- Supabase Analytics API - логи ошибок
- Edge Function для проверки uptime

---

## Порядок реализации

1. **Фаза 1**: ✅ Новый Sidebar с 4 разделами - ВЫПОЛНЕНО
2. **Фаза 2**: ✅ UnifiedCatalog - объединение вертикалей - ВЫПОЛНЕНО  
3. **Фаза 3**: ✅ ControlCenter - управление и аналитика - ВЫПОЛНЕНО
4. **Фаза 4**: SystemHealth - мониторинг (следующий шаг)
5. **Фаза 5**: Удаление устаревших страниц

---

## Результат

| Метрика | Было | Станет |
|---------|------|--------|
| Групп в sidebar | 7 | 4 |
| Пунктов меню | 42 | 4 + подразделы |
| Страниц вертикалей | 19 | 1 (unified) |
| Страниц аналитики | 4 | 1 (control) |
| Клики до любого объекта | 2-3 | 1-2 |

**Ключевые улучшения**:
- Из любой точки доступ к любым данным за 1-2 клика
- Единая таблица для всех объектов с фильтрами
- Мониторинг системы и ошибок
- Централизованное управление пользователями и правами
- Максимум информации без избыточности
