/**
 * Chat Moderation Patterns for detecting policy violations
 * Similar to Airbnb's approach with warnings for contact sharing, off-platform deals, etc.
 */

export type ViolationType = 
  | 'contact_sharing'
  | 'off_platform_payment'
  | 'offensive_language'
  | 'spam'
  | 'suspicious_link'
  | 'policy_violation';

export interface ModerationResult {
  isViolation: boolean;
  type: ViolationType | null;
  severity: 'info' | 'warning' | 'critical';
  detectedPattern: string | null;
  confidence: number; // 0-1
  warningMessage: {
    ru: string;
    en: string;
    th: string;
  } | null;
}

// Pattern definitions
const CONTACT_PATTERNS = {
  // Phone numbers (international formats)
  phone: /(?:\+?[0-9]{1,4}[-.\s]?)?(?:\([0-9]{1,4}\)[-.\s]?)?[0-9]{2,4}[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{2,4}/gi,
  
  // Email patterns
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  
  // Messaging apps
  telegram: /(?:t\.me\/|@|telegram[:\s]?|телеграм[:\s]?|тг[:\s]?)[\w.-]+/gi,
  whatsapp: /(?:whatsapp|ватсап|вотсап|wa\.me|вацап)[:\s]?[\s+0-9-]+/gi,
  line: /(?:line[:\s]?id[:\s]?|лайн[:\s]?)[\w.-]+/gi,
  wechat: /(?:wechat|weixin|вичат)[:\s]?[\w.-]+/gi,
  
  // Social media handles
  instagram: /(?:instagram|инстаграм|inst|инст)[:\s]?@?[\w.-]+/gi,
  facebook: /(?:facebook|фейсбук|fb)[:\s]?[\w.-]+/gi,
};

const OFF_PLATFORM_PAYMENT_PATTERNS = {
  // Direct payment mentions
  cash: /(?:наличн|cash|кеш|нал(?:ом)?|оплат(?:а|и|ить)\s*(?:на\s*)?руки)/gi,
  transfer: /(?:перевод|переведи|transfer|переброс(?:ить)?|скинь|кинь\s*(?:на\s*карту)?)/gi,
  
  // Bank/card details requests
  cardNumber: /(?:номер\s*карты|card\s*number|реквизит)/gi,
  bankAccount: /(?:банковск|bank\s*account|счёт|счет)/gi,
  
  // Crypto
  crypto: /(?:bitcoin|btc|ethereum|eth|usdt|крипт|биткоин)/gi,
  
  // Discount for off-platform
  discount: /(?:дешевле\s*без|скидк(?:а|у)\s*(?:если|без)|cheaper\s*(?:if|without))/gi,
};

const SUSPICIOUS_LINK_PATTERNS = {
  // External URLs (excluding common safe domains)
  externalUrl: /https?:\/\/(?!(?:myuno|uno\.|airbnb|booking\.com))[^\s]+/gi,
  
  // Shortened URLs
  shortUrl: /(?:bit\.ly|goo\.gl|tinyurl|t\.co|is\.gd|short\.link|clck\.ru)\/[\w]+/gi,
};

const OFFENSIVE_PATTERNS = {
  // Russian profanity (basic patterns)
  ruProfanity: /(?:бля|хуй|пизд|ебан|сука|мудак|уёб|долбо|идиот|придурок|дебил|козёл|тварь)/gi,
  
  // English profanity
  enProfanity: /(?:fuck|shit|asshole|bitch|bastard|dick|damn|crap|piss)/gi,
  
  // Thai profanity (basic patterns)
  thProfanity: /(?:เหี้ย|สัตว์|ควาย|ไอ้บ้า|มึง|กู)/gi,
  
  // Threats and harassment
  threats: /(?:убью|угрожа|прибью|найду\s*тебя|kill\s*you|threat|hurt\s*you)/gi,
};

// Warning messages for each violation type
const WARNING_MESSAGES: Record<ViolationType, { ru: string; en: string; th: string }> = {
  contact_sharing: {
    ru: '⚠️ Обмен контактами вне платформы нарушает правила. Все коммуникации должны проходить через myUNO для вашей безопасности.',
    en: '⚠️ Sharing contact information violates platform rules. All communications should go through myUNO for your safety.',
    th: '⚠️ การแบ่งปันข้อมูลติดต่อละเมิดกฎของแพลตฟอร์ม การสื่อสารทั้งหมดควรผ่าน myUNO เพื่อความปลอดภัยของคุณ',
  },
  off_platform_payment: {
    ru: '⚠️ Оплата вне платформы лишает вас защиты, гарантий возврата и поддержки. Все транзакции должны проходить через myUNO.',
    en: '⚠️ Off-platform payments void your protection, refund guarantees, and support. All transactions must go through myUNO.',
    th: '⚠️ การชำระเงินนอกแพลตฟอร์มจะทำให้คุณสูญเสียการคุ้มครอง การรับประกันการคืนเงิน และการสนับสนุน',
  },
  offensive_language: {
    ru: '⚠️ Оскорбительная лексика запрещена. Пожалуйста, общайтесь уважительно.',
    en: '⚠️ Offensive language is prohibited. Please communicate respectfully.',
    th: '⚠️ ห้ามใช้ภาษาที่ไม่เหมาะสม กรุณาสื่อสารอย่างสุภาพ',
  },
  spam: {
    ru: '⚠️ Повторяющиеся или рекламные сообщения запрещены.',
    en: '⚠️ Repetitive or promotional messages are prohibited.',
    th: '⚠️ ห้ามส่งข้อความซ้ำหรือข้อความโฆษณา',
  },
  suspicious_link: {
    ru: '⚠️ Внешние ссылки могут быть небезопасны. Будьте осторожны с переходами.',
    en: '⚠️ External links may be unsafe. Be careful when clicking.',
    th: '⚠️ ลิงก์ภายนอกอาจไม่ปลอดภัย โปรดระวังเมื่อคลิก',
  },
  policy_violation: {
    ru: '⚠️ Это сообщение может нарушать правила платформы.',
    en: '⚠️ This message may violate platform policies.',
    th: '⚠️ ข้อความนี้อาจละเมิดนโยบายของแพลตฟอร์ม',
  },
};

/**
 * Analyze a message for policy violations
 */
export function analyzeMessage(text: string): ModerationResult {
  const results: Array<{ type: ViolationType; pattern: string; confidence: number; severity: 'info' | 'warning' | 'critical' }> = [];

  // Check contact sharing patterns
  for (const [key, pattern] of Object.entries(CONTACT_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      results.push({
        type: 'contact_sharing',
        pattern: `${key}: ${matches[0]}`,
        confidence: key === 'phone' ? 0.7 : 0.9, // Phone is less certain
        severity: 'warning',
      });
    }
  }

  // Check off-platform payment patterns
  for (const [key, pattern] of Object.entries(OFF_PLATFORM_PAYMENT_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      results.push({
        type: 'off_platform_payment',
        pattern: `${key}: ${matches[0]}`,
        confidence: 0.85,
        severity: 'critical',
      });
    }
  }

  // Check suspicious links
  for (const [key, pattern] of Object.entries(SUSPICIOUS_LINK_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      results.push({
        type: 'suspicious_link',
        pattern: `${key}: ${matches[0]}`,
        confidence: 0.8,
        severity: 'warning',
      });
    }
  }

  // Check offensive language
  for (const [key, pattern] of Object.entries(OFFENSIVE_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      results.push({
        type: 'offensive_language',
        pattern: `${key}: ${matches[0]}`,
        confidence: 0.95,
        severity: 'critical',
      });
    }
  }

  // Return the highest severity violation
  if (results.length === 0) {
    return {
      isViolation: false,
      type: null,
      severity: 'info',
      detectedPattern: null,
      confidence: 0,
      warningMessage: null,
    };
  }

  // Sort by severity (critical > warning > info) and confidence
  const severityOrder = { critical: 3, warning: 2, info: 1 };
  results.sort((a, b) => {
    const sevDiff = severityOrder[b.severity] - severityOrder[a.severity];
    return sevDiff !== 0 ? sevDiff : b.confidence - a.confidence;
  });

  const topResult = results[0];
  return {
    isViolation: true,
    type: topResult.type,
    severity: topResult.severity,
    detectedPattern: topResult.pattern,
    confidence: topResult.confidence,
    warningMessage: WARNING_MESSAGES[topResult.type],
  };
}

/**
 * Get user-friendly violation type label
 */
export function getViolationLabel(type: ViolationType, language: 'ru' | 'en' | 'th'): string {
  const labels: Record<ViolationType, { ru: string; en: string; th: string }> = {
    contact_sharing: {
      ru: 'Обмен контактами',
      en: 'Contact sharing',
      th: 'การแบ่งปันข้อมูลติดต่อ',
    },
    off_platform_payment: {
      ru: 'Оплата вне платформы',
      en: 'Off-platform payment',
      th: 'การชำระเงินนอกแพลตฟอร์ม',
    },
    offensive_language: {
      ru: 'Оскорбительная лексика',
      en: 'Offensive language',
      th: 'ภาษาที่ไม่เหมาะสม',
    },
    spam: {
      ru: 'Спам',
      en: 'Spam',
      th: 'สแปม',
    },
    suspicious_link: {
      ru: 'Подозрительная ссылка',
      en: 'Suspicious link',
      th: 'ลิงก์ที่น่าสงสัย',
    },
    policy_violation: {
      ru: 'Нарушение правил',
      en: 'Policy violation',
      th: 'การละเมิดนโยบาย',
    },
  };

  return labels[type][language];
}
