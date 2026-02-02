
# UNO Team - Полная Система Управления Командой

## Обзор

Создание комплексной системы для управления внутренней командой myUNO с четырьмя специализациями, геймификацией, внутренним чатом и заметками к объектам.

---

## 1. Архитектура Ролей и Специализаций

### Текущее состояние
- Роль `uno_team` существует в `app_role` enum
- Таблица `uno_team_permissions` хранит права по вертикалям
- Базовый dashboard `/team` и `/team/content` реализованы

### Новая структура специализаций

```text
                    ┌─────────────────────┐
                    │    uno_team role    │
                    └─────────┬───────────┘
                              │
    ┌─────────────┬───────────┼───────────┬─────────────┐
    │             │           │           │             │
    ▼             ▼           ▼           ▼             ▼
┌────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐  ┌────────┐
│Content │  │ Support  │  │ Sales  │  │Moderation│  │ Lead   │
│Manager │  │ Operator │  │Manager │  │ Officer  │  │ Admin  │
└────────┘  └──────────┘  └────────┘  └──────────┘  └────────┘
    │             │           │           │             │
    ▼             ▼           ▼           ▼             ▼
 Добавление   Тикеты     Лиды и      Проверка       Все
 контента     и чат      конверсии   контента      функции
```

---

## 2. Схема Базы Данных

### Новые таблицы

**`team_members`** - Профили сотрудников с специализацией
```
id, user_id, specialization[], display_name, avatar_url,
phone, shift_schedule, is_active, hired_at, bio
```

**`team_activity_log`** - Логирование действий для KPI
```
id, user_id, action_type, entity_type, entity_id,
points_earned, metadata, created_at
```

**`team_gamification`** - Очки, уровни, достижения
```
id, user_id, total_points, level, streak_days,
badges[], weekly_points, monthly_points
```

**`team_achievements`** - Справочник достижений
```
id, key, name_en, name_ru, description, icon,
points_required, unlock_condition, is_secret
```

**`team_user_achievements`** - Полученные достижения
```
id, user_id, achievement_id, unlocked_at
```

**`team_messages`** - Внутренний чат
```
id, sender_id, channel, content, reply_to,
attachments, is_pinned, created_at
```

**`team_entity_notes`** - Заметки к объектам
```
id, user_id, entity_type, entity_id, content,
is_important, mentioned_users[], created_at
```

---

## 3. Система Специализаций

### Типы специализаций и их возможности

| Специализация | Доступы | Dashboards |
|---------------|---------|------------|
| **content_manager** | Создание/редактирование контента во всех вертикалях | `/team/content` |
| **support_operator** | Тикеты, чат с клиентами, звонки | `/team/support` |
| **sales_manager** | Лиды, консультации, конверсии | `/team/leads` |
| **moderation_officer** | Модерация UGC, отзывов, фото | `/team/moderation` |

### Гранулярные права
- Каждая специализация может иметь несколько под-прав
- Комбинирование специализаций (один сотрудник может быть и sales, и support)

---

## 4. Gamification Engine

### Система очков

**Действия и награды:**
| Действие | Очки | Категория |
|----------|------|-----------|
| Ответ на тикет | +5 | Support |
| Закрытие тикета < 1ч | +15 (бонус) | Support |
| Обработка лида | +10 | Sales |
| Конверсия лида | +50 | Sales |
| Добавление листинга | +20 | Content |
| Модерация контента | +5 | Moderation |
| Streak 7 дней | +100 | Bonus |

### Уровни
```
Level 1: Новичок       (0-500 очков)
Level 2: Специалист    (500-2000)
Level 3: Профи         (2000-5000)
Level 4: Эксперт       (5000-10000)
Level 5: Легенда       (10000+)
```

### Достижения (Badges)
- **Первый контакт**: Первый обработанный лид
- **Скорострел**: 10 тикетов за день
- **Золотые руки**: 100 добавленных листингов
- **Конвертор**: 50 успешных конверсий
- **Марафонец**: 30-дневный streak

### Leaderboard
- Недельный/месячный рейтинг
- Фильтр по специализации
- Анимированные позиции

---

## 5. Внутренний Чат

### Архитектура каналов
```
#general       - Общий чат команды
#support       - Канал поддержки
#sales         - Продажи
#content       - Контент-менеджеры
#announcements - Объявления (только admin)
```

### Функционал
- Real-time с Supabase Realtime
- Ответы на сообщения (threading)
- Упоминания (@username)
- Прикрепление файлов
- Закреплённые сообщения
- Emoji-реакции

---

## 6. Заметки к Объектам

### Entity Types
```
property, listing, lead, ticket, booking,
order, user, vendor, review
```

### Функционал
- Markdown-форматирование
- Упоминание коллег (@user)
- Метка "Важное" с уведомлением
- История заметок
- Прикрепление к любой сущности

