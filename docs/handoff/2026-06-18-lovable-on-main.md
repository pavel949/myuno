# Lovable → main sync (2026-06-18)

Цель: свести все правки из Lovable и Claude Code в единый `main`, чтобы приложение
жило одной актуальной версией.

## 1. Что лежит в `main` от Lovable (и не должно потеряться)

| Файл | SHA-256 | Назначение |
|---|---|---|
| `supabase/migrations/20260617074038_27a6700f-c7e6-4ae5-bbc2-072a3cecea93.sql` | `b4e3e86a36e2a64917694f82dd7a79b6870d43d3eb935939d01ed941d60a2e56` | Security migration (RLS / grants fix по результатам сканов) |
| `supabase/functions/ai-financial-advisor/index.ts` | `8e692481ac3565c01a216dd9374d0a12309089fe4c96afda229ae0610488c906` | JWT-валидация + Zod input validation |
| `supabase/functions/send-email/index.ts` | `77bc56c0a60286d73ca26a7125bccfbf5d4bb1fe7f56887c7735caa51cf602fb` | Auth + rate-limit + sanitization |
| `supabase/functions/submit-web-form/index.ts` | `7abb27835777602033bdb99c554fefb7c94fcd7275a60f00347905d7d13f2eba` | Zod-схема + CORS allow-list |
| `supabase/functions/magnet-submit/index.ts` | `9625a3a7c6007f1af59fe846af60359ddc986ea9ffb5799ddf44c13dd9b54897` | Honeypot + email validation |
| `supabase/functions/whatsapp-incoming-webhook/index.ts` | `70cfdaa1002788ab8a357f544136a036bb7e8d355bb4434b6c19721fe8859705` | UltraMSG signature verification |
| `src/components/owner/financial-planning/AIAdvisorPanel.tsx` | `0cf74287e5506ba74df436914f0b8898a94bad45660a99dd22f3ae245f8e1904` | Frontend AI advisor (привязан к security-фиксу edge fn) |
| `src/components/map/MapSearchBox.tsx` | `6d7d8f8ec473cbe7cbf539222f53db5809ade13fc6b060d5484acf31b632c24d` | UX: smooth autoscroll + sticky offset |

**Правило слияния:** при конфликтах по этим 8 файлам — принять версию из `main`
(`git checkout --ours <file>` если ты на main и мержишь WIP, или `--theirs` наоборот).

## 2. Runbook

### Вариант A — GitHub UI (рекомендую)

1. Открой репо на GitHub → вкладка **Pull requests** → **New pull request**.
2. `base: main` ← `compare: pavel/wip-current-version-20260318`.
3. Просмотри diff, убедись что 8 файлов выше — без изменений (или конфликты резолвятся в пользу main).
4. **Create pull request** → **Merge pull request** → **Confirm merge**.
5. Кнопка **Delete branch** под мержом — закрывает WIP-ветку.
6. Lovable автоматически подтянет обновлённый `main` (двусторонний синк).

### Вариант B — терминал / Claude Code

```bash
git fetch origin
git checkout main
git pull origin main

git merge pavel/wip-current-version-20260318 --no-ff \
  -m "merge: consolidate WIP into main (Lovable + Claude Code) 2026-06-18"

# при конфликте по любому из 8 файлов выше:
git checkout --ours supabase/functions/send-email/index.ts
git add supabase/functions/send-email/index.ts
# ...и так для каждого конфликтующего файла из манифеста
git commit

git push origin main
git push origin --delete pavel/wip-current-version-20260318
```

### Вариант C — конфликтов много

Сначала влить main → WIP локально (разрешить там), потом fast-forward WIP в main:

```bash
git checkout pavel/wip-current-version-20260318
git merge origin/main   # разрешаешь конфликты в пользу main для 8 файлов
git push origin pavel/wip-current-version-20260318
# теперь WIP содержит и Lovable, и Claude Code
git checkout main
git merge --ff-only pavel/wip-current-version-20260318
git push origin main
git push origin --delete pavel/wip-current-version-20260318
```

## 3. Верификация после merge

```bash
bash scripts/verify-main-sync.sh
```

Скрипт пересчитает SHA-256 8 файлов и сверит с манифестом выше. Все строки `OK` = Lovable-фиксы выжили.

## 4. Чек-лист приложения

- [ ] `npm run build` — зелёный
- [ ] `/owner/financial-planning` — `AIAdvisorPanel` грузится без ошибок
- [ ] `/map` — autoscroll `MapSearchBox` работает на мобиле
- [ ] Edge fn `send-email`, `submit-web-form`, `magnet-submit` — 200 на smoke-тест
- [ ] Превью `id-preview--…lovable.app` показывает версию ≥ 3.55.3
- [ ] В Supabase → Migrations виден `20260617074038_…` как applied

## 5. После успеха

- Обновить `CLAUDE.md` §2: «Ветка: main» вместо `pavel/wip-current-version-20260318`.
- Дальше работать только в `main` (через Lovable и Claude Code параллельно — двусторонний синк).
