

User wants analysis: can PEYLAA be used as the first newbuild site/microsite, and what's missing. This is research/analysis, not a build task. But user might want a follow-up implementation. Let me plan a thorough investigation + gap analysis.

I need to:
1. Inspect existing PEYLAA module (`src/lib/peylaa/`, pages, components)
2. Check what PEYLAA DB has (units, amenities, project_info)
3. Compare against `/newbuilds` ecosystem (`property_projects`, `developers`, `nb_leads`, `project_units`, microsite `/p/:slug`)
4. Identify gaps: data model, lead pipeline, CRM sync, microsite integration, SEO, multi-language, gallery, floor plans, payment flow
5. Present findings + recommended path

## План: Аудит PEYLAA как первого сайта новостроек

### Что проверю

**1. Текущее состояние PEYLAA**
- Структура `src/lib/peylaa/` (типы, клиент, hooks)
- PEYLAA pages/routes (есть ли уже отдельный лендинг, каталог юнитов, форма лида)
- PEYLAA DB schema (через `supabaseClient.ts`): `units`, `amenities`, `project_info`, `leads`
- Какие данные уже заполнены (юниты с ценами, фото, floor plans)

**2. Сравнение с newbuilds-экосистемой**
- `property_projects` — что есть/нет относительно PEYLAA
- `project_units` vs `peylaa.units` — маппинг полей
- `developers` — есть ли Autograph/Marriott в каталоге
- Микросайт `/p/:slug` — как PEYLAA вписывается
- Lead pipeline: `nb_leads` + attribution + CRM trigger
- Developer Portal интеграция (нужна ли)

**3. Gap-анализ по 8 категориям**

| Категория | Что нужно для микросайта новостройки | Что есть в PEYLAA | Что отсутствует |
|---|---|---|---|
| Данные проекта | name, location, lat/lng, completion date, total_units | ? | ? |
| Каталог юнитов | unit_no, area, price, floor plan, gallery, status | ✅ есть | ? |
| Девелопер | logo, brand, history | ? | ? |
| Lead capture | имя, телефон, WhatsApp/TG, UTM | ? | ? |
| CRM sync | nb_leads → crm_contacts trigger | ? | ? |
| Микросайт SEO | meta_title, og_image, slug | ? | ? |
| Multilang | RU/EN/ZH/TH | ✅ частично | ? |
| Mobile UX | sticky CTA, форма-шит | ? | ? |

**4. Стратегические опции (3 пути)**

Сравню три варианта интеграции:
- **A. Migrate** — перенести PEYLAA данные в `property_projects`+`project_units`, удалить отдельный peylaa schema, использовать стандартный `/p/peylaa`
- **B. Hybrid** — оставить PEYLAA в своей БД (read-only sales system), но добавить тонкий мост: запись лидов идёт в primary DB `nb_leads`, отображение из PEYLAA
- **C. Standalone** — оставить как сейчас, отдельный лендинг `/peylaa` с собственным lead-flow, не интегрировать с newbuilds

Для каждого: pros/cons, время реализации, риски.

### Формат отчёта

Markdown в чате (~50 строк), 5 секций:

**📊 Что есть в PEYLAA сейчас**
- Таблицы, страницы, поля, заполненность данных

**🎯 Что нужно микросайту новостройки (стандарт newbuilds)**
- Чек-лист из 8 категорий

**❌ Gap-анализ**
- Конкретные пробелы с приоритетом (P0/P1/P2)

**🛤️ Три пути интеграции**
- Migrate / Hybrid / Standalone — таблица сравнения

**✅ Рекомендация**
- Какой путь выбрать + почему + roadmap (3-5 шагов)

### Что НЕ делаю
- Никаких правок кода, миграций, изменения данных
- Не запускаю smoke-тесты
- Не трогаю PEYLAA БД

### Время
~5-7 минут (чтение 8-10 файлов + 3-4 SQL запроса к обеим БД).

