

# Аудит блока управления недвижимостью: два сценария + поставщики + документы

## Текущее состояние

### Два сценария управления (УК vs Собственник)

**Что есть:**
- В `PropertyEditor` можно выбрать `management_type`: `owner` (самостоятельно), `full` (УК), `partial` (сервис-партнёр)
- Навигация (`OwnerSidebar`) одинаковая для всех — нет адаптации интерфейса под тип управления
- Все инструменты (Staff, Calendar, Financials, Tasks) доступны всем одинаково

**Проблемы:**
- Собственник, управляющий сам, видит функции, которые ему не нужны (Management Portfolio, Team Members & Access, Delegation)
- УК не видит выделенного раздела для управления отношениями с собственниками объектов
- Нет визуальной разницы в интерфейсе между двумя сценариями — пользователь не понимает, что система адаптирована под его модель

### Поставщики (Vendor Directory)

**Что есть:**
- `VendorDirectoryPage` — read-only список из `vendor_prospects` (таблица admin-уровня для привлечения вендоров)
- Отзывы через `VendorReviewSheet` (привязаны к `company_id`)
- Базовые контакты: phone, email, website, whatsapp

**Проблемы:**
1. **Неправильный источник данных**: справочник тянет из `vendor_prospects` — это воронка привлечения вендоров (admin), а не справочник поставщиков собственника/УК
2. **Нет CRUD для собственника**: нельзя добавить своего поставщика (клининг-тётя Маша, электрик Сомчай)
3. **Нет привязки к объектам**: поставщик не привязан к конкретному property
4. **Нет документов у поставщика**: нельзя прикрепить договор, фото, лицензию
5. **Нет истории работ**: не видно, когда последний раз работал, сколько заплатили
6. **Нет разделения**: "мои поставщики" vs "поставщики через myUNO" не различаются

### Документы

**Что есть:**
- `PropertyDocumentsTab` — документы привязаны к объекту (коды, договоры, страховки)
- `OwnerVaultPage` — файловое хранилище с категориями (contracts, photos, legal, financial)
- `useUserDocuments` — личные документы пользователя (паспорт, виза)
- `UnifiedMediaUploader` — система загрузки файлов

**Проблемы:**
1. `PropertyDocumentsTab` не поддерживает загрузку файлов — только текстовые поля (title, description, access_code), поле `file_url` есть в схеме но нигде не заполняется через UI
2. У `staff_members` нет полей для фото, документов (паспорт, рабочее разрешение)
3. У поставщиков нет хранилища документов (договоры, акты, лицензии)
4. Maintenance schedules не могут хранить акты выполненных работ

---

## План улучшений

### 1. Собственная таблица поставщиков: `owner_service_vendors`

Новая таблица для хранения СВОИХ поставщиков собственника/УК (не путать с `vendor_prospects` платформы):

```text
owner_service_vendors
+-- id (uuid)
+-- owner_id (uuid, FK -> auth.users)
+-- name (text) — "Сомчай Электрик"
+-- name_ru (text)
+-- category (text) — cleaning, plumbing, electrical, ac, pest, garden, pool, security, appliances, handyman, other
+-- contact_person (text)
+-- phone (text)
+-- email (text)
+-- whatsapp (text)
+-- line_id (text) — популярно в Таиланде
+-- address (text)
+-- photo_url (text) — фото человека/компании
+-- notes (text)
+-- source (text) — 'own' | 'myuno' — свой или через платформу
+-- is_favorite (bool)
+-- is_active (bool, default true)
+-- avg_rating (numeric) — средняя оценка
+-- total_jobs (int) — сколько раз привлекался
+-- created_at / updated_at
```

RLS: owner_id = auth.uid()

### 2. Документы поставщика: `vendor_documents`

```text
vendor_documents
+-- id (uuid)
+-- vendor_id (FK -> owner_service_vendors)
+-- owner_id (uuid)
+-- doc_type (text) — contract, license, insurance, invoice, act, photo, id_card, work_permit, other
+-- title (text)
+-- file_url (text)
+-- file_name (text)
+-- expiry_date (date, nullable)
+-- notes (text)
+-- created_at
```

