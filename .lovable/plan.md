

# Реорганизация боковой панели Owner/УК

## Проблема

Блок **"Коммерция"** (Rate Seasons, Reviews, Insurance & Docs) — искусственная группа из несвязанных функций:
- Тарифы — это ценообразование, логически относится к Revenue/Finance
- Отзывы — это работа с гостями, логически относится к CRM
- Страховки и документы — это комплаенс, логически относится к Operations

У крупных PMS-платформ (Guesty, Hostaway, Cloudbeds, Lodgify) навигация строится по **бизнес-процессам**, а не по абстрактным категориям.

## Предлагаемая структура (5 групп вместо 6)

```text
ГЛАВНОЕ (Main)
├── Dashboard
├── Properties
├── Calendar
└── Inbox / Messages

CRM И ПРОДАЖИ (CRM & Sales)
├── Sales Pipeline
├── Contacts
├── Reviews              ← перенос из "Коммерция"
└── CRM Settings

ОПЕРАЦИИ (Operations)
├── Tasks
├── Inventory
├── Vendors
└── Insurance & Docs     ← перенос из "Коммерция"

ФИНАНСЫ (Finance)
├── Rate Seasons          ← перенос из "Коммерция"
├── Income & Expenses
├── Invoices
└── Analytics & Reports

КОМАНДА (Team)
└── Staff & Access
```

## Обоснование

| Элемент | Было | Стало | Почему |
|---------|------|-------|--------|
| Rate Seasons | Commerce | Finance | Тарифы = ценообразование = деньги. В Guesty/Hostaway pricing живёт в Revenue Management |
| Reviews | Commerce | CRM & Sales | Отзывы = работа с гостями = CRM. В Cloudbeds reviews привязаны к Guest Relations |
| Insurance & Docs | Commerce | Operations | Страховки = compliance = операционная поддержка объектов |
| Messages/Inbox | нет в сайдбаре | Main | У всех PMS Inbox — один из главных пунктов навигации |

## Технические изменения

### 1. `src/components/owner/OwnerSidebar.tsx`
- Удалить группу "Commerce" целиком
- Добавить "Messages" в группу "Main" (`/owner/messages`, иконка `MessageSquare`)
- Перенести "Reviews" в группу "CRM & Sales" (между Contacts и CRM Settings)
- Перенести "Rate Seasons" в группу "Finance" (первым пунктом, перед Income & Expenses)
- Перенести "Insurance & Docs" в группу "Operations" (после Vendors)

### 2. `src/components/owner/dashboard/OwnerDashboardMenu.tsx`
- Синхронизировать мобильное меню с новой структурой сайдбара (те же 5 групп)

### 3. `src/components/owner/OwnerMobileNav.tsx`
- Без изменений (нижняя панель уже содержит 4 ключевых пункта)

### 4. `src/lib/businessRoles.ts`
- Без изменений (виджеты дашборда не зависят от структуры сайдбара)

