

# Аудит дизайн-системы myUNO DS2.0: несоответствия и план исправлений

## Текущая архитектура DS

myUNO имеет зрелую дизайн-систему (DS2.0) с:
- **`designTokens.ts`** — токены для elevation, radius, typography, motion, cards, badges
- **UI primitives** — `Card` (4 варианта), `Badge` (7 вариантов), `Button` (6 вариантов), `Surface` (6 вариантов)
- **`tokens.css`** — CSS-переменные для теней, цветов
- **`tailwind.config.ts`** — семантические цвета (success, warning, info, cluster-*)
- **DS components** (`src/components/ds/`) — `SectionHeader`, `PromoBanner`, `CheckoutPanel` и др.

## Выявленные нарушения

### 1. Hardcoded Tailwind-цвета вместо семантических токенов
**Масштаб**: 36 файлов с `bg-green-*`, `bg-blue-*`, `bg-red-*` и 47 файлов с `text-green-*`, `text-blue-*` и т.д. (~790 вхождений)

**Проблема**: DS2.0 определяет `success`, `warning`, `destructive`, `info` как семантические цвета, но большинство компонентов используют raw Tailwind-цвета (`text-green-500`, `bg-blue-600`), которые:
- Не адаптируются к dark mode автоматически
- Не следуют единой палитре
- Требуют ручного дублирования `dark:` классов

**Файлы-нарушители** (топ по критичности):
- `AccountActivitySection.tsx` — статусные точки через `bg-yellow-500`, `bg-blue-500`
- `WhatsAppConciergeBlock.tsx` — `bg-green-600` вместо `bg-success`
- `TrustScoreCard.tsx` — 6 разных hardcoded цветов
- `EmailVerificationBadge.tsx` — `text-green-500`, `bg-green-50`
- `CancellationPolicySelector.tsx` (2 файла) — целые colorMap объекты с raw цветами
- `LoyaltyWidget.tsx` — hardcoded тиерные цвета
- `PropertyCalendar.tsx` — `ring-red-500` вместо `ring-destructive`

### 2. Тени: `shadow-md/lg/xl` вместо elevation-переменных
**Масштаб**: 194 файла, ~1442 вхождений `shadow-sm/md/lg/xl`

**Проблема**: DS2.0 определяет `--shadow-elevation-1..5` с premium glow-эффектами, но подавляющее большинство компонентов используют стандартные Tailwind-тени, которые выглядят generic и не имеют фирменного свечения.

**Примеры**: `AirbnbSearchBar` (`shadow-lg`, `shadow-2xl`), `PromoCarousel` (`shadow-lg`), `ActivityBlock` (`hover:shadow-md`)

### 3. Дизайн-токены почти не импортируются
**Масштаб**: Только **3 файла** из 400+ компонентов используют `designTokens.ts`

- `ProductCard.tsx` — `BADGE_STYLES`
- `ExperienceCard.tsx` — `BADGE_SYSTEM`, `CARD_STYLES`
- `ProjectCard.tsx` — `BADGE_SYSTEM`

Все остальные компоненты пишут стили inline, дублируя значения из токенов.

### 4. `Surface` компонент недоиспользован
**Масштаб**: 15 файлов используют `Surface`, но сотни компонентов пишут `bg-card rounded-xl border border-border/60` вручную — то, что `Surface` делает автоматически.

### 5. Несогласованность `border-radius`
**Масштаб**: 403 файла с разными radius-паттернами

- Buttons определены как `rounded-xl` в base, но `size.sm` и `size.lg` переключают на `rounded-md`
- Cards — `rounded-xl` в DS, но многие компоненты используют `rounded-2xl` или `rounded-3xl`
- Нет единого правила: одни кнопки `rounded-xl`, другие `rounded-full`

### 6. Типографика: `font-display` применяется непоследовательно
- Заголовки в ~29 файлах используют `font-display` (Syne)
- Остальные заголовки используют default sans (DM Sans)
- `TYPOGRAPHY` токены из `designTokens.ts` **нигде не импортируются**

### 7. Hardcoded hex-цвет
- `ReviewsManagementPage.tsx` — `bg-[#FF5A5F]` (Airbnb), `bg-[#003580]` (Booking), `bg-[#4285F4]` (Google)
- Допустимо для brand-цветов платформ, но должно быть вынесено в константы

## План исправлений

### Phase 1: Семантические цвета (Наибольший визуальный эффект)

Создать маппинг-утилиту для статусных цветов и заменить hardcoded цвета в ключевых компонентах:

| Raw Tailwind | Семантический токен |
|---|---|
| `green-500/600` | `success` |
| `red-500/600` | `destructive` |
| `yellow-500/600` | `warning` |
| `blue-500/600` | `info` |
| `purple-500/600` | `accent-purple` |

**Файлы для изменения** (~15 самых заметных):
- `AccountActivitySection.tsx`
- `WhatsAppConciergeBlock.tsx`
- `TrustScoreCard.tsx`
- `EmailVerificationBadge.tsx`
- `UploadProgress.tsx`
- `CancellationPolicySelector.tsx` (оба файла)
- `LoyaltyWidget.tsx`
- `PropertyCalendar.tsx`
- `DosDontsCard.tsx`
- `HomeServiceProviderCard.tsx`
- `LifeOSAuditTab.tsx`
- `PropertyOwnershipBadge.tsx`
- `ProviderQRCard.tsx`

### Phase 2: Elevation shadows

Заменить `shadow-md/lg/xl` на `[box-shadow:var(--shadow-elevation-N)]` в интерактивных элементах:
- Cards с hover → `elevation-2` base, `elevation-3` hover
- Floating elements (FAB, modals) → `elevation-4/5`
- Subtle containers → `elevation-1`

**Приоритетные файлы** (~10):
- `AirbnbSearchBar.tsx`
- `PromoCarousel.tsx`
- `AIChatbot.tsx`
- `AchievementsCard.tsx`
- `DomainTabs.tsx`

### Phase 3: Расширить использование Surface и Card variants

Создать линтинг-правило (или чеклист) и мигрировать паттерн `bg-card rounded-xl border border-border/60` → `<Surface>` или `<Card variant="content">` в компонентах, которые не используют CardHeader/CardContent.

### Phase 4: Typography consistency

Создать DS-компоненты `Heading` и `Text` из `TYPOGRAPHY` токенов и постепенно заменить inline typography-классы.

### Порядок реализации

| Phase | Файлов | Effort | Impact |
|-------|--------|--------|--------|
| 1. Семантические цвета | ~15 | 3h | High — dark mode, consistency |
| 2. Elevation shadows | ~10 | 2h | Medium — premium feel |
| 3. Surface migration | ~20 | 3h | Medium — maintainability |
| 4. Typography components | ~30 | 4h | Low — long-term consistency |

Рекомендую начать с Phase 1 + Phase 2 — они дают максимальный визуальный эффект при минимальном риске regression.

