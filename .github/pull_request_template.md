# Pull Request

## Описание
<!-- Что и зачем меняется в одном-двух предложениях. -->

## Тип изменения
- [ ] Bug fix
- [ ] Новая фича
- [ ] Рефактор / cleanup
- [ ] Изменение публичного контента / URL / продуктовых имён
- [ ] Изменение инфраструктуры / CI / DB schema

---

## Semantic Core · чек-лист (canonical 10)

> Заполняется для PR, создающих или меняющих публичные страницы, статьи,
> продуктовые имена, URL, schema.org или AI system prompts.

- [ ] **Not applicable** — PR не затрагивает публичный контент / URL / имена

### Семантика (§1, §3, §5)
- [ ] Ровно один intent на страницу, сформулированный одним предложением
- [ ] Каноническое имя сущности совпадает с `10-semantic-core.md §5`
- [ ] Lifecycle / Role / Cluster теги присвоены (§3)
- [ ] Кластер запросов определён (§6 или добавлен в `keyword-map.csv`)

### Контент (§4, tone-of-voice canonical 03)
- [ ] Tone of voice пройден (`03-tone-of-voice.md §14`)
- [ ] Первое предложение — про клиента, не про нас
- [ ] Минимум одна цифра или конкретный факт
- [ ] Раздел «что не входит» / «что нас беспокоит» — для коммерческих страниц

### SEO (§9)
- [ ] Уникальный `<title>` ≤60 chars с основным запросом кластера
- [ ] Уникальный `<meta description>` ≤160 chars по формуле §2.4
- [ ] Один `<h1>`, содержит основной запрос
- [ ] `<link rel="canonical">`
- [ ] `hreflang` для мультиязычных
- [ ] Schema.org из §9.1 (через `<JsonLd>` + builders из `src/lib/seo/schemaBuilders.ts`)
- [ ] OG / Twitter теги
- [ ] Добавлено в `public/sitemap.xml` или `sitemap-pillars.xml` / `sitemap-landings.xml`
- [ ] Внутренние ссылки по §7.2

### Технически
- [ ] URL в kebab-case, английский, ≤5 слов, без trailing slash
- [ ] Mobile 375 px проверен
- [ ] Core Web Vitals: LCP < 2.5 s, CLS < 0.1

### Автоматические проверки
- [ ] `npm run lint` проходит
- [ ] `npm run validate:semantic` проходит (0 errors)
- [ ] `npx tsc --noEmit` clean
- [ ] Тесты проходят

## Изменения продуктовых имён (§5)

- [ ] Not applicable

Если applicable:
- [ ] PR в `10-semantic-core.md §5` смержен заранее или включён в этот же PR
- [ ] Все упоминания старого имени в `.tsx`, `.md`, `.ts` заменены
- [ ] System prompts AI-агентов (`supabase/functions/*`, `08-ai-prompts-library.md`) обновлены
- [ ] Schema.org markup на существующих страницах обновлён
- [ ] 301-редирект настроен в `vercel.json` для изменённых URL

## Rollback plan
<!-- Как откатить за 1 коммит. -->
