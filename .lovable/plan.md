
## Цель

Опубликовать готовый контент «Что делать, если…» (9 категорий, 40 вопросов) внутри уже существующего раздела `/support`. Контент хранится сразу в трёх языках (RU / EN / TH) и переключается через уже существующий в проекте глобальный `LanguageContext` — отдельного локального переключателя не делаем, просто реагируем на текущий язык приложения.

## Структура

### 1. Данные (single source of truth)
Новый файл `src/data/whatIfFaq.ts`:

```ts
export type WhatIfLang = 'ru' | 'en' | 'th';

export interface WhatIfItem {
  id: string;                     // '1.1', '2.3' …
  q: Record<WhatIfLang, string>;
  a: Record<WhatIfLang, string>;  // \n для абзацев, '– ' в начале строки → <li>
}

export interface WhatIfCategory {
  id: string;                     // medical | beach | road | documents |
                                  // animals | weather | safety | housing | essentials
  icon: LucideIcon;               // Stethoscope, Waves, Car, FileText, PawPrint,
                                  // CloudRain, ShieldAlert, Home, Info
  title: Record<WhatIfLang, string>;
  items: WhatIfItem[];
}

export const WHAT_IF_FAQ: WhatIfCategory[] = [...];
```

Контент берётся **1-в-1 из брифа пользователя** (медицина 7, пляж 5, дорога 5, документы 4, животные 4, погода 3, безопасность 5, жильё 3, важное 4 = 40 вопросов). Только лёгкая нормализация переносов строк, без переписывания.

Тип `Record<WhatIfLang, string>` гарантирует, что **все три языка обязательны** для каждой строки — пропуск перевода = ошибка TypeScript.

### 2. Страница
Новый файл `src/pages/support/WhatIfFAQ.tsx`:

- Layout: `MiniAppLayout` (как у остальных support-страниц; не создаём новый shell).
- `const { language } = useLanguage()` — берём текущий язык глобально, без локального переключателя.
- H1 + интро из i18n-ключей.
- Sticky горизонтальный TabsBar с 9 категориями (scrollable на mobile, иконка + название).
- Внутри каждой категории — shadcn `<Accordion type="single" collapsible>`. Открыт по умолчанию первый вопрос текущей категории.
- Рендер ответа через локальный `<WhatIfAnswer text={item.a[language]} />`: split по `\n`, строки на `– ` → `<ul><li>`.
- Каждый `<AccordionItem>` имеет якорь `id="q-1-1"` для глубоких ссылок.
- SEO: `<SEOHead title=... description=... lang={language} />` (трёхъязычные варианты).

### 3. UI-лейблы оболочки
В `src/i18n/{ru,en,th}.ts` добавить **только** ключи оболочки (контент вопросов/ответов в i18n не дублируем — он живёт в data-файле):
- `whatif.title` — «Что делать, если…» / «What to do if…» / «ต้องทำอย่างไรหาก…»
- `whatif.subtitle`
- `whatif.emergency.cta` — «Экстренные номера» / «Emergency numbers» / «เบอร์ฉุกเฉิน»

### 4. Роутинг
`src/components/layout/pageRegistry.ts`:
```ts
WhatIfFAQ: lazy(() => import('@/pages/support/WhatIfFAQ')),
```
Route в существующем support-блоке: `/support/what-if` + alias `/faq` → редирект на `/support/what-if`.

### 5. Точки входа
- На `/support` — карточка «Что делать, если…» в верхнем блоке.
- В `/sos` — ссылка «Подробные инструкции» → `/support/what-if#medical`.
- В футере раздела помощи — пункт FAQ.

### 6. Аналитика
Существующий `trackEvent` (`src/lib/analytics/track.ts`):
- `faq_category_open` { category, language }
- `faq_question_open` { id, category, language }
- `faq_emergency_click` { number: '1669' | '191' | '1155' | '199' }

## Техническая дисциплина

- Семантические токены, без хардкода цветов (icon = `text-primary`, акценты = `text-accent`).
- Touch target ≥44px на `pointer:coarse`.
- Без новых top-level routes; без новых shell-ов (CLAUDE.md §1.5 hard rules #1–#2).
- Никаких новых таблиц / Edge Functions — это статичный контент.

## Объём работы

| Файл | Действие | ~строк |
|---|---|---|
| `src/data/whatIfFaq.ts` | создать (контент 40×3) | ~1100 |
| `src/pages/support/WhatIfFAQ.tsx` | создать | ~180 |
| `src/components/layout/pageRegistry.ts` | +1 import | +1 |
| support routes | +1 route + redirect `/faq` | +2 |
| `src/i18n/{ru,en,th}.ts` | +3 ключа × 3 языка | +9 |
| `src/pages/Support.tsx` | +карточка-ссылка | +10 |

## Что **не** делаем

- Не добавляем локальный переключатель языка на странице — используем глобальный `LanguageContext`.
- Не выносим FAQ в Supabase (можно позже, если потребуется редактировать без деплоя).
- Без поиска / PDF-экспорта в MVP.

Готов имплементировать по этому плану.
