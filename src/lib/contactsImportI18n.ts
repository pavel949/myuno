/**
 * Shared RU/EN strings for CRM contact import UI.
 * Single source to avoid language mixing.
 */
export const CONTACTS_IMPORT_I18N = {
  title: { en: 'Import Contacts', ru: 'Импорт контактов', th: 'นำเข้ารายชื่อติดต่อ' },
  subtitle: { en: 'CSV, TSV, XLSX, vCard, chat paste or manual entry', ru: 'CSV, TSV, XLSX, vCard, вставка из чата или ручной ввод', th: 'CSV, TSV, XLSX, vCard วางจากแชต หรือกรอกเอง' },
  tabFile: { en: 'File', ru: 'Файл', th: 'ไฟล์' },
  tabChat: { en: 'Chat', ru: 'Чат', th: 'แชต' },
  tabManual: { en: 'Manual', ru: 'Вручную', th: 'กรอกเอง' },
  dropPrompt: { en: 'Drop file here or click to browse', ru: 'Перетащите файл сюда или нажмите для выбора', th: 'วางไฟล์ที่นี่หรือคลิกเพื่อเลือก' },
  dropFormats: { en: 'CSV, TSV, XLSX, vCard (.vcf)', ru: 'CSV, TSV, XLSX, vCard (.vcf)', th: 'CSV, TSV, XLSX, vCard (.vcf)' },
  loading: { en: 'Loading…', ru: 'Загрузка…', th: 'กำลังโหลด…' },
  columnMappingTitle: { en: 'Column Mapping', ru: 'Маппинг колонок', th: 'จับคู่คอลัมน์' },
  columnMappingHint: { en: 'Map file columns to CRM fields', ru: 'Сопоставьте колонки файла с полями CRM', th: 'จับคู่คอลัมน์ในไฟล์กับฟิลด์ CRM' },
  skip: { en: 'Skip', ru: 'Пропустить', th: 'ข้าม' },
  preview: { en: 'Preview', ru: 'Предпросмотр', th: 'ดูตัวอย่าง' },
  more: { en: 'more', ru: 'ещё', th: 'เพิ่มเติม' },
  importBtn: { en: 'Import', ru: 'Импортировать', th: 'นำเข้า' },
  importing: { en: 'Importing…', ru: 'Импорт…', th: 'กำลังนำเข้า…' },
  success: { en: 'success', ru: 'успешно', th: 'สำเร็จ' },
  failed: { en: 'failed', ru: 'ошибок', th: 'ล้มเหลว' },
  back: { en: 'Back', ru: 'Назад', th: 'ย้อนกลับ' },
  done: { en: 'Done', ru: 'Готово', th: 'เสร็จสิ้น' },
  importComplete: { en: 'Import complete', ru: 'Импорт завершён', th: 'นำเข้าเสร็จสมบูรณ์' },
  addedSkipped: { en: 'Added: {success}, skipped: {skipped}', ru: 'Добавлено: {success}, пропущено: {skipped}', th: 'เพิ่มแล้ว: {success}, ข้าม: {skipped}' },
  companyNotFound: { en: 'Company not found', ru: 'Компания не найдена', th: 'ไม่พบบริษัท' },
  missingName: { en: 'Missing name', ru: 'Нет имени', th: 'ไม่มีชื่อ' },
  fileEmpty: { en: 'File is empty or has no data', ru: 'Файл пуст или без данных', th: 'ไฟล์ว่างเปล่าหรือไม่มีข้อมูล' },
  readError: { en: 'Failed to read file', ru: 'Ошибка чтения файла', th: 'อ่านไฟล์ไม่สำเร็จ' },
  supportedFormats: { en: 'Supported: CSV, TSV, XLSX, vCard (.vcf)', ru: 'Поддерживаются форматы: CSV, TSV, XLSX, vCard (.vcf)', th: 'รองรับ: CSV, TSV, XLSX, vCard (.vcf)' },
  pasteChat: { en: 'Paste chat text', ru: 'Вставьте текст из чата', th: 'วางข้อความจากแชต' },
  parse: { en: 'Parse', ru: 'Разобрать', th: 'แยกข้อมูล' },
  addContact: { en: 'Add Contact', ru: 'Добавить контакт', th: 'เพิ่มรายชื่อติดต่อ' },
  enterName: { en: 'Enter name', ru: 'Введите имя', th: 'กรอกชื่อ' },
  contactAdded: { en: 'Contact added', ru: 'Контакт добавлен', th: 'เพิ่มรายชื่อติดต่อแล้ว' },
  importedCount: { en: 'Imported: {n}', ru: 'Импортировано: {n}', th: 'นำเข้าแล้ว: {n}' },
  mapAtLeastOne: { en: 'Map at least one column to a CRM field to enable import', ru: 'Сопоставьте хотя бы одну колонку с полем CRM, чтобы активировать импорт', th: 'จับคู่อย่างน้อยหนึ่งคอลัมน์กับฟิลด์ CRM เพื่อเริ่มนำเข้า' },
  foundRows: { en: 'Found {n} rows. Map columns:', ru: 'Найдено {n} строк. Сопоставьте колонки:', th: 'พบ {n} แถว จับคู่คอลัมน์:' },
  previewRows: { en: 'Preview (5 rows):', ru: 'Предпросмотр (5 строк):', th: 'ดูตัวอย่าง (5 แถว):' },
  dropCsv: { en: 'Drop CSV file or click to browse', ru: 'Перетащите CSV файл или нажмите', th: 'วางไฟล์ CSV หรือคลิกเพื่อเลือก' },
  formatCsv: { en: 'Format: CSV with headers', ru: 'Формат: CSV с заголовками', th: 'รูปแบบ: CSV พร้อมหัวคอลัมน์' },
} as const;

export function t<K extends keyof typeof CONTACTS_IMPORT_I18N>(key: K, lang: 'en' | 'ru' | 'th'): string {
  return CONTACTS_IMPORT_I18N[key][lang] ?? CONTACTS_IMPORT_I18N[key].en;
}
