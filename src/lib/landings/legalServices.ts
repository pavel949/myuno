import type { Language } from '@/i18n';
import type { LocalizedText, FaqItem } from './vendorCategories';

export type LegalServiceId = 'visa' | 'company' | 'tax';

export interface LegalServiceConfig {
  id: LegalServiceId;
  emoji: string;
  hero: LocalizedText<{ eyebrow: string; title: string; subtitle: string }>;
  bullets: LocalizedText<string[]>;
  ctaPrimary: { label: LocalizedText<string>; href: string };
  faq: FaqItem[];
}

export const LEGAL_SERVICES: Record<LegalServiceId, LegalServiceConfig> = {
  visa: {
    id: 'visa', emoji: '🛂',
    hero: {
      ru: { eyebrow: 'ВИЗА · ТАИЛАНД', title: 'Виза в Таиланд — без посредников и нервов', subtitle: 'DTV, LTR, Education, Retirement, Marriage. Юрист с опытом 8+ лет, документы под ключ, сопровождение в Immigration.' },
      en: { eyebrow: 'VISA · THAILAND', title: 'Thai visa — no middlemen, no stress', subtitle: 'DTV, LTR, Education, Retirement, Marriage. 8+ years lawyer experience, turnkey paperwork, Immigration escort.' },
      th: { eyebrow: 'วีซ่า · ประเทศไทย', title: 'วีซ่าไทย — ไม่มีนายหน้า ไม่มีปัญหา', subtitle: 'DTV, LTR, การศึกษา, เกษียณ, สมรส ทนายความประสบการณ์ 8+ ปี เอกสารครบครัน พาไปสำนักงานตรวจคนเข้าเมือง' },
    },
    bullets: {
      ru: ['Подбор визового маршрута за 15 минут', 'Полный пакет документов на тайском и английском', 'Сопровождение в Immigration в Пхукет-Тауне', 'Продление и conversion без выезда из страны'],
      en: ['Visa pathway picked in 15 minutes', 'Full document pack in Thai and English', 'Escort at Phuket Town Immigration', 'Renewal and conversion without leaving Thailand'],
      th: ['เลือกประเภทวีซ่าที่เหมาะสมใน 15 นาที', 'ชุดเอกสารครบทั้งภาษาไทยและอังกฤษ', 'พาไปตรวจคนเข้าเมืองภูเก็ตทาวน์', 'ต่ออายุและเปลี่ยนประเภทวีซ่าโดยไม่ต้องออกนอกประเทศ'],
    },
    ctaPrimary: {
      label: { ru: 'Пройти квиз и получить план', en: 'Take the quiz and get your plan', th: 'ทำแบบสอบถามและรับแผนวีซ่า' },
      href: '/legal/visa-quiz',
    },
    faq: [
      {
        q: { ru: 'Сколько стоит консультация?', en: 'How much is a consultation?', th: 'ค่าปรึกษาเท่าไหร่?' },
        a: { ru: '฿2,000 за 30 минут с лицензированным юристом, засчитывается в стоимость пакета.', en: '฿2,000 for a 30-minute call with a licensed lawyer, credited toward the package.', th: '฿2,000 สำหรับการปรึกษา 30 นาทีกับทนายความที่ได้รับใบอนุญาต และนำไปหักจากค่าแพ็กเกจได้' },
      },
      {
        q: { ru: 'Делаете ли DTV-визы?', en: 'Do you handle DTV?', th: 'ทำวีซ่า DTV ให้ได้ไหม?' },
        a: { ru: 'Да, под ключ — от подачи в e-Visa до получения штампа. Срок 4-6 недель.', en: 'Yes, turnkey — from e-Visa submission to stamp. 4-6 weeks.', th: 'ได้ครบวงจร ตั้งแต่ยื่น e-Visa จนได้รับตราประทับ ใช้เวลา 4-6 สัปดาห์' },
      },
    ],
  },
  company: {
    id: 'company', emoji: '🏢',
    hero: {
      ru: { eyebrow: 'КОМПАНИЯ · ТАИЛАНД', title: 'Открытие компании в Таиланде', subtitle: 'Регистрация и подбор законной структуры под вид деятельности. Требования к владению, лицензиям и документам уточняются с юристом.' },
      en: { eyebrow: 'COMPANY · THAILAND', title: 'Thai company formation', subtitle: 'Company formation and a lawful structure for your activity. Ownership, licensing and document requirements are reviewed with a lawyer.' },
      th: { eyebrow: 'บริษัท · ประเทศไทย', title: 'จดทะเบียนบริษัทในประเทศไทย', subtitle: 'จดทะเบียนและเลือกโครงสร้างที่ถูกกฎหมายตามกิจกรรมธุรกิจ ตรวจสอบผู้ถือหุ้น ใบอนุญาต และเอกสารกับทนายความ' },
    },
    bullets: {
      ru: ['Подготовка документов для регистрации компании', 'Оценка применимости BOI и необходимых разрешений', 'Проверка законности структуры владения с юристом', 'Бухгалтер и подача отчётности — отдельная подписка'],
      en: ['Preparation of company registration documents', 'Assessment of BOI eligibility and required permissions', 'Legal review of the proposed ownership structure', 'Accountant & filings — separate retainer'],
      th: ['เตรียมเอกสารสำหรับจดทะเบียนบริษัท', 'ประเมินสิทธิ BOI และใบอนุญาตที่จำเป็น', 'ตรวจสอบโครงสร้างการถือหุ้นให้ถูกต้องตามกฎหมาย', 'นักบัญชีและยื่นภาษีคิดค่าบริการรายเดือนแยก'],
    },
    ctaPrimary: {
      label: { ru: 'Записаться на консультацию', en: 'Book a consultation', th: 'นัดหมายปรึกษา' },
      href: '/legal',
    },
    faq: [
      {
        q: { ru: 'Нужно ли мне быть в Таиланде?', en: 'Do I have to be in Thailand?', th: 'ต้องอยู่ในประเทศไทยไหม?' },
        a: { ru: 'Порядок подписания и возможность удалённого оформления зависят от выбранной структуры и документов. Уточним их до начала работы.', en: 'Signing and remote handling depend on the selected structure and documents. Confirm these requirements before work begins.', th: 'การลงนามและการดำเนินการทางไกลขึ้นอยู่กับโครงสร้างและเอกสารที่เลือก ต้องยืนยันข้อกำหนดก่อนเริ่มงาน' },
      },
      {
        q: { ru: 'Сколько стоит открытие?', en: 'How much does it cost?', th: 'ค่าจดทะเบียนเท่าไหร่?' },
        a: { ru: 'Стоимость услуг, государственные сборы и сроки согласуются после разбора задачи, до начала работы.', en: 'Service fees, government charges and timing are agreed after reviewing your requirements and before work begins.', th: 'ตกลงค่าบริการ ค่าธรรมเนียมราชการ และระยะเวลาหลังตรวจสอบความต้องการและก่อนเริ่มงาน' },
      },
    ],
  },
  tax: {
    id: 'tax', emoji: '🧾',
    hero: {
      ru: { eyebrow: 'НАЛОГИ · ТАИЛАНД', title: 'Налоговое структурирование для экспатов', subtitle: 'Тайская налоговая резиденция, remittance basis, CFC, двойное налогообложение. Понятный план — без терминов.' },
      en: { eyebrow: 'TAX · THAILAND', title: 'Tax structuring for expats', subtitle: 'Thai tax residency, remittance basis, CFC, double-tax treaties. Plain-language plan — zero jargon.' },
      th: { eyebrow: 'ภาษี · ประเทศไทย', title: 'วางโครงสร้างภาษีสำหรับชาวต่างชาติ', subtitle: 'การเป็นผู้มีถิ่นที่อยู่ทางภาษีไทย ระบบ remittance, CFC, อนุสัญญาภาษีซ้อน อธิบายเป็นภาษาเข้าใจง่าย ไม่มีศัพท์ยาก' },
    },
    bullets: {
      ru: ['Анализ вашей ситуации (страна, доходы, активы)', 'Резюме по тайскому налогу + договору об избежании', 'План на год с конкретными действиями и датами', 'Подготовка PND.90/91 если нужно подавать'],
      en: ['Analysis of your situation (country, income, assets)', 'Thai tax & DTA summary', '12-month plan with concrete actions and dates', 'PND.90/91 prep if filing is needed'],
      th: ['วิเคราะห์สถานการณ์ของคุณ (ประเทศ รายได้ ทรัพย์สิน)', 'สรุปภาษีไทยและอนุสัญญาภาษีซ้อน', 'แผน 12 เดือนพร้อมการดำเนินการและวันที่ชัดเจน', 'เตรียม ภ.ง.ด. 90/91 หากต้องยื่น'],
    },
    ctaPrimary: {
      label: { ru: 'Пройти налоговый квиз', en: 'Take the tax quiz', th: 'ทำแบบสอบถามด้านภาษี' },
      href: '/legal/tax-nav',
    },
    faq: [
      {
        q: { ru: 'Я уже резидент — что делать с remittance?', en: 'I am already resident — what about remittance?', th: 'ฉันเป็นผู้มีถิ่นที่อยู่แล้ว — เรื่อง remittance ทำอย่างไร?' },
        a: { ru: 'С 2024 года ввоз ранее заработанных средств в Таиланд может облагаться налогом. Разберём вашу ситуацию на консультации.', en: 'Since 2024 remittance of prior-year income may be taxable. We will review your case on the consult.', th: 'ตั้งแต่ปี 2567 การนำรายได้ของปีก่อนๆ เข้าประเทศไทยอาจต้องเสียภาษี เราจะวิเคราะห์เคสของคุณในการปรึกษา' },
      },
      {
        q: { ru: 'Помогаете с подачей в России/ЕС?', en: 'Do you help file in Russia/EU?', th: 'ช่วยยื่นภาษีในรัสเซีย/EU ได้ไหม?' },
        a: { ru: 'По России — да, в партнёрстве с проверенными налоговыми. По ЕС — referral.', en: 'For Russia — yes, with trusted tax partners. For EU — referral.', th: 'รัสเซีย — ได้ ผ่านพันธมิตรภาษีที่เชื่อถือได้ ส่วน EU — แนะนำผู้เชี่ยวชาญให้' },
      },
    ],
  },
};

export function getLegalService(id: string | undefined): LegalServiceConfig | null {
  if (!id) return null;
  return (LEGAL_SERVICES as Record<string, LegalServiceConfig>)[id] ?? null;
}
