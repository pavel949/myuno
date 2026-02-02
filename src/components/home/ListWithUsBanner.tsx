import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Sparkles, Package, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ListWithUsBannerProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const ListWithUsBanner = forwardRef<HTMLDivElement, ListWithUsBannerProps>(
  function ListWithUsBanner({ className, variant = 'full' }, ref) {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const isRu = language === 'ru';

    if (variant === 'compact') {
      return (
        <div ref={ref} className={className}>
          <button
            onClick={() => navigate('/list-with-us')}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm">
                {isRu ? 'Предложить свой объект' : 'List with us'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Жильё, услуги или товары' : 'Property, services or products'}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      );
    }

    return (
      <Card 
        ref={ref}
        className={cn(
          "overflow-hidden cursor-pointer hover:shadow-lg transition-shadow",
          className
        )}
        onClick={() => navigate('/list-with-us')}
      >
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {isRu ? 'Начните зарабатывать' : 'Start earning today'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Разместите свой листинг за 5 минут' 
                    : 'List your offering in 5 minutes'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-background/60 backdrop-blur">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-center">
                  {isRu ? 'Недвижимость' : 'Property'}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-background/60 backdrop-blur">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
                <span className="text-xs font-medium text-center">
                  {isRu ? 'Услуги' : 'Services'}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-background/60 backdrop-blur">
                <Package className="h-5 w-5 text-secondary-foreground" />
                <span className="text-xs font-medium text-center">
                  {isRu ? 'Товары' : 'Products'}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-primary font-medium">
              <span>{isRu ? 'Начать' : 'Get started'}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
