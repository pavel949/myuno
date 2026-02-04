
# План: Консолидация точек входа для добавления контента

## Выявленная проблема

Сейчас есть **4 конкурирующих способа** добавить контент в систему:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ТОЧКИ ВХОДА ДОБАВЛЕНИЯ                          │
├────────────────────────────────────────────────────────────────────────┤
│  1. Quick Actions (Dashboard)                                          │
│     └─ "+ Яхта", "+ Объект" → /admin/yachts?action=new                │
│     └─ Проблема: НЕТ провайдера → broken flow для некоторых вертикалей│
│                                                                        │
│  2. ContentCreatorMenu (Unified Catalog)                               │
│     └─ Сначала выбрать провайдера → "Добавить листинг"                │
│     └─ Статус: ✓ Правильная логика                                    │
│                                                                        │
│  3. ContentCreatorMenu (Provider Detail)                               │
│     └─ Внутри карточки провайдера → контекстное добавление            │
│     └─ Статус: ✓ Правильная логика                                    │
│                                                                        │
│  4. All Verticals Grid → отдельные страницы                            │
│     └─ Переход на /admin/yachts → там своя кнопка "Добавить"          │
│     └─ Проблема: Дублирует Quick Actions                              │
└────────────────────────────────────────────────────────────────────────┘
```

**Критическая проблема**: AdminBouquets.tsx (и другие страницы) **не обрабатывают** URL параметры `provider=ID&action=new` — форма открывается без предзаполненного провайдера.

---

## Предлагаемое решение

### Стратегия: "Provider-First" для всех каналов

Все пути добавления контента должны следовать единой логике:
**1. Выбрать провайдера → 2. Выбрать тип контента → 3. Заполнить форму**

---

### Изменение 1: Переработка Quick Actions

**Было:**
```text
Quick Actions: [+ Провайдер] [+ Объект] [+ Яхта] [+ Ресторан] ...
```

**Станет:**
```text
Quick Actions: [Модерация] [Лиды] [+ Провайдер] [→ Каталог] [Аналитика] ...
```

- Убрать прямые кнопки добавления вертикалей (+ Яхта, + Объект, + Ресторан)
- Оставить "+ Провайдер" (это единственный объект без parent-зависимости)
- Добавить "→ Каталог" — прямой переход в Unified Catalog для добавления контента
- Сохранить операционные кнопки (Модерация, Лиды, Аналитика, Финансы)

---

### Изменение 2: Поддержка URL-параметров в формах вертикалей

Добавить обработку query params во все страницы добавления контента:

```typescript
// AdminBouquets.tsx - добавить
const [searchParams] = useSearchParams();
const urlProviderId = searchParams.get('provider');
const urlAction = searchParams.get('action');

useEffect(() => {
  if (urlAction === 'new' && urlProviderId) {
    // Найти shop_id по provider_id
    const shop = shops.find(s => s.provider_id === urlProviderId);
    if (shop) {
      setFormData({ ...defaultFormData, shop_id: shop.id });
      setIsDialogOpen(true);
    }
  }
}, [urlAction, urlProviderId, shops]);
```

**Применить к страницам:**
- AdminBouquets.tsx
- AdminYachts.tsx
- AdminProperties.tsx
- AdminServices.tsx
- И др. вертикали с формой добавления

---

### Изменение 3: Унификация All Verticals Grid

**Текущее поведение:**  
Клик на "Яхты" → переход на /admin/yachts → там своя логика

**Рекомендация:**  
Оставить как есть — это **просмотр существующего контента**, а не добавление. Кнопка "Добавить" на этих страницах должна либо:
1. Открывать ContentCreatorMenu (если есть выбранный провайдер)
2. Показывать ProviderSelector с возможностью выбрать/создать провайдера

---

## Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/components/admin/dashboard/AdminQuickActionsGrid.tsx` | Убрать прямые "+ Яхта", "+ Объект", добавить "→ Каталог" |
| `src/pages/admin/AdminBouquets.tsx` | Добавить обработку URL params `provider=`, `action=new` |
| `src/pages/admin/AdminYachts.tsx` | Добавить обработку URL params (если ещё нет) |
| `src/pages/admin/AdminProperties.tsx` | Проверить/добавить обработку URL params |
| `src/pages/admin/AdminServices.tsx` | Проверить/добавить обработку URL params |

