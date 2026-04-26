## Аудит сектора «Навигатор» — что нашёл

### Карта сущностей

«Навигатор» в проекте — **3 разных поверхности**, и у них уже есть дрейф:

```text
1. NavigatorPage          src/components/navigation/NavigatorPage.tsx
   └─ монтируется на:
      - /discover                  (pageRegistry.Discover, AnimatedRoutes:191)
      - /me/services               (MeServices.tsx)
      - bottom-nav «Navigator» tab (через event navigator:open-apps-drawer → AllAppsDrawer)

2. ClusterGrid + AllSectionsAccordion  src/components/home/{ClusterGrid,AllSectionsAccordion}.tsx
   └─ блок «Все разделы» внутри / (consumer-home, Index.tsx)

3. AppDrawer / AllAppsDrawer       src/components/{nav/AppDrawer,layout/AllAppsDrawer}.tsx
   └─ свой каталог кластеров с filterCatalogForUser
```

Все три должны быть фасадами над одним SSOT — `src/lib/catalog/taxonomy.ts`. Сейчас это не так.

---

## Что НЕ соответствует канону

### 1. NavigatorPage показывает workspace-кластеры всем (audience-фильтр выключен)

`NavigatorPage.tsx:28` использует `CLUSTER_CATALOG` напрямую, **без** `filterCatalogForUser({personas, role})`. AppDrawer и AllAppsDrawer фильтр применяют (см. их строки 41/147), а Navigator — нет.

Последствие: гость на `/discover` или анонимный пользователь, нажимая bottom-tab «Navigator», видит кластер `manage` («Операции») — это workspace-only по SSOT (`taxonomy.ts:162`, `audience: 'workspace'`, personas `property_owner|local_services_provider`, roles `owner|admin|team|vendor`). Тот же дефект в счётчике «X сервисов» в шапке — `TOTAL_NAVIGATOR_SERVICES` считает по всему каталогу.

Ровно такую же штуку мы только что чинили для Home — где `manage` уже скрыт. На NavigatorPage фикс не докатили.

### 2. Дрейф между SSOT и `roleBlend.ts`

`src/lib/roleBlend.ts` держит **свой** список `CLUSTERS` (строки 38–47) и хардкод-роуты, не совпадающие с SSOT:

| cluster | SSOT (taxonomy.ts) labelRu | roleBlend labelRu | route |
|---|---|---|---|
| arrive | «Прибытие» ✅ | «Прибытие» | `/life/arrival` |
| live   | «Жизнь» | «Повседневные сервисы» ❌ | `/discover` |
| manage | «Управление» | «Управление объектом» | `/mc` |
| invest | «Инвестиции» ✅ | «Инвестиции» | `/invest` |
| legal  | «Право и визы» | «Документы» ❌ | `/life/relocation` |
| build  | «Застройщикам» | «Размещение проектов» ❌ | `/property/offplan` |

Результат: на главной (`/`) под аккордеоном «Все разделы» юзер видит другой нейминг и попадает по другим маршрутам, чем из NavigatorPage. Рядом — захардкоженный `'45 services'` и `items: '5'/'14'/…` (не из SSOT, не пересчитываются).

К тому же `ClusterGrid` пропускает `manage` через тот же `blendClusters` без audience-фильтра — workspace снова виден гостю.

### 3. Tile-дизайн отступает от DS2.0 / canon

