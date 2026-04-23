import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Languages, Copy, Keyboard, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminFormToolbarProps {
  progress: number;
  filled: number;
  total: number;
  onTranslate: () => void;
  onDuplicate?: () => void;
  isTranslating?: boolean;
  isEditing?: boolean;
  showDuplicate?: boolean;
}

export function AdminFormToolbar({
  progress,
  filled,
  total,
  onTranslate,
  onDuplicate,
  isTranslating = false,
  isEditing = false,
  showDuplicate = true,
}: AdminFormToolbarProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-none border mb-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Progress value={progress} className="h-2 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filled}/{total}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          {/* Auto-translate button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onTranslate}
                disabled={isTranslating}
                className="h-8"
              >
                {isTranslating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Languages className="h-4 w-4" />
                )}
                <span className="ml-1.5 hidden sm:inline">
                  {isRu ? 'EN→RU' : 'EN→RU'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isRu ? 'Автоперевод на русский' : 'Auto-translate to Russian'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Duplicate button (only when editing) */}
          {showDuplicate && isEditing && onDuplicate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onDuplicate}
                  className="h-8"
                >
                  <Copy className="h-4 w-4" />
                  <span className="ml-1.5 hidden sm:inline">
                    {isRu ? 'Дублировать' : 'Duplicate'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRu ? 'Создать копию' : 'Create a copy'}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Hotkeys hint */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="h-8 px-2 cursor-default">
                <Keyboard className="h-3 w-3 mr-1" />
                <span className="text-xs">Ctrl+S</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isRu ? 'Ctrl+S — сохранить, Esc — закрыть' : 'Ctrl+S — save, Esc — close'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
