
## Цель

Сделать `/` витриной доверия myUNO как «operating layer for Phuket» с фокусом на одну конверсию — Submit a request. Сохранить весь существующий продукт без удалений: персонализированный 5-зонный Home переезжает на `/home`, breadth-контент — на `/ecosystem`.

## Ключевое архитектурное решение (рекомендация)

**Рекомендую: split-front-door.**
- `/` — новая trust-first landing **только для анонимов и first-time visitors** (paid traffic, SEO, referrals).
- `/home` — текущий персонализированный superapp Home (`IndexLegacy` / `IndexV2`) для авторизованных. После логина — редирект на `/home`.
- `/ecosystem` — новая secondary page с breadth-контентом (clusters × services × personas), куда уходят `ClusterRail`, `AppDrawer`-обзор, «Все приложения», `NowInPhuket`, `OfficialNews` в маркетинговой подаче.

Почему так: вариант «новая landing для всех» сломал бы ежедневный сценарий 369 visitors / 1341 pageviews (текущий Home — рабочий инструмент для вернувшихся юзеров и админов). Split сохраняет continuity, не теряет SEO `/` и даёт чистый funnel для трафика.

Внедрение — за `feature_flag:landing_v1` (internal cohort → 100%), чтобы можно было откатить без редеплоя.

## Структура новой landing (`src/pages/landing/LandingV1.tsx`)

```text
┌─ Header (sticky, trust-first nav) ──────────────────────────────┐
│  Logo │ How it works · Trust · Emergency · Ecosystem · Partners │
│                                          [ Submit a request ▸ ] │
├─ 1. Hero ───────────────────────────────────────────────────────┤
│  H1: The trusted operating layer for Phuket                     │
│  Sub: One request. We coordinate the right verified provider.   │
│  [ Submit a request ]  [ See how it works ]                     │
│  Trust strip: Verified providers · RU/EN/TH · Protected pay…    │
├─ 2. Trust (factual, operational)                                │
├─ 3. Concierge model (3 шага)                                    │
├─ 4. Critical use cases (4–5 stress-driven сценариев)            │
├─ 5. Why this is safer (chaos vs coordinated, без агрессии)      │
├─ 6. Emergency support                                           │
├─ 7. Who it is for (5 сегментов, tourists через trust-lens)      │
├─ 8. Ecosystem breadth (proof-of-depth → ссылка на /ecosystem)   │
├─ 9. Partners / providers (короткий B2B блок → /partners)        │
├─ 10. Final CTA («One request. One trusted operating layer.»)   │
└─ Footer (текущий) + Mobile sticky CTA «Submit a request»       │
```

Каждая секция — отдельный компонент в `src/components/landing/` (`LandingHero`, `LandingTrust`, `LandingConcierge`, `LandingUseCases`, `LandingSafer`, `LandingEmergency`, `LandingAudiences`, `LandingEcosystem`, `LandingPartners`, `LandingFinalCTA`, `LandingHeader`, `LandingStickyCTA`). Все — i18n RU/EN/TH через существующий `useLanguage`.

## CTA-логика

- Primary везде: «Submit a request» → открывает `ConciergeRequestSheet` (переиспользуем `src/components/concierge/ConciergeRequestButton.tsx` — там уже WhatsApp-роутинг к Павлу +66922407355 и лог в `crm_leads`).
- Secondary: «See how it works» → smooth-scroll к секции 3 (Concierge model).
- Tertiary: «Explore the ecosystem» → `/ecosystem`.
- Mobile: sticky bottom CTA (primary), скрывается над футером.

## Что переезжает и куда (без удалений)

| Сейчас на `/` | Куда уходит |
|---|---|
| `HeroGreeting`, `PersonalGrid`, `ActiveSituation`, `LifecycleSmartTip`, `WorkspaceHomeBanner`, `PendingPaymentsChip` | → `/home` (IndexLegacy переименован в `SuperappHome`) |
| `ClusterRail` × visibleClusters, «Все приложения» (`AppDrawer`) | → `/ecosystem` (маркетинговая подача + ссылка на `/home` для logged-in) |
| `NowInPhuket`, `OfficialNews` | → `/ecosystem` (нижние секции) |
| `RoleSheet` | остаётся на `/home` |

Файлы НЕ удаляются — только перенос рендера. Маршруты остаются рабочими.

## Дизайн-система

