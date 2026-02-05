
# План: Каталог "Решение Проблем" для Домашних Услуг (Фаза 1)

## Обзор

Реализация каталога домашних услуг с фокусом на **решениях бытовых проблем** вместо списка мастеров. На первом этапе заявки обрабатываются вручную администратором через систему лидов с уведомлениями в WhatsApp.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                          ПОЛЬЗОВАТЕЛЬСКИЙ ПУТЬ                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Домашние услуги] → [Категория: AC] → [Чистка кондиционера]                │
│                            │                    │                            │
│                            ▼                    ▼                            │
│                      Карточки функций     Форма заказа                      │
│                      (цена, время)        (адрес, дата, контакт)            │
│                                                 │                            │
│                                                 ▼                            │
│                                           ┌─────────────────┐                │
│                                           │ consultation_   │                │
│                                           │ requests        │                │
│                                           │ (vertical_id:   │                │
│                                           │  home_services) │                │
│                                           └────────┬────────┘                │
│                                                    │                         │
│                              ┌─────────────────────┴──────────────────┐      │
│                              ▼                                        ▼      │
│                    [Admin: /admin/consultations]           [WhatsApp: +66922407355]  │
│                    (Фильтр по vertical_id)                  (Уведомление)    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Фаза 1: Канонические Функции (Static Config)

### 1.1 Создать конфигурацию функций услуг

**Файл:** `src/lib/config/homeServiceFunctions.ts`

Определяет ~35 канонических бытовых проблем и их решений:

| Категория | Функция | Цена от (THB) | Время | Что входит |
|-----------|---------|---------------|-------|------------|
| **ac** | ac_cleaning | 800 | 1-2ч | Промывка фильтров, дезинфекция, проверка давления |
| **ac** | ac_install | 3,500 | 3-5ч | Монтаж блоков, прокладка трассы, пуско-наладка |
| **ac** | ac_repair | 1,500 | 1-3ч | Диагностика, замена деталей |
| **ac** | ac_gas_refill | 600 | 30м | Заправка фреоном, проверка утечек |
| **plumbing** | leak_repair | 1,200 | 1-2ч | Устранение течи, замена прокладок |
| **plumbing** | faucet_install | 1,500 | 1ч | Демонтаж старого, установка нового |
| **plumbing** | drain_cleaning | 2,000 | 1-2ч | Прочистка канализации, профилактика |
| **plumbing** | toilet_repair | 1,000 | 1ч | Ремонт сливного механизма |
| **plumbing** | water_heater | 2,500 | 2-3ч | Установка/ремонт водонагревателя |
| **electrical** | socket_install | 500 | 30м | Установка розетки/выключателя |
| **electrical** | wiring_repair | 2,000 | 2-4ч | Ремонт проводки, поиск замыкания |
| **electrical** | chandelier_install | 1,000 | 1ч | Монтаж люстры/светильника |
| **electrical** | breaker_repair | 1,500 | 1-2ч | Ремонт автоматов, щитка |
| **handyman** | furniture_assembly | 500 | 1-2ч | Сборка мебели IKEA и др. |
| **handyman** | door_repair | 800 | 1ч | Ремонт/регулировка дверей |
| **handyman** | lock_change | 1,200 | 30м-1ч | Замена замков |
| **handyman** | tv_mounting | 800 | 1ч | Монтаж ТВ на стену |
| **repair** | washing_machine | 1,500 | 1-2ч | Ремонт стиральной машины |
| **repair** | fridge_repair | 2,000 | 1-3ч | Ремонт холодильника |
| **repair** | oven_repair | 1,500 | 1-2ч | Ремонт духовки/плиты |

И еще ~15 функций для cleaning, pool, garden, pest, security и др.

---

## Фаза 2: Новый UI Каталога

### 2.1 Создать хук `useServiceFunctions`

**Файл:** `src/hooks/useServiceFunctions.ts`

```typescript
// Читает статические данные из homeServiceFunctions.ts
// Группирует по категориям
// Возвращает: { functions, byCategory, getFunction, isLoading }
```

### 2.2 Создать компонент карточки функции

**Файл:** `src/components/services/ServiceFunctionCard.tsx`

```text
┌─────────────────────────────────────────────────────────────────┐
│ ❄️  Чистка кондиционера                                        │
│     Промывка фильтров, дезинфекция, проверка давления          │
│                                                                 │
│     ⏱ 1-2 часа                              от ฿800            │
│                                         [Заказать →]           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Рефакторинг ServicesIndex.tsx

**Изменения:**
- Импорт `useServiceFunctions` вместо `useHomeServices` для главного списка
- Заменить `HomeServiceProviderCard` на `ServiceFunctionCard`
- Быстрый поиск по названию функции
- При клике на функцию → переход на страницу заказа

---

## Фаза 3: Форма Заказа Услуги

### 3.1 Создать страницу заказа

**Файл:** `src/pages/services/ServiceFunctionOrder.tsx`

**Компоненты формы (1 экран):**
1. **Выбранная услуга** (readonly): название, описание, цена от
2. **Дата и время**: выбор предпочтительной даты/времени
3. **Адрес**: Input + кнопка геолокации (как в трансферах)
4. **Описание проблемы**: Textarea для деталей
5. **Контактные данные**: Имя, телефон, предпочтительный способ связи
6. **CTA**: "Отправить заявку"

### 3.2 Интеграция с Universal Lead System

При отправке заявки → вызов `useUniversalLead`:

```typescript
submitLead({
  vertical_id: 'home_services',
  request_type: 'service_order',
  lead_source: 'cta',
  entry_point: `/services/order/${functionId}`,
  name: formData.name,
  phone: formData.phone,
  notes: formData.problemDescription,
  vertical_metadata: {
    function_id: 'ac_cleaning',
    function_name: 'AC Cleaning',
    category: 'ac',
    service_address: formData.address,
    preferred_date: formData.date,
    preferred_time: formData.time,
    base_price: 800,
    estimated_time: '1-2ч',
  },
});
```

---

## Фаза 4: WhatsApp Уведомления

### 4.1 Создать Edge Function для уведомлений о лидах

**Файл:** `supabase/functions/notify-lead-whatsapp/index.ts`

Вызывается после создания записи в `consultation_requests`:

```text
🛠️ *НОВАЯ ЗАЯВКА: ДОМАШНИЕ УСЛУГИ*

