
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

---

## ⏳ Требует дальнейшей работы

### AddProperty.tsx — полная интеграция с usePropertyWizard
**Проблема**: AddProperty.tsx дублирует логику формы (собственный useState), вместо использования хука usePropertyWizard.

**Решение**: Рефакторинг AddProperty.tsx для использования хука usePropertyWizard и добавление UI-индикаторов:
- `DraftIndicator` — показывает "Автосохранено в HH:MM"
- `DraftRestorationBanner` — предлагает восстановить черновик

---

## Результат

1. ✅ **Единый адаптер** `mapPropertyToCardProps` — 100% консистентность данных
2. ✅ **Единая карточка** `PropertyListItem` — одинаковый UX везде
3. ✅ **Сохранение черновиков** — хук usePropertyWizard с useFormDraft
4. ⏳ **UI индикаторы** — требует интеграции в AddProperty.tsx
5. ✅ **Меньше дублирования** — 1 компонент вместо 4 реализаций
