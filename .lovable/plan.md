
# План улучшений UX: Подсказки, Маркетплейс, Аренда недвижимости

## Обзор задач
1. **Главная страница**: Добавить подсказку над переключателем «Услуги/Товары»
2. **Маркетплейс**: Заменить пустой блок баннерами на богатый `FeaturedBanner`
3. **Аренда недвижимости**: Убрать инвестиционный контент с верха, добавить релевантные CTA

---

## Фаза 1: Подсказка над переключателем (Index.tsx)

**Проблема**: Пользователь не понимает, что переключатель меняет контент

**Решение**: Добавить микро-текст перед `ContentModeToggle`:

```tsx
{/* Перед ContentModeToggle */}
<div className="text-center">
  <p className="text-sm font-semibold text-foreground">
    {isRu ? 'Что вы ищете сегодня?' : 'What are you looking for today?'}
  </p>
  <p className="text-xs text-muted-foreground mt-0.5">
    {isRu ? 'Выберите: услуги или товары' : 'Choose: services or products'}
  </p>
</div>
```

**Файл**: `src/pages/Index.tsx` (строки 160-173)

---

## Фаза 2: Маркетплейс — Заменить пустой блок

**Проблема**: Текущие «Promo Banners» (строки 326-358) — два маленьких бокса, которые выглядят «пустыми»

**Решение**: Заменить на компонент `FeaturedBanner`, который уже есть:

```tsx
import { FeaturedBanner } from '@/components/market/FeaturedBanner';

// Заменить promo grid на:
<div className="py-3 max-w-7xl mx-auto px-4">
  <FeaturedBanner
    freeDeliveryThreshold={freeDeliveryThreshold}
    estimatedTime={defaultZone?.estimated_time_minutes}
    productCount={allProducts.length}
    vendorCount={/* считать уникальных */}
  />
</div>
```

**Файл**: `src/pages/market/MarketIndex.tsx` (строки 326-358)

**Дополнительно**: Добавить подсчёт уникальных вендоров из `allProducts`

---

## Фаза 3: Аренда — Рефакторинг ProjectPromoSection

**Проблема**: `ProjectPromoSection` показывает инвестиционный контент в режиме аренды — это сбивает с толку

### 3.1 Добавить `mode` prop в ProjectPromoSection

```tsx
interface ProjectPromoSectionProps {
  className?: string;
  mode?: 'rent' | 'buy'; // NEW
}
```

**Логика по режимам**:
- `rent`: 
  - Заголовок: «Лучшие комплексы для аренды» 
  - Показывать проекты со `status: completed` и высоким `rentCount`
  - CTA: «Смотреть все комплексы»
- `buy`:
  - Заголовок: «Жилые комплексы Пхукета»
  - Показывать все проекты (включая offplan)
  - CTA: «Смотреть все комплексы»

**Файл**: `src/components/property/ProjectPromoSection.tsx`

### 3.2 Передать mode из PropertyIndex

```tsx
<ProjectPromoSection mode={propertyMode} />
```

**Файл**: `src/pages/property/PropertyIndex.tsx` (строка 289)

---

## Фаза 4: Новые CTA для новостроек (внизу страницы аренды)

**Добавить новый компонент**: `OffplanCTASection`

```tsx
// Новый компонент src/components/property/OffplanCTASection.tsx

export function OffplanCTASection({ className }: { className?: string }) {
  // Содержит:
  // 1. Заголовок: "Интересуют новостройки Пхукета?"
  // 2. Подзаголовок: "Проверьте надёжность проекта с экспертизой muUNO"
  // 3. Три фича-пункта:
  //    - "Узнать реальную доходность" → /invest
  //    - "Проверить риски застройщика" → /offplan
  //    - "Получить экспертную консультацию" → opens lead form
  // 4. Два CTA-кнопки:
  //    - Primary: "Смотреть новостройки" → /offplan
  //    - Secondary: "Помочь подобрать" → opens consultation form
}
```

**Расположение в PropertyIndex**: Перед `CrossSellSection` (после грида объектов)

```tsx
{/* После property grid, перед CrossSellSection */}
<OffplanCTASection className="mt-8" />

<CrossSellSection currentVertical="property" className="mt-8 px-4" />
```

**Файл**: `src/pages/property/PropertyIndex.tsx` (после строки 456)

---

## Итоговые изменения

| Файл | Действие |
|------|----------|
| `src/pages/Index.tsx` | Добавить подсказку над ContentModeToggle |
| `src/pages/market/MarketIndex.tsx` | Заменить promo banners на FeaturedBanner |
| `src/components/property/ProjectPromoSection.tsx` | Добавить mode prop, адаптивный контент |
| `src/pages/property/PropertyIndex.tsx` | Передать mode, добавить OffplanCTASection |
| `src/components/property/OffplanCTASection.tsx` | **НОВЫЙ** — блок CTA для новостроек |

---

## Результат

- ✅ Пользователь понимает выбор «Услуги/Товары»
- ✅ Маркетплейс визуально насыщен с первого экрана
- ✅ Аренда не смешивается с инвестиционным контентом
- ✅ Новостройки продвигаются через CTA внизу страницы
- ✅ Путь к проверке надёжности проекта через Investment Hub
