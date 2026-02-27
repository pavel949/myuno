

# Аудит и план автоматизации привлечения клиентов и поставщиков

## Что уже построено (сильные стороны)

Маркетинговый центр (MCC) включает 13 табов с реальными данными:
- **Control Tower**: KPI-панель, воронка по лендингам, AI-рекомендации, drop-off radar
- **Leads Hub**: Единый хаб лидов из consultation_requests и MCC с AI-скорингом
- **Vendor Acquisition**: AI-скоринг, генерация outreach-сообщений, batch-импорт, анализ URL
- **Automation**: Cron-задачи (6 штук), lifecycle-шаблоны, правила автоматизации
- **Campaign Center L1**: Поведенческие правила с event-триггерами

Backend-функции:
- `vendor-acquisition` -- AI-скоринг и outreach для поставщиков
- `leads-factory` -- AI-скоринг и follow-up для клиентов
- `auto-vendor-nurture` -- автоматический nurture вендоров (cron)
- `auto-lifecycle-actions`, `post-order-autopilot` -- lifecycle автоматизация

## Выявленные пробелы (что мешает полной автоматизации)

### 1. Нет автоматического скоринга клиентских лидов
`auto-vendor-nurture` автоматически скорит вендоров, но для клиентских лидов из `consultation_requests` аналогичного cron НЕТ. Лиды скорируются только вручную.

### 2. Кнопки действий в Leads Hub -- декоративные
Кнопки Mail, Phone, WhatsApp в таблице лидов не имеют обработчиков (`onClick` отсутствует). Невозможно связаться с лидом прямо из MCC.

### 3. Правила Campaign Center не исполняются
Правила L1 сохраняются в базу, но нет edge-функции, которая их обрабатывает. Это "красивая конфигурация" без исполнения.

### 4. Нет реферальной системы
Нет механизма, позволяющего существующим клиентам приводить новых (реферальные ссылки, промокоды, бонусы).

---

## План улучшений (по приоритету)

### Шаг 1: Cron для авто-скоринга клиентских лидов
Создать edge-функцию `auto-lead-scoring`, которая каждые 2 часа:
- Находит новые `consultation_requests` без `ai_score`
- Вызывает `leads-factory/score` для каждого
- Обновляет приоритет и отправляет уведомление админу для "hot" лидов

**Файлы:**
- `supabase/functions/auto-lead-scoring/index.ts` -- новая функция
- SQL cron-задача для запуска каждые 2 часа
- Обновить массив `CRON_JOBS` в `MCCAutomationTab.tsx`

### Шаг 2: Рабочие кнопки связи в Leads Hub
Подключить кнопки Mail/Phone/WhatsApp к реальным действиям:
- **WhatsApp**: Открывать `wa.me/{phone}` с предгенерированным сообщением от AI
- **Email**: Открывать `mailto:{email}` с AI-сгенерированным subject/body
- **Phone**: Открывать `tel:{phone}`
- Логировать каждое касание в `vendor_prospect_activity` или аналогичной таблице

**Файлы:**
- `src/components/admin/marketing/MCCLeadsTab.tsx` -- добавить обработчики
- `src/hooks/useLeadHub.ts` -- добавить мутацию для логирования контакта

### Шаг 3: Движок исполнения Campaign Rules
Создать edge-функцию `execute-campaign-rules`, которая:
- Читает активные правила из `mcc_campaign_rules`
- Сопоставляет с событиями из `mcc_events` за последний интервал
- Проверяет cooldown и quiet hours
- Отправляет push/email/whatsapp через существующую `send-email`
- Логирует каждое выполнение

**Файлы:**
- `supabase/functions/execute-campaign-rules/index.ts` -- новая функция
- SQL cron-задача (каждые 15 минут)
- Обновить `MCCAutomationTab.tsx` с новым cron

### Шаг 4: Простая реферальная система
Таблица `referral_codes` и компонент "Пригласи друга":
- Генерация уникального реферального кода для каждого пользователя
- Лендинг `/ref/{code}` с автоматической привязкой при регистрации
- Начисление бонуса (скидка или кредит) реферу при первом заказе приглашённого
- Виджет в личном кабинете "Поделиться и получить скидку"

**Файлы:**
- Миграция: таблицы `referral_codes`, `referral_rewards`
- `src/pages/ReferralLanding.tsx` -- лендинг
- `src/components/profile/ReferralWidget.tsx` -- виджет
- Обновление маршрутов

---

## Техническая архитектура

```text
                    Cron (2h)
                       |
  consultation_requests --> auto-lead-scoring
                              |
                         leads-factory/score
                              |
                    ai_score + ai_priority
                              |
                    hot? --> notify-admin (email + WhatsApp)

                    Cron (15m)
                       |
  mcc_events -----------> execute-campaign-rules
                              |
                    match rules + check cooldown
                              |
                    send-email / push / whatsapp

  User profile --> referral_codes --> /ref/{code}
                              |
                    new signup --> referral_rewards
```

## Приоритезация

| Шаг | Влияние | Сложность | Рекомендация |
|-----|---------|-----------|--------------|
| 1. Авто-скоринг лидов | Высокое | Низкая | Начать с этого |
| 2. Кнопки связи | Среднее | Низкая | Быстрая победа |
| 3. Движок правил | Высокое | Средняя | Ключевая автоматизация |
| 4. Реферальная система | Высокое | Средняя | Долгосрочный рост |

