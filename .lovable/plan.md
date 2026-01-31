
# План: Улучшение контрастности и читаемости UX

## Обзор проблемы

После анализа кодовой базы выявлены следующие проблемы с контрастностью:

### Проблема 1: Золотой текст на светлом фоне
- **Класс `text-gradient-gold`** используется для заголовков в HeroBanner, Auth, AppHeader
- В светлой теме золотой градиент (`hsl(43 74% 49%)` ~ `#C9A227`) имеет **недостаточный контраст** на белом фоне
- Соотношение контраста ~2.8:1 (требуется минимум 4.5:1 для текста, 3:1 для крупного текста)

### Проблема 2: Переключатели (Tabs/Toggle) малозаметны
- **ContentModeToggle** и **TabsList**: неактивные вкладки имеют класс `text-muted-foreground` на `bg-muted`
- Контраст между состояниями "активно/неактивно" недостаточен
- Нет чёткой визуальной границы между вкладками

### Проблема 3: Switch в выключенном состоянии
- `data-[state=unchecked]:bg-input` → в тёмной теме `--input: 240 5% 18%` почти сливается с фоном карточки

### Проблема 4: Trust Badges в HeroBanner
- `bg-primary/10 text-primary` на светлом фоне — золотой текст на прозрачном золотом фоне

### Проблема 5: Radio/Checkbox границы
- `border-primary` в light mode — золотая граница на белом фоне малозаметна

---

## Решение

### 1. Усилить цвета для Light Mode

Добавить CSS переменные с улучшенной контрастностью:

```css
:root {
  /* Усиленный primary для лучшего контраста в light mode */
  --primary: 43 74% 42%;           /* Было 49%, стало темнее */
  --primary-foreground: 0 0% 100%;
  
  /* Отдельный цвет для текстовых градиентов */
  --gold-text: 35 80% 35%;         /* Тёмное золото для текста */
  
  /* Улучшенный muted для лучшего разделения */
  --muted: 220 14% 92%;            /* Чуть темнее */
  --muted-foreground: 220 10% 40%; /* Темнее для контраста */
  
  /* Switch/Toggle в выкл. состоянии */
  --input: 220 13% 82%;            /* Заметнее */
}

.dark {
  /* Switch unchecked более заметный */
  --input: 240 5% 26%;             /* Было 18%, стало светлее */
  
  /* Muted более различимый */
  --muted: 240 5% 22%;             /* Было 18% */
}
```

### 2. Улучшить text-gradient-gold

```css
/* Адаптивный градиент: тёмный в light mode, светлый в dark */
.text-gradient-gold {
  @apply bg-clip-text text-transparent;
  background-image: linear-gradient(
    135deg, 
    hsl(35 85% 40%) 0%,    /* Тёмное золото */
    hsl(43 74% 45%) 50%, 
    hsl(38 92% 42%) 100%
  );
}

.dark .text-gradient-gold {
  background-image: linear-gradient(
    135deg, 
    hsl(43 74% 65%) 0%,    /* Светлое золото */
    hsl(43 74% 55%) 50%, 
    hsl(38 92% 55%) 100%
  );
}
```

### 3. Улучшить ContentModeToggle

```text
┌────────────────────────────────────────────────────────┐
│  До:                                                    │
│  ┌──────────────┬──────────────┐                       │
│  │   Услуги     │   Товары     │  ← Неактивный         │
│  │  (активный)  │  сливается   │    сливается с фоном  │
│  └──────────────┴──────────────┘                       │
│                                                         │
│  После:                                                 │
│  ┌──────────────┬──────────────┐                       │
│  │   Услуги     │   Товары     │  ← Чёткая граница,   │
│  │ ▀▀▀▀▀▀▀▀▀▀▀▀ │              │    видимый контраст   │
│  └──────────────┴──────────────┘                       │
└────────────────────────────────────────────────────────┘
```

**Изменения:**
- Неактивная вкладка: `text-foreground/60` вместо `text-muted-foreground`
- Добавить тонкую границу: `border border-border/50`
- Активная вкладка: добавить `shadow-sm` для объёма

### 4. Улучшить Switch компонент

```text
До:  ⚫───────  (почти невидимый в dark mode)
После: ⚫═══════  (видимая дорожка с контрастом)
```

**Изменения:**
- Unchecked: `bg-muted-foreground/30` вместо `bg-input`
- Добавить `ring-1 ring-border` для границы

### 5. Улучшить TabsList (Tabs UI компонент)

**Изменения:**
- Фон: `bg-muted/80` → `bg-secondary`
- Неактивный триггер: добавить `hover:bg-background/50`
- Активный триггер: усилить тень `shadow-md`

