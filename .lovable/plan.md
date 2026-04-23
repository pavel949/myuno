

# Wave 13 · Pro-Shell + Reference-Screens Polish (myUNO Design v5)

Пакет `myUNO_design_5.zip` глубоко проанализирован. Большая часть Home-каноны (SignalStack, RoleSheet, ConciergeCard, NowInPhuket, ClusterHub, RoleChip, HomeTopBar) уже соответствует пакету — внедрено в Wave 12. Остаются 4 целевых улучшения, которые подтянут оставшиеся отличия.

---

## 1. Pro-Shell tabbar (Operate variant)

**Что:** в пакете `screens-core.jsx` `<TabBar variant="pro">` для проф-ролей показывает `Home · Operate · Wallet · Me` вместо `Home · Discover · Wallet · Me`.

**Где:** `src/components/nav/BottomBar.tsx` + `src/lib/nav/navigationModel.ts`.

**Реализация:**
- Добавить вариант `pro_shell` в `PRIMARY_NAV` для ролей `owner / agent / developer / provider / mc_admin` со 2-м слотом → **Operate** (`/operate` или `/owner` для текущей роли).
- Consumer-роли (tourist/resident/family) сохраняют `Discover` без изменений.
- Слот **Operate** — иконка `Briefcase`, label EN `Operate` / RU `Управление`. Активная подсветка по префиксу `/operate, /owner, /mc, /agent, /vendor`.
- Под флагом `feature_flag:pro_shell_tabbar_v1` (default OFF в `system_settings`).

**Acceptance:** Tourist видит Discover (как сейчас); Owner видит Operate; переключение роли через RoleSheet — TabBar обновляется реактивно.

---

## 2. Quick-Actions: 8-slot grid с role-tag dots

**Что:** в дизайне `QuickActions` всегда **8 элементов = 4 cols × 2 rows** с микро-точкой роли в правом верхнем углу карточки.

**Где:** `src/components/home/QuickActionsBlended.tsx` (уже есть точки), `src/components/home/PrimaryActions.tsx` (нет).

**Реализация:**
- Унифицировать `PrimaryActions.tsx`: жёсткая сетка `grid-cols-4`, 8 слотов (брать из `blendActions(personas, 8)` — расширить хук).
- Каждый слот: 32×32 icon-square + 10.5px label + role-dot 5×5px в `top-2 right-2`, цвет = `ROLE_META[role].color`.
- Если активная роль одна — точка цвета этой роли на всех слотах (не пусто, единый стиль).
- `min-h-[44px]` на всю карточку — touch-target compliance.

**Acceptance:** на Home всегда видно 8 квадратных карточек 4×2, каждая с role-точкой; mobile 375px не ломается, no horizontal scroll.

---

## 3. SectionHead унификация (Label + meta)

**Что:** в дизайне каждый блок начинается с компактного `<SectionHead title="ACTIVITY" meta="All roles · this week"/>` — 11px uppercase, letter-spacing 0.12em, muted-2 цвет, meta справа.

**Где:** новый компонент `src/components/home/SectionHead.tsx`; применить в:
- `ActivityFeed.tsx` (`Activity` / `Активность`)
- `QuickActionsBlended` / `PrimaryActions` (`For you` / `Для вас`)
- `ClusterHub` (`All services` / `Все сервисы`)
- `ConciergeCard` (`Concierge` / `Консьерж`)

**Реализация:**
- Один экспортируемый компонент `<SectionHead title meta?/>` — заменить 4 разных варианта заголовков на один canonical.
- Использовать токены `text-muted-foreground/80` + `tracking-[0.12em] text-[11px] uppercase font-semibold`.

**Acceptance:** все 4 блока на Home имеют одинаковый микро-заголовок; визуальный ритм страницы становится регулярным.

---

## 4. Role-onboarding screen (S03 reference)

**Что:** в `screens-core.jsx · S03_Roles` — вертикальный список 7 ролей с подзаголовками RU («Прилёт, аренда, впечатления»), цветной точкой 12px и checkbox 20px справа. На сегодня RoleSheet не показывает описаний и расположен горизонтально grid-2.

**Где:** `src/components/home/RoleSheet.tsx`.

**Реализация:**
- Раздел "Add a role" — переключить с `grid-cols-2` на одну колонку `flex flex-col`, добавить `description` поле в `ROLE_META` (RU + EN) и отображать вторую строку 12px muted под именем роли.
- Active-роли — оставить ordered list как сейчас, но добавить тот же sub-line с описанием.
- Длины: использовать существующие RU описания из `data.jsx`:
  - tourist: «Прилёт, аренда, впечатления»
  - resident: «Виза, жильё, ежедневные сервисы»
  - owner: «Управление недвижимостью и доходом»
  - agent: «Листинги, лиды, комиссии»
  - provider: «Витрина, брони, выплаты»
  - investor: «Pipeline, партнёры, капитал»
  - developer: «Проекты, бронирования, продажи»

**Acceptance:** Role sheet выглядит как S03 в референсе — описание под каждой ролью, единая колонка, читается без скролла на 375px при ≤7 доступных ролях.

---

## Что НЕ входит в этот pass

- **Light-luxury cream/navy theme** — это вариация tweaks-панели в дизайне (демо-режим), не canonical. Тёмная палитра остаётся прода-стандартом по `05-visual-design-system.md`.
- 20 reference screens (S01..S20) кроме Home — это Figma-референс, не инструкция переписывать существующие страницы. Точечные элементы из S04 (Home) уже частично внедрены в Wave 12.
- Migration `/operate` shell (это отдельный architecture task, см. ARCHITECTURE_V2 §08).

---

## Технические детали

**Файлы к правке:**
1. `src/lib/nav/navigationModel.ts` — добавить `pro_shell_tabbar_v1` flag handling + Operate slot
2. `src/components/nav/BottomBar.tsx` — read flag, swap слот по роли
3. `src/components/home/PrimaryActions.tsx` — 8-slot grid + role dots
4. `src/components/home/SectionHead.tsx` — **новый** canonical компонент
5. `src/components/home/ActivityFeed.tsx`, `ClusterHub.tsx`, `QuickActionsBlended.tsx`, `ConciergeCard.tsx` — заменить inline-заголовки на `<SectionHead>`
6. `src/components/home/RoleSheet.tsx` — single-column layout, descriptions
7. `src/lib/roleBlend.ts` — добавить `description: { ru, en }` в `ROLE_META`
8. `docs/canonical/CHANGELOG.md`, `src/lib/appVersion.ts` (3.55.0), `public/version.json`

**Migration:** `INSERT INTO system_settings (key, value) VALUES ('feature_flag:pro_shell_tabbar_v1', 'false')` — флаг готов к включению из Cloud UI без релиза.

**Версия:** app `3.55.0`, canonical `v1.23.0`, milestone `M13.A`.

**Acceptance overall:** на дев-превью Home выглядит ритмичнее (одинаковые SectionHead), Quick Actions = ровная сетка 4×2 с цветными точками, RoleSheet — компактный список с описаниями. Pro-shell tabbar готов, но включается по флагу.

