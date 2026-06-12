## Что сейчас не так (диагноз по скрину и коду)

На consumer-страницах `AppLayout` одновременно рендерит **2 разных FAB-а**, плюс bottom-nav, плюс PWA install-pill — отсюда «навал» в правом нижнем углу:

| Что | Файл | Поведение |
|---|---|---|
| Зелёный WhatsApp-кружок | `FloatingWhatsAppContact` (рендерится глобально) | Один клик → сразу wa.me |
| Тёмная pill «Установить» | `FloatingInstallButton` (рендерится глобально) | PWA install |
| Тёмный FAB-чат «message + зелёная точка» | `UnifiedChatFAB` — **готовый AI-ассистент + WhatsApp + Telegram в одном drawer**, но **подключён только на `/mc/help`** | Должен быть основным |
| Кнопка «Help» (Concierge) | `FloatingConcierge` — третий вариант, вообще никуда не вмонтирован | Мёртвый код |
| «Часов» на скрине нет — это PWA-pill наезжает на bottom-nav | — | UX-конфликт |

В контактах (`src/lib/config/contacts.ts`) есть WhatsApp, Telegram, e-mail — **Line отсутствует**, надо добавить (для тайской аудитории канал №1). Социальные ссылки на Telegram/WhatsApp дублируются в `CompactFooter`, в landings и в десятках кнопок «связаться» — единого контракта нет.

## Целевая логика (рекомендую — единственный осмысленный вариант)

**Один FAB в правом нижнем углу — `UnifiedChatFAB`** с AI-консьержем по умолчанию и человеческими каналами как fallback. Всё остальное переезжает в его drawer или в шапку.

```text
┌──────────────────────────────┐
│   страница                   │
│                              │
│                     ┌─────┐  │  ← единственный FAB:
│                     │ ✨  │  │    тёмный круг с искрой,
│                     └─────┘  │    зелёная точка = «онлайн»
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ │
│ 🏠   🧭   ⊕   🛎   👤        │  ← bottom-nav
└──────────────────────────────┘

Tap → bottom-sheet:
┌──────────────────────────────┐
│  Чем помочь?                 │
│ ┌──────────────────────────┐ │
│ │ ✨ UNO AI — спросите что │ │  ← primary, expand inline
│ │   угодно. 24/7.          │ │
│ └──────────────────────────┘ │
│  Поговорить с человеком:     │
│  [WhatsApp] [Telegram] [Line]│  ← вторичный ряд
│  ────                        │
│  ☎  +66 92 240 7355          │
│  ✉  support@uno.ae · 9-21 ICT│
│  📲  Установить приложение    │  ← сюда же уезжает PWA
└──────────────────────────────┘
```

Принципы:
1. **AI — первичный канал**, человеческие — вторичный. AI отвечает мгновенно и снимает 80% обращений; WhatsApp/Telegram/Line — для «надо живого».
2. **Один якорь на экране** (FAB справа над bottom-nav) — никаких параллельных кружков.
3. **PWA install уезжает в тот же sheet** — это редкое одноразовое действие, ему не нужен постоянный FAB.
4. **Контекст-aware приветствие**: на `/property/:id` AI открывается с заготовкой «Расскажи про этот объект», на `/flowers/order` — «Помоги с букетом», и т.д. (передаём `pathname` + краткий `pageContext` в системный промпт `ai-support-chat`).
5. **На operational-маршрутах** (`/mc/*`, `/admin/*`, `/operate/*`, `/auth`) FAB прячется — там свой UX.

## Изменения в коде

### 1. Чистим правый нижний угол
- `src/components/layout/AppLayout.tsx`: убрать рендер `FloatingInstallButton` и `FloatingWhatsAppContact`. Добавить `<UnifiedChatFAB />` под тем же `consumerChrome`-гейтом + список скрытий (`HIDDEN_ROUTES` расширить: `/auth`, `^/admin`, `^/mc`, `^/operate`, `^/vendor`).
- `FloatingConcierge.tsx`, `FloatingWhatsAppContact.tsx`, `FloatingInstallButton.tsx` — пометить `@deprecated`, удалить импорты; файлы оставить на 1 релиз для безопасного отката.
- `floatingStack.ts` упростить: остаются только `chatFab` (z-50) и `contextualFab` (z-70 для wizard-страниц). `pwaInstall` удалить.

### 2. Прокачиваем `UnifiedChatFAB`
- Добавить в drawer:
  - **Line**-кнопку (рядом с WhatsApp/Telegram), скрывать если пусто.
  - **«Установить приложение»**-строку (использует `usePWAInstall().install()`); на iOS — инструкция «Поделиться → На экран „Домой“».
  - **Телефон + e-mail + рабочие часы** мелким блоком внизу — единый source-of-truth.
- AI-вью:
  - При открытии передавать `pageContext = { path: location.pathname, title: document.title }` в первый запрос; в `supabase/functions/ai-support-chat/index.ts` системный промпт расширить «текущая страница пользователя: …».
  - Заменить однократный `messages`-стейт на `localStorage`-историю (последние 20 сообщений per-session) — пользователь сможет вернуться к диалогу.
  - На главной (`/` и `/index`) добавить **proactive nudge** через 12с простоя: маленький bubble «Помочь подобрать?» — снимается dismiss-cookie на 7 дней.
