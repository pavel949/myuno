# План: закрыть все P0, P1, P2 из Lighthouse-аудита

Состояние: P0 #1 (button-name, 4 кнопки) уже починен в прошлом ходе. Ниже — оставшиеся 11 пунктов.

---

## P0 — A11y / Best Practices (валят баллы)

### 1. `color-contrast` — затемнить `--muted-foreground` в light-теме
- **Файл:** `src/styles/tokens.css`, строка 104
- **Сейчас:** `--muted-foreground: 24 5% 46%` → на cream `#F7F5F1` даёт contrast ≈ 4.2:1 (fail WCAG AA, нужно ≥ 4.5).
- **Будет:** `--muted-foreground: 24 8% 38%` → contrast ≈ 5.6:1 (pass AA, всё ещё «серый», визуально почти неотличим).
- Dark-тему (строка 435) не трогаем — там 75% lightness на тёмном фоне, уже проходит.
- Фиксит **6 нарушений** на главной + везде, где используется `text-muted-foreground`.

### 2. `label-content-name-mismatch` — 6 persona-карточек на welcome
- **Файл:** `src/components/landings/WelcomePersonaRouter.tsx` (строка 119)
- **Проблема:** `aria-label="Сценарий жизни на месте: …"` не содержит видимый `<h3>` «Я обустраиваю жизнь» → axe fail + ломает голосовое управление («tap Обустраиваю жизнь» не работает).
- **Решение:** убрать `aria-label` совсем — accessible name возьмётся из `<h3>` + `<p>` (visible text). Кнопка станет «Я обустраиваю жизнь. Дом, услуги, медицина, еда, развлечения, поиск людей. Открыть. Нажми, чтобы продолжить» — длинно, но корректно и без mismatch.
- Альтернатива: переписать строки `welcome.persona.*.aria` в `src/i18n/{ru,en,th}.ts`, чтобы начинались с `title`. Дольше (18 строк, 3 языка), но даёт более лаконичный SR-вывод. **Рекомендую: убрать aria-label** — проще, фиксит сразу, ничего не ломает.

### 3. `errors-in-console` — CSP `frame-ancestors` через `<meta>`
- **Файл:** `index.html` строка 14
- **Проблема:** браузер игнорирует `frame-ancestors` в meta-CSP и пишет warning. Защита от clickjacking всё равно не работает.
- **Решение:** удалить `frame-ancestors 'none';` из meta-CSP. Защита от iframe-эмбеддинга — задача HTTP-заголовка `X-Frame-Options` или серверного CSP. Lovable infra уже отдаёт `referrer-policy: strict-origin-when-cross-origin`; для CSP-заголовка нужен hosting-конфиг (вне нашей зоны). Документируем риск в комменте.

### 4. `valid-source-maps` — добавить sourcemaps в prod-build
- **Файл:** `vite.config.ts`
- **Решение:** в `build` блок добавить `sourcemap: 'hidden'` — генерирует `.map` файлы, но не линкует через `//# sourceMappingURL`. Sentry/Lovable error-reporter ими пользуется, публично они недоступны.

---

## P1 — Performance (FCP, bundle size)

### 5. Lazy-load тяжёлых вендоров на главной
Из Lighthouse `unused-javascript`:

| Bundle | Размер | Unused | Где грузится | Действие |
|---|---|---|---|---|
| `MapView-*.js` | 297 KB | 251 KB (84%) | главная eagerly | проверить `src/components/map/MapView.tsx` — обернуть в `React.lazy()` на всех роутах, где карта не критична для LCP |
| `vendor-pdf-*.js` | 138 KB | 120 KB (87%) | главная eagerly | найти `import` pdf-lib/jspdf — заменить на `dynamic import` внутри обработчика «Скачать PDF» |
| `vendor-charts-*.js` | 119 KB | 93 KB | главная eagerly | `recharts` — lazy-load компонентов dashboard, на главной не нужен |
| `index-D0rbh7uZ.js` | 213 KB main | 113 KB (53%) | вход | после lazy выше — должен сам уменьшиться; иначе routes split |

### 6. `unminified-javascript` — `vendor-icons` 130 KB не минифицирован
- **Файл:** `vite.config.ts`
- В конфиге уже есть стратегия для lucide. Нужно проверить, что `build.minify` (по умолчанию `esbuild`) применяется ко всем chunks, и `vendor-icons` не выпадает через `manualChunks` с `format: 'es'` без минификации. Скорее всего достаточно убедиться, что нет `minify: false` для этого chunk-а или сменить `build.minify: 'terser'` если esbuild не справляется с tree-shake барреля lucide-react.

