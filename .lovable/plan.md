
# Добавление Hero-секции на главную страницу

## Проблема

Сейчас главная страница начинается сразу с поиска — **нет позиционирующего сообщения**, которое объясняет посетителю:
- Что это за платформа
- Чем она отличается от обычного маркетплейса
- Почему можно доверять

## Решение

Добавить компактную **Hero-секцию** с ключевым позиционированием над поисковой строкой:

```text
┌────────────────────────────────────────────────────┐
│  🏠 myUNO                                          │
│                                                    │
│  Home is where myUNO is                            │
│  Дом там, где myUNO                                │
│                                                    │
│  Verified infrastructure for life abroad           │
│  Верифицированная инфраструктура для жизни         │
│  за рубежом                                        │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │✓ G-Trust │ │✓ 24/7    │ │✓ RU/EN   │           │
│  │ Партнёры │ │ Команда  │ │ Поддержка│           │
│  └──────────┘ └──────────┘ └──────────┘           │
│                                                    │
│  🔍 Поиск...                                       │
└────────────────────────────────────────────────────┘
```

---

## Ключевые тексты (из существующих переводов)

| Элемент | EN | RU |
|---------|----|----|
| Заголовок | Home is where myUNO is | Дом там, где myUNO |
| Подзаголовок | Verified infrastructure for comfortable life abroad | Верифицированная инфраструктура для комфортной жизни за рубежом |
| Бейджи | G-Trust Partners / 24/7 Team / RU+EN Support | G-Trust Партнёры / Команда 24/7 / Поддержка RU+EN |

---

## Технический план

### 1. Создать компонент `HeroBanner.tsx`

**Файл:** `src/components/home/HeroBanner.tsx`

```typescript
export function HeroBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  return (
    <div className="text-center space-y-3 py-4">
      {/* Main tagline */}
      <h1 className="text-2xl font-bold">
        {isRu ? 'Дом там, где myUNO' : 'Home is where myUNO is'}
      </h1>
      
      {/* Positioning statement */}
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        {isRu 
          ? 'Верифицированная инфраструктура для комфортной жизни за рубежом'
          : 'Verified infrastructure for comfortable life abroad'}
      </p>
      
      {/* Trust badges */}
      <div className="flex justify-center gap-3 pt-2">
        <Badge icon={ShieldCheck}>G-Trust</Badge>
        <Badge icon={Users}>24/7 Team</Badge>
        <Badge icon={Globe}>RU + EN</Badge>
      </div>
    </div>
  );
}
```

### 2. Интегрировать в `Index.tsx`

```typescript
// Добавить импорт
import { HeroBanner } from '@/components/home/HeroBanner';

// Разместить ПЕРЕД поисковой строкой
<div className="px-4 py-4 pb-24 space-y-4">
  
  {/* NEW: Hero Banner */}
  <HeroBanner />
  
  {/* Search Bar */}
  <div onClick={() => setShowSearch(true)} ...>
```

---

## Дизайн-решения

| Аспект | Решение |
|--------|---------|
| Размер | Компактный (не более 120px высоты) |
| Анимация | Fade-in при загрузке (Framer Motion) |
| Скрытие | Опционально скрывать после первого визита |
| Адаптивность | На мобильных — 1 строка бейджей |

---

## Изменяемые файлы

| Файл | Действие |
|------|----------|
| `src/components/home/HeroBanner.tsx` | Создать |
| `src/pages/Index.tsx` | Добавить импорт и компонент |

---

## Ожидаемый результат

Посетитель сразу видит:
1. **Бренд-сообщение** — "Дом там, где myUNO"
2. **Позиционирование** — это не маркетплейс, а **инфраструктура**
3. **Доверие** — G-Trust, команда 24/7, двуязычная поддержка

Это отвечает на вопрос "Куда я попал?" в первые 2 секунды.
