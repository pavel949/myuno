# План: Wave 2 (TH-локализация) + новый модуль «Сообщества & Консульства»

Делаю два трека параллельно — они независимы.

---

## Трек A — Wave 2: Тайская локализация (DB + i18n + UI)

### A1. Расширить схему БД
Миграция добавляет `title_th`/`description_th`/`name_th` где их нет:
- `life_situations`: `title_th`, `description_th`
- `categories`: `name_th`, `description_th`
- `category_groups`: `name_th`, `description_th`

CI-guard (Wave 5.3) затем не пропустит запись без TH-полей.

### A2. Перевести существующий контент через Lovable AI Gateway
Один batch-скрипт `scripts/i18n/translate-to-th.mjs`:
- Берёт все строки из `life_situations` / `categories` / `category_groups` с пустым `*_th`.
- Шлёт в `google/gemini-2.5-flash` системным промптом «professional Thai translator for a luxury service marketplace on Phuket, keep proper nouns intact, return JSON».
- Пишет результат обратно через `UPSERT`.
- Итого ~70 строк × 3 поля ≈ 1 запрос batch'ем, ~5 секунд.

### A3. Протянуть `title_th`/`name_th` в фронт
Единый helper `src/lib/i18n/pickLocalized.ts`:
```ts
pickLocalized(record, lang, base)   // base='title' → ищет title_th / title_en / title_ru
// fallback chain: th → en → ru
```
Подключить в:
- `src/hooks/useSituationServiceCounts.ts`
- `src/components/situations/SituationCard.tsx`, `SituationDetailPage.tsx`
- `src/hooks/useNavigatorContent.ts`
- `src/components/vendor/onboarding/CategoryPicker.tsx` (уже принимает `labelTh` в типе — рендерить)
- любые места где сейчас `record.title_en` хардкодом.

### A4. Покрыть статические UI-строки лендинга и каталога в `src/i18n/`
- Сравнить `src/i18n/ru.json` ↔ `src/i18n/en.json` ↔ `src/i18n/th.json`: найти ключи отсутствующие в TH.
- Заполнить недостающие через тот же batch-скрипт (или вручную ключи, где TH уже частично есть — догнать до 100%).
- Целевые namespace для этого захода: `landing.*`, `navigator.*`, `catalog.*`, `vendor.onboarding.*`, `communities.*` (новый — см. трек B).
- Гард в QA-симуляторе: «строк missing для th = 0».

### A5. Контроль
- Прогон `node scripts/qa/simulate-50.mjs` после.
- Дополнительная проверка: `node scripts/qa/check-th-coverage.mjs` (новый скрипт, считает % покрытия TH по DB + i18n JSON и пишет в `docs/audit/qa-latest.md`).

---

## Трек B — Модуль «Сообщества и консульства»

### B1. Скоуп контента (что показываем)
4 типа точек на одной карте/каталоге:
1. **Религиозные** — церкви, храмы (буддистские wat, христианские, мечети, синагоги).
2. **Клубы и сообщества по интересам** — экспат-клубы (русский, британский, скандинавский), яхт-клубы, гольф-, MC-, фитнес-клубы.
3. **Консульства и почётные консулы** на Пхукете + ближайшие посольства в Бангкоке (для всех стран нашей аудитории).
4. **Регулярные мероприятия / митапы** — language exchanges, business breakfasts, Sunday services, Friday prayer (опционально, через расписание).

### B2. Схема БД (одна миграция)
```sql
-- enum
CREATE TYPE community_kind AS ENUM ('religion','club','consulate','meetup');
CREATE TYPE religion_branch AS ENUM ('buddhist','christian_catholic','christian_orthodox','christian_protestant','muslim','jewish','hindu','sikh','other');

-- core table
CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  kind community_kind NOT NULL,
  name_en text NOT NULL,
  name_ru text,
  name_th text,
  description_en text,
  description_ru text,
  description_th text,
  -- typology
  religion religion_branch,
  country_code text,                 -- for consulates ('RU','GB','DE'...)
  consulate_type text,               -- 'embassy' | 'consulate_general' | 'honorary'
  language_primary text,             -- 'en','ru','th','de'...
  -- location
  address text,
  city text,
  province text,
  lat numeric, lng numeric,
  google_place_id text,
  -- contacts
  phone text, email text, website text, whatsapp text, telegram text,
  -- schedule (jsonb): {mon:["09:00-17:00"], sun:["08:00","10:00"]}
  schedule jsonb,
  -- meta
  source_url text,                   -- where we ingested it from
  verified_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.communities TO anon, authenticated;
GRANT ALL ON public.communities TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communities_public_read" ON public.communities FOR SELECT USING (is_active);
CREATE POLICY "communities_admin_write" ON public.communities FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
```
Привязки:
- Новая `life_situations` запись `community` → кластер `live` (link + ru/en/th).
- Новая `categories.communities` под `live` (для каталога/счётчика).

