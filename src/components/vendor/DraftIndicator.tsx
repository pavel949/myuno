import React from 'react';
import { cn } from '@/lib/utils';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DraftIndicatorProps {
  hasDraft: boolean;
  lastSaved: Date | null;
  onClear: () => void;
  onRestore: () => void;
  className?: string;
}

export function DraftIndicator({
  hasDraft,
  lastSaved,
  onClear,
  onRestore,
  className,
}: DraftIndicatorProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(isRussian ? 'ru-RU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!hasDraft) {
    return null;
  }

  return (
    <div className={cn(
      'flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full',
      className
    )}>
      <Cloud className="h-3 w-3" />
      <span>
        {isRussian ? 'Автосохранено' : 'Auto-saved'}
        {lastSaved && ` ${formatTime(lastSaved)}`}
      </span>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <CloudOff className="h-3 w-3 mr-1" />
            {isRussian ? 'Очистить' : 'Clear'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRussian ? 'Очистить черновик?' : 'Clear draft?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRussian 
                ? 'Все несохранённые изменения будут потеряны.'
                : 'All unsaved changes will be lost.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isRussian ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={onClear}>
              {isRussian ? 'Очистить' : 'Clear'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Banner shown when there's an existing draft to restore
interface DraftRestorationBannerProps {
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftRestorationBanner({ onRestore, onDiscard }: DraftRestorationBannerProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <div className="flex items-center justify-between p-3 mb-4 bg-primary/10 border border-primary/20 rounded-none">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-primary" />
        <span className="text-sm">
          {isRussian 
            ? 'У вас есть несохранённый черновик'
            : 'You have an unsaved draft'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard}>
          {isRussian ? 'Отменить' : 'Discard'}
        </Button>
        <Button size="sm" onClick={onRestore}>
          {isRussian ? 'Восстановить' : 'Restore'}
        </Button>
      </div>
    </div>
  );
}
