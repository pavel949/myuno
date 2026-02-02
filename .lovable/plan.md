
# Аудит и улучшение системы аутентификации myUNO

## Текущее состояние системы

### 1. Процесс регистрации (Signup)
**Что есть:**
- 3-шаговая форма в стиле Airbnb: Имя → Контакты (Email + телефон) → Пароль
- Реферальные коды
- После успешной регистрации предлагается настройка PIN

**Проблемы:**
- Нет верификации email (пользователь сразу входит)
- Нет верификации телефона
- PIN привязан к `localStorage` — теряется при очистке браузера

### 2. Система PIN-кода
**Что есть:**
```text
user_pins (таблица)
├── user_id      → UUID пользователя
├── pin_hash     → bcrypt хэш PIN
├── device_id    → ID устройства (localStorage)
└── refresh_token → хранится в localStorage
```

**Критические проблемы:**
1. **Зависимость от localStorage** — если пользователь очистит данные браузера, PIN становится бесполезным
2. **refresh_token истекает** — Supabase ротирует токены, и через ~7 дней PIN перестаёт работать
3. **Нет fallback-механизма** — при проблемах пользователь вынужден вводить email+пароль
4. **Нет управления PIN в настройках** — нельзя сбросить или изменить PIN из профиля
5. **Проверка hasPinConfigured некорректна** — использует `uno_pin_enabled`, которого нет в коде

### 3. Восстановление пароля
**Что есть:**
- Стандартный Supabase flow: Email → Magic Link → Новый пароль
- Работает через `resetPasswordForEmail()`

**Проблемы:**
- Нет альтернативного способа восстановления (SMS, секретный вопрос)
- Нет восстановления PIN-кода
- При потере доступа к email — полная потеря аккаунта

---

## Сравнение с Airbnb

| Функция | Airbnb | myUNO (сейчас) |
|---------|--------|----------------|
| Регистрация | Email/Phone/Social | Email + пароль |
| Верификация | SMS OTP / Email OTP | Нет |
| Вход | Email + OTP (без пароля!) | Email + пароль / PIN |
| Быстрый вход | Face ID / Touch ID | PIN (ненадёжный) |
| Восстановление | Phone/Email OTP | Только Email link |
| Multi-device | Автоматическая синхронизация | Нет (PIN на устройство) |

**Ключевое отличие Airbnb**: они используют **passwordless auth** с OTP-кодами, а не пароли. Это проще и безопаснее.

---

## Рекомендуемые улучшения

### Фаза 1: Исправление критических проблем PIN

#### 1.1 Сброс PIN через профиль
```text
/profile/settings → Безопасность → PIN-код
├── Изменить PIN (ввод старого → нового)
├── Сбросить PIN (требует пароль)
└── Удалить PIN
```

#### 1.2 Надёжное хранение сессии
Вместо `localStorage` refresh_token использовать серверную привязку:
```sql
-- Добавить в user_pins
ALTER TABLE user_pins ADD COLUMN last_login_at TIMESTAMPTZ;
ALTER TABLE user_pins ADD COLUMN trusted_until TIMESTAMPTZ;
```

#### 1.3 Fallback при истечении токена
При ошибке PIN автоматически показывать форму email/пароль с подсказкой "PIN устарел"

### Фаза 2: Email/Phone OTP (как Airbnb)

#### 2.1 Регистрация с верификацией
```text
Шаг 1: Ввод email
Шаг 2: OTP-код на email (6 цифр, 5 минут)
Шаг 3: Имя + телефон (опционально)
Шаг 4: Создание пароля (опционально, можно позже)
```

#### 2.2 Вход через OTP (passwordless)
```text
1. Пользователь вводит email
2. Выбор: "Отправить код" или "Войти с паролем"
3. OTP приходит на email
4. Ввод 6-значного кода → вход
```

#### 2.3 Компонент OTP-ввода
Использовать существующий `input-otp` компонент:
```tsx
<InputOTP maxLength={6} onComplete={handleVerify}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>
```

### Фаза 3: Восстановление доступа

#### 3.1 Множественные методы
```text
Забыли пароль?
├── Получить код на email
├── Получить код по SMS (если привязан телефон)
└── Связаться с поддержкой (последний вариант)
```

#### 3.2 Восстановление PIN
```text
Забыли PIN?
├── Войти с паролем → автоматически сбрасывает PIN
├── Установить новый PIN после входа
└── Опция: отключить PIN полностью
```

---

## Техническая реализация

### Новые файлы
```text
src/pages/auth/
├── VerifyEmail.tsx           # Страница ввода OTP
├── VerifyPhone.tsx           # Страница SMS верификации

src/components/auth/
├── OTPInput.tsx              # Обёртка над input-otp
├── PinManagement.tsx         # Управление PIN в профиле
├── AuthMethodSelector.tsx    # Выбор способа входа

src/hooks/
├── useOTPAuth.ts             # Логика OTP-аутентификации
└── usePinManagement.ts       # CRUD для PIN

supabase/functions/
├── send-otp/                 # Отправка OTP через Resend
└── verify-otp/               # Проверка OTP
```

### База данных
```sql
-- Таблица OTP-кодов
CREATE TABLE auth_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,           -- email или phone
  identifier_type TEXT NOT NULL,      -- 'email' или 'phone'
  code_hash TEXT NOT NULL,            -- bcrypt хэш 6-значного кода
  attempts INT DEFAULT 0,             -- количество попыток
  expires_at TIMESTAMPTZ NOT NULL,    -- TTL 5 минут
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RPC для генерации и проверки OTP
CREATE FUNCTION generate_otp(p_identifier TEXT, p_type TEXT) ...
CREATE FUNCTION verify_otp(p_identifier TEXT, p_code TEXT) ...
```

### Улучшенный usePinAuth
```typescript
// Добавить методы:
- resetPin(currentPassword: string): Promise<void>
- changePin(oldPin: string, newPin: string): Promise<void>
- disablePin(): Promise<void>
- syncPinSession(): Promise<void>  // Принудительная синхронизация
```

---

## Приоритеты реализации

| Приоритет | Задача | Сложность | Влияние |
|-----------|--------|-----------|---------|
| P0 | Исправить управление PIN в профиле | Низкая | Высокое |
| P0 | Добавить fallback при ошибке PIN | Низкая | Высокое |
| P1 | Email OTP для регистрации | Средняя | Высокое |
| P1 | Passwordless вход (email OTP) | Средняя | Высокое |
| P2 | SMS верификация телефона | Высокая | Среднее |
| P2 | Biometric auth (Face ID/Touch ID) | Средняя | Среднее |

---

## Итог

**Главные проблемы сейчас:**
1. PIN ненадёжен из-за localStorage + refresh_token rotation
2. Нет верификации email/phone при регистрации
3. Нет управления PIN в профиле
4. Единственный способ восстановления — email link

**Рекомендация:**
Начать с Фазы 1 (исправление PIN) и Фазы 3 (восстановление), затем внедрить OTP-аутентификацию в стиле Airbnb.
