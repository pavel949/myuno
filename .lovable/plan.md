

# Наполнение Knowledge Hub контентом для Phuket

## Текущее состояние

Сейчас в базе **8 статей** для Phuket:
- Overview: Geography, Climate
- Culture: Thai Culture Basics
- Dos-Donts: Cultural Etiquette
- Government: Immigration Office
- Nature: Wildlife Safety
- Practical: SIM Cards
- Emergency: Emergency Numbers

## Новые статьи для добавления

### 1. Банки и финансы (секция: practical)

**Статья: banking-guide**
- Открытие счета для иностранцев (пошагово)
- Необходимые документы (паспорт, work permit, арендный контракт)
- Лучшие банки для экспатов (Bangkok Bank, Kasikorn, SCB)
- Онлайн-банкинг и мобильные приложения
- Переводы денег и SWIFT

### 2. Визы и иммиграция (секция: government)

**Статья: visa-guide**
- Типы виз (Tourist 60 дней, ED, Elite, LTR, Retirement)
- Продление туристической визы — пошаговая инструкция
- Visa run: маршруты и стоимость
- Документы для каждого типа визы
- Адреса иммиграционных офисов

### 3. Вождение в Таиланде (секция: practical)

**Статья: driving-guide**
- Международные права (IDP) — как получить
- Тайские права — процедура получения
- Правила дорожного движения
- Аренда байка/автомобиля
- Страховка транспорта
- Штрафы и полиция

### 4. Страхование (секция: practical)

**Статья: insurance-guide**
- Медицинская страховка для экспатов
- Сравнение локальных и международных полисов
- Страховка для визы (требования)
- Автострахование: обязательное и КАСКО
- Как подать claim — пошаговая инструкция

---

## Структура контента (пример формата)

Каждая статья будет содержать:
- **Summary** — краткое описание (2-3 предложения)
- **Content** — детальный Markdown с заголовками:
  - `## Что нужно знать`
  - `## Пошаговая инструкция`
  - `## Необходимые документы`
  - `## Стоимость и сроки`
  - `## Полезные советы`

---

## Технические детали

**Таблица:** `location_knowledge`

**Данные для вставки:**

| section | slug | title_en | title_ru | icon |
|---------|------|----------|----------|------|
| practical | banking-guide | Banking for Foreigners | Банки для иностранцев | 🏦 |
| government | visa-guide | Visa Guide | Визовый гид | 🛂 |
| practical | driving-guide | Driving in Thailand | Вождение в Таиланде | 🚗 |
| practical | insurance-guide | Insurance Guide | Страхование | 🛡️ |

**city_id:** `ccb1666c-ff29-4643-9e44-f7c437fe26fa` (Phuket)

---

## Примерный контент статей

### Banking Guide (EN/RU)

**English:**
```markdown
## Opening a Bank Account

### Required Documents
- Valid passport with valid visa (minimum 3 months)
- Work Permit OR Residence Certificate from Immigration
- Thai phone number
- Proof of address (rental contract or utility bill)

### Step-by-Step Process
1. Choose a bank (Bangkok Bank, Kasikorn, SCB recommended)
2. Visit the main branch (not small kiosks)
3. Bring all documents + copies
4. Fill application form
5. Initial deposit (usually 500-1000 THB)
6. Receive debit card immediately or within 7 days

### Best Banks for Expats
- **Bangkok Bank**: Largest network, English support
- **Kasikorn (KBank)**: Best mobile app
- **SCB**: Good for international transfers

### Mobile Banking
All major banks offer mobile apps with English interface:
- K PLUS (Kasikorn)
- SCB EASY
- Bangkok Bank Mobile Banking

### International Transfers
- SWIFT transfers available at all banks
- Wise/Remitly often cheaper for small amounts
- Keep documentation for amounts over $50,000
```

**Russian:**
```markdown
## Открытие банковского счета

### Необходимые документы
- Действующий паспорт с визой (минимум 3 месяца)
- Work Permit ИЛИ Residence Certificate из иммиграции
- Тайский номер телефона
- Подтверждение адреса (контракт аренды или счет за коммуналку)

### Пошаговая инструкция
1. Выберите банк (рекомендуем Bangkok Bank, Kasikorn, SCB)
2. Посетите главный офис (не маленькие киоски)
3. Принесите все документы + копии
4. Заполните анкету
5. Внесите депозит (обычно 500-1000 THB)
6. Получите дебетовую карту сразу или в течение 7 дней

### Лучшие банки для экспатов
- **Bangkok Bank**: Крупнейшая сеть, поддержка на английском
- **Kasikorn (KBank)**: Лучшее мобильное приложение
- **SCB**: Хорош для международных переводов

### Мобильный банкинг
Все крупные банки предлагают приложения на английском:
- K PLUS (Kasikorn)
- SCB EASY
- Bangkok Bank Mobile Banking

### Международные переводы
- SWIFT переводы доступны во всех банках
- Wise/Remitly часто дешевле для небольших сумм
- Сохраняйте документацию для сумм свыше $50,000
```

---

## План выполнения

1. **Вставить 4 новые статьи** в таблицу `location_knowledge`
2. **Обновить sort_order** для правильного отображения
3. **Проверить отображение** в Knowledge Hub UI

Все статьи будут доступны сразу после вставки данных (is_published = true).

