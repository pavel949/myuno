/**
 * TranslateAllButton - Batch translate all form fields
 * 
 * Use in wizard forms to translate all RU→EN or EN→RU fields at once
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Languages, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAITranslate } from '@/hooks/useAITranslate';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TranslateAllButtonProps<T extends Record<string, any>> {
  /** Current form data */
  formData: T;
  /** Callback to update form data */
  onUpdate: (updates: Partial<T>) => void;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'default';
  /** Additional className */
  className?: string;
}

export function TranslateAllButton<T extends Record<string, any>>({
  formData,
  onUpdate,
  variant = 'outline',
  size = 'sm',
  className,
}: TranslateAllButtonProps<T>) {
  const { autoTranslateForm, isTranslating } = useAITranslate();

  const handleTranslate = async (direction: 'ru_to_en' | 'en_to_ru') => {
    const translations = await autoTranslateForm(formData, direction);
    if (translations) {
      onUpdate(translations);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
          disabled={isTranslating}
        >
          {isTranslating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
          AI Перевод
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover z-50">
        <DropdownMenuItem
          onClick={() => handleTranslate('ru_to_en')}
          className="cursor-pointer"
        >
          <span className="font-medium">RU</span>
          <ArrowRight className="h-3 w-3 mx-2" />
          <span className="font-medium">EN</span>
          <span className="ml-2 text-muted-foreground text-xs">
            Русский → English
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleTranslate('en_to_ru')}
          className="cursor-pointer"
        >
          <span className="font-medium">EN</span>
          <ArrowRight className="h-3 w-3 mx-2" />
          <span className="font-medium">RU</span>
          <span className="ml-2 text-muted-foreground text-xs">
            English → Русский
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default TranslateAllButton;
