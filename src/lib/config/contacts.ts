/**
 * Centralized contact information for the platform
 * Single source of truth for all phone numbers, emails, and addresses
 */

export const COMPANY_CONTACTS = {
  phone: {
    // Primary hotline number used across the platform
    hotline: '+66 92 240 7355',
    // Formatted for display
    display: '+66 92 240 7355',
    // Raw number for tel: links
    raw: '+66922407355',
  },
  whatsapp: {
    // WhatsApp number without + prefix
    number: '66922407355',
    // Full WhatsApp link
    link: 'https://wa.me/66922407355',
  },
  telegram: {
    // Telegram support channel
    support: 'https://t.me/myuno_support',
    // Telegram number link
    number: 'https://t.me/+66922407355',
  },
  line: {
    // LINE Official Account id (placeholder until registered).
    // When the @myuno LINE OA is live, this URL works as a direct chat link.
    id: '@myuno',
    link: 'https://line.me/R/ti/p/@myuno',
    // Toggle to false to hide the Line button across the platform until the OA is live.
    enabled: true,
  },
  email: {
    support: 'support@myuno.app',
    partners: 'partners@myuno.app',
    press: 'press@myuno.app',
    privacy: 'privacy@myuno.app',
    info: 'info@myuno.app',
  },
  social: {
    instagram: 'https://instagram.com/myuno.app',
    telegram: 'https://t.me/myuno_support',
    whatsapp: 'https://wa.me/66922407355',
  },
  address: {
    full: 'MC 2, 63/202 Moo 2, Thepkrasattri Rd, Koh Kaew, Muang Phuket, Phuket 83000, Thailand',
    short: 'Koh Kaew, Muang Phuket, Phuket',
    mapLink: 'https://maps.google.com/?q=7.9375,98.3733',
    lat: 7.9375,
    lng: 98.3733,
  },
  legal: {
    /** Copyright holder / operating legal entity of the platform */
    companyName: 'Toplight Asia Pacific Co., Ltd.',
    companyNameTh: 'บริษัท ท๊อปไลท์ เอเชีย แปซิฟิค จำกัด',
    registrationCountry: 'Thailand',
    city: 'Phuket',
    addressEn: 'MC 2, 63/202 Moo 2, Thepkrasattri Rd, Koh Kaew, Muang Phuket, Phuket 83000, Thailand',
    addressRu: 'MC 2, 63/202 Moo 2, Thepkrasattri Rd, Koh Kaew, Muang Phuket, Пхукет 83000, Таиланд',
    addressTh: 'MC 2, 63/202 หมู่ที่ 2 ถนนเทพกระษัตรี ตำบลเกาะแก้ว อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83000',
    coordinates: { lat: 7.9375, lng: 98.3733 },
    mapLink: 'https://maps.google.com/?q=7.9375,98.3733',
    contactPerson: 'Pavel Ignatev',
    contactPersonTh: 'นายพาเวล อิกินาทีฟ',
    phone: '+66 95 424 3332',
    phoneRaw: '+66954243332',
    email: 'pavel@myuno.app',
  },
  workingHours: {
    office: '09:00 - 18:00',
    officeTimezone: 'ICT (UTC+7)',
    support: '24/7',
  },
} as const;

// Helper function to get WhatsApp URL with optional message
export const getWhatsAppUrl = (message?: string): string => {
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
  return `${COMPANY_CONTACTS.whatsapp.link}${encodedMessage}`;
};

// Helper to get tel: link
export const getTelLink = (): string => {
  return `tel:${COMPANY_CONTACTS.phone.raw}`;
};

// Helper to get mailto: link
export const getMailtoLink = (type: keyof typeof COMPANY_CONTACTS.email = 'support'): string => {
  return `mailto:${COMPANY_CONTACTS.email[type]}`;
};

// Helper for LINE chat link
export const getLineUrl = (): string => COMPANY_CONTACTS.line.link;

