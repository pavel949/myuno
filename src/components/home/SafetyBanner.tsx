import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Phone, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function SafetyBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Link to="/sos" className="block">
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-gradient-to-r from-destructive/10 via-orange-500/10 to-amber-500/10",
        "border border-destructive/20 hover:border-destructive/40",
        "transition-all hover:shadow-md active:scale-[0.98]"
      )}>
        {/* Icon */}
        <div className="p-2.5 rounded-xl bg-destructive/20 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">
              UNO ALERT
            </span>
            <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 animate-pulse">
              24/7
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            {isRu ? 'Экстренная помощь и поддержка' : 'Emergency help & support'}
          </p>
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  );
}
