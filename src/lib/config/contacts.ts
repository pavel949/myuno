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
    support: 'support@uno.ae',
    partners: 'partners@uno.ae',
    press: 'press@uno.ae',
    privacy: 'privacy@uno.ae',
    info: 'info@uno.ae',
  },
  social: {
    instagram: 'https://instagram.com/myuno.app',
    telegram: 'https://t.me/myuno_support',
    whatsapp: 'https://wa.me/66922407355',
  },
  address: {
    full: '88/88 Moo 3, Chalong, Muang, Phuket 83130, Thailand',
    short: 'Chalong, Phuket, Thailand',
    mapLink: 'https://maps.google.com/?q=7.8432,98.3424',
  },
  legal: {
    companyName: 'UNO Platform Co., Ltd.',
    taxId: '0835564001234',
    registrationCountry: 'Thailand',
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

