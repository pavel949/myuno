# Фикс B-1/B-2: отсутствующие LIFE_SITUATIONS

## Контекст

В `src/lib/catalog/taxonomy.ts` массив `CLUSTER_LIFE_SITUATIONS` (manage-кластер) ссылается на коды `management_company` и `vendor_onboarding`, которых **нет** в static-массиве `LIFE_SITUATIONS`. Хелпер `buildStaticClusterLifeSituationsMap()` тихо отбрасывает такие записи (имитирует `JOIN ... ON s.code = p.situation_code`), и /discover теряет первичную ситуацию «Управляющая компания» и вторичную «Поставщик услуг» в кластере manage.

**Проверил БД** (`public.life_situations`): обе ситуации **уже существуют** и активны:

| code | title_ru | title_en | icon | color | priority |
|---|---|---|---|---|---|
| management_company | Управляющая компания | Management Company | Building2 | #0A2240 | 100 |
| vendor_onboarding | Поставщик услуг | Service Provider | Handshake | #D96B1A | 80 |

Значит это **чистый дрейф static SSOT ↔ DB**, а не отсутствующие в системе ситуации. Фикс — синхронизировать static-массив с DB. Миграция не нужна.

## Изменения

**Файл:** `src/lib/catalog/taxonomy.ts`

В блок `// Manage` массива `LIFE_SITUATIONS` (после строки 786 `business`) добавить 2 записи, скопированные 1-в-1 из БД:

```ts
{ code: 'management_company', titleRu: 'Управляющая компания', titleEn: 'Management Company', icon: 'Building2', color: '#0A2240', priority: 100, isActive: true },
{ code: 'vendor_onboarding',  titleRu: 'Поставщик услуг',     titleEn: 'Service Provider',   icon: 'Handshake', color: '#D96B1A', priority: 80,  isActive: true },
```

Других правок не требуется — `CLUSTER_LIFE_SITUATIONS` уже содержит корректные ссылки (строки 825 и 828), `buildStaticClusterLifeSituationsMap()` подхватит их автоматически.

## Почему именно так (а не «перепривязать к managing/business»)

| Вариант | Плюсы | Минусы |
|---|---|---|
| **A. Добавить ситуации в static SSOT** ✅ | Сохраняет семантику персон P22 (MC operator) и P25 (service vendor) из Master Taxonomy v1.0. Устраняет дрейф static↔DB. Нулевой риск — данные уже в БД, формат match. | — |
| B. Заменить коды на `managing`/`business` | Меньше строк | Схлопывает 4 разные JTBD-ситуации в 2, ломает Master Taxonomy v1.0, маскирует дрейф вместо его устранения. |

**Рекомендую: вариант A** — он восстанавливает соответствие канону и устраняет первопричину (рассинхрон static↔DB), а не симптом.

## Acceptance

- `LIFE_SITUATIONS.length` = 23 (было 21).
- `buildStaticClusterLifeSituationsMap().get('manage')` содержит обе ситуации.
- /discover для кластера manage показывает «Управляющая компания» (primary) и «Поставщик услуг» (secondary).
- 🔴 B-1 и B-2 из аудита закрыты.

## Out of scope

- Остальные orphan-сервисы (cost-of-living, halal-*, storage, support, nomad-guide) — отдельная итерация O-1…O-7.
- Унификация APP_REGISTRY ↔ taxonomy IDs (I-2) и системы персон (I-1).
- Автоматическая sync-валидация static SSOT ↔ DB (предложить в I-4 отдельно).
