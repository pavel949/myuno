
# Мобильная главная — визуальный апгрейд (без изменения структуры)

## Что не так сейчас (по скриншоту 384×676)

1. **Монохром** — кремовый фон + чёрный Playfair-серифный заголовок + одинаковые белые карточки. Нулевой цветовой ритм.
2. **Нет иерархии** — все 4 тайла PrimaryGrid одного размера и одного нейтрального цвета. Глаз не знает, куда смотреть первым.
3. **«Pending payment» доминирует** — вместо приветствия и навигации первое, что видит юзер — две жёлтые карточки оплаты.
4. **Pill-табы наезжают друг на друга** (`Bookings/Services/Documents...` слипаются).
5. **Нет визуального якоря** (фото, градиент, паттерн, иллюстрация) — экран выглядит как админка, а не как «суперапп для жизни».
6. **Иконки одинаковые** — мелкие, серые, без цветовой кодировки кластеров (хотя в системе уже есть `--cluster-*` токены).

## План — 4 точечных правки, не трогая 5-зонную архитектуру

### Шаг 1 · Hero-Greeting вместо «голого» TopBar

Заменить плоский `bg-primary` хедер на **hero-блок с градиентом + персонализацией**:

```
┌─────────────────────────────┐
│ ☰  myUNO         🔔  [P]    │  ← TopBar
│                             │
│ Добрый день, Pavel          │  ← H1, cream-on-navy
│ Турист · 3-й день в Пхукете │  ← persona+contextual chip
│                             │
│ [🔍 Что вам нужно?      →]  │  ← inline AI search bar
└─────────────────────────────┘
   ↓ мягкий градиент navy→bg
```

- Фон: `linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.85) 60%, hsl(var(--background)) 100%)`
- Опциональный subtle pattern overlay (SVG noise / dots) на 4% opacity для «текстуры»
- Search bar — крупный, glass-style (`bg-primary-foreground/10 backdrop-blur`) — единая точка входа в AI-консьерж

### Шаг 2 · PrimaryGrid → асимметричная сетка с цветом кластеров

Сейчас: 2×2 одинаковых нейтральных тайла.
Станет: **1 large hero-tile + 3 small** (Bento-style), каждый окрашен в семантический цвет своего кластера.

```
┌───────────────┬──────────┐
│               │  🏖 Stay │  ← cluster-arrive (mint)
│  ✨ AI        ├──────────┤
│  Concierge    │  📅 Tour │  ← cluster-arrive
│  «Спросите»   ├──────────┤
│               │  🚗 Car  │  ← cluster-live (blue)
└───────────────┴──────────┘
```

Конкретно:
- **Hero-tile (col-span-1, row-span-3)** — крупная карточка AI-консьержа с градиентом `from-accent/20 to-primary/10`, иконкой 32px, заголовком + подсказкой («Спросите что угодно про Пхукет»)
- **3 mini-tiles** — каждый с цветной иконкой на фоне `bg-cluster-{name}/10`, иконка `text-cluster-{name}`, рамка `border-cluster-{name}/20`
- Сохранить персона-логику (TILES.travel/live/invest/business/universal) — меняется только визуальный шаблон

Цветовая привязка по существующим токенам:
- Stay/Property → `--cluster-arrive` (mint)
- Events/Tours → `--accent-orange`
- Transfer/Car → `--cluster-live` (blue)
- Help/SOS → `--destructive`
- Home/Cleaning → `--cluster-manage` (cyan)
- Documents → `--cluster-legal` (amber)
- Wellness → `--accent-teal`

### Шаг 3 · «Pending payments» спрятать в ActiveSituation как inline-чип

Сейчас `ActiveSituation` рендерит полноразмерные карточки `Pending payment: tour 2800 THB` — они визуально доминируют над навигацией.

Заменить на **компактный single-line alert-чип** под hero-блоком:

```
┌─────────────────────────────┐
│ 🔔 2 платежа ожидают · ฿28 300  Оплатить → │
└─────────────────────────────┘
```

