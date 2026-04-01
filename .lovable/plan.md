

# Визуальный редизайн персон + Relocation + новые посадочные страницы

## Что делаем

### 1. Визуальный редизайн карточек персон (HeroBlock + PersonaSmartFeed)

**Проблема**: текущие карточки — мелкие иконки 36px в двух рядах, выглядят как generic UI.

**Решение — компактный горизонтальный скролл с glassmorphism-чипами**:
- Один ряд с горизонтальным скроллом вместо двух рядов по 6
- Каждый чип: gradient-фон с blur-эффектом, Lucide-иконка 20px + label
- Активный чип: яркий gradient + `ring-2` + subtle glow (`box-shadow`)
- Неактивные: полупрозрачный `bg-white/5` с `backdrop-blur`
- Для `PersonaSmartFeed` карточки: заменить emoji на Lucide-иконки в цветных кружках + описательный subtitle

### 2. Новая персона: Relocation (переезд на Пхукет)

**DB migration**: добавить `relocation` в enum `user_persona`.

**Данные для всех систем**:
- `PERSONA_INFO`: icon = `Globe`, label "Relocating" / "Переезд"
- `QuickActionsGrid` — `RELOCATION_ACTIONS`: Visa, Property, Schools, Legal, Banking, Medical, Insurance, Transport
- `PersonaSmartFeed` — рекомендации: "Первичная консультация", "Найти жильё", "Школы для детей"
- `OnboardingModal` — `ROLE_FEATURES` + `QUICK_WINS`: "Бесплатная консультация по переезду"

### 3. Отдельная посадочная страница `/relocate`

Полноценный лендинг "Relocate to Phuket" — мини-апп с пошаговым роадмапом переезда:

```text
┌─────────────────────────────────┐
│  Hero: "Переезд на Пхукет"     │
│  CTA: Бесплатная консультация   │
├─────────────────────────────────┤
│  Roadmap (вертикальный timeline):│
│  1. Визы и документы            │
│  2. Жильё                      │
│  3. Школы и сады                │
│  4. Медицина и страховка        │
│  5. Банки и финансы             │
│  6. Транспорт                  │
│  7. Юрист и бухгалтер          │
│  8. Досуг и комьюнити          │
├─────────────────────────────────┤
│  Тарифы: DIY / Guided / VIP    │
│  WhatsApp CTA                  │
│  FAQ аккордеон                 │
└─────────────────────────────────┘
```

Каждый шаг роадмапа — ссылка на соответствующий сервис платформы. Монетизация: консультации + пакеты "сопровождение переезда" (DIY бесплатно, Guided ₿15k, VIP ₿50k).

### 4. Дополнительные посадочные страницы для монетизации

Оценка целесообразности — создаём 3 высоко-конверсионные страницы:

| Страница | Путь | Зачем | Монетизация |
|----------|------|-------|-------------|
| **Wedding Phuket** | `/wedding` | Пары тратят $10-50k, высокий чек: venue + декор + фото + яхта | Комиссия 10% со всех вендоров |
| **Phuket for Kids** | `/kids` | Семьи — самый долгосрочный LTV: школы + клиники + активности + няни | Лиды школам + booking fee |
| **Digital Nomad Guide** | `/nomad-guide` | Привлечение номадов: коворкинги + визы + аренда + SIM | Подписки + реферальные |

### 5. Добавить Relocation в кластерную навигацию

- Добавить `/relocate` в `APP_ROUTES`
- Добавить карточку "Relocation" в `ArriveClusterPage` (логически — первый шаг после приезда)
- Обновить `VERTICAL_GROUPS` (группа "Life Admin") — добавить relocation
- Обновить `sitemap.xml` со всеми новыми страницами

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `migration` | Добавить `relocation` в enum |
| `src/hooks/useUserPersonas.ts` | +1 персона, обновить PERSONA_OPTIONS/INFO |
| `src/components/home/HeroBlock.tsx` | Редизайн PersonaSwitcher — горизонтальный скролл + glassmorphism |
| `src/components/home/PersonaSmartFeed.tsx` | Редизайн карточек + добавить relocation |
| `src/components/home/QuickActionsGrid.tsx` | +RELOCATION_ACTIONS |
| `src/components/onboarding/OnboardingModal.tsx` | +relocation в ROLE_FEATURES/QUICK_WINS |
| `src/pages/relocate/RelocateLandingPage.tsx` | **Новый** — посадочная страница |
| `src/pages/wedding/WeddingLandingPage.tsx` | **Новый** — свадьбы |
| `src/pages/kids/KidsLandingPage.tsx` | **Новый** — для семей |
| `src/pages/nomad/NomadGuidePage.tsx` | **Новый** — для номадов |
| `src/lib/config/routes.ts` | +4 новых маршрута |
| `AnimatedRoutes.tsx` | +4 lazy-импорта |
| `public/sitemap.xml` | +4 URL |

## Порядок реализации

1. Migration + useUserPersonas (relocation)
2. HeroBlock визуальный редизайн
3. PersonaSmartFeed редизайн + relocation
4. QuickActionsGrid + OnboardingModal
5. RelocateLandingPage (главная посадочная)
6. WeddingLandingPage, KidsLandingPage, NomadGuidePage
7. Routes, navigation, sitemap

