
# План завершения унификации: Карточки недвижимости + Черновики

## Текущее состояние

### ✅ Уже реализовано:
- **PropertyPreviewCard** — каноническая Airbnb-карточка для поиска/деталей
- **LivePropertyPreview** — живой превью в визарде
- **useFormDraft** — универсальный хук сохранения черновиков
- **useListingApplication** — система заявок с localStorage + БД
- **contentAdapters** — адаптеры для Products, Services (без Property!)
- **propertyTaxonomy** — единая таксономия типов, районов, удобств

### ❌ Не завершено:
1. **PropertyListItem** — компонент не создан (был в плане)
2. **mapPropertyToCardProps** — адаптер отсутствует
3. **useFormDraft в Owner Wizard** — не интегрирован, данные теряются
4. **3 разные inline-карточки** — Admin, Owner Dashboard, Owner List

---

## Этап 1: Создать адаптер для Property

**Файл**: `src/lib/adapters/contentAdapters.ts`

Добавить:
```typescript
// Property types
export interface UnifiedPropertyCardProps {
  variant: 'property';
  id: string;
  title: string;
  titleRu?: string;
  propertyType?: string;
  coverImage?: string;
  images?: string[];
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  areaSqm?: number;
  district?: string;
  address?: string;
  price?: number;
  pricePerNight?: number;
  pricePeriod?: string;
  currency: string;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  instantBooking?: boolean;
  approvalStatus?: string;
  highlights?: string[];
}

export function mapPropertyToCardProps(
  property: OwnerProperty | VendorProperty,
  language: string
): UnifiedPropertyCardProps { ... }

export function mapPropertyFormToCardProps(
  formData: PropertyFormData,
  language: string  
): UnifiedPropertyCardProps { ... }
```

---

## Этап 2: Создать унифицированный PropertyListItem

**Новый файл**: `src/components/property/PropertyListItem.tsx`

```typescript
interface PropertyListItemProps {
  property: OwnerProperty | VendorProperty;
  mode: 'admin' | 'owner' | 'public';
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  showApprovalStatus?: boolean;
  showInstantBadge?: boolean;
}
```

**Характеристики:**
- Размер фото: `w-24 h-24 sm:w-28 sm:h-28` (единый)
- Статус-оверлей внизу фото (из HostListingsPanel)
- Иконки: Bed, Bath, Users/Ruler
- Действия через DropdownMenu по режиму

**Использует**: `mapPropertyToCardProps()` для нормализации данных

---

## Этап 3: Интегрировать useFormDraft в Owner Wizard

**Файл**: `src/hooks/usePropertyWizard.ts`

Заменить:
```typescript
// Было:
const [formData, setFormData] = useState<PropertyFormData>(initialFormData);

// Станет:
const {
  formData,
  updateFields: updateFormData,
  hasDraft,
  clearDraft,
  lastSaved,
} = useFormDraft<PropertyFormData>({
  key: 'owner_property_wizard',
  initialData: initialFormData,
  debounceMs: 1000,
});
```

Добавить UI-индикаторы в AddProperty.tsx:
- `DraftIndicator` — показывает "Автосохранено в HH:MM"
- `DraftRestorationBanner` — предлагает восстановить черновик

---

## Этап 4: Миграция существующих карточек

| Файл | Изменение |
|------|-----------|
| `AdminProperties.tsx` | Заменить inline-карточку на `<PropertyListItem mode="admin" />` |
| `HostListingsPanel.tsx` | Удалить локальный `PropertyCard`, использовать `PropertyListItem` |
| `OwnerProperties.tsx` | Заменить inline-карточку на `<PropertyListItem mode="owner" />` |

---

## Этап 5: Экспортировать из adapters/index.ts

```typescript
export {
  mapPropertyToCardProps,
  mapPropertyFormToCardProps,
  type UnifiedPropertyCardProps,
} from './contentAdapters';
```

---

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/lib/adapters/contentAdapters.ts` | Добавить mapPropertyToCardProps |
| `src/lib/adapters/index.ts` | Экспортировать новые функции |
| `src/components/property/PropertyListItem.tsx` | **Создать** |
| `src/hooks/usePropertyWizard.ts` | Интегрировать useFormDraft |
| `src/pages/owner/AddProperty.tsx` | Добавить DraftIndicator |
| `src/pages/admin/AdminProperties.tsx` | Использовать PropertyListItem |
| `src/components/owner/HostListingsPanel.tsx` | Использовать PropertyListItem |
| `src/pages/owner/OwnerProperties.tsx` | Использовать PropertyListItem |

---

## Ожидаемый результат

1. **Единый адаптер** `mapPropertyToCardProps` — 100% консистентность данных
2. **Единая карточка** `PropertyListItem` — одинаковый UX везде
3. **Сохранение черновиков** — данные формы не теряются при перезагрузке
4. **Индикатор автосохранения** — пользователь видит "Сохранено"
5. **Меньше дублирования** — 1 компонент вместо 4 реализаций
