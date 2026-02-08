import React, { forwardRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Subcategory {
  id: string;
  label_en: string;
  label_ru: string;
  icon?: string;
}

interface SubcategoryChipsProps {
  subcategories: Subcategory[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const SubcategoryChips = forwardRef<HTMLDivElement, SubcategoryChipsProps>(
  ({ subcategories, selectedId, onSelect, className }, ref) => {
    const { language } = useLanguage();

    if (subcategories.length <= 1) return null;

    return (
      <div ref={ref} className={cn("overflow-x-auto scrollbar-hide -mx-4 px-4 touch-pan-y snap-x snap-proximity", className)}>
        <div className="flex gap-2 pb-1">
          {subcategories.map((sub) => {
            const isActive = selectedId === sub.id;
            const label = language === 'ru' ? sub.label_ru : sub.label_en;
            
            return (
              <button
                key={sub.id}
                onClick={() => onSelect(sub.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                  "border shadow-sm",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                {sub.icon && <span className="text-base">{sub.icon}</span>}
                <span>{label}</span>
                {isActive && <Check className="w-3.5 h-3.5 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

SubcategoryChips.displayName = 'SubcategoryChips';
