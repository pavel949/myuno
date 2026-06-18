
# План: Navigator + Owners Landing (Civic-grade SuperApp)

Принцип: спокойная авторитетность как GOV.UK / e-Estonia / Apple support. Минимум выбора, максимум ясности. Каждый экран отвечает на 1 вопрос: «что мне сейчас сделать?».

## 0. Дизайн-контракт (применяется ко всему ниже)

- Свет по умолчанию (`#F7F5F1` cream, `#1C1916` ink, navy primary, orange accent ≤3%).
- Углы `--radius: 0`, без mint, без glow, без декоративных градиентов.
- Source Serif 4 заголовки / Geist UI / IBM Plex Mono для цифр.
- Один акцент на экран, один primary CTA, всё остальное secondary/ghost.
- Все цифры (счётчики ситуаций, цены) — табличные mono, выровненные.
- Мобильно: 375px first, touch ≥44px, Sheet вместо Dialog.

---

## 1. NAVIGATOR / DISCOVER — новая архитектура

### 1.1. Что починим в данных (Wave 1, миграции)

1. Засинхронить DB `cluster_life_situations` со статическим SSOT (добавить ~16 строк, проставить `is_primary`). После этого статический массив `CLUSTER_LIFE_SITUATIONS` помечается deprecated, навигатор читает из DB.
2. Деактивировать дубликаты (`pets` vs `pet_owner`, `property` vs `property_owner`), удалить 129 orphan-маппингов на неактивные ситуации.
3. Удалить 526 битых ссылок в `catalog_life_map` (entity_type `service`, `transfer` — 448 строк + 78 точечных). Гибрид: чистка сейчас, починка view — отдельной задачей.
4. Добавить ситуацию `management_company` (для УК) и `vendor_onboarding` (для провайдеров).
5. Проставить `role_scope` для критичных кластеров: `manage` → `['owner','mc']`, `build` → `['developer']`, `work` → `['vendor']`.

### 1.2. Роли (Wave 2)

Расширить `useLifeOSRole` с 4 до 7 значений:
```
guest · resident · owner · mc · investor · developer · vendor
```
Маппинг 17 `app_role` → 7 LifeOSRole в одной функции (см. матрицу в аудите).

RPC `resolve_life_os_context` дополнить:
- параметр `count_only` (bool) — для счётчиков карточек,
- фильтр по `audience` кластера.

### 1.3. UX навигатора (Wave 3)

`/discover` — одна вертикальная лента, без табов:

```text
┌─────────────────────────────────────┐
│  Здравствуйте, [имя]                │  ← персонализация
│  Ваши роли: [Собственник] [edit]    │  ← 1 chip-row, кнопка edit → Sheet
│                                     │
│  ── Для вас сейчас ─────────────    │  ← top-3 ranked, крупные карточки
│  [ Ситуация А ]                     │
│  [ Ситуация Б ]                     │
│  [ Ситуация В ]                     │
│                                     │
│  ── Прибытие · 4 ──────────────     │  ← compact rows, не grid
│   →  Турист              · 273      │
│   →  Первый раз          ·  42      │
│  ── Жизнь · 8 ─────────────────     │
│   →  Резидент            · 156      │
│   ...                               │
│  ── Управление · 4 ────[owner]──    │  ← роле-гейт, скрыт у guest
│  ── Инвестиции · 2 ────────────     │
│  ── Документы · 3 ─────────────     │
│  ── Девелопмент · 1 ──[dev]────     │
└─────────────────────────────────────┘
```

Ключевое:
- Никаких ярких цветных карточек на кластер — только нейтральный фон, тонкая линия-разделитель, mono-счётчик справа.
- Один источник числа: badge = тот же RPC count, что детальная страница (никакого client-side aggregate из 1983 строк).
- Скрытие кластеров по роли (manage скрыт от туриста, build от не-developer).
- Связанные ситуации на детальной странице берут `next_routes` из `lifeos_routes` (16 строк, сейчас не используются).

### 1.4. Что НЕ делаем сейчас (out of scope)
- Бридж `UserPersona` (14) ↔ `PersonaCode` (25, P01–P25) — отдельная задача.
- Починка view `life_os_catalog` (вернуть service + transfer как entity).
- Полное удаление статического SSOT — только пометка deprecated.

---

## 2. /FOR-OWNERS — единый landing для собственников и УК

Один URL `/for-owners`, две дорожки на одной странице. `/for-management-companies` остаётся для глубокого B2B SaaS-пресейла и линкуется из секции «Управляю 5+ объектами».

### 2.1. Структура страницы

