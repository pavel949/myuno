

## Аудит последовательности навигации

### Найденные проблемы

**1. Массовое использование хардкод-путей вместо APP_ROUTES**
- **35 компонентов** используют `navigate(APP_ROUTES.*)` — правильно
- **~260+ файлов** используют `navigate('/...')` с хардкод-строками — нарушение стандарта
- Примеры: `navigate('/owner')`, `navigate('/mc/operations')`, `navigate('/auth')`, `navigate('/discover')`, `navigate('/beauty')` и сотни других
- Это создаёт риск 404 при рефакторинге маршрутов

**2. Непоследовательный паттерн кнопки "Назад"**
- 35 страниц используют стандартный `<BackButton>` компонент (правильно)
- ~28 страниц используют инлайн `navigate(-1)` с разными иконками (ArrowLeft, ChevronLeft, ArrowDown rotated) — непоследовательно
- Некоторые страницы вообще не имеют навигации назад

**3. Разные иконки для одного действия**
- Кнопка "назад": используются `ChevronLeft`, `ArrowLeft`, `ArrowDown` (повёрнутый) — должна быть одна
- `BackButton` компонент использует `ChevronLeft` — это стандарт, остальные нужно привести к нему

**4. AdaptiveBottomNav использует хардкод-пути**
- `guestNavItems`, `ownerNavItems`, `vendorNavItems` — все пути захардкожены (`'/discover'`, `'/market'`, `'/account'`)
- `MCMobileNav` — частично использует `APP_ROUTES`, но `'/mc/modules'` захардкожен

**5. PageTransition работает только для tab-навигации**
- Slide-анимация работает для переключения между табами BottomNav
- Для перехода вглубь (list → detail) анимация одинаковая (fade up/down) — нет ощущения "вперёд/назад"

---

### План исправлений

#### Фаза 1: Стандартизация кнопки "Назад" (приоритет)
Заменить все инлайн `navigate(-1)` + custom back buttons на `<BackButton>` из `@/components/uno/BackButton` в ~28 файлах. Это обеспечит:
- Единый внешний вид (ChevronLeft, округлая кнопка)
- Надёжный fallback вместо `navigate(-1)` (который может вывести за пределы приложения)
- Правильный `fallbackPath` для каждой страницы

**Файлы для обновления**: Search.tsx, DeveloperDetail.tsx, ProjectDetail.tsx, QuickExpense.tsx, OwnerAutoMessaging.tsx, KnowledgeHub.tsx, WishlistPage.tsx, TravelInsurance.tsx, ServiceFunctionOrder.tsx, JuristicRequestsPage.tsx, OwnerTransparencyDashboard.tsx и другие.

#### Фаза 2: Миграция на APP_ROUTES
Поэтапно заменить хардкод-пути на `APP_ROUTES.*` в компонентах навигации:
1. **AdaptiveBottomNav** — все navItems
2. **QuickActionsBar**, **OwnerQuickActions**, **AdminQuickActionsGrid** — все action paths
3. Остальные компоненты — постепенно по модулям

#### Фаза 3: Push/Pop анимации для глубокой навигации
Добавить в `useNavigationDirection` определение глубины навигации (list→detail = "forward", detail→list = "backward") для соответствующих slide-анимаций, создающих ощущение стека.

---

### Техническая секция

```text
Текущее состояние:
┌─────────────────────────┬───────┬──────────┐
│ Паттерн                 │ Файлы │ Статус   │
├─────────────────────────┼───────┼──────────┤
│ navigate(APP_ROUTES.*)  │  ~35  │ ✅ OK    │
│ navigate('/hardcoded')  │ ~260  │ ❌ Fix   │
│ <BackButton>            │  ~35  │ ✅ OK    │
│ navigate(-1) inline     │  ~28  │ ❌ Fix   │
│ BottomNav hardcoded     │   4   │ ❌ Fix   │
└─────────────────────────┴───────┴──────────┘
```

Фазы 1 и 2 — основная работа. Фаза 3 — улучшение UX.

