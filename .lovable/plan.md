

## Унификация посыла платформы: "One stop shop for everything abroad"

### Проблема
Сейчас в разных местах платформы разные посылы:
- **OnboardingModal**: «Жизнь за рубежом — без хаоса» — негативный фрейминг
- **PostOrderReviewPrompt**: «Как всё прошло?» — это нормальный UX для отзыва, НЕ отдельный экран, убирать не нужно
- **PWAWelcomeScreen**: «Добро пожаловать» — generic, без посыла
- **DiscoverHero**: «Теперь всё просто» — ближе, но слабо
- **HeroBlock** (desktop): «Ваш дом на острове» — хорошо, но не едино
- **HeroBlock** (mobile, неавториз.): «Всё для жизни на Пхукете в одном месте» — локально, не abroad
- **Brand book**: «Мы не продаём мечту — мы убираем хаос» — тоже негативный

### Что убрать
1. **OnboardingModal** — шаг "welcome" с «без хаоса». Заменить headline на новый посыл
2. **PWAWelcomeScreen** — убрать полностью (generic экран без ценности)

### Новый единый посыл
**EN**: "Your trusted infrastructure abroad" / "One place for everything abroad"
**RU**: "Надёжная инфраструктура для жизни за рубежом" / "Всё для жизни за рубежом — в одном месте"

### Файлы и изменения

| Файл | Изменение |
|---|---|
| `src/components/pwa/PWAWelcomeScreen.tsx` | Убрать компонент (или сделать no-op) |
| `src/pages/Index.tsx` | Убрать `<PWAWelcomeScreen />` |
| `src/components/onboarding/OnboardingModal.tsx` | Обновить `texts.headline` и `texts.subtitle` на новый посыл |
| `src/components/discover/DiscoverHero.tsx` | Обновить h1 и subtitle |
| `src/components/home/HeroBlock.tsx` | Обновить subtitle для неавториз. и desktop label |
| `.lovable/brand-book.md` | Обновить позиционирование |

### Новые тексты

**OnboardingModal headline:**
- EN: "Everything abroad, in one place"
- RU: "Всё для жизни за рубежом — в одном месте"

**OnboardingModal subtitle:**
- EN: "Trusted infrastructure for housing, services, and daily life"
- RU: "Надёжная система для жилья, сервисов и повседневных задач"

**DiscoverHero:**
- EN: "One place for everything abroad"
- RU: "Всё для жизни за рубежом"

**HeroBlock (неавториз.):**
- EN: "Your trusted infrastructure abroad"
- RU: "Надёжная инфраструктура для жизни за рубежом"

**HeroBlock (desktop label):**
- EN: "Your infrastructure abroad"
- RU: "Ваша инфраструктура за рубежом"

**Brand book позиционирование:**
> «Мы — надёжная инфраструктура для путешествий и жизни за рубежом. One place for everything abroad.»

