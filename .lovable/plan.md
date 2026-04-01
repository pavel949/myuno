

# Миграция 7 вертикалей на MiniAppLayout + CatalogCard

## Что делаем

Мигрируем Beauty, Fitness, Education, Cleaning, Events, Medical на единый `MiniAppLayout` + `CatalogCard`. Transport оставляем as-is (у него уникальный UX с hero search, sidebar filters, VehicleClassNav — это осознанное исключение).

## Изменения

### 1. Новые адаптеры в `catalogCardAdapters.ts`

Добавляем 6 mapper-функций:

| Mapper | Ключевые поля |
|--------|--------------|
| `mapSalonToCatalogCard` | badges: Verified; location; price с prefix "от/from" |
| `mapGymToCatalogCard` | badges: Verified; location; price day_pass или month_pass с suffix |
| `mapEducationToCatalogCard` | badges: School/Tutor с иконкой Building2/User; price_per_hour с suffix "/hr" |
| `mapCleaningToCatalogCard` | badges: Verified; subtitle: duration + type; price fixed или per_hour |
| `mapEventToCatalogCard` | badges: Featured; socialProof: date overlay; location; price с prefix "от" или "Free" |
| `mapClinicToCatalogCard` | badges: 24/7 или Open (green); location; subtitle: Russian-speaking |

### 2. Миграция 6 Index-страниц

Каждая страница: убрать `AppLayout` + `CatalogHeader` + inline cards → заменить на `MiniAppLayout` + grid из `CatalogCard`.

Сохраняем специфику:
- **Medical**: Emergency banner остаётся как `quickActions` слот в MiniAppLayout
- **Events**: Date overlay → через `socialProof` в CatalogCard
- **Education**: Type badge (School/Tutor) → через `badges`
- **Cleaning**: Duration subtitle → через `subtitle`

### 3. Обновить экспорты в `adapters/index.ts`

Добавить 6 новых экспортов.

## Файлы

| Файл | Действие |
|------|----------|
| `src/lib/adapters/catalogCardAdapters.ts` | +6 mappers |
| `src/lib/adapters/index.ts` | +6 exports |
| `src/pages/beauty/BeautySpaIndex.tsx` | Полная перезапись → MiniAppLayout + CatalogCard |
| `src/pages/fitness/FitnessIndex.tsx` | Полная перезапись → MiniAppLayout + CatalogCard |
| `src/pages/education/EducationIndex.tsx` | Полная перезапись → MiniAppLayout + CatalogCard |
| `src/pages/cleaning/CleaningIndex.tsx` | Полная перезапись → MiniAppLayout + CatalogCard |
| `src/pages/events/EventsIndex.tsx` | Полная перезапись → MiniAppLayout + CatalogCard |
| `src/pages/medical/MedicalIndex.tsx` | Перезапись, emergency banner в quickActions |

**~8 файлов, ~300 строк inline-кода заменяются на 6 тонких адаптеров + единый компонент.**

