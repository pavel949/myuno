# M6 — Persona-aware Home + Landings (25 + 10)

**Status:** ✅ Track D closed (2026-04-23, v1.11.0) · 🔜 Track B next
**Date:** 2026-04-23 (audit)
**Owner:** Pavel + AI engineer
**Source:** `04-implementation-protocol.md §M6` · `audits/M5-hardening.md` (out-of-scope items)
**Canonical refs:** `01-segmentation-framework.md` §4 (25 personas), §5 (10 clusters), §6 (matrix); `02-service-catalogue-v2.md`; `03-tone-of-voice.md` §14; `07-information-architecture.md`

> **TL;DR.** M5 закрыл детекцию персоны (`profiles.detected_persona`, `active_clusters`), но Home эту информацию **не использует** — персонализированной перестановки секций нет. Параллельно §M6 канона требует 25 persona-лендингов + 10 кластерных, из которых сейчас существуют 0. Этот документ декомпозирует M6 на **3 трека (D, B, C)** с приоритетами от наименьшего блокинга к наибольшему — каждый аддитивен, без удаления существующих маршрутов.

---

## 1 · AUDIT — что есть сейчас

### 1.1 Persona-aware Home (трек D)

| Параметр | Текущее состояние |
|---|---|
| Маршрут | `/` → `Pages.Home` (`AnimatedRoutes.tsx`) |
| Persona-aware секции | **Нет.** Порядок блоков в `src/components/home/*` фиксированный |
| Чтение `profiles.detected_persona` на Home | Только `<PersonaPromptBanner />` (M5) — отображает баннер если `detected_persona IS NULL`. Сами секции игнорируют поле |
| Доступные сигналы | `useCanonicalProfile` (M3) уже возвращает `lifecycleStage`, `detectedPersona`, `activeClusters` |
| Существующие home-блоки | `HeroBlock`, `CategoryGrid`, `ClusterGrid`, `ClusterHub`, `ConciergeBanner`, `FeaturedPropertiesCarousel`, `HomeDiscoveryCarousel`, `LifecycleSmartTip`, `NowInPhuket`, `OfflineEmergencyCard`, `LifeOSStatusBlock`, `InlinePersonaSelector`, `ActiveSituation`, `ActivityFeed`, `HomeContextChips` (15+ блоков) |
| Контекстные хелперы уже в проекте | `LifecycleSmartTip` (читает lifecycle, советует один tip), `LifeOSStatusBlock` (контекст), `InlinePersonaSelector` (manual override). Все три **не координированы** |

### 1.2 Persona Landings (трек B)

Канон §M6 предполагает `/for/:persona` с конфигом `personaLandings[]`. Поиск по репо:

| Слой | Найдено |
|---|---|
| `/for/:persona` route | **Не существует** |
| `/for/owners`, `/for/investors`, `/for/families`, `/for/nomads` (упомянуты в PROJECT_v2.2) | **Не существуют** |
| `personaLandings.ts` конфиг | **Не существует** |
| Существующие тематические лендинги (вертикальные/ситуационные, не привязаны к 25 персонам) | `/relocate` (RelocateLandingPage), `/wedding` (WeddingLandingPage), `/kids` (KidsLandingPage), `/nomad-guide` (NomadGuidePage), `/pets` (PetsIndex), `/clearview` (ClearViewLanding), `/peylaa` (PeylaaLanding), `/welcome-landing`, `/landing/airport-transfer`, `/landing/flower-delivery`, `/landing/rental` |
| `/p/:slug` | Project microsite (newbuilds), **не** persona — namespace занят |
| Sitemap | `public/sitemap.xml` → `sitemap-static.xml` (статика) + dynamic edge functions (properties/experiences/yachts/restaurants). Persona-маршрутов нет |
| SEO-инфраструктура | hreflang RU/EN не централизована, OG-генератор есть только для отдельных страниц (`api/peylaa-og.ts`) |

