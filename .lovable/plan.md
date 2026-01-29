
# План: Профессиональный SuperApp UI

## Текущие проблемы

### 1. Визуальный шум и дублирование
- **QuickActionsGrid** (10 кнопок) + **allCategories** (15 кнопок) = 25 кнопок сервисов
- 7 категорий показаны дважды (недвижимость, цветы, транспорт, медицина, рестораны, события, вода)
- Два CTA блока подряд (Owner + Provider) перегружают экран

### 2. Непрофессиональный layout
- Hero-секция занимает много места с минимальной пользой
- Слишком много градиентных кнопок конкурируют за внимание
- Нет чёткой визуальной иерархии как у Grab/Gojek/Alipay

---

## Референс: SuperApp UI паттерны

```text
┌─────────────────────────────────────┐
│  HEADER: Logo + Search + Icons      │  ← Компактный, sticky
├─────────────────────────────────────┤
│  SERVICES GRID: 8-10 иконок         │  ← 2 ряда, чистые иконки
│  [🚤] [✈️] [🌸] [🏠] [🍽️]          │
│  [🎫] [🩺] [🚨] [📦] [•••]          │  ← Последняя = "Ещё"
├─────────────────────────────────────┤
│  PROMO BANNER: Карусель             │  ← 1 активный баннер
├─────────────────────────────────────┤
│  QUICK ACCESS: Горизонтальный скролл│  ← Для владельцев/провайдеров
├─────────────────────────────────────┤
│  RECOMMENDATIONS: Карточки          │  ← Персонализированные
└─────────────────────────────────────┘
```

---

## Что меняем

### Файл 1: `src/pages/Index.tsx`

**Удаляем:**
- Hero-секцию с логотипом myUNO (строки 180-207) — логотип уже в header
- Секцию allCategories (GROUP 4, строки 316-365) — дублирует QuickActions
- Provider CTA блок (строки 278-310) — перенесём в профиль

**Оставляем:**
- Search bar (интегрируем в более компактный вид)
- SmartWidget (погода + события)
- QuickActionsGrid (оптимизируем)
- PromoBanner
- Owner CTA (единственный, компактнее)
- Рекомендации

### Файл 2: `src/components/home/QuickActionsGrid.tsx`

**Редизайн на 2 ряда × 5 колонок:**

| Ряд 1 | Яхты | Трансфер | Цветы | Недвижимость | Рестораны |
|-------|------|----------|-------|--------------|-----------|
| Ряд 2 | Туры | Медицина | SOS | Маркет | **Ещё** |

- Убираем badges с большинства кнопок (только SOS оставляем 24/7)
- Увеличиваем иконки до 12×12 (сейчас 11×11)
- Кнопка "Ещё" ведёт на `/discover`
- Убираем дубли (car-rental объединяем с transfer)

### Файл 3: `src/components/layout/AppHeader.tsx`

**Интегрируем search в header:**
- Добавляем кликабельную строку поиска между логотипом и иконками
- Убираем поиск из body страницы

### Файл 4: `src/components/home/SmartWidget.tsx`

**Компактнее:**
- Уменьшаем padding с p-4 до p-3
- Убираем декоративные blur-элементы
- Делаем более плоский дизайн

### Файл 5: Owner CTA → Компактный чип

**Было:** Большой градиентный блок 80px высотой
**Станет:** Компактная кнопка-чип в секции Quick Access

---

## Новая структура Index.tsx

```text
1. SearchHeader (встроен в AppHeader)
2. SmartWidget (компактный)
3. QuickActionsGrid (10 иконок, 2 ряда)
4. ── визуальный разделитель ──
5. PromoBanner (без изменений)
6. QuickAccessChips (Owner + Provider как чипы)
7. ── визуальный разделитель ──
8. RecommendedCarousel
9. PersonalizedOffers
10. ForYouSection
11. ProductSection
12. Trust Footer
```

---

## Визуальные улучшения

### Иконки сервисов
- Размер: 48×48px (сейчас 44×44)
- Убираем пёстрые градиенты, используем монохромные с accent
- Тень: убираем (cleaner look)

### Цветовая схема
- Primary services: Белый фон + primary border при hover
- SOS: Красный акцент (единственный яркий)
- Остальные: Нейтральные иконки

### Типографика
- Labels: 11px → 10px (компактнее)
- Убираем line-clamp-2, делаем однострочные названия

---

## Результат

| Метрика | Было | Станет |
|---------|------|--------|
| Кнопок сервисов | 25 | 10 |
| CTA блоков | 2 больших | 2 чипа |
| Hero секция | 120px | 0px |
| Scroll до контента | 3 экрана | 1 экран |
| Дублирование | 7 категорий | 0 |

---

## Технические детали

### QuickActionsGrid новый массив

```typescript
const quickActions = [
  { id: 'yachts', icon: Anchor, path: '/yachts', gradient: 'bg-cyan-500/10 text-cyan-500' },
  { id: 'transfer', icon: Plane, path: '/transport/airport', gradient: 'bg-indigo-500/10 text-indigo-500' },
  { id: 'flowers', icon: Flower2, path: '/flowers', gradient: 'bg-rose-500/10 text-rose-500' },
  { id: 'property', icon: Home, path: '/property', gradient: 'bg-teal-500/10 text-teal-500' },
  { id: 'restaurants', icon: Utensils, path: '/restaurants', gradient: 'bg-orange-500/10 text-orange-500' },
  { id: 'tours', icon: Compass, path: '/tours', gradient: 'bg-amber-500/10 text-amber-500' },
  { id: 'medical', icon: Stethoscope, path: '/medical', gradient: 'bg-emerald-500/10 text-emerald-500' },
  { id: 'sos', icon: AlertTriangle, path: '/sos', gradient: 'bg-red-500/10 text-red-500', badge: '24/7' },
  { id: 'market', icon: ShoppingBag, path: '/market', gradient: 'bg-amber-500/10 text-amber-500' },
  { id: 'more', icon: MoreHorizontal, path: '/discover', gradient: 'bg-muted text-muted-foreground' },
];
```

### QuickAccessChips компонент

```tsx
<div className="flex gap-2 overflow-x-auto scrollbar-hide">
  <Chip icon={Building2} onClick={() => navigate('/owner/landing')}>
    {isRu ? 'Владельцам' : 'For Owners'}
  </Chip>
  <Chip icon={Sparkles} onClick={() => navigate('/provider/onboarding')}>
    {isRu ? 'Стать партнёром' : 'Become Partner'}
  </Chip>
  <Chip icon={Wallet} onClick={() => navigate('/wallet')}>
    {isRu ? 'Кошелёк' : 'Wallet'}
  </Chip>
</div>
```

---

## Порядок реализации

1. Редизайн `QuickActionsGrid.tsx` — 10 иконок в 2 ряда
2. Упрощение `Index.tsx` — удаление Hero и allCategories
3. Создание `QuickAccessChips.tsx` — компактные CTA
4. Обновление `SmartWidget.tsx` — компактнее
5. Интеграция поиска в `AppHeader.tsx`
