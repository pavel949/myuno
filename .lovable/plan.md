

## Флоу определения роли с главного экрана

### Проблема сейчас

1. **OnboardingModal** (первый визит) — только выбор языка и города, без выбора роли
2. **PersonaSelectorBlock** (Tourist / Resident / Owner / Investor) — существует, но **нигде не используется** (orphaned component)
3. **ManagePropertyBanner** — показывается всем, хотя релевантен только для Owner
4. Нет чёткого момента, когда пользователь заявляет "я здесь как турист" или "я владелец"

### Предлагаемый флоу

```text
┌─────────────────────────────────┐
│  1. OnboardingModal (1st visit) │
│  Язык → Город → "Я здесь как:" │
│  [Tourist] [Resident] [Owner]   │
│  [Investor]                     │
│  → Continue                     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  2. Home Page (/) адаптируется  │
│                                 │
│  Tourist/Resident:              │
│  → QuickActions: аренда, авто,  │
│    трансфер, туры, события      │
│  → HomeExploreSections          │
│                                 │
│  Owner:                         │
│  → redirect на /owner           │
│    (dashboard или onboarding)   │
│                                 │
│  Investor:                      │
│  → redirect на /invest          │
└─────────────────────────────────┘
```

### Шаги реализации

**1. Добавить шаг выбора персоны в OnboardingModal**

Добавить второй экран в OnboardingModal после выбора языка:
- Заголовок: "I'm here as:" / "Я здесь как:"
- Карточки: Tourist, Resident, Owner, Investor (используя дизайн из PersonaSelectorBlock)
- Выбор сохраняется через `useUserPersonas` hook
- Кнопка "Continue" ведёт на главную (или redirect для Owner/Investor)

**2. Redirect-логика после выбора**

- **Tourist / Resident** — остаются на `/`, видят адаптированный контент
- **Owner** — redirect на `/owner` (если уже есть роль owner — dashboard, если нет — landing/onboarding)
- **Investor** — redirect на `/invest`

**3. PersonaSelectorBlock на главной**

Вставить `PersonaSelectorBlock` на главную страницу (после HeroBlock), чтобы пользователь мог **сменить персону** в любой момент без повторного прохождения onboarding.

**4. Убрать ManagePropertyBanner**

Удалить статичный баннер "Manage Property" — его функция теперь покрыта:
- Для Owner: автоматический redirect на `/owner`
- Для всех: кнопка Owner в PersonaSelectorBlock

### Технические детали

**Файлы для изменения:**

| Файл | Изменение |
|---|---|
| `src/components/onboarding/OnboardingModal.tsx` | Добавить шаг 2 — выбор персоны (Tourist/Resident/Owner/Investor) |
| `src/pages/Index.tsx` | Добавить PersonaSelectorBlock, убрать ManagePropertyBanner, добавить redirect-логику для Owner/Investor |
| `src/components/home/ManagePropertyBanner.tsx` | Удалить файл |
| `src/components/home/PersonaSelectorBlock.tsx` | Доработать: добавить callback `onSelect` для использования в OnboardingModal |

**Логика redirect (в Index.tsx):**

```text
if persona includes 'property_owner' AND user has role 'owner':
  → redirect /owner
if persona includes 'property_owner' AND user does NOT have role:
  → redirect /owner/landing (onboarding)
if persona includes 'investor':
  → redirect /invest
```