**Наблюдение:** существующие лендинги покрывают ~5 из 25 персон (P15 wedding, P7 family, P4/P5 nomad, P13 pet-owner, P6 relocator), но они построены **по ситуации**, не по канонической оси «фаза × роль × модификатор». Их нельзя считать частью M6 без миграции на единый шаблон.

### 1.3 Cluster Landings (трек B, второй подтрек)

| Слой | Найдено |
|---|---|
| `/cluster/:cluster` route | **Не существует** |
| 10 кластеров из §5 канона | A Arrival · B Extension · C Settlement · D Investment · E Transaction · F Operations · G Compliance · H Emergency · I Lifestyle · J Exit |
| Существующее представление кластеров на Home | `ClusterGrid.tsx`, `ClusterHub.tsx` — визуально отображают, но не имеют отдельных URL |

### 1.4 Lifecycle automation (трек C — отложено из M5)

| Параметр | Текущее состояние |
|---|---|
| Cron auto-перерасчёт `lifecycle_stage` | **Нет.** `profiles.lifecycle_stage` пишется только при онбординге (`/start/v2`) |
| Auto-вызов `canonical-persona-detect` на `booking.confirmed` | **Нет** |
| Auto-вызов на `intake.submitted` | **Нет** |
| `lifecycle_stage_history` jsonb-колонка | Существует (M2), но никем не пишется |
| Триггеры на `bookings` / `orders` | Только финансовые (`record_ledger_entries`), персональных нет |

---

## 2 · GAP — расхождение с §M6

| Требование §M6 | Сейчас | Зазор |
|---|---|---|
| Шаблонный route `/for/:persona` | Нет | Создать страницу + конфиг |
| Конфиг `persona-landings.ts` с 25 объектами | Нет | Описать `PersonaLanding` интерфейс, заполнить 25 (3 live + 22 draft) |
| 3 живых лендинга (P1 tourists, P9 hnw, P13 pet-owners) | Нет | Контент руками, по tone-of-voice §14 |
| 10 cluster-лендингов | Нет | Расширение трека B |
| SEO meta/OG/schema.org/hreflang/sitemap | Частично (peylaa, основной layout) | Централизовать `<SeoHead persona={...} />` + динамический sitemap |
| Persona-aware Home (priority service rearrangement) | Нет (только баннер из M5) | Новый компонент `<PersonaAwareSections />` поверх `useCanonicalProfile` |
| Cron lifecycle reassessment | Нет | Edge Function `canonical-lifecycle-recompute` + pg_cron schedule |
| Auto-detect on `booking.confirmed` / `intake.submitted` | Нет | Edge Function trigger или DB trigger |

---

## 3 · PLAN — 3 трека, атомарные шаги

### Принцип
**Additive, по треку за раз.** Каждый трек закрывается отдельным мёрджем и независимым CHANGELOG-bump'ом. Существующие тематические лендинги (`/relocate`, `/wedding`, ...) не трогаем — они продолжают работать; миграция на канонический шаблон — отдельная задача после валидации трафика.

### Порядок треков (по приоритету ценности)

> **Рекомендация:** D → B → C. Обоснование в `04-implementation-protocol.md §M6` и в записи чата 2026-04-23: M5 даёт данные (`detected_persona`), Home без D не материализует ценность; B без D будет угадывать приоритет персон; C (cron) — producer для пустого consumer'а, бесполезен пока D не реагирует.

### Трек D · Persona-aware Home rearrangement (приоритет 1)

