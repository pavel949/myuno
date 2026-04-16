export type MonetizationPhase = 'phase_1_intro' | 'phase_2_success';

export interface InvestmentMonetizationRule {
  id: string;
  phase: MonetizationPhase;
  titleEn: string;
  titleRu: string;
  titleTh: string;
  descriptionEn: string;
  descriptionRu: string;
  descriptionTh: string;
  complianceNoteEn: string;
  complianceNoteRu: string;
  complianceNoteTh: string;
}

export const INVESTMENT_MONETIZATION_RULES: InvestmentMonetizationRule[] = [
  {
    id: 'qualified-intro-fee',
    phase: 'phase_1_intro',
    titleEn: 'Qualified Intro Fee',
    titleRu: 'Комиссия за квалифицированное интро',
    titleTh: 'ค่าธรรมเนียม intro ที่ผ่านการคัดกรอง',
    descriptionEn: 'Charge a fixed advisory fee when investor-project intro meets qualification criteria.',
    descriptionRu: 'Брать фиксированную advisory-комиссию, когда интро инвестор-проект прошло квалификацию.',
    descriptionTh: 'เรียกเก็บค่าที่ปรึกษาแบบคงที่เมื่อ intro ระหว่างนักลงทุนและโครงการผ่านเกณฑ์คัดกรอง',
    complianceNoteEn: 'Advisory only. No transaction execution under unlicensed flow.',
    complianceNoteRu: 'Только advisory. Без проведения транзакций в нелицензированном контуре.',
    complianceNoteTh: 'ให้บริการเฉพาะ advisory เท่านั้น ไม่ดำเนินธุรกรรมในกระบวนการที่ไม่มีใบอนุญาต',
  },
  {
    id: 'premium-visibility',
    phase: 'phase_1_intro',
    titleEn: 'Premium Visibility',
    titleRu: 'Премиальная видимость',
    titleTh: 'การมองเห็นแบบพรีเมียม',
    descriptionEn: 'Offer promoted placement and analytics dashboards for project owners and advisors.',
    descriptionRu: 'Предлагать promoted-размещение и analytics-dashboard для владельцев проектов и адвайзеров.',
    descriptionTh: 'ให้บริการตำแหน่งโปรโมตและแดชบอร์ดวิเคราะห์สำหรับเจ้าของโครงการและที่ปรึกษา',
    complianceNoteEn: 'Commercial placement must be labeled clearly for trust.',
    complianceNoteRu: 'Коммерческое размещение должно быть явно маркировано для доверия.',
    complianceNoteTh: 'ตำแหน่งเชิงพาณิชย์ต้องติดป้ายอย่างชัดเจนเพื่อความน่าเชื่อถือ',
  },
  {
    id: 'partner-success-fee',
    phase: 'phase_2_success',
    titleEn: 'Partner Success Fee',
    titleRu: 'Success fee через партнера',
    titleTh: 'Success fee ผ่านพาร์ทเนอร์',
    descriptionEn: 'Collect revenue share on closed deals routed through licensed partner rails.',
    descriptionRu: 'Получать revenue share на закрытых сделках через licensed partner rails.',
    descriptionTh: 'รับส่วนแบ่งรายได้จากดีลที่ปิดสำเร็จผ่าน licensed partner rails',
    complianceNoteEn: 'Execution and fee settlement are handled only by licensed partners.',
    complianceNoteRu: 'Execution и расчет комиссии проходят только через лицензированных партнеров.',
    complianceNoteTh: 'การดำเนินการและการชำระค่าธรรมเนียมต้องทำผ่านพาร์ทเนอร์ที่มีใบอนุญาตเท่านั้น',
  },
  {
    id: 'premium-dd-room',
    phase: 'phase_2_success',
    titleEn: 'Premium Due Diligence Room',
    titleRu: 'Премиум DD-room',
    titleTh: 'ห้อง Due Diligence แบบพรีเมียม',
    descriptionEn: 'Monetize secure data room tooling and SLA-backed workflow support.',
    descriptionRu: 'Монетизировать защищенный data room и SLA-сопровождение workflow.',
    descriptionTh: 'สร้างรายได้จากเครื่องมือ data room ที่ปลอดภัยและ workflow support ตาม SLA',
    complianceNoteEn: 'Retention and access logs must satisfy local data governance requirements.',
    complianceNoteRu: 'Retention и access logs должны соответствовать требованиям local data governance.',
    complianceNoteTh: 'Retention และ access logs ต้องสอดคล้องกับข้อกำหนด data governance ในพื้นที่',
  },
];
