
# План улучшения Role Switching в myUNO

## Анализ текущей архитектуры

### Как это работает у крупных маркетплейсов (Airbnb)
Airbnb использует паттерн **"Switch to Hosting / Traveling"**:
- В меню профиля есть чёткий пункт переключения
- При нажатии меняется весь контекст: навигация, дашборд, функционал
- Общие настройки (профиль, уведомления) доступны из любого режима
- Роль хранится на сервере, синхронизируется между устройствами

### Текущее состояние myUNO

| Компонент | Где используется | Статус |
|-----------|------------------|--------|
| `RoleContextSwitcher` | Admin Header | ✅ Работает |
| `RoleSwitchMenu` | Profile Page | ✅ Работает |
| `RoleSwitcher` | Не используется | ⚠️ Дубликат |
| `AdaptiveBottomNav` | Everywhere | ✅ Работает |
| `RoleGuard` | Route protection | ✅ Правильная логика |

### Выявленные проблемы

1. **Дублирование компонентов**
   - 3 разных компонента для переключения ролей
   - `RoleSwitcher` использует `localStorage`
   - `RoleContextSwitcher` использует DB через `useUserContext`
   - Потенциальный конфликт синхронизации

2. **Непоследовательный доступ к свитчеру**
   - В Guest режиме свитчер только на странице Profile
   - В Owner/Vendor layouts - нет видимого свитчера
   - В Admin - есть в header

3. **Branding issues**
   - Местами "UNO" вместо "myUNO"

---

## Что НЕ требует изменений (уже правильно)

- ✅ Guards проверяют наличие роли, не активную роль (Airbnb-паттерн)
- ✅ Раздельные дашборды с уникальным функционалом
- ✅ Адаптивная нижняя навигация по контексту
- ✅ Хранение роли в БД (`user_active_context`)
- ✅ Архитектура масштабируемая

---

## План улучшений

### Фаза 1: Унификация компонентов

**Удалить дубликаты:**
- Удалить `src/components/uno/RoleSwitcher.tsx` (неиспользуемый)
- Оставить `RoleContextSwitcher` как единый source of truth
- Обновить `RoleSwitchMenu` чтобы использовал `useUserContext`

**Файлы:**
- Удалить: `src/components/uno/RoleSwitcher.tsx`
- Изменить: `src/components/profile/RoleSwitchMenu.tsx`
- Изменить: `src/hooks/useUserRoles.ts` - убрать `useActiveRole` с localStorage

### Фаза 2: Добавить свитчер во все layouts

**Добавить свитчер в Header всех layouts:**

| Layout | Файл | Изменение |
|--------|------|-----------|
| AppHeader (Guest) | `src/components/layout/AppHeader.tsx` | +RoleContextSwitcher |
| OwnerLayout Header | `src/components/owner/OwnerLayout.tsx` | +RoleContextSwitcher |
| VendorLayout Header | `src/components/vendor/VendorLayout.tsx` | +RoleContextSwitcher |

### Фаза 3: Улучшить UX свитчера

**Визуальные улучшения:**
- Добавить индикатор текущей роли в профильный аватар
- Показывать badge с количеством доступных ролей
- Добавить анимацию перехода между дашбордами

### Фаза 4: Branding consistency

**Заменить "UNO" на "myUNO":**
- TeamDashboard.tsx (3 места)
- Любые оставшиеся упоминания

---

## Техническая реализация

### 1. Обновлённый RoleSwitchMenu
```typescript
// Использует useUserContext вместо дублирования логики
import { useUserContext } from '@/hooks/useUserContext';

export function RoleSwitchMenu() {
  const { availableRoles, activeRole, switchContext } = useUserContext();
  // ... единая логика
}
```

### 2. Удаление localStorage-логики
```typescript
// useUserRoles.ts - убрать useActiveRole()
// Вся логика активной роли теперь в useUserContext
```

### 3. Универсальный Header с Role Switcher
```typescript
// AppHeader.tsx
import { RoleContextSwitcher } from '@/components/uno/RoleContextSwitcher';

// Показывать только для пользователей с >1 роли
{availableRoles.length > 1 && <RoleContextSwitcher compact />}
```

---

## Результат

| Метрика | Было | Станет |
|---------|------|--------|
| Компонентов для переключения | 3 | 1 |
| Источников правды | 2 (localStorage + DB) | 1 (DB) |
| Layouts со свитчером | 1 (Admin) | 4 (все) |
| Клики до переключения | 2-3 | 1 |

**Ключевые улучшения:**
- Единый компонент, единый источник данных
- Свитчер доступен из любого layout одним кликом
- Синхронизация между устройствами через БД
- Консистентный branding "myUNO"

