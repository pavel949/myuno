

# Каких публичных лендингов не хватает — аудит и план

## Что есть сейчас (live / draft)

### Persona-лендинги `/for/:persona` — **9 live из 25**
| Live (9) | Draft → 404 (16) |
|---|---|
| P1 tourists, P5 snowbirds, P6 ru-expats, P8 passive-investors, P9 hnw, P10 operators, P11 mn-investors, P13 pet-owners, P22 developer-partner | P2 cn-investors, P3 eu-guests, P4 digital-nomads, P7 families, P12 bn-business, P14 medical, P15 weddings, P16 athletes, P17 halal, P18 lgbtq, P19 accessibility, P20 retirees, P21 providers, P22 freelancers, P23 smb, P24 creatives, P25 students |

### Cluster-лендинги `/cluster/:slug` — **3 live из 10**
| Live (3) | Draft → 404 (7) |
|---|---|
| A arrival, D investment, F operations | B extension, C settlement, E transaction, G compliance, H emergency, I lifestyle, J exit |

### Lifestyle / монетизационные лендинги (отдельно, вне `/for` и `/cluster`)
Live: `/relocate`, `/wedding`, `/kids`, `/nomad-guide`, `/clearview`, `/new-developments`, `/rent-phuket`, `/peylaa`, `/pricing`, `/why-myuno`, `/visa/quiz`, `/school-finder`, `/cost-of-living`, `/trip-planner`, `/list-with-us`.

## Главные пробелы (приоритизированные)

### Уровень 1 — критичные пробелы для SEO и воронки (P0)

**1.1 Cluster H — Emergency** (`/cluster/emergency`)
Высокая поисковая частотность (медпомощь, туристическая полиция, страховка), затрагивает 12 персон. Сейчас 404.

**1.2 Cluster G — Compliance** (`/cluster/compliance`)
Налоги/право/visa run для resident'ов и инвесторов. Критично для P6/P8/P9/P10/P20. Сейчас 404 — а это самый прибыльный intent для legal-вертикали.

**1.3 Cluster B — Extension** (`/cluster/extension`)
Продление визы и переход к долгому пребыванию. P3/P4/P5/P6 — пограничный funnel, сейчас разорван.

**1.4 P7 Families** (`/for/families`)
Семьи с детьми = крупный сегмент в `/kids` уже есть страница, но persona-входа нет. Связь `/for/families` → `/kids` + `/school-finder` + family-villas → быстрый win.

**1.5 P4 Digital Nomads** (`/for/digital-nomads`)
`/nomad-guide` существует, persona-страницы нет. Минимум — обёртка над nomad-guide с ROI визы DTV + co-working + long-stay villa.

### Уровень 2 — высокая ценность, средний приоритет (P1)

**2.1 Cluster I — Lifestyle** (`/cluster/lifestyle`) — хаб для wellness/dining/sport/events, тащит 10 персон.
**2.2 Cluster C — Settlement** (`/cluster/settlement`) — обустройство (мебель, школы, банки, авто, ВУ) для resident'ов.
**2.3 Cluster E — Transaction** (`/cluster/transaction`) — мост между D (investment) и F (operations): сам процесс сделки.
**2.4 P14 Medical tourists** (`/for/medical`) — медтуризм, прямая монетизация через Bangkok Hospital и партнёрские клиники.
**2.5 P20 Retirees** (`/for/retirees`) — Retirement visa O-A, healthcare, банки, недвижимость для пенсионера.
**2.6 P15 Weddings** (`/for/weddings`) — `/wedding` как продуктовый есть, persona-обёртка нет (intent = "destination wedding Phuket").

### Уровень 3 — нишевые, но с конкретной монетизацией (P2)

**2.7 P2 Chinese tourists & scouts** — большой рынок, нужен китайский lang-вариант (вне scope текущего bilingual setup).
**2.8 P16 Athletes & fight camps** — Muay Thai / Tiger Muay Thai партнёрство.
**2.9 P17 Halal travellers** — halal food map, prayer rooms, family resorts.
**2.10 P21 Providers + P23 SMB** — партнёрский funnel B2B (есть только `/list-with-us`, но это generic).
**2.11 Cluster J — Exit** — продажа актива, для долгосрочного retention не критично.

