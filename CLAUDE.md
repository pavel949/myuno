# CLAUDE.md — myUNO: стабильные правила для AI-ассистентов

> Это короткий указатель и набор неизменных правил. Он НЕ является главным документом.
> Счётчики (страницы, функции, миграции, версии), журнал коммитов и текущие задачи здесь не хранятся:
> версию смотрите в `src/lib/appVersion.ts`, состояние — в `docs/STATUS.md`, количество — в коде.

## 0. Порядок источников истины (при конфликте выигрывает верхний)

1. `PROJECT.md` — конституция продукта и инженерии.
2. `AGENTS.md` — инварианты исполнения для AI.
3. `DESIGN.md` — визуальные нормы (Design Bible v4).
4. `docs/ENVIRONMENT.md` — базы данных, окружения, ключи.
5. `docs/canonical/*` — специализированные нормы (индекс: `docs/canonical/README.md`).
6. `docs/STATUS.md` — текущее состояние и решения «да/нет» (не норма).
7. Всё в `docs/convergence`, `docs/audits`, `docs/qa`, `docs/hardening`, `archive/` — свидетельства и история, не нормы.

Если код или UI расходится с PROJECT.md или каноном — правится код. Если изменение противоречит источникам — остановись и задай вопрос владельцу (Павлу).

## 1. Проект

myUNO — AI-first суперапп (Homes, Services Marketplace, Concierge, PMS/Operations, CRM) для Пхукета.

- Домен: myuno.app. Репозиторий: pavel949/myuno (React/Vite). `pavel949/myUNO-final` — отдельное Next.js-приложение.
- Стек: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase (Postgres, Auth, Storage, Edge Functions) + TanStack Query + Stripe + Vercel + Capacitor. Точные версии — в package.json.
- Языки UI: RU / EN (и TH там, где поддержано). Код, комментарии и коммиты — на английском.

## 2. Обязательное чтение перед работой

1. `PROJECT.md`, затем `AGENTS.md`.
2. Для конкретной области — документ из `docs/canonical/` (индекс: `docs/canonical/README.md`).
3. Для структурных изменений — `docs/canonical/architecture/OVERVIEW.md`, `ARCHITECTURE_V2.md`, `FEASIBILITY.md`.

Каталог услуг: канонический целевой список — `docs/canonical/02-service-catalogue-v2.md`; рантайм — статический SSOT `src/lib/catalog/taxonomy.ts` поверх DB-таблиц `category_groups` / `categories`. Расхождение между ними задокументировано; не выдумывай каталог.

## 3. Архитектурные правила (ARCHITECTURE_V2 §13)

1. Не добавляй новый top-level route: размещай под нужным кластером или `/operate/*`.
2. Не создавай новый shell: `MiniAppLayout` или существующий Operate shell.
3. Не хардкодь hex-цвета: переменные `src/styles/tokens.css`.
4. Не импортируй между границами кластеров: общие L4-примитивы или L3-сервисы.
5. Агент никогда не двигает деньги автоматически: только user-confirmed intent.
6. Каждый денежный экран показывает audit marker (tx id + ledger entry id + timestamp).
7. Каждая новая фича за `feature_flag:*` в `system_settings` до GA.

### Глоссарий

- Surface / Cluster (контентный кластер) — один из 6: Arrive · Live · Manage · Invest · Legal · Build (`src/lib/taxonomies/master.ts`).
- Canvas (App Shell) — Home · Discover · Operate · Wallet · Me · Admin (`src/types/canvas.ts`). Не путать с Surface.
- JTBD Cluster — функциональный классификатор A–J (теги, AI-роутинг, SEO). Не путать с Surface.
- Роли: `app_role` (enum в `src/types/auth.ts`, синхронизирован с `public.app_role`) — источник истины для авторизации; consumer role-stack в `profiles.roles_stack` — для онбординга.
- Navigator v3 — `/discover` (situation-first); жизненные ситуации — `life_situations`, `catalog_life_map`.

## 4. Базы данных и окружения

Канонический источник: `docs/ENVIRONMENT.md`. При расхождении он главный.