| # | Шаг | Файлы | Зависимости | Статус |
|---|---|---|---|---|
| D.1 | Утилита `prioritizeSectionsByPersona(profile, defaultOrder)` — детерминированный sort по `active_clusters` + `lifecycle_stage` | `src/lib/segmentation/prioritizeHomeSections.ts` | M3 типы | ✅ done (2026-04-23) |
| D.2 | Маппинг «cluster → home-section keys» (например, `arrival` → `OfflineEmergencyCard`+`NowInPhuket`; `investment` → `FeaturedPropertiesCarousel`) | константа в той же утилите | D.1 | ✅ done (2026-04-23) |
| D.3 | Компонент-обёртка `<PersonaAwareSections defaultOrder={[...]} />` — рендерит существующие блоки в порядке D.1 | `src/components/home/PersonaAwareSections.tsx` | D.1, D.2 | ✅ done (2026-04-23, 5 тестов) |
| D.4 | Интеграция в `Home.tsx` за флагом `feature_flag:home_persona_aware_v1` (default OFF, включается после QA) | `src/pages/Index.tsx` + DB seed | D.3 | ✅ done (2026-04-23) |
| D.5 | Unit-тесты `prioritizeSectionsByPersona`: ≥6 кейсов (anon → default, authed без persona → default, P1 tourist, P9 HNW, P10 operator, P13 pet-owner) | `__tests__/prioritizeHomeSections.test.ts` | D.1 | ✅ done (10 тестов зелёные) |
| D.6 | Tone-of-voice pass: проверить, что новые secondary CTA в priority-секциях не нарушают §14 | grep + ручной просмотр | D.3 | ✅ done (2026-04-23) |
| D.7 | CHANGELOG → v1.11.0, статус трека D в этом документе → ✅ | docs | все выше | ✅ done (2026-04-23) |

#### D.6 · Tone-of-voice findings (§14 чек-лист)

Проверены priority-зона `<PersonaAwareSections />`: `PersonaPromptBanner` + `ActiveSituation`.

| Чек §14 | PersonaPromptBanner | ActiveSituation |
|---|---|---|
| Нет `!` / urgency | ✅ ("за 30 секунд" — конкретика, не давление) | ✅ (нет собственного текста) |
| Нет «лучший / уникальный / революционный» | ✅ | ✅ |
| Нет «быстро / удобно / выгодно» без цифр | ✅ ("30 секунд") | ✅ |
| Первое предложение про клиента | ✅ ("Расскажите о себе…") | ✅ |
| CTA — глагол действия | ✅ ("Начать" / "Start") | n/a |
| Активные глаголы, ≤25 слов | ✅ | ✅ |
| Обращение на «вы» | ✅ ("Подстроим… под вас") | n/a |
| Нет эмодзи в UI-тексте | ✅ (только Lucide-иконка `Sparkles`) | ✅ |

**Результат:** 0 нарушений §14. Дополнительных вторичных CTA трек D в priority-зоне не вводил — перестановка не порождает нового копирайта.

**Out of scope трека D:** изменение содержимого самих секций; новые секции; mutation `lifecycle_stage` (только read).

### Трек B · Persona + Cluster Landings (приоритет 2)

