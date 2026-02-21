
# Исчерпывающий аудит системы myUNO SuperApp

## Найденные баги и проблемы

---

### 1. КРИТИЧЕСКИЙ: Рассинхронизация ключа localStorage для языка

**Файлы с багом:**
- `src/lib/errorHandler.ts` (строка 79) -- читает `uno-language`
- `src/hooks/useStaffProfile.ts` (строка 12) -- читает `uno-language`
- `src/hooks/useQuickListing.ts` (строка 12) -- читает `uno-language`
- `src/lib/constants.ts` (строка 5) -- определяет `LANGUAGE: 'uno-language'`

**Но реальный ключ, используемый в LanguageContext и ErrorBoundary:**
- `src/contexts/LanguageContext.tsx` (строка 1330) -- пишет/читает `myuno-language`
- `src/components/ErrorBoundary.tsx` (строка 36) -- читает `myuno-language`

**Результат:** `errorHandler`, `useStaffProfile` и `useQuickListing` всегда возвращают `'en'` (дефолт), потому что `uno-language` никогда не записывается. Пользователь может быть на русском, но тосты ошибок и профиль стаффа будут на английском.

**Исправление:** Заменить все `uno-language` на `myuno-language` в errorHandler.ts, useStaffProfile.ts, useQuickListing.ts, и constants.ts.

---

### 2. СРЕДНИЙ: Дублированный роут `/admin/analytics`

**Файл:** `src/components/layout/AnimatedRoutes.tsx`
- Строка 396: `<Route path="/admin/analytics" element={<Navigate to="/admin/control" replace />} />`
- Строка 446: `<Route path="/admin/analytics" element={<Navigate to="/admin/control" replace />} />`

Оба делают одно и то же, но дубликат -- это мертвый код. React Router используя первое совпадение, второе никогда не сработает.

**Исправление:** Удалить строку 446.

---

### 3. СРЕДНИЙ: PREFETCH_ROUTES содержит устаревший путь

**Файл:** `src/lib/queryConfig.ts`, строки 178-184

```
export const PREFETCH_ROUTES = [
  '/properties',   // <-- НЕ СУЩЕСТВУЕТ, канонический путь /property
  '/restaurants',
  '/tours',        // <-- НЕ СУЩЕСТВУЕТ, канонический путь /experiences
  '/beauty',
  '/flowers',
]
```

`/properties` редиректит на `/property`, `/tours` редиректит на `/experiences?type=tour`. Префетч не загрузит данные по этим путям, так как маршрут не совпадает.

**Исправление:** Обновить на `/property`, `/experiences`.

---

### 4. НИЗКИЙ: CartContext.addItem -- race condition между UI и DB

**Файл:** `src/contexts/CartContext.tsx`, строки 192-233

Функция `addItem` выполняет запись в базу (`await supabase...insert/update`) и параллельно обновляет state через `setItems()`. Но `addItem` не объявлена как `async` в интерфейсе (`addItem: (item) => void`), поэтому вызывающий код не ждет промис. При сбое сети state обновится, а база -- нет. Следующая загрузка покажет расхождение.

**Исправление:** Использовать оптимистичный паттерн с откатом при ошибке, либо сначала подтвердить DB-операцию.

---

### 5. НИЗКИЙ: ErrorBoundary не восстанавливается после chunk-ошибок

**Файл:** `src/components/ErrorBoundary.tsx`

Кнопка "Try again" (`handleReset`) просто сбрасывает `hasError: false`, но модуль по-прежнему не загружен. React попытается заново рендерить тот же `lazy()` компонент, который снова вызовет ту же ошибку. Кнопка "Reload page" работает, но "Try again" бесполезна для chunk-ошибок.

**Исправление:** Для chunk-ошибок скрыть кнопку "Try again" и оставить только "Reload page".

---

### 6. INFO: Отсутствие глобального retry для lazy imports

Динамические импорты (`lazy(() => import(...))`) не имеют retry-логики. При временном сбое сети (например, на мобильном) модуль не загрузится и пользователь увидит ошибку. Это основная причина массовых `Failed to fetch dynamically imported module` ошибок в консоли.

**Исправление:** Обернуть lazy-импорты в retry-хелпер:

```typescript
function lazyWithRetry(importFn, retries = 3) {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attempt = (remaining) => {
        importFn().then(resolve).catch((err) => {
          if (remaining <= 0) return reject(err);
          setTimeout(() => attempt(remaining - 1), 1000);
        });
      };
      attempt(retries);
    });
  });
}
```

---

### 7. INFO: index.html `user-scalable=no` -- проблема доступности

**Файл:** `index.html`, строка 5

```html
<meta name="viewport" content="..., user-scalable=no" />
```

Это блокирует пинч-зум на мобильных устройствах, что является нарушением WCAG 2.1 (Success Criterion 1.4.4). Многие пользователи с ослабленным зрением полагаются на масштабирование.

**Исправление:** Удалить `user-scalable=no` и `maximum-scale=1.0`.

---

## Что работает без багов

| Блок | Статус | Примечание |
|---|---|---|
| Auth (AuthContext) | OK | Корректный isMounted guard, getSession + onAuthStateChange |
| RBAC (RoleGuard, useUserContext) | OK | Airbnb-style мягкая навигация, 3 параллельных запроса с memoized |
| Service Worker | OK | NetworkOnly для навигации, агрессивная очистка кешей |
| Version check (index.html) | OK | Двойная проверка (localStorage + meta tag), guard от loops |
| Cart dual storage | OK | localStorage для гостей, DB для auth-пользователей, merge при логине |
| Query caching (queryConfig) | OK | 6 профилей кэширования, factory-паттерн для ключей |
| Error handling | OK | Централизованный handler с bilingual support |
| Route registry (pageRegistry) | OK | 150+ страниц, все файлы существуют |
| Route tree (AnimatedRoutes) | OK | Корректные guard-обертки, legacy redirects, catch-all 404 |
| SSRF guard (edge functions) | OK | Строгий allowlist, блокировка IP |
| Stripe checkout | OK | Unified hook, auth-проверка, error handling |
| DB security (RLS) | OK | Linter: 0 issues |

---

## План исправлений (в порядке приоритета)

1. **Исправить localStorage-ключ языка** -- заменить `uno-language` на `myuno-language` в 3 файлах + constants.ts (5 мин)
2. **Добавить retry для lazy imports** -- создать хелпер `lazyWithRetry`, обновить pageRegistry.ts (15 мин)
3. **Убрать бесполезную кнопку "Try again"** для chunk-ошибок в ErrorBoundary (2 мин)
4. **Исправить PREFETCH_ROUTES** -- `/properties` -> `/property`, `/tours` -> `/experiences` (1 мин)
5. **Удалить дубликат роута** `/admin/analytics` (1 мин)
6. **Убрать `user-scalable=no`** из viewport meta (1 мин)
7. **Улучшить CartContext addItem** -- добавить rollback при ошибке DB (10 мин)
