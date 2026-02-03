/**
 * ImageCompressor - WebP compression utility with quality analysis
 */

import imageCompression from 'browser-image-compression';

export interface CompressionConfig {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  format: 'webp' | 'jpeg' | 'png';
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

const DEFAULT_CONFIG: CompressionConfig = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2048,
  format: 'webp',
};

export async function compressImage(
  file: File,
  config: Partial<CompressionConfig> = {},
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  const { maxSizeMB, maxWidthOrHeight, format } = { ...DEFAULT_CONFIG, ...config };
  
  const originalSize = file.size;
  
  // Get original dimensions
  const dimensions = await getImageDimensions(file);
  
  const compressedFile = await imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: format === 'webp' ? 'image/webp' : format === 'png' ? 'image/png' : 'image/jpeg',
    initialQuality: 0.85,
    onProgress: (progress) => {
      onProgress?.(Math.round(progress));
    },
  });
  
  const compressedDimensions = await getImageDimensions(compressedFile);
  
  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
    compressionRatio: originalSize / compressedFile.size,
    width: compressedDimensions.width,
    height: compressedDimensions.height,
  };
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateImageFile(file: File, maxSizeMB: number = 20): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];
  
  if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
    return { valid: false, error: 'Неподдерживаемый формат файла' };
  }
  
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Файл превышает ${maxSizeMB}MB` };
  }
  
  return { valid: true };
}

export function validateDocumentFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Неподдерживаемый формат. Используйте JPG, PNG, WebP или PDF' };
  }
  
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Файл превышает ${maxSizeMB}MB` };
  }
  
  return { valid: true };
}
