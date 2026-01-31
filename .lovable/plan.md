

# План: Унифицированная языковая индикация для провайдеров и услуг

## Обзор
Создать единую систему отображения языков, которыми владеют исполнители услуг, с понятными визуальными индикаторами для пользователей.

---

## Текущее состояние

**Таблицы с полем `languages[]`:**
- `clinics` - языки персонала
- `salons` - языки мастеров  
- `babysitters` - языки няни
- `legal_services` - языки юристов
- `education_providers` - языки преподавателей
- `veterinary_clinics` - языки ветеринаров

**Проблемы:**
- Нет единого формата хранения (EN vs English vs en)
- Нет поля languages в таблицах `providers` и `services`
- Разное отображение в разных секциях приложения
- Нет индикатора "машинный перевод" для провайдеров

---

## Решение

### 1. Новый компонент `LanguageIndicator`

Унифицированный компонент для отображения языковых возможностей:

```text
┌──────────────────────────────────────────────────────────┐
│  Компактный вид (для карточек):                          │
│  ┌────┐ ┌────┐ ┌────┐                                    │
│  │🇬🇧EN│ │🇷🇺RU│ │🤖MT│                                  │
│  └────┘ └────┘ └────┘                                    │
│                                                          │
│  Развернутый вид (для детальных страниц):                │
│  🇬🇧 English  ·  🇷🇺 Русский  ·  🤖 Machine Translation   │
└──────────────────────────────────────────────────────────┘
```

**Типы индикаторов:**
| Код | Флаг | Название EN | Название RU | Цвет |
|-----|------|-------------|-------------|------|
| en | 🇬🇧 | English | Английский | blue |
| ru | 🇷🇺 | Russian | Русский | red |
| th | 🇹🇭 | Thai | Тайский | purple |
| zh | 🇨🇳 | Chinese | Китайский | amber |
| ko | 🇰🇷 | Korean | Корейский | emerald |
| ja | 🇯🇵 | Japanese | Японский | pink |
| mt | 🤖 | Machine Translation | Машинный перевод | gray |

---

### 2. Изменения в базе данных

**Добавить поле `languages` в основные таблицы:**

```sql
-- Таблица providers (главная для провайдеров)
ALTER TABLE providers 
ADD COLUMN languages text[] DEFAULT '{}';

-- Таблица services (для отдельных услуг)
ALTER TABLE services 
ADD COLUMN languages text[] DEFAULT '{}';

-- Флаг машинного перевода
ALTER TABLE providers 
ADD COLUMN has_machine_translation boolean DEFAULT false;
```

---

### 3. Интеграция в карточки

**Места отображения:**
- `ServiceCard` в каталоге услуг
- Карточки провайдеров в категориях
- Детальные страницы услуг/провайдеров
- Результаты поиска

**Пример в ServiceCard:**
```text
┌─────────────────────────────────┐
│  [Изображение услуги]           │
│  ⭐ 4.8                          │
│                                  │
│  Название услуги                 │
│  Provider Name                   │
│  ┌────┐ ┌────┐                   │
│  │🇬🇧EN│ │🇷🇺RU│  ← языки         │
│  └────┘ └────┘                   │
│  ฿1,500 · 60 min                 │
└─────────────────────────────────┘
```

---

### 4. Нормализация данных

Создать утилиту для преобразования разных форматов:

```typescript
// Входные данные могут быть:
// "English", "EN", "en", "eng" → "en"

function normalizeLanguageCode(input: string): string {
  const map = {
    'english': 'en', 'en': 'en', 'eng': 'en',
    'russian': 'ru', 'ru': 'ru', 'rus': 'ru', 'русский': 'ru',
    'thai': 'th', 'th': 'th', 'тайский': 'th',
    // ... остальные
  };
  return map[input.toLowerCase()] || input.toLowerCase();
}
```

---

## Файлы для создания/изменения

| Файл | Действие | Описание |
|------|----------|----------|
| `src/components/ui/LanguageIndicator.tsx` | Создать | Главный компонент индикации языков |
| `src/lib/languageConfig.ts` | Создать | Конфигурация языков (флаги, названия, цвета) |
| `src/components/discover/FeaturedServicesGallery.tsx` | Изменить | Добавить языковые бейджи в ServiceCard |
| Миграция БД | SQL | Добавить поля languages в providers/services |

---

## Визуальные варианты компонента

### Variant: `compact` (по умолчанию)
Для карточек и списков - только флаг и код:
```
🇬🇧EN 🇷🇺RU
```

### Variant: `full`
Для детальных страниц - полные названия:
```
🇬🇧 English · 🇷🇺 Русский · 🤖 Машинный перевод
```

### Variant: `minimal`
Только флаги для очень компактных мест:
```
🇬🇧 🇷🇺 🇹🇭
```

---

## Технические детали

```typescript
interface LanguageIndicatorProps {
  languages: string[];
  hasMachineTranslation?: boolean;
  variant?: 'compact' | 'full' | 'minimal';
  maxDisplay?: number; // сколько показывать, остальные как +N
  className?: string;
}
```

