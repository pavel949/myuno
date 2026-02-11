

# Desktop Platform — Complete Visual Refinement

## Текущие проблемы (по скриншотам)

1. **Header** — слишком бледный, search pill визуально не выделяется, навигация мелкая
2. **Hero** — фото генеративное и выглядит неестественно, текст на фото плохо читается
3. **PersonaChips** — мелкие, теряются, нет контекста для десктопа
4. **QuickActions** — иконки скученные, подписи мелкие, нет visual hierarchy
5. **Explore карточки** — хорошая структура, но нужны доработки по hover-state и spacing
6. **Нижний блок** (LifeOS + Concierge + Emergency) — три узких столбца, мелкий текст
7. **Footer** — бледный, колонка "Trust" выглядит как заглушка
8. **Общее** — недостаточно контраста, мелкие шрифты, ощущение "сырости"

## Что меняем

### 1. Color System — усиление контраста и теплоты

**Файл: `src/index.css`**

Light mode:
- `--foreground`: `220 15% 18%` -> `220 20% 12%` (темнее, лучше читается)
- `--muted-foreground`: `220 12% 38%` -> `220 14% 32%` (ещё контрастнее)
- `--border`: `40 10% 82%` -> `40 12% 86%` (мягче, но border-b header сделать явным)
- `--card`: добавить тёплый оттенок `40 15% 99%` вместо чистого белого
- `--secondary`: `40 15% 95%` -> `40 18% 96%` (теплее)

Dark mode:
- `--foreground`: `40 10% 92%` -> `40 12% 94%` (ярче)
- Остальное без изменений — dark mode уже хорош

### 2. Header — крупнее, солиднее

**Файл: `src/components/layout/AppHeader.tsx`**

- Desktop height: `lg:h-16` -> `lg:h-[72px]` (больше воздуха)
- Logo: `lg:text-lg` -> `lg:text-xl` для UNO, добавить `font-display`
- Nav links: увеличить до `text-[15px]`, `gap-2` -> `gap-1`, padding `px-4 py-2`
- Search pill: убрать мелкий шрифт `text-sm`, сделать `text-[15px]`, высота `py-2.5`, max-width `max-w-xl`
- Search pill shadow: `shadow-sm` -> `shadow-[0_1px_6px_rgba(0,0,0,0.08)]` (Airbnb-стиль)
- Utilities: увеличить icon buttons до `w-10 h-10`, avatar до `w-9 h-9`
- Border-bottom: `border-border/40` -> `border-border/60` (видимее)

### 3. Hero — убрать генеративное фото, сделать чище

**Файл: `src/components/home/HeroBlock.tsx`**

Вместо случайного фото — чистый "dashboard greeting" без фоновой фотографии на десктопе:
- Фон: `bg-muted/30` с лёгким pattern или просто тёплый solid
- Greeting: `text-3xl` -> `text-4xl`, font-display
- Подзаголовок: `text-lg text-muted-foreground`
- Weather inline рядом с greeting (температура + иконка)
- Справа: аккуратный блок с датой, днём недели, Phuket
- Убрать hero-phuket-desktop.jpg import — нет попсовых фото
- SOS кнопка как subtle pill в правом углу

### 4. PersonaChips — масштабировать для десктопа

**Файл: `src/components/home/PersonaChips.tsx`**

- Desktop: chips крупнее `lg:px-4 lg:py-2 lg:text-sm`, иконки `lg:w-4 lg:h-4`
- Label "Я здесь как:" -> `lg:text-sm` вместо `text-xs`
- Добавить `lg:gap-3` между chips

### 5. QuickActions — равномерный ribbon

**Файл: `src/components/home/QuickActionsGrid.tsx`**

- Desktop: `lg:justify-evenly` вместо `lg:justify-between`
- Labels: `lg:text-xs` -> `lg:text-sm`
- Icon containers: `lg:w-14 lg:h-14` -> `lg:w-16 lg:h-16`
- Icon size: 28px -> 32px на десктопе
- Убрать `lg:border-b` — не нужна линия под ribbon
- Добавить `lg:gap-2` между элементами
- Hover: вместо underline — мягкий `bg-muted/60` background

