

## Bottom Bar Coverage Audit & Fix

**Цель:** На каждом экране (mobile <768px) должен быть нижний таб-бар с 5 кнопками, релевантными роли пользователя (guest / owner / vendor / admin / team / investor / mc_portal).

### Что я нашёл

Навигационная архитектура уже унифицирована (`NavShell` + `BottomBar` читают из `src/lib/nav/navigationModel.ts`). Но **бар отсутствует на ~30+ страницах** потому, что они рендерятся «голыми» — без `AppLayout`, `MiniAppLayout`, `MCLayout`, `AdminLayout`, `VendorLayout`, `GuestLayout`, `CapitalLayout` или `StaffLayout`.

**Подтверждённые страницы без бара (выборка из обхода роутов):**

| Категория | Файлы |
|---|---|
| Маркетинг / лендинги | `PricingPage`, `WelcomeLanding`, `StartOnboarding`, `ReferralLanding`, `Install`, `PlatformCatalog`, `ListWithUsPage`, `ForDevelopers`, `ForLocalServices`, `ForManagementCompanies` |
| Property explainers | `property/WhyMyUno`, `property/PropertyHub` (shell для табов), `property/PropertyMySection`, `clearview/ClearViewLanding` |
| Vertical landings | `landing/AirportTransferLanding`, `landing/FlowerDeliveryLanding`, `landing/RentalLanding`, `landing/NewDevelopmentsLanding` |
| Info / legal | `info/BecomePartnerPage` |
| Capital funnels | `peylaa/PeylaaLanding`, `microsite/ProjectMicrosite` (по дизайну standalone — оставляем) |
| Сервисные success | `transport/TransferSuccess`, `flowers/FlowersSuccess`, `services/ServiceOrderSuccess`, `market/MarketSuccess` (используют свой `UnifiedSuccessLayout` без NavShell) |
| Storefront / hosted | `StorefrontPage` (по дизайну branded — оставляем) |
| Guest welcome | `guest/WelcomeFlow`, `guest/PublicGuidebook` (public онбординг — оставляем) |
| Developer Portal | `DeveloperPortalLayout` имеет свой кастомный мобильный nav в стилистике newbuilds — но **оторван от ролевой модели** (показывает только developer-portal таб-бар) |
| Capital workspace | `CapitalLayout` имеет `CapitalMobileNav`, но он вне SSOT |

### Правила (что должно быть с баром, а что нет)

**Обязательно бар:** все авторизованные и публичные торговые/каталог/детальные страницы, включая лендинги монетизации, success-экраны (success-экраны это тоже точка возврата в магазин).

**Без бара (full-screen flow — уже корректно отфильтровано в `NavShell` через `FULLSCREEN_PREFIXES`):** `/auth`, `/checkout`, `/cart`, `/welcome`, `/p/:slug` (microsite), `/b/:slug` (storefront), `/guide/:token` (public guidebook).

### План фиксов

**Шаг 1. Расширить SSOT отказа от бара.**
В `NavShell.tsx` добавить в `FULLSCREEN_PREFIXES` маршруты, которые по продуктовому решению должны оставаться без хрома: `/welcome`, `/p/`, `/b/`, `/guide/`, `/start`, `/welcome-landing`. Это закрепляет «без бара» как осознанное решение, а не следствие забытого layout.

**Шаг 2. Обернуть лендинги/info-страницы в `AppLayout`.**
Минимально-инвазивно: оборачиваю каждый файл из таблицы выше в `<AppLayout showHeader={false}>...</AppLayout>` (header у них уже свой sticky). Это даёт guest-bar (Home / Discover / Market / Property / Me) на всех:
- `PricingPage`, `Install`, `PlatformCatalog`, `ListWithUsPage`, `ReferralLanding`, `ForDevelopers`, `ForLocalServices`, `ForManagementCompanies`
- `property/WhyMyUno`, `clearview/ClearViewLanding`, `property/PropertyMySection`
- `landing/AirportTransferLanding`, `landing/FlowerDeliveryLanding`, `landing/RentalLanding`, `landing/NewDevelopmentsLanding`
- `info/BecomePartnerPage`
- `relocate/RelocateLandingPage`, `wedding/WeddingLandingPage`, `kids/KidsLandingPage`, `peylaa/PeylaaLanding` (если их `LandingLayout`/обёртки не дают бар — проверю и оборачиваю)

**Шаг 3. Success-экраны.**
В `UnifiedSuccessLayout` (используется `transport/TransferSuccess` и т. п.) оборачиваю содержимое в `AppLayout showHeader={false}`. Один правка → сразу 4+ страницы получают бар.

**Шаг 4. PropertyHub shell.**
`pages/property/PropertyHub.tsx` — это `<Outlet/>`-родитель. Оборачиваю его контейнер в `AppLayout`, чтобы все вложенные `/property/*` роуты, которые сейчас не имеют собственного wrapper'а (`PropertyMap`, `PropertyConsultation`, `PropertyDepositSuccess`, `WhyMyUno`, `ClearViewLanding`, `Resale*`, `Commercial*`, `Land*`, `Hotels*`, `PropertyMySection`), наследовали бар.

