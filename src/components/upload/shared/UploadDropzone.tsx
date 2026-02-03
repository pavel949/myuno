/**
 * UploadDropzone - Universal drag & drop zone component
 */

import { useState, useRef, ReactNode } from 'react';
import { Upload, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadDropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  showCamera?: boolean;
  className?: string;
  children?: ReactNode;
  emptyState?: ReactNode;
  placeholder?: string;
  maxItems?: number;
  currentCount?: number;
}

export function UploadDropzone({
  onFiles,
  accept = 'image/jpeg,image/png,image/webp,image/gif,image/heic',
  multiple = true,
  disabled = false,
  showCamera = false,
  className,
  children,
  emptyState,
  placeholder,
  maxItems = 20,
  currentCount = 0,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files).filter(f => 
      f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    
    if (files.length > 0) {
      onFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFiles(files);
    }
    e.target.value = '';
  };

  const openFilePicker = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const openCamera = () => {
    if (!disabled) cameraInputRef.current?.click();
  };

  const remainingSlots = maxItems - currentCount;
  const hasContent = children && currentCount > 0;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-xl transition-all",
        isDragOver && "ring-2 ring-primary ring-offset-2",
        className
      )}
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        multiple={multiple}
        disabled={disabled}
      />
      
      {showCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      )}

      {/* Content or Empty State */}
      {hasContent ? (
        <>
          {children}
          
          {/* Drag overlay when has content */}
          {isDragOver && (
            <div className="absolute inset-0 bg-primary/10 rounded-xl flex items-center justify-center pointer-events-none z-50">
              <div className="bg-background/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg">
                <p className="font-medium text-primary">Отпустите для загрузки</p>
              </div>
            </div>
          )}
        </>
      ) : emptyState ? (
        emptyState
      ) : (
        <button
          type="button"
          onClick={showCamera ? openCamera : openFilePicker}
          disabled={disabled}
          className={cn(
            "w-full py-12 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4",
            disabled && "opacity-50 cursor-not-allowed",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {showCamera ? (
              <Camera className="h-8 w-8 text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="text-center">
            <p className="font-medium">
              {placeholder || (showCamera ? 'Сфотографировать или выбрать' : 'Перетащите файлы сюда')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {showCamera 
                ? 'Нажмите для камеры или перетащите файл'
                : `или нажмите для выбора • до ${maxItems} файлов`
              }
            </p>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>JPG</span>
            <span>•</span>
            <span>PNG</span>
            <span>•</span>
            <span>WebP</span>
            <span>•</span>
            <span>PDF</span>
          </div>
        </button>
      )}

      {/* Additional upload button for mobile camera */}
      {showCamera && hasContent && (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={openCamera}
            disabled={disabled || remainingSlots <= 0}
            className="flex-1 py-3 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Camera className="h-4 w-4" />
            Камера
          </button>
          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled || remainingSlots <= 0}
            className="flex-1 py-3 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Upload className="h-4 w-4" />
            Галерея
          </button>
        </div>
      )}

      {/* Expose methods for parent components */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        multiple={multiple}
        disabled={disabled}
        data-testid="dropzone-file-input"
      />
    </div>
  );
}

export function useDropzoneRef() {
  const ref = useRef<HTMLInputElement>(null);
  
  return {
    ref,
    openFilePicker: () => ref.current?.click(),
  };
}
