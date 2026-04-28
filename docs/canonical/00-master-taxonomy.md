# myUNO · Master Taxonomy Reference v1.0

> **Status:** Canonical · **Owner:** Pavel Ignatev · **Last updated:** 2026-04-28
>
> Этот документ — единственный источник истины для всех таксономий
> платформы. При расхождении с любым другим документом — этот побеждает.

---

## 0. Два слоя — surfaces и JTBD

Платформа разделяет **два независимых слоя** классификации, которые
ранее путались под общим словом «cluster»:

### Слой 1 — Surfaces (NavCluster, 6)

Физические навигационные «дома». Это маршруты, нижнее меню, RLS-гейты:

| ID | Surface | Что внутри |
|----|---------|------------|
| `arrive` | Arrive | SIM, такси, обмен, первичная регистрация |
| `live` | Live | Бытовые услуги, еда, школы, врачи, lifestyle |
| `manage` | Manage | PMS, MC, vendor portal (workspace) |
| `invest` | Invest | Недвижимость, ClearView, deals |
| `legal` | Legal | Виза, налоги, юристы |
| `build` | Build | Девелопмент, новостройки |

**SSOT:** `src/lib/catalog/taxonomy.ts` (CLUSTERS).
**Не добавлять новые surface'ы** без отдельного решения архитектора.

### Слой 2 — JTBD Clusters (10, A–J)

Функциональные классификаторы «работ» (Jobs-To-Be-Done). Это **не маршруты**.
Используются для тегирования услуг, AI-маршрутизации, lifecycle-аналитики,
SEO-лендингов:

| Code | JTBD | RU | Primary Surface |
|------|------|----|----|
| **A** | Arrival & Setup | Прилёт и обустройство | arrive |
| **B** | Visa & Extension | Виза и продление | legal |
| **C** | Long-term Settlement | Долгосрочное обустройство | live |
| **D** | Investment Decision | Инвестиционное решение | invest |
| **E** | Real Estate Transaction | Сделка с недвижимостью | invest |
| **F** | Property Operations | Управление недвижимостью | manage |
| **G** | Tax & Compliance | Налоги и соответствие | legal |
| **H** | Emergency & Support | Экстренная помощь | live |
| **I** | Lifestyle & Family | Образ жизни и семья | live |
| **J** | Exit & Repatriation | Выезд и репатриация | manage |

**SSOT:** `src/lib/taxonomies/master.ts` (`JTBD_CLUSTERS`).
**DB enum:** `public.jtbd_cluster`.
**Bridge:** `public.service_jtbd_clusters` (one service → many clusters).

---

## 1. Personas (P01–P25)

25 канонических персон. Все активны в Y1 (включая воскрешённые
lifestyle-сегменты P14–P19).

| Code | Slug | RU | Top JTBD |
|------|------|----|----|
| P01 | first-time-tourist | Первый раз на Пхукете | A, H |
| P02 | repeat-tourist | Возвращающийся турист | A, I |
| P03 | long-stay-tourist | Долгосрочный турист | A, B, I |
| P04 | digital-nomad | Цифровой кочевник | B, C, I |
| P05 | remote-family | Семья на удалёнке | C, I, B |
| P06 | snowbird | Зимовщик | A, I, B |
| P07 | retiree | Пенсионер-резидент | B, C, H, G |
| P08 | relocator-family | Семья-релокант | C, E, I |
| P09 | relocator-solo | Соло-релокант | C, B, I |
| P10 | returnee | Возвращенец | J, C |
| P11 | student | Студент | B, C, I |
| P12 | business-owner | Местный бизнес | G, C |
| P13 | employee-expat | Экспат-сотрудник | B, C, G |
| **P14** | medical-tourist | Медицинский турист | I, H, A |
| **P15** | wedding-couple | Свадебная пара | I, A |
| **P16** | athlete | Атлет на сборах | I, A, H |
| **P17** | halal-traveler | Халяль-путешественник | I, A |
| **P18** | lgbtq-traveler | LGBTQ+ путешественник | I, A |
| **P19** | accessibility | Спец. потребности | I, H, A |
| P20 | passive-investor | Пассивный инвестор | D, E, F |
| P21 | active-investor | Активный инвестор | D, E, F, J |
| P22 | developer-partner | Девелопер-партнёр | D, E |
| P23 | property-owner | Собственник | F, G, J |
| P24 | management-company | УК | F, G |
| P25 | service-vendor | Поставщик услуг | F |

