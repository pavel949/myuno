# Аудит разногласий — подтверждение источниками

Проверил все 12 разногласий из `/mnt/documents/PLATFORM_OVERVIEW.md` против кода, миграций БД, конфигов и роутов. Ниже — точные ссылки. **Две позиции из исходного отчёта оказались неточными — отмечены ⚠️ ИСПРАВЛЕНИЕ.**

---

## ✅ 11.4 ClearView — шкала AAA–BB vs AAA–CCC — **ПОДТВЕРЖДЕНО**

| Источник | Значение |
|---|---|
| `docs/canonical/06-clearview-methodology.md:16` | «AAA–BB» |
| `docs/canonical/06-clearview-methodology.md:498–512` | таблица грейдов: AAA, AA, A, BBB, BB (без B/CCC) |
| `PROJECT.md:105, 149, 217` | трижды повторяет «AAA–BB» (но §10 на стр.10 уже признаёт расширение) |
| `PROJECT.md:10` | сам признаёт: «ClearView расширен до AAA–CCC» (Master Taxonomy override) |
| `supabase/migrations/20260423115350_*.sql:30` | `CREATE TYPE clearview_grade AS ENUM ('AAA','AA','A','BBB','BB')` |
| `supabase/migrations/20260428035354_*.sql:30,33` | `ALTER TYPE … ADD VALUE 'B'`, `ADD VALUE 'CCC'` |
| `src/lib/taxonomies/master.ts:247–250` | `CLEARVIEW_GRADES = ['AAA','AA','A','BBB','BB','B','CCC']` + `'unrated'` |

**Канон: AAA · AA · A · BBB · BB · B · CCC · unrated** (7 уровней + unrated). PROJECT.md §4/§9/§13 и canonical/06 устарели.

---

## ✅ 11.5 ClearView Y1 brokered restriction снято — **ПОДТВЕРЖДЕНО**

- `PROJECT.md:10` явно: «снято Y1-ограничение на brokered проекты».
- Memory Core: «ClearView Y1 rule lifted: rate ALL projects on full AAA-CCC scale».
- БД-enum допускает все значения, ограничения по brokered нет ни в RLS, ни в коде.

---

## ✅ 11.7 Версии — три источника, три номера — **ПОДТВЕРЖДЕНО**

| Файл | Значение |
|---|---|
| `package.json` | `"version": "3.43.0"` |
| `src/lib/appVersion.ts:5` | `export const APP_VERSION = '3.55.3'` |
| `public/version.json` | `"version":"3.55.3","buildTime":"2026-04-30…"` |
| `CLAUDE.md` шапка + §2 | `Версия v3.40.0` (ещё старее) |

Live runtime — **3.55.3**. Стейл: package.json (3.43.0) и CLAUDE.md (3.40.0).

---

## ⚠️ 11.8 File counts — **ПОДТВЕРЖДЕНО с поправкой**

Реальные счётчики (`find … | wc -l`):

| Item | CLAUDE.md | Факт | Δ |
|---|---|---|---|
| Pages | 366+ | **510** | +144 |
| Components | 1000+ | **992** | −8 (≈совпало) |
| Hooks | 345 | **410** | +65 |
| Contexts | 11 | **15** | +4 |
| Edge Functions | n/a | **126** *(не 127)* | — |
| Migrations | n/a | **673** | — |
| Persona landings | n/a | **28** *(P01–P25 + 3 индексных/прочих)* | — |

> ⚠️ ИСПРАВЛЕНИЕ к моему предыдущему отчёту: edge-функций **126**, не 127.

---

## ⚠️ 11.6 Шрифты — **ПОДТВЕРЖДЕНО, но код использует Unbounded+Golos, НЕ «Golos+DM Sans»**

Это самое важное исправление к моему предыдущему MD.

| Источник | Display | Body | Numerics |
|---|---|---|---|
| Memory Core | Syne | DM Sans | — |
| `CLAUDE.md §6` | Golos Text | DM Sans | JetBrains Mono (+ Playfair для luxury) |
| `PROJECT.md §8` | Unbounded (RU)/Noto Serif (EN) | Golos Text (RU)/Noto Sans (EN) | JetBrains Mono |
| **Реальный код** | **Unbounded (RU)/Noto Serif (EN)** | **Golos Text (RU)/Noto Sans (EN)** | **JetBrains Mono** |

Доказательства из кода:
- `index.html` (preload-link): загружаются `Unbounded`, `Golos Text`, `Noto Serif`, `Noto Sans`, `JetBrains Mono`. **DM Sans и Syne не загружаются вовсе.**
- `src/styles/tokens.css:179–187, 318–325`:
  - `--font-heading-ru: 'Unbounded', 'Noto Serif', Georgia, serif`
  - `--font-body-ru: 'Golos Text', 'Noto Sans', system-ui, sans-serif`
  - `--font-heading-en: 'Noto Serif', Georgia, serif`
  - `--font-body-en: 'Noto Sans', system-ui, …`
  - `--font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace`
- `tailwind.config.ts:39–42`: `sans` и `display` тянут только CSS-переменные `--font-body` / `--font-display`.
- Cormorant Garamond — только в `/newbuilds` теме (memory: «Dark Luxury theme»).

