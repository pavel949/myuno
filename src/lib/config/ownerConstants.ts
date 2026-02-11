/**
 * Owner module marketing & business constants
 * Single source of truth for revenue splits, commission rates, and brand copy
 * to prevent desynchronization across components.
 */

export const OWNER_BRAND = {
  name: 'myUNO',
  propertyCare: 'myUNO Property Care',
  fullManagement: 'myUNO Full Management',
  domain: 'myuno.app',
  supportEmail: 'support@myuno.app',
  legalEntity: 'myUNO Pte. Ltd.',
} as const;

export const OWNER_REVENUE = {
  /** Self-management: owner keeps 90%, platform takes 10% commission */
  SELF_MANAGEMENT: {
    commissionPercent: 10,
    labelEn: '10%',
    labelRu: '10%',
    descEn: 'on bookings via myUNO',
    descRu: 'с бронирований через myUNO',
    toolsFreeEn: 'Tools — free',
    toolsFreeRu: 'Инструменты — бесплатно',
  },
  /** Full management: owner gets 70%, platform gets 30% */
  FULL_MANAGEMENT: {
    ownerSharePercent: 70,
    platformSharePercent: 30,
    labelEn: '70/30',
    labelRu: '70/30',
    ownerDescEn: 'to you after expenses',
    ownerDescRu: 'вам после расходов',
    platformDescEn: '30% goes to myUNO for management',
    platformDescRu: '30% остаётся myUNO за управление',
  },
  /** Service partner: 15% commission */
  SERVICE_PARTNER: {
    commissionPercent: 15,
    labelEn: '15%',
    labelRu: '15%',
    descEn: 'Check-in/out + services',
    descRu: 'Check-in/out + услуги',
  },
  /** Channel Manager tiers */
  CHANNEL_MANAGER: {
    basic: {
      commissionPercent: 5,
      labelEn: '5%',
      labelRu: '5%',
      nameEn: 'Basic',
      nameRu: 'Базовый',
      descEn: 'of OTA bookings',
      descRu: 'от OTA-бронирований',
    },
    premium: {
      commissionPercent: 10,
      labelEn: '10%',
      labelRu: '10%',
      nameEn: 'Premium',
      nameRu: 'Премиум',
      descEn: 'of OTA bookings',
      descRu: 'от OTA-бронирований',
    },
  },
} as const;

/** Management type options for property wizard */
export const MANAGEMENT_TYPE_OPTIONS = [
  {
    value: 'full',
    labelEn: `Full Management (${OWNER_REVENUE.FULL_MANAGEMENT.labelEn})`,
    labelRu: `Полное управление (${OWNER_REVENUE.FULL_MANAGEMENT.labelRu})`,
    desc: 'UNO handles everything',
  },
  {
    value: 'partial',
    labelEn: `Service Partner (${OWNER_REVENUE.SERVICE_PARTNER.labelEn})`,
    labelRu: `Сервис-партнёр (${OWNER_REVENUE.SERVICE_PARTNER.labelRu})`,
    desc: 'Check-in/out + services',
  },
  {
    value: 'self',
    labelEn: `Listing Only (${OWNER_REVENUE.SELF_MANAGEMENT.labelEn})`,
    labelRu: `Только листинг (${OWNER_REVENUE.SELF_MANAGEMENT.labelRu})`,
    desc: 'Platform listing only',
  },
] as const;
