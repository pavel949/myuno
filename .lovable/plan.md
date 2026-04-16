

# Добавить Google Maps API Key в проект

## Что нужно сделать

Добавить `VITE_GOOGLE_MAPS_API_KEY=AIzaSyBmStCe9bF3AmfuY3TbBmtiGl8RfH0z2ag` в файл `.env`.

Это публичный клиентский ключ (используется в браузере), поэтому его безопасно хранить в `.env` файле проекта.

## Изменения

### 1. Обновить `.env`
Добавить строку:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBmStCe9bF3AmfuY3TbBmtiGl8RfH0z2ag
```

### 2. Для production (Vercel)
Эту же переменную нужно будет добавить в Vercel Dashboard → Settings → Environment Variables, чтобы карты работали на `www.myuno.app`.

## Результат
После добавления Google Maps заработает на страницах `/map`, `/beauty/map` и везде, где используется `GoogleMapsProvider`.