- Один цветной чип (`bg-warning/10 border-warning/30`) с агрегированной суммой
- Tap → ведёт на `/me/payments` (полный список)
- Если 0 pending — чип скрыт, ничего не показывается

### Шаг 4 · NowInPhuket → визуальный «pulse» вместо 3 серых ячеек

Сейчас: 3 одинаковых текстовых ячейки `28°C / AQI 42 / 36.2 ฿`.

Станет: горизонтальный «живой» strip с **цветными точками-индикаторами** + опциональной мини-иконкой погоды:

```
┌─────────────────────────────────┐
│ ☀️ 28°  ●green AQI 42  ฿ 36.2 ↑│  ← цвет точки = состояние AQI
└─────────────────────────────────┘
```

- Иконка погоды по WMO-коду (sun/cloud/rain) — `text-accent-amber/teal/sky`
- AQI dot: green/amber/red в зависимости от band
- Курс с микро-стрелкой ↑/↓ (`text-success/destructive`)

### Дополнительно (low-effort, high-impact)

- **Fix pill-табы overflow** в верхнем pill-баре (`Bookings/Services/Documents...`) — `overflow-x-auto` + `scroll-snap-x` + `flex-shrink-0`. Сейчас они слипаются.
- **«Все приложения» CTA** → добавить мини-превью 4 цветных точек кластеров справа (визуальный teaser):
  ```
  Все приложения              ●●●●●● →
  6 кластеров · 80+ сервисов
  ```

## Технические детали

### Файлы

| Файл | Действие |
|---|---|
| `src/components/home/HeroGreeting.tsx` | **NEW** — hero-блок с градиентом, приветствием, AI search bar |
| `src/components/home/PrimaryGrid.tsx` | **REWRITE** — Bento-сетка 1+3, цвета кластеров, добавить `accent` поле в TILES |
| `src/components/home/PendingPaymentsChip.tsx` | **NEW** — компактный alert-чип под hero |
| `src/components/home/NowInPhuket.tsx` | **EDIT** — добавить иконки погоды, цветную AQI-точку, стрелку курса |
| `src/pages/Index.tsx` | **EDIT** — заменить `HomeTopBar` голый на `HeroGreeting`, добавить `PendingPaymentsChip`, оставить остальное |
| `src/styles/tokens.css` | **EDIT** — проверить, что все нужные `--cluster-*` и `--accent-*` токены есть (они есть по `DESIGN_TOKENS.md`) |

### Безопасность

- Новый layout под тем же флагом `home_simplified_v1` (уже включён) — legacy сохранён.
- Дополнительный sub-flag `home_visual_v2` (`default=true`) — на случай быстрого rollback нового визуала отдельно от 5-зонной структуры.
- Никаких хардкод-цветов — только `hsl(var(--cluster-*))` и `hsl(var(--accent-*))`.
- Touch target 44px сохраняется на всех тайлах.
- RU/EN строки — добавить в существующие `isRu ? '…' : '…'` паттерны.

### Что НЕ меняем

- Структуру 5 зон (TopBar / ActiveSituation / PrimaryGrid / NowInPhuket / All Apps)
- Навигацию (`AppDrawer`, `RoleSheet`, маршруты)
- Логику персон (`useUserPersonas`, `pickSet`)
- Шрифты и базовые токены

## Что увидит пользователь после

- Тёплое цветное приветствие сверху вместо плоской navy-полоски
- Один большой AI-тайл как явный «герой» экрана + 3 цветных action-тайла
- Pending payments — один компактный чип, а не доминирующие карточки
- Живой pulse-strip снизу с погодой и курсом в цвете
- Узнаваемый цветовой код кластеров (mint/blue/amber/cyan) — суперапп начинает «звучать»

Скажи «ок» — начинаю реализацию. Или укажи: (а) другой акцент в hero (фото/иллюстрация вместо градиента), (б) другой состав цветов, (в) пропустить какой-то из 4 шагов.