```text
HERO
  H1: Ваша недвижимость — под контролем
  Sub: Сдавайте сами через myUNO PMS или передайте нам в управление.
       Отчёты, гости, уборка, финансы — в одном месте.
  [Передать в управление] [Управлять самому]   ← 1 primary + 1 secondary

TWO PATHS  (2 равные колонки на desktop, stack на mobile)
  ┌── Передать нам ──────────┐  ┌── Управлять самому ──┐
  │ Full Management 70/30    │  │ myUNO PMS · $25/объект│
  │ • Поиск гостей           │  │ • Календарь + iCal    │
  │ • Уборка и checkin       │  │ • Финансы + отчёты    │
  │ • Ежемесячный отчёт      │  │ • Channel manager     │
  │ [Оставить заявку]        │  │ [Открыть кабинет]     │
  └──────────────────────────┘  └───────────────────────┘

WHAT YOU GET (6 строк, иконка + 1 предложение, без картинок)
  Отчёты · Гости · Уборка · Финансы · Каналы · Команда

PRICING (компактная таблица, mono цифры)
  Self-Service   Starter $199/мес · до 5 объектов
  Self-Service   Pro     $399/мес · до 15 объектов  [Рекомендуем]
  Full Service   70/30   · мы делаем всё
  → Сравнить с тарифами для УК (5+ объектов) → /for-management-companies

REFERRAL (для залогиненных собственников)
  «Пригласите соседа — получите 1 месяц PMS бесплатно»
  [https://myuno.app/auth?ref=ABC123] [Скопировать] [Поделиться]
  ← OwnerReferralCard, использует существующий useReferral

FAQ (5 вопросов, accordion)

CTA FOOTER
  [Передать в управление]  ·  WhatsApp Pavel
```

### 2.2. Owner-to-Owner invite

- Новый компонент `OwnerReferralCard` поверх существующего `useReferral` (RPC `generate_referral_code` уже есть, ничего на бэке менять не нужно).
- Размещение: на `/for-owners` (для авторизованных), на `/owner` (dashboard), один раз в `OwnerPropertiesPage` после добавления первого объекта.
- Скоуп `owner_referral` в `referral_codes` — для аналитики, без изменений схемы.

### 2.3. Регистрация маршрута
- `/for-owners` → `src/pages/ForOwners.tsx` (уже начат в предыдущей итерации, доделать по этому контракту).
- Зарегистрировать в `AnimatedRoutes.tsx`, добавить в `APP_ROUTES`, в `pageRegistry`.
- Поставить ссылку в:
  - `WelcomePersonaRouter` (карточка «У меня есть недвижимость»),
  - `AudienceEntries` (рейл «Собственникам»),
  - `AccountFlatMenu` для роли owner.

---

## 3. Волны исполнения

| Wave | Что | Файлы (ориентир) |
|---|---|---|
| **1. Data cleanup** | миграции: sync `cluster_life_situations`, чистка orphan-маппингов, новые ситуации `management_company`/`vendor_onboarding`, `role_scope` для manage/build | 1 SQL миграция |
| **2. Role + RPC** | `useLifeOSRole` → 7 ролей; RPC `resolve_life_os_context` + `count_only`/`audience` | `src/hooks/useLifeOS.ts`, 1 SQL миграция |
| **3. Navigator UI** | редизайн `NavigatorPageV3` под civic-стиль, role-gated кластеры, единый счётчик через RPC, секция «Для вас», `lifeos_routes` на детальной | `NavigatorPageV3.tsx`, `NavigatorClusterSection.tsx`, `SituationCard.tsx`, `SituationDetailPage.tsx`, `useSituationServiceCounts.ts` (удалить или переписать) |
| **4. /for-owners** | landing + `OwnerReferralCard` + регистрация маршрута и ссылок | `src/pages/ForOwners.tsx`, `src/components/referral/OwnerReferralCard.tsx`, `AnimatedRoutes.tsx`, `routes.ts`, `pageRegistry.ts`, `AudienceEntries.tsx`, `WelcomePersonaRouter.tsx`, `AccountFlatMenu.tsx` |
| **5. QA** | прогон 5 ролями (guest, resident, owner, mc, developer), mobile 375px | — |

**Рекомендую:** делать строго по порядку Wave 1 → 5, в одном PR. Так данные, роли и UI согласованы в каждом коммите, и /for-owners выходит вместе с чистым навигатором. Альтернатива «landing сначала» оставит навигатор в текущем виде с битыми счётчиками — клиента это запутает сильнее, чем отсутствие landing'а.

## 4. Acceptance criteria

- Счётчик на карточке ситуации = количество карточек на её детальной странице. Всегда.
- Турист (guest) не видит кластеры Manage, Build, Work.
- Owner видит Manage по умолчанию первым.
- MC (новая роль) видит ситуацию `management_company` в Manage.
- `/for-owners` открывается с мобильного 375px без горизонтального скролла, primary CTA выше fold.
- Авторизованный owner на `/for-owners` видит свой реферальный код в 1 клик копируется.
- Все цвета через токены, ни одного hex в JSX.
- Lighthouse mobile перфоманс ≥ 85 на `/discover` и `/for-owners`.
