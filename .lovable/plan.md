

# Архитектурный аудит: ошибки, задвоения и нестыковки

## Критические проблемы

### 1. Дублирование admin-проверки (useIsAdmin vs useAdminCheck)

Два хука делают одно и то же — вызывают `supabase.rpc('has_role', { _user_id, _role: 'admin' })`:

| Хук | Файл | Используется |
|-----|------|-------------|
| `useIsAdmin()` | `src/hooks/useIsAdmin.ts` | 3 файла (useSupabaseCRUD, useCanonicalSubmit, AuthContext) |
| `useAdminCheck()` | `src/hooks/useAdmin.ts` | **22+ файла** (все Admin-страницы, useAdminContentCreation) |

**Проблема:** Два независимых кэша, два параллельных RPC-вызова для одного пользователя. `useIsAdmin` имеет `Map`-кэш, `useAdminCheck` — без кэша (каждый mount = новый запрос).

**Решение:** Объединить в один хук `useIsAdmin` с кэшем. Сделать `useAdminCheck` реэкспортом.

---

### 2. Мёртвый код: errorUtils.ts

`src/lib/errorUtils.ts` экспортирует `getErrorMessage()` — **ни один файл его не импортирует**. Вся обработка ошибок идёт через `src/lib/errorHandler.ts` (`createErrorHandler`, `errorHandler`, `handleError`). Файл `errorUtils.ts` — мёртвый код.

**Решение:** Удалить `errorUtils.ts` или перенести `getErrorMessage` в `errorHandler.ts` и использовать его внутри `formatError`.

---

### 3. Таксономии: hub заявлен как SoT, но статические файлы остаются основным источником

`src/lib/taxonomies/index.ts` реэкспортирует всё из:
- `src/lib/propertyTaxonomy.ts` (80+ экспортов)
- `src/lib/config/transportTaxonomy.ts`
- `src/lib/config/homeServicesTaxonomy.ts`

Прямые импорты из этих файлов **отсутствуют** (хорошо!), но сам hub делает `export *` из статических файлов, создавая огромную поверхность API. Реальное использование DB-fallback (`useTaxonomyWithFallback`) vs статических констант — неизвестно, но архитектура подразумевает постепенную миграцию, которая, судя по объёму статических экспортов, не продвинулась.

---

### 4. Два файла утилит: `src/lib/utils.ts` vs `src/utils/`

- `src/lib/utils.ts` — `cn()` + `transliterate()` → **708 файлов** импортируют
- `src/utils/` — 4 специализированных файла (exportFinancialsExcel, generateReportPdf, etc.)

**Нестыковка:** Утилитные функции размазаны между `lib/utils.ts`, `lib/errorHandler.ts`, `lib/sanitize.ts`, `lib/sanitizePayload.ts`, `lib/sanitizeSearch.ts`, `lib/scrollUtils.ts`, `lib/filterUtils.ts` и папкой `utils/`. Нет единого стандарта размещения.

---

### 5. useAdmin.ts — архаичный паттерн (useState + useEffect вместо React Query)

`useAdminProviders()`, `useAdminServices()`, `useAdminCategories()` в `src/hooks/useAdmin.ts` используют ручное управление состоянием (`useState` + `useEffect` + `fetchX`) вместо `useQuery` из React Query, который используется во всех других хуках проекта. Это приводит к:
- Отсутствию автоматического кэширования
- Дублированию логики повторных запросов
- Ручному `isMounted` антипаттерну
- Использованию `Record<string, any>` вместо типизированных интерфейсов

---

### 6. Дублирование конфигурационных экспортов

`src/lib/config/index.ts` реэкспортирует `homeServicesTaxonomy`, а `src/lib/taxonomies/index.ts` тоже реэкспортирует его. Два пути к одним данным:
- `import { ... } from '@/lib/config'`
- `import { ... } from '@/lib/taxonomies'`

Хотя прямых импортов из первого пути не найдено, сам факт двойного реэкспорта — архитектурная нестыковка.

---

### 7. Огромное количество хуков без группировки (280+ файлов)

`src/hooks/` содержит **280+ файлов** в плоской структуре. Группы:
- 30+ `useAdmin*` хуков
- 20+ `useVendor*` хуков  
- 15+ `useProperty*` хуков
- 15+ `useCrm*` хуков

**Проблема:** Нет поддиректорий. Навигация и поиск затруднены.

---

## Средние проблемы

### 8. `as any` в useAdmin.ts
Прямые `.insert({...} as any)` в `useAdminProviders` и `useAdminServices` обходят типизацию. Вместо `as any` нужно использовать типы из `supabase/types.ts`.

### 9. src/config/ vs src/lib/config/
Существует пустая или минимальная `src/config/` наряду с `src/lib/config/`. Двусмысленность.

### 10. Inconsistent toast imports
Проект использует ДВЕ системы тостов:
- `import { useToast } from '@/hooks/use-toast'` (shadcn)
- `import { toast } from 'sonner'`

Обе активны одновременно (`<Toaster />` и `<Sonner />` в App.tsx).

---

## Рекомендуемый план действий

| # | Действие | Приоритет | Effort |
|---|----------|-----------|--------|
| 1 | Объединить `useIsAdmin` и `useAdminCheck` в один хук с кэшем | Высокий | 1ч |
| 2 | Удалить мёртвый `errorUtils.ts` | Низкий | 5мин |
| 3 | Рефакторить `useAdmin.ts` на React Query | Средний | 2ч |
| 4 | Убрать `as any` из admin-хуков, добавить типы | Средний | 1ч |
| 5 | Устранить двойной реэкспорт config/taxonomy | Низкий | 30мин |
| 6 | Группировать hooks по поддиректориям | Низкий | 3ч (рефактор импортов) |
| 7 | Выбрать одну toast-систему | Средний | 2ч |

Хотите, чтобы я приступил к реализации по приоритету?

