
# UX-аудит верхнего уровня + Wave 1 правок

## Часть 1. Что нашли

### Масштаб
- 535 страниц, 418 `<Route>`, 66 уникальных top-level URL.
- 4 параллельных «индекса» каталога/discover: `/discover`, `/navigator`, `/catalog→navigator`, `/categories→navigator`.
- 3 главные: `Index.tsx` (router) → `IndexSimplified` (default) / `IndexLegacy` (15 блоков, regression-safe).
- 2 drawer-а приложений: `components/layout/AllAppsDrawer.tsx` (170 LOC) и `components/nav/AppDrawer.tsx` (339 LOC).
- 2 онбординга: `StartOnboarding.tsx` + `StartOnboardingV2.tsx` + `onboarding/OnboardingFlow.tsx`.
- 24 layout/shell-компонента (AppLayout, MiniAppLayout, MeShell, NavShell, MCLayout, AdminLayout, StaffLayout, GuestLayout, CapitalLayout, NewbuildsLayout, DeveloperPortalLayout, LandingShell, FeatureLayout, UnifiedCatalogShell, OnboardingLayout, PageShell, StartPageLayout, UnifiedSuccessLayout, LandingLayout, NavShellContext и др.).
- Drift между Master Taxonomy v1.0 (25 personas P01–P25) и runtime `useUserPersonas` (14 строковых ID: tourist/resident/investor/...).

### Ключевые проблемы UX-архитектуры

| # | Симптом | Где живёт | Боль для пользователя |
|---|---------|-----------|----------------------|
| 1 | Дублирующиеся «двери» в каталог (`/discover` ≈ `/navigator` ≈ AllAppsDrawer ≈ AppDrawer ≈ `/catalog`) | `AnimatedRoutes.tsx:211-215`, два drawer-компонента | «Где список приложений?» — 4 разных ответа, разный UX. |
| 2 | Два home-варианта под флагом, оба загружаются в проде | `Index.tsx`, `IndexSimplified.tsx`, `IndexLegacy.tsx` | A/B-долг: легаси-блоки до сих пор тянутся в бандл, ломают аналитику. |
| 3 | Persona-system раздвоен | Master Taxonomy = P01–P25, runtime = 14 строк | Персонализация на home/discover не совпадает с lifecycle/AI-routing → пользователь видит «не свою» подборку. |
| 4 | Terminology mismatch — «Surface» vs «Canvas» | Memory правит, но в коде нет roleIA-карты | Команда (и AI-агенты) путают content-clusters и app-shell. |
| 5 | Нет единого role-switcher boundary | UserAvatarMenu единая точка, но шеллы (MCLayout/AdminLayout/StaffLayout/Capital/Newbuilds) рендерят свои хедеры | Гость попадает в `/mc/*` или `/admin` и видит «чужой» UI до редиректа. |
| 6 | Top-level URL разрослись (66) | `/babysitter` + `/babysitters`, `/airport-transfer` + `/transfers` + `/taxi-booking`, `/clinics` + `/medical`, `/spa` + `/salons`, `/sell` + `/list-with-us`, `/welcome` + `/welcome-landing` | SEO-дубли, разные карточки одной услуги. |
| 7 | Investment-раздел очищен (Wave 1/2 сделаны), но альтернативные точки входа `/capital`, `/invest-hub`, `/property` дублируют CTA | `AnimatedRoutes.tsx` | Инвестор видит «капитал» 3 раза. |
| 8 | Bottom-nav role-aware, но `PRIMARY_NAV` гость = Home·Discover·Market·Property·Me, при этом `/market` и `/property` уже доступны через Discover → перегруз | `nav/navigationModel.ts` | На малых экранах 5 слотов потрачены на пересекающиеся домены. |
| 9 | DB-категории дрейфуют от `src/lib/catalog/taxonomy.ts` (комментарий 2026-05-21 прямо это фиксирует) | `category_groups`, `categories` | Drawer показывает одно число услуг, страница вертикали — другое. |

### Карта дублей (для Wave 1)

```text
home          : Index → {IndexSimplified | IndexLegacy}                   → schedule IndexLegacy delete
all-apps      : AllAppsDrawer + AppDrawer                                  → keep AppDrawer (richer)
discover      : /discover, /navigator, /catalog, /categories, /life       → keep /discover, all redirect
onboarding    : StartOnboarding, StartOnboardingV2, OnboardingFlow        → keep V2 + OnboardingFlow
welcome       : /welcome, /welcome-landing, WelcomeLanding.tsx            → keep /welcome
transfers     : /airport-transfer, /transfers, /taxi-booking              → keep /transfers
babysitter    : /babysitter, /babysitters                                  → keep /babysitter (singular)
medical       : /clinics, /medical                                         → keep /medical
beauty        : /spa, /salons, /beauty                                     → keep /beauty
list-property : /sell, /list-with-us                                       → keep /list-with-us
invest-entry  : /invest, /invest-hub, /capital                             → /invest canonical
```

