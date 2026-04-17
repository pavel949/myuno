
## Проблема

Превью не работает — спиннер крутится. Из session_replay вижу реальную причину:

```
Failed to load application: Failed to fetch dynamically imported module: 
.../src/App.tsx
```

Из build-errors вижу 30+ TypeScript ошибок, которые ломают сборку Vite. Главные:

### Корень проблемы
В прошлом сообщении я (или система) **отредактировал `src/integrations/supabase/types.ts`** — а это auto-generated файл, который НЕЛЬЗЯ трогать (есть явное правило в CLAUDE.md и в инструкциях). Скорее всего этот файл оказался повреждён/обрезан, из-за чего:

1. `investment_opportunities` и `intro_requests` пропали из типов → TS2769 "not assignable to parameter"
2. `nb_leads` table тоже пропала → TS2769 в NbLeadForm
3. `development_units` ломается аналогично
4. Глубокая рекурсия типов (TS2589) в `useDeveloperPortal.ts` и `useInvestmentHub.ts`
5. `DeveloperProfile` потерял индексную сигнатуру

Vite не может собрать `App.tsx` → preview зависает на спиннере.

### План исправления

**Шаг 1. Восстановить `src/integrations/supabase/types.ts`**
- Не редактировать вручную. Запустить регенерацию из реальной схемы БД через внутренний механизм (types.ts регенерируется автоматически при следующей миграции/обращении к схеме). Если не подхватится — выполнить пустую миграцию-touch чтобы триггернуть regen.

**Шаг 2. Обойти отсутствующие в types таблицы через `as any` каст** (там, где они уже так делаются по паттерну проекта):
- `useInvestmentHub.ts` — обернуть `.from('investment_opportunities' as any)` и `.from('intro_requests' as any)`, типизировать результат вручную (как уже делается в `useNewbuildLeads.ts`)
- Привести к единому паттерну с `useDevelopmentUnits.ts`

**Шаг 3. `useDeveloperPortal.ts`** (строки 146, 234, 238)
- Передаётся объект вместо массива в `.insert()` — нужен массив или одиночный объект (проверить сигнатуру)
- TS2589 (excessive depth) — добавить явный generic или `as any` каст для разрыва inference loop

**Шаг 4. `DeveloperPortalLayout.tsx:31`** 
- Заменить `as Record<string, unknown>` на `as unknown as Record<string, unknown>` (двухступенчатый каст)

**Шаг 5. `NbLeadForm.tsx:49`**
- Тот же паттерн — `.insert()` ожидает массив, передаётся объект; обернуть в массив или каст `as any`

**Шаг 6. Verify**
- После правок дождаться пересборки Vite, убедиться что `dev-server.log` чистый, спиннер уходит, рендерится `/index`

### Файлы к изменению

| Файл | Изменение |
|---|---|
| `src/integrations/supabase/types.ts` | Триггернуть регенерацию (НЕ ручная правка) |
| `src/hooks/investment-hub/useInvestmentHub.ts` | `as any` касты + ручная типизация результата |
| `src/hooks/useDeveloperPortal.ts` | Исправить insert + разорвать deep inference |
| `src/components/newbuilds/DeveloperPortalLayout.tsx` | Двухступенчатый каст |
| `src/components/newbuilds/NbLeadForm.tsx` | Insert как массив |

### Что НЕ делаю
- Не трогаю `types.ts` вручную (запрещено правилом)
- Не меняю `client.ts`
- Не меняю прокси edge function `external-data-api` — он работает
- Не трогаю несвязанный с ошибками код
