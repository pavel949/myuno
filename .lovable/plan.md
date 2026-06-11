## Цель
Привести иконки приложений/вертикалей к единому стандарту: **только Lucide React**, без эмодзи, с соответствием смысла, по design bible (`docs/canonical/05-visual-design-system.md`, §730 — «Lucide React — единственная разрешённая библиотека иконок. Никаких emoji-иконок в UI»).

## Что нашёл (аудит)

**Текущее состояние — несоответствие библии:**

| Файл (SSOT) | Иконки | Формат | Проблема |
|---|---|---|---|
| `src/lib/catalog/taxonomy.ts` | 117 | ✅ Lucide (LucideIcon) | Эталон. Но не везде иконка соответствует сути (например `transfer` и `vehicle` оба `Car`; `cleaning` и `flowers` оба `Sparkles`; `services` hub и `plumbing` оба `Wrench`) |
| `src/lib/verticals.ts` | 20 | ❌ Эмодзи (`🏠 🚤 🚗 ✨ 🧹 👶 💇 🍽️ 🏥 ⚖️ 📚 🏋️ 🎉 🏄 🐾 💐 🛡️ 🚕 💊 🏦`) | Нарушение §730 |
| `src/lib/appRegistry.ts` | ~40 | ❌ Эмодзи | Нарушение §730. Это «SINGLE canonical inventory» микро-апп — самый видимый слой |
| `src/lib/verticalGroups.ts` | cluster fallback `📦` | ❌ Эмодзи | Используется в Discover/All Services |
| `src/lib/iconMap.ts` | 200+ | ✅ Lucide | Костыль-конвертер emoji→Lucide. Существует, потому что данные хранятся как эмодзи. После миграции — удалить или сузить до legacy. |

**Дубликаты/семантические ошибки (примеры из `catalog/taxonomy.ts` и `appRegistry`):**

- `transfer` + `vehicle` → оба `Car` → надо `Plane`/`PlaneLanding` для трансфера, `Car` для аренды
- `cleaning` + `flowers` → оба `Sparkles` → `flowers` должен быть `Flower2`
- `services` hub + `plumbing` → оба `Wrench` → hub = `LayoutGrid`/`Boxes`
- Эмодзи 🐕‍🦺 (pets) рендерится по-разному на iOS/Android/Windows → невидим на части устройств
- 🍽️ / 🏥 / ⚖️ — variation selectors → ломаются в части шрифтов
- Цвета/обводки не унифицированы (где-то `strokeWidth=1.6`, где-то `2`, где-то `1.75`)

**Места рендера:**
`NavigatorPage.tsx`, `SituationCard.tsx`, `ExploreMoreRail.tsx`, `CategoryPicker.tsx`, `VehicleClassNav.tsx`, `LegalClusterPage.tsx`, `TicketCategoryBadge`, и десятки cluster-страниц. Все ждут либо `LucideIcon` компонент, либо строку (через `DynamicIcon`/`iconMap`).

## План

**Шаг 1. Канонический справочник `src/lib/icons/registry.ts` (новое)**
Один map `APP_ID → LucideIcon` для всех вертикалей и микро-апп. Источник истины. Используется `verticals.ts`, `appRegistry.ts`, `verticalGroups.ts`, любыми будущими каталогами.

**Шаг 2. Утвердить семантическую карту (примеры выбора)**