**SSOT:** `src/lib/taxonomies/master.ts` (`PERSONAS`).
**DB enum:** `public.app_persona`.

---

## 2. Lifecycle Stages

| Stage | Description |
|-------|-------------|
| `scout` | Изучает Пхукет до приезда |
| `tourist` | Кратковременная поездка |
| `snowbird` | Сезонные визиты |
| `nomad` | Удалённая работа, мобильный |
| `settler` | Переезжает на ПМЖ |
| `resident` | Постоянно живёт на острове |
| `absentee` | Владеет, но живёт где-то ещё |
| `returnee` | Возвращается на родину |

**DB enum:** `public.lifecycle_stage` · **History:** `public.lifecycle_stage_history`.

Переходы валидируются триггером `validate_lifecycle_history` (без
будущих дат, без перехода в ту же стадию). Журнал доступен пользователю
и админам; админ может корректировать.

---

## 3. Deal Types

| Type | Description |
|------|-------------|
| `rent_short` | Краткосрочная аренда (< 30 дней) |
| `rent_mid` | Среднесрочная (1–12 мес) |
| `rent_long` | Долгосрочная (12+ мес) |
| `buy_resale` | Покупка готового объекта |
| `buy_offplan` | Покупка строящегося объекта |
| `buy_assignment` | Переуступка контракта |
| `sell` | Продажа |
| `invest_passive` | Доходные инвестиции |
| `invest_active` | Active management / flip |
| `urgent` | Срочная сделка / emergency |

**DB enum:** `public.deal_type`.

---

## 4. ClearView Grades (Full Scale)

Шкала рейтингов off-plan недвижимости, расширена до полной AAA–CCC:

| Grade | Tier |
|-------|------|
| **AAA** | Premium institutional |
| **AA** | Premium |
| **A** | Strong |
| **BBB** | Solid |
| **BB** | Acceptable |
| **B** | Speculative |
| **CCC** | High risk |
| `unrated` | Not assessed |

**Y1 правило:** в текущей фазе разрешено рейтить **все** проекты,
включая брокеруемые (PEYLAA, Siamese Bangtao, Nunyan). Дисклеймер
«Not ClearView rated» применяется только к проектам без оценки.

**DB enum:** `public.clearview_grade`. Методология — см.
`mem://strategy/clearview-methodology-v3-full`.

---

## 5. Service ↔ JTBD Mapping

Одна услуга может относиться к нескольким JTBD-кластерам. Bridge:

```sql
CREATE TABLE public.service_jtbd_clusters (
  service_id text NOT NULL,
  cluster jtbd_cluster NOT NULL,
  is_primary boolean DEFAULT false,
  PRIMARY KEY (service_id, cluster)
);
```

Чтение публичное, запись — admin-only.
**TS helper:** `getJtbdBySurface()`, `getPersonasByJtbd()` в
`src/lib/taxonomies/master.ts`.

---

## 6. Hard Rules

1. **Никогда не путай** `ClusterId` (surface) и `JtbdClusterId`
   (functional). Это два разных слоя.
2. **Никогда не добавляй новый top-level route** — используй existing
   surface + JTBD-тег.
3. **Никогда не редактируй DB enum'ы** напрямую — только через миграцию
   с обновлением `master.ts` в одном PR.
4. **Все 25 персон активны** — даже если у P14–P19 пока нет landings,
   enum-значения существуют для тегирования.
5. **ClearView grade** хранится только в `public.property_projects`
   (через ClearView assessment). Не дублировать на `properties`.

---

*Owner: Pavel Ignatev · Maintained by: Product Team*
*This document supersedes the previous Operating Model v2.0 in case of conflict on taxonomy.*