| # | Шаг | Файлы | Зависимости |
|---|---|---|---|
| B.1 | Тип `PersonaLanding` + интерфейс `ClusterLanding` (slug, h1, subtitle, pains[], services[], bundle?, faq[], cta, ogImage, hreflang, status: 'live'\|'draft') | `src/lib/landings/types.ts` + `__tests__/types.test.ts` | M3 типы | ✅ done (2026-04-23, 10 тестов) |
| B.2 | Конфиг `personaLandings.ts` — 25 объектов (все 25 как `draft` на этапе B.2; контент live P1/P9/P13 → B.7) | `src/content/landings/personaLandings.ts` + `__tests__/personaLandings.test.ts` | B.1 | ✅ done (2026-04-23, 12 тестов) |
| B.3 | Конфиг `clusterLandings.ts` — 10 объектов (все 10 как `draft` на этапе B.3 + `relatedPersonas` по матрице §6; контент live A/D/F → B.8) | `src/content/landings/clusterLandings.ts` + `__tests__/clusterLandings.test.ts` | B.1 | ✅ done (2026-04-23, 15 тестов) |
| B.4 | Динамический route `/for/:persona` → `PersonaLandingPage.tsx`. Если `status === 'draft'` → 404 | `src/pages/landings/PersonaLandingPage.tsx`, route в `AnimatedRoutes.tsx` | B.2 |
| B.5 | Динамический route `/cluster/:cluster` → `ClusterLandingPage.tsx`. То же поведение draft → 404 | `src/pages/landings/ClusterLandingPage.tsx` | B.3 |
| B.6 | Компонент `<LandingSeoHead landing={...} type="persona"\|"cluster" />` — meta/OG/schema.org Service/hreflang RU↔EN | `src/components/seo/LandingSeoHead.tsx` | B.4, B.5 |
| B.7 | Контент 3 persona-лендингов (P1, P9, P13) — RU+EN, по prompt'ам §M6 канона | в `personaLandings.ts` | B.2 |
| B.8 | Контент 3 cluster-лендингов (A Arrival, D Investment, F Operations) | в `clusterLandings.ts` | B.3 |
| B.9 | Sitemap: расширить `public/sitemap.xml` или edge function — добавить только `live` лендинги, hreflang альтернативы | `public/sitemap.xml` или новая edge func | B.7, B.8 |
| B.10 | Tone-of-voice pass §14 по 6 живым лендингам | grep + ручной | B.7, B.8 |
| B.11 | CHANGELOG → v1.12.0, README статус трека B | docs | все выше |

**Out of scope трека B (отложено в M6b/M7):**
- Контент остальных 22 persona-лендингов и 7 cluster-лендингов — по 3–5/неделю с ручной редактурой.
- Миграция существующих `/relocate`, `/wedding`, `/kids`, `/nomad-guide` на единый шаблон — после валидации трафика на новых маршрутах.
- A/B-тестирование вариантов hero — после набора данных.
- Bundle pricing CTA → checkout — отдельный коммерческий трек.

### Трек C · Lifecycle automation (приоритет 3)

| # | Шаг | Файлы | Зависимости |
|---|---|---|---|
| C.1 | Edge Function `canonical-lifecycle-recompute` — для одного `user_id`: читает `bookings`, `orders`, `total_days_in_thailand`, `visits_count`, `visa_type/expires_at` → пересчитывает `lifecycle_stage` по матрице §1; пишет в `profiles` + appendit `lifecycle_stage_history` | `supabase/functions/canonical-lifecycle-recompute/` | M2 (history jsonb) |
| C.2 | DB trigger на `bookings` AFTER INSERT/UPDATE WHERE `status = 'confirmed'` → asynchronous вызов C.1 (через `net.http_post` или `pg_notify`) | новая миграция | C.1 |
| C.3 | DB trigger на `intakes` AFTER INSERT WHERE `status = 'submitted'` → C.1 + asynchronous вызов `canonical-persona-detect` если `detected_persona IS NULL` | новая миграция | C.1, M4 |
| C.4 | pg_cron job (daily 03:00 ICT) — проходит по active `profiles` с `updated_at < now() - interval '7 days'` и вызывает C.1 батчами по 100 | миграция + cron | C.1 |
| C.5 | Unit-тесты матрицы lifecycle (8 переходов): tourist → snowbird (2-й сезон), snowbird → settler (180+ дней), settler → resident (2 года), resident → absentee (visa expired), и т.д. | `__tests__/recomputeLifecycle.test.ts` | C.1 |
| C.6 | Observability: логирование переходов в `lifecycle_stage_history` с `{ from, to, source: 'cron'\|'booking'\|'intake', at }` | в C.1 | C.1 |
| C.7 | CHANGELOG → v1.13.0, статус трека C | docs | все выше |

**Out of scope трека C:**
- Inline-уведомления пользователю «Ваш статус обновлён» — M7.
- Откат миграции (`lifecycle_stage` rollback) — не нужен; история в jsonb решает.

