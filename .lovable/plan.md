
# Стратегия лидогенерации: недвижимость и инвестиции

## Бизнес-контекст

Приложение myUNO позиционируется как "единственное приложение, которое нужно за рубежом". Ключевая монетизация — генерация квалифицированных лидов на:
1. **Покупку недвижимости** (off-plan, вторичка)
2. **Инвестиционные проекты** (отели, бизнесы, яхты)

Текущее состояние: существует мощная инфраструктура (`InvestorPromoCard`, `VerticalCTA`, `UniversalLeadForm`, `InterestForm`), но она фрагментирована и не интегрирована в единую воронку.

---

## Стратегия: "Trust-First Lead Funnel"

### Принцип
Пользователь должен получить **ценность и доверие ДО** того, как его попросят оставить контакт. Холодный CTA работает хуже, чем "тёплый" — после взаимодействия с контентом.

### Воронка
```text
┌─────────────────────────────────────────────────────────────┐
│  AWARENESS (Главная страница)                               │
│  └─ InvestorPromoCard — "что это" + социальные доказательства│
├─────────────────────────────────────────────────────────────┤
│  INTEREST (Хаб / Каталоги)                                  │
│  └─ OffplanPromoSection + InvestmentHub                      │
│  └─ Sticky VerticalCTA — эксперт онлайн                      │
├─────────────────────────────────────────────────────────────┤
│  CONSIDERATION (Карточка объекта/проекта)                   │
│  └─ muUNO Score + Risk Analysis + InterestForm              │
├─────────────────────────────────────────────────────────────┤
│  ACTION (Лид-форма)                                         │
│  └─ InvestorLeadForm / UniversalLeadForm с Trust Header     │
└─────────────────────────────────────────────────────────────┘
```

---

## Тактический план

### Этап 1: Главная страница — Точки входа

**1.1 Вернуть InvestorPromoCard**
- **Расположение**: после `SmartWidget`, перед `QuickActionsGrid`
- **Почему здесь**: пользователь уже увидел базовую ценность (погода, события), теперь готов к "продвинутой" опции
- **Формат**: полноширинная карточка с ROI-бейджем, категориями инвестиций, trust-индикаторами

**1.2 Добавить "Investor" персону**
- В `HeroBlock` добавить 4-ю карточку "Инвестор" рядом с Турист/Резидент/Владелец
- При активации — приоритизировать investment-контент в SmartWidget и QuickActions

**1.3 Investment Quick Chip**
- В `QuickAccessChips` уже есть "Invest" — сохранить, но сделать его более заметным (gradient accent)

### Этап 2: Раздел Property — Интеграция покупки

**2.1 Dual-Mode Property Search**
- Добавить переключатель: "Аренда" / "Покупка" в header PropertyIndex
- При режиме "Покупка" — показывать OffplanPromoSection prominently

**2.2 ConsultationCTA с контекстом**
- Уже есть `ConsultationCTA` с `context='rental'|'purchase'`
- Добавить логику: если mode='purchase' → context='purchase'
- Текст: "Хотите купить недвижимость? Наш эксперт подберёт лучшие варианты"

**2.3 Sticky Expert CTA**
- После 3-5 скроллов карточек — показать sticky `VerticalCTA` с variant='sticky'
- "Онлайн эксперт готов помочь с выбором"

### Этап 3: Investment Hub — Максимизация конверсии

**3.1 Hero с Lead Magnet**
- Заменить текущий static hero на интерактивный
- "Получите подборку инвест-проектов под ваш бюджет" — quick form (3 поля)

**3.2 Sticky CTA на всех экранах**
- На `/invest`, `/invest/:id`, `/offplan`, `/offplan/:id`
- `VerticalCTA vertical="investment" variant="sticky"`

**3.3 Exit-Intent Modal**
- При попытке уйти со страницы детального проекта
- "Оставьте контакт — получите детальный анализ проекта"

### Этап 4: Trust-элементы (сквозные)

**4.1 Trust Header для всех форм**
- Добавить в `UniversalLeadForm` и `InvestorLeadForm` шапку с trust-бейджами:
  - "Проверено myUNO" / "Гарантия конфиденциальности" / "Ответ за 24ч"