## Часть 2. Целевая IA (верхний уровень)

### 6 Surfaces × 6 Canvases (фиксируем терминологию)

```text
Canvases (app-shell, нижняя навигация / role-aware):
  Home · Discover · Operate · Wallet · Me · Admin

Surfaces (content clusters, URL и каталог):
  Arrive · Live · Manage · Invest · Legal · Build

Правило: Surface != Canvas. Canvas — это «где я сейчас стою», Surface — «о чём контент».
```

### Целевая bottom-nav (guest, 5 слотов)

| Слот | Маршрут | Что внутри | Зачем |
|------|---------|------------|-------|
| Home | `/` | Persona-aware hero, активная ситуация, 3 CTA | Точка входа, всегда первая |
| Discover | `/discover` | Единственная дверь в каталог (situation-first v3 за флагом, fallback v2) | Убирает 4 параллельных пути |
| Invest | `/invest` | Капитальный funnel (HubLanding) | Стратегический сегмент №1 по марже |
| Property | `/property` | Аренда / покупка / новостройки | Relocator + Second-home |
| Me | `/me` | Профиль, документы, заказы, кошелёк, переключение роли | Единственный role-switcher |

> Для B2B-ролей (owner/MC/vendor/admin/team/investor-pro) bottom-nav уже описан в `navigationModel.ts` — оставляем как есть, фиксируем правило: **переключение между Canvas-ами происходит только через `UserAvatarMenu` в Me**.

### Единый URL-контракт

```text
/                       Home (Canvas)
/discover               Discover (Canvas) — situation-first
/discover/:situationCode  → SituationDetail
/me                     Me (Canvas) — profile/orders/wallet/role-switch
/operate/:role          Operate Canvas — wrapper для всех B2B-шеллов
/wallet                 Wallet Canvas

/arrive  /live  /manage  /invest  /legal  /build   Surface roots (content)
/app/:surface/:vertical                            новые услуги — только сюда

/property /newbuilds /beauty /legal/...            grandfathered, не трогаем
```

### Карта (mermaid-диаграмма прилагается отдельным артефактом)

## Часть 3. Wave 1 — конкретные правки (этот PR)

### Цель волны
Убрать видимые дубли в навигации и каталоге без миграций БД, без правок auth, без новых таблиц. Всё за фиче-флагами там, где есть риск регрессии.

### Объём работ

1. **Удалить `/catalog` и `/categories` как «маршруты»** — заменить чистыми `<Navigate replace>` на `/discover` (вместо текущего `NAVIGATOR`). Сделать `/navigator` тоже алиасом на `/discover`. URL `/discover` становится единственным каноном.

2. **Объединить два drawer-а в один.**
   - `AppDrawer.tsx` (339 LOC, richer) — оставляем.
   - `AllAppsDrawer.tsx` (170 LOC) — экспортирует `<AllAppsDrawer>` как тонкий re-export `AppDrawer`, помечаем `@deprecated`, точечно меняем 3–5 импортов в `BottomBar`/Index.
   - Цель: один и тот же набор приложений из `catalog/taxonomy.ts` показывается во всех точках.

3. **Удалить `IndexLegacy.tsx` из критического пути.** Перевести `useFeatureFlag('home_simplified_v1', true)` → `useFeatureFlag(..., true, { allowOverride: false })`, IndexLegacy переименовать в `_archive/IndexLegacy.tsx`, убрать lazy-import из `Index.tsx`. Регрессия покрывается тем, что флаг по умолчанию ON уже месяц.

4. **Удалить `StartOnboarding.tsx` (v1)** и редиректнуть его URL на `/onboarding`. Оставить `StartOnboardingV2` + `OnboardingFlow`.

5. **Согласовать top-level дубли (только редиректы, без удаления страниц):**
   ```text
   /babysitters       → /babysitter
   /airport-transfer  → /transfers
   /taxi-booking      → /transfers
   /clinics           → /medical
   /spa               → /beauty
   /salons            → /beauty
   /sell              → /list-with-us
   /welcome-landing   → /welcome
   /invest-hub        → /invest   (уже есть, проверить)
   /capital           → /invest   (capital раздел остаётся, ссылка из nav убирается)
   ```