### 3. Привязка поставщиков к объектам: `vendor_property_assignments`

```text
vendor_property_assignments
+-- id (uuid)
+-- vendor_id (FK -> owner_service_vendors)
+-- property_id (FK -> owner_properties)
+-- service_type (text)
+-- rate (numeric, nullable)
+-- rate_type (text) — per_visit, hourly, monthly
+-- notes (text)
+-- is_active (bool)
```

### 4. Обновление PropertyDocumentsTab — добавить загрузку файлов

Сейчас форма создания документа не включает загрузку файла, хотя поле `file_url` есть в БД. Добавить `UnifiedMediaUploader` (mode='document') в диалог создания документа, чтобы можно было прикреплять PDF, фото, сканы.

### 5. Фото и документы сотрудников

Добавить поля в `staff_members`:
- `photo_url` (text) — фото сотрудника
- Создать связанную таблицу `staff_documents` (work_permit, passport, contract, id_card) — по аналогии с `vendor_documents`

### 6. Обновлённая страница "Мои поставщики"

Полностью переработать `VendorDirectoryPage`:

```text
+------------------------------------------------+
|  Мои поставщики                    [+ Добавить] |
|  ------------------------------------------------|
|  [Все] [Клининг] [Электрика] [Сантехника] ...   |
|  ------------------------------------------------|
|  [Мои] [myUNO]                                   |
|  ------------------------------------------------|
|                                                  |
|  +-- Vendor Card ----+  +-- Vendor Card ----+   |
|  | [photo] Сомчай    |  | [photo] Clean Pro |   |
|  | Электрик          |  | Cleaning Co.      |   |
|  | * 4.5 (12 работ)  |  | * 4.8 (28 работ)  |   |
|  | Villa Ocean, ...  |  | Condo Palm        |   |
|  | [Call] [WA] [...]  |  | [myUNO badge]     |   |
|  +-------------------+  +-------------------+   |
|                                                  |
|  При клике -> детальная карточка:                |
|  - Контакты, фото                                |
|  - Привязанные объекты                           |
|  - Документы (договоры, лицензии)                |
|  - История работ и оценки                        |
+--------------------------------------------------+
```

### 7. Адаптация навигации по management_type

Мягкая адаптация — не скрывать разделы, но менять акценты:
- Для `owner` (self-managed): в Operations подсветить "Мои поставщики" и "Maintenance Plan"
- Для `full`/`partial` (УК): показать "Management Portfolio" в группе Main

---

## Технические изменения

| Файл | Действие |
|------|----------|
| `supabase/migrations/...owner_vendors.sql` | 3 новые таблицы + RLS + поля для staff |
| `src/hooks/useOwnerVendors.ts` | CRUD-хук для owner_service_vendors |
| `src/hooks/useVendorDocuments.ts` | Хук для документов поставщика |
| `src/pages/owner/VendorDirectoryPage.tsx` | Полная переработка — CRUD, карточки, фильтры |
| `src/components/owner/vendors/VendorDetailSheet.tsx` | Новый — детальная карточка с табами (Info, Properties, Docs, History) |
| `src/components/owner/vendors/AddVendorDialog.tsx` | Новый — форма добавления с фото и категорией |
| `src/components/owner/vendors/VendorDocumentsTab.tsx` | Новый — документы поставщика с загрузкой |
| `src/components/owner/PropertyDocumentsTab.tsx` | Добавить UnifiedMediaUploader для file_url |
| `src/pages/owner/StaffPage.tsx` | Добавить photo_url и ссылку на документы |

### Миграция БД

1. Создание `owner_service_vendors` с RLS (owner_id = auth.uid())
2. Создание `vendor_documents` с RLS
3. Создание `vendor_property_assignments` с RLS
4. ALTER TABLE `staff_members` ADD COLUMN `photo_url` text
5. Создание `staff_documents` (аналог vendor_documents)

### Загрузка файлов

Все документы загружаются через существующий `UnifiedMediaUploader` (mode='document') в bucket `vendor-uploads` с path `{user_id}/vendors/{vendor_id}/` или `{user_id}/staff/{staff_id}/`.