### 6. Explore — доработка

**Файл: `src/components/home/HomeExploreSections.tsx`**

- Section headers: `lg:text-lg` -> `lg:text-xl`
- Gap: `gap-5` -> `gap-6`
- Cards: rounded-2xl -> `lg:rounded-xl` (менее "мультяшно")
- Overlay gradient: менее агрессивный `from-black/60` -> `from-black/50`
- Title на карточке: `text-lg` -> `text-xl`
- Subtitle: `text-sm` -> `text-[15px]`

### 7. Secondary Section — две колонки вместо трёх

**Файл: `src/pages/Index.tsx`**

Три узких столбца визуально бедные. Переделать:
- Desktop: `lg:grid-cols-3` -> `lg:grid-cols-2`
- LifeOSFocusBar: полная ширина СВЕРХУ (отдельный ряд)
- Concierge + Emergency: 2 колонки
- Trust Banner: полная ширина, увеличить spacing

### 8. LifeOSFocusBar — масштабировать

**Файл: `src/components/home/LifeOSFocusBar.tsx`**

- Desktop: padding `lg:p-5`
- Label "Следующий шаг": `lg:text-xs` (норм)
- Recognition text: `lg:text-[15px]`
- CTA: `lg:text-sm`
- Icon container: `lg:w-12 lg:h-12`

### 9. Emergency — крупнее, readability

**Файл: `src/components/home/EmergencyQuickAccess.tsx`**

- Desktop: `lg:grid-cols-6` (все 6 в один ряд вместо 3x2)
- Icon: `lg:w-12 lg:h-12`, icon внутри `lg:w-6 lg:h-6`
- Label: `lg:text-sm`
- WhatsApp bar: `lg:text-sm`, padding `lg:py-3`

### 10. Footer — профессиональнее

**Файл: `src/components/layout/CompactFooter.tsx`**

- Padding: `py-10` -> `py-12`
- Brand description: `text-sm` -> `text-[15px]`, `leading-relaxed` -> `leading-7`
- Column headers: `text-sm` -> `text-base`
- Links: `text-sm` -> `text-[15px]`, `gap-2` -> `gap-2.5`
- Social icons: `w-8 h-8` -> `w-9 h-9`
- Bottom bar: `text-xs` -> `text-sm`
- Добавить divider line сверху footer: `border-t-2` (жирнее)

### 11. Global Typography — desktop scale

**Файл: `src/index.css`**

Добавить media query для desktop body font size:
```css
@media (min-width: 1024px) {
  body { font-size: 15px; }
}
```

`p` tag: `text-sm` -> responsive `lg:text-base`

## Затрагиваемые файлы

| Файл | Изменение |
|------|-----------|
| `src/index.css` | Контраст, шрифт body, p tag scale |
| `src/components/layout/AppHeader.tsx` | Крупнее header, search, nav, утилиты |
| `src/components/home/HeroBlock.tsx` | Убрать фото, чистый dashboard greeting |
| `src/components/home/PersonaChips.tsx` | Desktop scale |
| `src/components/home/QuickActionsGrid.tsx` | Ribbon: крупнее иконки, labels, hover |
| `src/components/home/HomeExploreSections.tsx` | Крупнее headers, cards |
| `src/pages/Index.tsx` | 2-col вместо 3, FocusBar на всю ширину |
| `src/components/home/LifeOSFocusBar.tsx` | Desktop scale |
| `src/components/home/EmergencyQuickAccess.tsx` | 6-col row, крупнее |
| `src/components/layout/CompactFooter.tsx` | Крупнее типография, spacing |

## Не затрагивается

- Мобильная версия — все изменения через `lg:` breakpoints
- Внутренние страницы (mini-apps) — не затрагиваются
- Backend / данные — только UI
- Dark mode — минимальные правки

