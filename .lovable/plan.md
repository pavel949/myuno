## Wave 3 — Lifestyle Personas P14–P19

### Контекст

Все 6 lifestyle-персон уже технически `live` — `/for/medical`, `/for/weddings`, `/for/athletes`, `/for/halal`, `/for/lgbtq`, `/for/accessibility` открываются и проходят `isLivePersonaLanding()`. Конфиги в `src/content/landings/personas/P14..P19.ts`, рендер — `src/pages/landings/PersonaLandingPage.tsx`.

**Проблема №1 — неравномерное качество.** `P14_MEDICAL` и `P15_WEDDINGS` уже production-grade (6 services, 6 FAQ, цены, конкретные клиники/площадки). А `P16_ATHLETES`, `P17_HALAL`, `P18_LGBTQ`, `P19_ACCESSIBILITY` — light-touch (2 FAQ, 4 services, мало конкретики).

**Проблема №2 — нет lead-capture на самой странице.** `PersonaLandingPage` сейчас показывает только CTA-ссылки на чужие воронки (`/property/rent`, `/visa/quiz`, `/concierge`). Нет inline-формы, как в Wave 1/2 лендингах. Это режет конверсию: нишевые персоны (особенно P14/P15/P19) часто хотят оставить заявку прямо на странице, а не уходить в общий каталог.

**Проблема №3 — нет cross-link с ClusterLandingPage.** Lifestyle-кластер (`/cluster/lifestyle`) не показывает персоны P14–P19, хотя `relatedPersonas` поле существует в `ClusterLanding`.

### Что делаем

#### Шаг 1. Доводим контент P16–P19 до production-grade

Симметрично с P14/P15: каждая персона получает **6 services** (вместо 4), **6 FAQ** (вместо 2), конкретные цены THB/USD, имена локаций/клиник/залов, типичные сроки.

- **P16 ATHLETES** — добавить: nutrition coach, fight booking (любительские турниры), team retreats для club bookings, расценки по отдельным залам (Tiger ฿X/мес, AKA ฿Y/мес), FAQ про injury insurance, длительность ED Visa, питание под cut/bulk, восстановление между сессиями.
- **P17 HALAL** — добавить: halal-yacht charter (растущий сегмент), wedding-halal сценарии, школы для детей с halal-меню, prayer kit на виллу, Ramadan packages. FAQ про сезон Хаджа, женский spa, банковские переводы по шариату, доставка halal-продуктов на виллу.
- **P18 LGBTQ** — добавить: wedding services (легализован 2024), wellness retreats, family/IVF консультации, real-estate с couple-friendly contract. FAQ про брак-регистрацию, наследование на пару, child adoption status, friendly-developer'ы.
- **P19 ACCESSIBILITY** — добавить: medical evacuation insurance, dialysis-clinic partnerships, sign-language interpreter, accessible diving (PADI Adaptive). FAQ про визу с инвалидностью, аренду медоборудования, страховые случаи, escort на длительных перелётах.

Все правки — только в `src/content/landings/personas/P16_ATHLETES.ts` … `P19_ACCESSIBILITY.ts`. Существующие тесты `personaLandings.test.ts` остаются зелёными (slug/status не меняем).

#### Шаг 2. Inline lead-форма на PersonaLandingPage

В `src/pages/landings/PersonaLandingPage.tsx` добавляем секцию `<LandingLeadForm>` (компонент из Wave 1, `src/components/landings/LandingLeadForm.tsx`) перед финальным CTA-блоком.

- Vertical для лида определяется по `personaCode`:
  - P14 → `health` vertical
  - P15 → `wedding` vertical (или `events` если `wedding` нет)
  - P16 → `fitness` vertical
  - P17/P18/P19 → `properties` vertical (основная воронка — жильё)
- Передаём `personaCode` в metadata лида, чтобы CRM видел источник.
- Опциональное поле «Что вам нужно?» (свободный текст) для нишевых вопросов.

Форма скрывается, если `landing.primaryCta.href` указывает на платную воронку (`/visa/quiz` для P16 — там уже воронка с оплатой; не дублируем).

#### Шаг 3. Cross-link с ClusterLandingPage

В `src/content/landings/clusterLandings.ts` находим cluster `I` (Lifestyle) и убеждаемся, что `relatedPersonas: ['P14','P15','P16','P17','P18','P19', ...]`. Если нет — добавляем. `ClusterLandingPage` уже умеет рендерить блок «Лендинги по персонам» (B.6 трек).

#### Шаг 4. Sitemap & SEO

- Убедиться что `public/sitemap.xml` (или генератор) включает 6 URL `/for/medical`, `/for/weddings`, `/for/athletes`, `/for/halal`, `/for/lgbtq`, `/for/accessibility` с `<xhtml:link rel="alternate" hreflang>`.
- Проверить `LIVE_PERSONA_SLUGS` уже содержит все 6 (по тесту `personaLandings.test.ts:46-72` — да).
- Добавить schema.org `Service` + `FAQPage` через существующий `<JsonLd>` если ещё не подключен в `PersonaLandingPage` (если есть — пропускаем).

### Что НЕ делаем

- Не трогаем `ComingSoonGate` whitelist — `/for/*` уже доступен, см. `src/App.tsx`.
- Не создаём новые роуты или страницы — `PersonaLandingPage` универсальный.
- Не трогаем P14/P15 контент — он уже production-grade.
- Не меняем тип `PersonaLanding` — расширяем только данные в существующих полях.

### Технические детали

```text
Файлы (правка):
  src/content/landings/personas/P16_ATHLETES.ts        — расширение services/faq
  src/content/landings/personas/P17_HALAL.ts           — расширение services/faq
  src/content/landings/personas/P18_LGBTQ.ts           — расширение services/faq
  src/content/landings/personas/P19_ACCESSIBILITY.ts   — расширение services/faq
  src/pages/landings/PersonaLandingPage.tsx            — встроить <LandingLeadForm/>
  src/content/landings/clusterLandings.ts              — relatedPersonas для cluster I
  public/sitemap.xml (или генератор)                   — проверка hreflang

Файлы (без правки, для контекста):
  src/components/landings/LandingLeadForm.tsx          — переиспользуем
  src/lib/landings/types.ts                            — типы стабильные
  src/components/layout/AnimatedRoutes.tsx:694-705     — роут уже есть
```

**Маппинг persona → lead vertical:**
| Persona | Lead vertical | Pipeline |
|---|---|---|
| P14 medical | `health` | `useUniversalLead` |
| P15 weddings | `events` (alias wedding) | `useUniversalLead` |
| P16 athletes | `fitness` | `useUniversalLead` |
| P17 halal | `properties` | `useUniversalLead` |
| P18 lgbtq | `properties` | `useUniversalLead` |
| P19 accessibility | `properties` | `useUniversalLead` |

### Acceptance

1. Все 6 страниц `/for/{medical,weddings,athletes,halal,lgbtq,accessibility}` открываются с inline lead-формой.
2. P16–P19 содержат по ≥6 services и ≥6 FAQ с конкретными цифрами/именами.
3. Существующий тест `personaLandings.test.ts` остаётся зелёным.
4. Лид с любой из 6 страниц долетает до соответствующей CRM pipeline c `personaCode` в metadata.
5. `/cluster/lifestyle` показывает cross-link на P14–P19.

### Wave 3 Out-of-scope (можно отдельной волной)

- Динамические OG-images per-persona (сейчас все используют `OG_DEFAULT`).
- A/B тест inline-форма vs CTA-only.
- Отдельные `/for/:persona/:area` гео-страницы (P14 × Bang Tao и т.п.).
