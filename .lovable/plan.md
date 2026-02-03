
# План унификации карточек недвижимости + Черновики

## ✅ Завершено

### Этап 1: Property Adapters
- **mapPropertyToCardProps** — адаптер для OwnerProperty и VendorProperty
- **mapPropertyFormToCardProps** — адаптер для превью формы
- **UnifiedPropertyCardProps** — типы для унифицированных данных
- Экспорт из `src/lib/adapters/index.ts`

### Этап 2: PropertyListItem Component
- Создан `src/components/property/PropertyListItem.tsx`
- Поддержка режимов: `admin`, `owner`, `public`
- Единый размер фото: `w-24 h-24 sm:w-28 sm:h-28`
- Статус-оверлей (approval status) внизу фото
- Иконки: Bed, Bath, SquareStack
- DropdownMenu с действиями по режиму
- Бейджи: instant, protection, marketplace

### Этап 3: useFormDraft в usePropertyWizard
- Хук `usePropertyWizard.ts` теперь использует `useFormDraft`
- Автосохранение черновика в localStorage
- Экспорт: `hasDraft`, `lastSaved`, `clearDraft`, `restoreDraft`

### Этап 4: Миграция карточек
| Файл | Статус |
|------|--------|
| `HostListingsPanel.tsx` | ✅ Заменено на PropertyListItem |
| `OwnerProperties.tsx` | ✅ Заменено на PropertyListItem |
| `AdminProperties.tsx` | ✅ Заменено на PropertyListItem |

## ✅ Завершено полностью

### AddProperty.tsx — полная интеграция с useFormDraft
**Реализовано**:
- Заменён `useState` на `useFormDraft` для автосохранения данных формы
- Добавлен `DraftIndicator` — показывает "Автосохранено в HH:MM"
- Добавлен `DraftRestorationBanner` — предлагает восстановить черновик при открытии страницы
- Черновик очищается автоматически при успешной отправке формы

---

## Результат

1. ✅ **Единый адаптер** `mapPropertyToCardProps` — 100% консистентность данных
2. ✅ **Единая карточка** `PropertyListItem` — одинаковый UX везде
3. ✅ **Сохранение черновиков** — хук useFormDraft интегрирован в AddProperty.tsx
4. ✅ **UI индикаторы** — DraftIndicator и DraftRestorationBanner в AddProperty.tsx
5. ✅ **Меньше дублирования** — 1 компонент PropertyListItem вместо 4 реализаций