| Роль | Supabase project ref | Примечание |
|---|---|---|
| PRIMARY (production), Lovable Cloud | `kakkwibljrjsawxgnupk` | единственная production-БД; её использует myuno.app |
| MIRROR (опционально) | `erfwtoavipwjqmylpizt` | только ручной экспорт через `scripts/` |

- Preview, published, myuno.app и локальная разработка используют одну production-БД. Staging нет. Тестовые данные помечай маркерами, бизнес-данные в QA не мутируй.
- Миграции коммить в `supabase/migrations/` и применяй через Lovable Cloud. Не редактируй применённые миграции.
- ВАЖНО для AI-агентов: Supabase MCP в сессиях НЕ имеет доступа к production. Проекты, которые он показывает (например `hueotfhvvbxaijccmhnc`, `viejnaqprjpqadtzvjgo`), НЕ production. Никогда не применяй DDL и миграции к ним, считая их боевыми.
- Supabase client: только `src/integrations/supabase/client.ts`, новые экземпляры не создавать. Автогенерируемые типы `src/integrations/supabase/types.ts` вручную не править. Все таблицы в схеме `public`.
- Деньги: Stripe checkout → webhook → `orders` → `record_ledger_entries` → `ledger_entries`. Подробности и границы доменов — PROJECT.md и AGENTS.md.

## 5. Правила кода

Делай:
- TypeScript strict, без `any`; типы совпадают со схемой БД.
- Mobile-first (375px), каждая user-facing строка локализована.
- Обработка ошибок для каждого запроса; loading/skeleton для асинхронных операций.
- Новые вертикали — за feature flags (`feature_flag:*`).
- Контакты админов — через `_shared/admin-config.ts`, не хардкод. Новые чекауты — через `_shared/checkout-handler.ts`.
- Коммиты: английский, conventional (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `design:`, `build:`).

Не делай:
- Не создавай новые Supabase client; не хардкодь ключи; не правь `types.ts`.
- Не используй `console.log` в production-коде, `supabase.schema('v2')`, `VITE_SIMULATION_MODE` / `VITE_DEMO_MODE`.
- Не хардкодь email и телефоны администраторов в Edge Functions.

## 6. Дизайн

Норма — `DESIGN.md` (Design Bible v4). Единственный runtime-источник — `src/styles/tokens.css`. Шрифты: Outfit (display), Manrope (UI), IBM Plex Mono (числа); палитра navy / paper / gold; светлая тема по умолчанию. Используй семантические утилиты (`bg-primary`, `text-foreground`, `bg-card`, `border-border`). Радиусы 4/8/12px; не добавляй `rounded-xl|2xl|3xl`. Сохраняй клавиатурный фокус, видимые состояния ошибки/загрузки и 44×44 touch targets. Устаревшие дизайн-документы (`docs/DESIGN_BIBLE.md` v2.1, `docs/DESIGN_TOKENS.md`, `docs/canonical/05-visual-design-system.md`, `docs/design-system/`) — история, не норма.

## 7. Интеграции

Supabase, Stripe, Google Maps, WhatsApp (UltraMSG), Telegram Bot, Resend, Capacitor, Sentry. Статусы подключений смотри в `docs/ENVIRONMENT.md`, здесь они не дублируются.

## 8. Разработка

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # ESLint
npm test         # unit tests
```

Используй только скрипты, реально существующие в текущем `package.json`. Окружение: `.env.example`; секреты — только в Vercel/Supabase dashboard.

## 9. Git

- `main` — production-ready; Vercel деплоит из production-ветки.
- Работа ведётся в отдельных ветках и через pull request; прямые пуши в `main` не делаются.
- Не удаляй документы безвозвратно: переноси в `archive/` (история остаётся в git).

## 10. Skill routing

Если запрос пользователя соответствует доступному skill, вызови его первым действием:
- идеи продукта, «стоит ли строить» → office-hours
- баги, ошибки, 500 → investigate
- ship, deploy, push, create PR → ship
- QA, поиск багов → qa
- code review, проверка diff → review
- обновление документации после релиза → document-release
- weekly retro → retro
- дизайн-система, бренд → design-consultation
- визуальный аудит → design-review
- архитектурный review → plan-eng-review
- сохранить прогресс / checkpoint → checkpoint
- качество кода, health check → health
