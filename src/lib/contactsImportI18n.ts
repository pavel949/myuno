/**
 * Shared RU/EN strings for CRM contact import UI.
 * Single source to avoid language mixing.
 */
export const CONTACTS_IMPORT_I18N = {
  title: { en: 'Import Contacts', ru: 'Импорт контактов' },
  subtitle: { en: 'CSV, TSV, XLSX, vCard, chat paste or manual entry', ru: 'CSV, TSV, XLSX, vCard, вставка из чата или ручной ввод' },
  tabFile: { en: 'File', ru: 'Файл' },
  tabChat: { en: 'Chat', ru: 'Чат' },
  tabManual: { en: 'Manual', ru: 'Вручную' },
  dropPrompt: { en: 'Drop file here or click to browse', ru: 'Перетащите файл сюда или нажмите для выбора' },
  dropFormats: { en: 'CSV, TSV, XLSX, vCard (.vcf)', ru: 'CSV, TSV, XLSX, vCard (.vcf)' },
  loading: { en: 'Loading…', ru: 'Загрузка…' },
  columnMappingTitle: { en: 'Column Mapping', ru: 'Маппинг колонок' },
  columnMappingHint: { en: 'Map file columns to CRM fields', ru: 'Сопоставьте колонки файла с полями CRM' },
  skip: { en: 'Skip', ru: 'Пропустить' },
  preview: { en: 'Preview', ru: 'Предпросмотр' },
  more: { en: 'more', ru: 'ещё' },
  importBtn: { en: 'Import', ru: 'Импортировать' },
  importing: { en: 'Importing…', ru: 'Импорт…' },
  success: { en: 'success', ru: 'успешно' },
  failed: { en: 'failed', ru: 'ошибок' },
  back: { en: 'Back', ru: 'Назад' },
  done: { en: 'Done', ru: 'Готово' },
  importComplete: { en: 'Import complete', ru: 'Импорт завершён' },
  addedSkipped: { en: 'Added: {success}, skipped: {skipped}', ru: 'Добавлено: {success}, пропущено: {skipped}' },
  companyNotFound: { en: 'Company not found', ru: 'Компания не найдена' },
  missingName: { en: 'Missing name', ru: 'Нет имени' },
  fileEmpty: { en: 'File is empty or has no data', ru: 'Файл пуст или без данных' },
  readError: { en: 'Failed to read file', ru: 'Ошибка чтения файла' },
  supportedFormats: { en: 'Supported: CSV, TSV, XLSX, vCard (.vcf)', ru: 'Поддерживаются форматы: CSV, TSV, XLSX, vCard (.vcf)' },
  pasteChat: { en: 'Paste chat text', ru: 'Вставьте текст из чата' },
  parse: { en: 'Parse', ru: 'Разобрать' },
  addContact: { en: 'Add Contact', ru: 'Добавить контакт' },
  enterName: { en: 'Enter name', ru: 'Введите имя' },
  contactAdded: { en: 'Contact added', ru: 'Контакт добавлен' },
  importedCount: { en: 'Imported: {n}', ru: 'Импортировано: {n}' },
  mapAtLeastOne: { en: 'Map at least one column to a CRM field to enable import', ru: 'Сопоставьте хотя бы одну колонку с полем CRM, чтобы активировать импорт' },
  foundRows: { en: 'Found {n} rows. Map columns:', ru: 'Найдено {n} строк. Сопоставьте колонки:' },
  previewRows: { en: 'Preview (5 rows):', ru: 'Предпросмотр (5 строк):' },
  dropCsv: { en: 'Drop CSV file or click to browse', ru: 'Перетащите CSV файл или нажмите' },
  formatCsv: { en: 'Format: CSV with headers', ru: 'Формат: CSV с заголовками' },
} as const;

export function t<K extends keyof typeof CONTACTS_IMPORT_I18N>(key: K, lang: 'en' | 'ru'): string {
  return CONTACTS_IMPORT_I18N[key][lang];
}