**Шаг 5. Capital и Staff workspace — миграция на `NavShell`.**
- `CapitalLayout`: заменяю кастомный `CapitalMobileNav` на `NavShell role="admin"` (capital — это admin-uno_team workflow). Сохраняю `CapitalSidebar` как desktop side-rail через расширение `SIDEBAR_NAV.admin` или, минимально, оставляю текущий sidebar, но рендерю поверх `NavShell` — главное, чтобы мобильный bar появился.
- `StaffLayout` (у него только `/staff` index) — оборачиваю в `NavShell role="team"`.

Альтернативно — добавляю в SSOT `navigationModel.ts` две новые ролевые группы (`capital`, `developer_portal`) с собственными `PRIMARY_NAV`. Это чище, но скоупом больше.

**Решение:** для скорости — Шаг 5 минимальный (переиспользую `team` для staff, `admin` для capital). Если продукт решит нужны отдельные 5-tab — добавим в следующей итерации.

**Шаг 6. DeveloperPortalLayout.**
Оставляю существующий dark-luxury мобильный nav (это намеренный тематический бар), но добавляю над ним маленькую кнопку «Назад в myUNO» — это уже есть в sidebar. Достаточно. Не трогаю.

**Шаг 7. Заодно фикс runtime-ошибки.**
`useTheme must be used within a ThemeProvider` — это HMR-артефакт после правок `ThemeContext`. Перепроверяю, что `ThemeProvider` остался первым в `composeProviders` и `useTheme` бросает только если контекст реально пуст. Скорее всего исчезнет после rebuild — проверю в превью; если останется, локализую и починю.

### Технические заметки

- `AppLayout` уже отдаёт правильный bar через `NavShell` (роль резолвится из `useUserContext` + URL). Гость на `/pricing` увидит guest-bar; владелец, попавший на `/pricing`, — owner-bar. Это корректно.
- `BottomBar` уже обрабатывает `pb-[calc(env(safe-area-inset-bottom)+5rem)]` clearance внутри `NavShell` через `pb-24 md:pb-4` на `<main>`, поэтому не нужно вручную добавлять padding на новые обёртки.
- Бар на mobile only (`md:hidden`) — на desktop работают TopBar pills + SideRail (для workspace ролей). Это корректное поведение по `docs/NAVIGATION.md`.
- `ECOSYSTEM_PAGE_CONTAINER` и `PageShell` тоже совместимы с `AppLayout` — оборачивание не ломает существующий layout.

### Что в результате

После фикса **на каждом не-fullscreen экране** (включая лендинги, info, success, property tabs, capital, staff) будет 5-кнопочный нижний бар, кнопки которого зависят от активной роли. Список «без бара» сводится к явному `FULLSCREEN_PREFIXES` whitelist в `NavShell` (auth/checkout/cart/welcome/storefront/microsite/guidebook/start).

### Файлы под правки

- `src/components/nav/NavShell.tsx` — расширение `FULLSCREEN_PREFIXES`
- `src/pages/PricingPage.tsx`, `src/pages/Install.tsx`, `src/pages/PlatformCatalog.tsx`, `src/pages/ListWithUsPage.tsx`, `src/pages/ReferralLanding.tsx`, `src/pages/ForDevelopers.tsx`, `src/pages/ForLocalServices.tsx`, `src/pages/ForManagementCompanies.tsx`, `src/pages/StartOnboarding.tsx`
- `src/pages/property/WhyMyUno.tsx`, `src/pages/property/PropertyMySection.tsx`, `src/pages/property/PropertyHub.tsx`, `src/pages/clearview/ClearViewLanding.tsx`
- `src/pages/landing/AirportTransferLanding.tsx`, `src/pages/landing/FlowerDeliveryLanding.tsx`, `src/pages/landing/RentalLanding.tsx`, `src/pages/landing/NewDevelopmentsLanding.tsx`
- `src/pages/info/BecomePartnerPage.tsx`
- `src/pages/relocate/RelocateLandingPage.tsx`, `src/pages/wedding/WeddingLandingPage.tsx`, `src/pages/kids/KidsLandingPage.tsx`, `src/pages/peylaa/PeylaaLanding.tsx` (если их `LandingLayout` не даёт NavShell — обёртывание)
- `src/components/success/UnifiedSuccessLayout.tsx` (one-shot для всех `*Success` страниц)
- `src/components/capital/CapitalLayout.tsx`, `src/components/staff/StaffLayout.tsx` — миграция на `NavShell`

Объём: ~25 файлов, точечные правки (1–3 строки на файл, кроме `CapitalLayout`/`StaffLayout`/`UnifiedSuccessLayout`).

