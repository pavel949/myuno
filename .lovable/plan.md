# SuperApp Home (mobile) — анализ и план реализации

## 1. Что сейчас на главной (`/` после auth → `Index.tsx`)

| Зона | Компонент | Стиль |
|---|---|---|
| Hero | `HeroGreeting` | Текстовый, navy-gradient |
| Платежи | `PendingPaymentsChip` | 1 чип |
| Ситуация | `ActiveSituation` | Текстовая карточка |
| Bento | `PrimaryGrid` | 1 hero CTA + 3 mini tile (хардкод) |
| Now | `NowInPhuket` | Ambient полоса |
| News | `OfficialNews` | Список новостей |
| "Все приложения" | Кнопка → `AppDrawer` | Drawer с полным каталогом |

Проблема: на мобильном это **GOV-style текстовый стек**, не суперапп. Пользователь должен три раза тапнуть, чтобы попасть в нужный мини-апп. Иконок мало, плотность низкая, ничего не персонализировано под роль/ситуацию.

## 2. Чего нужно достичь
Эстетика — **WeChat + Госуслуги**: civic-tone типографика и палитра (DS 2.1, как у нас) + плотная сетка иконок мини-апплетов с короткими подписями. Каждая иконка ранжируется по:
- активной роли (`useLifeOSRole` → 7 ролей),
- активным personas (`useUserPersonas`),
- активной ситуации (последняя из `lifeos_routes`/`user_active_context`),
- истории (`view_history` / `favorites`).

У нас уже есть SSOT для этого: **`FLAT_SERVICES`** (≈68 сервисов) с тегами `personaTags`, `jtbdClusters`, `lifecycleStages`, `roleTags`, `situationCodes`, `icon`, `labelRu/En`. Никаких новых таблиц — только композиция.

## 3. Целевая структура мобильной главной

```text
┌────────────────────────────────────────┐
│  HeroLite        ⏎ роль · место · ⌘K   │  ← компактная шапка
├────────────────────────────────────────┤
│  📍 Status strip — viza, pending, SOS  │  ← Гос-уровень: обязательства
├────────────────────────────────────────┤
│  🎯 "Для вас сейчас" — 8 иконок 4×2    │  ← главный icon-grid (PersonalGrid)
│      [icon] подпись + 1 слово-контекст │
├────────────────────────────────────────┤
│  Ситуация: <active>                    │
│  6 иконок мини-аппов под эту ситуацию  │  ← SituationGrid
├────────────────────────────────────────┤
│  Кластер «Жизнь» — 8 иконок · ➜       │  ← ClusterRail (свайп)
│  Кластер «Документы» — 6 иконок · ➜   │
│  Кластер «Управление» — N · ➜         │  ← скрыт ролью если guest
├────────────────────────────────────────┤
│  🏛 Официально — 3 новости TAT/PRD     │  ← OfficialNews (как есть)
├────────────────────────────────────────┤
│  Все приложения  (полный каталог)  ➜  │  ← AppDrawer
└────────────────────────────────────────┘
```

Каждая иконка-тайл: 72×88px, square, иконка 28px navy, подпись 2 строки 12px, статус-точка для «soon»/«live». 4 колонки на 375px, 6 на ≥600px.

## 4. План реализации (4 волны, один PR)

### Wave 1 — Ранжирующий движок
Файл (новый): `src/lib/superapp/rankServices.ts`

Чистая функция:
```
rankServices(
  services: FlatService[],
  ctx: {
    role: LifeOSRole;
    personas: UserPersona[];
    activeSituationCode?: string;
    recentIds?: string[];
  }
): FlatService[]
```
Скор: `+3` за совпадение personaTag, `+5` за situationCode, `+2` за roleTag, `+1` за recent, `−10` если `status==='soon'` и пользователь — guest. Стабильная сортировка по id.

### Wave 2 — AppTile + сетки
Новые компоненты (`src/components/superapp/`):

- `AppTile.tsx` — иконка + 1-2-строчная подпись + статусная точка. Touch-target 64×80, civic-style: сквейр (radius 0), 1px border-border, hover: border-primary.
- `IconGrid.tsx` — 4-col mobile / 6-col tablet, optional title + count + «Все».
- `PersonalGrid.tsx` — обёртка: использует `rankServices` для top-8.
- `SituationGrid.tsx` — обёртка: берёт активную ситуацию, фильтрует `FLAT_SERVICES` по `situationCodes`.
- `ClusterRail.tsx` — горизонтальный свайп иконок для одного кластера, role-gated через тот же `ROLE_HIDDEN_CLUSTERS`.

### Wave 3 — Замена композиции `Index.tsx`
- `HeroGreeting` → новый компактный `HeroLite` (одна строка приветствия + локация + кнопка поиска), -50% высоты.
- `PrimaryGrid` (1+3 bento) → `PersonalGrid` (4×2 icon-grid).
- Между `ActiveSituation` и `NowInPhuket` вставить `SituationGrid` и три `ClusterRail` (по primary clusters роли из `ROLE_VISIBLE_CLUSTERS`).
- Кнопка «Все приложения» остаётся внизу.
- `WorkspaceHomeBanner`, `PendingPaymentsChip`, `OfficialNews`, `NowInPhuket` — без изменений.

### Wave 4 — Доводка `/discover` под ту же эстетику
Файл: `NavigatorPageV3.tsx`

В каждой `NavigatorClusterSection` добавить опциональный `mode="icons"` для top-6 мини-аппов из этого кластера через `IconGrid`, ниже — текстовый list ситуаций. Это даёт скан-эффект «вижу иконки → понимаю что внутри», не ломая civic-стиль.

## 5. Acceptance criteria
- На 375px главная содержит ≥3 явных icon-grid секции, ≥20 кликабельных мини-аппов без открытия drawer.
- Top-8 PersonalGrid реально меняется при смене роли в RoleSheet (тест: guest vs owner — разные иконки).
- Все иконки используют семантические токены (`text-foreground`, `bg-card`, `border-border`).
- Нет горизонтального скролла; touch-target ≥44px.
- Guest не видит кластер Manage/Build/Invest ни в `ClusterRail`.
- Все ссылки ведут на существующие маршруты (use `APP_ROUTES`), 0 → /<uuid>.

## 6. Технические детали
- Никаких новых таблиц/RPC — всё на `FLAT_SERVICES` (SSOT).
- Lazy-load иконок не нужен — lucide-react уже tree-shake.
- Один framer-motion fade-in на mount PersonalGrid, ничего более.
- Сохраняем существующий AppDrawer как «полный каталог» — не дублируем.

**Рекомендую:** делать все 4 волны в одном PR. Если разбить — после Wave 2 главная окажется с двумя несвязными секциями (старый PrimaryGrid + новый PersonalGrid) и UX станет хуже, чем сейчас.
