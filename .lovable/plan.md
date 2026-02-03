
# Рефакторинг AddProperty.tsx: Модуляризация Wizard-компонента

## Текущая проблема

Файл `AddProperty.tsx` содержит **1364 строки**, включая:
- Дублирование UI каждого шага (строки 438-1171) — ~730 строк inline JSX
- Дублирование логики формы, которая уже есть в `usePropertyWizard.ts`
- Дублирование initialFormData, ownershipData и других структур

При этом **уже существуют готовые компоненты**:
- `BasicInfoStep.tsx`, `LocationStep.tsx`, `PhotosStep.tsx`
- `PricingStep.tsx`, `ManagementStep.tsx`, `DescriptionStep.tsx`
- `usePropertyWizard.ts` — хук с логикой формы

## Целевой результат

**AddProperty.tsx: ~180-220 строк** — только композиция компонентов

## Архитектура решения

```
AddProperty.tsx (~200 строк)
    ├── usePropertyWizard() — вся логика формы
    ├── PropertyWizard — навигация шагов
    │     ├── OwnershipTypeStep
    │     ├── WizardBasicInfoStep (обёртка)
    │     ├── WizardLocationStep (обёртка)
    │     ├── WizardPhotosStep (обёртка)
    │     ├── WizardPricingStep (обёртка)
    │     ├── WizardManagementStep (обёртка)
    │     └── WizardDescriptionStep (обёртка)
    ├── AIIntakePanel (новый компонент)
    ├── LivePropertyPreview
    └── PropertySubmissionSuccess
```

## План изменений

### 1. Создать AIIntakePanel компонент

**Файл**: `src/components/owner/property-wizard/AIIntakePanel.tsx`

Извлечь весь блок AI Intake (строки 1254-1324) в отдельный компонент:
- Collapsible панель с текстовым полем
- Интеграция с `useIntakeAgent`
- Callback `onDataExtracted` для обновления формы

### 2. Обновить существующие step-компоненты

**BasicInfoStep.tsx** — добавить поле `internal_name`, которое есть в AddProperty, но отсутствует в компоненте

**LocationStep.tsx** — уже использует `useTaxonomy`, готов к использованию

**Все остальные** — уже готовы

### 3. Рефакторинг AddProperty.tsx

Заменить inline `renderStep()` на использование готовых компонентов:

```typescript
const renderStep = (stepId: string) => {
  switch (stepId) {
    case 'ownership':
      return <OwnershipTypeStep data={ownershipData} onChange={updateOwnershipData} />;
    case 'basic':
      return (
        <BasicInfoStep
          formData={formData}
          updateFormData={updateFormData}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
        />
      );
    case 'location':
      return <LocationStep formData={formData} updateFormData={updateFormData} />;
    case 'photos':
      return <PhotosStep formData={formData} updateFormData={updateFormData} />;
    case 'pricing':
      return <PricingStep formData={formData} updateFormData={updateFormData} />;
    case 'management':
      return <ManagementStep formData={formData} updateFormData={updateFormData} />;
    case 'description':
      return (
        <DescriptionStep
          formData={formData}
          updateFormData={updateFormData}
          selectedProject={selectedProject}
        />
      );
    default:
      return null;
  }
};
```

### 4. Интегрировать usePropertyWizard хук

Заменить ~200 строк state/effects в AddProperty на один вызов хука:

```typescript
const {
  formData,
  ownershipData,
  selectedProject,
  previewData,
  isSubmitting,
  hasDraft,
  lastSaved,
  // ... actions
  updateFormData,
  updateOwnershipData,
  setSelectedProject,
  validateStep,
  handleSubmit,
} = usePropertyWizard();
```

### 5. Финальная структура AddProperty.tsx

```typescript
export default function AddProperty() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  // Вся логика формы в одном хуке
  const wizard = usePropertyWizard();
  
  // AI Intake
  const { isProcessing, analyze } = useIntakeAgent();
  
  // Success screen
  if (wizard.showSuccess) {
    return <PropertySubmissionSuccess ... />;
  }
  
  // Loading clone
  if (wizard.cloneFromId && wizard.isLoadingSource) {
    return <LoadingSkeleton />;
  }
  
  return (
    <PageContainer>
      <PageHeader ... />
      
      {/* Draft Banner */}
      {wizard.showRestorationBanner && <DraftRestorationBanner ... />}
      
      {/* AI Intake Panel */}
      {!wizard.cloneFromId && (
        <AIIntakePanel onDataExtracted={wizard.applyPrefillData} />
      )}
      
      {/* Clone Notice */}
      {wizard.cloneFromId && <CloneNotice />}
      
      {/* Main Wizard */}
      <div className="lg:grid lg:grid-cols-[1fr,320px] lg:gap-6">
        <PropertyWizard
          onSubmit={wizard.handleSubmit}
          isSubmitting={wizard.isSubmitting}
          validateStep={wizard.validateStep}
        >
          {renderStep}
        </PropertyWizard>
        
        {/* Desktop Preview */}
        <LivePropertyPreview data={wizard.previewData} />
      </div>
      
      {/* Mobile Preview */}
      <div className="lg:hidden">
        <LivePropertyPreview data={wizard.previewData} />
      </div>
    </PageContainer>
  );
}
```

## Файлы для изменения

| Файл | Действие | Строки до | Строки после |
|------|----------|-----------|--------------|
| `src/pages/owner/AddProperty.tsx` | Рефакторинг | 1364 | ~200 |
| `src/components/owner/property-wizard/AIIntakePanel.tsx` | Создать | 0 | ~80 |
| `src/components/owner/property-wizard/steps/BasicInfoStep.tsx` | Дополнить | 188 | ~200 |
| `src/components/owner/property-wizard/steps/index.ts` | Обновить | - | - |
| `src/hooks/usePropertyWizard.ts` | Мелкие правки | 406 | ~420 |

## Результат

- **AddProperty.tsx**: 1364 → ~200 строк (сокращение на 85%)
- **Нулевое дублирование**: UI шагов — в step-компонентах, логика — в хуке
- **Лучшая поддержка**: изменения в шаге затрагивают только его файл
- **Тестируемость**: каждый step можно тестировать отдельно

## Технические детали

### usePropertyWizard — небольшие дополнения

Добавить поле `internal_name` в `PropertyFormData` и `initialFormData` (если отсутствует).

### BasicInfoStep — добавить internal_name

```typescript
{/* Internal Name */}
<div className="space-y-2">
  <Label>{isRu ? 'Внутреннее название' : 'Internal Name'}</Label>
  <Input
    value={formData.internal_name || ''}
    onChange={(e) => updateFormData({ internal_name: e.target.value })}
    placeholder={isRu ? 'Только для вас' : 'Private note'}
  />
</div>
```

### AIIntakePanel — новый компонент

```typescript
interface AIIntakePanelProps {
  onDataExtracted: (data: Record<string, any>) => void;
}

export function AIIntakePanel({ onDataExtracted }: AIIntakePanelProps) {
  const { language } = useLanguage();
  const { isProcessing, analyze } = useIntakeAgent();
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const handleParse = async () => {
    const result = await analyze({ mode: 'single', rawText: text, forceVertical: 'properties' });
    if (result?.items?.[0]) {
      onDataExtracted(result.items[0].extractedFields);
      setIsOpen(false);
    }
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* ... UI ... */}
    </Collapsible>
  );
}
```

## Сохранение функциональности

Все существующие функции сохраняются:
- AI Intake заполнение формы
- Клонирование объектов
- Draft persistence
- Live preview (desktop/mobile)
- Валидация шагов
- Ownership management
- Property submission с документами
