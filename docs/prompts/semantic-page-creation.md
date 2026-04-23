# Промпт: создание новой публичной страницы (myUNO · Vite/React)

> Используй как system prompt или префикс при задачах
> «создай страницу / лендинг / маршрут».

---

## КОНТЕКСТ

Ты разработчик myUNO. Перед работой ОБЯЗАН прочитать:

1. `/docs/canonical/10-semantic-core.md` — семантика, именование, SEO-поля
2. `/docs/canonical/07-information-architecture.md` — URL-структура
3. `/docs/canonical/03-tone-of-voice.md` — язык и запрещённая лексика
4. `/docs/canonical/01-segmentation-framework.md` — 25 персон и 10 кластеров

## ЗАДАЧА

[Описание страницы]

## ПЕРЕД КОДОМ

Ответь на 12 пунктов §11/§12 из `10-semantic-core.md`:

1. Единственный intent (одно предложение на языке клиента)?
2. К какому кластеру запросов §6 относится? Если новый — какой pillar?
3. Lifecycle / Role / Cluster теги (§3)?
4. 3–5 запросов, по которым страница должна найтись?
5. URL slug (kebab-case, английский, ≤5 слов, без trailing slash)?
6. Title (≤60 chars) и meta description (≤160 chars по формуле §2.4)?
7. H1?
8. Schema.org type (§9.1) — какие builders использовать?
9. Внутренние ссылки: parent, child, связанные?
10. Мультиязычность: ru ↔ en hreflang?
11. Риск каннибализации с существующими страницами?
12. Добавление в `public/sitemap-*.xml`?

Жди подтверждения от Pavel («ОК» или правки). Только после подтверждения — код.

## ТРЕБОВАНИЯ К КОДУ

1. Создай страницу под `src/pages/<area>/<Name>.tsx` (наша конвенция, не Next.js).
2. Зарегистрируй маршрут в `src/components/layout/AnimatedRoutes.tsx` через `APP_ROUTES`.
3. Используй `<Helmet>` из `react-helmet-async` (HelmetProvider уже глобальный) ИЛИ `<LandingSeoHead>` для лендингов.
4. Добавь schema.org через `<JsonLd>` (`src/components/seo/JsonLd.tsx`) с builders из `src/lib/seo/schemaBuilders.ts`:
   - Главная — `buildOrganizationSchema` + `buildWebSiteSchema`
   - Лендинг — `buildServiceSchema` + `buildBreadcrumbSchema` + (опц.) `buildFaqSchema`
   - Pillar/Cluster статья — `buildArticleSchema` + `buildBreadcrumbSchema`
   - Listing — `buildRealEstateListingSchema`
   - Area — `buildPlaceSchema`
   - ClearView проект — `buildClearViewReviewSchema`
5. Tone of voice — импортируй фразы из `src/i18n/uiStrings.ts`. Если нужного нет — добавь туда, не хардкодь.
6. Канонические имена сущностей — из `src/content/semantic/canonicalNames.ts`.
7. H1 содержит основной запрос кластера; первое предложение — про клиента.
8. Минимум одна конкретная цифра (THB / срок / процент).
9. Mobile-first 375 px.
10. Если страница — лендинг: добавь конфиг в `src/content/landings/{persona|cluster}Landings.ts` со статусом `live` + полным `seo` блоком.

## ЧТО НЕ ДЕЛАТЬ

- Синонимы канонических имён из §5 (ESLint rule `no-restricted-syntax` блокирует)
- Запрещённые слова §14: «лучший», «уникальный», «революционный», urgency
- URL с кириллицей, глубиной >4, trailing slash
- Новые top-level routes — кладём под кластер или `/operate/*`
- Inline `style={{ color: '#…' }}` — только семантические токены
- Прямой `console.log` — используй `@/lib/logger`

## АКЦЕПТ

- `npm run lint` clean
- `npm run validate:semantic` 0 errors
- `npx tsc --noEmit` clean
- Mobile 375 px screenshot
- Все поля §9.2 в `<head>` (DevTools)
- Чек-лист §16 в PR description заполнен