> ⚠️ ИСПРАВЛЕНИЕ: код реально соответствует **PROJECT.md §8 (Unbounded+Golos+Noto+JetBrains)**, а не CLAUDE.md §6 (где указан DM Sans). Расходятся CLAUDE.md и Memory Core, а не PROJECT.md. **Memory Core «Syne (display), DM Sans (body)» — устарело и не отражает код.**

---

## ✅ 11.2 «3 сегмента» vs 25 персон — **ПОДТВЕРЖДЕНО**

- Memory Core: «Serve only 3 segments: Investor $2M+, Relocator $300–800K, Second-home $200–500K».
- `src/lib/taxonomies/master.ts` — массив `PERSONAS` содержит P01…P25 (включая P14–P19 lifestyle).
- DB enum `public.app_persona` повторяет 25 значений (Master Taxonomy).
- `src/content/landings/personas/` — **28 файлов** (полный набор P01–P25 + индекс/общие).
- `PROJECT.md §13` — действительно 12+ активных персон, ещё одна версия.

Резолюция остаётся: Master Taxonomy выигрывает на «кого тегируем», 4-test filter применяется на «кого активно продаём».

---

## ✅ 11.3 LifeHub / Lifestyle apps — **ПОДТВЕРЖДЕНО**

- Memory Core: «LifeHub = retention only … Superseded for P14-P19 by Master Taxonomy v1.0».
- Лендинги для P14–P19 существуют: `src/content/landings/personas/P14_MEDICAL.ts … P19_ACCESSIBILITY.ts` (созданы в текущей сессии Wave 4).
- Гео-страницы: `src/content/landings/personaAreaLandings.ts`, `src/pages/landings/PersonaAreaLandingPage.tsx`.

---

## ✅ 11.9 «Surface» — два разных значения — **ПОДТВЕРЖДЕНО**

- `CLAUDE.md:61`: «Surface — one of 6 long-lived canvases: Home · Discover · Operate · Wallet · Me · Admin» (app-shell canvas).
- `src/lib/taxonomies/master.ts:9–19`: «SURFACES (NavCluster, 6) — навигационные «дома»: Arrive / Live / Manage / Invest / Legal / Build … Никогда не путай ClusterId (surface) и JtbdClusterId (functional)» (контент-кластер).

Один и тот же термин, два понятия. Рекомендация прежняя: переименовать app-shell в **Canvas**.

---

## ✅ 11.12 «No new top-level routes» vs реальность — **ПОДТВЕРЖДЕНО**

`src/lib/config/routes.ts` — **305+ строковых литералов** верхнеуровневых роутов. Выборка (sort -u): `/about, /account, /admin, /area, /arrive, /auth, /babysitter, /banking, /beauty, /become-partner, /become-provider, /bookings, /capital, /cart, /categories, /cleaning, /complexes, /contact, /cookies, /cost-of-living, /delivery, /demo, /developer-portal, /developers, /discover, /dispute-resolution, /education, /events, /exchange, /experiences, …`

Правило в Memory Core forward-looking, существующие grandfather'ed. Стоит явно зафиксировать в Core.

---

## ✅ 11.1 / 11.10 / 11.11 — без новых данных
- 11.1 (порядок SSOT) — административное правило, кодом не верифицируется.
- 11.10 (Windows path в CLAUDE.md) — текстовая стейлость, не критично.
- 11.11 (DB identity `kakkwibljrjsawxgnupk`, нет v2/PEYLAA) — подтверждено `src/integrations/supabase/client.ts` и Memory.

---

## Итог: что реально требует правки

| # | Действие | Где |
|---|---|---|
| 1 | Обновить ClearView шкалу до **AAA–CCC** | `docs/canonical/06-clearview-methodology.md`, `PROJECT.md §105/149/217` |
| 2 | Обновить версию | `package.json` → 3.55.3, `CLAUDE.md` шапка → 3.55.3 |
| 3 | Обновить счётчики файлов | `CLAUDE.md §9`: 510 pages / 410 hooks / 15 contexts / 126 edge fn / 673 migrations |
| 4 | **Исправить шрифты в Memory Core** (Syne+DM Sans → **Unbounded+Golos+Noto+JetBrains**), привести `CLAUDE.md §6` к PROJECT.md §8 | mem-индекс + `CLAUDE.md` |
| 5 | Развести термин «Surface»: ввести **Canvas** для app-shell | `CLAUDE.md §1.5` глоссарий |
| 6 | Зафиксировать «existing top-level routes grandfathered, no new ones» | Memory Core |
| 7 | Обновить `/mnt/documents/PLATFORM_OVERVIEW.md`: исправить fonts-row (код = PROJECT.md, не CLAUDE.md) и edge-fn счётчик 127→126 | PLATFORM_OVERVIEW.md §11.6 / §2 |

**После approve** я в build-режиме:
1. Перепишу §11.6 и §2 в `PLATFORM_OVERVIEW.md` с корректной таблицей шрифтов и счётчиком 126.
2. Обновлю `CLAUDE.md` (версия, счётчики, шрифты, glossary).
3. Обновлю memory-индекс (Core line «Syne/DM Sans» → актуальные шрифты).
4. Опционально — синхронизирую `package.json` версию и единичную правку в `docs/canonical/06-clearview-methodology.md` с пометкой «Superseded by Master Taxonomy v1.0 — see grade scale AAA–CCC».

Подтверди, какой объём правок делать (минимум — только PLATFORM_OVERVIEW.md, максимум — все 7 пунктов).