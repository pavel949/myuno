
## Цель

Клик по карточке выделяет pin на карте (и наоборот). На мобильном — карта на весь экран, список открывается draggable bottom sheet'ом с peek-режимом. Фильтры уже едины через URL — закрепляем это поведение.

## Объём

Две поверхности:
1. **`/property` (PropertySearchPage + PropertyMapView)** — есть список + опциональная карта, сейчас работает только hover-подсветка.
2. **`/map` (MapView + MapLibreMap)** — сейчас только карта + детальная панель, списка нет.

Общий хук + UI-компонент для шторки переиспользуется.

---

## Шаг 1. Общая инфраструктура

**Новый хук** `src/hooks/useMapListSync.ts`:
- состояние `selectedId: string | null` + `hoveredId: string | null` (раздельные — hover для desktop, select для тапа/клика);
- `selectedId` хранится в URL `?focus=<id>` (через `useSearchParams`) — sharing/deep-linking;
- API: `{ selectedId, hoveredId, select(id), hover(id), clear() }`.

**Новый компонент** `src/components/map/MapListBottomSheet.tsx`:
- мобильный bottom sheet (375–768px) поверх карты;
- 3 snap-точки: `peek` (~100px, видно «N локаций» + первая карточка-превью), `half` (~50dvh), `full` (~85dvh);
- драг через `framer-motion` (уже в стеке) или `vaul` (легче — рекомендую `vaul`, оно уже используется в shadcn-drawer);
- внутри — виртуализованный список (`@tanstack/react-virtual`, уже в зависимостях) с `data-listing-id` для scrollIntoView;
- при `selectedId` авто-скроллит выбранную карточку в видимую часть и переводит sheet в `half` если был `peek`.

**Desktop (≥1024px)** — sheet не используется, список рендерится в обычной колонке слева/справа от карты (как сейчас на `/property`).

---

## Шаг 2. `/property` — закрыть петлю выбора

`src/pages/property/PropertySearchPage.tsx`:
- Подключить `useMapListSync` (вместо локального `hoveredProperty`).
- Передать `selectedId`, `onSelect`, `hoveredId`, `onHover` в `PropertyMapView` и `PropertyListingCard`.
- При наличии `?focus=<id>` в URL сразу скроллить и подсвечивать карточку.
- Добавить в `PropertyListingCard` data-атрибут `data-listing-id={property.id}` и визуальное состояние `isSelected` (рамка `ring-2 ring-primary`, отличается от `isHovered`).
- Сохранить toggle «Список/Карта», но добавить третий режим **«Split»** на ≥`lg` (50/50 split). На мобильном Split = карта + BottomSheet.

`src/components/property/PropertyMapView.tsx`:
- Новый prop `selectedId` + `onSelect`.
- Pin выбранного объекта: увеличенный лейбл, фон `--primary`, текст `--primary-foreground`, z-index выше.
- `useEffect` на `selectedId` — `map.panTo()` к координате (только если pin вне видимой области), без forced zoom.
- `InfoWindow` открывается по `selectedId` (а не локальному `openId`), `onCloseClick` → `clear()`.

---

## Шаг 3. `/map` — список + sync

`src/pages/MapView.tsx`:
- Импортировать `useMapListSync` (тот же), `MapListBottomSheet`.
- Передавать `selectedId` в `MapLibreMap` через уже существующий проп `activeMarkerId` (просто использовать общий стейт).
- Существующая панель `selected` (vendor/OSM детали) триггерится тем же `selectedId` — мёрджим состояние.
- Под картой/поверх неё на мобильном — `MapListBottomSheet`:
  - содержимое: единый плоский список из `mlMarkers` (vendor + OSM), сгруппированный заголовками по `vertical` (Жильё / Рестораны / Красота / … / OSM);
  - каждая карточка: иконка вертикали + название + расстояние от центра карты + рейтинг/цена (если есть);
  - тап по карточке → `select(id)` → карта `flyTo` + открывает существующую детальную панель.
- На desktop (≥`lg`): добавить левую колонку 360–400px со списком, карта — справа на flex-1.
- Клик по pin (`handleMarkerClick`) уже работает — добавить вызов `select(id)` и убрать локальный `selected`/`activeMarkerId` (заменить общим хуком).

`src/components/map/MapLibreMap.tsx`:
- `flyTo` при изменении `activeMarkerId` — добавить (сейчас программный `flyTo` зовётся снаружи; перенесём в `useEffect` хука внутри компонента, чтобы и список, и search вели себя одинаково).
- Активный pin: `transform: scale(1.25)`, ring через `box-shadow: 0 0 0 4px hsl(var(--primary) / 0.35)`.

---

## Шаг 4. Фильтры

Уже синхронизируются через URL (`?vertical&price&availability&category&...`). Закрепляем:
- При смене фильтра `selectedId` не сбрасывается, если выбранный объект всё ещё в `filteredMarkers`. Если выпал — `clear()`.
- При клике по pin вертикали, отличной от текущего фильтра, не меняем фильтр (это destructive); вместо этого селектим как есть.

---

## Шаг 5. Доступность и мелочи

- `aria-selected` на карточке и pin'е, `role="option"` в списке.
- Клавиатура: `↑/↓` в списке двигает selection, `Esc` — clear.
- Анимация pin'а — `prefers-reduced-motion: reduce` отключает.
- На мобильном при открытии sheet'а в `full` — карта остаётся интерактивной (sheet полупрозрачный backdrop отсутствует).

---

## Технические детали

Зависимости:
- **Рекомендую: `vaul`** для bottom sheet — нативная физика, snap-points из коробки, уже совместим с shadcn (есть `drawer.tsx`). Альтернатива — `framer-motion` руками, дольше.
- `@tanstack/react-virtual` уже установлен — используем без `bun add`.

URL-стейт:
- `?focus=<id>` — выбранный объект;
- остальные параметры (vertical/price/…) уже работают.

Файлы:
```text
NEW src/hooks/useMapListSync.ts
NEW src/components/map/MapListBottomSheet.tsx
NEW src/components/map/MapListItem.tsx           // мини-карточка для /map
MOD src/pages/MapView.tsx
MOD src/components/map/MapLibreMap.tsx           // flyTo on activeMarkerId, активный стиль pin
MOD src/pages/property/PropertySearchPage.tsx
MOD src/components/property/PropertyMapView.tsx  // selectedId + крупный активный pin
MOD src/components/property/PropertyListingCard.tsx  // isSelected, data-listing-id
```

Тесты (минимум):
- `useMapListSync` — select/clear, sync с URL.
- Smoke на `/property?focus=<id>` — карточка в DOM с `aria-selected="true"`.

---

## Не входит

- Полноценная виртуализация карты (кластеризация pin'ов) — отдельная задача.
- Сохранение позиции скролла между навигациями.
- Перенос фильтров `/property` в общий URL-схему с `/map` (сейчас они разные).

## Acceptance

1. На `/property` тап по карточке: pin становится крупнее, карта пан-ится к нему, InfoWindow открывается.
2. На `/property` клик по pin: соответствующая карточка получает рамку и скроллится в видимую область.
3. На `/map` тап по pin: открывается детальная панель + соответствующая карточка в bottom sheet подсвечена.
4. На `/map` тап по карточке в sheet: карта летит к pin, pin активный, sheet схлопывается в `half`.
5. Открытие ссылки `/property?focus=abc123` или `/map?focus=abc123` сразу подсвечивает объект.
6. Смена фильтра не «теряет» выбор, если объект всё ещё проходит фильтр.