Строго по DS 2.1 (`src/styles/tokens.css` + `DESIGN.md`):
- Light-first, cream surface `#F7F5F1`, ink `#1C1916`, navy primary `#0A2240`, orange accent `#D96B1A` ≤3%.
- Source Serif 4 (H), Geist (UI), IBM Plex Mono (numerics).
- `--radius: 0`, без glassmorphism, без мятного `#00D68F`, без gradient blobs.
- Только семантические токены: `bg-background`, `text-foreground`, `bg-primary`, `text-accent`, `border-border`.
- Анимация — `framer-motion`, сдержанно (fade/slide-up 200–300ms, без parallax-цирка).
- Mobile-first 375px, touch ≥44px.

## Маршрутизация и редиректы

В `src/App.tsx` (или `AnimatedRoutes`):
- `/` → `LandingV1` если флаг ON + (анон ИЛИ `?welcome=1`); иначе текущий `Index`.
- `/home` → текущий `Index` (5-зонный superapp), требует мягкую авторизацию (анон видит CTA «Sign in»).
- `/ecosystem` → новый `EcosystemPage` (breadth-контент).
- Post-login redirect: `AuthCallback` → `/home` (если пришли с `/`), иначе сохранённый `returnTo`.

SEO: `/` — новые `<title>`, `meta description`, OG, JSON-LD `Organization` + `Service`. Canonical `/`. H1 один.

## Копирайт (направление, RU/EN/TH)

- EN H1: «The trusted operating layer for Phuket.»
- RU H1: «Доверенный операционный слой для Пхукета.»
- TH H1: тайская локализация через `i18n` (ключ `landing.hero.title`).
- Тон — DS 2.1 «civic infrastructure»: спокойная уверенность, факты, никакого «unlock the power / seamless». Запрет эмодзи в копии (уже enforced в `no-emoji-in-registries.test`).
- Все строки — через `src/i18n/` (новый namespace `landing.*`, ~60 ключей × 3 языка).

## Технические детали

- React 18 + Vite, lazy-load `LandingV1` через существующий `AnimatedRoutes` Suspense.
- Использовать `useFeatureFlag('landing_v1')` (паттерн `useFeatureFlag.ts` уже починен для JSONB).
- Submit-request: переиспользовать `ConciergeRequestButton` + edge `notify-lead-whatsapp` (Павел, +66922407355) — без новой backend-логики.
- Images: 2–3 фото Пхукета (hero, emergency) — генерируем в `src/assets/landing/` (jpg, <200KB, lazy).
- Тесты: smoke-test Playwright (anon hits `/` → видит Hero + CTA → клик CTA открывает sheet; logged-in hits `/` → редирект `/home`).
- Аудит SEO: `seo_chat--trigger_scan` после деплоя.
- Migration: `feature_flag:landing_v1` в `system_settings` (`{enabled: true, cohort: 'internal'}` → потом 100%).

## Файлы

**Новые:**
- `src/pages/landing/LandingV1.tsx`
- `src/pages/EcosystemPage.tsx`
- `src/components/landing/{LandingHeader,LandingHero,LandingTrust,LandingConcierge,LandingUseCases,LandingSafer,LandingEmergency,LandingAudiences,LandingEcosystem,LandingPartners,LandingFinalCTA,LandingStickyCTA}.tsx`
- `src/i18n/landing.{ru,en,th}.ts` (или ключи в существующих файлах)
- `supabase/migrations/<ts>_enable_landing_v1_flag.sql`
- `src/assets/landing/hero.jpg`, `emergency.jpg`
- `docs/canonical/LANDING_V1.md` (IA + копирайт)

**Изменяемые:**
- `src/pages/Index.tsx` — гейт по флагу + auth → `LandingV1` / `SuperappHome`.
- `src/App.tsx` (или router) — маршруты `/home`, `/ecosystem`, post-login redirect.
- `src/components/seo/index.ts` — SEO-блок для landing.

## Out of scope (для этой итерации)

- Не трогаем `IndexV2` Wave-2 (живёт под своим флагом для админов на `/home`).
- Не меняем `ConciergeRequestButton` UI/логику (только используем).
- `/partners` и `/ecosystem` рендерятся, но глубокое наполнение `/ecosystem` (фильтры, карты, поиск) — следующая волна; в этой версии — структурированный обзор с CTA назад к Submit a request.
- Не меняем глобальный `AppLayout` для logged-in юзеров.

## Acceptance

1. Анонимный визит `/` → новая landing, Lighthouse Perf ≥85 mobile, CLS <0.05.
2. Клик «Submit a request» в любой секции → открывает concierge sheet, успешный submit → запись в `crm_leads` + WhatsApp Павлу.
3. Logged-in визит `/` → редирект `/home`, 5-зонный superapp работает как сегодня.
4. `/ecosystem` рендерит breadth-контент, ни одна страница 404 не появилась.
5. RU/EN/TH переключение работает по всей landing без пропусков.
6. Flag OFF → мгновенный откат на текущий `Index` без редеплоя.
