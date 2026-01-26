
# План: CMS для редактирования текстов SuperApp

## Текущая ситуация

Все тексты приложения хранятся в одном файле `src/contexts/LanguageContext.tsx`:
- **~1330 строк** кода
- **3 языка**: русский, английский, тайский
- **~300+ ключей** переводов
- Для изменения любого текста нужно редактировать код

---

## Решение: Административная CMS для текстов

### Архитектура

```text
┌─────────────────────────────────────────────────────────┐
│                    Admin Panel                          │
│  /admin/translations                                    │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🔍 Поиск по ключу или тексту                      │ │
│  ├───────────────────────────────────────────────────┤ │
│  │ Категория: [Navigation ▼]                         │ │
│  ├───────────────────────────────────────────────────┤ │
│  │ Key: nav.home                                     │ │
│  │ ┌─────────────┬─────────────┬─────────────┐      │ │
│  │ │ RU: Главная │ EN: Home    │ TH: หน้าแรก │      │ │
│  │ └─────────────┴─────────────┴─────────────┘      │ │
│  │                                    [💾 Save]      │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
                   ┌─────────────────┐
                   │   Supabase DB   │
                   │  translations   │
                   │ table + cache   │
                   └─────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │   LanguageContext.tsx    │
              │ Загружает из DB + кеш    │
              │ Fallback на статику      │
              └──────────────────────────┘
```

---

## Этапы реализации

### Этап 1: Создание таблицы в БД

```sql
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,              -- 'nav.home'
  category TEXT,                  -- 'navigation', 'auth', 'booking'
  value_ru TEXT NOT NULL,
  value_en TEXT NOT NULL,
  value_th TEXT,
  is_custom BOOLEAN DEFAULT true, -- отличается от дефолта?
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(key)
);

-- RLS: только админы могут редактировать
CREATE POLICY "Admins can manage translations"
  ON translations FOR ALL
  USING (is_admin(auth.uid()));

-- Публичное чтение для всех
CREATE POLICY "Anyone can read translations"
  ON translations FOR SELECT
  USING (true);
```

### Этап 2: Миграция существующих переводов

Edge-функция для импорта текущих ~300 ключей в таблицу:
- Парсинг категорий из ключей (`nav.`, `auth.`, `booking.`)
- Автоматическое заполнение всех языков

### Этап 3: Обновление LanguageContext

```typescript
// Новая логика загрузки
const [customTranslations, setCustomTranslations] = useState({});

useEffect(() => {
  // Загрузка кастомных переводов из БД
  supabase
    .from('translations')
    .select('key, value_ru, value_en, value_th')
    .then(({ data }) => {
      const map = {};
      data?.forEach(row => {
        map[row.key] = {
          ru: row.value_ru,
          en: row.value_en,
          th: row.value_th
        };
      });
      setCustomTranslations(map);
    });
}, []);

const t = (key: string): string => {
  // Приоритет: кастомные → статичные → fallback
  const custom = customTranslations[key]?.[language];
  if (custom) return custom;
  return translations[language][key] || translations['en'][key] || key;
};
```

### Этап 4: Админ-страница /admin/translations

**Компоненты:**

| Компонент | Функция |
|-----------|---------|
| TranslationsTable | Таблица всех ключей с фильтрами |
| TranslationEditor | Редактирование одного ключа (все языки) |
| CategoryFilter | Фильтр по категориям (nav, auth, booking...) |
| SearchBar | Поиск по ключу и тексту |
| ImportExport | Экспорт/импорт JSON |

**Функции:**
- Поиск и фильтрация по категориям
- Inline-редактирование с автосохранением
- AI-перевод одной кнопкой (использует существующий `ai-translate`)
- История изменений (кто, когда)
- Экспорт в JSON для бэкапа

### Этап 5: Кеширование

- **LocalStorage**: кеш переводов на 1 час
- **Realtime**: подписка на изменения таблицы
- **Versioning**: хеш версии для инвалидации кеша

---

## Файлы для создания/изменения

| Файл | Действие |
|------|----------|
| `migrations/xxx_translations_table.sql` | Создать таблицу |
| `src/pages/admin/AdminTranslations.tsx` | Новая страница CMS |
| `src/components/admin/TranslationsTable.tsx` | Таблица переводов |
| `src/components/admin/TranslationEditor.tsx` | Редактор ключа |
| `src/contexts/LanguageContext.tsx` | Добавить загрузку из БД |
| `src/hooks/useTranslations.ts` | Хук для работы с переводами |
| `supabase/functions/import-translations/` | Импорт начальных данных |

---

## Дополнительные возможности

1. **AI-перевод**: кнопка "Перевести на все языки" рядом с каждым ключом
2. **Версионирование**: история изменений каждого ключа
3. **Предпросмотр**: увидеть текст в контексте UI
4. **Bulk-редактирование**: массовое изменение категории
5. **Добавление новых ключей**: создание новых текстов без кода

---

## Ожидаемый результат

После реализации:
- Все тексты редактируются через админ-панель
- Изменения применяются мгновенно (realtime)
- AI автоматически переводит на другие языки
- Сохраняется история изменений
- Работает fallback на статические тексты при ошибках БД
