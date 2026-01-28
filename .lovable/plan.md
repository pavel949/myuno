
# План: Playwright E2E Тесты для myUNO SuperApp

## Обзор
Настройка Playwright и создание E2E тестов для критических пользовательских сценариев SuperApp.

---

## Файловая структура

```text
e2e/
├── playwright.config.ts
├── fixtures/
│   └── auth.fixture.ts
├── pages/
│   ├── AuthPage.ts
│   ├── HomePage.ts
│   ├── BookingPage.ts
│   ├── WalletPage.ts
│   └── VendorPage.ts
└── tests/
    ├── auth/
    │   ├── login.spec.ts
    │   ├── signup.spec.ts
    │   └── pin.spec.ts
    ├── booking/
    │   ├── tour-booking.spec.ts
    │   ├── yacht-booking.spec.ts
    │   └── booking-flow.spec.ts
    ├── wallet/
    │   └── wallet.spec.ts
    ├── vendor/
    │   └── vendor-dashboard.spec.ts
    └── navigation/
        └── home.spec.ts
```

---

## Покрываемые сценарии

### 1. Аутентификация (Критичность: Высокая)
| Тест | Описание |
|------|----------|
| Email Login | Вход email + пароль → редирект на главную |
| Signup Flow | 3-шаговая регистрация → создание аккаунта |
| PIN Login | Ввод 4-значного PIN → успешный вход |
| PIN Setup | После первого входа → настройка PIN |
| Password Reset | Запрос сброса пароля → проверка toast |

### 2. Бронирование (Критичность: Высокая)
| Тест | Описание |
|------|----------|
| Tour Booking | Выбор даты/времени → участники → оплата → подтверждение |
| Yacht Booking | Выбор яхты → дата → контакты → успех |
| Validation | Проверка обязательных полей |
| Payment Methods | Cash / Card / Wallet переключение |

### 3. Кошелёк (Критичность: Средняя)
| Тест | Описание |
|------|----------|
| Balance Display | Отображение баланса |
| TopUp Modal | Открытие → выбор суммы → Stripe редирект |
| Transaction History | Загрузка истории операций |

### 4. Vendor Dashboard (Критичность: Средняя)
| Тест | Описание |
|------|----------|
| Auth Redirect | Неавторизованный → /auth |
| Onboarding Redirect | Нет орг → /vendor/onboarding |
| KPI Display | Загрузка и отображение метрик |
| Orders List | Отображение последних заказов |

### 5. Навигация (Критичность: Базовая)
| Тест | Описание |
|------|----------|
| Home Load | Главная загружается без ошибок |
| Categories | Клик по категории → переход |
| Search Modal | Открытие поиска |
| Language Switch | RU/EN переключение |

---

## Технические детали

### Конфигурация Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30000,
  retries: 1,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Page Object Model

```typescript
// e2e/pages/AuthPage.ts
export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly pinInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button:has-text("Login"), button:has-text("Войти")');
    this.pinInput = page.locator('[data-testid="pin-input"]');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async enterPin(pin: string) {
    for (const digit of pin) {
      await this.pinInput.locator(`input`).nth(parseInt(digit)).focus();
      await this.page.keyboard.type(digit);
    }
  }
}
```

### Пример теста

```typescript
// e2e/tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/AuthPage';

test.describe('Authentication', () => {
  test('should login with email and password', async ({ page }) => {
    const authPage = new AuthPage(page);
    await page.goto('/auth');
    
    await authPage.login('test@example.com', 'password123');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=myUNO')).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('/auth');
    await page.click('button:has-text("Login")');
    
    await expect(page.locator('text=Invalid email')).toBeVisible();
  });
});
```

### Booking Flow Test

```typescript
// e2e/tests/booking/tour-booking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Tour Booking', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');
    await page.waitForURL('/');
  });

  test('should complete tour booking flow', async ({ page }) => {
    await page.goto('/tours');
    await page.click('.tour-card >> nth=0');
    await page.click('button:has-text("Book")');
    
    // Select date
    await page.click('[data-date="tomorrow"]');
    
    // Select time
    await page.click('button:has-text("09:00")');
    
    // Fill contact info
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="phone"]', '+66123456789');
    
    // Select payment
    await page.click('button:has-text("Cash")');
    
    // Submit
    await page.click('button:has-text("Confirm")');
    
    // Verify confirmation
    await expect(page.locator('text=Booking Confirmed')).toBeVisible();
  });
});
```

---

## Зависимости для установки

```json
{
  "devDependencies": {
    "@playwright/test": "^1.48.0"
  }
}
```

---

## Порядок реализации

1. **Конфигурация** — `playwright.config.ts` + установка зависимостей
2. **Page Objects** — AuthPage, HomePage, BookingPage, WalletPage, VendorPage
3. **Auth тесты** — login, signup, PIN flow
4. **Booking тесты** — tours, yachts
5. **Wallet тесты** — balance, topup
6. **Vendor тесты** — dashboard, orders
7. **Navigation тесты** — home, categories

---

## Добавление data-testid

Для надёжных селекторов добавим `data-testid` к ключевым элементам:

| Компонент | testid |
|-----------|--------|
| PIN Input | `pin-input` |
| Login Button | `login-button` |
| Signup Button | `signup-button` |
| Booking Submit | `booking-submit` |
| Wallet Balance | `wallet-balance` |
| TopUp Button | `topup-button` |

---

## Команды запуска

```bash
# Установка браузеров
npx playwright install

# Запуск всех тестов
npx playwright test

# UI режим
npx playwright test --ui

# Только auth тесты
npx playwright test auth/

# С отчётом
npx playwright show-report
```
