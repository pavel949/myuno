# myUNO · Canonical Documents

> **Источник правды.** Эти документы определяют все продуктовые, контентные и инженерные решения. При расхождении кода/UI с документами правится **код**, а не документ.
>
> **Перед каноном:** [`/PROJECT.md`](../../PROJECT.md) — стратегия (цель, монетизация, моаты, KPI).
> **Перед изменением архитектуры:** [`architecture/OVERVIEW.md`](./architecture/OVERVIEW.md) — карта зависимостей и decision tree.

---

## ⚡ Быстрая навигация

| Если нужно… | Документ |
|---|---|
| Понять стратегию и моаты | [`/PROJECT.md`](../../PROJECT.md) |
| Найти архитектурный документ за 1 клик | [`architecture/OVERVIEW.md`](./architecture/OVERVIEW.md) ⭐ |
| Описать персону / lifecycle / role | [`01`](./01-segmentation-framework.md) |
| Добавить услугу в каталог | [`02`](./02-service-catalogue-v2.md) |
| Написать UI / WhatsApp / email текст | [`03`](./03-tone-of-voice.md) |
| Запустить миграционный спринт (M-веха) | [`04`](./04-implementation-protocol.md) |
| Стилизовать компонент (цвет, шрифт, spacing) | [`05`](./05-visual-design-system.md) + [`/DESIGN.md`](../../DESIGN.md) |
| Работать с ClearView рейтингами | [`06`](./06-clearview-methodology.md) + [`audits/M8`](./audits/M8-clearview-integration-protocol.md) |
| Изменить URL / субдомен / навигацию | [`07`](./07-information-architecture.md) |
| Изменить промпт AI-агента | [`08`](./08-ai-prompts-library.md) |
| Создать миграцию БД / новую таблицу | [`09`](./09-data-schema.md) |
| Понять hard rules архитектуры | [`architecture/ARCHITECTURE_V2.md`](./architecture/ARCHITECTURE_V2.md) §13 |
| Узнать, что уже сделано vs планируется | [`architecture/FEASIBILITY.md`](./architecture/FEASIBILITY.md) |

---

## 📚 Канонические документы (01–09)

| # | Документ | О чём | Версия |
|---|---|---|---|
| 01 | [segmentation-framework](./01-segmentation-framework.md) | 3-осевая сегментация (lifecycle × role × modifier), 25 персон, 10 кластеров жизненных ситуаций, CRM-схема | v1.0 |
| 02 | [service-catalogue-v2](./02-service-catalogue-v2.md) | 16 категорий × 230 услуг с тегами lifecycle/role/cluster и моделями монетизации | v2.0 |
| 03 | [tone-of-voice](./03-tone-of-voice.md) | Голос бренда: интерфейс, WhatsApp, email, лендинги, AI-консьерж | v1.0 |
| 04 | [implementation-protocol](./04-implementation-protocol.md) | Operational playbook M1→M7 — встраивание канона в стек | v1.0 |
| 05 | [visual-design-system](./05-visual-design-system.md) | Цвет, типографика, сетка, компоненты, кластеры | v1.0 |
| 06 | [clearview-methodology](./06-clearview-methodology.md) | ClearView™ off-plan (моат #8): 8 категорий, AAA–BB, 5-step maturity | v1.0 |
| 07 | [information-architecture](./07-information-architecture.md) | URL-структура, субдомены, навигация, cross-domain SSO | v1.0 |
| 08 | [ai-prompts-library](./08-ai-prompts-library.md) | Канонические system prompts: концьерж, ClearView draft, Tax Advisor, support | v1.0 |
| 09 | [data-schema](./09-data-schema.md) | Supabase: таблицы, enums, индексы, RLS, FK, naming conventions | v1.0 |

## 🏛 Architecture (`architecture/`)

| Документ | О чём |
|---|---|
| [OVERVIEW](./architecture/OVERVIEW.md) ⭐ | Единая карта: навигация, схема зависимостей (Mermaid), слои L0–L6, decision tree |
| [ARCHITECTURE_V2](./architecture/ARCHITECTURE_V2.md) | Целевая модель: roles · clusters · surfaces · agents · 7 hard rules |
| [FEASIBILITY](./architecture/FEASIBILITY.md) | Migration path и per-role implementation status |
| [CLAUDE_PATCH](./architecture/CLAUDE_PATCH.md) | Source patch блока «1.5 Architecture source of truth» в `CLAUDE.md` (применён) |

## 🔬 Research (`research/`)

| Документ | О чём |
|---|---|
| [phuket-proptech-market](./research/phuket-proptech-market.md) | Рынок proptech на Пхукете: $1.25B, 30k STR-листингов, конкуренты |
| [myuno-taxonomy-canonical](./research/myuno-taxonomy-canonical.md) | 6-уровневая таксономия: 12 ситуаций × 140 микроситуаций × 38 персон × 36 приложений |

## ✅ Audits / вехи (`audits/`)

| Веха | Документ | Статус |
|---|---|---|
| M1 | [i18n-audit](./audits/M1-i18n-audit.md) | ✅ done |
| M2 | [schema-extension](./audits/M2-schema-extension.md) | ✅ done (13 колонок, 3 enum, view) |
| M3 | [types-and-api-contracts](./audits/M3-types-and-api-contracts.md) | ✅ done (типы + API + хуки) |
| M4 | [ai-orchestration](./audits/M4-ai-orchestration.md) | ✅ done (Edge Function + hook) |
| M5 | [ux-persona-detection](./audits/M5-ux-persona-detection.md) + [hardening](./audits/M5-hardening.md) | ✅ done (v1.10.2 — H.1–H.7 автоматизированы; ручной prod-прогон по [`M5-e2e-qa-checklist.md`](./audits/M5-e2e-qa-checklist.md) рекомендован) |
| M6 | [persona-landings](./audits/M6-persona-landings.md) | 📋 **audit** — draft v0.1, awaiting approval (3 трека: D Home → B Landings → C Lifecycle) |
| M7 | Production hardening | ⏳ planned |
| M8 | [clearview-integration-protocol](./audits/M8-clearview-integration-protocol.md) | 📋 protocol (parallel track) |

---

## Правила работы

1. **Audit before change** — прочитай текущее состояние до правки.
2. **Additive over replacement** — новое параллельно старому; старое удаляется через 7 дней работы нового в проде.
3. **One atomic change per PR** — одна веха = один PR = один мёрдж.

Полная философия: [`04-implementation-protocol.md §0`](./04-implementation-protocol.md).

## Язык и версии

- **Язык документов:** русский (внутренний инструментарий команды и AI). Bilingual RU/EN — только user-facing UI/контент.
- **История:** [`CHANGELOG.md`](./CHANGELOG.md). Текущая версия канонического набора: **v1.10.3**.
- **Поддержание:** при добавлении нового документа обнови этот README + CHANGELOG в одном PR.
