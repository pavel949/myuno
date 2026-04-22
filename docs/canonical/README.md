# myUNO · Canonical Documents

> **Статус:** эталон. Эти документы — единственный источник правды для продуктовых, контентных и инженерных решений. При расхождении кода/UI с этими документами — правится код, а не документ.
>
> **Перед каноном читай `/PROJECT.md` в корне** — стратегический источник истины, отменяющий все предыдущие версии и роадмапы.

## Состав

| # | Файл | Назначение |
|---|------|------------|
| 01 | [segmentation-framework.md](./01-segmentation-framework.md) | 3-осевая сегментация (lifecycle × role × modifier), 25 персон, 10 кластеров жизненных ситуаций, CRM-схема |
| 02 | [service-catalogue-v2.md](./02-service-catalogue-v2.md) | 16 категорий × 230 услуг с тегами lifecycle/role/cluster и моделями монетизации |
| 03 | [tone-of-voice.md](./03-tone-of-voice.md) | Канонический голос бренда: интерфейс, WhatsApp, email, лендинги, AI-консьерж |
| 04 | [implementation-protocol.md](./04-implementation-protocol.md) | Operational playbook M1→M7 для встраивания канонических документов в стек |
| 05 | [visual-design-system.md](./05-visual-design-system.md) | Визуальная дизайн-система v1.0: принципы, цвет, типографика, сетка, компоненты, кластеры |
| 06 | [clearview-methodology.md](./06-clearview-methodology.md) | ClearView™ методология рейтингов off-plan (моат #8): 8 категорий, AAA–BB, 5-step maturity, audited modifiers |
| 07 | [information-architecture.md](./07-information-architecture.md) | Информационная архитектура: URL-структура, субдомены, навигация, cross-domain SSO |
| 08 | [08-ai-prompts-library.md](./08-ai-prompts-library.md) | AI Prompts Library v1.0: канонические system prompts для всех AI-агентов (консьерж, ClearView draft, Tax Advisor, support и др.) |
| 09 | [09-data-schema.md](./09-data-schema.md) | Canonical Data Schema v1.0: таблицы, enums, индексы, RLS-политики, FK, naming conventions Supabase. Источник истины по схеме данных |

## Архитектура (architecture/)

> Точка входа — **[`architecture/OVERVIEW.md`](./architecture/OVERVIEW.md)**: единый обзор, карта зависимостей, decision tree, поиск нужного документа за 1–2 клика.

| Файл | Назначение |
|------|------------|
| [architecture/OVERVIEW.md](./architecture/OVERVIEW.md) ⭐ | Единый обзор архитектуры с навигацией по модулям и схемой зависимостей |
| [architecture/ARCHITECTURE_V2.md](./architecture/ARCHITECTURE_V2.md) | Architecture v2 blueprint — roles · clusters · surfaces · agents, hard rules |
| [architecture/FEASIBILITY.md](./architecture/FEASIBILITY.md) | Architecture v2 migration path и per-role implementation status |
| [architecture/CLAUDE_PATCH.md](./architecture/CLAUDE_PATCH.md) | Source patch для блока «1.5 · Architecture source of truth (v2)» в `CLAUDE.md` |

## Дополнительно (research)

| Файл | Назначение |
|------|------------|
| [research/phuket-proptech-market.md](./research/phuket-proptech-market.md) | Анализ рынка proptech на Пхукете: $1.25B, 30k STR-листингов, конкурентный ландшафт |
| [research/myuno-taxonomy-canonical.md](./research/myuno-taxonomy-canonical.md) | 6-уровневая таксономия: 12 ситуаций × 140 микроситуаций × 38 персон × 36 приложений |

## Аудиты

| Файл | Веха | Статус |
|------|------|--------|
| [audits/M1-i18n-audit.md](./audits/M1-i18n-audit.md) | M1 | ✅ done (read-only) |
| [audits/M2-schema-extension.md](./audits/M2-schema-extension.md) | M2 | ✅ done (3 миграции применены) |
| [audits/M3-types-and-api-contracts.md](./audits/M3-types-and-api-contracts.md) | M3 | ✅ done (типы + API + хуки) |
| [audits/M4-ai-orchestration.md](./audits/M4-ai-orchestration.md) | M4 | ✅ done (Edge Function + hook) |
| [audits/M8-clearview-integration-protocol.md](./audits/M8-clearview-integration-protocol.md) | M8 | 📋 protocol (ClearView integration playbook) |

## История изменений

См. [CHANGELOG.md](./CHANGELOG.md). Текущая версия канонического набора: **v1.9.0**.

## Язык документов

Канонические документы 01-05 — **внутренний инструментарий команды и AI-агентов**. Язык: русский. Bilingual-константа проекта применяется к **user-facing UI и контенту**, не к internal docs.

## Правила работы

1. **Audit before change** — ни одно изменение не делается до прочтения текущего состояния и сравнения с целевым.
2. **Additive over replacement** — новое добавляется параллельно старому; старое удаляется только после 7 дней работы нового в проде.
3. **One atomic change per PR** — одна веха = один PR = один мёрдж = следующая веха.

См. `04-implementation-protocol.md` § 0 для полного описания философии.

## Текущий статус

- [x] 01 — Segmentation Framework v1.0
- [x] 02 — Service Catalogue v2.0
- [x] 03 — Tone of Voice
- [x] 04 — Implementation Protocol
- [x] 05 — Visual Design System v1.0
- [x] 06 — ClearView™ Methodology v1.0
- [x] 07 — Information Architecture v1.0
- [x] 08 — AI Prompts Library v1.0
- [x] 09 — Data Schema v1.0
- [x] **M1 — done.** Canonical-инфраструктура + i18n audit (read-only). См. [audits/M1-i18n-audit.md](./audits/M1-i18n-audit.md).
- [x] **M2 — done.** Schema extension: 13 колонок, 3 enum, 3 функции маппинга, view `v_profiles_canonical`. См. [audits/M2-schema-extension.md](./audits/M2-schema-extension.md).
- [x] **M3 — done.** TypeScript types + API contracts + React Query хуки. См. [audits/M3-types-and-api-contracts.md](./audits/M3-types-and-api-contracts.md).
- [x] **M4 — done.** AI-orchestration: persona/lifecycle detection через Lovable AI Gateway. См. [audits/M4-ai-orchestration.md](./audits/M4-ai-orchestration.md).
- [ ] M5 — UX-обвязка детекции (preview/apply UI, авто-вызов на ключевых событиях) — **next**
- [ ] M8 — ClearView Integration: пошаговая реализация ClearView как функционального продукта. См. [audits/M8-clearview-integration-protocol.md](./audits/M8-clearview-integration-protocol.md).
