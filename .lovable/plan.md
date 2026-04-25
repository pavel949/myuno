
# Аудит покрытия лендингов: персоны · кластеры · ситуации

## Сводный результат: 71/100

| Категория | Покрытие | Качество UI | CTA | Балл |
|---|---|---|---|---|
| Персоны (B2C/B2B) | 27/27 контента, 0 визуальных | 🔴 «коммит-ready» каркас | ✅ есть | 60 |
| Кластеры (lifecycle) | 10/10 контента | 🔴 тот же каркас | ✅ есть | 55 |
| Районы (Phuket areas) | 10/10 | 🟢 502 строки, полный UI | ✅ есть | 92 |
| Lifestyle ситуации | 5/9 (Kids, Nomad, Relocate, Wedding, Pets) | 🟡 LandingLayout, скромно | ✅ есть | 70 |
| B2B аудитории | 2/6 | 🟡 dev/vendor есть, MC/Capital нет | ⚠️ частично | 55 |
| Архитектурная согласованность | — | 🔴 SSOT ≠ landings | — | 40 |

---

## 1. ПЕРСОНЫ — `/for/:persona`

**Контент:** 27 персон в `personaLandings.ts`, все `status: 'live'`:
`tourists, snowbirds, ru-expats, passive-investors, hnw, operators, mn-investors, pet-owners, developer-partner, digital-nomads, families, medical, weddings, retirees, eu-guests, athletes, halal, cn-investors, bn-business, lgbtq, accessibility, providers, freelancers, smb, creatives, students` + ещё 1.

**Проблема UI:** `PersonaLandingPage.tsx` (165 строк) — намеренно «коммит-ready» каркас (по комменту в коде это шаг B.4, финальный визуал планировался B.6/B.7, но не сделан):
- нет hero-изображения, нет gradient, нет иконки персоны
- нет блока «социальное доказательство» (отзывы, цифры)
- нет cross-link на районы (хотя area→persona связь уже есть)
- нет bundle pricing / ценового якоря
- единый layout для tourist'а и HNW investor'а — теряется premium-восприятие для high-ticket аудиторий

**Mismatch с SSOT:** в персонах есть `mn-investors`, `bn-business`, `cn-investors` — но в `recommendServices.ts` / `appRegistry` эти теги почти не используются. Лендинг ведёт на общие каталоги без персонализированной выдачи.

---

## 2. КЛАСТЕРЫ — `/cluster/:cluster`

**Контент:** 10 lifecycle-кластеров, все live:
`arrival, investment, operations, compliance, emergency, extension, settlement, transaction, lifestyle, exit`

### 🔴 КРИТИЧНО: расхождение со SSOT архитектуры v2

`docs/canonical/architecture/ARCHITECTURE_V2.md` определяет **6 кластеров** (colour-locked):
`Arrive · Live · Manage · Invest · Legal · Build`

Это и есть source of truth (`src/lib/catalog/taxonomy.ts` → `CLUSTERS`):
```
arrive · live · manage · invest · legal · build
```

А `clusterLandings.ts` живёт в параллельной вселенной из 10 lifecycle-фаз. Результат:
- `/cluster/arrive` → 404 (ожидается, что есть)
- `/cluster/arrival` → 200 (но slug не из SSOT)
- AppDrawer / Footer / Home grid показывают 6 кластеров, а SEO-funnel ведёт на другие 10
- невозможно сделать корректный `breadcrumb`: какой cluster показать на карточке услуги?

### UI

Тот же скромный каркас, что у persona (203 строки, +cross-link к persona). Для кластера «Investment» с ценой сделки $300K+ это слишком невыразительно.

---

## 3. РАЙОНЫ — `/area/:slug`

**Контент:** 10 районов привязаны к `PHUKET_AREAS`: `bang-tao, laguna, kamala, surin, layan, nai-harn, rawai, cherngtalay, kata, phuket-town`.

**UI: 92/100** — `AreaLandingPage.tsx` 502 строки, полный layout, seeded listings, deep-links на map с pre-filled district. Это эталон, к которому стоит подтянуть persona/cluster.

**Пробелы:**
- нет `patong, chalong, kathu, mai-khao, nai-yang` (туристически и residentially значимые)
- нет `phang-nga` / `koh-yao` / `krabi` для cross-island инвестиций
- `/area` index есть, но без карты-агрегатора в hero

---

## 4. LIFESTYLE СИТУАЦИИ

| Ситуация | Маршрут | Файл | Состояние |
|---|---|---|---|
| Прибытие | `/arrive` | `ArriveClusterPage.tsx` (135) | ✅ есть |
| Релокация | `/relocate` | `RelocateLandingPage.tsx` (400) | ✅ полный |
| Свадьба | `/wedding` | `WeddingLandingPage.tsx` | ✅ есть |
| Дети/семья | `/kids` | `KidsLandingPage.tsx` (48) | 🟡 минимальный |
| Номад | `/nomad-guide` | `NomadGuidePage.tsx` (48) | 🟡 минимальный |
| Питомцы | `/pets` | `PetsIndex` | ✅ есть |
| **SOS / экстренные** | `/sos` | есть | ⚠️ не лендинг, а функция |
| **Учёба ребёнка** | — | нет dedicated landing | 🔴 пробел |
| **Выход из страны / продажа активов** | — | `cluster=exit` без визуала | 🔴 пробел |
| **Медицинский туризм** | — | persona есть, landing нет | 🔴 пробел |
| **Halal / Muslim-friendly** | — | persona есть, landing нет | 🔴 пробел |
| **LGBTQ-friendly** | — | persona есть, landing нет | 🔴 пробел |
| **Active / спорт** | — | persona есть, landing нет | 🔴 пробел |

