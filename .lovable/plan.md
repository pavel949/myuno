
# План: Быстрая привязка категории + Условия сотрудничества в карточке провайдера

## Обзор проблем

### 1. Привязка категории к провайдеру
- Текущий выбор категории — длинный dropdown с 30+ опциями
- Меню уползает, неудобно выбирать на мобильных устройствах
- Нет группировки по доменам (Home Services / General)

### 2. Условия сотрудничества (комиссии, оплата)
- Сейчас комиссия **отображается** в карточке провайдера, но **редактируется** только через отдельную страницу контрактов
- Чтобы создать контракт, нужно вручную вводить UUID провайдера
- Неудобный workflow: детали провайдера → переход на `/admin/contracts` → создание контракта

---

## Решение

### Часть 1: Улучшенный селектор категорий

**Редизайн выбора категории с группировкой:**

```text
+------------------------------------------+
|  🔍 Поиск категории...                   |
+------------------------------------------+
| 🏠 HOME SERVICES                         |
|   🧹 Уборка                              |
|   🔧 Сантехника                          |
|   ⚡ Электрика                           |
|   🌿 Сад и участок                       |
|   ...                                    |
+------------------------------------------+
| 🏢 GENERAL VERTICALS                     |
|   💆 Красота и спа                       |
|   🍽️ Еда и рестораны                     |
|   🚗 Транспорт                           |
|   🏥 Медицина                            |
|   ⛵ Яхты                                |
|   💐 Цветы                               |
+------------------------------------------+
```

**Технические изменения:**
- Новый компонент `CategorySelector.tsx` с Command (cmdk) для поиска
- Группировка: Home Services (из taxonomy) + General Verticals
- Поддержка **множественного выбора** для провайдеров с несколькими категориями
- Добавление поля `business_categories` (массив) в providers или использование JSON в существующем поле

---

### Часть 2: Быстрые условия сотрудничества в карточке провайдера

**Новая секция "Сотрудничество" в `AdminProviderDetail.tsx`:**

```text
+-------------------------------------------+
| 📋 УСЛОВИЯ СОТРУДНИЧЕСТВА                 |
+-------------------------------------------+
| Комиссия: [15] %  💾                      |
| Мин. комиссия: [100] THB                  |
| Макс. комиссия: [5000] THB                |
+-------------------------------------------+
| Условия оплаты:                           |
| ○ За транзакцию  ● Еженедельно  ○ Ежемесячно|
+-------------------------------------------+
| Тип контракта:                            |
| ● Стандартный  ○ Эксклюзивный  ○ Пробный  |
+-------------------------------------------+
| [✓] Автопродление                         |
+-------------------------------------------+
| Банковские реквизиты:                     |
| Банк: [Bangkok Bank]                      |
| Счёт: [1234567890]                        |
| Имя: [Company Name Co., Ltd]              |
+-------------------------------------------+
|          [ 💾 Сохранить условия ]         |
+-------------------------------------------+
```

**Логика:**
- Если контракт существует → редактирование inline
- Если контракта нет → создание нового со статусом `active` (для админа)
- Прямое сохранение в `provider_contracts` таблицу

---

## Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/components/admin/CategorySelector.tsx` | **Новый** — комбобокс с группировкой и поиском |
| `src/pages/admin/AdminProviders.tsx` | Заменить простой Select на CategorySelector |
| `src/pages/admin/AdminProviderDetail.tsx` | Добавить секцию "Условия сотрудничества" с inline-редактированием контракта |
| `src/hooks/useProviderContracts.ts` | Добавить функцию `upsertContract` для создания/обновления |

---

## Техническая секция

### Новая структура CategorySelector
```typescript
interface CategorySelectorProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
}

// Группы категорий
const CATEGORY_GROUPS = [
  {
    id: 'home_services',
    labelEn: 'Home Services',
    labelRu: 'Домашние услуги',
    categories: ALL_SERVICE_CATEGORIES // из taxonomy
  },
  {
    id: 'general',
    labelEn: 'General',
    labelRu: 'Общие',
    categories: GENERAL_CATEGORIES
  }
];
```

### Inline Contract Editor в Provider Detail
```typescript
// Получаем или создаём контракт
const { data: contract } = useEntityContract('provider', providerId);

// Состояние формы
const [contractData, setContractData] = useState({
  commission_rate: contract?.commission_rate || 10,
  payment_terms: contract?.payment_terms || 'monthly',
  contract_type: contract?.contract_type || 'standard',
  auto_renew: contract?.auto_renew ?? true,
  bank_name: contract?.bank_name || '',
  bank_account_number: contract?.bank_account_number || '',
  bank_account_name: contract?.bank_account_name || '',
});

// Сохранение — upsert
const handleSaveContract = async () => {
  if (contract) {
    await updateContract({ id: contract.id, data: contractData });
  } else {
    await createContract({
      entity_type: 'provider',
      entity_id: providerId,
      status: 'active', // Автоматически активен для админа
      ...contractData
    });
  }
};
```

---

## Результат

1. **Быстрый выбор категории** — поиск + группировка, поддержка нескольких категорий
2. **Условия сотрудничества прямо в карточке** — не нужно переходить на отдельную страницу
3. **Автоматическая активация контракта** для действий из админки
4. **Консистентность** — все данные о провайдере в одном месте
