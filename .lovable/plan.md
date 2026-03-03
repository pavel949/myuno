

## Концепция: Единый личный кабинет с ролевыми модулями

### Проблема

Сейчас три отдельных кабинета — `/account` (пользователь), `/mc` (УК), `/vendor` (провайдер) — каждый со своими настройками, профилем, навигацией. У пользователя с несколькими ролями нет единой точки входа. Личные данные, заказы, настройки продублированы или разбросаны.

### Архитектурный принцип

**`/account` = единственный личный кабинет для ВСЕХ ролей.**
`/mc` и `/vendor` остаются рабочими пространствами (workspace), но НЕ содержат личных настроек.

```text
/account                    ← Личный кабинет (единый)
  ├── Профиль, аватар, контакты
  ├── Настройки (тема, язык, валюта, уведомления)
  ├── Заказы и брони
  ├── Кошелёк и платежи
  ├── Документы
  └── Ролевые модули (динамические)
       ├── [owner]  → Мои объекты, Портал владельца
       ├── [vendor] → Мои сервисы, Аналитика
       └── [mc]     → Ссылка на workspace

/mc                         ← Рабочее пространство УК (без личных настроек)
/vendor                     ← Рабочее пространство провайдера (без личных настроек)
```

### Десктоп Layout

```text
┌─────────────────────────────────────────────────────────────┐
│  AppHeader                                                   │
├──────────┬──────────────────────────────────────────────────┤
│ Sidebar  │  Content Area (full width)                       │
│ (260px)  │                                                  │
│ sticky   │  ┌────────────────────────────────────────────┐  │
│          │  │ Active Stay / Context Banner               │  │
│ Avatar   │  └────────────────────────────────────────────┘  │
│ Name     │                                                  │
│ Role     │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│          │  │ Orders   │ │ Wallet   │ │ Favorites│        │
│ ──────── │  │ (count)  │ │ (balance)│ │ (count)  │        │
│ Nav      │  └──────────┘ └──────────┘ └──────────┘        │
│  Orders  │                                                  │
│  Wallet  │  ┌────────────────────────────────────────────┐  │
│  Favs    │  │ Quick Actions (grid 4x2)                  │  │
│  Docs    │  └────────────────────────────────────────────┘  │
│  Referral│                                                  │
│          │  ┌─────────────────┐ ┌────────────────────────┐  │
│ ──────── │  │ Recent Orders   │ │ Recommendations        │  │
│ Roles    │  │ (last 5)        │ │ (personalized)         │  │
│  Owner → │  └─────────────────┘ └────────────────────────┘  │
│  MC →    │                                                  │
│  Vendor→ │  ┌────────────────────────────────────────────┐  │
│ ──────── │  │ Role-specific widgets                      │  │
│ Settings │  │ (Owner: properties | Vendor: services)     │  │
│  Theme   │  └────────────────────────────────────────────┘  │
│  Lang    │                                                  │
│  Notif.  │                                                  │
│ ──────── │                                                  │
│ Log out  │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Как избежать дублирования

| Что | Где живёт | MC/Vendor workspace |
|---|---|---|
| Профиль, аватар, имя | `/account` sidebar | Показывает мини-аватар, ссылка на `/account` |
| Тема, язык, валюта | `/account` quick settings | НЕ дублируется |
| Уведомления (настройки) | `/account` → Notifications | НЕ дублируется |
| Заказы/брони | `/account` → Orders | НЕ дублируется |
| Кошелёк | `/account` → Wallet | НЕ дублируется |
| Документы | `/account` → Documents | MC: свои доки через CRM Vault |
| Мои объекты | `/account` role widget | `/mc` — операционное управление |
| Мои сервисы | `/account` role widget | `/vendor` — полное управление |

### Ключевые компоненты

1. **`AccountSidebar.tsx`** — Sticky sidebar: аватар, навигация, ролевые ссылки, quick settings (тема/язык/валюта), logout
2. **`AccountQuickSettings.tsx`** — Компактные переключатели в sidebar (theme toggle, language select, currency select)
3. **`AccountStatsBar.tsx`** — 3 карточки-счётчика (активные заказы, баланс, избранное)
4. **`AccountRoleWidgets.tsx`** — Динамический блок: показывает виджеты в зависимости от ролей пользователя (owner → мини-список объектов, vendor → мини-статистика сервисов)
5. **Рефакторинг `UserAccountDashboard.tsx`** — Full-width layout `max-w-[1536px]`, sidebar + main grid на `lg+`, стек на мобайле

### Мобайл

Sidebar скрыт. Профиль наверху → Quick Actions → Active Stay → Stats → Orders → Role widgets → Menu → Settings кнопка → Logout. Тот же контент, стеком.

### Изменяемые файлы

| Файл | Действие |
|---|---|
| `UserAccountDashboard.tsx` | Полный рефакторинг layout |
| Новый: `AccountSidebar.tsx` | Sidebar компонент |
| Новый: `AccountQuickSettings.tsx` | Inline settings |
| Новый: `AccountStatsBar.tsx` | Счётчики-карточки |
| Новый: `AccountRoleWidgets.tsx` | Ролевые виджеты |
| `AccountFlatMenu.tsx` | Адаптация для sidebar |
| `QuickActionsPanel.tsx` | Desktop: grid layout |
| `PersonalRecommendations.tsx` | Desktop: multi-column grid |

