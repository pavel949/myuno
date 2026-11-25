// Shared, pure private-file contract; no network, token or browser dependency.
export const INTAKE_FILE_CONTRACT = 'private-v2';
export const INTAKE_MAX_FILES = 5;
export const INTAKE_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const INTAKE_MAX_TOTAL_BYTES = 12 * 1024 * 1024;
export const INTAKE_MAX_TEXT = 7000;
const TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  txt: 'text/plain', csv: 'text/csv',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function intakeMime(ext: string): string | undefined { return TYPES[ext.toLowerCase()]; }
export function intakeExtension(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (!intakeMime(ext)) throw new Error('Unsupported intake format: use JPEG, PNG, WebP, TXT or CSV; spreadsheet import is separate.');
  return ext;
}
export function makeIntakePath(actor: string, randomId: string, ext: string): string {
  if (!UUID.test(actor) || !UUID.test(randomId) || !intakeMime(ext)) throw new Error('Invalid intake path');
  return actor + '/' + randomId + '.' + ext.toLowerCase();
}
export function parseIntakePaths(actor: string, value: unknown): string[] {
  if (!UUID.test(actor) || !Array.isArray(value) || !value.length || value.length > INTAKE_MAX_FILES) throw new Error('Invalid intake paths');
  const paths = value.map((path: unknown) => {
    if (typeof path !== 'string') throw new Error('Invalid intake path');
    const match = /^([^/]+)\/([^/.]+)\.([a-z]+)$/.exec(path);
    if (!match || match[1] !== actor || !UUID.test(match[2]) || !intakeMime(match[3])) throw new Error('Invalid intake path');
    return path;
  });
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate intake path');
  return paths;
}
export function validateIntakeFileMetadata(files: ReadonlyArray<{ name: string; size: number }>): string[] {
  if (!files.length || files.length > INTAKE_MAX_FILES) throw new Error('Choose 1–5 files');
  if (files.some(f => !Number.isFinite(f.size) || f.size <= 0 || f.size > INTAKE_MAX_FILE_BYTES) ||
      files.reduce((n, f) => n + f.size, 0) > INTAKE_MAX_TOTAL_BYTES) throw new Error('File limit: 5 MB each / 12 MB total');
  return files.map(f => intakeExtension(f.name));
}
export function hasPrivateIntakeReference(value: unknown): boolean {
  if (typeof value === 'string') {
    let decoded = value;
    for (let i = 0; i < 4; i++) {
      if (/intake-uploads|intake-private:|(?:^|\s)data:|(?:^|\s)blob:|(?:^|\s)intake\//i.test(decoded)) return true;
      const normalized = decoded.replace(/%([0-9a-f]{2})/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));
      if (normalized === decoded) break;
      decoded = normalized;
    }
    return false;
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
    if (!text.includes('\0') && text.length <= INTAKE_MAX_TEXT && text.trim()) return;
  }
  throw new Error('Invalid or unsupported intake file content');
}
