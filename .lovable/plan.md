
# Исправление модуля собственников

## 1. Единое название бренда "myUNO" везде

Заменить все варианты ("UNO Property Care", "UNO Property") на единое "myUNO":

| Файл | Было | Станет |
|------|------|--------|
| `src/pages/owner/OwnerDashboard.tsx` (строка 37) | "UNO Property Care" | "myUNO" |
| `src/components/owner/OwnerSidebar.tsx` (строка 107) | "UNO Property" | "myUNO" |
| `src/pages/owner/OwnerGuidePage.tsx` (строка 47) | "UNO Property Care v2.0" | "myUNO v2.0" |
| `src/components/owner/guide/GuideCover.tsx` (строка 29-30) | "...в экосистеме UNO Property Care" | "...в экосистеме myUNO" |
| `src/components/owner/guide/GuideComparison.tsx` (строка 60-61) | "UNO Property Care" | "myUNO" |
| `src/components/owner/guide/GuidePropertyCare.tsx` (строка 57) | "UNO Property Care" | "myUNO Property Care" |
| `src/components/owner/guide/GuideTableOfContents.tsx` (строка 15-16) | "Преимущества UNO" | "Преимущества myUNO" |

## 2. Убрать выдуманные маркетинговые цифры

**`src/components/owner/guide/GuideIntegration.tsx`** (строки 199-204): Заменить "Средняя заполняемость: 85%" на value-driven текст: "Прозрачная отчётность каждый месяц" / "Transparent monthly reporting".

## 3. Добавить data-tour атрибуты в OwnerDashboard

Тур ссылается на 5 элементов: `quick-actions`, `portfolio`, `add-property`, `finances`, `team`. Эти атрибуты есть в старых компонентах (`QuickActionsBar`, `PortfolioSection`, `FinancesSummary`, `CommunicationsSection`), но текущий дашборд их не использует.

Решение -- обновить шаги тура под текущие компоненты дашборда и добавить `data-tour` атрибуты к ним:

| Компонент | data-tour атрибут | Шаг тура |
|-----------|-------------------|----------|
| `ActiveStaysWidget` (обёртка в OwnerDashboard) | `active-stays` | "Текущие гости -- кто сейчас проживает" |
| `OwnerPropertiesList` (обёртка в OwnerDashboard) | `properties` | "Ваши объекты -- все объекты в одном месте" |
| `OwnerOperationsFlat` (обёртка в OwnerDashboard) | `operations` | "Задачи на сегодня -- уборки, обслуживание" |
| `OwnerDashboardMenu` (обёртка в OwnerDashboard) | `menu` | "Меню -- каналы, отчёты, поддержка" |

Обновить `OwnerOnboardingTour.tsx`: заменить 5 старых шагов на 4 новых, привязанных к реальным секциям. Убрать эмодзи из заголовков шагов (согласно бренд-буку -- только Lucide-иконки).

## 4. Убрать лишние скобки в OwnerPropertiesList

**`src/components/owner/dashboard/OwnerPropertiesList.tsx`** (строка 142): `{(` -> `{` и соответствующее закрытие `)}` -> `}`.

---

## Технические детали: файлы и изменения

**Изменяемые файлы (9 штук):**

1. `src/pages/owner/OwnerDashboard.tsx` -- бренд "myUNO" + обёртки `data-tour` на секциях
2. `src/components/owner/OwnerSidebar.tsx` -- бренд "myUNO"
3. `src/pages/owner/OwnerGuidePage.tsx` -- бренд "myUNO"
4. `src/components/owner/guide/GuideCover.tsx` -- бренд "myUNO"
5. `src/components/owner/guide/GuideComparison.tsx` -- бренд "myUNO"
6. `src/components/owner/guide/GuidePropertyCare.tsx` -- бренд "myUNO"
7. `src/components/owner/guide/GuideTableOfContents.tsx` -- бренд "myUNO"
8. `src/components/owner/guide/GuideIntegration.tsx` -- убрать "85%"
9. `src/components/owner/onboarding/OwnerOnboardingTour.tsx` -- обновить шаги тура
10. `src/components/owner/dashboard/OwnerPropertiesList.tsx` -- убрать лишние скобки