Каноны (`src/components/ds/CategoryGrid.tsx`, mem://style/design-system-ds2-standards):
- семантические токены, `CatalogCard`/`CategoryGridCell` шаблон;
- min touch target 44px, иконка 40×40 в соф-bg;
- `bg-card border-border/60`, `[box-shadow:var(--shadow-elevation-1)]`.

`NavigatorPage.ServiceTile` (строки 117–151) нарушает:
- хардкод цветов: `clusterColor + '14'`, `'#F59E0B22'`, `'hsl(0 0% 100% / 0.08)'` — обход токенов;
- размер `72×72` с `text-[10px]` `line-clamp-1` — лейблы режутся (видно для `Wedding planning`, `Property management` и т.п.);
- `rounded-none` ок (соответствует canon-strip-rounded), но визуально без `border` и без `shadow` плитка теряется в тёмной теме;
- иконка 20px не достигает min 24px стандарта DS2.0;
- горизонтальные scroll-rails с `snap-mandatory` ломают доступность (не видно сколько ещё за кадром, нет fade-mask и нет «N more →»).

`SOON_SERVICES` блок при этом — pill с border `clusterColor + '20'` — другая визуальная грамматика, чем плитки.

### 4. CTA «Все сервисы →» открывает AllAppsDrawer, дублирующий тот же контент

В footer NavigatorPage (`строки 394–405`) кнопка `All services →` диспатчит `navigator:open-apps-drawer`, который открывает `AllAppsDrawer` — это второй каталог кластеров над тем же SSOT. Получается «Навигатор внутри Навигатора». На канон не ложится — должен быть один каталог + поиск, без матрёшки.

### 5. Footer-stats запросом к БД на каждом открытии

`useQuery(['navigator-stats'])` в NavigatorPage делает 3 `count: 'exact'` к `properties`/`property_bookings`/`providers` без кеша persisted. Для бесплатно-доступной публичной страницы это лишние RPC.

---

## Как сейчас аудитории находят свои сервисы

Сводная карта (mapping в `roleBlend.CLUSTER_SCORES` + `taxonomy.audience` + `SIGNAL_ROUTE`):

| Персона | Главный путь | Куда NavigatorPage шлёт | Дефект |
|---|---|---|---|
| tourist | `/` → ActiveSituation/HeroIntro → `/life/arrival` | видит все 6 кластеров | видит «Управление» (workspace) |
| resident | `/` → AllSectionsAccordion → `live`/`legal` | видит все 6 | то же |
| family / couple / nightlife / active / nomad / pet_owner | `SIGNAL_ROUTE → /discover` | NavigatorPage без узкого фильтра по «consumer lifestyle» | свой кластер `live` теряется среди 6 равноправных |
| property_owner | `/mc` (workspace shell) + `/discover` | `manage` корректно виден | дубль с AppDrawer |
| local_services_provider | `/vendor` | `manage` виден | то же |
| investor / real_estate_developer | `/invest` или `/property/offplan` | `invest`/`build` видны | счётчик + soon смешаны |

Ключевой риск: гостю-туристу на `/discover` сейчас показывается «Операции» с 9 сервисами УК — это и UX-шум, и нарушение audience-контракта, описанного в `clusterCatalog.test.ts` («hides workspace clusters from a bare guest»).

---

## План фиксов

### Этап 1 — Audience contract на NavigatorPage (P0)
1. В `NavigatorPage.tsx` заменить `CLUSTERS = CLUSTER_CATALOG` на `useMemo(() => filterCatalogForUser({ personas, role }), [personas, role])`.
2. Источник `personas` — `useUserPersonas()`; `role` — из `useNavRole()` (уже используется в BottomBar).
3. Пересчитать `TOTAL_NAVIGATOR_SERVICES` и счётчики чипов из отфильтрованного списка.
4. Обновить регресс-тест: `src/test/catalog/taxonomy-coverage.test.ts` дополнить кейсом «NavigatorPage hides manage for guest».

### Этап 2 — Слияние `roleBlend.CLUSTERS` в SSOT (P0)
1. Удалить локальный массив `CLUSTERS` из `roleBlend.ts`. Оставить только `CLUSTER_SCORES`.
2. `blendClusters()` возвращает `ClusterCatalogEntry[]` из SSOT, отсортированный по score.
3. `ClusterGrid.tsx` берёт `labelRu`, `valueRu`, `color`, `route` (новое поле в SSOT — `homeRoute`) из SSOT-элемента; счётчик `items` — `services.filter(s=>s.status!=='soon').length`.
4. Захардкоженный `'45 services'` в `AllSectionsAccordion` заменить на `CLUSTER_CATALOG_TOTAL_AVAILABLE`.

### Этап 3 — Audience в ClusterGrid (P0)
В `ClusterGrid` пропускать `personas` через `filterCatalogForUser({personas})` ДО `blendClusters`, чтобы workspace-кластеры не рендерились гостю на `/`.

### Этап 4 — DS2.0 canon на плитках (P1)
1. Заменить inline-цвета `clusterColor + '14'` на `bg-cluster-{id}/8` через CSS-vars из `tokens.css` (есть `--cluster-arrive`, `--cluster-live`…). Если переменных нет — добавить.
2. Плитка: `min-h-[88px] w-[88px]`, иконка 24px, лейбл `text-[11px] line-clamp-2`, `border border-border/60` + `[box-shadow:var(--shadow-elevation-1)]` — выровнять с `CategoryGrid.CategoryGridCell`.
3. Rail: добавить `right-fade-mask` и кнопку `→` с количеством скрытых сервисов.
4. `SOON_SERVICES` pill заменить на ту же `ServiceTile` с `disabled+badge=Soon` — единая грамматика.
5. PRO-бэйдж — токенный `bg-warning/15 text-warning`.

### Этап 5 — Убрать матрёшку Navigator → AllAppsDrawer (P1)
Footer-CTA `All services →` ведёт **внутрь** того же каталога. Заменить на:
- ссылку «Открыть как drawer» убрать;
- вместо этого `Link to="/me/services"` (если уже на `/discover`) и наоборот — single-source каталог.

### Этап 6 — Persona-aware ordering для consumer-lifestyle (P2)
Для персон `family/couple/nightlife/active/nomad/pet_owner`, у которых `SIGNAL_ROUTE=/discover`, в NavigatorPage поднимать кластер `live` первым (через `blendClusters` API) и схлопывать остальные в аккордеон «Ещё разделы».

### Этап 7 — Cache + perf (P3)
`navigator-stats` query: `staleTime: 60min`, `gcTime: 24h`, persisted в `localStorage` (`PERSIST_QUERY_KEYS`).

---

## Файлы под правку
- `src/components/navigation/NavigatorPage.tsx` — audience filter, ServiceTile DS2.0, footer CTA
- `src/lib/roleBlend.ts` — удалить локальные CLUSTERS, оставить scoring
- `src/components/home/ClusterGrid.tsx` — потребление SSOT + audience
- `src/components/home/AllSectionsAccordion.tsx` — счётчик из SSOT
- `src/lib/catalog/taxonomy.ts` — добавить `homeRoute` в `ClusterEntry` (для `ClusterGrid`)
- `src/styles/tokens.css` — `--cluster-{id}` переменные, если нет
- `src/test/catalog/taxonomy-coverage.test.ts` — кейс на Navigator audience
- новый `src/test/navigation/navigator-audience.test.tsx` — guest не видит manage

## Что не трогаем
- SSOT `taxonomy.ts` cluster ids/audience — недавно стабилизированы.
- AppDrawer / AllAppsDrawer — там фильтр уже корректный.
- BottomBar / navigationModel — отдельный контракт, audit прошёл в Wave 5.

После 1–3 этапов («P0») проблема «гости видят workspace в Навигаторе» закрыта и mapping из 14 персон в 6 кластеров становится единообразным во всех трёх поверхностях.