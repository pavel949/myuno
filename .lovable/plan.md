
# План: Unified Lead System (Единая система лидов по вертикалям)

## ✅ Фаза 1: ВЫПОЛНЕНО

### Реализованные компоненты:

| Файл | Статус | Описание |
|------|--------|----------|
| `migration` | ✅ | Добавлены vertical_id, vertical_metadata, entry_point, lead_source в consultation_requests |
| `src/lib/leadVerticalConfig.ts` | ✅ | Конфиг 12 вертикалей с динамическими полями форм |
| `src/components/fab/UniversalHelpFAB.tsx` | ✅ | Глобальная FAB-кнопка на всех страницах |
| `src/components/leads/UniversalLeadForm.tsx` | ✅ | Многошаговая форма с динамическими полями |
| `src/components/leads/VerticalCTA.tsx` | ✅ | CTA компонент с 5 вариантами отображения |
| `src/hooks/useUniversalLead.ts` | ✅ | Хук для сабмита лидов |
| `src/hooks/useConsultationRequests.ts` | ✅ | Расширены типы запросов |
| `src/components/layout/AppLayout.tsx` | ✅ | Интегрирован UniversalHelpFAB |

### Покрытые вертикали (12):
- 🏠 Properties (vacation_rental, long_term, purchase, tour, investment)
- 🚤 Yachts (charter, multiday, party, purchase)
- 🗺️ Tours (island, city, adventure, custom)
- 🚗 Transport (car, bike, driver, airport)
- ⚖️ Legal (visa, property, business, general)
- 🏥 Medical (doctor, dental, checkup, emergency)
- 👶 Babysitters (hourly, daily, longterm)
- 💇 Beauty & Spa (spa, hair, nails, beauty)
- 🏋️ Fitness (daypass, membership, trainer, yoga)
- 🏄 Water Sports (diving, snorkeling, jet_ski, surfing)
- 🍽️ Restaurants (table, private_event, recommendation)
- 💬 Other (general_inquiry)

### Функционал:
- ✅ FAB кнопка видна на всех страницах (кроме /admin)
- ✅ Контекстное определение вертикали по URL
- ✅ Динамические поля формы по выбранной вертикали
- ✅ Сохранение в consultation_requests с vertical_id и vertical_metadata
- ✅ Трекинг источника (lead_source) и точки входа (entry_point)

---

## 📋 Фаза 2: Интеграция (следующий спринт)

### Задачи:

1. **Добавить VerticalCTA на страницы вертикалей**
   - /yachts → `<VerticalCTA vertical="yachts" />`
   - /tours → `<VerticalCTA vertical="tours" />`
   - /transport → `<VerticalCTA vertical="vehicles" />`
   - и т.д.

2. **AI Auto-routing**
   - AI определяет вертикаль по свободному тексту
   - Маршрутизация на нужного менеджера по специализации

3. **MCC Lead Hub Integration**
   - Фильтр по vertical_id в админке
   - Статистика по источникам (fab vs cta vs organic)
   - Dashboard с конверсией по вертикалям

4. **WhatsApp/Telegram Bot**
   - Приём заявок через мессенджеры
   - lead_source='chat'

---

## 📋 Фаза 3: Оптимизация

5. **Smart Suggestions**
   - Предложения на основе истории просмотров
   - "Вы смотрели виллы в Раваи — нужна помощь с выбором?"

6. **Lead Scoring по вертикалям**
   - Разные веса для разных вертикалей
   - Hot/Warm/Cold приоритизация

---

## Архитектура

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         UNIVERSAL LEAD HUB                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │ UniversalFAB│   │ VerticalCTA │   │ QuickChat   │   │ ExternalAPI │       │
│  │   (global)  │   │(per page)   │   │  Widget     │   │ (partners)  │       │
│  │     ✅      │   │     ✅      │   │   TODO      │   │   TODO      │       │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
│         │                 │                 │                 │              │
│         └────────────────┴─────────────────┴─────────────────┘              │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              UniversalLeadForm (unified intake) ✅                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                   consultation_requests (extended) ✅                 │   │
│  │  + vertical_id | + vertical_metadata | + lead_source | + entry_point │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Ожидаемый эффект

- **+40-60% конверсия** в заявки (FAB доступен везде)
- **-80% хаос** (единая таблица для всех лидов)
- **+100% покрытие** (все 12 вертикалей)
- **Полная трассировка** (откуда пришёл, что смотрел)
