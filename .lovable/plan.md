
# Унификация карточек объектов

## Цель
Обеспечить последовательное использование двух канонических карточек:
- **PropertyCard** -- для УК, владельцев, админов (полная информация, статусы, действия)
- **PropertyListingCard** -- для гостей и превью маркетплейса (Airbnb-стиль)

## Что меняем

### 1. PropertyEditor: превью через PropertyListingCard
**Файл:** `src/pages/owner/PropertyEditor.tsx`

Сейчас используется `PropertyPreviewCard` -- кастомный компонент с собственным интерфейсом. Заменить на `PropertyListingCard`, чтобы превью в редакторе показывало точно ту же карточку, которую увидит гость на маркетплейсе.

Нужно собрать mock-объект типа `Property` из `formData` и передать в `PropertyListingCard`.

### 2. OwnerPropertiesList: использовать PropertyCard compact
**Файл:** `src/components/owner/dashboard/OwnerPropertiesList.tsx`

Сейчас в `renderProperty()` используется полностью кастомная inline-разметка (thumbnail + title + address + chevron). Заменить на `PropertyCard variant="compact"`, чтобы карточки на дашборде владельца были идентичны каноническому compact-варианту, который уже используется в других местах.

Потребуется маппинг `UnifiedProperty` в формат `OwnerProperty`, который принимает `PropertyCard`.

### 3. Убрать deprecated re-exports из PropertyCard.tsx
**Файл:** `src/components/property/PropertyCard.tsx` (строки 697-721)

Убрать устаревшие обёртки `PropertyHeroCard`, `PropertyHeroCardSkeleton`, `PropertyListItem` -- они существуют только для обратной совместимости, но нигде не импортируются напрямую из этого файла.

---

## Что НЕ меняем
- Файлы `PropertyPreviewCard.tsx` и `dashboard/PropertyHeroCard.tsx` не удаляются
- `PropertyListingCard` остаётся без изменений
- Все остальные использования `PropertyCard` (AdminProperties, OwnerProperties, HostListingsPanel, PortfolioSection) уже корректны

## Итого: 3 файла для редактирования
1. `src/pages/owner/PropertyEditor.tsx` -- замена PropertyPreviewCard на PropertyListingCard
2. `src/components/owner/dashboard/OwnerPropertiesList.tsx` -- замена inline-карточки на PropertyCard compact
3. `src/components/property/PropertyCard.tsx` -- удаление deprecated re-exports
