/**
 * @module rpcErrorMessages
 * @description Bilingual error message mapping for Supabase RPC calls
 * 
 * Maps RPC error codes/messages to user-friendly localized strings
 */

export interface LocalizedError {
  en: string;
  ru: string;
  th: string;
}

/**
 * Known RPC error codes and their user-friendly messages
 */
export const RPC_ERROR_MESSAGES: Record<string, LocalizedError> = {
  // Wallet/Payment errors
  'insufficient_wallet': {
    en: 'Insufficient wallet balance',
    ru: 'Недостаточно средств на кошельке',
    th: 'ยอดเงินในกระเป๋าเงินไม่เพียงพอ',
  },
  'insufficient_balance': {
    en: 'Insufficient wallet balance',
    ru: 'Недостаточно средств на кошельке',
    th: 'ยอดเงินในกระเป๋าเงินไม่เพียงพอ',
  },
  'payment_failed': {
    en: 'Payment processing failed',
    ru: 'Ошибка обработки платежа',
    th: 'การชำระเงินไม่สำเร็จ',
  },
  'invalid_payment_method': {
    en: 'Invalid payment method',
    ru: 'Неверный способ оплаты',
    th: 'วิธีการชำระเงินไม่ถูกต้อง',
  },

  // Availability errors
  'slot_unavailable': {
    en: 'Time slot is no longer available',
    ru: 'Выбранное время уже занято',
    th: 'ช่วงเวลานี้ไม่ว่างแล้ว',
  },
  'slot_not_available': {
    en: 'Time slot is no longer available',
    ru: 'Выбранное время уже занято',
    th: 'ช่วงเวลานี้ไม่ว่างแล้ว',
  },
  'capacity_exceeded': {
    en: 'Maximum capacity exceeded',
    ru: 'Превышена максимальная вместимость',
    th: 'เกินจำนวนที่รองรับได้สูงสุด',
  },
  'no_spots_remaining': {
    en: 'No spots remaining for this time',
    ru: 'Нет свободных мест на это время',
    th: 'ไม่มีที่ว่างเหลือสำหรับเวลานี้',
  },
  'resource_unavailable': {
    en: 'This resource is not available',
    ru: 'Этот ресурс недоступен',
    th: 'รายการนี้ไม่พร้อมให้บริการ',
  },
  'date_unavailable': {
    en: 'Selected dates are not available',
    ru: 'Выбранные даты недоступны',
    th: 'วันที่ที่เลือกไม่ว่าง',
  },

  // Provider errors
  'provider_inactive': {
    en: 'Provider is currently unavailable',
    ru: 'Провайдер временно недоступен',
    th: 'ผู้ให้บริการไม่พร้อมให้บริการในขณะนี้',
  },
  'provider_not_found': {
    en: 'Provider not found',
    ru: 'Провайдер не найден',
    th: 'ไม่พบผู้ให้บริการ',
  },
  'service_inactive': {
    en: 'This service is currently unavailable',
    ru: 'Услуга временно недоступна',
    th: 'บริการนี้ไม่พร้อมให้บริการในขณะนี้',
  },

  // Order errors
  'order_exists': {
    en: 'Order already exists',
    ru: 'Заказ уже существует',
    th: 'มีคำสั่งซื้อนี้อยู่แล้ว',
  },
  'invalid_order_data': {
    en: 'Invalid order data',
    ru: 'Неверные данные заказа',
    th: 'ข้อมูลคำสั่งซื้อไม่ถูกต้อง',
  },
  'order_creation_failed': {
    en: 'Failed to create order',
    ru: 'Не удалось создать заказ',
    th: 'ไม่สามารถสร้างคำสั่งซื้อได้',
  },

  // Auth errors
  'not_authenticated': {
    en: 'Please log in to continue',
    ru: 'Войдите для продолжения',
    th: 'กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ',
  },
  'unauthorized': {
    en: 'You are not authorized to perform this action',
    ru: 'У вас нет прав для выполнения этого действия',
    th: 'คุณไม่มีสิทธิ์ดำเนินการนี้',
  },

  // Vendor errors
  'vendor_exists': {
    en: 'Vendor profile already exists',
    ru: 'Профиль вендора уже существует',
    th: 'มีโปรไฟล์ผู้ขายนี้อยู่แล้ว',
  },
  'duplicate_provider': {
    en: 'Provider profile already exists',
    ru: 'Профиль провайдера уже существует',
    th: 'มีโปรไฟล์ผู้ให้บริการนี้อยู่แล้ว',
  },

  // Generic errors
  'validation_error': {
    en: 'Please check your input and try again',
    ru: 'Проверьте введённые данные и попробуйте снова',
    th: 'กรุณาตรวจสอบข้อมูลที่กรอกแล้วลองอีกครั้ง',
  },
  'server_error': {
    en: 'Server error. Please try again later.',
    ru: 'Ошибка сервера. Попробуйте позже.',
    th: 'เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ภายหลัง',
  },
  'network_error': {
    en: 'Network error. Check your connection.',
    ru: 'Ошибка сети. Проверьте подключение.',
    th: 'การเชื่อมต่อขัดข้อง กรุณาตรวจสอบอินเทอร์เน็ตของคุณ',
  },
  'unknown_error': {
    en: 'An unexpected error occurred',
    ru: 'Произошла непредвиденная ошибка',
    th: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
  },
};

/**
 * Get localized error message from RPC error
 */
export function getLocalizedRpcError(
  error: unknown,
  language: 'en' | 'ru' | 'th' = 'en'
): string {
  // Handle null/undefined
  if (!error) {
    return RPC_ERROR_MESSAGES['unknown_error'][language] ?? RPC_ERROR_MESSAGES['unknown_error'].en;
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
      return messages[language] ?? messages.en;
    }
  }

  // Fallback to original message or generic error
  if (errorMessage && errorMessage.length < 100) {
    return errorMessage;
  }

  return RPC_ERROR_MESSAGES['unknown_error'][language] ?? RPC_ERROR_MESSAGES['unknown_error'].en;
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