---

## Результат

```text
┌────────────────────────────────────────────────────────────────────────┐
│                    НОВАЯ ЕДИНАЯ ЛОГИКА ДОБАВЛЕНИЯ                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Основной путь (рекомендуемый):                                        │
│  ┌──────────────┐    ┌───────────────────┐    ┌─────────────────────┐  │
│  │ Каталог /    │ →  │ Выбрать провайдера│ →  │ ContentCreatorMenu  │  │
│  │ catalog      │    │ (Select)          │    │ (тип контента)      │  │
│  └──────────────┘    └───────────────────┘    └─────────────────────┘  │
│                                    ↓                                   │
│                      ┌─────────────────────────────────────────────┐   │
│                      │ Форма с предзаполненным provider_id         │   │
│                      │ (AdminBouquets, AdminYachts, etc.)          │   │
│                      └─────────────────────────────────────────────┘   │
│                                                                        │
│  Контекстный путь:                                                     │
│  ┌────────────────────┐    ┌───────────────────┐                      │
│  │ Карточка провайдера│ →  │ ContentCreatorMenu│ → Форма              │
│  │ /providers/:id     │    │ (уже в контексте) │                      │
│  └────────────────────┘    └───────────────────┘                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Преимущества:**
1. Единая точка входа через Unified Catalog
2. Невозможно создать "бесхозный" контент без провайдера
3. ContentCreatorMenu остаётся единым компонентом для выбора типа
4. URL-параметры работают корректно при переходе из меню

---

## Техническая секция

### Обновлённый AdminQuickActionsGrid

```typescript
const QUICK_ACTIONS = [
  { id: 'moderation', icon: FileText, label: 'Moderation', labelRu: 'Модерация', href: '/admin/moderation', variant: 'primary' },
  { id: 'leads', icon: MessageSquare, label: 'Leads', labelRu: 'Лиды', href: '/admin/leads', variant: 'primary' },
  { id: 'add-provider', icon: UserPlus, label: 'Add Provider', labelRu: '+ Провайдер', href: '/admin/providers?action=new' },
  { id: 'catalog', icon: Package, label: 'Catalog', labelRu: 'Каталог', href: '/admin/catalog' }, // NEW - вместо 3-х кнопок вертикалей
  { id: 'analytics', icon: BarChart3, label: 'Analytics', labelRu: 'Аналитика', href: '/admin/analytics' },
  { id: 'finance', icon: DollarSign, label: 'Finance', labelRu: 'Финансы', href: '/admin/finance' },
  { id: 'tickets', icon: Ticket, label: 'Tickets', labelRu: 'Тикеты', href: '/admin/tickets' },
  { id: 'team', icon: Users, label: 'Team', labelRu: 'Команда', href: '/admin/uno-team' },
];
```

### Обработка URL params в AdminBouquets

```typescript
import { useSearchParams } from 'react-router-dom';

export default function AdminBouquets() {
  const [searchParams] = useSearchParams();
  
  // Получаем параметры из URL
  const urlProviderId = searchParams.get('provider');
  const urlAction = searchParams.get('action');
  
  // ... existing state ...
  
  // Автооткрытие формы при переходе из ContentCreatorMenu
  useEffect(() => {
    if (urlAction === 'new' && !shopsLoading) {
      // Если передан provider_id, находим соответствующий shop
      if (urlProviderId) {
        const matchingShop = shops.find(s => s.provider_id === urlProviderId);
        if (matchingShop) {
          setFormData({ ...defaultFormData, shop_id: matchingShop.id });
        }
      }
      setIsDialogOpen(true);
    }
  }, [urlAction, urlProviderId, shopsLoading, shops]);
  
  // ... rest of component ...
}
```

### Ожидаемый URL flow

```text
ContentCreatorMenu.handleSelect('bouquet')
  ↓
navigate('/admin/bouquets?provider=UUID&action=new&type=bouquet')
  ↓
AdminBouquets.useEffect()
  ↓
  1. Находит shop по provider_id
  2. Предзаполняет formData.shop_id
  3. Открывает диалог
```
