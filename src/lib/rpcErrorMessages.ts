/**
 * @module rpcErrorMessages
 * @description Bilingual error message mapping for Supabase RPC calls
 * 
 * Maps RPC error codes/messages to user-friendly localized strings
 */

export interface LocalizedError {
  en: string;
  ru: string;
}

/**
 * Known RPC error codes and their user-friendly messages
 */
export const RPC_ERROR_MESSAGES: Record<string, LocalizedError> = {
  // Wallet/Payment errors
  'insufficient_wallet': {
    en: 'Insufficient wallet balance',
    ru: 'Недостаточно средств на кошельке',
  },
  'insufficient_balance': {
    en: 'Insufficient wallet balance',
    ru: 'Недостаточно средств на кошельке',
  },
  'payment_failed': {
    en: 'Payment processing failed',
    ru: 'Ошибка обработки платежа',
  },
  'invalid_payment_method': {
    en: 'Invalid payment method',
    ru: 'Неверный способ оплаты',
  },

  // Availability errors
  'slot_unavailable': {
    en: 'Time slot is no longer available',
    ru: 'Выбранное время уже занято',
  },
  'slot_not_available': {
    en: 'Time slot is no longer available',
    ru: 'Выбранное время уже занято',
  },
  'capacity_exceeded': {
    en: 'Maximum capacity exceeded',
    ru: 'Превышена максимальная вместимость',
  },
  'no_spots_remaining': {
    en: 'No spots remaining for this time',
    ru: 'Нет свободных мест на это время',
  },
  'resource_unavailable': {
    en: 'This resource is not available',
    ru: 'Этот ресурс недоступен',
  },
  'date_unavailable': {
    en: 'Selected dates are not available',
    ru: 'Выбранные даты недоступны',
  },

  // Provider errors
  'provider_inactive': {
    en: 'Provider is currently unavailable',
    ru: 'Провайдер временно недоступен',
  },
  'provider_not_found': {
    en: 'Provider not found',
    ru: 'Провайдер не найден',
  },
  'service_inactive': {
    en: 'This service is currently unavailable',
    ru: 'Услуга временно недоступна',
  },

  // Order errors
  'order_exists': {
    en: 'Order already exists',
    ru: 'Заказ уже существует',
  },
  'invalid_order_data': {
    en: 'Invalid order data',
    ru: 'Неверные данные заказа',
  },
  'order_creation_failed': {
    en: 'Failed to create order',
    ru: 'Не удалось создать заказ',
  },

  // Auth errors
  'not_authenticated': {
    en: 'Please log in to continue',
    ru: 'Войдите для продолжения',
  },
  'unauthorized': {
    en: 'You are not authorized to perform this action',
    ru: 'У вас нет прав для выполнения этого действия',
  },

  // Vendor errors
  'vendor_exists': {
    en: 'Vendor profile already exists',
    ru: 'Профиль вендора уже существует',
  },
  'duplicate_provider': {
    en: 'Provider profile already exists',
    ru: 'Профиль провайдера уже существует',
  },

  // Generic errors
  'validation_error': {
    en: 'Please check your input and try again',
    ru: 'Проверьте введённые данные и попробуйте снова',
  },
  'server_error': {
    en: 'Server error. Please try again later.',
    ru: 'Ошибка сервера. Попробуйте позже.',
  },
  'network_error': {
    en: 'Network error. Check your connection.',
    ru: 'Ошибка сети. Проверьте подключение.',
  },
  'unknown_error': {
    en: 'An unexpected error occurred',
    ru: 'Произошла непредвиденная ошибка',
  },
};

/**
 * Get localized error message from RPC error
 */
export function getLocalizedRpcError(
  error: unknown,
  language: 'en' | 'ru' = 'en'
): string {
  // Handle null/undefined
  if (!error) {
    return RPC_ERROR_MESSAGES['unknown_error'][language];
  }

  // Extract error message/code
  let errorCode = '';
  let errorMessage = '';

  if (typeof error === 'string') {
    errorCode = error.toLowerCase().replace(/\s+/g, '_');
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorCode = error.message.toLowerCase().replace(/\s+/g, '_');
  } else if (typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    errorCode = String(errObj.code || errObj.error_code || '').toLowerCase();
    errorMessage = String(errObj.message || errObj.error || errObj.details || '');
  }

  // Try to match known error codes
  for (const [key, messages] of Object.entries(RPC_ERROR_MESSAGES)) {
    if (
      errorCode.includes(key) ||
      errorMessage.toLowerCase().includes(key.replace(/_/g, ' ')) ||
      errorMessage.toLowerCase().includes(key)
    ) {
      return messages[language];
    }
  }

  // Fallback to original message or generic error
  if (errorMessage && errorMessage.length < 100) {
    return errorMessage;
  }

  return RPC_ERROR_MESSAGES['unknown_error'][language];
}

/**
 * Check if error is a specific RPC error type
 */
export function isRpcError(error: unknown, errorType: keyof typeof RPC_ERROR_MESSAGES): boolean {
  if (!error) return false;

  let errorString = '';
  if (typeof error === 'string') {
    errorString = error.toLowerCase();
  } else if (error instanceof Error) {
    errorString = error.message.toLowerCase();
  } else if (typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    errorString = `${errObj.code || ''} ${errObj.message || ''} ${errObj.error || ''}`.toLowerCase();
  }

  return errorString.includes(errorType.replace(/_/g, ' ')) || errorString.includes(errorType);
}