**Качество Kids/Nomad (по 48 строк):** просто список из 7 кнопок-категорий поверх `LandingLayout`. Нет сравнения, нет цен, нет soc-proof, нет seasonal CTA. Для `/kids` (high-intent: семьи с детьми) это слабо.

---

## 5. B2B АУДИТОРИИ

| Аудитория | Лендинг | Состояние |
|---|---|---|
| Девелоперы недвижимости | `/for-developers`, `/developer-portal` | ✅ есть |
| Управляющие компании (MC) | `ForManagementCompanies.tsx` | ✅ есть |
| Локальные сервис-провайдеры | `/vendor/join`, `ForLocalServices.tsx` | ✅ есть |
| **Капитал-партнёры (HNW family offices)** | — | 🔴 нет (есть persona `hnw`, но нет B2B-pitch) |
| **Юр-фирмы / партнёры по визам** | — | 🔴 нет |
| **Школы (для родителей)** | `/education` каталог, не лендинг | 🟡 |
| **Клиники (медицинский туризм)** | — | 🔴 нет |

---

## 6. КРИТИЧЕСКИЕ ПРОБЛЕМЫ (ranked)

1. 🔴 **Cluster-slug schism (40/100):** SSOT (`arrive/live/manage/invest/legal/build`) vs landings (`arrival/investment/operations/compliance/emergency/extension/settlement/transaction/lifestyle/exit`). Поломан SEO + breadcrumbs + cross-links.
2. 🔴 **Бедный UI persona/cluster:** в коде стоит TODO «B.6/B.7» от 2 недель назад — финальный визуал не сделан. 27+10 страниц с одинаковым скучным шаблоном без hero, цифр, social proof.
3. 🔴 **Hollow personas:** `mn-investors`, `bn-business`, `halal`, `lgbtq`, `accessibility`, `medical`, `athletes` — есть в `personaLandings.ts`, но нет персонализированной выдачи в каталогах. Лендинг ведёт в общий список.
4. 🟡 **Kids/Nomad/Wedding визуально слабые:** для high-ticket lifestyle ниш (релокация семьи, ноmad-сезон, свадьба $5–50K) уровень UI ниже Airbnb-стандарта.
5. 🟡 **Нет лендингов для 4 ключевых жизненных ситуаций:** медицинский туризм, halal-friendly, LGBTQ, спорт/активный отдых — есть persona-stub, нет визуальной воронки.
6. 🟡 **Нет 5 туристически значимых районов:** Patong, Chalong, Kathu, Mai Khao, Nai Yang.

---

## 7. ПЛАН ВНЕДРЕНИЯ

### Phase 1 — Cluster Schism Fix (P0, ~2 ч)
1. Решить: либо переименовать landings под SSOT (6 cluster slugs, lifecycle-фазы становятся sub-категориями), либо ввести два пространства (`/cluster/:slug` для SSOT + `/lifecycle/:slug` для phases).
2. Рекомендация: **переименовать landings под SSOT** + добавить `phase` поле в `ClusterLanding` для группировки lifecycle-jobs.
3. Обновить `LIVE_CLUSTER_SLUGS`, `areaLandings.ts` cross-links, тесты.

### Phase 2 — Persona/Cluster Visual Upgrade (P0, ~6 ч)
Создать `PersonaLandingHero`, `PersonaSocialProofStrip`, `PersonaBundlePricing`, `PersonaAreaCrossLink` компоненты. Применить к шаблону `PersonaLandingPage.tsx` и `ClusterLandingPage.tsx`. Добавить per-persona icon + gradient + photo (на основе `personaCode`).

### Phase 3 — Hollow Personas → Real Funnels (P1, ~4 ч)
Для `mn-investors, bn-business, cn-investors, halal, lgbtq, accessibility, medical, athletes`:
- Добавить персонализацию выдачи на `/property`, `/services`, `/restaurants` через `?audience=` query
- Прокинуть `personaTags` в фильтры каталогов
- Добавить «curated» seeded блок на лендинге (3–6 готовых офферов)

### Phase 4 — Missing Lifestyle Landings (P1, ~3 ч)
Создать 4 новых lifestyle-лендинга по образцу `/relocate` (400 строк):
- `/medical-tourism` — медицинский туризм
- `/halal-phuket` — halal-friendly стек
- `/lgbtq-phuket` — LGBTQ-friendly стек
- `/active-phuket` — спорт, MMA, surf, dive

### Phase 5 — Upgrade Kids/Nomad/Wedding (P2, ~3 ч)
Расширить с 48 → 200+ строк: hero, цифры (15 schools, 6 coworks), сравнение, цены, FAQ, repeat-CTA.

### Phase 6 — 5 Missing Areas (P2, ~2 ч)
Добавить в `PHUKET_AREAS`: `patong, chalong, kathu, mai-khao, nai-yang`. Прописать persona/cluster cross-links в `AREA_LINKS`.

### Phase 7 — B2B Pitches (P2, ~3 ч)
Создать landing-pitches:
- `/partners/capital` — для family offices (HNW B2B)
- `/partners/legal` — для юр-фирм
- `/partners/clinics` — для клиник (медицинский туризм inbound)

---

## 8. ВОПРОСЫ ПЕРЕД СТАРТОМ

1. **Cluster-schism:** переименовать landings под SSOT (6 кластеров) или ввести параллельные `/lifecycle/:slug`?
2. **Объём работ:** делаем все 7 фаз сразу или только P0 (Phase 1+2)?
3. **Visual upgrade:** оставляем стиль editorial-dark (как `/newbuilds`) или используем стандартный AppLayout?
4. **Hollow personas:** включать в работу или сначала P0+P1+P4 без них?

После одобрения Lovable перейдёт в build-mode и выполнит работы.