- Иконка FAB: меняем `MessageCircle` на `Sparkles` (✨) — визуально считывается как AI, а не как «ещё один WhatsApp».
- Зелёная точка-индикатор остаётся как «онлайн 24/7».

### 3. Контакты — единый контракт
- `src/lib/config/contacts.ts`: добавить `line: { id: '@myuno', link: 'https://line.me/R/ti/p/@myuno' }`, хелпер `getLineUrl()`.
- Все одиночные «связаться в WhatsApp»-кнопки на landings/детальных страницах заменяем на общий `<ContactChannelsRow variant="inline" />` (3-4 иконки), который читает `COMPANY_CONTACTS` и открывает тот же drawer что FAB (через event-bus или `useContactDrawer()` контекст). Это нужно делать **постепенно** — в этой итерации только новый компонент + замена в 3 самых видимых местах (`CompactFooter`, `Support.tsx`, главные landings).
- В `CompactFooter` ряд социалок остаётся, но «Связаться» вынесена в основной CTA, открывающий тот же drawer.

### 4. AI-ассистент как «основной» — задел под загрузку данных
Пользователь сказал, что **«загрузит много данных» — пусть AI будет основной**. В этой итерации только подготавливаем фундамент, без больших миграций:

- В `ai-support-chat` Edge Function переключиться на модель по умолчанию `google/gemini-3-flash-preview` (быстро, мультиязычно), оставить системный промпт расширяемым.
- Добавить таблицу `ai_knowledge_documents` (id, title, content_md, tags[], embedding vector(1536), updated_at) + RLS «admin write, anon read». Это куда будете загружать данные.
- Добавить Edge Function `ai-knowledge-search` — semantic search по embedding (модель `google/gemini-embedding-001`), вызывается из `ai-support-chat` как retrieval-step перед стримом ответа.
- Админ-страница `/admin/ai-knowledge` для загрузки документов (markdown / pdf-to-text) — в этой итерации **только заглушка с upload-формой**, реальную обработку embeddings оставляем на следующий шаг (требует отдельного подтверждения объёма и формата данных).

### 5. Скрытие на operational-routes
- В `UnifiedChatFAB` расширить `HIDDEN_ROUTES` (regex-список) — синхронизировать с правилом «hide global nav on operational routes» из ARCHITECTURE.

## Что НЕ делаю в этой итерации
- Не трогаю десятки existing «Связаться» кнопок на landings — заменю только 3 ключевые точки + предоставлю готовый `ContactChannelsRow` для постепенной миграции.
- Не реализую полноценный RAG-pipeline (embeddings + chunking) — только схема таблицы + админка-заглушка. Полная реализация требует решения: какие данные грузим, объём, RU/EN, как часто обновлять.
- Не меняю `CompactFooter` визуально — только заменяю обработчик кнопки «Связаться».

## Файлы, которые поменяются
- edit `src/components/layout/AppLayout.tsx`
- edit `src/components/chat/UnifiedChatFAB.tsx`
- edit `src/lib/nav/floatingStack.ts`
- edit `src/lib/config/contacts.ts`
- edit `supabase/functions/ai-support-chat/index.ts`
- edit `src/components/layout/CompactFooter.tsx`
- edit `src/pages/Support.tsx`
- new  `src/components/contact/ContactChannelsRow.tsx`
- new  `src/contexts/ContactDrawerContext.tsx`
- new  `src/pages/admin/AdminAIKnowledge.tsx` (stub)
- new  `supabase/migrations/<ts>_ai_knowledge_documents.sql` (table + RLS + grants + pgvector)
- new  `supabase/functions/ai-knowledge-search/index.ts` (stub returning empty matches)
- deprecate (оставить файл, убрать импорты): `FloatingWhatsAppContact.tsx`, `FloatingInstallButton.tsx`, `FloatingConcierge.tsx`

## Проверки после внедрения
1. На `/`, `/property`, `/flowers`, `/market` в правом нижнем углу — **ровно одна** иконка-искра над bottom-nav, ничего не наезжает.
2. На `/admin`, `/mc`, `/operate`, `/auth` — FAB отсутствует.
3. Tap по FAB → drawer с AI primary + WhatsApp/Telegram/Line/Install внизу.
4. Отправка сообщения → стрим из `ai-support-chat`, история сохраняется в localStorage.
5. На `/property/:id` первое сообщение AI содержит контекст страницы в системе.
6. Lighthouse PWA-install ещё ловится (offerInstall работает из drawer).

---

**Подтвердите два момента перед билдом:**
1. **Line-аккаунт** — у вас уже есть `@myuno` в Line или нужно зарегистрировать/скрыть кнопку пока что?
2. **AI-knowledge — заглушку или сразу с pgvector + embedding-пайплайном?** Рекомендую **заглушку сейчас** (schema + admin upload form), а embeddings включить отдельным шагом, когда вы скажете формат данных — иначе рискуем построить не то.
