
# План: Адаптивная главная страница на основе выбранных ролей

## Проблема

Сейчас существуют **две параллельные системы выбора роли**:
1. **PersonaSelector** — выбор персон (tourist/resident/property_owner), влияет на QuickActionsGrid
2. **AudienceCards в HeroBlock** — ведут на `/discover?audience=...`, не связаны с персонами

При этом:
- Карточки аудиторий не используют систему персон
- Переход для Владельцев ведёт на пустоватую страницу вместо готового лендинга `/owner/landing`
- Главная страница не адаптируется визуально под выбранные роли

---

## Решение: Единая адаптивная система

### Концепция

Карточки аудиторий в HeroBlock **становятся визуальными переключателями персон** и одновременно:
1. **Активируют/деактивируют персону** (toggle)
2. **Адаптируют контент главной страницы** под выбранные роли
3. **При необходимости** — ведут на специализированные страницы

```text
┌─────────────────────────────────────────────────────────────┐
│                    ГЛАВНАЯ СТРАНИЦА                         │
├─────────────────────────────────────────────────────────────┤
│  [✓ Турист]   [✓ Резидент]   [  Владелец →]                │
│     ↓              ↓              ↓                         │
│  Toggle ON    Toggle ON     Navigate to /owner/landing      │
├─────────────────────────────────────────────────────────────┤
│  QuickActions: комбинация Tourist + Resident действий       │
│  Discovery: туры + медицина + визы (смешанный контент)      │
│  SmartWidget: персонализированные рекомендации              │
└─────────────────────────────────────────────────────────────┘
```

---

## Технические изменения

### 1. Обновить HeroBlock.tsx — интеграция с персонами

**Логика кликов по карточкам:**

| Роль | Действие при клике |
|------|-------------------|
| Турист | Toggle персоны `tourist` |
| Резидент | Toggle персоны `resident` |
| Владелец | Navigate → `/owner/landing` (готовая страница) |

```typescript
// В HeroBlock.tsx
import { useUserPersonas, UserPersona } from '@/hooks/useUserPersonas';

const { personas, togglePersona } = useUserPersonas();

const handleAudienceClick = (audienceId: string) => {
  if (audienceId === 'owners') {
    // Владельцы — переход на специальный лендинг
    navigate('/owner/landing');
  } else {
    // Tourist/Resident — toggle персоны
    const personaMap: Record<string, UserPersona> = {
      tourists: 'tourist',
      residents: 'resident',
    };
    const persona = personaMap[audienceId];
    if (persona) {
      togglePersona(persona);
    }
  }
};
```

**Визуальное состояние карточек:**

```typescript
// Показывать активное состояние для выбранных персон
const isActive = (audienceId: string) => {
  const personaMap = { tourists: 'tourist', residents: 'resident' };
  const persona = personaMap[audienceId];
  return persona ? personas.includes(persona) : false;
};
```

### 2. Убрать отдельный PersonaSelector

Поскольку карточки аудиторий теперь выполняют функцию выбора персон, компонент `PersonaSelector` можно убрать с главной страницы (или оставить в настройках профиля).

### 3. Адаптация DiscoveryCarousel по персонам

Добавить фильтрацию контента по выбранным персонам:

```typescript
// В DiscoveryCarousel.tsx
const { personas } = useUserPersonas();

// Категории для каждой персоны
const PERSONA_CATEGORIES = {
  tourist: ['tours', 'yachts', 'transport', 'restaurants', 'events'],
  resident: ['visa', 'medical', 'legal', 'banking', 'insurance'],
  property_owner: ['cleaning', 'maintenance', 'property-management'],
};

// Собрать категории из всех выбранных персон
const relevantCategories = personas.flatMap(p => PERSONA_CATEGORIES[p]);

// Фильтровать или приоритизировать контент
```

### 4. Визуальные индикаторы активных персон

Карточки аудиторий показывают состояние:

```text
НЕАКТИВНО:                      АКТИВНО (выбрано):
┌─────────────────┐             ┌─────────────────┐
│  ✈️             │             │  ✈️  ✓          │ ← чекмарк
│  Туристам       │             │  Туристам       │
│  border-default │             │  border-primary │ ← подсветка
└─────────────────┘             │  ring-2         │
                                └─────────────────┘
```

---

## Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/components/home/HeroBlock.tsx` | Интеграция с useUserPersonas, активные состояния, роутинг |
| `src/components/home/DiscoveryCarousel.tsx` | Фильтрация/приоритизация по персонам |
| `src/pages/Index.tsx` | Убрать PersonaSelector (опционально) |

---

## UX-поток

```text
Пользователь на главной странице:

1. Видит 3 карточки: [Туристам] [Резидентам] [Владельцам]

2. Кликает "Туристам":
   - Карточка получает активное состояние (border-primary, чекмарк)
   - QuickActions обновляются: Туры, Яхты, Транспорт...
   - DiscoveryCarousel показывает туристический контент
   
3. Кликает "Резидентам" (добавляет):
   - Обе карточки активны
   - QuickActions: комбинация Tourist + Resident
   - DiscoveryCarousel: смешанный контент

4. Кликает "Владельцам":
   - Переход на /owner/landing с приглашением залистить объект
```

---

## Ожидаемый результат

1. **Единая система** — карточки аудиторий = селектор персон
2. **Множественный выбор** — можно быть и туристом, и резидентом
3. **Адаптивный контент** — QuickActions + Discovery меняются
4. **Владельцы** — сразу видят полноценный лендинг с CTA "Разместить объект"
5. **Визуальный фидбек** — активные роли подсвечены
