
# План: Промо-карточка "Инвесторам" с Lead Generation

## Концепция

Создать привлекательную полноширинную карточку под тремя AudienceCards, которая:

1. **Визуально выделяется** — градиент, иконки, premium-вид
2. **Собирает лиды** — при клике открывает форму регистрации интереса
3. **Не требует авторизации** — минимальные поля для первого контакта
4. **Квалифицирует инвестора** — собираем бюджет, интерес, контакт

---

## Визуальный дизайн

```text
ТЕКУЩИЙ HEROBLOCK:
┌─────────────────────────────────────────────────────────────────────┐
│  [myUNO brand + headline]                                           │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│  │ ✈️ Туристам │ │ 🏠 Резидентам│ │ 🏢 Владельцам│                   │
│  └─────────────┘ └─────────────┘ └─────────────┘                   │
│                                                                     │
│  [Trust badges]                                                     │
│  [Search]                                                           │
│  [UNO Alert]                                                        │
└─────────────────────────────────────────────────────────────────────┘

НОВЫЙ HEROBLOCK (с промо-карточкой):
┌─────────────────────────────────────────────────────────────────────┐
│  [myUNO brand + headline]                                           │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│  │ ✈️ Туристам │ │ 🏠 Резидентам│ │ 🏢 Владельцам│                   │
│  └─────────────┘ └─────────────┘ └─────────────┘                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐
│  │ 📈 ИНВЕСТИЦИИ В ПХУКЕТ                          [до 12% ROI] →  │
│  │                                                                  │
│  │ 🏗️ Новостройки  •  🏨 Отели  •  💼 Бизнес                       │
│  │                                                                  │
│  │ Получите экспертный анализ и доступ к закрытым сделкам         │
│  │                                                                  │
│  │ ⭐ muUNO Scoring  •  📊 Due Diligence  •  🤝 Сопровождение      │
│  └─────────────────────────────────────────────────────────────────┘
│                                                                     │
│  [Trust badges]                                                     │
│  [Search]                                                           │
│  [UNO Alert]                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Форма сбора лидов (Lead Capture Dialog)

При клике на карточку открывается простая форма:

```text
┌───────────────────────────────────────────────────────────────────┐
│  📈 Инвестиции в недвижимость Пхукета                             │
│                                                                    │
│  Получите персональную консультацию от экспертов muUNO            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Что вас интересует? (множественный выбор)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │ 🏗️ Новостройки│ │ 🏨 Отели     │ │ 💼 Бизнес    │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
│                                                                    │
│  Планируемый бюджет (USD)                                         │
│  [▼ Выберите диапазон                                   ]         │
│  • $50,000 - $150,000                                              │
│  • $150,000 - $500,000                                             │
│  • $500,000 - $1,000,000                                           │
│  • $1,000,000+                                                     │
│                                                                    │
│  Имя *                                                             │
│  [                                                       ]         │
│                                                                    │
│  Email или телефон *                                               │
│  [                                                       ]         │
│                                                                    │
│  Комментарий (опционально)                                         │
│  [                                                       ]         │
│                                                                    │
│  ☐ Согласен на обработку персональных данных                      │
│                                                                    │
│  [     Получить консультацию     ]                                │
│                                                                    │
│  🔒 Данные защищены. Ответим в течение 24 часов.                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Архитектура компонентов

```text
src/components/home/
├── HeroBlock.tsx                    # UPDATE: добавить InvestorPromoCard
└── InvestorPromoCard.tsx            # NEW: промо-карточка + dialog

src/components/invest/
└── InvestorLeadForm.tsx             # NEW: форма сбора лидов
```

---

## Фаза 1: Промо-карточка InvestorPromoCard.tsx

### Дизайн карточки

```typescript
// Визуальные элементы:
- Градиентный фон: from-purple-600/10 via-violet-500/10 to-indigo-600/10
- Иконка TrendingUp в круге
- Заголовок + Badge "до 12% ROI"
- Теги категорий (Новостройки, Отели, Бизнес)
- Подзаголовок с value proposition
- Trust indicators (Scoring, Due Diligence, Сопровождение)
- Стрелка ChevronRight справа
- Hover эффект: подсветка границы
```

### Поведение при клике

```typescript
onClick = () => {
  // Открыть Dialog с формой
  setIsDialogOpen(true);
  
  // Аналитика
  trackEvent('investor_promo_clicked', { location: 'hero_block' });
}
```

---

## Фаза 2: Форма сбора лидов InvestorLeadForm.tsx

