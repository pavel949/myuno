import React, { useRef, useCallback, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  X, 
  FileImage, 
  FileText, 
  FileSpreadsheet,
  File,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'pdf' | 'excel' | 'csv' | 'document';
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  url?: string;
}

interface IntakeFileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  pdf: ['application/pdf'],
  excel: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ],
  csv: ['text/csv', 'application/csv'],
  document: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
};

const ALL_ACCEPTED = Object.values(ACCEPTED_TYPES).flat();

function getFileType(mimeType: string): UploadedFile['type'] {
  if (ACCEPTED_TYPES.image.includes(mimeType)) return 'image';
  if (ACCEPTED_TYPES.pdf.includes(mimeType)) return 'pdf';
  if (ACCEPTED_TYPES.excel.includes(mimeType)) return 'excel';
  if (ACCEPTED_TYPES.csv.includes(mimeType)) return 'csv';
  return 'document';
}

function getFileIcon(type: UploadedFile['type']) {
  switch (type) {
    case 'image': return FileImage;
    case 'pdf': return FileText;
    case 'excel': return FileSpreadsheet;
    case 'csv': return FileSpreadsheet;
    default: return File;
  }
}

export function IntakeFileUpload({
  files,
  onFilesChange,
  disabled,
  maxFiles = 20,
  maxSizeMB = 20,
}: IntakeFileUploadProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || disabled) return;

    const newFiles: UploadedFile[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    Array.from(fileList).forEach((file) => {
      // Check if type is accepted
      if (!ALL_ACCEPTED.includes(file.type)) {
        toast.error(
          isRu 
            ? `Неподдерживаемый формат: ${file.name}` 
            : `Unsupported format: ${file.name}`
        );
        return;
      }

      // Check file size
      if (file.size > maxSizeBytes) {
        toast.error(
          isRu 
            ? `Файл слишком большой: ${file.name} (макс. ${maxSizeMB}MB)` 
            : `File too large: ${file.name} (max ${maxSizeMB}MB)`
        );
        return;
      }

      // Check total count
      if (files.length + newFiles.length >= maxFiles) {
        toast.error(
          isRu 
            ? `Максимум ${maxFiles} файлов` 
            : `Maximum ${maxFiles} files`
        );
        return;
      }

      const fileType = getFileType(file.type);
      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        type: fileType,
        status: 'pending',
      };

      // Create preview for images
      if (fileType === 'image') {
        uploadedFile.preview = URL.createObjectURL(file);
      }

      newFiles.push(uploadedFile);
    });

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  }, [files, onFilesChange, disabled, maxFiles, maxSizeMB, isRu]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    const file = files.find(f => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onFilesChange(files.filter(f => f.id !== id));
  }, [files, onFilesChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragging 
            ? "border-primary bg-primary/10" 
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALL_ACCEPTED.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium">
          {isRu ? 'Перетащите файлы или нажмите' : 'Drop files or click to upload'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu 
            ? `Изображения, PDF, Excel, CSV, документы (макс. ${maxSizeMB}MB)` 
            : `Images, PDF, Excel, CSV, documents (max ${maxSizeMB}MB)`
          }
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            
            return (
              <div
                key={file.id}
                className="relative group border rounded-lg overflow-hidden bg-card"
              >
                {/* Preview */}
                <div className="aspect-square flex items-center justify-center bg-muted/50">
                  {file.type === 'image' && file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="h-10 w-10 text-muted-foreground" />
                  )}
                  
                  {/* Status overlay */}
                  {file.status === 'uploading' && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                
                {/* File info */}
                <div className="p-2">
                  <p className="text-xs font-medium truncate" title={file.file.name}>
                    {file.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file.size)}
                  </p>
                </div>
                
                {/* Remove button */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  disabled={disabled || file.status === 'uploading'}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* File count */}
      {files.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {isRu 
            ? `${files.length} из ${maxFiles} файлов` 
            : `${files.length} of ${maxFiles} files`
          }
        </p>
      )}
    </div>
  );
}
