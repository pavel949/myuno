
# Скрытие "Тип управления" / "Условия" + исправление бренда на myUNO

## Что делаем

### 1. Скрыть блок "Тип управления" и "Условия управления" в форме создания/редактирования объекта

Файл: `src/components/owner/property-wizard/steps/BasicInfoStep.tsx`
- Удалить (или обернуть в `{false && ...}`) карточку "Management Type" (строки 310-350) -- блок с выбором типа управления (full / partial / self)
- Удалить блок "Rental status" (Listed on OTAs) внутри той же карточки (строки 334-348)
- Удалить блок "Management Terms" (условия управления, строки 352-367)
- Убрать неиспользуемые импорты (`MANAGEMENT_TYPE_OPTIONS`, `Settings2`, `Users`, `Switch`)
- Оставить значение по умолчанию `management_type: 'full'` в `usePropertyWizard.ts` -- данные продолжают сохраняться, просто UI скрыт

### 2. Исправить название платформы: везде должно быть "myUNO" (не "UNO")

Затронутые файлы и исправления:

| Файл | Было | Станет |
|------|------|--------|
| `src/pages/HowItWorks.tsx` | `'Why choose UNO'`, `'UNO is your personal assistant...'`, `'Почему выбирают UNO'`, `'UNO — ваш персональный помощник...'` | `'Why choose myUNO'`, `'myUNO is your personal assistant...'`, `'Почему выбирают myUNO'`, `'myUNO — ваш персональный помощник...'` |
| `src/components/admin/AdminCommandPalette.tsx` | `'UNO Team'`, `'Команда UNO'` | `'myUNO Team'`, `'Команда myUNO'` |
| `src/lib/config/investorData.ts` | `'Operations & UNO Team'`, `'Операции и UNO Team'` | `'Operations & myUNO Team'`, `'Операции и myUNO Team'` |
| `src/pages/admin/AdminUnoTeam.tsx` | Все вхождения `'UNO Team'` | `'myUNO Team'` |
| `src/components/market/drawer/DrawerFooter.tsx` | `'Phuket Edition v1.0'` | `'myUNO · Phuket Edition'` |

Файлы, где бренд уже корректен (не трогаем): `index.html`, `CompactFooter.tsx`, `ServiceDrawerFooter.tsx`, `OnboardingModal.tsx`, `PropertySubmissionSuccess.tsx`, `types/auth.ts`.

## Технические детали

- В `BasicInfoStep.tsx` блоки скрываются полностью (удаление JSX), а не через CSS -- чтобы не загружать лишние данные
- Поле `management_type` остаётся в форме и базе данных, просто не отображается в UI. Когда функционал потребуется -- легко вернуть
- Все строки с названием платформы проверены через поиск по паттернам `'UNO`, `"UNO`, исключая правильные `myUNO`
