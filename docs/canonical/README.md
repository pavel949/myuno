# myUNO · Canonical Documents

> **Статус:** эталон. Эти документы — единственный источник правды для продуктовых, контентных и инженерных решений. При расхождении кода/UI с этими документами — правится код, а не документ.

## Состав

| # | Файл | Назначение |
|---|------|------------|
| 01 | _segmentation framework — to be added_ | 3-осевая сегментация, 25 персон, 10 кластеров, CRM-схема |
| 02 | _service catalogue v2 — to be added_ | 16 категорий × 230 услуг с тегами lifecycle/role/cluster |
| 03 | [tone-of-voice.md](./03-tone-of-voice.md) | Канонический голос бренда: интерфейс, WhatsApp, email, лендинги, AI-консьерж |
| 04 | [implementation-protocol.md](./04-implementation-protocol.md) | Operational playbook M1→M7 для встраивания канонических документов в стек |

## Дополнительно (research)

| Файл | Назначение |
|------|------------|
| [research/phuket-proptech-market.md](./research/phuket-proptech-market.md) | Анализ рынка proptech на Пхукете: $1.25B, 30k STR-листингов, конкурентный ландшафт |
| [research/myuno-taxonomy-canonical.md](./research/myuno-taxonomy-canonical.md) | 6-уровневая таксономия: 12 ситуаций × 140 микроситуаций × 38 персон × 36 приложений |

## Правила работы

1. **Audit before change** — ни одно изменение не делается до прочтения текущего состояния и сравнения с целевым.
2. **Additive over replacement** — новое добавляется параллельно старому; старое удаляется только после 7 дней работы нового в проде.
3. **One atomic change per PR** — одна веха = один PR = один мёрдж = следующая веха.

См. `04-implementation-protocol.md` § 0 для полного описания философии.

## TODO

- [ ] Добавить `01-segmentation-framework.md` (когда будет передан)
- [ ] Добавить `02-service-catalogue-v2.md` (когда будет передан)
- [ ] M1 — bilingual lint + i18n audit (см. протокол § 1)
