## Диагноз

«AI-консьерж» в проекте — это **поиск на /search** (хук `useGlobalSearch`), куда ведёт глянцевая кнопка «Спросите AI-консьержа» с главной (`HeroGreeting`). Параллельно есть локальный поиск на `/discover` (`NavigatorPage`), но он фильтрует только лейблы локального каталога кластеров, в БД не ходит вообще.

Проверил данные напрямую через анонимный REST:

- `listings` 332 строки активных, `properties` 24, `categories` 78, `services` 33, `salons` 11.
- Запросы `ilike '%врач%'`, `'%массаж%'`, `'%юрист%'`, `'%виза%'`, `'%клининг%'`, `'%стоматолог%'` → **0 совпадений** в `listings`. Только `'уборка'` и `'аренда'` дают результаты.
- Причина: в `listings.name_ru/name_en` нет распространённых русских ключевых слов. Сид-данные есть, но названия часто английские/нейминг бренда.

Дополнительно:

1. `useGlobalSearch` ищет в `listings` только по `name_en`, `name_ru`, `category`. Не используются `description_ru`, `description_en`, `tags`, `district`, `address`. Это срезает большинство русских запросов.
2. Запрос к `listings` не фильтрует по `approval_status='approved'`, в выдачу попадают `pending`. Не критично для «не находит», но это утечка модерации — попутно фиксим.
3. Словарь `SEARCH_SYNONYM_ENTRIES` маленький — нет «доктор», «налоги», «школа», «банк», «ремонт», «электрик», «сантехник», «такси», «ужин», «продукты», «фитнес», «уборка», «контракт», «бухгалтер» и т.п. Из-за этого пользователь не получает даже карточки-категории.
4. `/discover` (NavigatorPage): встроенный поиск делает substring-фильтр по `clusterCatalog`. Если ничего не нашёл — показывает «0 результатов» и не предлагает уйти на `/search` с этим же запросом.

## План правок (frontend-only, без миграций)

### 1. Расширить `useGlobalSearch` (`src/hooks/useGlobalSearch.ts`)

- В запросе к `listings` добавить в `.or(...)` поля `description_en`, `description_ru`, `district`, `address` и фильтр `approval_status=eq.approved`.
- В каждой записи `searchTables` (где есть `description_*`) — добавить эти поля в OR. Применимо как минимум к `properties`, `salons`, `events`, `water_activities`, `legal_services`, `services`. Делаем универсально через расширение `TableConfig` (`extraSearchFields?: string[]`).
- Поднять `limit(10)` для `listings` (оставляем) и `limit(5)` для остальных (сейчас 3) — больше шансов что-то показать.
- Финальный лимит вывода поднять с 15 до 25.

### 2. Сильно расширить `SEARCH_SYNONYM_ENTRIES`

Добавить порядка ~40 RU/EN ключей → существующие маршруты (`APP_ROUTES`):

```text
доктор / клиника / поликлиника  →  /medical
налог / tax / accountant         →  /legal?service=tax
школа / school / детский сад     →  /school-finder
банк / bank account              →  /legal?service=banking
ремонт / handyman                →  /services?category=handyman
электрик / electrician           →  /services?category=electrical
сантехник / plumber              →  /services?category=plumbing
кондиционер / ac repair          →  /services?category=ac-repair
такси / taxi                     →  /transport
кафе / ресторан / dinner / еда   →  /restaurants
доставка / delivery              →  /food-delivery
продукты / market / grocery      →  /market
фитнес / gym / спортзал          →  /fitness
салон / nails / маникюр / hair   →  /beauty
визу / visa / DTV / Elite        →  /visa/quiz
контракт / договор / contract    →  /legal?service=contract
страховка / insurance            →  /legal?service=insurance
сим / sim card                   →  /sim
обмен / exchange / валюта        →  /exchange
яхта / yacht charter             →  /yachts
тур / экскурсия / tour           →  /tours
бронь / booking                  →  /property/rent
```

Каждая запись использует `mkCat(...)` с уникальным id. Это гарантирует, что при пустой выдаче из БД пользователь всегда получает релевантную «категорию-карточку», а не «Ничего не найдено».

### 3. Fallback в `NavigatorPage` (`/discover`)

В блоке «0 результатов» добавить кнопку **«Искать в каталоге →»**, которая ведёт на `/search?q=<query>` (RU/EN текст). Сейчас этой кнопки нет — пользователь упирается в тупик. Это однострочное изменение в JSX рядом с line ~801.

### 4. Empty-state на `/search`

Когда `filteredResults.length === 0`, показывать 4 «популярных» категории-кнопки (`Виза`, `Жильё`, `Услуги`, `Транспорт`) ведущие на соответствующие хабы — чтобы запрос вроде «помоги» или опечатка не давали мёртвый экран.

## Технические детали

- Файлы: `src/hooks/useGlobalSearch.ts` (главный), `src/components/navigation/NavigatorPage.tsx`, `src/pages/Search.tsx`.
- Миграции БД не нужны.
- `sanitizeSearchTerm` оставляем как есть — он корректен.
- Регрессий не ожидаю: расширение `.or(...)` обратно совместимо; синонимы — чистое добавление; fallback-кнопки — UI-only.

## Что НЕ делаем (вне scope)

- Не вводим `tsvector` / pg_trgm индексы и материализованные view — это отдельный большой кусок и требует миграции.
- Не дописываем сид-данные. Если хочешь — вторым шагом могу прогнать AI-обогащение `name_ru` / `description_ru` по существующим 332 листингам.
- Не меняем `concierge-route` edge function (она для онбординга, не для поиска).

## Проверка после правок

1. На `/search` ввести: `врач`, `массаж`, `юрист`, `визу`, `школа`, `банк`, `ремонт` — каждый запрос должен показать минимум 1 карточку-категорию + (где есть в БД) реальные карточки.
2. На `/discover` ввести то же самое → должна появиться кнопка «Искать в каталоге →» при 0 результатов.
3. Network: запрос к `listings` теперь содержит `approval_status=eq.approved` и расширенный `or(...)`.
