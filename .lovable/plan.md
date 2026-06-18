# План: свести всё в `main` и сделать его актуальной версией

## Цель
Один рабочий branch — `main`. В нём:
- все правки из Lovable (уже там),
- все правки из Claude Code (сейчас в `pavel/wip-current-version-20260318`).

После — приложение деплоится с `main`, ветка WIP закрывается.

## Текущая картина
| Где | Что лежит | Куда пушится |
|---|---|---|
| Lovable sandbox | security-миграция 2026-06-18 + 5 edge-функций + `AIAdvisorPanel.tsx` + `MapSearchBox.tsx` | `main` (автосинк) |
| Claude Code (локально у Павла) | session work, CRM, Edge Functions Deno 2.0, design tokens, merge-conflict resolves | `pavel/wip-current-version-20260318` |

Два потока разошлись. Надо слить WIP → main, не потеряв ни одной стороны.

## Ограничение sandbox
Lovable не имеет прав на `git merge`/`push`/PR — это запрещено системно. Поэтому слияние делается **локально у Павла** или через GitHub UI. Я готовлю всё, что нужно, чтобы это заняло 5 минут.

## Что я сделаю в build mode

### 1. Манифест Lovable-правок
`docs/handoff/2026-06-18-lovable-on-main.md`:
- 8 файлов (миграция + 5 edge fn + 2 frontend), SHA-256 каждого,
- краткое назначение,
- маркер «эти файлы УЖЕ в main, при merge — keep theirs из main».

### 2. Runbook на 3 варианта (от простого к сложному)

**Вариант A — GitHub UI (рекомендую, без терминала):**
1. GitHub → репо → Pull requests → **New PR**
2. base: `main` ← compare: `pavel/wip-current-version-20260318`
3. Review → Merge pull request → Confirm merge
4. Удалить WIP-ветку кнопкой «Delete branch»
5. Lovable автоматически подтянет merged `main`

**Вариант B — Claude Code / терминал:**
```bash
git fetch origin
git checkout main
git pull origin main                     # подтянуть Lovable-фиксы
git merge pavel/wip-current-version-20260318 --no-ff \
  -m "merge: consolidate WIP into main 2026-06-18"
# при конфликте по 8 файлам из манифеста:
git checkout --ours <file> && git add <file>
git commit
git push origin main
git push origin --delete pavel/wip-current-version-20260318
```

**Вариант C — если конфликтов слишком много:**
Сначала смержить main → WIP локально, разрешить там, потом fast-forward WIP → main.

### 3. Скрипт верификации
`scripts/verify-main-sync.sh`:
- считает SHA-256 8 файлов после merge,
- сверяет с манифестом,
- зелёный лог = Lovable-фиксы выжили в `main`.

### 4. Post-merge проверка приложения
Чек-лист в том же документе:
- [ ] `npm run build` зелёный
- [ ] `/owner/financial-planning` открывает `AIAdvisorPanel` без ошибок
- [ ] `/map` — autoscroll `MapSearchBox` работает
- [ ] Edge fn `send-email` / `submit-web-form` отвечают 200 на smoke-тест
- [ ] Lovable preview (id-preview…lovable.app) показывает версию 3.55.3 и выше

### 5. Обновить `CLAUDE.md` и `security-memory`
- В CLAUDE.md §2 поменять «Текущая ветка: pavel/wip-…» → `main`.
- В security-memory зафиксировать миграцию 2026-06-18 как принятую.

## Рекомендую: Вариант A (GitHub UI)
Один клик, видна полная diff перед merge, конфликты решаются прямо в браузере, не нужно ставить git локально. Если PR покажет «no conflicts» — это done за 30 секунд.

## Чего я **не** делаю
- Не пушу в git (запрещено системой).
- Не создаю PR через API (нет токена в sandbox).
- Лишь готовлю манифест + runbook + verify-скрипт, которые Павел запускает у себя.

---

**Подтверди → переключаешь в build mode → я создаю manifest, runbook и verify-script. Дальше ты делаешь Вариант A в GitHub (1 минута).**
