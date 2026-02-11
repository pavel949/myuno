

# Исправление кнопки бронирования транспорта + улучшение поиска жилья

## 1. Кнопка бронирования перекрыта навигацией (транспорт)

### Причина
Глобальная нижняя навигация (`AdaptiveBottomNav`) рендерится **вне** `AppLayout` в `AnimatedRoutes.tsx`. Параметр `showBottomNav={false}` убирает только padding, но сама панель навигации продолжает отображаться поверх кнопки.

В списке `routesWithOwnBottomBar` есть `/transfer/` (трансфер), но **нет `/transport/`** (аренда авто). Поэтому на страницах `/transport/vehicle/*` и `/transport/fast-track` навигация не прячется и перекрывает CTA.

### Решение
Добавить `/transport/` в массив `routesWithOwnBottomBar` в файле `src/components/layout/AdaptiveBottomNav.tsx`.

---

## 2. Спальни недоступны с первого экрана жилья

### Текущее поведение
- Страница `/property` (PropertyIndex) показывает: поиск (район, даты, гости) + иконки категорий + карточки
- Селектор спален доступен только на `/property/search` через попапы фильтров
- Пользователь не может указать количество спален пока не перейдёт на вторую страницу

### Решение
Добавить в `AirbnbSearchBar` четвёртый таб "Спальни" (Bedrooms) в мобильном модале поиска. На десктопе — добавить дополнительный попап-секцию между датами и гостями.

### Что будет в табе "Спальни"
- Сетка кнопок: Студия, 1, 2, 3, 4, 5+ (аналогично `PropertySearchPage`)
- Множественный выбор
- Передача выбранных значений в `SearchParams` → URL-параметр `bedrooms`

### Изменения по файлам

| Файл | Изменение |
|------|-----------|
| `src/components/layout/AdaptiveBottomNav.tsx` | Добавить `/transport/` в `routesWithOwnBottomBar` |
| `src/components/property/AirbnbSearchBar.tsx` | Добавить таб "Спальни" в мобильный модал и попап на десктопе; расширить `SearchParams` полем `bedrooms: string[]` |
| `src/pages/property/PropertyIndex.tsx` | Передавать `bedrooms` из `SearchParams` в URL при переходе на `/property/search` |
| `src/pages/property/PropertySearchPage.tsx` | Считывать `bedrooms` из URL и применять как начальный фильтр |

### Порядок табов в поиске (мобайл)
```text
Куда | Когда | Спальни | Кто
```