### Поля формы

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| interests | checkbox[] | Да (min 1) | Новостройки, Отели, Бизнес, Другое |
| budget_range | select | Нет | Диапазон бюджета |
| name | text | Да | Имя |
| contact | text | Да | Email или телефон |
| notes | textarea | Нет | Комментарий |
| consent | checkbox | Да | Согласие на обработку данных |

### Сохранение данных

Использовать существующую таблицу `consultation_requests` с vertical_id = 'investment':

```typescript
const submitLead = async (data: InvestorLeadData) => {
  await supabase.from('consultation_requests').insert({
    vertical_id: 'investment',
    entry_point: 'hero_promo_card',
    lead_source: 'organic',
    name: data.name,
    contact_method: isEmail(data.contact) ? 'email' : 'phone',
    email: isEmail(data.contact) ? data.contact : null,
    phone: !isEmail(data.contact) ? data.contact : null,
    notes: data.notes,
    vertical_metadata: {
      interests: data.interests,
      budget_range: data.budgetRange,
    },
    status: 'new',
  });
};
```

---

## Фаза 3: Интеграция в HeroBlock.tsx

### Расположение

```tsx
{/* Audience Cards */}
<div className="flex gap-2">
  {audienceCards.map((card) => (
    <AudienceCard key={card.id} {...card} />
  ))}
</div>

{/* NEW: Investor Promo Card */}
<InvestorPromoCard />

{/* Trust badges */}
<div className="flex flex-wrap items-center justify-center gap-1.5">
  {badges.map(...)}
</div>
```

---

## Фаза 4: Добавить investor vertical в lookup_values

```sql
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order)
VALUES ('vertical', 'investment', 'Investment', 'Инвестиции', '📈', 15)
ON CONFLICT (lookup_type, value_key) DO NOTHING;
```

---

## Файлы для создания/изменения

| Файл | Тип | Описание |
|------|-----|----------|
| `src/components/home/InvestorPromoCard.tsx` | NEW | Промо-карточка с Dialog |
| `src/components/invest/InvestorLeadForm.tsx` | NEW | Форма сбора лидов |
| `src/components/home/HeroBlock.tsx` | UPDATE | Добавить InvestorPromoCard |
| `supabase/migrations/xxx.sql` | NEW | Добавить vertical 'investment' |

---

## Дизайн-токены карточки

```typescript
// Цветовая схема
const colors = {
  gradient: 'from-purple-600/10 via-violet-500/10 to-indigo-600/10',
  border: 'border-purple-500/30 hover:border-purple-500/50',
  iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
  badge: 'bg-emerald-500 text-white',
};

// Анимация
const animation = {
  hover: 'hover:shadow-lg hover:shadow-purple-500/10',
  tap: 'active:scale-[0.99]',
};
```

---

## Аналитика и метрики

### События для отслеживания

| Событие | Когда | Данные |
|---------|-------|--------|
| `investor_promo_viewed` | Карточка в viewport | - |
| `investor_promo_clicked` | Клик на карточку | - |
| `investor_lead_form_opened` | Dialog открыт | - |
| `investor_lead_submitted` | Форма отправлена | interests, budget_range |
| `investor_lead_abandoned` | Dialog закрыт без отправки | step |

---

## Мобильная адаптация

```text
МОБИЛЬНЫЙ ВИД:
┌─────────────────────────────────────────────────┐
│  [myUNO brand]                                  │
│                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Туристам │ │Резидент │ │Владелец │           │
│  └─────────┘ └─────────┘ └─────────┘           │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 📈 Инвестиции в Пхукет         [12% ROI]→ │ │
│  │                                           │ │
│  │ 🏗️ Новостройки • 🏨 Отели • 💼 Бизнес    │ │
│  │                                           │ │
│  │ Экспертный анализ и закрытые сделки      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Trust badges]                                 │
│  [Search]                                       │
│  [UNO Alert]                                    │
└─────────────────────────────────────────────────┘
```

---

## Преимущества решения

1. **Не ломает текущий UI** — добавляется между карточками и badges
2. **Lead Generation** — собираем контакты без обязательной регистрации
3. **Квалификация** — знаем бюджет и интересы до звонка
4. **Интеграция** — используем существующую систему consultation_requests
5. **Аналитика** — полный трекинг воронки
6. **Масштабируемость** — легко добавить A/B тесты

---

## Техническое резюме

| Метрика | Значение |
|---------|----------|
| Новые компоненты | 2 (InvestorPromoCard, InvestorLeadForm) |
| Обновляемые файлы | 1 (HeroBlock.tsx) |
| Миграции БД | 1 (lookup_values) |
| Использует существующее | consultation_requests, Dialog, Input |
| Риск регрессии | Минимальный — additive change |
| Время реализации | ~1-2 часа |
