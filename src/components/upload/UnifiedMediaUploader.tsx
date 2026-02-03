/**
 * UnifiedMediaUploader - Airbnb-style unified media upload system
 * Modes: gallery, document, avatar, single
 */

import { GalleryMode } from './modes/GalleryMode';
import { DocumentMode } from './modes/DocumentMode';
import { AvatarMode } from './modes/AvatarMode';
import { SingleImageMode } from './modes/SingleImageMode';
import { cn } from '@/lib/utils';

export type UploadMode = 'gallery' | 'document' | 'avatar' | 'single';
export type DocumentType = 'passport' | 'driver_license' | 'insurance' | 'visa' | 'other';

export interface UnifiedMediaUploaderProps {
  // Core
  mode: UploadMode;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  
  // Storage
  folder?: string;
  bucket?: string;
  
  // Limits
  maxItems?: number;
  maxSizeMB?: number;
  
  // Document mode
  documentType?: DocumentType;
  showCamera?: boolean;
  customTips?: string[];
  
  // Avatar mode
  name?: string;
  
  // Single mode
  aspectRatio?: number;
  
  // Features
  enableCloudImport?: boolean;
  enableUrlImport?: boolean;
  enableEditing?: boolean;
  enableQualityTips?: boolean;
  
  // UI
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

// Compression defaults by mode
export const COMPRESSION_DEFAULTS = {
  gallery: { maxSizeMB: 1, maxWidthOrHeight: 2048, format: 'webp' as const },
  document: { maxSizeMB: 2, maxWidthOrHeight: 2400, format: 'webp' as const },
  avatar: { maxSizeMB: 0.5, maxWidthOrHeight: 512, format: 'webp' as const },
  single: { maxSizeMB: 1, maxWidthOrHeight: 2048, format: 'webp' as const },
};

export function UnifiedMediaUploader({
  mode,
  value,
  onChange,
  folder = 'uploads',
  bucket = 'vendor-uploads',
  maxItems = 20,
  maxSizeMB,
  documentType,
  showCamera = true,
  customTips,
  name,
  aspectRatio,
  enableCloudImport = true,
  enableUrlImport = true,
  enableEditing = true,
  enableQualityTips = true,
  className,
  placeholder,
  disabled = false,
}: UnifiedMediaUploaderProps) {
  const compressionConfig = {
    ...COMPRESSION_DEFAULTS[mode],
    ...(maxSizeMB ? { maxSizeMB } : {}),
  };

  const commonProps = {
    folder,
    bucket,
    className,
    disabled,
    compressionConfig,
  };

  switch (mode) {
    case 'gallery':
      return (
        <GalleryMode
          {...commonProps}
          value={Array.isArray(value) ? value : value ? [value] : []}
          onChange={(urls) => onChange(urls)}
          maxItems={maxItems}
          enableCloudImport={enableCloudImport}
          enableUrlImport={enableUrlImport}
          enableEditing={enableEditing}
          enableQualityTips={enableQualityTips}
        />
      );

    case 'document':
      return (
        <DocumentMode
          {...commonProps}
          value={typeof value === 'string' ? value : value[0] || ''}
          onChange={(url) => onChange(url)}
          documentType={documentType}
          showCamera={showCamera}
          customTips={customTips}
          placeholder={placeholder}
        />
      );

    case 'avatar':
      return (
        <AvatarMode
          {...commonProps}
          value={typeof value === 'string' ? value : value[0] || ''}
          onChange={(url) => onChange(url)}
          name={name}
        />
      );

    case 'single':
      return (
        <SingleImageMode
          {...commonProps}
          value={typeof value === 'string' ? value : value[0] || ''}
          onChange={(url) => onChange(url)}
          aspectRatio={aspectRatio}
          placeholder={placeholder}
          enableEditing={enableEditing}
        />
      );

    default:
      return null;
  }
}

// Re-export for convenience
export { GalleryMode } from './modes/GalleryMode';
export { DocumentMode } from './modes/DocumentMode';
export { AvatarMode } from './modes/AvatarMode';
export { SingleImageMode } from './modes/SingleImageMode';