### Уровень 4 — намеренно отложить
P12 BN business, P18 LGBTQ, P19 accessibility, P24 creatives, P25 students — низкий ROI на ближайший квартал, оставить draft.

## Дополнительные пробелы вне `/for` и `/cluster`

| Гипотеза | URL | Зачем |
|---|---|---|
| Area landing pages | `/area/:slug` (rawai, kamala, bang-tao, surin, patong, chalong) | Сейчас есть `/guide/areas`, но 6 отдельных area-страниц с ценами/инфраструктурой — мощнейший SEO-funnel под "rent in kamala" |
| Vertical landing: Yachts | `/yachts` (если ещё нет publicly) | High-AOV вертикаль |
| Vertical landing: Education | `/education` hub | Дополняет `/school-finder` |
| Service category landings | `/services/cleaning`, `/services/maintenance` etc. | Вертикали под high-intent local search |
| Event-driven seasonal | `/songkran`, `/high-season-2026` | Сезонные SEO-spike |

Нужно проверить: эти URL уже в `routes.ts` есть, но контент-лендингов под них нет (страницы — каталоги, не SEO-landings).

## Рекомендованный порядок реализации

```text
Sprint 1 (P0 — 1 неделя):
  1. Cluster H emergency
  2. Cluster G compliance
  3. P7 families (обёртка над /kids)
  4. P4 digital-nomads (обёртка над /nomad-guide)

Sprint 2 (P1 — 1 неделя):
  5. Cluster B extension
  6. Cluster C settlement
  7. Cluster I lifestyle
  8. P14 medical
  9. P20 retirees

Sprint 3 (P2 + Areas):
  10. Cluster E transaction
  11. P15 weddings (обёртка)
  12. 6 area landings (/area/:slug) — самый большой SEO-buy
  13. P16 athletes
```

## Критерии «готов»

Каждый новый лендинг должен:
1. Быть `status: 'live'` в `personaLandings.ts` или `clusterLandings.ts`
2. Содержать H1, subtitle, 4+ pains, 4+ services, 4+ FAQ, primary+secondary CTA
3. Иметь полный SEO-блок: metaTitle (≤60), metaDescription (≤160), ogImage, canonicalPath, hreflangAlternates
4. Быть добавлен в `LIVE_*_SLUGS` массив
5. Получить запись в `public/sitemap-landings.xml`
6. Иметь cross-link minimum в 2 связанных lendinга (related personas / related cluster)
7. Соответствовать `docs/canonical/03-tone-of-voice.md` §14 (без «лучший», «уникальный», urgency)

## Технические детали

- Правки только в `src/content/landings/personaLandings.ts` и `clusterLandings.ts` — компоненты `PersonaLandingPage.tsx` и `ClusterLandingPage.tsx` уже умеют рендерить любые данные.
- Никаких новых routes не нужно — `:persona` и `:slug` динамические.
- `public/sitemap-landings.xml` — append вручную (10 новых `<url>` блоков для Sprint 1+2).
- Area landings потребуют новый route `/area/:slug` + новую систему конфигов `src/content/landings/areaLandings.ts` (если решим делать).

## Ожидаемый эффект

- **+9 индексируемых страниц** после Sprint 1+2 (с 12 live до 21).
- **Cluster H + G** закрывают 2 самых частых tourist/resident intent: «medical emergency phuket», «visa run thailand 2026».
- **P4/P7 wrappers** — нулевой контентный долг (контент уже на `/kids` и `/nomad-guide`), только связка persona→product.
- **Area landings** дают long-tail SEO, который обычно приносит 40–60% органики property-порталам.

## Что НЕ делаем сейчас

- ❌ Новые шейлы / layouts — переиспользуем `PersonaLandingView` и `ClusterLandingView`
- ❌ Китайский язык (P2) — выходит за рамки текущей i18n инфраструктуры (RU/EN)
- ❌ P18/P19/P24/P25 — не приносят выручки в ближайшем квартале

## Резюме

Сейчас система покрывает **40% planned persona landings** и **30% cluster landings**. Самый большой пробел — **Cluster H (Emergency), G (Compliance), B (Extension)** и **persona-обёртки над уже работающими продуктами `/kids` и `/nomad-guide`**. Если делать в порядке P0 → P1 → P2, за 3 спринта закроем все коммерчески значимые лендинги без новой инфраструктуры — только контент в двух конфиг-файлах.

