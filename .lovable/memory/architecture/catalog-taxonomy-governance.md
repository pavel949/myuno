# Memory: architecture/catalog-taxonomy-governance
Updated: now

## Status: ✅ Synced (2026-03-07)

Таксономия платформы (51 тип lookup_type) полностью синхронизирована между кодом и БД.

## Иерархия category_groups (DB)

| # | Группа | Категории |
|---|--------|-----------|
| 1 | Home & Living 🏠 | real-estate, cleaning, babysitter, pets, flowers |
| 2 | Transport 🚗 | transfers, transport |
| 3 | Leisure & Activities 🎯 | restaurants, yachts, tours, events, water, shopping, food-delivery |
| 4 | Health & Wellness 🏥 | beauty-spa, medical, pharmacy, fitness, veterinary, insurance |
| 5 | Life Admin 📋 | legal, education, banking, visa |
| 6 | Home Maintenance 🔧 | laundry, plumbing, electrical, ac-repair, gardening, pest-control, handyman, locksmith, road-assistance, services, storage, delivery, market |

Деактивированные группы: Water Sports, Other, Professional.
Деактивированные категории: kids-education (дубликат).

## Синхронизация кода

- `verticalGroups.ts` — 7 групп, соответствуют DB + группа Help (concierge, SOS)
- `taxonomyTypes.ts` — 51 тип, полностью покрывает все lookup_type из lookup_values
- `verticals.ts` — 20 вертикалей (SoT для id/table/icon)
- `useTaxonomyWithFallback.ts` — ключ SERVICE_CATEGORY → HOME_SERVICE_CATEGORY
