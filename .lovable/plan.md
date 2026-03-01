

# Реорганизация Админ-панели

## Проблема
60+ страниц, но сайдбар показывает только 18. Дублирование разделов, скрытые важные инструменты, незавершённая миграция на Unified Catalog.

## Предлагаемая структура (5 групп вместо 4)

```text
CORE (Ядро)
  Dashboard          /admin
  Unified Catalog    /admin/catalog        (все вертикали в одном месте)
  Operations         /admin/operations     (заказы, тикеты, модерация)
  Intake             /admin/intake         (входящие заявки)

BUSINESS (Бизнес)
  Providers          /admin/providers      (все поставщики)
  PM Companies       /admin/pm-companies   (управляющие компании)
  MC Dashboard       /admin/mc-dashboard   (обзор по УК)
  Contracts          /admin/contracts
  Vendor Prospects   /admin/vendor-prospects (привлечение)
  Marketing          /admin/marketing      (MCC)

CONTENT (Контент)
  Cities & Locations /admin/cities         (города)
  Location Knowledge /admin/location-knowledge (база знаний)
  Translations       /admin/translations   (переводы)
  Vendor Content     /admin/vendor-content (контент для вендоров)
  Legal Documents    /admin/legal-documents

AI & AUTOMATION (AI и автоматизация)
  AI Command Center  /admin/ai-ops
  AI Agents          /admin/ai-agents

SYSTEM (Система)
  Control Center     /admin/control        (users, roles, finance, logs)
  LifeOS             /admin/life-situations
  Taxonomy           /admin/taxonomy
  Data Import        /admin/data-import
  UNO Team           /admin/uno-team
  QA Test Runner     /admin/qa-test-runner
```

## Ключевые изменения

### 1. Консолидация вертикалей в Catalog
Все 20 отдельных страниц вертикалей (Yachts, Salons, Clinics, Properties, etc.) уже дублируются в Unified Catalog. Убираем их из сайдбара, оставляем роуты как fallback-редиректы на `/admin/catalog?vertical=X`.

### 2. Новая группа "Business"
Объединяет всё, что связано с B2B: провайдеры, УК, контракты, привлечение, маркетинг. Сейчас это разбросано между "Verticals" и "Operations".

### 3. Новая группа "Content"
Выделяем контентные инструменты (города, база знаний, переводы, юридические документы) — они сейчас полностью скрыты.

### 4. AI выделен в отдельную группу
AI Command Center и AI Agents — ключевые инструменты, заслуживают отдельной видимости.

### 5. Mobile Bottom Nav обновляется
Основные 4 кнопки: Dashboard, Catalog, Operations, Intake. "More" drawer показывает остальные группы.

## Технический план

### Файл 1: `src/components/admin/AdminSidebar.tsx`
- Переписать массив `navigationGroups` на 5 новых групп (Core, Business, Content, AI, System)
- Все 25+ пунктов вместо текущих 18
- Дефолтное состояние: Core и Business открыты, остальные свёрнуты

### Файл 2: `src/components/admin/AdminMobileBottomNav.tsx`
- Обновить `mainItems` (Dashboard, Catalog, Operations, Business)
- Обновить `moreItems` с полным списком оставшихся разделов, сгруппированных по категориям

### Файл 3: `src/components/layout/AnimatedRoutes.tsx`
- Добавить redirect'ы для отдельных вертикалей на `/admin/catalog` (опционально, можно оставить как есть для прямого доступа)
- Очистить устаревшие redirect'ы

### Файл 4: `src/components/admin/AdminCommandPalette.tsx`
- Синхронизировать список команд с новой навигацией

### Оценка
- Изменения затрагивают 3-4 файла
- Нет изменений в базе данных
- Все существующие URL остаются рабочими
- Чисто UI/навигационная реорганизация
