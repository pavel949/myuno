

## Audit дизайна — myUNO главная и базовый shell

Аудит покрывает: `AppLayout` → `AppHeader` → `InstallBanner` → `Index.tsx` (Hero + 7 секций) → `AdaptiveBottomNav` → `Footer`. Брал референсом `/styles/tokens.css`, brand book и `ecosystemLayout.ts`.

---

### Архитектурные проблемы (HIGH)

**1. Двойное оборачивание контейнера на главной**
`AppLayout` уже оборачивает `children` в `ECOSYSTEM_PAGE_CONTAINER` (`max-w-[1536px] mx-auto px-4 md:px-6 lg:px-8 xl:px-10`) с модификатором `px-0`. Затем `Index.tsx` (стр. 76) внутри добавляет ещё один `max-w-[1536px] mx-auto px-4 md:px-6 lg:px-8 xl:px-10 py-5`. Получается двойной wrapper и `px-0` не имеет смысла. Это ломает carousel-rails которые делают `-mx-4 px-4` (FeaturedProperties, HomeDiscovery, ValueProp): они "выезжают" не до края экрана, а до внутреннего паддинга.

**Фикс**: Index.tsx должен использовать `<PageContainer>` или просто `space-y-6 lg:space-y-10 py-5 pb-20`, без повторного `max-w` и `px-*`. Carousel `-mx-4 px-4` тогда корректно дотянется до края.

**2. InstallBanner создаёт лишнюю вертикальную дыру**
`AppLayout` всегда рендерит `<div className="ECOSYSTEM_PAGE_CONTAINER pt-2"><InstallBanner /></div>` — даже когда баннер скрыт (`return null`), остаётся `pt-2` пустого контейнера. На мобильных: между header и hero лишние ~12px.

**Фикс**: оборачивающий `<div>` рендерим только если `InstallBanner` действительно отдаёт контент (через провайдер видимости или `display: contents`).

**3. Хардкод цветов в JSX вместо токенов** (брендбук-нарушение)
Несмотря на унифицированные токены, остаются inline стили:
- `AppHeader`: `background: 'rgba(15,28,46,0.95)'`, `borderColor: 'hsl(0 0% 100% / 0.07)'` — должно быть `hsl(var(--bg-surface))`/`hsl(var(--border))` через Tailwind.
- `HeroBlock`: `linear-gradient(...hsl(216 60% 7%)...hsl(214 50% 14%))` дважды (mobile + desktop) — захардкожен dark theme в light режиме (см. ниже).
- `PropertyTourBanner`: `bg-gradient-to-r from-[hsl(var(--primary))]/90...` — OK по токену, но `bg-white/20` для оверлеев.
- `AdaptiveBottomNav`: `background: 'rgba(15,28,46,0.85)'` — захардкожено dark.
- `ValuePropositionStrip`: `linear-gradient(135deg, #06b6d4, #0891b2)` × 6 — raw hex.

**4. Hero ломается в light theme**
`HeroBlock` принудительно использует тёмный градиент (`hsl(216 60% 7%)`) на mobile и desktop через inline style, игнорируя `html.light`. На светлой теме hero остаётся тёмно-синий, остальная страница белая → визуальный shock.

**Фикс**: использовать `var(--bg-base)` / `var(--bg-card)` или CSS class `hero-dark-surface` (она уже есть, но всё равно перекрывается inline style).

---

### Layout / spacing inconsistencies (MEDIUM)

**5. Разнобой вертикальных ритмов**
- `Index.tsx`: `space-y-6 lg:space-y-10` (24/40px)
- `ECOSYSTEM_MAIN_SPACING`: `space-y-4 md:space-y-6` (16/24px)
- `PageContainer` (uno): `py-4 md:py-6 lg:py-8 2xl:py-10`
Главная, Discover, Property — все имеют разные ритмы. Должен быть один токен (например, `--section-gap`).

**6. Hero `px-4 py-6` (mobile) vs остальные секции `px-4` parent → визуально hero "ровно с краем", а content рядом — нет, потому что у hero есть `rounded-[var(--radius-lg)] overflow-hidden`. Но из-за двойного wrapper'а (см. п.1) hero не дотягивает до края экрана. Нужно: hero получает ширину viewport через `-mx-4 px-4` либо родитель не имеет padding.

**7. Touch targets местами < 44px**
- `AppHeader` Search (mobile): `w-9 h-9` = 36px (надо 44).
- `LanguageSwitcher`/`CurrencySwitcher` size="sm" — судя по паттерну, тоже 32–36px.
- `AdaptiveBottomNav` иконки 20×20 в кнопке `flex-col` — высота total 60px ✓, но активная hit area по факту меньше (внутренний `pt-1`).
- `WhatsAppCTA` CTA имеет `min-h-[44px]` ✓, hero SOS на desktop — `px-4 py-2` без min-h (~36px).

**8. AdaptiveBottomNav: max-w-[480px] mx-auto**
На широких мобилках (393–414px) всё ок, но на планшетах <768 — навигация прижата к центру, а тело страницы — full width. Лучше `max-w-screen-sm` или просто width:100%.

---

### Доступность (MEDIUM)

**9. PersonaSwitcher: текст белого на градиентах низкого контраста**
`PERSONA_GRADIENTS.business: '#64748b → #475569'` + белый текст 11px = WCAG fail. Проверить все 14 градиентов.

