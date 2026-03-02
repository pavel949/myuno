

# Добавление описания объекта и доработка карточки комплекса

## 1. Добавить поля описания в шаг "Основная информация" (BasicInfoStep)

Сейчас в `PropertyFormData` есть поля `description` и `description_ru`, но в форме визарда нет textarea для их ввода. Добавлю:

- **Двуязычный Textarea** (TranslatableInput или два Textarea) для описания объекта, как в Airbnb — краткое привлекательное описание
- Размещу сразу после блока "Название / Title"
- Placeholder с подсказкой в стиле Airbnb: "Расскажите гостям, чем уникален ваш объект..."

**Файл:** `src/components/owner/property-wizard/steps/BasicInfoStep.tsx`  
**Изменение:** Добавить блок с `<Textarea>` для `description` / `description_ru` после TranslatableInput для Title (после строки ~156)

## 2. AI Intake — слияние с частично заполненной формой

Эта функция **уже работает**: кнопка "Быстрый ввод с AI" вызывает `onDataExtracted` -> `wizard.applyPrefillData`, которая мержит данные в текущую форму. Описание (`description`, `description_ru`) уже извлекается AI и передается в форму. С добавлением textarea пользователь сразу увидит результат.

Дополнительных изменений не требуется.

## 3. ComplexCard — показать только описание платформы, скрыть описание УК

В карточке комплекса (`ComplexCard.tsx`) сейчас вообще нет описания. Добавлю:
- Показ `description_en` / `description_ru` (описание для платформы) — 2 строки с line-clamp
- Поле `description` (описание от УК) — **не показывать**

**Файл:** `src/components/owner/ComplexCard.tsx`  
**Изменение:** Добавить отображение описания между названием/районом и строкой статистики

---

### Технические детали

**BasicInfoStep.tsx** — вставка после строки 156 (после TranslatableInput для Title):
```tsx
<div className="space-y-2">
  <Label>{isRu ? 'Описание' : 'Description'}</Label>
  <Textarea
    value={isRu ? formData.description_ru : formData.description}
    onChange={(e) => updateFormData({ [isRu ? 'description_ru' : 'description']: e.target.value })}
    placeholder={isRu ? 'Расскажите гостям, чем уникален ваш объект...' : 'Tell guests what makes your place special...'}
    rows={4}
  />
  {/* Второй язык */}
  <Textarea
    value={isRu ? formData.description : formData.description_ru}
    onChange={(e) => updateFormData({ [isRu ? 'description' : 'description_ru']: e.target.value })}
    placeholder={isRu ? 'Description in English (optional)' : 'Описание на русском (необязательно)'}
    rows={3}
    className="text-sm"
  />
</div>
```

**ComplexCard.tsx** — вставка описания платформы:
```tsx
{(complex.description_en || complex.description_ru) && (
  <p className="text-xs text-muted-foreground line-clamp-2">
    {isRu ? (complex.description_ru || complex.description_en) : (complex.description_en || complex.description_ru)}
  </p>
)}
```
