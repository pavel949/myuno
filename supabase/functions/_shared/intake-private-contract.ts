// Shared, pure private-file contract; no network, token or browser dependency.
export const INTAKE_FILE_CONTRACT = 'private-v2';
export const INTAKE_DOCUMENT_CONTRACT = 'private-v3';
export const INTAKE_DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'xlsx'] as const;
export type IntakeDocumentExtension = typeof INTAKE_DOCUMENT_EXTENSIONS[number];
const DOCUMENT_TYPES: Record<IntakeDocumentExtension, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
export function isIntakeDocumentExtension(ext: string): ext is IntakeDocumentExtension {
  return (INTAKE_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext);
}
export function intakeContractForExtensions(extensions: readonly string[]): string {
  return extensions.some(isIntakeDocumentExtension) ? INTAKE_DOCUMENT_CONTRACT : INTAKE_FILE_CONTRACT;
}
export function intakeContractReady(contract: unknown, documentsEnabled: boolean): boolean {
  return contract === INTAKE_FILE_CONTRACT || (contract === INTAKE_DOCUMENT_CONTRACT && documentsEnabled);
}
export const INTAKE_MAX_FILES = 5;
export const INTAKE_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const INTAKE_MAX_TOTAL_BYTES = 12 * 1024 * 1024;
export const INTAKE_MAX_TEXT = 7000;
const TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  txt: 'text/plain', csv: 'text/csv',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function intakeMime(ext: string, allowDocuments = false): string | undefined {
  const key = ext.toLowerCase();
  if (allowDocuments && isIntakeDocumentExtension(key)) return DOCUMENT_TYPES[key];
  return Object.prototype.hasOwnProperty.call(TYPES, key) ? TYPES[key] : undefined;
}
export function intakeExtension(name: string, allowDocuments = false): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (!intakeMime(ext, allowDocuments)) throw new Error('Unsupported intake format: JPEG, PNG, WebP, TXT or CSV; PDF, DOCX and XLSX require the enabled document contract.');
  return ext;
}
export function makeIntakePath(actor: string, randomId: string, ext: string, allowDocuments = false): string {
  if (!UUID.test(actor) || !UUID.test(randomId) || !intakeMime(ext, allowDocuments)) throw new Error('Invalid intake path');
  return actor + '/' + randomId + '.' + ext.toLowerCase();
}
export function parseIntakePaths(actor: string, value: unknown, allowDocuments = false): string[] {
  if (!UUID.test(actor) || !Array.isArray(value) || !value.length || value.length > INTAKE_MAX_FILES) throw new Error('Invalid intake paths');
  const paths = value.map((path: unknown) => {
    if (typeof path !== 'string') throw new Error('Invalid intake path');
    const match = /^([^/]+)\/([^/.]+)\.([a-z]+)$/.exec(path);
    if (!match || match[1] !== actor || !UUID.test(match[2]) || !intakeMime(match[3], allowDocuments)) throw new Error('Invalid intake path');
    return path;
  });
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate intake path');
  return paths;
}
export function validateIntakeFileMetadata(files: ReadonlyArray<{ name: string; size: number }>, allowDocuments = false): string[] {
  if (!files.length || files.length > INTAKE_MAX_FILES) throw new Error('Choose 1–5 files');
  if (files.some(f => !Number.isFinite(f.size) || f.size <= 0 || f.size > INTAKE_MAX_FILE_BYTES) ||
      files.reduce((n, f) => n + f.size, 0) > INTAKE_MAX_TOTAL_BYTES) throw new Error('File limit: 5 MB each / 12 MB total');
  return files.map(f => intakeExtension(f.name, allowDocuments));
}
export function hasPrivateIntakeReference(value: unknown): boolean {
  if (typeof value === 'string') {
    let decoded = value;
    // Bound decoding work and fail closed on unresolved nested encodings.
    for (let i = 0; i < 8; i++) {
      if (/intake-uploads|intake-private:|(?:^|\s)data:|(?:^|\s)blob:|(?:^|\s)intake\//i.test(decoded)) return true;
      if (/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp|txt|csv|pdf|docx|xlsx)$/i.test(decoded)) return true;
      const normalized = decoded.replace(/%([0-9a-f]{2})/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));
      if (normalized === decoded) return false;
      decoded = normalized;
    }
    return true;
  }
  if (Array.isArray(value)) return value.some(hasPrivateIntakeReference);
  if (value && typeof value === 'object') return Object.values(value).some(hasPrivateIntakeReference);
  return false;
}
export function publicIntakeImages(images?: string[]): string[] {
  return (images || []).filter(url => typeof url === 'string' && /^https?:\/\//i.test(url) && !hasPrivateIntakeReference(url));
}
export function validateIntakeBytes(mime: string, bytes: Uint8Array): void {
  const at = (index: number, values: number[]) => values.every((v, i) => bytes[index + i] === v);
  if (!bytes.length || bytes.length > INTAKE_MAX_FILE_BYTES) throw new Error('Invalid intake file size');
  if (mime === 'image/jpeg' && at(0, [255, 216, 255])) return;
  if (mime === 'image/png' && at(0, [137, 80, 78, 71, 13, 10, 26, 10])) return;
  if (mime === 'image/webp' && at(0, [82, 73, 70, 70]) && at(8, [87, 69, 66, 80])) return;
  if (mime === 'text/plain' || mime === 'text/csv') {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // An ASCII PDF can be valid UTF-8; a renamed document is not plain text.
    const pdfHeader = text.indexOf('%PDF-');
    if (pdfHeader >= 0 && pdfHeader < 1024) throw new Error('Unsupported PDF intake format');
    if (!text.includes('\0') && text.length <= INTAKE_MAX_TEXT && text.trim()) return;
  }
  throw new Error('Invalid or unsupported intake file content');
}
