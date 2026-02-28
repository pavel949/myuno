

## Аудит потока создания объектов владельцем/менеджером

### Обнаруженные проблемы

#### 1. КРИТИЧНО: Описание теряется при сохранении
- Форма использует поля `description` и `description_ru`
- Таблица `properties` ожидает `description_en` и `description_ru`
- В `useCreateOwnerProperty` маппинг `description -> description_en` **отсутствует** (есть только для `title -> title_en`)
- **Результат**: описание объекта молча не сохраняется в базу

**Исправление**: В `useCreateOwnerProperty` добавить маппинг `description_en: data.description || data.description_en || ''`

---

#### 2. Нет загрузки документов в визарде
- Модель данных (`OwnershipData`) поддерживает `management_document_url` и `ownership_document_url`
- `handleSubmit` корректно сохраняет их в `property_documents`
- **Но в UI (BasicInfoStep) нет компонента загрузки файлов** для договора управления и свидетельства о праве собственности
- При выборе "Договор управления" валидация требует документ (`management_document_url`), но загрузить его невозможно — пользователь навсегда застревает

**Исправление**: Добавить `UnifiedMediaUploader` (mode: `document`) в BasicInfoStep для обоих типов документов

---

#### 3. Поле телефона собственника отсутствует в UI
- Валидация `ownership` (строки 289-292) требует `actual_owner_phone` для типа `verbal`
- В BasicInfoStep показаны только `actual_owner_name` и `actual_owner_email` — **поле телефона отсутствует**
- Пользователь не может пройти валидацию

**Исправление**: Добавить поле ввода телефона в блок контактов собственника

---

#### 4. Валидация шага `ownership` никогда не вызывается
- Визард имеет 4 шага: `basic`, `location`, `photos`, `pricing`
- `validateStep` содержит case для `ownership`, но такого шага в визарде нет
- Блок управления правами встроен в `BasicInfoStep`, но валидируется только `basic` (проверяется `title`)
- **Результат**: валидация документов и контактов собственника не срабатывает — можно отправить пустые данные

**Исправление**: Перенести валидацию полей ownership внутрь case `basic` в `validateStep`

---

#### 5. Дублирование поля `title` при сохранении
- `formData` содержит `title` (строковое значение)
- `useCreateOwnerProperty` создает `title_en: data.title`
- Оба значения (`title` и `title_en`) попадают в INSERT, вызывая потенциальный конфликт — в таблице оказывается и `title` (если такой столбец есть), и `title_en`

**Исправление**: Убрать `title` из `restData` перед инсертом, оставив только маппированный `title_en`

---

#### 6. Привязка к собственнику и компании — работает
- `owner_id: user.id` — корректно устанавливается
- `management_company_id` — автоматически определяется через `management_company_members`
- `project_id` — передается из формы через spread

---

### План исправлений

#### Файл 1: `src/hooks/usePropertyCare.ts`
- Добавить маппинг `description_en: data.description || ''` и `description_ru: data.description_ru || ''` в `insertData`
- Удалить из spread поля `title`, `title_ru`, `description`, `description_ru` перед маппингом (чтобы не было конфликтов)

#### Файл 2: `src/hooks/usePropertyWizard.ts`
- В `validateStep`, case `basic`: добавить проверки для ownership-полей (документ при `management_agreement`, контакты при `verbal`)
- Удалить мертвый case `ownership`

#### Файл 3: `src/components/owner/property-wizard/steps/BasicInfoStep.tsx`
- Добавить поле ввода телефона (`actual_owner_phone`) в блок контактов собственника
- Добавить `UnifiedMediaUploader` (mode: `document`) для загрузки договора управления (при типе `management_agreement`)
- Добавить опциональный загрузчик документа о собственности

---

### Что работает корректно
- Привязка объекта к собственнику (`owner_id`)
- Привязка к проекту/ЖК (`project_id`) с автозаполнением адреса
- Привязка к УК (`management_company_id`) с автодетектом
- Загрузка фото через `UnifiedMediaUploader` (gallery mode)
- Автосохранение черновика в LocalStorage
- Клонирование объектов
- AI Intake / OTA prefill
- Адаптивная верстка (mobile/desktop)
- Уведомление администраторам о новом объекте

