
# ✅ ЗАВЕРШЕНО: Быстрая привязка категории + Условия сотрудничества

## Реализовано

### 1. CategorySelector — Группированный селектор категорий
**Файл:** `src/components/admin/CategorySelector.tsx`

- Command-palette стиль с поиском (cmdk)
- 2 группы: "🏠 Домашние услуги" и "🏢 Общие категории"
- Все 16 Home Service категорий + 14 General категорий
- Поддержка single/multiple selection
- Заменяет длинный dropdown в форме провайдера

### 2. ProviderContractEditor — Inline редактор условий
**Файл:** `src/components/admin/ProviderContractEditor.tsx`

- Комиссия: ставка %, мин/макс суммы
- Условия оплаты: за транзакцию / еженедельно / ежемесячно
- Тип контракта: стандартный / эксклюзивный / пробный
- Автопродление (toggle)
- Банковские реквизиты: банк, счёт, имя владельца
- Автосоздание контракта со статусом `active` для админа

### 3. Интеграция в AdminProviderDetail
- Новая вкладка "Условия" (Handshake icon)
- Inline редактирование прямо в карточке провайдера
- Не нужно переходить на `/admin/contracts`

### 4. Обновлённый AdminProviders
- Select заменён на CategorySelector
- Группировка Home Services + General в одном компоненте

