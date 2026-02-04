
# План: Дашборд инвестора

## Концепция

Создаём персональный кабинет инвестора по адресу `/invest/dashboard`, где пользователь видит:
- Активные заявки на инвестиции и их статусы
- Сводку по интересующим проектам
- Общую аналитику (потенциальный ROI, суммы)
- Быстрые действия

## Визуальный дизайн

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  /invest/dashboard                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  👋 Добро пожаловать, [Имя]                                            │ │
│  │  ───────────────────────────────────────────────────────────────────── │ │
│  │  📊 3 активных заявки  •  $250,000 общий интерес  •  18% avg ROI       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Quick Actions ────────────────────────────────────────────────────────┐ │
│  │  [🔍 Найти проект]  [📞 Связаться]  [📄 Документы]  [💼 Каталог]       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Мои заявки ───────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │ │
│  │  │  🏢 Ocean View Villas            📍 Kamala                        │ │ │
│  │  │  ─────────────────────────────────────────────────────────────── │ │ │
│  │  │  Тип: Инвестиция  •  $50,000 USD                                  │ │ │
│  │  │  Статус: 🟡 В обработке         Создано: 2 дня назад              │ │ │
│  │  │  ─────────────────────────────────────────────────────────────── │ │ │
│  │  │  [Подробнее] [Отменить заявку]                                    │ │ │
│  │  └───────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                         │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │ │
│  │  │  🏨 Boutique Hotel Phuket         📍 Kata                          │ │ │
│  │  │  Тип: Узнать больше                                               │ │ │
│  │  │  Статус: 🟢 Менеджер связался                                      │ │ │
│  │  └───────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Рекомендуемые проекты ────────────────────────────────────────────────┐ │
│  │  [Карусель InvestmentCard по matching categories]                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Фазы реализации

### Фаза 1: Расширить хук useInvestmentInterest

Добавить JOIN с проектами для получения полной информации:

```typescript
// useInvestmentInterest.ts - extend query
const { data: userInterests } = useQuery({
  queryKey: ['investment-interests', 'user-full', user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('investment_interests')
      .select(`
        *,
        project:investment_projects (
          id, title_en, title_ru, cover_image,
          roi_projected, muuno_score, district, project_type
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    // ...
  }
});
```

---

### Фаза 2: Создать виджеты дашборда

```text
src/components/investor/dashboard/
├── InvestorWelcomeCard.tsx     — Приветствие + сводная статистика
├── InvestorQuickActions.tsx    — Быстрые действия
├── InvestorInterestsList.tsx   — Список заявок со статусами
├── InvestorInterestCard.tsx    — Карточка одной заявки
├── InvestorRecommendations.tsx — Рекомендованные проекты
└── index.ts
```

---

### Фаза 3: Создать страницу InvestorDashboard

```typescript
// src/pages/invest/InvestorDashboard.tsx
export default function InvestorDashboard() {
  const { user } = useAuth();
  
  if (!user) {
    return <InvestorAuthPrompt />;
  }

  return (
    <MiniAppLayout title="Мои инвестиции">
      <div className="space-y-6">
        <InvestorWelcomeCard />
        <InvestorQuickActions />
        <InvestorInterestsList />
        <InvestorRecommendations />
      </div>
    </MiniAppLayout>
  );
}
```

---

### Фаза 4: Интегрировать маршрут и навигацию

1. **AnimatedRoutes.tsx** — добавить `/invest/dashboard`
2. **InvestmentIndex.tsx** — добавить кнопку "Мой кабинет" в хедер
3. **AdaptiveBottomNav** — показывать для персоны "investor"

---

## Статусы заявок (визуальные)

| Status | Label RU | Label EN | Color |
|--------|----------|----------|-------|
| `new` | Новая | New | 🔵 Blue |
| `contacted` | Связались | Contacted | 🟢 Green |
| `in_progress` | В работе | In Progress | 🟡 Amber |
| `documents_sent` | Документы | Documents Sent | 🟣 Purple |
| `completed` | Завершено | Completed | ✅ Green |
| `cancelled` | Отменено | Cancelled | ⚫ Gray |

---

## Сводная статистика (WelcomeCard)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Рассчитывается на клиенте из userInterests:                                │
│                                                                              │
│  • Активные заявки: count where status NOT IN (completed, cancelled)        │
│  • Общий интерес: SUM(preferred_amount)                                      │
│  • Средний ROI: AVG(project.roi_projected) where interest exists            │
│  • Категории: уникальные project_type                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Файлы для создания/изменения

| Файл | Тип | Описание |
|------|-----|----------|
| `src/pages/invest/InvestorDashboard.tsx` | NEW | Главная страница дашборда |
| `src/components/investor/dashboard/InvestorWelcomeCard.tsx` | NEW | Приветствие + статистика |
| `src/components/investor/dashboard/InvestorQuickActions.tsx` | NEW | Быстрые действия |
| `src/components/investor/dashboard/InvestorInterestsList.tsx` | NEW | Список заявок |
| `src/components/investor/dashboard/InvestorInterestCard.tsx` | NEW | Карточка заявки |
| `src/components/investor/dashboard/InvestorRecommendations.tsx` | NEW | Рекомендации |
| `src/components/investor/dashboard/index.ts` | NEW | Экспорты |
| `src/hooks/useInvestmentInterest.ts` | UPDATE | Добавить JOIN с проектами |
| `src/components/layout/AnimatedRoutes.tsx` | UPDATE | Добавить маршрут |
| `src/pages/invest/InvestmentIndex.tsx` | UPDATE | Кнопка "Мой кабинет" |
| `src/pages/invest/index.ts` | UPDATE | Экспорт нового компонента |

---

## Технические особенности

1. **Защита маршрута** — `/invest/dashboard` требует авторизации
2. **Паттерн OwnerDashboard** — используем Suspense + Skeleton для секций
3. **Real-time опционально** — можно добавить подписку на изменение статусов
4. **Билингвальность** — все тексты через `isRu`

---

## Расширения (будущее)

- 📈 **Портфельная аналитика** — когда появятся реальные инвестиции
- 📄 **Документы** — доступ к договорам и due diligence
- 💬 **Чат с менеджером** — персональная связь
- 🔔 **Уведомления** — push о смене статуса

---

## Порядок реализации

1. **useInvestmentInterest** — расширить с JOIN
2. **Виджеты dashboard/** — компоненты
3. **InvestorDashboard** — страница
4. **AnimatedRoutes** — маршрут
5. **InvestmentIndex** — кнопка входа в дашборд
6. **Тестирование** — проверка flow авторизованного пользователя

---

## Техническое резюме

| Метрика | Значение |
|---------|----------|
| Новые компоненты | 7 |
| Обновляемые файлы | 4 |
| Сложность | Средняя |
| Риск регрессии | Низкий |
| Время реализации | ~2-3 часа |
