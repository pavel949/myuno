# UX-аудит верхнего уровня + Wave 1 IA cleanup

**Дата:** 2026-06-11
**Версия приложения:** 3.55.x
**Owner:** Lovable AI + Pavel
**Статус:** Wave 1 выполнена (см. CHANGELOG ниже)

---

## 1. Контекст

myUNO — суперапп для русскоязычной аудитории в SEA: 535 страниц, 418 React-router маршрутов, 66 уникальных top-level URL, 6 Surfaces (content clusters) × 6 Canvases (app shells), 25 канонических personas P01–P25 (Master Taxonomy v1.0) и 10 JTBD-кластеров A–J.

При таком масштабе главный риск — **дезориентация пользователя**: одна и та же функция доступна из 3–5 разных точек, разные точки используют разный визуальный язык, и каждая роль (гость, owner, MC, vendor, admin, investor) видит свои дубли. Wave 1 закрывает наиболее видимые UX-дубли без миграций БД и без правок auth.

---

## 2. Что нашли (до Wave 1)

### 2.1. Дубли каталога

| Точка входа | Что рендерила | Реальная роль |
|-------------|---------------|---------------|
| `/discover` | NavigatorEntry → v2/v3 | Каталог по ситуациям |
| `/navigator` | NavigatorEntry (тот же компонент) | Алиас |
| `/catalog` | `<Navigate to="/navigator">` | Двойной редирект |
| `/categories` | `<Navigate to="/navigator">` | Двойной редирект |
| `AllAppsDrawer` (bottom sheet) | Собственный layout с `ServiceClusterAccordion` | UX №3 |
| `AppDrawer` (left sheet) | Богатый layout с quick actions + clusters | UX №4 |

Итого: **4 разных UI** под одной задачей «открыть каталог».

### 2.2. Дубли главной

`Index.tsx` — это router под feature-flag `home_simplified_v1`:
- ON (по умолчанию) → `IndexSimplified` (5 зон)
- OFF → `IndexLegacy` (15 блоков)

Флаг ON живёт в проде с апреля, но `IndexLegacy.tsx` всё ещё лежит в lazy-chunk и попадает в bundle. Это А/В-долг без активного А/В-теста.

### 2.3. Дубли онбординга

| Файл | URL | Что делает |
|------|-----|------------|
| `StartOnboarding.tsx` | `/start` | Старая 4-step destination-flow |
| `StartOnboardingV2.tsx` | `/start/v2` | Канонический M5 3-вопросный flow |
| `onboarding/OnboardingFlow.tsx` | `/onboarding/*` (редиректнут на `/start`) | Уже мёртв |

Пользователи случайно попадали на v1 (он был под `/start`), хотя канон — v2.

### 2.4. Persona drift

| Слой | Что использует |
|------|----------------|
| Master Taxonomy v1.0 (`src/lib/taxonomies/master.ts`) | 25 P-кодов (P01..P25) |
| Runtime hook `useUserPersonas` | 14 строковых значений (`tourist`, `family`, `investor`, …) |
| БД enum `user_persona` | Те же 14 |
| AI-routing / lifecycle messaging | Ожидает P-коды |

Результат: Discover v3 и AI concierge получают «не свою» персону и подбирают неуместный контент.

### 2.5. Top-level URL разрослись до 66

Дубли по смыслу:
```text
/babysitter   +  /babysitters
/spa          +  /salons            (оба ведут в /beauty)
/clinics      +  /medical
/airport-transfer + /taxi-booking   (разные виды transfer)
/welcome      +  /welcome-landing
/sell         +  /list-with-us       (разные сценарии: classifieds vs PMS-onboard)
/invest       +  /invest-hub  +  /capital
```

### 2.6. Шеллы и role-switching

24 layout/shell-компонента. Role-switcher должен быть только в `UserAvatarMenu` (Core memory), но MCLayout / AdminLayout / StaffLayout / CapitalLayout рендерят свои хедеры и в некоторых случаях дублируют переключение. Wave 1 это явление **не лечит** (требуется детальная инспекция каждого шелла — Wave 5).

---

## 3. Целевая IA

### 3.1. Терминология (фиксируем)

| Термин | Значение | Множество |
|--------|----------|-----------|
| **Surface** | Content cluster, живёт в URL | 6: arrive · live · manage · invest · legal · build |
| **Canvas** | App shell, где «стоит» пользователь | 6: Home · Discover · Operate · Wallet · Me · Admin |
| **JTBD Cluster** | Функциональный классификатор работ для AI/SEO/тегов | 10: A..J |
| **Persona** | Master Taxonomy v1.0 | 25: P01..P25 |

Правило: **Surface ≠ Canvas**. Canvas — где я; Surface — о чём.

### 3.2. Bottom navigation (гость, 5 слотов)

| Слот | URL | Назначение |
|------|-----|------------|
| Home | `/` | Hero, persona-aware, активная ситуация |
| Discover | `/discover` | Единственная «дверь» в каталог |
| Invest | `/invest` | Капитальный funnel (приоритетный сегмент) |
| Property | `/property` | Аренда / покупка / новостройки |
| Me | `/me` | Профиль, заказы, кошелёк, role-switch |

