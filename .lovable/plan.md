

# Проблемы с Google картой — диагностика и план

## Обнаружено две проблемы

### 1. RefererNotAllowedMapError (основная — карта не рендерится)

Из консоли:
```
Google Maps JavaScript API error: RefererNotAllowedMapError
Your site URL to be authorized: https://dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovableproject.com
```

**Причина:** В Google Cloud Console в настройках API-ключа домен `*.lovableproject.com` не добавлен в разрешённые HTTP referrers. Карта блокируется Google на уровне API.

**Решение:** Это нельзя исправить кодом — нужно в Google Cloud Console → Credentials → ваш API-ключ → Website restrictions добавить:
- `https://*.lovableproject.com/*`
- `https://*.lovable.app/*`

Без этого карта не будет работать в preview и на опубликованном сайте.

### 2. «Function components cannot be given refs» (предупреждение в консоли)

`OwnerProperties` пытается передать ref в `PropertyMapView`, но компонент не обёрнут в `React.forwardRef()`.

**Решение (код):** Обернуть `PropertyMapView` в `forwardRef` — простое изменение в одном файле `src/components/property/PropertyMapView.tsx`.

---

## Что можно сделать на стороне кода

| Шаг | Файл | Описание |
|-----|------|----------|
| 1 | `PropertyMapView.tsx` | Обернуть компонент в `forwardRef` для устранения предупреждения |

## Что нужно сделать вручную

Добавить домены в Google Cloud Console (Credentials → API Key → HTTP referrers):
- `https://*.lovableproject.com/*`
- `https://*.lovable.app/*`
- `https://myuno.app/*` (если ещё нет)

