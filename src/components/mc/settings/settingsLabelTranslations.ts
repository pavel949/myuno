import type { Language } from '@/i18n';
import { pickLang } from '@/lib/i18n/pickLang';
import { CLASS_LABELS, GROUP_LABELS, ALLOCATION_LABELS, type CategoryClass, type CategoryGroup, type AllocationMethod } from '@/lib/categoryDefaults';

const CLASS_THAI: Record<CategoryClass, string> = {
  fixed: 'คงที่', variable: 'ผันแปร', semi_variable: 'กึ่งผันแปร', one_time: 'ครั้งเดียว',
};
const GROUP_THAI: Record<CategoryGroup, string> = {
  operations: 'การดำเนินงาน', administration: 'การบริหาร', marketing: 'การตลาด', taxes_fees: 'ภาษีและค่าธรรมเนียม',
  capex: 'รายจ่ายลงทุน', finance: 'การเงิน', revenue: 'รายรับ', other: 'อื่น ๆ',
};
const ALLOCATION_THAI: Record<AllocationMethod, string> = {
  per_unit: 'ต่อยูนิต', by_area: 'ตามพื้นที่', equal_split: 'แบ่งเท่ากัน', direct: 'โดยตรง',
};

// Presentation only. Category codes, defaults and all accounting behavior stay canonical.
export const STANDARD_CATEGORY_THAI: Record<string, string> = {
  rent: 'รายได้ค่าเช่า', deposit: 'เงินประกัน', cleaning_fee: 'ค่าทำความสะอาด', late_fee: 'ค่าปรับล่าช้า', other_income: 'รายรับอื่น ๆ',
  cleaning: 'การทำความสะอาด', maintenance: 'การซ่อมบำรุง', repair: 'การซ่อมแซม', utilities: 'ค่าสาธารณูปโภค',
  electricity: 'ค่าไฟฟ้า', water: 'ค่าน้ำ', internet: 'อินเทอร์เน็ตและทีวี', insurance: 'ประกันภัย', taxes: 'ภาษีอสังหาริมทรัพย์',
  income_tax: 'ภาษีเงินได้', management_fee: 'ค่าบริหารจัดการ', platform_fee: 'ค่าคอมมิชชันแพลตฟอร์ม',
  supplies: 'วัสดุสิ้นเปลืองและสิ่งอำนวยความสะดวก', shopping: 'การจัดซื้อ', furniture: 'เฟอร์นิเจอร์', appliances: 'เครื่องใช้ไฟฟ้า',
  depreciation: 'ค่าเสื่อมราคา', loan_payment: 'เงินกู้และสินเชื่อที่อยู่อาศัย', legal: 'ค่าบริการทางกฎหมาย', advertising: 'ค่าโฆษณา', other: 'อื่น ๆ', other_expense: 'รายจ่ายอื่น ๆ',
};

function label(language: Language, key: string, values: Record<string, { en: string; ru: string }>, thai: Record<string, string>): string {
  return Object.prototype.hasOwnProperty.call(values, key) ? pickLang(language, { ...values[key], th: thai[key] }) : key;
}
export const categoryClassLabel = (language: Language, key: string) => label(language, key, CLASS_LABELS, CLASS_THAI);
export const categoryGroupLabel = (language: Language, key: string) => label(language, key, GROUP_LABELS, GROUP_THAI);
export const categoryAllocationLabel = (language: Language, key: string) => label(language, key, ALLOCATION_LABELS, ALLOCATION_THAI);
