
# План: Бесплатный iCal-based Channel Manager с максимальным функционалом

## Обзор текущего состояния

Система уже имеет базовую iCal-интеграцию:
- **Экспорт** (`calendar-export`): Генерация iCal-фида с бронированиями для OTA
- **Импорт** (`ical-sync`): Парсинг iCal из Airbnb/Booking и создание бронирований
- **UI**: Channel Manager страница с вкладками Import/Export

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────┐
│                     UNO iCal Channel Manager                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Airbnb     │    │  Booking.com │    │    VRBO      │      │
│  │  iCal URL    │    │   iCal URL   │    │  iCal URL    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ical-sync Edge Function                      │  │
│  │  • Фоновая синхронизация по расписанию                   │  │
│  │  • Парсинг дат, UID, summary                             │  │
│  │  • Upsert в property_bookings                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  property_bookings                        │  │
│  │  + sync_direction: 'inbound' | 'outbound' | 'master'     │  │
│  │  + conflict_status: 'none' | 'detected' | 'resolved'     │  │
│  │  + sync_priority: integer                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             calendar-export Edge Function                 │  │
│  │  • Генерация iCal с ВСЕМИ бронированиями                 │  │
│  │  • Token-based авторизация                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Airbnb     │    │  Booking.com │    │    VRBO      │      │
│  │ Import iCal  │    │  Sync iCal   │    │  Sync iCal   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Новый функционал

### Фаза 1: Автоматическая фоновая синхронизация

**Цель**: Календари синхронизируются автоматически каждые 15 минут без участия пользователя.

**Изменения**:
1. Создать Edge Function `ical-scheduled-sync`:
   - Выбирает все активные `property_external_calendars`
   - Синхронизирует с rate limiting (не более 10 параллельных запросов)
   - Записывает результаты в `sync_logs` таблицу
   
2. Настроить pg_cron через Supabase:
   - Вызов функции каждые 15 минут
   - Fallback: Frontend polling как резерв

3. Добавить `sync_logs` таблицу:
   - `calendar_id`, `synced_at`, `events_found`, `events_added`, `events_removed`, `error`

### Фаза 2: Обнаружение конфликтов бронирований

**Цель**: Предупреждать о пересечениях дат между каналами.

**Изменения**:
1. Добавить колонки в `property_bookings`:
   - `sync_priority` (integer, default 0) - приоритет канала
   - `conflict_detected_at` (timestamp) - когда обнаружен конфликт

2. Создать RPC функцию `detect_booking_conflicts`:
   - Находит пересекающиеся даты для одного property
   - Возвращает список конфликтующих пар

3. Добавить UI-компонент `ConflictAlert`:
   - Показывает красный badge при наличии конфликтов
   - Предлагает варианты разрешения

### Фаза 3: Расширенный парсинг iCal

**Цель**: Извлекать максимум данных из iCal-событий OTA.

**Изменения в `ical-sync`**:
1. Парсинг дополнительных полей:
   - `X-AIRBNB-PRICE` -> `total_amount`
   - `X-BOOKING-GUESTS` -> `guests_count`
   - `LOCATION` -> заметки
   - `ORGANIZER` -> контакт гостя (если есть)

2. Интеллектуальное определение источника:
   - По домену iCal URL
   - По X-* заголовкам в VCALENDAR

### Фаза 4: Дашборд синхронизации

**Цель**: Единый экран управления всеми каналами.

**UI компоненты**:
1. `ChannelHealthDashboard`:
   - Статус каждого канала (зеленый/желтый/красный)
   - Время последней синхронизации
   - Количество импортированных событий
   - Кнопка принудительной синхронизации

2. `SyncTimeline`:
   - История синхронизаций за 7 дней
   - Графики успешности

3. `QuickConnect` карточки:
   - Шаблоны для быстрого добавления популярных OTA
   - Инструкции по получению iCal URL

### Фаза 5: Push-уведомления о бронированиях

**Цель**: Мгновенно уведомлять о новых бронированиях с OTA.

**Изменения**:
1. Расширить `ical-sync` для определения новых бронирований:
   - Сравнение с предыдущим состоянием
   - Trigger уведомления при новом `external_id`

