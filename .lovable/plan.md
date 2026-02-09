

# Обогащение Home-экрана: из "пустой страницы" в "живой суперапп"

## Проблема

Сейчас Home (`/`) содержит только:

```text
1. Hero (логотип + поиск + SOS)
2. LifeSituation Selector (сетка ситуаций)
3. DiscoveryCarousel (1 карусель экспириенсов)
```

Три блока -- это не главная страница суперапп-платформы с 29 сервисами. Пользователь видит "пустоту" и не понимает масштаб возможностей.

## Решение: +4 новых секции

Итоговая структура сверху вниз:

```text
1. Hero (логотип + поиск + SOS)             -- уже есть
2. LifeSituation Selector / PersonaChips     -- уже есть
3. [NEW] Quick Access Strip                  -- горизонтальная строка 5 популярных сервисов
4. [NEW] Concierge Banner                   -- "Нужна помощь? Напишите менеджеру"
5. DiscoveryCarousel                         -- уже есть
6. [NEW] Popular Services Row               -- "Популярные услуги" (2 строки по 4)
7. [NEW] Trust & Stats Banner               -- "500+ услуг / 100+ партнёров / 24/7"
```

---

## Блок 3: Quick Access Strip

Горизонтальная полоса из 5 pill-кнопок для самых частых запросов.

| Сервис | Иконка | Маршрут |
|--------|--------|---------|
| Transfers | Plane | /transfers |
| Real Estate | Home | /properties |
| Healthcare | Stethoscope | /medical |
| Things To Do | Compass | /experiences |
| Car Rental | Car | /vehicles |

Стиль: компактные pill (иконка + label), горизонтальный scroll на мобильных, wrap на десктопе.

**Новый файл**: `src/components/home/QuickAccessStrip.tsx`

---

## Блок 4: Concierge Banner

Компактный баннер-карточка с CTA на WhatsApp (+66922407355):
- Иконка MessageCircle
- Текст: "Need help? Our manager will reply in 15 min" / "Нужна помощь? Менеджер ответит за 15 минут"
- Кнопка: "Write to WhatsApp" / "Написать в WhatsApp"
- Стиль: мягкий gradient, rounded-2xl, border

**Новый файл**: `src/components/home/ConciergeBanner.tsx`

---

## Блок 6: Popular Services Row

Сетка 2x4 (8 иконок) из самых ходовых категорий, выбранных из VERTICAL_GROUPS:
- Yacht Charter, Beauty, Restaurants, Fitness
- Flower Delivery, Water Sports, Events, Insurance

Каждый item: иконка в круге + label снизу. По клику -- навигация на вертикаль.
Внизу -- кнопка "All Services" ведущая на /discover.

**Новый файл**: `src/components/home/PopularServicesRow.tsx`

---

## Блок 7: Trust & Stats Banner

Статическая полоска с 3 метриками:

| Метрика | EN | RU |
|---------|----|----|
| 500+ | Services | Услуг |
| 100+ | Verified Partners | Проверенных партнёров |
| 24/7 | Support | Поддержка |

Стиль: горизонтальная строка с разделителями, text-muted, компактный.

**Новый файл**: `src/components/home/TrustBanner.tsx`

---

## Изменения в Index.tsx

Добавляем 4 новых lazy-компонента в существующую структуру:

```text
<HeroBlock />
<LifeSituationSelector /> / <PersonaChips />
<QuickAccessStrip />        -- NEW
<ConciergeBanner />          -- NEW
<DiscoveryCarousel />
<PopularServicesRow />       -- NEW
<TrustBanner />              -- NEW
```

---

## Файлы

| Файл | Действие |
|------|----------|
| `src/components/home/QuickAccessStrip.tsx` | Создать |
| `src/components/home/ConciergeBanner.tsx` | Создать |
| `src/components/home/PopularServicesRow.tsx` | Создать |
| `src/components/home/TrustBanner.tsx` | Создать |
| `src/pages/Index.tsx` | Добавить 4 компонента |

## Что НЕ меняется

- Роуты
- Навигация (4 таба)
- Verticals / Groups
- База данных
- LifeOS логика

