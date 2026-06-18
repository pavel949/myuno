# План: аудит таксономии + симуляция 50 пользователей

## Что я уже увидел (быстрый срез)

**Сильное расхождение SSOT ↔ БД ↔ UI:**

| Источник | Кластеров | Категорий |
|---|---|---|
| `src/lib/catalog/taxonomy.ts` (SSOT) | 6 (arrive/live/manage/invest/legal/build) | 18 |
| `category_groups` (БД) | **15** (включая `home-maintenance`, `leisure`, `professional`, `life-admin`, `water`, `other` — НЕ в SSOT) | 81 |
| `marketplace_categories` | — | 12 (магазин товаров, параллельная иерархия) |
| `listings.category` | свободный текст | ~50+ значений (`motor_yacht`, `roses`, `clinic`, `mixed`…) — **без enum, не привязано к taxonomy** |
| `life_situations` | — | 37 шт, маппинг через `cluster_life_situations` (31 связь) |

**Видимые проблемы:**
1. В БД 9 кластеров с **0 категорий** (мёртвые группы в навигации, если они где-то рендерятся).
2. `listings.category` — свободная строка, не нормализована (`mixed`, `boxes`, `premium` — это не категории).
3. 74 листинга вообще без категории.
4. `marketplace_categories` (товары) живёт отдельно от `categories`/`category_groups` (услуги) — две таксономии, мост не очевиден.
5. `VendorOnboarding.tsx` использует `CategoryPicker` — нужно проверить, из какого источника он берёт категории и попадают ли заявки в `listing_applications` / на модерацию.
6. Канонический док (`02-service-catalogue-v2.md`) обещает 16 категорий × 230 услуг — фактически в SSOT 18×68, в БД 81 категория. Расхождение со спекой.

## Что сделаю

### Шаг 1 — Полный structural audit (read-only)
- Сверить **SSOT ↔ `category_groups`/`categories` ↔ `marketplace_categories` ↔ канонический док §02** — таблица соответствия, missing/extra/renamed.
- Прогнать `listings.category` через нормализатор → сколько листингов не маппятся ни на одну категорию SSOT.
- Проверить `cluster_life_situations`: все ли 37 situations имеют ≥1 кластер; нет ли осиротевших; покрывают ли все 6 surfaces Master Taxonomy.
- Проверить роли (`personaBridge.ts`, `master.ts` P01–P25) ↔ life situations ↔ кластеры: матрица покрытия по 25 персонам.
- Проверить vendor-онбоардинг: какие категории видит поставщик в `CategoryPicker`, что сохраняется (`providers` / `marketplace_vendors` / `listing_applications`), уходит ли это в `moderation_queue` / админку.

### Шаг 2 — Симуляция 50 пользователей
Сгенерирую матрицу 50 персон с осями:
- **Роль:** турист (10), резидент (10), инвестор (8), собственник жилья (8), застройщик (4), бизнес-владелец/поставщик (10)
- **Язык:** ru (25), en (15), th (10)
- **Намерение (JTBD A–J):** распределю по 10 кластерам JTBD
- **Жизненная ситуация:** выберу из 37 `life_situations` (по 1–2 на персону)
- **Источник входа:** `/`, `/discover`, `/vendor/join`, deep-link на конкретную услугу

Для каждой персоны прогоню **скриптовый flow** (Node + Supabase client, read-only где можно):
1. Lands on `/` → видит ли свой surface/JTBD в hero и audience-картах?
2. `useSituationServiceCounts` для своей ситуации — есть ли ≥1 сервис?
3. Если поставщик — пройти `VendorOnboarding`: находит ли свою категорию в `CategoryPicker` (поиск по ru/en/th-синонимам)? Сохраняется ли заявка? Видна ли в админ-модерации?
4. Если потребитель — найти услугу через `/discover` или search → доходит ли до landing/booking?
5. Залогировать **gaps** (категория не найдена, situation без сервисов, ConciergeHelpSheet topic mismatch, UI на нужном языке, etc.).

### Шаг 3 — Отчёт `docs/audit/2026-06-18-taxonomy-simulation.md`
- Сводка структурных расхождений (с конкретными SQL и file:line).
- Матрица 50 персон × 5 метрик (found-category / found-service / language-ok / onboarding-ok / moderation-ok).
- Top-N gaps с приоритетом (P0 ломает онбоардинг → P3 косметика).
- Конкретные рекомендации (например: мерж `home-maintenance` + `home-living` → `cat-home-services` SSOT; добавить enum для `listings.category`; пробросить ru/en/th в `categories.name_*`; завести модерацию через `listing_applications` если её нет).

### Что НЕ буду делать в этом проходе
- Не правлю SSOT и БД — это аудит. Любые правки — отдельным планом после твоего ревью отчёта.
- Не запускаю настоящих юзеров через UI (Playwright × 50 слишком дорого). Симуляция — на уровне данных + точечный browser-проход 3–5 ключевых сценариев для верификации.

## Технические детали

- **Чтение БД:** `psql` (read-only) + `supabase--read_query` для RLS-aware запросов.
- **Симулятор:** Node-скрипт `scripts/audit/simulate-users.ts` (не коммитим, временный) с фикстурой персон.
- **Browser-проверка:** 5 spot-checks через `browser--view_preview` на разных языках/ролях.
- **Артефакт:** Markdown-отчёт в `docs/audit/` + CSV с результатами по 50 персонам.

**Оценка:** ~25–35 минут работы агента, основная стоимость — структурный анализ; симуляция параллелится.

**Рекомендую:** одобрить план как есть — он чисто read-only, ничего не ломает, на выходе получаешь приоритизированный список фиксов, по которому я отдельным заходом сделаю правки.