```text
Вертикали:
  property        → Building2            (не Home — Home занят навигацией)
  yacht           → Anchor
  vehicle         → Car
  transfer        → PlaneLanding         (а не Car — отличить от аренды)
  fast-track      → Zap
  sim             → Smartphone
  exchange        → ArrowLeftRight
  experience      → Compass
  tours           → Route
  water_activity  → Waves
  event           → CalendarDays
  cleaning        → Sparkles
  laundry         → Shirt                (а не Package)
  pest-control    → Bug
  handyman        → Hammer
  plumbing        → Wrench
  electrical      → Plug                 (а не Zap — Zap = fast-track)
  ac-repair       → Wind
  locksmith       → KeyRound
  gardening       → TreePine
  flowers         → Flower2              (а не Sparkles)
  storage         → Warehouse
  services-hub    → LayoutGrid           (а не Wrench)
  restaurant      → Utensils
  delivery        → Bike                 (а не Truck — delivery курьерами)
  market          → ShoppingBag
  medical         → Stethoscope
  pharmacy        → Pill                 (а не Bandage)
  beauty          → Scissors             (а не Palette — Palette = design)
  babysitter      → Baby
  fitness         → Dumbbell
  education       → GraduationCap
  pets            → PawPrint             (вместо 🐕‍🦺)
  insurance       → ShieldCheck
  legal           → Scale
  visa            → Plane
  tax             → Calculator
  contract-ai     → FileSearch
  bank            → Landmark             (а не Building/🏦)
  sos             → AlertTriangle
  vip-concierge   → Sparkles             (или Crown — обсудить)
  support         → LifeBuoy             (а не ClipboardList)
```

**Шаг 3. Рефакторинг SSOT файлов**
- `src/lib/verticals.ts` — `icon: string (emoji)` → `icon: LucideIcon` (импорт из registry). Удалить поле JSDoc «Emoji icon...».
- `src/lib/appRegistry.ts` — заменить ~40 эмодзи на ссылки в registry.
- `src/lib/verticalGroups.ts` — заменить fallback `📦` → `Boxes` icon.
- Тип `VerticalDefinition.icon` стать `LucideIcon` (типобезопасно).

**Шаг 4. Унификация рендера**
- Единый компонент `<AppIcon vertical="transfer" size={24} />` обёртка над Lucide с фиксированным `strokeWidth=1.75`, `aria-hidden`, токен-цветом.
- Заменить разнобой `strokeWidth` (`1.6` / `2` / `1.75`) на `1.75` везде (стандарт DS 2.1, civic/Geist).
- В `VehicleClassNav.tsx` оставить (уже Lucide).
- В `ExploreMoreRail` / `CategoryPicker` / `NavigatorPage` — читать иконку из registry, убрать обращения к `iconMap`.

**Шаг 5. Подчистка**
- `src/lib/iconMap.ts` сузить до режима «BC для DB-данных» (situations, life-os картинки из БД, где icon хранится строкой). Все hardcoded источники мигрируют на компонент.
- Прогнать тест `src/test/catalog/taxonomy-coverage.test.ts` + добавить тест «нет эмодзи в исходниках registry-файлов» (regex `[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]`).

**Шаг 6. Визуальная проверка**
- Сделать скриншоты: Home, Discover, /transport, /legal, /property, AllAppsDrawer — до/после.
- Убедиться, что иконки видны на dpr=2.8 (текущий вьюпорт пользователя) и не теряются под фон.

## Файлы, которые изменятся

```text
NEW   src/lib/icons/registry.ts          — SSOT vertical/app → LucideIcon
NEW   src/components/ui/AppIcon.tsx      — обёртка-рендер
EDIT  src/lib/verticals.ts               — icon: LucideIcon
EDIT  src/lib/appRegistry.ts             — все 40+ записей
EDIT  src/lib/verticalGroups.ts          — fallback, типы
EDIT  src/lib/catalog/taxonomy.ts        — устранить дубликаты иконок
EDIT  src/lib/iconMap.ts                 — сузить scope, добавить deprecation note
EDIT  ~10 consumer-компонентов           — использовать <AppIcon/> вместо строк/эмодзи
NEW   src/test/design-system/no-emoji-in-registries.test.ts
```

## Out of scope
- Иконки в БД (`life_situations.icon` хранится строкой) — продолжают идти через `DynamicIcon` (уже Lucide).
- Иконки логотипов брендов (yacht broker logos и т.п.).
- Редизайн цвета/фона карточек — только сами иконки.

## Открытые вопросы
1. **VIP-консьерж**: `Sparkles` (текущее) или `Crown` (более luxury)?
2. **Property**: `Building2` (точнее для условий Пхукета: кондо/виллы) или сохранить `Home`?
3. **Дополнительный жёсткий ESLint rule** против эмодзи в `src/lib/**` — включать сейчас или после миграции?
