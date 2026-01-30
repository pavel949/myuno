

# План: Персонализация главного экрана через персоны пользователя + AI

## Обзор

Создание системы, где пользователь выбирает свои "персоны" (турист, резидент, владелец недвижимости), и AI формирует персонализированный экран с релевантными услугами и предложениями.

**Да, это безопасно реализовать!** Персоны — это не роли доступа (admin, staff), а предпочтения пользователя для персонализации контента. Они не влияют на права доступа к данным.

## Архитектура

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Главный экран                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │     Персона-селектор (мульти-выбор)                      │   │
│  │  [🧳 Турист ✓] [🏠 Резидент] [🏢 Владелец ✓]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │     AI-генерированный контент                            │   │
│  │  "На основе ваших интересов мы подобрали..."             │   │
│  │                                                           │   │
│  │  [Яхты] [Туры] [Недвижимость] [Юрист] [Страховка]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │     Персонализированные рекомендации                     │   │
│  │  Карточки услуг, отобранные AI под персоны               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Безопасность

| Аспект | Подход |
|--------|--------|
| Персоны vs Роли | Персоны (tourist, resident, owner) хранятся отдельно от ролей доступа (admin, staff) |
| Хранение | Новая таблица `user_personas` с RLS политиками |
| Мульти-выбор | Пользователь может иметь несколько персон одновременно |
| AI обработка | Edge function с Lovable AI для генерации рекомендаций |

## Шаги реализации

### Шаг 1: Создание таблицы `user_personas`

Отдельная таблица для предпочтений персонализации (не путать с ролями доступа):

```sql
CREATE TYPE public.user_persona AS ENUM ('tourist', 'resident', 'property_owner');

CREATE TABLE public.user_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  persona user_persona NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, persona)
);

ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свои персоны
CREATE POLICY "Users can view own personas"
  ON public.user_personas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Пользователь может добавлять себе персоны
CREATE POLICY "Users can insert own personas"
  ON public.user_personas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Пользователь может обновлять свои персоны
CREATE POLICY "Users can update own personas"
  ON public.user_personas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Пользователь может удалять свои персоны
CREATE POLICY "Users can delete own personas"
  ON public.user_personas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Шаг 2: UI компонент PersonaSelector

Новый компонент для выбора персон на главном экране:

```text
Файл: src/components/home/PersonaSelector.tsx

Функционал:
- Горизонтальный ряд чипов с персонами
- Мульти-выбор (можно выбрать несколько)
- Иконки и цвета для каждой персоны
- Сохранение в БД через React Query
- Анимация при переключении
```

Персоны с UI:
- 🧳 **Турист** — Яхты, туры, рестораны, развлечения
- 🏠 **Резидент** — Визы, медицина, юристы, страховки
- 🏢 **Владелец** — Управление недвижимостью, юридические услуги

### Шаг 3: Hook `useUserPersonas`

```text
Файл: src/hooks/useUserPersonas.ts

Функционал:
- Загрузка персон пользователя из БД
- Добавление/удаление персон
- Кэширование через React Query
- Оптимистичные обновления UI
```

### Шаг 4: Edge Function для AI-персонализации

```text
Файл: supabase/functions/ai-personalize-home/index.ts

Входные данные:
- personas: ['tourist', 'property_owner']
- language: 'ru' | 'en'
- view_history: последние просмотренные категории

Выходные данные:
- recommended_categories: список категорий с приоритетами
- suggested_actions: персонализированные быстрые действия
- greeting_message: AI-сформированное приветствие
```

AI промпт будет учитывать комбинации персон:
- Турист + Владелец → показать яхты И управление недвижимостью
- Резидент → фокус на визах, страховках, медицине

### Шаг 5: Интеграция в Index.tsx

Обновление главной страницы:
1. Добавить `PersonaSelector` после `ContentModeToggle`
2. Использовать `useUserPersonas` для получения персон
3. Передавать персоны в `QuickActionsGrid` для фильтрации
4. Добавить AI-приветствие на основе персон

### Шаг 6: Обновление QuickActionsGrid

Изменить логику выбора действий:
- Вместо `user_type` из профиля использовать активные персоны
- Объединять действия для нескольких персон
- Приоритизировать по пересечению интересов

## Технические детали

### Структура персон

| Персона | Категории услуг |
|---------|-----------------|
| tourist | yachts, tours, restaurants, events, water, transport, beauty |
| resident | visa, medical, legal, insurance, banking, education, pharmacy |
| property_owner | property, legal, insurance, services, cleaning |

### Формат ответа AI

```json
{
  "greeting": "Привет! Для вас как туриста и владельца недвижимости...",
  "priority_categories": ["yachts", "property", "legal", "tours"],
  "suggested_services": [
    { "id": "yacht-rental", "reason": "Популярно среди туристов" },
    { "id": "property-management", "reason": "Для владельцев недвижимости" }
  ]
}
```

## Файлы для создания/изменения

| Файл | Действие |
|------|----------|
| `supabase/migrations/xxx_create_user_personas.sql` | Создать |
| `src/hooks/useUserPersonas.ts` | Создать |
| `src/components/home/PersonaSelector.tsx` | Создать |
| `supabase/functions/ai-personalize-home/index.ts` | Создать |
| `src/pages/Index.tsx` | Изменить |
| `src/components/home/QuickActionsGrid.tsx` | Изменить |

## Ожидаемый результат

- Пользователь выбирает персоны на главном экране
- Выбор сохраняется в БД и синхронизируется между устройствами
- AI формирует персонализированное приветствие и рекомендации
- Quick Actions адаптируются под выбранные персоны
- Безопасность: персоны не влияют на доступ к данным

