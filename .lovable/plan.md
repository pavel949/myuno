
# План: Установка Android одним нажатием

## Проблема
На Android гайд показывается автоматически, даже когда доступна нативная установка. Нужно сделать так, чтобы на Android в Chrome установка происходила одним нажатием кнопки без дополнительных диалогов.

## Решение

### 1. Убрать автоматический показ гайдов при загрузке страницы
Сейчас в `Install.tsx` есть `useEffect`, который автоматически показывает гайд через 500мс. Это мешает нативной установке.

**Файл:** `src/pages/Install.tsx`
- Удалить `useEffect`, который автоматически показывает `showAndroidGuide` и `showIOSGuide`
- Гайды будут показываться только если пользователь нажал кнопку И нативная установка недоступна

### 2. Улучшить логику кнопки установки
Кнопка должна:
- Если `canInstall = true` → сразу вызвать `install()` (нативный диалог браузера)
- Если `canInstall = false` И Android → показать гайд
- Если `canInstall = false` И iOS → показать гайд для iOS

### 3. Добавить повторную проверку `canInstall`
Иногда событие `beforeinstallprompt` приходит с задержкой. Добавить небольшое ожидание перед показом гайда.

## Изменения в файлах

### `src/pages/Install.tsx`
```tsx
// УДАЛИТЬ этот useEffect (строки ~50-62):
useEffect(() => {
  if (!canInstall && !isInstalled && installState === 'idle') {
    const timer = setTimeout(() => {
      if (isIOS) setShowIOSGuide(true);
      else if (isAndroid) setShowAndroidGuide(true);
    }, 500);
    return () => clearTimeout(timer);
  }
}, [isIOS, isAndroid, canInstall, isInstalled, installState]);

// ИЗМЕНИТЬ handleInstallClick:
const handleInstallClick = async () => {
  // Если есть нативный промпт - используем его
  if (canInstall) {
    setInstallState('installing');
    const progressInterval = simulateProgress();
    
    const success = await install();
    clearInterval(progressInterval);
    
    if (success) {
      setProgress(100);
      setInstallState('success');
      trackInstall({ platform: isAndroid ? 'android' : 'desktop', source: 'install_page' });
    } else {
      setInstallState('idle');
      setProgress(0);
    }
    return; // Важно: выходим после попытки
  }
  
  // Нативная установка недоступна - показываем гайды
  if (isIOS) {
    setShowIOSGuide(true);
  } else if (isAndroid) {
    setShowAndroidGuide(true);
  }
};
```

## Результат
- **Android Chrome с поддержкой PWA:** Нажатие кнопки "Установить" → нативный диалог браузера → установка
- **Android другие браузеры:** Нажатие кнопки → показ пошагового гайда
- **iOS:** Нажатие кнопки → показ гайда для Safari
