## Цель

Унифицировать каталоги мини-аппов вокруг `MiniAppLayout` и канонических примитивов (`CatalogCard`, `SEOHead`, `CrossSellSection`), повысив консистентность с ~85% до ~98%. Property/real-estate трогаем **минимально** — только формальная фиксация исключения, без рефакторинга витрин.

---

## Объём работ (6 шагов)

### 1. InvestmentIndex — починить header props
Передать `heroIcon`, `heroTitle`, `heroSubtitle`, `categories`, `selectedCategory`, `onCategoryChange` в `MiniAppLayout` вместо собственного inline-hero и собственного `CategoryChips`. Сохранить горячие предложения / Real Estate / Business секции и Raise CTA. Hero-блок с градиентом и кнопками Market/Deals/Network/Execution оставить как доп. секцию ниже шапки (это спецфункционал хаба, не дублирует MiniAppHero).

### 2. KnowledgePillarsIndex → MiniAppLayout
Заменить ручную связку `PageContainer + BackButton + SEOHead + Input` на `MiniAppLayout` с `searchValue/onSearchChange/searchPlaceholder`, `heroIcon=BookOpen`, `heroTitle/Subtitle`. Поиск становится канонической строкой в шапке. Группировка pillars по `cluster` сохраняется в `children`.

### 3. PipelinesIndex → MiniAppLayout (CRM-context)
Обернуть в `MiniAppLayout` с `heroIcon=Layers`, `heroTitle="Воронки CRM"`, `showSearch=false`, `fallbackPath` на CRM-хаб. Карточки `PipelineCard` остаются — это уже корректный канонический паттерн.

### 4. Babysitter & Delivery → CatalogCard
Создать тонкие мапперы внутри файлов: babysitter → `CatalogCard` (image, title, subtitle=experience, price=`pricePerHour`/hr, badges=verified/featured, rating). Delivery `popularServices` → `CatalogCard` тем же путём. Inline кастомные карточки удалить. `deliveryTypes` (4 крупных tile с градиентами) **оставить как hero-блок** — это intent picker, а не каталог.

### 5. SEO-юнификация в MiniAppLayout
Добавить опциональные props `seoTitle?: string`, `seoDescription?: string`, `seoImage?: string`, `seoCanonical?: string` в `MiniAppLayoutProps` + `MiniappMode`. При наличии — рендерим `<SEOHead>` внутри. Прокинуть на 6-8 ключевых каталогов (Yachts, Flowers, Beauty, Cleaning, Medical, Pharmacy, Experiences, Restaurants), у которых сейчас нет SEO.

### 6. CrossSell в MiniAppLayout
Добавить prop `crossSellCluster?: 'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build'` в `MiniAppLayoutProps`. Если задан — снизу `children` рендерим `<CrossSellSection cluster={...} />`. Прокинуть на каталоги, где он сейчас отсутствует (по аудиту ~60%).

### 7. Property / Real Estate — НЕ трогаем код
- Никаких изменений в `src/pages/property/*`, `OffPlanCatalog`, `PropertyHub`, `Rent/Buy/Resale`, owner-витрине.
- Только обновляем `mem://architecture/canonical-catalog-and-card-standard`: добавляем секцию **"Documented exceptions"** с указанием, что property-family использует Airbnb-style hub-shell как осознанное архитектурное решение (см. `mem://architecture/property-hub-intent-based-navigation`).
- Это исключение фиксируем в комментарии-шапке у `PropertyHub.tsx` (одна docstring), без изменения логики/UI.

---

## Не входит

- Рефакторинг property-family витрин.
- Изменение поведения InvestmentIndex (категории, фильтры, кнопки хаба остаются).
- Замена `deliveryTypes` интент-блока в Delivery.
- Перевёрстка `PipelineCard` (она уже канонична).
- Любые изменения шрифтов/цветов/токенов.

---

## Технические детали

**Файлы (изменяем):**
- `src/components/layout/FeatureLayout.tsx` — добавить `seoTitle/seoDescription/seoImage/seoCanonical` и `crossSellCluster` props + рендер `<SEOHead>` (top) и `<CrossSellSection>` (bottom of children) в `MiniappMode`.
- `src/components/miniapp/MiniAppLayout.tsx` — реэкспорт типов уже идёт через `FeatureLayout`, дополнительных правок не нужно.
- `src/pages/invest/InvestmentIndex.tsx` — передать `heroIcon=TrendingUp`, `heroTitle`, `heroSubtitle`, `categories=INVESTMENT_CATEGORIES.slice(0,6)` (адаптер id→{labelEn,labelRu}), `selectedCategory`, `onCategoryChange`. Удалить локальный `CategoryChips`.
- `src/pages/knowledge/KnowledgePillarsIndex.tsx` — переписать рендер на `MiniAppLayout`. Group-by-cluster блок остаётся.
- `src/pages/owner/PipelinesIndex.tsx` — обернуть в `MiniAppLayout`.
- `src/pages/babysitter/BabysitterIndex.tsx` — карточки через `CatalogCard` маппер.
- `src/pages/delivery/DeliveryIndex.tsx` — `popularServices` через `CatalogCard`. `deliveryTypes` остаётся.
- 6-8 каталогов получают `seoTitle`/`seoDescription` props в `MiniAppLayout` (точечная правка одного-двух блоков на файл).
- 4-6 каталогов получают `crossSellCluster` prop.

**Файлы (создаём):** нет.

**Память:** обновить `mem://architecture/canonical-catalog-and-card-standard` с секцией "Documented exceptions" (Property hub).

**Риски:** (a) `INVESTMENT_CATEGORIES` имеет поле `key`, а `MiniAppCategory` ждёт `id` — нужен лёгкий мап `{id: cat.key, labelEn: cat.en, labelRu: cat.ru, icon: cat.icon}`. (b) `KnowledgePillarsIndex` ранее использовал `PageContainer`-padding — после `MiniAppLayout` отступы возьмутся из `ECOSYSTEM_PAGE_CONTAINER`, проверим визуально.
