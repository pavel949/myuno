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
      ru: { eyebrow: 'КОМПАНИЯ · ТАИЛАНД', title: 'Открытие компании в Таиланде', subtitle: 'Co. Ltd., BOI, USRO, представительство. Подбор структуры под ваш бизнес и долгосрочную визу.' },
      en: { eyebrow: 'COMPANY · THAILAND', title: 'Thai company formation', subtitle: 'Co. Ltd., BOI, USRO, rep office. Structure tailored to your business and long-term visa.' },
      th: { eyebrow: 'บริษัท · ประเทศไทย', title: 'จดทะเบียนบริษัทในประเทศไทย', subtitle: 'Co. Ltd., BOI, USRO, สำนักงานตัวแทน เลือกโครงสร้างที่เหมาะกับธุรกิจและวีซ่าระยะยาวของคุณ' },
    },
    bullets: {
      ru: ['Регистрация Co. Ltd. за 2-3 недели', 'BOI-структура для IT/туризма с налоговыми льготами', 'Тайские номиналы с прозрачным договором', 'Бухгалтер и подача отчётности — отдельная подписка'],
      en: ['Co. Ltd. registration in 2-3 weeks', 'BOI structure for IT/tourism with tax incentives', 'Thai nominees with a transparent contract', 'Accountant & filings — separate retainer'],
      th: ['จดทะเบียน Co. Ltd. ภายใน 2-3 สัปดาห์', 'โครงสร้าง BOI สำหรับ IT/ท่องเที่ยว พร้อมสิทธิประโยชน์ทางภาษี', 'นอมินีไทยพร้อมสัญญาโปร่งใส', 'นักบัญชีและยื่นภาษีคิดค่าบริการรายเดือนแยก'],
    },
    ctaPrimary: {
      label: { ru: 'Записаться на консультацию', en: 'Book a consultation', th: 'นัดหมายปรึกษา' },
      href: '/legal',
    },
    faq: [
      {
        q: { ru: 'Нужно ли мне быть в Таиланде?', en: 'Do I have to be in Thailand?', th: 'ต้องอยู่ในประเทศไทยไหม?' },
        a: { ru: 'Для подписания учредительных документов — да, хотя бы на 1-2 дня. Остальное можно дистанционно через доверенность.', en: 'To sign founder documents — yes, at least 1-2 days. Everything else can be done remotely via PoA.', th: 'ต้องอยู่ในไทย 1-2 วันเพื่อเซ็นเอกสารจัดตั้งบริษัท นอกนั้นทำผ่านหนังสือมอบอำนาจระยะไกลได้' },
      },
      {
        q: { ru: 'Сколько стоит открытие?', en: 'How much does it cost?', th: 'ค่าจดทะเบียนเท่าไหร่?' },
        a: { ru: 'От ฿35,000 за Co. Ltd. под ключ + государственные сборы.', en: 'From ฿35,000 turnkey Co. Ltd. + government fees.', th: 'เริ่มต้น ฿35,000 สำหรับ Co. Ltd. ครบวงจร + ค่าธรรมเนียมราชการ' },
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
