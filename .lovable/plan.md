
# Нативное мобильное приложение: PWA + Capacitor

## Что уже готово (PWA)

Ваш проект уже имеет хорошо настроенный PWA:
- Service Worker с кэшированием и офлайн-режимом
- Manifest с иконками (72, 192, 512px)
- Мета-теги для iOS (standalone, status bar)
- Автоматическое обновление при новых версиях

## Что нужно улучшить в PWA

### 1. Добавить `navigateFallbackDenylist` для OAuth
Критически важно: маршрут `/~oauth` не должен кэшироваться service worker-ом. В `sw.ts` уже есть `/~oauth` в denylist навигации, но в конфигурации `vite.config.ts` это отсутствует.

### 2. Добавить недостающие размеры иконок для Apple
Сейчас есть только 72, 192 и 512px. Для полноценного iOS-опыта нужны:
- `icon-120x120.png` (iPhone)
- `icon-152x152.png` (iPad)
- `icon-180x180.png` (iPhone Retina)

### 3. Добавить splash-скрины для iOS
Apple требует splash-скрины для красивого запуска приложения. Добавим meta-теги `apple-touch-startup-image`.

## Настройка Capacitor (нативное приложение)

### 4. Установка Capacitor
Установить пакеты:
- `@capacitor/core`
- `@capacitor/cli` (dev)
- `@capacitor/ios`
- `@capacitor/android`

### 5. Создать конфигурацию Capacitor
Файл `capacitor.config.ts`:
- appId: `app.lovable.dcc2b02476274ad9a915a3df3dd839f0`
- appName: `myUNO`
- Server URL для hot-reload из sandbox

### 6. Добавить нативные плагины (по необходимости)
В будущем можно добавить:
- `@capacitor/push-notifications` -- настоящие пуш-уведомления
- `@capacitor/camera` -- доступ к камере
- `@capacitor/geolocation` -- GPS
- `@capacitor/haptics` -- вибрация

## Файлы

| Действие | Файл | Описание |
|----------|------|----------|
| Обновить | `vite.config.ts` | Добавить `navigateFallbackDenylist` для `/~oauth` |
| Обновить | `index.html` | Добавить splash-screen meta-теги для iOS |
| Создать | `capacitor.config.ts` | Конфигурация Capacitor с hot-reload |
| Установить | NPM-пакеты | `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android` |

## После реализации: ваши шаги

Чтобы запустить приложение на телефоне:
1. Перенести проект на GitHub через кнопку "Export to GitHub"
2. Склонировать проект и выполнить `npm install`
3. Добавить платформы: `npx cap add ios` и/или `npx cap add android`
4. Собрать: `npm run build && npx cap sync`
5. Запустить: `npx cap run ios` (нужен Mac + Xcode) или `npx cap run android` (Android Studio)
