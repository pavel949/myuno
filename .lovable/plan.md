

## Проблема

Текущий `/auth` — голая форма (логин или 2-шаговая регистрация). Нет:
- объяснения **что такое myUNO** и зачем регистрироваться
- демонстрации возможностей (40+ сервисов, 6 кластеров)
- сигналов доверия (количество пользователей, партнёры, безопасность, локация)
- эмоциональной привязки — пользователь видит форму до того, как понял ценность

Bible §0/§1 требует «спокойное доверие» (deep-sea theme, mint accent, no shouty marketing), а сейчас экран ощущается как анонимная админка.

## Решение

Переделать **левую часть** экрана `/auth` (на mobile — верхний блок, sticky-collapsible при фокусе на инпуте) в **value panel** — спокойную, информативную, с микроанимацией. Форма остаётся справа/снизу без изменений логики.

### Структура нового первого экрана (mobile-first 375px)

```
┌─────────────────────────────────┐
│  [U logo]          [RU EN]      │  ← header (есть)
├─────────────────────────────────┤
│                                 │
│  myUNO                          │  ← wordmark (display font)
│  Всё для жизни на Пхукете       │  ← H1 spокойно, без !!!
│  в одном приложении             │
│                                 │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │  ← 6 cluster chips
│  Ar  Li  Mn  In  Lg  Bd        │     с цветами §7.4
│                                 │
│  ✓ 40+ сервисов под одним       │  ← 3 trust bullets
│    аккаунтом                    │
│  ✓ Юр. сопровождение и платежи  │
│  ✓ Поддержка 24/7 на русском    │
│                                 │
│  · 12 000+ пользователей        │  ← мягкая социалка
│  · Phuket, Thailand · с 2024    │
├─────────────────────────────────┤
│  [Continue with Google]         │  ← существующая форма
│  ─── или ───                    │
│  [phone input]                  │
│  [Continue →]                   │
├─────────────────────────────────┤
│  🔒 Шифрование · Без спама ·    │  ← trust footer
│     Аккаунт бесплатно           │
└─────────────────────────────────┘
```

На desktop (≥md) — двухколоночный split: value panel слева (sticky), форма справа.

### Что меняется

1. **Новый компонент** `src/components/auth/AuthValuePanel.tsx`:
   - Wordmark + H1/sub (Golos Text, spокойный тон)
   - `ClusterChips` — 6 цветных пилюль с иконками (Plane/Home/Briefcase/TrendingUp/Scale/Hammer), цвета строго из `--cluster-*` токенов
   - `TrustBullets` — 3 чекмарка mint primary
   - `SocialProof` — пользователи · локация · год (без фейковых цифр — из `system_settings.public_user_count` если есть, иначе fallback "Тысячи семей")
   - i18n RU/EN/TH

2. **Новый компонент** `src/components/auth/AuthTrustFooter.tsx`:
   - Иконки Shield/Mail/Gift + короткие подписи
   - Отображается под формой

3. **Refactor `src/pages/Auth.tsx`**:
   - Обернуть в 2-column grid на `md:grid-cols-2`
   - Mobile: `<AuthValuePanel />` сверху, форма ниже
   - На login и signup-`phone` шаге — value panel виден полностью
   - На signup-`register` шаге — value panel сворачивается до тонкой полоски (форма длинная, не отвлекать)
   - Убрать загадочный лиловый `bg-[#5D3A4A]` CTA (нарушение §1.5.3 «no hardcoded hex»), заменить на `bg-primary text-primary-foreground` (mint per §7.4)
   - Заменить `text-gradient-gold` / `gradient-gold` (золото — это Dark Luxury тема для `/newbuilds`, не для основного auth) на нейтральный `text-foreground` + mint underline accent

4. **i18n ключи** (добавить в `src/i18n/`):
   - `auth.value.title`, `auth.value.subtitle`
   - `auth.value.bullets.[1-3]`
   - `auth.value.cluster.[arrive|live|manage|invest|legal|build]`
   - `auth.trust.[secure|noSpam|free]`
   - `auth.social.users`, `auth.social.location`

### Принципы «спокойного доверия»

- Без восклицательных знаков, без «🔥», без скидок
- Mint accent точечно (галочки, активный chip, CTA)
- Нейтральный фон `bg-background` (#08101E) + мягкий gradient overlay уже есть
- Микроанимация только на mount cluster chips (stagger 40ms), без бесконечных
- Шрифты строго по §8: Golos Text headings, DM Sans body
- Никаких stock-фото — только типографика + иконки lucide

### Файлы

**Создать:**
- `src/components/auth/AuthValuePanel.tsx`
- `src/components/auth/AuthTrustFooter.tsx`

**Изменить:**
- `src/pages/Auth.tsx` (layout + 2 hardcoded hex замены + gradient-gold → mint)
- `src/i18n/en.json`, `src/i18n/ru.json` (+ th если есть) — добавить namespace `auth.value`, `auth.trust`, `auth.social`

**Не трогать:** логика `signIn`/`signUp`, валидации, OAuth, terms acceptance, redirect, `withTimeout` — всё остаётся как есть.

### Вне scope

- Не добавляю видео/анимации hero (мобильный bundle, перформанс)
- Не меняю PinLogin / forgot-password страницы (отдельная задача)
- Социалка (12k+ users) — placeholder, реальное число подключим позже из `system_settings`

