## Wave 4 + Wave 5 + Route Cleanup

Беру три блока подряд под общим фича-флагом, чтобы при необходимости можно было выключить без редеплоя. Все изменения дизайн-токенами (DS 2.1), без новых хардкод-цветов и без новых top-level маршрутов.

---

### Wave 4 — Command Palette (⌘K)

**Цель:** заменить громоздкий AppDrawer быстрым поиском по 59 micro-apps, ролям и ситуациям.

- Новый компонент `src/components/command/CommandPalette.tsx` поверх `cmdk` (уже в `package.json` через shadcn) — модалка `Sheet` на мобилке, `Dialog` на desktop.
- Источники данных (read-only, без новых таблиц):
  - `src/lib/appRegistry.ts` — 59 приложений (title, route, cluster, icon)
  - `src/lib/taxonomies/master.ts` — 6 surfaces + 10 JTBD clusters
  - `src/lib/situations/*` — situation cards (для Navigator V3)
  - `useUserPersonas` — активные роли пользователя (для бустинга релевантности)
- Хоткеи: `⌘K` / `Ctrl+K` / `/` глобально через `useHotkey` (новый хук в `src/hooks/useHotkey.ts`).
- Recent searches → `localStorage` (`myuno.cmdk.recent`, last 5).
- Триггеры открытия:
  - Кнопка поиска в `Hero` на `IndexV2`
  - Floating button в `MobileNavBar` (заменяет «Все приложения»)
  - Хоткей глобально из `App.tsx`
- Аналитика: событие `command_palette_opened` / `command_palette_navigate` в существующий `track()` (если есть) или no-op fallback.
- Под фича-флагом `feature_flag:command_palette` (default OFF) — миграция-сидер.

### Wave 5 — Onboarding coachmarks

**Цель:** объяснить персонализацию новому пользователю за 3 шага без редиректа.

- Новый компонент `src/components/onboarding/Coachmarks.tsx` — лёгкий tour без библиотек: абсолютный overlay + spotlight через `getBoundingClientRect` целевых элементов по `data-coach="..."` атрибутам.
- Шаги для `IndexV2`:
  1. **WhyChip** — «Подбираем под вашу роль. Тап — сменить.»
  2. **Next Best Action** — «Здесь приоритетные действия по вашим заказам.»
  3. **Command Palette trigger** — «⌘K — мгновенный поиск по всем сервисам.»
- Прогресс хранится в `profiles.onboarding_state` jsonb (новая колонка, default `{}`) — поля `home_v2_tour_completed`, `home_v2_tour_dismissed_at`. Миграция + RLS update.
- Логика показа: только если `home_v2` ON, юзер залогинен, тур не пройден/не закрыт, и `IndexV2` смонтирован.
- Закрытие: ESC / кнопка «Понял» / клик вне → пишем `dismissed_at`. Повторный показ через 30 дней, если не completed.
- Все строки — через `t()` (i18n RU/EN).

### Route cleanup

**Цель:** убрать orphan-маршруты из ~390 кандидатов аудита (`docs/audits/route-inventory.md`).

- Запускаю обновлённый `scripts/audit-routes.mjs` со списком `--reachable` (BFS от Index + nav + appRegistry) — получаю свежий список «не достижим ни через UI, ни через registry, ни через canonical taxonomy».
- Фильтрую безопасные кандидаты:
  - **Удаляем** (~80–120 маршрутов): дубли legacy `/v1/*`, тестовые `/sandbox/*`, мёртвые `/coming-soon/*`, и страницы, которые `git log` показывает как unmerged drafts.
  - **Оставляем под пометкой `// @route-orphan: intentional`** все маршруты, где есть бэклинк из edge-функции, email-шаблона или внешнего домена (выявляются `rg`-сканом по `supabase/functions/**` и `src/i18n/**/emails.*`).
- Для каждого удаления — `rm` страницы + удаление `<Route>` в `src/components/layout/routes/*` + удаление из `pageRegistry.ts`.
- Финальный отчёт: `docs/audits/route-cleanup-2026-06-25.md` — список удалённого с причиной и diff-сводкой.
- **Без переименований существующих рабочих маршрутов** — только удаление мёртвого.

---

### Технические детали

- **БД-миграции (2):**
  1. `feature_flag:command_palette` в `system_settings` (default disabled).
  2. `profiles.onboarding_state jsonb default '{}'::jsonb` + index по `(user_id) where (onboarding_state ->> 'home_v2_tour_completed') is null`.
- **i18n-ключи:** `command.*` (~12 ключей), `onboarding.home_v2.*` (~8 ключей) — RU + EN сразу.
- **Хук `useHotkey`** — generic, чтобы переиспользовать дальше (Esc-close, `g h` для home и т.п.).
- **Тесты:** smoke на `CommandPalette` (открытие/фильтр/выбор) через Playwright; route-cleanup проверяется `npm run build` (Vite упадёт, если осталась импортная битая ссылка).
- **DS 2.1:** только семантические токены (`bg-card`, `text-foreground`, `border-border`), `--radius: 0`, без mint/glow.
- **Обратная совместимость:** AppDrawer остаётся как fallback, если флаг OFF; coachmarks не показываются без `home_v2`.

### Порядок работ

1. Миграции (БД) — атомарно.
2. Wave 4: хук + palette + триггеры + i18n.
3. Wave 5: coachmarks + i18n + сохранение прогресса.
4. Route cleanup: скрипт → отчёт → удаление файлов → `npm run build` для верификации.
5. Финальный smoke через Playwright + краткий отчёт в чат.

### Что НЕ делаю в этом проходе

- Не включаю `home_v2` / `command_palette` для всех — флаги остаются OFF, активируются point-and-click через `system_settings`.
- Не трогаю i18n-долг 610 RU-литералов (отдельный трек).
- Не запускаю security-скан (отдельная команда).
- Не публикую — публикация отдельным шагом после QA.
