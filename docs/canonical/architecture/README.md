# Architecture · myUNO

Подпапка содержит архитектурные документы canonical-уровня. Точка входа — **`OVERVIEW.md`**.

| Файл | Назначение |
|---|---|
| **[`OVERVIEW.md`](./OVERVIEW.md)** ⭐ | Единый обзор архитектуры: навигация, карта зависимостей, слои, hard rules, decision tree. Начни отсюда. |
| [`ARCHITECTURE_V2.md`](./ARCHITECTURE_V2.md) | Target architecture v2 — roles · clusters · surfaces · agents · hard rules |
| [`FEASIBILITY.md`](./FEASIBILITY.md) | Current-state assessment + migration path · per-role status |
| [`CLAUDE_PATCH.md`](./CLAUDE_PATCH.md) | Source patch блока «1.5 · Architecture source of truth (v2)» в `CLAUDE.md` (уже применён) |

## Правила

1. **OVERVIEW.md — навигатор**, не источник истины. Контент живёт в первоисточниках.
2. **ARCHITECTURE_V2.md — целевая модель.** Любое структурное изменение сверяется с §13 (hard rules).
3. **FEASIBILITY.md — карта реальности.** Обновляется по завершении каждой вехи M1–M8.
4. История — в [`../CHANGELOG.md`](../CHANGELOG.md).
