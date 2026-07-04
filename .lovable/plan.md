## Что делаем

Добавляем голосовой ввод с автоматической транскрибацией во все ключевые пользовательские текстовые поля. По кнопке микрофона у поля пользователь диктует речь → Lovable AI (Gemini/OpenAI STT через AI Gateway) возвращает текст → текст дописывается в поле.

## Архитектура

```text
┌──────────────┐    audio blob    ┌────────────────────┐    multipart      ┌──────────────────────┐
│ VoiceInput   │  ───────────────>│ edge fn:           │  ───────────────> │ Lovable AI Gateway   │
│ Button (UI)  │                  │ voice-transcribe   │                   │ /audio/transcriptions │
│              │  <─── text ───── │ (Deno)             │  <── {text} ───── │ openai/gpt-4o-mini   │
└──────────────┘                  └────────────────────┘                   └──────────────────────┘
       │
       └─ onTranscript(text) → append to input/textarea value
```

Работает без пользовательских API-ключей: используем встроенный `LOVABLE_API_KEY` в edge-функции + модель `openai/gpt-4o-mini-transcribe`.

## Компоненты

### 1. Edge-функция `supabase/functions/voice-transcribe/index.ts`
- Принимает `multipart/form-data` с полем `file` (audio blob) и опциональным `language` (`ru`/`en`).
- Проксирует в `https://ai.gateway.lovable.dev/v1/audio/transcriptions` с моделью `openai/gpt-4o-mini-transcribe`, авторизацией через `Deno.env.get('LOVABLE_API_KEY')`.
- Обрабатывает 402 (нет кредитов) / 429 (rate-limit) → отдаёт понятные ошибки.
- CORS headers через `_shared/cors.ts`. `verify_jwt = true` (только для авторизованных).
- Валидация: размер файла ≤ 20 MB, MIME `audio/*`.

### 2. Хук `src/hooks/useVoiceTranscription.ts`
- Запрашивает `navigator.mediaDevices.getUserMedia({ audio: true })`.
- Использует `MediaRecorder` c одним `stop()` (полный самодостаточный файл — не timeslice), приоритет WAV → webm → mp4 в зависимости от браузера.
- Правильное расширение файла по MIME (Safari = mp4, Chrome/Firefox = webm).
- Guard: если blob < 2 KB → toast «Запись пустая, попробуйте ещё раз».
- Отправляет blob в `voice-transcribe` через `supabase.functions.invoke`.
- Возвращает `{ isRecording, isTranscribing, start, stop, error }`.

### 3. Компонент `src/components/ui/voice-input-button.tsx`
- Иконка `Mic` / `Square` (Lucide), состояния: idle / recording (пульсирующий красный dot) / transcribing (спиннер).
- `onTranscript(text: string)` — колбэк, потребитель решает как вставить (append / replace).
- Локализация RU/EN через `useLanguage`. Доступность: `aria-label`, `aria-pressed`, tooltip.
- Обработка отказа в микрофоне → toast с инструкцией.

### 4. Интеграция в поля (первая волна — «разумные места»)

Все места, где пользователь пишет свободный текст (описание задачи, сообщение, комментарий):

| Файл | Поле |
|---|---|
| `src/components/concierge/ConciergeHelpSheet.tsx` | «Опишите задачу» (основной textarea + subject) |
| `src/pages/guest/MyStay.tsx` | «Опишите что нужно…» |
| `src/pages/Support.tsx` | Форма поддержки — describe |
| `src/pages/owner/ServiceRequest.tsx` | Описание запроса |
| `src/pages/legal/LegalBooking.tsx` | «Briefly describe…» |
| `src/pages/medical/MedicalAppointment.tsx` | Симптомы / комментарий |
| `src/pages/insurance/InsuranceQuote.tsx` | Комментарий к заявке |
| `src/components/category/CategorySuggestionDialog.tsx` | Предложение категории |
| Чаты: `thai-chat`, concierge chat, поддержка | Поле ввода сообщения |

Кнопка размещается справа в поле (для Input — absolute inside wrapper) или под textarea справа.

Не добавляем в: email, телефон, пароль, суммы, даты, коды купонов, поиск с автокомплитом.

## UX-детали

- Первая запись: браузер спросит доступ к микрофону. Если отказ — кнопка становится disabled с tooltip.
- Во время записи — визуальный индикатор (мигающая точка) + подсказка «Говорите… Нажмите ещё раз чтобы завершить».
- Транскрибация: спиннер + текст «Распознаём…».
- Результат **дописывается** к тексту в поле (не затирает), с пробелом-разделителем.
- Язык: определяется автоматически моделью (не передаём `language` в первой версии).

## Технические ограничения

- Модель: `openai/gpt-4o-mini-transcribe` (дефолт по нашему AI-катaлогу, дешёвая, стрим не нужен для коротких записей).
- **Не стримим** в первой версии — записываем полный WAV/webm и одним запросом получаем `text`. Стрим (SSE) добавим второй итерацией, если понадобится живой субтитр.
- Лимит одной записи ~2 минуты в UI (soft-limit через таймер), защита от гигантских файлов.
- Работает только в HTTPS (production `myuno.app` — OK; localhost — OK; preview `*.lovable.app` — OK).

## Что НЕ делаем в этой итерации

- Стриминг с живыми субтитрами (можно добавить позже).
- Диаризация / временные метки.
- Голосовые команды / wake-word.
- Замена нативной клавиатурной диктовки iOS/Android (наша кнопка работает поверх — универсально во всех браузерах).

## Порядок реализации

1. Edge-функция `voice-transcribe` + деплой.
2. Хук `useVoiceTranscription` + компонент `VoiceInputButton`.
3. Подключение в `ConciergeHelpSheet` (флагман — там самая длинная форма).
4. Подключение в остальные 8 форм из таблицы.
5. Ручная проверка в Chrome (webm) и Safari iOS (mp4) на preview-URL.

## Оценка

- ~1 edge-функция, 1 хук, 1 UI-компонент, 9 точечных правок форм.
- Кода нового: ~300 строк, правок в существующие файлы: ~10 строк каждая.