2. Интеграция с существующей системой уведомлений:
   - Push-notification в браузер
   - Email (опционально)
   - Telegram bot (будущее)

---

## Детали реализации

### База данных

**Новая таблица `calendar_sync_logs`**:
```sql
CREATE TABLE calendar_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid REFERENCES property_external_calendars(id) ON DELETE CASCADE,
  property_id uuid REFERENCES owner_properties(id) ON DELETE CASCADE,
  synced_at timestamptz DEFAULT now(),
  events_found integer DEFAULT 0,
  events_added integer DEFAULT 0,
  events_updated integer DEFAULT 0,
  events_removed integer DEFAULT 0,
  sync_duration_ms integer,
  error text,
  created_at timestamptz DEFAULT now()
);
```

**Изменения в `property_bookings`**:
```sql
ALTER TABLE property_bookings ADD COLUMN IF NOT EXISTS sync_priority integer DEFAULT 0;
ALTER TABLE property_bookings ADD COLUMN IF NOT EXISTS conflict_detected_at timestamptz;
```

**Изменения в `property_external_calendars`**:
```sql
ALTER TABLE property_external_calendars ADD COLUMN IF NOT EXISTS sync_interval_minutes integer DEFAULT 15;
ALTER TABLE property_external_calendars ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;
ALTER TABLE property_external_calendars ADD COLUMN IF NOT EXISTS auto_sync boolean DEFAULT true;
```

### Edge Functions

**`ical-scheduled-sync/index.ts`** - новая функция для фоновой синхронизации:
- Получает все календари с `auto_sync = true`
- Выполняет синхронизацию с логированием
- Определяет новые бронирования и отправляет уведомления

### Frontend компоненты

1. **`src/components/owner/channel-manager/ChannelHealthDashboard.tsx`**
   - Общий статус всех каналов
   - Индикаторы здоровья синхронизации

2. **`src/components/owner/channel-manager/SyncTimeline.tsx`**
   - Лог синхронизаций
   - Графики активности

3. **`src/components/owner/channel-manager/ConflictResolver.tsx`**
   - UI для разрешения конфликтов дат

4. **`src/components/owner/channel-manager/QuickConnectCards.tsx`**
   - Быстрое подключение Airbnb/Booking/VRBO с инструкциями

5. **`src/hooks/useChannelHealth.ts`**
   - Хук для мониторинга статуса каналов

---

## Приоритеты реализации

| Фаза | Функционал | Сложность | Ценность |
|------|-----------|-----------|----------|
| 1 | Автоматическая синхронизация | Средняя | Высокая |
| 2 | Обнаружение конфликтов | Низкая | Высокая |
| 3 | Расширенный парсинг | Низкая | Средняя |
| 4 | Дашборд синхронизации | Средняя | Высокая |
| 5 | Push-уведомления | Средняя | Высокая |

---

## Ограничения iCal-подхода

Важно понимать границы бесплатного решения:

| Возможность | iCal Channel Manager | Платный API |
|-------------|---------------------|-------------|
| Синхронизация календаря | Да (15 мин задержка) | Да (realtime) |
| Синхронизация цен | Нет | Да |
| Создание листингов | Нет | Да |
| Изменение описаний | Нет | Да |
| Автоответы гостям | Нет | Да |
| Информация о госте | Частично (из summary) | Полная |

---

## Файлы для создания/изменения

**Новые файлы**:
- `supabase/functions/ical-scheduled-sync/index.ts`
- `src/components/owner/channel-manager/ChannelHealthDashboard.tsx`
- `src/components/owner/channel-manager/SyncTimeline.tsx`
- `src/components/owner/channel-manager/ConflictResolver.tsx`
- `src/components/owner/channel-manager/QuickConnectCards.tsx`
- `src/hooks/useChannelHealth.ts`
- `src/hooks/useSyncLogs.ts`

**Изменения в существующих файлах**:
- `supabase/functions/ical-sync/index.ts` - расширенный парсинг + логирование
- `src/pages/owner/ChannelManager.tsx` - интеграция новых компонентов
- `src/hooks/useExternalCalendars.ts` - добавление полей priority, auto_sync