### B3. Сбор данных (Firecrawl + AI gateway)
Источники, которые я планирую парсить через Firecrawl `scrape`/`map`:
- **Буддистские храмы Пхукета** — официальный туристический портал Phuket Tourism, Wikipedia категория "Temples in Phuket Province", Google Maps Places API (тип `place_of_worship`).
- **Христианские церкви** — phuketcatholic.com, redeemerphuket.com, anglican-phuket, ru-приходы РПЦ за рубежом.
- **Мечети** — Wikipedia "Mosques in Phuket Province".
- **Консульства на Пхукете** — официальный список Phuket Provincial Office of Foreign Affairs (есть PDF/HTML) + сайт МИД РФ (генконсульство Пхукет), GOV.UK, US Embassy BKK (рекомендации почётных консулов), German Auswärtiges Amt.
- **Посольства в Бангкоке** — Wikipedia "List of diplomatic missions in Thailand" — полный список 60+ стран с адресами и контактами.
- **Экспат-клубы и сообщества** — phuket-expats.com, internations.org/phuket, Russian Phuket community group landing pages.

Скрипт `scripts/ingest/communities.mjs`:
1. Для каждого URL → `firecrawlScrape` + format=`json` со schema под нашу `communities`.
2. Дедупликация по `(name_en, address)` или `google_place_id`.
3. Перевод `name`/`description` на отсутствующие языки через AI gateway.
4. Геокодинг через Google Places API (уже подключён, см. `architecture/google-maps-integration-standard`).
5. UPSERT в `communities` + лог в `docs/ingest/communities-{date}.json` для аудита.

Ожидаемый объём (черновая оценка): ~40 храмов + 25 церквей/мечетей + 60 посольств + 15 консульств Пхукет + 30 клубов ≈ **170 записей**. Если Firecrawl-кредитов не хватит на всё — приоритет: консульства → клубы → религия.

### B4. UI / навигация
- Маршрут `/communities` (под surface `live`, использовать существующий `MiniAppLayout`).
- Под-табы: «Все · Религия · Клубы · Консульства · События».
- Карточка: имя (TH/RU/EN auto), тип-иконка, адрес, контакты, кнопка «Маршрут» (открывает Google Maps).
- Фильтры: язык общины, страна (для консульств), религия (для культовых).
- Карта `/communities/map` — переиспользует существующую `UniversalMap` (`architecture/universal-map-and-search-pipeline`) с новым слоем.
- Детальная страница `/communities/:slug` — описание, расписание служб/встреч, контакты, similar.
- Точка входа на лендинге (`WelcomeLanding`): тайл в блоке «Жизнь на Пхукете» рядом с уже существующими.
- Поиск через ⌘K (Super Search) — `useGlobalSearch` дополнить таблицей `communities`.

### B5. Memory (Master Taxonomy v1.0)
Добавить запись в `src/lib/taxonomies/master.ts`: новая JTBD-метка не нужна — попадает в `J · Social/Belonging` (или ближайшую). Только обновить мемори-файл `mem://features/communities` после миграции.

---

## Порядок исполнения

```text
A1 (DB)   ───┐
A2 (batch TH translate) ───┤   параллельно ──► A3+A4 (UI)  ──► A5 (QA)
B2 (DB)   ───┘
B3 (ingest) ─────► B4 (UI/route) ─────────────────────────► QA
```

Запускаемые миграции (по порядку):
1. `wave2_th_localization_columns.sql` (A1)
2. `wave2_th_translation_data.sql` (A2, ставит уже переведённые значения; запускается после генерации)
3. `communities_schema.sql` (B2)
4. `communities_seed.sql` (B3, после ingest)

---

## Что НЕ входит в этот заход (сознательно)

- Авто-обновление расписания служб/встреч (нужен cron — отдельная история).
- Заявки модераторам общин от самих общин (vendor-style onboarding) — следующая итерация.
- Полная локализация админки на TH — пользовательский UI важнее.
- Интеграция с религиозными календарями (Easter/Eid/Songkran service times) — после MVP.

---

## Оценка и рекомендация

- Трек A — ~3-4 миграции/скрипта, 1 helper, ~6 файлов фронта. Низкий риск.
- Трек B — крупнее: новая схема + ingest pipeline + новый раздел UI. Самое непредсказуемое — качество данных от Firecrawl (часть страниц защищена JS) и расход Firecrawl-кредитов.

**Рекомендую** выполнять в такой последовательности: **A1+A2 (миграция и перевод) → B2 (схема communities) → A3+A4 (UI локализации) → B3 (ingest) → B4 (UI communities) → финальный QA-прогон**. Это даёт работающую TH-локализацию уже после ~30% работы и страхует, если Firecrawl-парсинг затянется.

Подтверди — стартую с A1+A2+B2 одним заходом? Или хочешь, чтобы я сначала отдельно показал список источников и примерное количество записей для B3 до того, как тратить Firecrawl-кредиты?