📋 *Услуга:* Чистка кондиционера
💰 *Цена от:* ฿800
⏱ *Время:* 1-2 часа

👤 *Клиент:* Иван Петров
📱 *Телефон:* +7 999 123-45-67
💬 *Связь:* WhatsApp

📍 *Адрес:* Patong Beach, Phuket
📅 *Дата:* 15 января 2026, 10:00

📝 *Описание:*
Кондиционер плохо охлаждает, давно не чистили.

🔗 Открыть: https://uno.ae/admin/consultations
```

### 4.2 Триггер на создание лида

Модифицировать `useUniversalLead.ts` для вызова Edge Function после успешного создания:

```typescript
onSuccess: async (data, variables) => {
  // Existing code...
  
  // Send WhatsApp notification for home_services
  if (variables.vertical_id === 'home_services') {
    await supabase.functions.invoke('notify-lead-whatsapp', {
      body: { leadId: data.id },
    });
  }
};
```

---

## Фаза 5: Интеграция в Админку

### 5.1 Расширить LeadVerticalConfig

**Файл:** `src/lib/leadVerticalConfig.ts`

Добавить вертикаль `home_services`:

```typescript
{
  id: 'home_services',
  icon: '🔧',
  nameEn: 'Home Services',
  nameRu: 'Домашние услуги',
  shortDescEn: 'Repairs and maintenance',
  shortDescRu: 'Ремонт и обслуживание',
  ctaTextEn: 'Request Service',
  ctaTextRu: 'Заказать услугу',
  popularityScore: 75,
  requestTypes: [
    { value: 'service_order', labelEn: 'Service Order', labelRu: 'Заказ услуги' },
    { value: 'urgent_repair', labelEn: 'Urgent Repair', labelRu: 'Срочный ремонт' },
    { value: 'consultation', labelEn: 'Consultation', labelRu: 'Консультация' },
  ],
  fields: [...],
}
```

### 5.2 AdminConsultations - Фильтр по вертикали

Уже поддерживается! Фильтр `verticalId` в `useAdminConsultations` позволит фильтровать по `home_services`.

Админ увидит:
- Badge: "🔧 Домашние услуги"
- В деталях: Функция (AC Cleaning), адрес, описание проблемы
- Заметки клиента и внутренние заметки
- Статусы: Новая → Связались → В работе → Завершена

---

## Маршрутизация

### Новые маршруты

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/services` | ServicesIndex (обновлённый) | Каталог функций |
| `/services/order/:functionId` | ServiceFunctionOrder | Форма заказа |

---

## Файлы для создания/изменения

| Файл | Действие |
|------|----------|
| `src/lib/config/homeServiceFunctions.ts` | **Создать** - канонические функции |
| `src/hooks/useServiceFunctions.ts` | **Создать** - хук для функций |
| `src/components/services/ServiceFunctionCard.tsx` | **Создать** - карточка решения |
| `src/pages/services/ServiceFunctionOrder.tsx` | **Создать** - форма заказа |
| `supabase/functions/notify-lead-whatsapp/index.ts` | **Создать** - уведомления |
| `src/pages/services/ServicesIndex.tsx` | **Изменить** - каталог функций |
| `src/hooks/useUniversalLead.ts` | **Изменить** - вызов уведомления |
| `src/lib/leadVerticalConfig.ts` | **Изменить** - добавить вертикаль |
| `src/components/layout/AnimatedRoutes.tsx` | **Изменить** - добавить маршрут |
| `supabase/config.toml` | **Изменить** - регистрация функции |

---

## Техническая Архитектура

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            АРХИТЕКТУРА ДАННЫХ                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  homeServiceFunctions.ts          consultation_requests                    │
│  ┌─────────────────────┐          ┌──────────────────────────────┐         │
│  │ id: 'ac_cleaning'   │          │ vertical_id: 'home_services' │         │
│  │ category: 'ac'      │   →      │ request_type: 'service_order'│         │
│  │ base_price: 800     │          │ vertical_metadata: {         │         │
│  │ estimated_time: ... │          │   function_id: 'ac_cleaning',│         │
│  │ includes: [...]     │          │   service_address: '...',    │         │
│  └─────────────────────┘          │   preferred_date: '...'      │         │
│                                   │ }                            │         │
│                                   └──────────────────────────────┘         │
│                                              │                              │
│                                              ▼                              │
│                                   notify-lead-whatsapp                      │
│                                   (WhatsApp → +66922407355)                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Ожидаемый Результат

1. **UX**: Пользователь видит "Чистка кондиционера - от ฿800, 1-2 часа" и сразу заказывает
2. **Admin Flow**: Заявка появляется в /admin/consultations с полным описанием задачи
3. **Оповещения**: WhatsApp уведомление на +66922407355 с деталями заявки
4. **Масштабируемость**: Новые функции добавляются в конфиг без изменения БД
5. **Будущее**: Фаза 2 добавит привязку провайдеров к функциям и автоматическое назначение
