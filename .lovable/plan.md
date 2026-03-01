
# Аудит и улучшения: Профиль УК, Команда, Подписка, Бэкап

## Обнаруженные проблемы

### 1. Профиль компании (CompanyProfileSettings)
- **Нет документов**: отсутствует возможность прикрепить документы компании (лицензии, сертификаты, регистрацию)
- **Нет DBD карточки**: нет поля для загрузки DBD карточки (Department of Business Development — регистрация в Таиланде)
- **Неполные реквизиты**: нет полей для регистрационного номера компании, юридического адреса (отдельно от фактического), банковских реквизитов
- **Нет cover image upload**: поле cover_image есть в БД, но загрузчик для него не реализован

### 2. Команда (StaffPage)
- **Все работает**: создание сотрудников, отправка учётных данных по email через `invite-team-member`, делегирование прав по модулям, назначение на объекты — реализовано и функционально
- **Нет проблем с иерархией**: director > admin > manager > staff/cleaner/maintenance — структура ролей корректная

### 3. Подписка (MCSubscriptionPage)
- **Нет даты активации** у объектов в списке — видно только Active/Off, но не когда был активирован
- **Нет бэкапа данных**: полностью отсутствует функционал экспорта/бэкапа

---

## План реализации

### Шаг 1: Расширение профиля компании

**Миграция БД** — добавить колонки в `management_companies`:
- `legal_name` (text) — юридическое название
- `registration_number` (text) — номер регистрации
- `legal_address` (text) — юридический адрес
- `bank_name` (text) — название банка
- `bank_account` (text) — номер счёта
- `swift_code` (text) — SWIFT код
- `dbd_card_url` (text) — URL DBD-карточки
- `documents` (jsonb, default '[]') — массив документов [{name, url, type, uploaded_at}]

**Обновить CompanyProfileSettings.tsx**:
- Добавить секцию "Юридические данные" с новыми полями (legal_name, registration_number, legal_address)
- Добавить секцию "Банковские реквизиты" (bank_name, bank_account, swift_code)
- Добавить загрузчик DBD-карточки (UnifiedMediaUploader mode="single")
- Добавить загрузчик Cover Image
- Добавить секцию "Документы компании" (UnifiedMediaUploader mode="document") для лицензий, сертификатов и т.д.
- Все новые секции — компактные, в Accordion или Card формате

### Шаг 2: Дата активации в подписке

**Обновить MCSubscriptionPage.tsx**:
- В списке объектов показать дату активации из `mc_property_slots.activated_at`
- Добавить badge с датой рядом со статусом Active

### Шаг 3: Бэкап данных УК

**Новый компонент** `src/components/mc/settings/DataBackupSettings.tsx`:
- Кнопки экспорта по категориям: Объекты, CRM-контакты, Финансы, Отчёты
- Формат экспорта: JSON (структурированный) или CSV
- Данные формируются на клиенте из уже доступных Supabase-запросов

**Новая Edge Function** `export-mc-data`:
- Принимает company_id + export_type (properties/crm/finance/reports/all)
- Возвращает JSON с данными
- Проверка авторизации: только director/admin

**Автобэкап**: настройка в UI (ежемесячный/еженедельный)
- Сохранять настройку в `management_companies.backup_settings` (jsonb)
- Cron-задача для генерации и сохранения в Storage бакет `mc-backups`

**Добавить таб "Data" в MCSettingsPage**:
- Интегрировать DataBackupSettings в настройки

---

## Технические детали

### Новые файлы
1. `src/components/mc/settings/DataBackupSettings.tsx` — UI бэкапа
2. `supabase/functions/export-mc-data/index.ts` — Edge Function экспорта
3. Миграция БД — новые колонки для management_companies

### Изменяемые файлы
4. `src/components/mc/settings/CompanyProfileSettings.tsx` — расширенный профиль
5. `src/pages/mc/MCSettingsPage.tsx` — новый таб "Data/Данные"
6. `src/pages/owner/MCSubscriptionPage.tsx` — дата активации слотов
7. `src/hooks/useManagementCompanies.ts` — обновить интерфейс ManagementCompany

### Безопасность
- Edge Function проверяет JWT + membership в компании с ролью director/admin
- Storage бакет `mc-backups` с RLS: доступ только участникам компании
