
# Исправление загрузки старой версии при открытии приложения

## Диагноз проблемы

Проблема заключается в цикле кэширования PWA:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    ТЕКУЩИЙ ПРОБЛЕМНЫЙ ЦИКЛ                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. Пользователь открывает приложение                               │
│           ↓                                                         │
│  2. Service Worker отдаёт СТАРЫЙ index.html из кэша                │
│           ↓                                                         │
│  3. Старый скрипт версии (в HTML) сравнивает с localStorage        │
│     → Версии совпадают (обе старые!) → НЕТ ПЕРЕЗАГРУЗКИ            │
│           ↓                                                         │
│  4. В фоне SW скачивает новый index.html                           │
│           ↓                                                         │
│  5. Только при ВТОРОМ открытии/рефреше → новая версия              │
└─────────────────────────────────────────────────────────────────────┘
```

**Корневая причина:** `index.html` кэшируется Service Worker'ом. Когда пользователь открывает приложение, он получает закэшированную версию, где `CURRENT_VERSION` ещё старый.

---

## Решение: 3 уровня защиты

### Уровень 1: Принудительная перезагрузка при смене контроллера SW

Добавить в `index.html` слушатель события `controllerchange`. Когда новый Service Worker активируется и берёт контроль — немедленная перезагрузка страницы.

```javascript
// Добавить в index.html
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    console.log('[myUNO] New SW controller - reloading');
    window.location.reload();
  });
}
```

### Уровень 2: Независимая проверка версии через сеть

Вместо того чтобы полагаться на закэшированную версию в HTML, делаем сетевой запрос к `manifest.json` с cache-bust параметром для получения актуальной информации о версии.

```javascript
// Проверяем реальную версию на сервере
fetch('/manifest.json?_=' + Date.now(), { cache: 'no-store' })
  .then(r => r.json())
  .then(data => {
    if (data.version !== localStorage.getItem('manifest_version')) {
      localStorage.setItem('manifest_version', data.version);
      // Принудительная очистка и перезагрузка
    }
  });
```

### Уровень 3: Версионирование манифеста

Добавить поле `version` в `manifest.json`, которое будет использоваться как независимый источник правды.

---

## Технические изменения

### Файл 1: `public/manifest.json`
**Действие:** Добавить поле версии

```json
{
  "name": "myUNO",
  "version": "3.4.4",
  // ... остальное
}
```

### Файл 2: `index.html`
**Действие:** Переписать логику проверки версии

Вместо проверки захардкоженной версии внутри HTML:

1. Добавить слушатель `controllerchange` для немедленной перезагрузки
2. Добавить независимую проверку версии через fetch к manifest.json
3. Сделать проверку НЕ блокирующей загрузку приложения

```javascript
// НОВАЯ ЛОГИКА (псевдокод):
(function() {
  // 1. Слушаем смену контроллера SW
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
  
  // 2. Проверяем версию через сеть (не блокирует)
  fetch('/manifest.json?_=' + Date.now(), { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      var serverVersion = data.version;
      var storedVersion = localStorage.getItem('manifest_version');
      
      if (storedVersion && storedVersion !== serverVersion) {
        // Версия изменилась! Очищаем кэши и перезагружаемся
        localStorage.setItem('manifest_version', serverVersion);
        // ... очистка кэшей ...
        window.location.replace('/');
      } else if (!storedVersion) {
        // Первый визит - просто сохраняем
        localStorage.setItem('manifest_version', serverVersion);
      }
    });
    
  // 3. Синхронная проверка (fallback для offline)
  var CURRENT_VERSION = '3.4.4';
  // ... существующая логика ...
})();
```

### Файл 3: `src/lib/appVersion.ts`
**Действие:** Синхронизировать версию и добавить утилиту проверки

```typescript
export const APP_VERSION = '3.4.4';

// Новая функция для проверки серверной версии
export async function checkForUpdates(): Promise<boolean> {
  try {
    const response = await fetch('/manifest.json?_=' + Date.now(), { 
      cache: 'no-store' 
    });
    const manifest = await response.json();
    return manifest.version !== APP_VERSION;
  } catch {
    return false;
  }
}
```

### Файл 4: `vite.config.ts`
**Действие:** Ужесточить стратегию кэширования для навигации

```typescript
// Изменить таймаут NetworkFirst для навигации
runtimeCaching: [
  {
    urlPattern: ({ request }) => request.mode === 'navigate',
    handler: 'NetworkFirst',
    options: {
      cacheName: 'pages-v7', // Инкремент версии кэша
      networkTimeoutSeconds: 3, // НОВОЕ: таймаут 3 сек
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 // 1 минута вместо 2
      }
    }
  },
  // ... обновить версии других кэшей до v7
]
```

---

## Визуальное сравнение

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    НОВЫЙ ИСПРАВЛЕННЫЙ ЦИКЛ                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. Пользователь открывает приложение                               │
│           ↓                                                         │
│  2. SW отдаёт HTML из кэша (быстро!) + fetch к manifest.json       │
│           ↓                                                         │
│  3. manifest.json приходит с РЕАЛЬНОЙ версией сервера               │
│           ↓                                                         │
│  4. Сравнение: manifest_version в localStorage ≠ серверная версия   │
│           ↓                                                         │
│  5. НЕМЕДЛЕННАЯ перезагрузка с очисткой кэшей                       │
│           ↓                                                         │
│  6. Пользователь видит актуальную версию                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Порядок реализации

1. **Обновить `public/manifest.json`** — добавить поле `version: "3.4.4"`
2. **Переписать логику в `index.html`** — добавить 3 уровня защиты
3. **Обновить `src/lib/appVersion.ts`** — синхронизировать версию, добавить проверку
4. **Обновить `vite.config.ts`** — ужесточить кэширование, инкрементировать версии кэшей

---

## Что получит пользователь

- При первом открытии после обновления — автоматическая перезагрузка в течение 1-2 секунд
- Никакого "старого контента" при последующих открытиях
- Чёткое логирование в консоли: `[myUNO] Server version 3.4.4 detected, reloading...`
