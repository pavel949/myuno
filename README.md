# myUNO · Phuket Super-App for Foreigners

> **Доверенная цифровая инфраструктура для жизни и инвестиций иностранца на Пхукете.**
> Один аккаунт, одна база, одно окно — от трансфера из аэропорта до сделки с недвижимостью на $5M.

[![Status](https://img.shields.io/badge/status-active%20development-00D68F)](./PROJECT.md)
[![Version](https://img.shields.io/badge/app-v3.43.0-4E7BFF)](./src/lib/appVersion.ts)
[![Stack](https://img.shields.io/badge/stack-React%2018%20%C2%B7%20Vite%205%20%C2%B7%20Supabase-0F1C2E)](#tech-stack)
[![Domain](https://img.shields.io/badge/domain-myuno.app-08101E)](https://myuno.app)

---

## What it is

**myUNO** — суперапп уровня государственного сервисного портала для русскоязычных и англоязычных иностранцев на Пхукете. Платформа охватывает 40+ микро-приложений в шести кластерах жизни (Arrive · Live · Manage · Invest · Legal · Build), объединённых единым AI-консьержем, общим CRM и канонической базой данных.

**Маховик одного клиента:**

```
ТУРИСТ → АРЕНДАТОР → ПОКУПАТЕЛЬ → СОБСТВЕННИК → РЕФЕРРЕР
```

Один CAC — четыре денежных события на 24–36 месяцах. Главный финансовый KPI — GMV сделок с недвижимостью; все остальные вертикали прогревают и удерживают пользователя на пути к этой сделке.

**Два продукта-ядра:**

| Продукт | Домен | Назначение |
|---------|-------|------------|
| **myUNO** | [`myuno.app`](https://myuno.app) | Единая точка входа, AI-консьерж, все вертикали, витрина новостроек, аренда |
| **myUNO Invest** | [`invest.myuno.app`](https://invest.myuno.app) | CRM сделок, DueDiligence AI, ClearView™ рейтинги, аналитика для HNW |

---

## Документация — порядок чтения

> При расхождении кода/UI с документами правится **код**, а не документ.

### 1 · Стратегический источник истины

**[`/PROJECT.md`](./PROJECT.md)** — Master document v2.3. Чем является платформа, как устроена монетизация, кто аудитория, восемь моатов (включая ClearView), 13-строчная таблица сделок, Y1 target $1M, дизайн-стандарты, 5-тест для новых фич. **Отменяет все предыдущие версии и роадмапы.**

### 2 · Канонические документы (`docs/canonical/`)

| # | Документ | О чём |
|---|----------|-------|
| 01 | [Segmentation Framework](./docs/canonical/01-segmentation-framework.md) | 3-осевая сегментация · 25 персон · 10 кластеров · CRM-поля |
| 02 | [Service Catalogue v2](./docs/canonical/02-service-catalogue-v2.md) | 16 категорий × 230 услуг с тегами lifecycle/role/cluster |
| 03 | [Tone of Voice](./docs/canonical/03-tone-of-voice.md) | Голос бренда: спокойная уверенность, продаём доверие |
| 04 | [Implementation Protocol](./docs/canonical/04-implementation-protocol.md) | Operational playbook M1→M7 |
| 05 | [Visual Design System](./docs/canonical/05-visual-design-system.md) | Цвет, типографика, сетка, компоненты, кластеры |
| 06 | [ClearView™ Methodology](./docs/canonical/06-clearview-methodology.md) | Off-plan rating system · 8 категорий · AAA–BB · моат #8 |
| 07 | [Information Architecture](./docs/canonical/07-information-architecture.md) | URL-структура · субдомены · навигация · cross-domain SSO |
| 08 | [AI Prompts Library](./docs/canonical/08-ai-prompts-library.md) | Канонические system prompts для всех AI-агентов |
| 09 | [Data Schema](./docs/canonical/09-data-schema.md) | Таблицы · enums · RLS · FK · naming conventions Supabase |

### 3 · Архитектура (`docs/canonical/architecture/`)

| Документ | О чём |
|----------|-------|
| [ARCHITECTURE_V2](./docs/canonical/architecture/ARCHITECTURE_V2.md) | Roles · clusters · surfaces · agents · hard rules |
| [FEASIBILITY](./docs/canonical/architecture/FEASIBILITY.md) | Migration path и per-role implementation status |

Индекс канона: [`docs/canonical/README.md`](./docs/canonical/README.md) · История: [`docs/canonical/CHANGELOG.md`](./docs/canonical/CHANGELOG.md).

### 4 · Операционные референсы

| Документ | О чём |
|----------|-------|
| [`CLAUDE.md`](./CLAUDE.md) | Инструкции для AI-ассистентов — обязательно к прочтению до любой задачи |
| [`DESIGN.md`](./DESIGN.md) | Design tokens — цвета, шрифты, spacing, motion |
| [`docs/ENVIRONMENT.md`](./docs/ENVIRONMENT.md) | Окружения, БД, ключи (источник истины) |
| [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md) | Коды, нейминг, паттерны |
| [`docs/EDGE_FUNCTIONS.md`](./docs/EDGE_FUNCTIONS.md) | Реестр Edge Functions (Deno 2.0) |
| [`supabase/functions/_docs/API_REFERENCE.md`](./supabase/functions/_docs/API_REFERENCE.md) | Полный API-референс |

---

## Tech Stack

| Слой | Технологии |
|------|------------|
| **Frontend** | React 18 · TypeScript 5.8 · Vite 5 (SWC) · React Router 6 · TanStack Query 5 |
| **UI** | Tailwind CSS 3.4 · shadcn/ui · Radix UI · Framer Motion |
| **Forms** | React Hook Form 7 · Zod |
| **Backend** | Supabase (Postgres · Auth · Storage · Edge Functions on Deno 2.0) |
| **Payments** | Stripe (Checkout · Connect · Subscriptions) |
| **Maps** | Google Maps (`@react-google-maps/api`) |
| **Messaging** | UltraMSG (WhatsApp) · Telegram Bot · Resend (email) |
| **Mobile** | PWA (`vite-plugin-pwa`) · Capacitor (iOS/Android) |
| **Quality** | Vitest · Testing Library · Playwright · Sentry |

**Шрифты:** Golos Text (display) · DM Sans (body) · JetBrains Mono (data) · Playfair Display (luxury RE).
**Палитра (dark default):** bg `#08101E` · primary `#00D68F` (mint) · accent `#4E7BFF` (blue).

---

## Quick Start

```bash
git clone <YOUR_GIT_URL>
cd myuno
npm install
cp .env.example .env   # заполнить значения (см. docs/ENVIRONMENT.md)
npm run dev            # localhost:8080
```

Команды:

```bash
npm run dev       # dev server
npm run build     # production build
npm run preview   # preview production at localhost:4173
npm run lint      # ESLint
```

---

## Структура проекта

```
.
├── PROJECT.md                  ← strategic source of truth (read first)
├── CLAUDE.md                   ← AI assistant instructions
├── DESIGN.md                   ← design tokens reference
├── README.md                   ← this file
│
├── docs/
│   ├── canonical/              ← operational source of truth (01–09 + architecture/)
│   ├── ENVIRONMENT.md          ← envs, DBs, keys
│   ├── CONVENTIONS.md
│   └── …                       ← topic-specific docs
│
├── src/
│   ├── pages/                  ← 366+ pages by vertical
│   ├── components/             ← 1000+ components / 60+ domains
│   ├── hooks/                  ← 345 custom hooks
│   ├── contexts/               ← 11 global providers
│   ├── integrations/supabase/  ← auto-generated client + types (DO NOT EDIT)
│   ├── lib/                    ← utilities · taxonomies · adapters
│   ├── design-system/          ← tokens · component docs
│   └── i18n/                   ← RU/EN translations
│
├── supabase/
│   ├── functions/              ← Edge Functions (Deno 2.0)
│   └── migrations/             ← SQL migrations (DO NOT EDIT)
│
└── archive/                    ← frozen historical context (do not reference)
```

---

## Окружения

| Окружение | URL | База данных |
|-----------|-----|-------------|
| **Production** | [myuno.app](https://myuno.app) · [www.myuno.app](https://www.myuno.app) | Supabase `kakkwibljrjsawxgnupk` |
| **Preview** | [uno-connect-hub.lovable.app](https://uno-connect-hub.lovable.app) | Та же PRIMARY DB |
| **Local** | `localhost:8080` | Та же PRIMARY DB |

⚠️ Отдельного staging нет — все три окружения работают с одной production БД. Тестовые данные помечайте `[TEST]` / `source='smoke_test'` / `*@myuno.test`.

---

## User surfaces

| Surface | Маршрут | Назначение |
|---------|---------|------------|
| Home | `/` | LifeOS — ситуационные шорткаты |
| Discover | `/discover` | Хаб сервисов по жизненным контекстам |
| Operate | `/operate` | Управление активами для собственников и УК |
| Wallet | `/wallet` | Платежи, подписки, история |
| Me | `/account` | Профиль, бронирования, настройки |
| Admin | `/admin` | Платформенное управление (контент, заказы, AI) |

Кластеры (colour-locked): **Arrive · Live · Manage · Invest · Legal · Build**.

---

## Deployment

- **Production:** Vercel auto-deploy с `main` ветки.
- **Edge Functions:** Supabase auto-deploy при пуше в `supabase/functions/`.
- **Lovable preview:** обновляется автоматически.

---

## License & ownership

Proprietary · © Ignatev Group · All rights reserved. Контакт: Pavel Ignatev.
