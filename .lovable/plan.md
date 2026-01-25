
# План исправления нестабильной работы PIN-аутентификации

## Корневые причины проблемы

### Проблема 1: Рассинхронизация состояний
Система имеет **два независимых источника правды**:
- **База данных**: Проверяет наличие PIN через `user_pins` таблицу (`hasPin`)
- **LocalStorage**: Проверяет наличие сохраненных данных устройства (`canUsePinLogin`)

Когда refresh_token истекает или не сохраняется, `canUsePinLogin = true` (есть `user_id` в localStorage), но `refresh_token` отсутствует, что приводит к ошибке.

### Проблема 2: Race Condition в Auth.tsx
```typescript
// Строки 60-69: Эффект проверяет hasPin ДО того, как проверка завершилась
useEffect(() => {
  if (user && !showPinSetup) {
    if (!hasPin && !pinLoading) {  // hasPin может быть false пока идет загрузка
      setShowPinSetup(true);       // Показывает setup, хотя PIN уже есть
      setView('pin-setup');
    }
  }
}, [user, hasPin, pinLoading, ...]);
```

### Проблема 3: clearPinData не вызывается внутри useCallback
В `verifyPin` функции `clearPinData` вызывается напрямую, но сама функция объявлена позже, что может вызвать проблемы с замыканием.

### Проблема 4: Отсутствие валидации refresh_token
Система не проверяет наличие `refresh_token` при определении `canUsePinLogin`.

---

## План исправлений

### Шаг 1: Исправить определение canUsePinLogin

**Файл:** `src/hooks/usePinAuth.ts`

Изменить логику проверки доступности PIN-логина - требовать наличие И user_id, И refresh_token:

```typescript
// Было:
const canUsePinLogin = savedUserId !== null;

// Будет:
const [hasRefreshToken, setHasRefreshToken] = useState(false);

useEffect(() => {
  const userId = localStorage.getItem(PIN_USER_KEY);
  const email = localStorage.getItem(PIN_EMAIL_KEY);
  const refreshToken = localStorage.getItem(PIN_REFRESH_TOKEN_KEY);
  
  setSavedUserId(userId);
  setSavedEmail(email);
  setHasRefreshToken(!!refreshToken);
}, []);

const canUsePinLogin = savedUserId !== null && hasRefreshToken;
```

### Шаг 2: Исправить Race Condition в Auth.tsx

**Файл:** `src/pages/Auth.tsx`

Добавить дополнительную проверку для предотвращения показа PIN setup, когда пользователь уже авторизован через PIN:

```typescript
// Новая логика для useEffect
useEffect(() => {
  // Не показывать PIN setup если пользователь уже показал PIN login
  if (user && !showPinSetup) {
    // Важно: проверяем hasPin только когда pinLoading === false
    if (pinLoading) return; // Ждем завершения проверки
    
    if (!hasPin) {
      setShowPinSetup(true);
      setView('pin-setup');
    } else {
      navigate(redirectPath, { replace: true });
    }
  }
}, [user, hasPin, pinLoading, navigate, showPinSetup, redirectPath]);
```

### Шаг 3: Исправить clearPinData closure

**Файл:** `src/hooks/usePinAuth.ts`

Вынести `clearPinData` выше `verifyPin` и добавить её в зависимости:

```typescript
// Объявить clearPinData ДО verifyPin
const clearPinData = useCallback(() => {
  localStorage.removeItem(PIN_USER_KEY);
  localStorage.removeItem(PIN_EMAIL_KEY);
  localStorage.removeItem(PIN_REFRESH_TOKEN_KEY);
  setSavedUserId(null);
  setSavedEmail(null);
  setHasRefreshToken(false);
}, []);

// Теперь verifyPin может безопасно использовать clearPinData
const verifyPin = useCallback(async (pin: string) => {
  // ... логика
  if (sessionError || !sessionData.session) {
    clearPinData(); // Теперь работает корректно
    throw new Error('Session expired. Please login with password.');
  }
  // ...
}, [clearPinData]); // Добавить в зависимости
```

### Шаг 4: Обновить refresh_token после успешного входа по паролю

**Файл:** `src/pages/Auth.tsx`

После успешного входа через email/password, обновлять сохраненный refresh_token:

```typescript
const handleLogin = async (e: React.FormEvent) => {
  // ... существующая логика
  
  if (!error) {
    // Обновить refresh_token в localStorage если PIN уже настроен
    const refreshToken = (await supabase.auth.getSession()).data.session?.refresh_token;
    const savedUserId = localStorage.getItem('uno_pin_user_id');
    
    if (savedUserId && refreshToken) {
      localStorage.setItem('uno_pin_refresh_token', refreshToken);
    }
  }
};
```

### Шаг 5: Добавить синхронизацию после PIN setup

**Файл:** `src/components/auth/PinSetup.tsx`

Обеспечить обновление состояния `hasRefreshToken` после успешной настройки:

```typescript
// В setupPin уже сохраняется refresh_token
// Нужно убедиться, что состояние обновляется
```

---

## Техническая реализация

### Изменения в usePinAuth.ts:
1. Добавить `hasRefreshToken` state
2. Обновить проверку в useEffect при монтировании
3. Изменить `canUsePinLogin` на проверку обоих условий
4. Переместить `clearPinData` выше `verifyPin`
5. Добавить `clearPinData` в зависимости `verifyPin`
6. Обновлять `hasRefreshToken` в `clearPinData` и `setupPin`

### Изменения в Auth.tsx:
1. Упростить логику useEffect для PIN setup
2. Добавить явную проверку `pinLoading` перед принятием решения
3. Обновлять refresh_token после успешного входа по паролю

---

## Ожидаемый результат

После исправлений:
- PIN login будет показываться ТОЛЬКО если есть И user_id, И refresh_token
- PIN setup будет показываться ТОЛЬКО после полной проверки hasPin в базе
- При истечении сессии пользователь корректно перенаправляется на вход по паролю
- После входа по паролю refresh_token обновляется для следующего PIN входа