### 3.3. URL-контракт

```text
/                       Home (Canvas)
/discover               Discover (Canvas) — situation-first
/discover/:situation    SituationDetail
/me                     Me (Canvas)
/operate/:role          Operate Canvas (B2B shells, Wave 2)
/wallet                 Wallet Canvas

/arrive  /live  /manage  /invest  /legal  /build   Surface roots
/app/:surface/:vertical                            новые услуги — только сюда

/property /newbuilds /beauty /legal/... …          grandfathered, не трогаем
```

---

## 4. Wave 1 — что сделали

| # | Изменение | Файлы |
|---|-----------|-------|
| 1 | `/catalog`, `/categories`, `/navigator` → `<Navigate to="/discover">` (один canonical) | `AnimatedRoutes.tsx` |
| 2 | `AllAppsDrawer` → тонкая обёртка над `AppDrawer` (один drawer на платформу) | `AllAppsDrawer.tsx` |
| 3 | `IndexLegacy.tsx` удалён, `Index.tsx` теперь рендерит только `IndexSimplified` | `Index.tsx`, удалён `IndexLegacy.tsx` |
| 4 | `StartOnboarding.tsx` (v1) удалён; `/start` теперь рендерит V2; `/start/v2` редиректит на `/start` | `AnimatedRoutes.tsx`, `pageRegistry.ts`, удалён `StartOnboarding.tsx` |
| 5 | `/welcome-landing` → `/welcome` | `AnimatedRoutes.tsx` |
| 6 | Persona bridge legacy→P-код (без миграции БД) | `src/lib/taxonomies/personaBridge.ts` |
| 7 | 3 regression-guard теста | `src/test/ia/*.test.ts` |
| 8 | Этот аудит-документ | `docs/canonical/architecture/UX_IA_AUDIT_2026-06.md` |

### Что НЕ входило (отложено явными волнами)

- **Wave 2:** Перенос B2B-шеллов под `/operate/:role`. Риск регресса для активных операторов.
- **Wave 3:** Миграция enum `user_persona` в БД на P01..P25 + back-fill.
- **Wave 4:** Реконсилирование `category_groups` / `categories` с `catalog/taxonomy.ts` (требует live-data аудит).
- **Wave 5:** Слияние 24 layout-компонентов, чистка role-switchers в шеллах.
- **Wave 6:** Visual design polish (отдельный design-review).

---

## 5. Регрессионные тесты

| Тест | Что проверяет |
|------|----------------|
| `discover-is-canonical.test.ts` | `/catalog`, `/categories`, `/navigator` обязаны рендерить `<Navigate to="/discover">` |
| `no-orphan-top-level-routes.test.ts` | Список из ~80 top-level URL зафиксирован; новый URL без обновления allowlist → fail |
| `single-app-drawer.test.ts` | `AllAppsDrawer` остаётся re-export'ом `AppDrawer`, не рендерит свой `<Sheet>` |

---

## 6. Карта дублей до/после

```text
ДО                                                ПОСЛЕ
─────────────────────────────────────────────────────────────────────
/discover                          ─┐
/navigator                          ├──→  /discover (canonical)
/catalog                            │
/categories                         ─┘

AllAppsDrawer (170 LOC, свой UI)   ─┐
AppDrawer (339 LOC, свой UI)        ├──→  AppDrawer (single source)
                                    ─┘
                                       (AllAppsDrawer = re-export, @deprecated)

IndexSimplified (5 зон, default)    ─┐
IndexLegacy (15 блоков, fallback)   ─┴──→  IndexSimplified (sole home)

StartOnboarding (v1, /start)        ─┐
StartOnboardingV2 (/start/v2)       ─┴──→  StartOnboardingV2 (/start)

/welcome-landing                    ────→  /welcome

PersonaCode P01..P25 (master)      ─┐
UserPersona ×14 (runtime)           ├──→  legacy остаётся,
                                    │     personaBridge экспортирует P-коды
DB enum user_persona ×14            ─┘     для AI / Discover v3
```

---

## 7. Что измеряем после Wave 1

- Initial JS bundle: ожидаем –~15 KB (IndexLegacy chunk + StartOnboarding chunk).
- 404/redirect rate на `/catalog`, `/categories`, `/navigator`: должен упасть до нуля «полезных» 404 (только редиректы).
- DAU по разделу Discover: ожидаем +5..10% за счёт единой воронки.
- Support-обращения «не нашёл раздел X» — baseline до 2026-06-11, замер через 30 дней.

---

## 8. Дорожная карта Waves 2–6

| Волна | Тема | Условие готовности |
|-------|------|--------------------|
| 2 | `/operate/:role` wrapper для B2B-шеллов | Регресс-сьют по PMS / Admin / Vendor зелёный |
| 3 | Persona enum P01..P25 в БД + back-fill | Migration plan + bridge снимается |
| 4 | DB-категории = `catalog/taxonomy.ts` | Live-data аудит готов |
| 5 | Слияние 24 layout-компонентов | Карта зависимостей собрана |
| 6 | Visual design polish | DS 2.1 финализирован |
