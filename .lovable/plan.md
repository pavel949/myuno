

# CRM Contacts: Адресная книга и Досье клиентов для УК

## Проблема

Сейчас клиентские данные "размазаны" по сделкам. Один человек может быть в 5 сделках с разным написанием имени. Нет единого профиля, нет истории, нет досье.

## Решение: таблица `crm_contacts` + UI модуль

### 1. Новая таблица `crm_contacts`

| Поле | Тип | Назначение |
|------|-----|-----------|
| id | uuid | PK |
| company_id | uuid | FK на management_companies |
| first_name | text | Имя |
| last_name | text | Фамилия |
| phone | text | Основной телефон |
| phone2 | text | Доп. телефон |
| email | text | Email |
| whatsapp | text | WhatsApp (если отличается от phone) |
| telegram | text | Telegram username |
| line_id | text | LINE ID (важно для Таиланда) |
| nationality | text | Гражданство |
| language | text | Предпочитаемый язык общения |
| source | text | Откуда пришёл (website, referral, walk-in, social, agent_network) |
| contact_type | text | buyer, seller, investor, tenant, landlord, agent |
| company_name | text | Компания клиента (если есть) |
| budget_min | numeric | Бюджет от |
| budget_max | numeric | Бюджет до |
| currency | text | Валюта бюджета |
| preferred_districts | text[] | Желаемые районы |
| preferred_types | text[] | Типы недвижимости |
| bedrooms_min | int | Мин. спален |
| notes | text | Общие заметки |
| tags | text[] | Теги (VIP, hot, cold, follow-up) |
| avatar_url | text | Фото контакта |
| is_archived | boolean | Архивирован |
| created_by | uuid | Кто создал |
| created_at | timestamptz | Дата создания |
| updated_at | timestamptz | Дата обновления |

**Уникальность**: `(company_id, phone)` -- один телефон = один контакт в рамках УК.

**RLS**: аналогично `agent_deals` -- доступ через `management_company_members`.

### 2. Связь с существующими сделками

- Добавить колонку `contact_id uuid REFERENCES crm_contacts(id)` в `agent_deals`
- Миграция: НЕ удалять старые поля `client_name/phone/email` (обратная совместимость)
- При создании сделки -- автоматически привязывать или создавать контакт

### 3. Таблица `crm_contact_notes` -- Заметки по контакту

| Поле | Тип | Назначение |
|------|-----|-----------|
| id | uuid | PK |
| contact_id | uuid | FK на crm_contacts |
| user_id | uuid | Автор |
| note_type | text | note, call, meeting, email, whatsapp |
| content | text | Текст заметки |
| created_at | timestamptz | Когда |

### 4. UI: Страницы

#### 4.1 `/owner/contacts` -- Адресная книга

- Список контактов с поиском по имени, телефону, email
- Фильтры: по типу (buyer/seller/investor), по тегам (VIP/hot/cold), по источнику
- Сортировка: по дате создания, по имени, по последней активности
- Быстрые действия: WhatsApp, звонок, email
- Создание нового контакта (кнопка +)

#### 4.2 `/owner/contacts/:id` -- Карточка клиента (Досье)

Секции:
- **Профиль**: имя, фото, контакты, мессенджеры, национальность, язык
- **Предпочтения**: бюджет, районы, типы, кол-во спален
- **Сделки**: все связанные agent_deals (список с этапами)
- **Хронология**: все заметки + активности из сделок, объединённые в единый timeline
- **Теги и статус**: VIP, hot, cold, archived

#### 4.3 Интеграция с Pipeline

- При создании сделки в CreateDealSheet -- поиск по существующим контактам (автокомплит по телефону/имени)
- Если контакт найден -- подставить данные и привязать `contact_id`
- Если не найден -- создать нового контакта автоматически
- В DealCard и DealDetail -- ссылка на карточку контакта

### 5. Навигация

- Добавить пункт "Contacts" / "Контакты" в OwnerSidebar и OwnerDashboardMenu
- Иконка: Users или ContactRound из lucide-react
- Виджет "Recent Contacts" на OwnerDashboard

## Затронутые файлы

| Файл | Изменение |
|------|----------|
| SQL миграция | Создание crm_contacts, crm_contact_notes + RLS + contact_id в agent_deals |
| `src/hooks/useCrmContacts.ts` | Новый -- CRUD для контактов |
| `src/hooks/useCrmContactNotes.ts` | Новый -- заметки по контакту |
| `src/pages/owner/ContactsList.tsx` | Новый -- адресная книга |
| `src/pages/owner/ContactDetail.tsx` | Новый -- досье клиента |
| `src/components/owner/contacts/ContactCard.tsx` | Новый -- карточка в списке |
| `src/components/owner/contacts/CreateContactSheet.tsx` | Новый -- создание контакта |
| `src/components/owner/contacts/EditContactSheet.tsx` | Новый -- редактирование |
| `src/components/owner/contacts/ContactTimeline.tsx` | Новый -- хронология |
| `src/components/owner/contacts/ContactSearchInput.tsx` | Новый -- автокомплит для CreateDealSheet |
| `src/components/owner/contacts/ContactTagsEditor.tsx` | Новый -- управление тегами |
| `src/components/owner/sales/CreateDealSheet.tsx` | + поиск/привязка контакта |
| `src/components/owner/sales/DealCard.tsx` | + ссылка на контакт |
| `src/pages/owner/SalesDealDetail.tsx` | + ссылка на карточку контакта |
| `src/components/owner/OwnerSidebar.tsx` | + пункт Contacts |
| `src/components/owner/dashboard/OwnerDashboardMenu.tsx` | + пункт Contacts |
| `src/pages/owner/OwnerDashboard.tsx` | + виджет Recent Contacts |
| `src/components/layout/pageRegistry.ts` | + маршруты |
| `src/components/layout/AnimatedRoutes.tsx` | + маршруты |

## Порядок реализации

1. SQL миграция (таблицы + RLS + новая колонка в agent_deals)
2. Хуки useCrmContacts + useCrmContactNotes
3. Страница адресной книги (ContactsList)
4. Карточка/досье клиента (ContactDetail)
5. Интеграция с CreateDealSheet (автокомплит)
6. Навигация и виджет на Dashboard

