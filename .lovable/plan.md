# План: офлайн-карта Пхукета на MapLibre

## Цель
Заменить Google Maps на `/map` на MapLibre GL JS с локальными векторными тайлами Пхукета, чтобы карта работала полностью офлайн (PWA precache) без зависимости от Google.

## Архитектура

```text
┌─ Сборка тайлов (one-off, локально/CI) ─┐
│ Geofabrik thailand-latest.osm.pbf      │
│   ↓ osmium extract (Phuket bbox)       │
│ phuket.osm.pbf (~15 MB)                │
│   ↓ tilemaker + OpenMapTiles schema    │
│ phuket.mbtiles (z6–z14, ~25–40 MB)     │
│   ↓ mb-util / pmtiles convert          │
│ phuket.pmtiles (один файл, range-req)  │
└────────────────────────────────────────┘
                  ↓ upload
        Supabase Storage: map-tiles/phuket.pmtiles (public bucket)
                  ↓
┌─ Frontend ─────────────────────────────┐
│ MapLibre GL JS + pmtiles protocol      │
│ Style: OSM Bright (self-hosted JSON)   │
│ Glyphs/sprites: Storage map-assets/    │
│ Слои поверх: vendor markers + OSM POI  │
│   (через nearby_pois RPC)              │
└────────────────────────────────────────┘
                  ↓
┌─ Офлайн (PWA) ─────────────────────────┐
│ vite-plugin-pwa: precache pmtiles +    │
│ style.json + glyphs/sprites            │
│ Workbox CacheFirst для tiles URL       │
└────────────────────────────────────────┘
```

## Шаги

### 1. Сборка тайлов (выполняется один раз в sandbox)
Скрипт `scripts/build-phuket-tiles.sh`:
- `curl` Geofabrik thailand-latest.osm.pbf (~700 MB)
- `nix run nixpkgs#osmium-tool -- extract --bbox 98.2,7.7,98.5,8.2 -o phuket.osm.pbf`
- `nix run nixpkgs#tilemaker -- --input phuket.osm.pbf --output phuket.mbtiles` (OpenMapTiles config)
- `nix run nixpkgs#go-pmtiles -- convert phuket.mbtiles phuket.pmtiles`
- Залить в Supabase Storage `map-tiles` через `supabase--storage_upload`

Тайлы z6–z14 покрывают остров целиком до уровня улиц. Размер ~25–40 MB — приемлемо для PWA precache на мобильном.

### 2. Storage buckets
- `map-tiles` (public, immutable cache headers) — pmtiles
- `map-assets` (public) — style.json, glyphs (PBF шрифты Noto Sans), sprites

### 3. Зависимости
```
bun add maplibre-gl pmtiles
```

### 4. Новый компонент `src/components/map/MapLibreMap.tsx`
- Регистрирует `pmtiles` protocol
- Загружает style.json (self-hosted OSM Bright адаптированный под deep-sea тему)
- Принимает `markers`, `onMarkerClick`, `center`, `zoom`
- Layer для vendor markers (GeoJSON source из props)
- Layer для OSM POI (из `nearby_pois` RPC)
- Кнопка "Center on me" (`navigator.geolocation`)
- Attribution: «© OpenStreetMap contributors»

### 5. Рефакторинг `src/pages/MapView.tsx`
- Заменить `@react-google-maps/api` `<GoogleMap/>` на `<MapLibreMap/>`
- Убрать `loadScript`/API key зависимости
- Сохранить существующие фильтры, попапы, интеграцию с `place-details` (Google details по тапу остаются опциональной обогащающей деталью)

### 6. PWA precache
- Подключить `vite-plugin-pwa` (если не подключён) с `generateSW`
- `workbox.runtimeCaching`:
  - `phuket.pmtiles` → CacheFirst, 90 дней
  - `map-assets/*` → CacheFirst, 90 дней
- Следовать skill/pwa: registration только в prod, guard для Lovable preview
- Размер precache: ~40 MB pmtiles + ~2 MB assets

### 7. Удалить/деприкейтить
- Не удаляем Google Maps SDK сразу — оставляем для `place-details` обогащения и других страниц (`property/*`, и т.д.)
- На `/map` Google больше не грузится

## Технические детали

**pmtiles vs mbtiles в браузере:** pmtiles работает через HTTP Range requests, не требует серверной части. mbtiles — это SQLite, нужен либо backend, либо предварительная конверсия в pmtiles. Выбираем pmtiles.

**Стиль:** берём OSM Bright за основу (open source, BSD-3), модифицируем под токены `--background #08101E`, accent `#00D68F`. Файл `public/map-style/phuket-dark.json`.

**Шрифты для labels:** Noto Sans Regular + Bold в PBF формате (~500 KB), хостим в `map-assets`.

**Размер бандла:** maplibre-gl ~200 KB gz, pmtiles ~15 KB gz. Лениво грузим только на `/map`.

## Что НЕ входит
- Полнотекстовый поиск по тайлам (используем существующий Super Search)
- Routing/навигация (отдельная задача, нужен OSRM)
- 3D-здания (z14 максимум, плоская карта)
- Замена Google Maps на других страницах (`property/*`, owner views) — отдельная итерация

## Риски
- **Сборка тайлов в sandbox долгая** (5–10 мин на thailand.osm.pbf). Если timeout — режем bbox раньше через Overpass.
- **40 MB precache** — на медленном 3G первая загрузка PWA займёт минуту. Делаем lazy precache: тайлы кэшируются по факту использования, не на install.
- **Стиль OSM Bright** требует кастомизации, чтобы соответствовать deep-sea theme — отдельная работа дизайнера, на старте отдадим базовый dark.

## Готовность к итерациям
После MVP можно добавить: маршрутизация (OSRM), геокодинг офлайн (Pelias-lite), сателлитный слой (Maxar tiles по подписке).
