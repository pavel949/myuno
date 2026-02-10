import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export const ManagePropertyBanner = memo(function ManagePropertyBanner() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <button
      onClick={() => navigate('/owner')}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-2xl',
        'bg-card border border-border/50 shadow-sm',
        'hover:shadow-md active:scale-[0.98] transition-all duration-200',
        'text-left'
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Building2 className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-sm">
          {isRu ? 'Управление недвижимостью' : 'Manage Property'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isRu
            ? 'Ваши объекты, календарь, финансы'
            : 'Your properties, calendar, finances'}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
});
