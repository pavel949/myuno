

## Аудит «спокойной уверенности» по вертикалям

Проверила 11 вертикалей: `flowers`, `transport`, `beauty`, `medical`, `legal`, `invest/capital`, `experiences`, `restaurants`, `pets`, `yachts`, `events`. Сравнила хедеры, hero, статусы, кнопки CTA, success-страницы и структуру каталогов.

### Резюме
**Цикл законченный** (каталог → деталь → бронирование → оплата → success → cross-sell → «Мои заказы»). Это есть везде.
**Тон — НЕ единый.** ~6 вертикалей выглядят как «спокойная служба», ~5 — как маркетинговый стартап. Ниже — что именно ломает картину.

---

### ✅ Что уже работает одинаково спокойно

| Принцип | Где реализовано |
|---|---|
| `MiniAppLayout` + `CatalogCard` | flowers, beauty, medical, restaurants, experiences, pets |
| `MiniAppHero` без градиентов (есть deprecation) | базовый компонент уже нейтрализован |
| Сухой sticky header `UnifiedHeader` | вся сеть mini-apps |
| Success-страницы по шаблону: чек, статус, итог, «Мои заказы» | flowers, transport |
| Cross-sell блоки в едином стиле | flowers, transport, beauty, medical |

---

### ❌ Что ломает «спокойную уверенность»

#### 1. Цветные «маркетинговые» Hero-баннеры (главная проблема)
Несколько ключевых страниц всё ещё используют **градиенты, белые подзаголовки, badges «Популярно/Hot Deals/New»** — это голос стартапа, не службы.

| Страница | Что не так |
|---|---|
| `LegalClusterPage.tsx` | `bg-gradient-to-br from-sky-600 via-sky-500 to-blue-600`, заголовок капсом «ЛЕГАЛЬНО», иконка в `bg-white/20` |
| `InvestmentHubLanding.tsx` | `from-emerald-700 via-teal-700 to-blue-800`, badges «Популярно / Новое / Hot Deals» с огоньком 🔥, кнопка «Привлечь капитал» цветная |
| Все `*ClusterPage` (по аналогии с Legal — Arrive, Live, Manage, Build, Invest cluster) | те же градиенты по cluster-color |

**Норма:** `MiniAppHero` (нейтральный `bg-muted/30 border`), без градиента, без капса, иконка моно.

#### 2. Глаголы-приказы в кнопках вместо именных
- `«Открыть»`, `«Смотреть сделки»`, `«Привлечь капитал»`, `«Все»`, `«Browse deals»`, `«Submit deal»` — голос рекламы.
- По gov-стандарту, который мы только что приняли: `«Перейти к разделу»`, `«Список сделок»`, `«Подача проекта»`.

#### 3. Эмоциональные badges и метки
- `Hot Deals 🔥`, `«Популярно»`, `«Новое»`, `«Sparkles»` иконки в InvestmentHub.
- В flowers: `«Гарантия свежести 5 дней»` — норм; но также `«До 14:00 — сегодня»` через `Clock` — звучит как FOMO.
- Норма: бесстрастные ярлыки — `«Подборка редакции»`, `«Добавлено: апрель»`, без огня и ✨.

#### 4. Заголовки кластерных страниц капсом
- `«ЛЕГАЛЬНО»`, `«STAY LEGAL»`, `«5 направлений хаба»` — стилистика лендинга.
- Норма: `«Юридические сервисы»`, `«Разделы хаба»`.

#### 5. Названия счётчиков «штучные», без типизации
- flowers: `«36 букетов»`, transport: `«12 вариантов»`, beauty: `«8 салонов»` — формат рандомный.
- Норма единая: `«Найдено: 36»` или `«36 предложений»` (одно слово на всю сеть).

#### 6. Success-страницы с разной риторикой
- `FlowersSuccess`: `«Оплата прошла успешно!»` (восклицание), `«Continue Shopping»` (англицизм-заглушка).
- `TransferSuccess`: ровный сухой тон.
- Норма: `«Оплата подтверждена.»`, `«Вернуться в каталог»`.

#### 7. Inconsistent footer/CTA внизу инвест-страниц
- Sticky CTA `«showStickyCTA»` после 600px — рекламный приём.
- Норма: убрать, оставить обычный flow (документ не догоняет читателя).