---

## 7. Навигация Team Dashboard

### Новая структура маршрутов
```
/team                  - Главный dashboard с KPI
/team/inbox           - Входящие задачи (unified)
/team/content         - Content Hub (существует)
/team/support         - Тикеты и чаты
/team/leads           - CRM для лидов
/team/moderation      - Очередь модерации
/team/chat            - Внутренний чат
/team/leaderboard     - Gamification рейтинги
/team/my-profile      - Профиль сотрудника
```

### Bottom Navigation (Mobile)
```
[Dashboard] [Inbox] [Chat] [Profile]
```

---

## 8. Компоненты UI

### Новые компоненты
```
src/components/team/
├── TeamLayout.tsx           # Layout с sidebar
├── TeamSidebar.tsx          # Навигация
├── TeamBottomNav.tsx        # Mobile nav
├── dashboard/
│   ├── TeamStatsBar.tsx     # KPI виджеты
│   ├── MyTasksWidget.tsx    # Мои задачи
│   └── QuickActionsGrid.tsx # Быстрые действия
├── gamification/
│   ├── PointsDisplay.tsx    # Текущие очки
│   ├── LevelBadge.tsx       # Уровень
│   ├── AchievementCard.tsx  # Достижение
│   ├── Leaderboard.tsx      # Таблица лидеров
│   └── StreakCounter.tsx    # Серия дней
├── chat/
│   ├── ChatSidebar.tsx      # Каналы
│   ├── ChatMessages.tsx     # Сообщения
│   ├── ChatInput.tsx        # Ввод
│   └── MessageBubble.tsx    # Сообщение
├── notes/
│   ├── EntityNotesPanel.tsx # Панель заметок
│   ├── NoteCard.tsx         # Карточка заметки
│   └── AddNoteForm.tsx      # Добавление
└── shared/
    ├── SpecializationBadge.tsx
    └── TeamMemberAvatar.tsx
```

---

## 9. Хуки и Логика

### Новые хуки
```typescript
useTeamMember()       // Профиль текущего сотрудника
useTeamGamification() // Очки, уровни, достижения
useTeamChat()         // Real-time чат
useEntityNotes()      // CRUD заметок
useTeamLeaderboard()  // Рейтинги
useTeamInbox()        // Unified inbox
useActivityLogger()   // Логирование действий
```

---

## 10. RLS и Безопасность

### Политики доступа
- `team_members`: Только свой профиль + admin видит всех
- `team_activity_log`: Только свои логи + admin
- `team_gamification`: Публичное чтение (leaderboard), своё обновление
- `team_messages`: Чтение по каналу, запись авторизованным
- `team_entity_notes`: CRUD по user_id, чтение по команде

### Helper функции
```sql
is_team_member(user_id) -- Проверка роли uno_team
has_specialization(user_id, spec) -- Проверка специализации
```

---

## 11. План Реализации

### Фаза 1: База (2-3 дня)
1. Миграция БД с новыми таблицами
2. RLS политики и функции
3. `TeamLayout` и базовая навигация
4. Хук `useTeamMember`

### Фаза 2: Gamification (2 дня)
1. Таблицы очков и достижений
2. `useActivityLogger` для трекинга
3. UI компоненты gamification
4. Leaderboard страница

### Фаза 3: Чат (2 дня)
1. Таблица сообщений с Realtime
2. Компоненты чата
3. Каналы и права доступа
4. Уведомления об упоминаниях

### Фаза 4: Заметки (1 день)
1. Таблица заметок
2. `EntityNotesPanel` компонент
3. Интеграция в существующие страницы

### Фаза 5: Интеграция (1-2 дня)
1. Связь с существующими хуками (leads, tickets)
2. Автоматическое начисление очков
3. Unified inbox
4. Тестирование и polish

---

## 12. Техническая Реализация

### Пример структуры team_members
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  specializations TEXT[] DEFAULT '{}',
  display_name TEXT,
  phone TEXT,
  shift_schedule JSONB, -- {mon: "09:00-18:00", ...}
  is_active BOOLEAN DEFAULT true,
  hired_at TIMESTAMPTZ DEFAULT now(),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Realtime для чата
```typescript
const channel = supabase
  .channel('team-chat')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'team_messages' },
    handleNewMessage
  )
  .subscribe();
```

---

## Резюме

Полная система управления командой UNO включает:

- **4 специализации** с гранулярными правами
- **Gamification** с очками, уровнями и достижениями
- **Внутренний real-time чат** с каналами
- **Заметки к объектам** для командной работы
- **Unified inbox** для всех типов задач
- **Leaderboard** для мотивации

Это создаст профессиональную среду для команды поддержки уровня enterprise-компаний.
