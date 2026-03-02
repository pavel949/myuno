

# Масштабирование Channel Manager: 25+ OTA-каналов

## Подход

Текущая iCal-архитектура уже универсальна. Задача сводится к:
1. Расширению реестра каналов (данные, не код) до 25+ OTA
2. Улучшению UI для навигации по большому числу каналов
3. Добавлению возможности подключить "любой другой" канал через Custom iCal URL

## Каналы для добавления (20+ новых)

### Крупные OTA
- Expedia / Hotels.com (общая iCal система)
- Agoda
- TripAdvisor / Viator Rentals
- Hostelworld
- Trivago (через iCal партнёров)

### Vacation Rental специфичные
- Marriott Homes & Villas
- Holidu
- Hometogo
- Atraveo
- Casamundo
- Traum-Ferienwohnungen
- FeWo-direkt (VRBO Germany)
- Abritel (VRBO France)

### Азия / Таиланд
- Agoda Homes
- Traveloka
- Trip.com
- Ctrip / Qunar

### Прочие
- Wimdu
- 9flats
- HouseTrip
- Homestay.com
- Furnished Finder
- Spotahome
- Turno (для уборок)
- iCal Custom (произвольная ссылка)

## Технические изменения

### 1. Вынести данные каналов в расширяемый реестр

**Файл: `src/components/owner/channel-manager/channelRegistry.ts`** (новый)

Единый реестр всех каналов с полной информацией:
- id, name, icon/logo, color scheme
- category (major_ota | vacation_rental | asia_pacific | other)
- instructions (en/ru) для получения iCal-ссылки
- helpUrl — ссылка на документацию OTA
- urlPattern — regex для автоопределения источника по URL

Это data-driven подход: добавление нового канала = добавление одного объекта в массив, без изменения кода компонентов.

### 2. Обновить QuickConnectCards

**Файл: `src/components/owner/channel-manager/QuickConnectCards.tsx`** (редактирование)

- Заменить хардкод `OTA_CHANNELS` на импорт из реестра
- Добавить группировку по категориям (Major OTA / Vacation Rental / Asia / Other)
- Показать 4-6 "рекомендуемых" каналов сверху, остальные — в раскрывающемся блоке "All channels"
- Добавить поиск по названию канала
- Добавить карточку "Custom / Other" для произвольного iCal URL

### 3. Обновить channelConfig.ts

**Файл: `src/components/owner/channel-manager/channelConfig.ts`** (редактирование)

- Расширить `getChannelConfig()` для распознавания новых каналов по URL-паттернам
- Добавить цветовые схемы и иконки для всех новых каналов
- Улучшить автодетект: по URL определять канал при синхронизации

### 4. Обновить ChannelHealthDashboard

**Файл: `src/components/owner/channel-manager/ChannelHealthDashboard.tsx`** (редактирование)

- Адаптировать сводку для большего числа каналов
- Группировка подключённых каналов по категориям

## Архитектура (без изменений в БД)

Текущая таблица `property_external_calendars` уже универсальна — она хранит `ical_url` и `name`. Новые каналы не требуют миграций. Edge Function `ical-scheduled-sync` обрабатывает все каналы одинаково через iCal-протокол.

## Итоговая структура файлов

### Новые файлы
1. `src/components/owner/channel-manager/channelRegistry.ts` — единый реестр 25+ каналов

### Изменяемые файлы
2. `src/components/owner/channel-manager/QuickConnectCards.tsx` — UI с категориями и поиском
3. `src/components/owner/channel-manager/channelConfig.ts` — расширенный автодетект каналов