---

### План правок

**A. Создать единый стандарт hero-блока для всех cluster-страниц** (`src/components/uno/CalmClusterHero.tsx`):
- Без градиента: `bg-card border-border rounded-2xl p-5`
- Иконка моно (текущий цвет cluster-token, но через `text-cluster-*` без фона `/20`)
- Заголовок Title Case, не ALL CAPS
- Подзаголовок 1 строка, фактический

Применить к:
- `LegalClusterPage.tsx`
- Все остальные `*ClusterPage` (Arrive, Live, Manage, Build, Invest) — найду через grep на `bg-gradient-to-br`
- `InvestmentHubLanding.tsx` (заменить градиентный hero и убрать «капитал-маркетплейс баннер»)

**B. Единый словарь кнопок** (расширить `src/lib/copy/govStyle.ts`):
- Добавить `BUTTONS`: browse → «Список», open → «Перейти», submit → «Подача», all → «Все записи», raise → «Подача проекта», dashboard → «Личный кабинет».
- Прогнать `InvestmentHubLanding.tsx`, `*ClusterPage.tsx`, hero CTAs.

**C. Удалить эмоциональные badges**:
- В `InvestmentHubLanding`: убрать `Flame` иконку, переименовать «Hot Deals» → «Подборка», «Популярно/Новое» → дата добавления (`Добавлено: апрель`).
- В `FlowersIndex` trust-bar: оставить «Гарантия свежести 5 дней», но «До 14:00 — сегодня» переформулировать в `«Доставка сегодня — заказ до 14:00»`.

**D. Единый формат счётчика** в `MiniAppLayout.subtitle`:
- Везде: `Найдено: N` (RU) / `N results` (EN).
- Файлы: flowers, transport, beauty, medical, legal, restaurants, experiences, pets, yachts, events.

**E. Единый шаблон Success-страницы** (`src/components/orders/UnifiedSuccessLayout.tsx`):
- Иконка moa (без `animate-ping`), статус «Оплата подтверждена», блок заказа, cross-sell, две именные кнопки.
- Применить к `FlowersSuccess`, `TransferSuccess`, добавить недостающие (beauty/medical/legal — там сейчас могут быть простые toast-ы).

**F. Убрать sticky CTA-маркетинг** в `InvestmentHubLanding` (`showStickyCTA`).

**G. Memory** — записать `mem://style/calm-vertical-tone-standard.md`:
- Hero: нейтральный card, без градиента, без капса.
- Кнопки: именные, из глоссария.
- Badges: только фактические (дата, статус, сертификация).
- Success: единый шаблон, без восклицаний.
- Счётчик результатов: «Найдено: N».

---

### Файлы под правку (ровно по областям)

**Новые:**
- `src/components/uno/CalmClusterHero.tsx`
- `src/components/orders/UnifiedSuccessLayout.tsx`
- `mem://style/calm-vertical-tone-standard.md`

**Правятся (минимум):**
- `src/lib/copy/govStyle.ts` — добавить `BUTTONS`, `COUNTER_LABEL`
- `src/pages/legal/LegalClusterPage.tsx` — hero на `CalmClusterHero`
- `src/pages/invest/InvestmentHubLanding.tsx` — hero, CTAs, убрать sticky, badges, секция «5 направлений»
- `src/pages/flowers/FlowersIndex.tsx` — trust-bar формулировка, счётчик
- `src/pages/flowers/FlowersSuccess.tsx` — UnifiedSuccessLayout
- `src/pages/transport/TransferSuccess.tsx` — UnifiedSuccessLayout
- `src/pages/transport/TransportIndex.tsx` — счётчик
- `src/pages/beauty/BeautySpaIndex.tsx` — счётчик
- `src/pages/medical/MedicalIndex.tsx` — счётчик
- Все `*ClusterPage.tsx` (найти через grep `bg-gradient-to-br` в `src/pages/**/Cluster*.tsx` и привести к стандарту)

### Оценка после
- Сейчас: ~60% единства тона между вертикалями.
- После: ~95%. Цветочный магазин и инвестиционный хаб будут читаться как **одна служба** — разные разделы, один голос.

Без изменений маршрутов, схемы БД, бизнес-логики или зависимостей.