### 7. `redirects` — 590 ms на старте
- **Источник:** заходы на apex `myuno.app` → 301 → `www.myuno.app`.
- **Внутри кода:** все `og:url`, `canonical`, sitemap уже указывают `www.` — это правильно. Внешние ссылки (соцсети, partners) пользователь не контролирует через код.
- **Действие:** аудит `src/lib/config/routes.ts` и i18n на наличие хардкода `https://myuno.app` (без `www`). Заменить на `www.myuno.app`. Reduces 590 ms на cold-load из внешних линков.

---

## P2 — Nice to have

### 8. `mainthread-work-breakdown` (808+715+421 мс)
- Прямое следствие П1 #5–6. После lazy-load и минификации main-thread время упадёт автоматически. Отдельной работы не требует — измеряем после P1.

### 9. `agent-accessibility-tree` (категория Agentic Browsing, 67/100)
- **Файлы:** layout-обёртки (`src/App.tsx`, `src/components/layout/*`)
- **Решение:** проверить, что на каждой странице есть ровно один `<main>` landmark, есть `<nav>` для глобальной навигации, `<header>` для шапки. Скорее всего нужны минорные правки 2–3 layout-файлов. Бонус: помогает AI-агентам (ChatGPT Operator, Claude Computer Use) понимать UI.

---

## Технические детали (внутрянка)

### Файлы, которые точно изменятся

| Файл | P# | Изменение |
|---|---|---|
| `src/styles/tokens.css` | P0 #1 | 1 строка: `--muted-foreground` 46% → 38% |
| `src/components/landings/WelcomePersonaRouter.tsx` | P0 #2 | удалить `aria-label={aria}` (1 строка) + удалить поле `aria` из массива (6 мест) |
| `index.html` | P0 #3 | удалить `frame-ancestors 'none';` из meta-CSP |
| `vite.config.ts` | P0 #4 + P1 #6 | добавить `build.sourcemap: 'hidden'`; проверить minify |
| `src/components/map/MapView.tsx` (или роутеры использующие его) | P1 #5 | обернуть в `React.lazy` |
| Файлы с `import { jsPDF }` / `pdf-lib` | P1 #5 | dynamic import |
| Файлы dashboard'ов с recharts | P1 #5 | lazy-load chart components |
| `src/lib/config/routes.ts`, `src/i18n/*` | P1 #7 | поиск `https://myuno.app` без `www` → заменить |
| `src/App.tsx` + layout | P2 #9 | semantic landmarks (1× `<main>`, `<nav>`, `<header>`) |

### Что НЕ трогаем
- `cache-insight: /~flock.js` — Lovable analytics infrastructure, кешем управляет Lovable.
- Dark-mode `--muted-foreground` — проходит контраст.
- `_l5e/events.js` unminified — Lovable infra.
- PWA installability — уже зелёный, проверено в DevTools вручную.

### Порядок исполнения (минимизирует риск регрессий)
1. **P0 #1, #2, #3, #4** — мелкие правки в 4 файлах, A11y 89 → ~98, Best Practices 96 → 100. ~10 минут.
2. **P1 #7** — поиск/замена `myuno.app` → `www.myuno.app`. ~5 мин.
3. **P1 #5** (lazy load) — самый большой эффект на Performance 96 → ~99. ~20 мин, требует осторожности (тесты).
4. **P1 #6** (minify vendor-icons) — диагностика + конфиг, ~10 мин.
5. **P2 #9** (landmarks) — последним. ~10 мин.

### Что проверяем после
- `npx lighthouse https://www.myuno.app/ --form-factor=mobile` — все категории должны быть ≥ 95.
- `bun run build` — артефакты собираются без warnings.
- preview визуально не должен измениться (текст `--muted-foreground` чуть темнее, но в пределах DS 2.1).

### Что НЕ войдёт в этот план
- Реальный iOS Safari Lighthouse — недоступен из sandbox.
- Полная переработка bundle splitting — отдельная задача, требует профилирования каждого route.
- Замена Lovable-infra скриптов (`~flock.js`, `__l5e/events.js`) — не в нашей власти.