---

## 4 · ACCEPTANCE — критерии приёмки

### По треку D
- [ ] Флаг `feature_flag:home_persona_aware_v1` создан в `system_settings`, default OFF
- [ ] Anon юзер и authed без `detected_persona` видят дефолтный порядок секций (regression)
- [ ] Authed с `detected_persona = 'P1'` (tourist) видит `OfflineEmergencyCard` + `NowInPhuket` в топе
- [ ] Authed с `active_clusters = ['investment']` видит `FeaturedPropertiesCarousel` в топе
- [ ] ≥6 unit-тестов `prioritizeSectionsByPersona` зелёные
- [ ] Mobile 375px чистый, никаких новых layout-shift'ов
- [ ] Tone-of-voice §14 — 0 совпадений запретных слов

### По треку B
- [ ] Роуты `/for/tourists`, `/for/hnw`, `/for/pet-owners` работают, `/for/random-persona` → 404
- [ ] Роуты `/cluster/arrival`, `/cluster/investment`, `/cluster/operations` работают
- [ ] Все 25 персон присутствуют в `personaLandings.ts` (3 live + 22 draft)
- [ ] Все 10 кластеров в `clusterLandings.ts` (3 live + 7 draft)
- [ ] meta.title/description, OG image, schema.org Service, hreflang RU↔EN рендерятся на 6 живых
- [ ] Sitemap содержит только `live`-маршруты
- [ ] Tone-of-voice §14 — 0 совпадений на 6 живых
- [ ] Mobile 375px чистый

### По треку C
- [ ] Edge Function `canonical-lifecycle-recompute` развёрнута, отвечает 200 на тестовый `user_id`
- [ ] Booking `confirmed` для tourist'а с 31-м днём в Таиланде → `lifecycle_stage` = snowbird (через триггер)
- [ ] Cron-job выполняется ежедневно, лог в `pg_cron.job_run_details`
- [ ] `lifecycle_stage_history` содержит запись `{ from, to, source, at }` после каждого перехода
- [ ] ≥8 unit-тестов матрицы переходов зелёные

---

## 5 · ROLLBACK

| Трек | Способ отката |
|---|---|
| D | Флаг `feature_flag:home_persona_aware_v1 = false` → Home возвращается к дефолтному порядку (компонент-обёртка прозрачно деградирует) |
| B | Удалить роуты `/for/:persona` и `/cluster/:cluster` из `AnimatedRoutes.tsx`. Существующие лендинги `/relocate`/`/wedding`/etc не тронуты. Конфиги остаются для будущей реактивации |
| C | DROP TRIGGER + UNSCHEDULE pg_cron job. Edge Function можно оставить (idempotent). `lifecycle_stage_history` остаётся как ценный аудит |

---

## 6 · Anti-scope (не делаем в M6)

- Удаление существующих тематических лендингов (`/relocate`, `/wedding`, `/kids`, `/nomad-guide`, `/pets`).
- Контент 22 draft persona-лендингов и 7 draft cluster-лендингов.
- A/B-тестирование вариантов.
- Inline-редактор персоны на Home (manual override уже есть через `/account` → `/start/v2?return=/account` из M5).
- Аналитика кликов по persona-aware секциям (M7 / отдельный observability трек).
- Cross-domain SSO + субдомены (формально M6 в README, но §07 IA spec уходит в отдельный трек после треков D/B/C).

---

## 7 · Dependency graph

```
M5 (closed v1.10.2) ──► D · Persona-aware Home ──► B · Landings ──► C · Lifecycle automation
                       (consumes detected_persona)  (uses persona slugs)  (writes back lifecycle_stage)
```

C технически независим от B, но D первым даёт обратную связь, какие персоны/кластеры реально кликают — это знание дешевле получить до C, иначе cron будет переключать lifecycle для секций, которые никто не видит.

---

*Audit · v0.1 · 2026-04-23*
