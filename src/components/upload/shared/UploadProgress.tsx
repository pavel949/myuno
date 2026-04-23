/**
 * UploadProgress - Visual upload progress indicator
 */

import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UploadStatus = 'compressing' | 'uploading' | 'done' | 'error';

interface UploadProgressProps {
  status: UploadStatus;
  progress: number;
  error?: string;
  preview?: string;
  className?: string;
}

export function UploadProgress({
  status,
  progress,
  error,
  preview,
  className,
}: UploadProgressProps) {
  return (
    <div className={cn(
      "relative aspect-square rounded-none overflow-hidden border-2 border-dashed border-primary/50 bg-muted",
      className
    )}>
      {preview && (
        <img 
          src={preview} 
          alt="Загрузка"
          className="w-full h-full object-cover opacity-50"
        />
      )}
      
      {/* Progress overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
        {status === 'compressing' && (
          <>
            <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
            <span className="text-white text-xs font-medium">Сжатие...</span>
          </>
        )}
        
        {status === 'uploading' && (
          <CircularProgress progress={progress} />
        )}
        
        {status === 'done' && (
          <div className="bg-success rounded-full p-2">
            <Check className="h-6 w-6 text-white" />
          </div>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
            <span className="text-red-400 text-xs text-center px-2">{error}</span>
          </>
        )}
      </div>
    </div>
  );
}

function CircularProgress({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 28; // radius = 28
  const offset = circumference - (circumference * progress) / 100;

  return (
    <div className="w-16 h-16 relative">
      <svg className="w-16 h-16 transform -rotate-90">
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="white"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
        {progress}%
      </span>
    </div>
  );
}

// Compact inline progress bar
interface InlineProgressProps {
  progress: number;
  status: UploadStatus;
  className?: string;
}

export function InlineProgress({ progress, status, className }: InlineProgressProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {status === 'compressing' && 'Сжатие...'}
          {status === 'uploading' && 'Загрузка...'}
          {status === 'done' && 'Готово'}
          {status === 'error' && 'Ошибка'}
        </span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            status === 'error' ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
