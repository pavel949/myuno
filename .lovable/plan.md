
# План: Подключение реальных объектов к карте недвижимости

## Текущее состояние

**Проблема:** Карта `/property/map` использует захардкоженные демо-данные вместо реальных объектов из базы.

**База данных:** В Supabase есть 13+ активных объектов с заполненными координатами (lat, lng) на Пхукете:
- Kamala: 7.9489, 98.2856
- Rawai: 7.7812, 98.3234 / 7.7751, 98.3255
- Nai Harn: 7.7694, 98.3053
- Chalong: 7.8356, 98.3378
- Surin: 7.9769, 98.2783
- Kata: 7.8203, 98.2981
- и другие...

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────────┐
│  PropertyMap.tsx (БЫЛО)                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  const demoProperties = [ ... захардкоженные данные ... ]           │
│                    │                                                │
│                    ▼                                                │
│  <SalonMap salons={demoProperties} />                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

                              ▼ ЗАМЕНА

┌─────────────────────────────────────────────────────────────────────┐
│  PropertyMap.tsx (СТАНЕТ)                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  const { data: properties } = usePropertiesForMap()                 │
│                    │                                                │
│                    ▼  трансформация в SalonMarker[]                 │
│  <SalonMap salons={propertyMarkers} icon="🏠" />                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Фазы реализации

### Фаза 1: Новый хук для карты

**Файл: `src/hooks/useProperties.ts`**

Добавить специализированный хук для карты:

```typescript
// Fetch properties with coordinates for map view
export function usePropertiesForMap(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['properties-map', filters],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select(`
          id,
          title_en,
          title_ru,
          lat,
          lng,
          price,
          price_period,
          currency,
          property_type,
          bedrooms,
          cover_image,
          rating,
          district
        `)
        .eq('is_active', true)
        .not('lat', 'is', null)
        .not('lng', 'is', null);
      
      // Apply filters (type, district, price)
      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.district) {
        query = query.eq('district', filters.district);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PropertyMapItem[];
    },
  });
}
```

### Фаза 2: Обновление PropertyMap.tsx

**Файл: `src/pages/property/PropertyMap.tsx`**

1. Удалить `demoProperties`
2. Импортировать `usePropertiesForMap`
3. Трансформировать данные в формат `SalonMarker[]`
4. Добавить состояние загрузки

```typescript
// Трансформация property → SalonMarker
const propertyMarkers: SalonMarker[] = (properties || []).map(p => ({
  id: p.id,
  name: p.title_en || 'Property',
  nameRu: p.title_ru || 'Объект',
  lat: p.lat!,
  lng: p.lng!,
  rating: p.rating || 0,
  priceFrom: p.price || 0,
  image: p.cover_image,
}));
```

### Фаза 3: Улучшение маркера

**Файл: `src/components/map/SalonMap.tsx`**

1. Добавить поддержку кастомной иконки через props
2. Улучшить popup с изображением и ценой

```typescript
interface SalonMapProps {
  salons: SalonMarker[];
  onSalonSelect?: (salonId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  distanceFilter?: number;
  className?: string;
  icon?: string; // NEW: '🏠' для недвижимости, '💆' для салонов
  iconBgColor?: string; // NEW: кастомный цвет фона
}

// Замена строки 162:
<span class="text-white text-lg">${icon || '📍'}</span>
```

### Фаза 4: Улучшенный popup

**Файл: `src/lib/sanitize.ts`**

Расширить `createMapPopupHtml` для поддержки изображения:

```typescript
export function createMapPopupHtml(options: {
  name: string;
  rating?: number;
  price?: string;
  image?: string; // NEW
}): string {
  const { name, rating, price, image } = options;
  return `
    <div class="p-2 min-w-[180px]">
      ${image ? `<img src="${escapeHtml(image)}" class="w-full h-24 object-cover rounded-lg mb-2" />` : ''}
      <h3 class="font-semibold text-sm">${escapeHtml(name)}</h3>
      <div class="flex items-center gap-2 mt-1">
        ${rating ? `<span class="text-xs">⭐ ${rating}</span>` : ''}
        ${price ? `<span class="text-xs text-muted-foreground">${price}</span>` : ''}
      </div>
    </div>
  `;
}
```

---

## Новые/Изменяемые файлы

| Файл | Изменение |
|------|-----------|
| `src/hooks/useProperties.ts` | + `usePropertiesForMap()` |
| `src/pages/property/PropertyMap.tsx` | Реальные данные из Supabase |
| `src/components/map/SalonMap.tsx` | + props `icon`, `iconBgColor` |
| `src/lib/sanitize.ts` | Расширить popup с изображением |

---

## Визуальный результат

```text
┌─────────────────────────────────────────────────────────────────────┐
│  /property/map                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │      🏠 Kamala                                                │  │
│  │           ↖ 95,000 ฿/мес                                     │  │
│  │                                                               │  │
│  │                     🏠 Surin                                  │  │
│  │                          ↖ 180,000 ฿/мес                     │  │
│  │                                                               │  │
│  │  🏠 Kata                           PHUKET MAP                │  │
│  │       ↖ 250,000 ฿/мес                                        │  │
│  │                                                               │  │
│  │              🏠 Chalong                                       │  │
│  │                   ↖ 38,000 ฿/мес                             │  │
│  │                                                               │  │
│  │                        🏠 Rawai × 2                           │  │
│  │                             ↖ 15k-120k ฿/мес                 │  │
│  │                                                               │  │
│  │                    🏠 Nai Harn                                │  │
│  │                         ↖ 18.5M ฿ (продажа)                  │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [2 км] [5 км] [10 км] [25 км] [Все]                               │
│                                                                     │
│  Фильтры: [Все] [Вилла] [Кондо] [Квартира]                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

                    ▼ Клик на маркер

┌─────────────────────────────────────────────────────────────────────┐
│  POPUP                                                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐                                        │
│  │  [Фото виллы]           │                                        │
│  │  Luxury Tropical Villa  │                                        │
│  │  ⭐ 4.8  •  ฿120,000/мес │                                        │
│  │  [Клик → детали]        │                                        │
│  └─────────────────────────┘                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Техническое резюме

**Изменения:**
- 4 файла (2 обновления + 2 расширения)
- Удаление demo-данных
- Подключение к реальной БД

**Данные:** 13+ объектов с координатами уже есть в базе - карта сразу заработает.

**Риск регрессии:** Низкий - SalonMap используется в других местах, но новые props опциональные.
