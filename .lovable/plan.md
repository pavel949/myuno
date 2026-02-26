

# Микроэффекты для главной страницы — в стиле myUNO

## Принцип

Все эффекты подчиняются бренд-буку: "Как этот эффект снижает тревогу?" Никаких декоративных анимаций ради анимаций. Только те, что дают обратную связь, направляют внимание или создают ощущение "всё под контролем".

## Что добавить

### 1. Scroll-triggered reveal для секций главной

Секции (Quick Actions, YourDayFeed, Solutions, Trust) появляются плавно при скролле вместо мгновенного рендера. Используем `IntersectionObserver` через легковесный хук `useScrollReveal`.

- Эффект: `opacity 0 -> 1` + `translateY(12px -> 0)` за 300ms
- Порог: 15% видимости элемента
- Однократно (не реверсируется при скролле вверх)
- Реализация: обёртка `<RevealOnScroll>` в `Index.tsx` вокруг каждой секции

### 2. Staggered появление Quick Actions

8 иконок Quick Actions появляются каскадом (50ms между каждой) вместо одновременного рендера. Создаёт ощущение "система загружается для вас".

- Реализация: добавить `framer-motion` stagger в `QuickActionsGrid.tsx` с использованием существующих `staggerContainerVariants` / `staggerItemVariants` из `motionPresets.ts`

### 3. Skeleton-to-content crossfade

В `YourDayFeed` и других блоках с загрузкой, заменить мгновенное переключение skeleton -> content на плавный `opacity` переход (200ms).

- Реализация: обернуть контент в `<motion.div>` с `fadeInVariants` из `motionPresets.ts`

### 4. Hover-эффект на карточках YourDayFeed

Карточки дня (`DayItemCard`) при наведении слегка приподнимаются (`-translate-y-0.5`) с усилением тени. Уже есть `hover:shadow-md`, добавить `hover:-translate-y-0.5 transition-all duration-150`.

### 5. Число провайдеров в TrustBanner — анимированный счётчик

Когда число загружается (от `...` до реального числа), оно плавно "проявляется" через opacity-переход. Простой и элегантный, без "бегущих цифр".

---

## Что НЕ делать (по бренд-буку)

- Нет parallax-эффектов
- Нет bouncing/pulsing анимаций
- Нет цветных градиентных переходов
- Нет анимированных иконок (вращение, покачивание)

---

## Технический план

### Файл 1 (новый): `src/hooks/useScrollReveal.ts`
Хук на `IntersectionObserver`, возвращает `ref` и `isVisible`. Респектует `prefers-reduced-motion`.

### Файл 2 (новый): `src/components/ui/RevealOnScroll.tsx`
Обёртка-компонент: принимает `children`, рендерит с `opacity/transform` анимацией при пересечении viewport.

### Файл 3: `src/pages/Index.tsx`
Обернуть каждую секцию (QuickActions, Grid, Products, Trust) в `<RevealOnScroll>`.

### Файл 4: `src/components/home/QuickActionsGrid.tsx`
Добавить `motion.div` container + stagger для кнопок Quick Actions.

### Файл 5: `src/components/shared/YourDayFeed.tsx`
Добавить `motion.div` с `fadeInVariants` при переходе от skeleton к контенту. Добавить `hover:-translate-y-0.5` на `DayItemCard`.

### Файл 6: `src/components/home/TrustBanner.tsx`
Добавить `transition-opacity` на значение счётчика провайдеров.

### Результат
5 тонких, целенаправленных эффектов. Все respektируют `prefers-reduced-motion`. Все соответствуют принципу "confident, clean, premium".
