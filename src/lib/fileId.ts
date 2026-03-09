/**
 * Generates a cryptographically secure random ID for file naming.
 * Replaces Math.random() which is not cryptographically secure.
 */
export function generateFileId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

/**
 * Generates a unique file name with timestamp + secure random suffix.
 * @param extension - file extension (without dot)
 */
export function generateFileName(extension: string): string {
  return `${Date.now()}-${generateFileId()}.${extension}`;
}
