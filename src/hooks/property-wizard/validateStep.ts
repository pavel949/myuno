import { toast } from 'sonner';
import { validateBasicInfo, validateLocation, validatePricing } from '@/components/owner/property-wizard/propertyValidation';
import type { OwnershipData, PropertyFormData } from './types';

interface ValidateArgs {
  stepId: string;
  formData: PropertyFormData;
  ownershipData: OwnershipData;
  isRu: boolean;
}

/**
 * Validates a single wizard step and shows toast errors.
 * Extracted from usePropertyWizard.validateStep.
 */
export function validateWizardStep({ stepId, formData, ownershipData, isRu }: ValidateArgs): boolean {
  switch (stepId) {
    case 'basic': {
      const errors = validateBasicInfo({
        title: formData.title,
        title_ru: formData.title_ru,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area_sqm: formData.area_sqm,
      });
      if (errors.length > 0) {
        toast.error(isRu ? 'Проверьте данные' : 'Check required fields', {
          description: errors[0],
        });
        return false;
      }
      if (ownershipData.ownership_type === 'verbal') {
        if (!ownershipData.actual_owner_name.trim()) {
          toast.error(isRu ? 'Введите имя собственника' : 'Enter owner name');
          return false;
        }
        if (!ownershipData.actual_owner_phone.trim()) {
          toast.error(isRu ? 'Введите телефон собственника' : 'Enter owner phone');
          return false;
        }
      }
      if (ownershipData.ownership_type === 'management_agreement') {
        if (!ownershipData.management_document_url) {
          toast.error(isRu ? 'Загрузите договор управления' : 'Upload management agreement');
          return false;
        }
      }
      return true;
    }
    case 'location': {
      const errors = validateLocation({ address: formData.address });
      if (errors.length > 0) {
        toast.error(isRu ? 'Введите адрес' : 'Enter address');
        return false;
      }
      return true;
    }
    case 'pricing': {
      const errors = validatePricing({
        price_per_night: formData.price_per_night,
        min_stay_nights: formData.min_stay_nights,
        max_guests: formData.max_guests,
        deposit_amount: formData.deposit_amount,
      });
      if (errors.length > 0) {
        toast.error(isRu ? 'Проверьте данные' : 'Check pricing fields', {
          description: errors[0],
        });
        return false;
      }
      return true;
    }
    default:
      return true;
  }
}