6. **Один role-switcher.** В `MCLayout`, `AdminLayout`, `StaffLayout`, `VendorLayout`, `CapitalLayout` убрать любые in-header переключатели ролей; оставить только `UserAvatarMenu`. Это уже задекларировано в Core memory, но в шеллах остались артефакты — точечная чистка.

7. **Persona drift — bridge (не миграция).** В `useUserPersonas.ts` добавить мап `UserPersona (14) → PersonaCode (P01..P25)` из `src/lib/taxonomies/master.ts`. Хук возвращает оба значения: `personas` (legacy для текущих компонентов) + `personaCodes` (новый, для discover-v3 и AI-routing). БД не меняем, миграция enum — отдельная Wave 2.

8. **Регрессионный тест-страж** (`src/test/ia/`):
   - `no-orphan-top-level-routes.test.ts` — список из 66 top-level URL фиксируется; новый top-level URL без `// @ia-approved` коммента падает в тесте (поддерживает Core rule «не добавлять new top-level routes»).
   - `discover-is-canonical.test.ts` — `/catalog`, `/categories`, `/navigator` обязаны рендерить `<Navigate to="/discover">`.
   - `single-app-drawer.test.tsx` — `AllAppsDrawer` и `AppDrawer` рендерят одинаковое количество кластеров.

9. **Документ `docs/canonical/architecture/UX_IA_AUDIT_2026-06.md`** — финальная версия этого аудита + before/after карта, чтобы зафиксировать решения и не вернуться к ним через 2 месяца.

### Что НЕ входит в Wave 1 (намеренно)

- Перенос B2B-шеллов под `/operate/:role` — это Wave 2, риск ломки активных операторов.
- Миграция enum `user_persona` в БД на P01–P25 — Wave 3, требует back-fill.
- Реконсилирование `category_groups` / `categories` в БД с `catalog/taxonomy.ts` — Wave 4, нужен live-data аудит.
- Слияние 24 layout-компонентов — Wave 5, чистый рефактор без UX-выгоды в моменте.
- Visual design polish — отдельный design-review.

### Критерии приёмки

- [ ] Все 4 теста-стража зелёные.
- [ ] `rg -n "AllAppsDrawer" src/` возвращает только тонкий re-export.
- [ ] `rg -n "IndexLegacy" src/` — пусто вне `_archive/`.
- [ ] `rg -n "/catalog\|/categories\|/navigator" src/` — только в `AnimatedRoutes.tsx` как `<Navigate>`.
- [ ] `npm run build` чистый; bundle initial JS уменьшится за счёт удаления IndexLegacy lazy chunk.
- [ ] В preview на 384px guest видит: Home → Discover → Invest → Property → Me. Один drawer.

### Технические детали

- Все правки маршрутов — в `src/components/layout/AnimatedRoutes.tsx` и `src/lib/config/routes.ts`. Используем `APP_ROUTES.*`, не сырые строки.
- Удаление `IndexLegacy`: lazy-import снимается, файл переезжает в `src/_archive/` (исключён из tsconfig include), `src/components/layout/pageRegistry.ts` чистится.
- Удаление `StartOnboarding`: lazy-export + `<Route>` снимаются, URL `/start` → `<Navigate to={APP_ROUTES.ONBOARDING}>`.
- Persona bridge: чистый TS-мап без сетевых вызовов, экспортируется отдельной функцией `mapLegacyPersonaToCode(legacy: UserPersona): PersonaCode | null`.
- Никаких изменений в Supabase (нет миграций, нет правок RLS).

### Риски и митигация

| Риск | Митигация |
|------|-----------|
| Внешние ссылки на `/catalog`, `/categories`, `/navigator` | Все три → `301`-эквивалент через `<Navigate replace>`, плюс canonical-link в `<head>` Discover. |
| SEO `/spa`, `/salons`, `/clinics` | Перед редиректом проверить `semrush--top_pages`; если есть трафик — оставить как landing, добавить `<link rel="canonical">` на каноничный URL вместо редиректа. |
| B2B-операторы привыкли к `/start` | Редирект на `/onboarding` сохраняет историю. |
| Тест-страж top-level routes блокирует команду | Включён escape hatch `// @ia-approved <reason>` коммент, ревью в PR. |

## Рекомендую

Идти именно по этой волне. Она убирает 4 видимых пользователю дублей (drawer, discover, onboarding, home-legacy) и стабилизирует 6 SEO-дублей через редиректы — это даёт быстрый wins без риска для платежей, PMS и админки. Глубокие миграции (B2B-шеллы под `/operate`, persona-enum, DB-категории) откладываем явными последующими волнами, чтобы не мешать текущим релизам.