**4.2 Social Proof Counters**
- На InvestorPromoCard: "150+ сделок в этом году"
- На Investment Hub: "₿ $12M+ инвестиций через платформу"

**4.3 Expert Avatar**
- Персонализированный аватар "Ваш эксперт" в CTAs
- Имя + фото (или иллюстрация) для ощущения human touch

---

## Детализация изменений по файлам

### Главная страница
| Файл | Изменение |
|------|-----------|
| `src/pages/Index.tsx` | Добавить `InvestorPromoCard` между `SmartWidget` и `QuickActionsGrid` |
| `src/components/home/HeroBlock.tsx` | Добавить 4-ю персону "Инвестор" с иконкой `TrendingUp` |
| `src/components/home/InvestorPromoCard.tsx` | Добавить social proof ("150+ сделок") |
| `src/components/home/QuickAccessChips.tsx` | Выделить "Invest" chip акцентным градиентом |

### Свойства (Property)
| Файл | Изменение |
|------|-----------|
| `src/pages/property/PropertyIndex.tsx` | Добавить mode toggle "Аренда/Покупка" |
| `src/pages/property/PropertyIndex.tsx` | Добавить sticky VerticalCTA после скролла |
| `src/components/property/ConsultationCTA.tsx` | Использовать context='purchase' при соответствующем режиме |

### Investment Hub
| Файл | Изменение |
|------|-----------|
| `src/pages/invest/InvestmentIndex.tsx` | Добавить sticky VerticalCTA |
| `src/pages/invest/InvestmentDetail.tsx` | Добавить exit-intent trigger для lead capture |
| `src/components/invest/InvestorLeadForm.tsx` | Добавить Trust Header с бейджами |

### Общие компоненты
| Файл | Изменение |
|------|-----------|
| `src/components/leads/UniversalLeadForm.tsx` | Добавить Trust Header |
| `src/components/leads/VerticalCTA.tsx` | Добавить social proof counter (optional prop) |

---

## Новые компоненты

### InvestorPersonaCard (для HeroBlock)
```text
- Иконка: TrendingUp (золотой градиент)
- Заголовок: "Инвесторам" / "Investors"
- Подзаголовок: "Проекты с ROI до 12%" / "Projects up to 12% ROI"
- При активации: фильтрует контент + показывает investment-related секции
```

### TrustHeader (для форм)
```text
- Компактная строка над формой
- 3 trust-элемента: ✓ Проверено | 🔒 Защита данных | ⚡ 24ч
- Переиспользуется в InvestorLeadForm, UniversalLeadForm, InterestForm
```

### SocialProofCounter
```text
- "150+ сделок в 2024"
- "₿ $12M+ через платформу"
- Анимированный counter при появлении в viewport
```

---

## Метрики успеха

| Метрика | Текущее (оценка) | Цель |
|---------|------------------|------|
| Клики на InvestorPromoCard | N/A | Track |
| Конверсия форма → лид | ~2-5% | 8-12% |
| Время до первого лида | >5 мин | <2 мин |
| Лидов с главной страницы | ~10% | 30% |

---

## Приоритеты реализации

### Фаза 1 (Быстрые победы)
1. Вернуть InvestorPromoCard на главную
2. Добавить Trust Header в формы
3. Добавить sticky VerticalCTA на /invest и /property

### Фаза 2 (Средний приоритет)
4. Добавить персону "Инвестор" в HeroBlock
5. Dual-mode переключатель на PropertyIndex
6. Social proof counters

### Фаза 3 (Расширение)
7. Exit-intent модалки
8. A/B тестирование позиционирования CTA
9. Персонализация на основе поведения

---

## Техническая секция

### Структура данных для аналитики
```typescript
// Добавить в consultation_requests
vertical_metadata: {
  entry_source: 'home_promo_card' | 'property_cta' | 'invest_sticky' | ...,
  scroll_depth: number, // % страницы до клика
  time_on_page: number, // секунды
  persona_active: UserPersona[],
}
```

### Миграция БД
- Не требуется — используем существующую схему `consultation_requests`
- Опционально: добавить `social_proof_stats` таблицу для динамических счётчиков

### Производительность
- InvestorPromoCard уже мемоизирован
- VerticalCTA lazy-загружается
- Sticky CTA появляется после Intersection Observer trigger (не влияет на LCP)