**10. Hero SOS на desktop**: `text-foreground` на `rgba(239,68,68,0.15)` — серый на светло-красном (light theme), низкий контраст. На mobile есть `text-warning` — лучше унифицировать на `text-destructive` или белый.

**11. `aria-label` на иконках только частично**:
- `AppHeader` Search кнопка ✓
- `MiniCart`, `LanguageSwitcher`, `CurrencySwitcher` — надо проверить (вне аудита, но вероятно — есть).
- HeroBlock `WeatherIcon`, `MapPin`, `Calendar` — декоративные, нужен `aria-hidden` (часть стоит, часть — нет).

**12. `motion.button` без `aria-label`** в `QuickActionsGrid` desktop tile: иконка + текст, текст уже есть → OK. Но `requiresFullAccess + isLocked` визуально показывается только Lock-иконкой, без `aria-pressed`/`aria-disabled`.

**13. Focus visible**:
- `FeaturedPropertiesCarousel` ✓ (`focus-visible:ring-2 ring-primary ring-offset-2`)
- `HomeDiscoveryCarousel` ✓
- `QuickActionsGrid` mobile cards — НЕТ `focus-visible:ring`.
- `AdaptiveBottomNav` NavLink — НЕТ.
- `HeroSearchInput` — input без focus-ring.

---

### Семантика и компоненты (LOW)

**14. Заголовки секций — три разных стиля**:
- FeaturedProperties: `text-lg font-display font-bold text-foreground`
- HomeDiscovery: то же ✓
- TrustStats: `text-xs uppercase tracking-widest text-muted-foreground` (eyebrow вместо h2)
- ValueProp: `text-lg font-bold font-display` ✓
- HeroBlock: `text-2xl font-bold font-display` (h1) ✓

Нужен shared `<SectionHeader>` (он уже есть в `@/components/ds`, но Index его не использует).

**15. Footer и BottomNav на мобиле дублируют контакты**
Footer (mobile) показывает 3 социалки + company links + install кнопку. Сразу под ним BottomNav с 5 пунктами. На главной снизу: padding `pb-20 md:pb-8` (Index) + `pb-24 md:pb-4` (AppLayout main) + `pb-20 md:pb-0` (footer) — переусложнение; нижний whitespace ~120px.

**16. Hero pills (loyalty, streak)** имеют `min-h-[44px]` но `px-2.5 py-1` визуально создают высоту ~28px → есть white-space из-за min-h, выглядит "пустоватой кнопкой".

---

### План фиксов (приоритет)

**P0 — структурные (3 файла)**
1. `Index.tsx` — убрать дублирующий `max-w-[1536px] mx-auto px-* py-5`. Оставить только `space-y-6 lg:space-y-10 py-5 pb-20 md:pb-8`. Carousel rails `-mx-4 px-4` тогда дотянутся до края.
2. `AppLayout.tsx` — обёртка `InstallBanner` рендерится условно (пробросить через ref/state из самого баннера или `display: contents`).
3. `HeroBlock.tsx` — заменить inline `linear-gradient(...hsl(216...))` на CSS class через `--bg-base`/`--bg-card`, чтобы light theme работала.

**P1 — токены и контраст (5 файлов)**
4. `AppHeader.tsx` — `rgba(15,28,46,0.95)` → `hsl(var(--bg-surface) / 0.95)`.
5. `AdaptiveBottomNav.tsx` — то же, плюс `max-w-[480px]` → убрать или на `max-w-screen-sm`.
6. `ValuePropositionStrip` — 6 hex-градиентов → 6 token gradients (`--cluster-arrive`, `--cluster-live`, etc.).
7. `InlinePersonaSelector` `PERSONA_GRADIENTS` — те же hex, перевести на токены. Оверлапается с `useUserPersonas.ts` — общий источник.
8. Hero SOS — унифицировать desktop+mobile на `text-destructive font-semibold`.

**P2 — a11y & touch (4 файла)**
9. `AppHeader` mobile search/lang/currency — все min `w-11 h-11`.
10. `QuickActionsGrid` mobile cards + `AdaptiveBottomNav` — добавить `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
11. `HeroSearchInput` — focus-ring на контейнере.
12. PersonaSwitcher — проверить контраст 14 градиентов; для `business`/`couple`/`nightlife` поднять lightness конечной точки или добавить `text-shadow`.

**P3 — консистентность (2 файла)**
13. Index.tsx использует `<SectionHeader>` из `@/components/ds` для всех секций (FeaturedProperties, HomeDiscovery, TrustStats — внутри них или снаружи).
14. Уменьшить нижний whitespace на mobile: `pb-20` (Index) убрать, оставить только `pb-24` в AppLayout main (BottomNav уже учитывает `env(safe-area-inset-bottom)`).

---

### Файлы к редактированию (~12)
`src/pages/Index.tsx`, `src/components/layout/AppLayout.tsx`, `src/components/layout/AppHeader.tsx`, `src/components/layout/AdaptiveBottomNav.tsx`, `src/components/home/HeroBlock.tsx`, `src/components/home/QuickActionsGrid.tsx`, `src/components/home/ValuePropositionStrip.tsx`, `src/components/home/InlinePersonaSelector.tsx`, `src/components/home/TrustStats.tsx`, `src/components/pwa/InstallBanner.tsx`, и опционально `src/styles/tokens.css` (добавить `--section-gap-y` token).

Никаких миграций БД, маршрутов или edge functions — только UI.

