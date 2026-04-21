

# Полировка главной страницы myUNO — этап C+

Применяем 3 точечных улучшения по результатам аудита GOV.UK / Госуслуги. Цель — убрать «провисания» на мобильном и десктопе, не ломая DS 2.1 и существующую архитектуру.

## Что меняем

### 1. Десктопный hero — двухколоночная сетка
**Файл:** `src/components/home/HeroIntro.tsx`

Сейчас на `lg:` (≥1024px) hero занимает узкую центральную колонку, справа и слева — пустота. По образцу GOV.UK Start pages:

- На `lg:` разбиваем секцию на 2 колонки (`lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-10`)
- Слева — заголовок + подзаголовок + поиск (как сейчас)
- Справа — компактный preview-блок «Популярное сегодня» (top-3 задачи из `PopularTasks` источника), визуально как карточка с border + лёгкий surface
- На мобильном (`<lg`) — всё как сейчас, без изменений

Чтобы не дублировать запрос к `analytics_events`, выносим хук `usePopularTasks()` из `PopularTasks.tsx` в отдельный файл `src/hooks/home/usePopularTasks.ts`. Оба компонента (мобильный список и десктопный preview) используют один React Query кэш по `['popular-tasks-7d']`.

### 2. Подпись под логотипом в `HomeTopBar` — institutional trust
**Файл:** `src/components/home/HomeTopBar.tsx` (правка существующего)

Под надписью «myUNO» добавляем тонкую подпись:
- RU: «Инфраструктура для жизни на Пхукете»
- EN: «Infrastructure for life on Phuket»

Стиль: `text-[10px] text-muted-foreground/60 tracking-wide`, скрывается на очень узких экранах если конфликтует с правой группой кнопок (`hidden xs:block`). Это даёт «государственный» оттенок доверия без визуального шума.

### 3. Упрощение порядка секций на главной для возвращающихся юзеров
**Файл:** `src/pages/Index.tsx`

Сейчас порядок: TopBar → Hero → RealEstateEntry → TrustAsAService → PrimaryActions/PopularTasks → ActiveSituation → AllSections → TrustFooter. Это **8 секций до того, как юзер видит свою задачу**.

Меняем порядок на task-first:
1. TopBar
2. WorkspaceHomeBanner (если активен)
3. HeroIntro (с десктоп-preview справа)
4. **PopularTasks / PrimaryActions** ← поднимаем выше
5. ActiveSituation
6. RealEstateEntry (за флагом, без изменений)
7. TrustAsAService (за флагом, без изменений)
8. AllSectionsAccordion
9. TrustFooter

Логика: «что мне нужно сделать» → «что у меня сейчас в работе» → «истории успеха / доверие» → «всё остальное».

## Технические заметки

- Никаких изменений БД, новых роутов, новых shells
- Все цвета — через существующие токены (`--card`, `--border`, `--muted-foreground`)
- `usePopularTasks` остаётся private к домену home (`src/hooks/home/`), не выносим в платформу
- `PopularTasks.tsx` рефакторится под использование общего хука — поведение и аналитика (`task_open` event) сохраняются 1:1
- Десктопный preview справа от hero рендерится только при `lg:` через CSS, без JS-ветвления — без флешей контента
- A11y: `aria-labelledby` на двух блоках с разными id, чтобы не конфликтовать
- Skip-link и cookie-bar (изначально предложенные) — **не делаем в этой итерации**, чтобы не раздувать diff. Skip-link уже есть в `src/components/a11y/SkipToContent.tsx`, нужно отдельно проверить, подключён ли он в `AppLayout` — это сделаем следующей задачей

## Что НЕ входит

- Cookie-banner редизайн (отдельная задача — нужно посмотреть текущий компонент)
- Skip-to-content интеграция в AppLayout (отдельная задача после аудита)
- Редизайн `TrustFooter` под GOV.UK footer (отдельный заход — этап C original)
- Изменения в `PrimaryActions` / `RealEstateEntry` / `TrustAsAService`