### 6. Улучшить Trust Badges в HeroBanner

```text
До:   bg-primary/10 text-primary     (золото на золотом)
После: bg-background text-foreground border border-primary/30
```

### 7. Улучшить Badge варианты

Добавить вариант `gold` для premium элементов:

```typescript
gold: "border-amber-600/50 bg-amber-50 text-amber-800 
       dark:border-amber-500/50 dark:bg-amber-900/30 dark:text-amber-200"
```

---

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/index.css` | Обновить CSS переменные и `.text-gradient-gold` |
| `src/components/ui/switch.tsx` | Улучшить контраст дорожки |
| `src/components/ui/tabs.tsx` | Улучшить стили активных/неактивных вкладок |
| `src/components/home/ContentModeToggle.tsx` | Улучшить контраст переключателя |
| `src/components/home/HeroBanner.tsx` | Исправить Trust Badges |
| `src/components/ui/badge.tsx` | Добавить вариант `gold` |
| `src/components/ui/radio-group.tsx` | Усилить границу |
| `src/components/ui/checkbox.tsx` | Усилить границу |
| `src/components/ui/toggle.tsx` | Улучшить состояния |

---

## Визуальное сравнение

### Light Mode - До и После

```text
┌─────────────────────────────────────────────────────────────┐
│  ДО (проблемы):                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🅄 UNO  ← золотой текст плохо читается             │    │
│  │                                                      │    │
│  │  ┌────┐ ┌────┐ ┌────┐                               │    │
│  │  │ ✓ │ │All │ │RU │   ← золотые бейджи сливаются  │    │
│  │  └────┘ └────┘ └────┘                               │    │
│  │                                                      │    │
│  │  [Услуги] [Товары]  ← неактивный не виден          │    │
│  │                                                      │    │
│  │  ⬚ Switch off  ← дорожка не видна                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ПОСЛЕ (исправлено):                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🅄 UNO  ← тёмно-золотой, контрастный               │    │
│  │                                                      │    │
│  │  ┌────┐ ┌────┐ ┌────┐                               │    │
│  │  │ ✓ │ │All │ │RU │   ← белый фон + граница       │    │
│  │  └────┘ └────┘ └────┘                               │    │
│  │                                                      │    │
│  │  [Услуги] [Товары]  ← чёткий контраст + граница    │    │
│  │                                                      │    │
│  │  ⬚═══════ Switch off  ← видимая дорожка           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Технические детали

### Обновления CSS переменных (index.css)

```css
@layer base {
  :root {
    /* Light mode с улучшенной контрастностью */
    --primary: 43 74% 42%;
    --muted: 220 14% 92%;
    --muted-foreground: 220 10% 38%;
    --input: 220 13% 80%;
    --border: 220 13% 85%;
  }

  .dark {
    /* Dark mode с улучшенной видимостью */
    --input: 240 5% 28%;
    --muted: 240 5% 22%;
    --muted-foreground: 240 5% 60%;
  }
}

/* Адаптивный золотой градиент */
.text-gradient-gold {
  @apply bg-clip-text text-transparent;
  background-image: linear-gradient(135deg, 
    hsl(35 85% 38%) 0%, 
    hsl(43 74% 42%) 50%, 
    hsl(38 92% 40%) 100%
  );
}

.dark .text-gradient-gold {
  background-image: linear-gradient(135deg, 
    hsl(43 74% 65%) 0%, 
    hsl(43 74% 55%) 50%, 
    hsl(38 92% 58%) 100%
  );
}
```

### Обновление Switch компонента

```typescript
// Было:
"data-[state=unchecked]:bg-input"

// Стало:
"data-[state=unchecked]:bg-muted-foreground/25 data-[state=unchecked]:ring-1 data-[state=unchecked]:ring-border"
```

### Обновление ContentModeToggle

```typescript
// Неактивная вкладка - было:
"text-muted-foreground hover:text-foreground/80"

// Стало:
"text-foreground/60 hover:text-foreground border-b-2 border-transparent"
```

### Обновление HeroBanner Trust Badges

```typescript
// Было:
"bg-primary/10 text-primary"

// Стало:
"bg-card text-foreground border border-border shadow-sm"
```

---

## Ожидаемый результат

После внесения изменений:
1. Золотой текст будет читаемым в обеих темах
2. Переключатели и вкладки станут заметными
3. Switch будет видимым в выключенном состоянии
4. Trust Badges будут контрастными
5. Все элементы пройдут проверку WCAG AA (контраст 4.5:1 для текста)
