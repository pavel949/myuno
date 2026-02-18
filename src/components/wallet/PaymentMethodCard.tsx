import React from 'react';
import { CreditCard, Star, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PaymentMethod } from '@/hooks/usePaymentMethods';

const BRAND_ICONS: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  mir: '💳',
  amex: '💳',
};

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PaymentMethodCard({ method, onSetDefault, onDelete }: PaymentMethodCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <motion.div
      layout
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all',
        method.is_default ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <CreditCard className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm capitalize">
            {method.brand || 'Card'} •••• {method.last4}
          </span>
          {method.is_default && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-primary/40 text-primary">
              {isRu ? 'Основная' : 'Default'}
            </Badge>
          )}
        </div>
        {method.exp_month && method.exp_year && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRu ? 'Действует до' : 'Expires'} {String(method.exp_month).padStart(2, '0')}/{method.exp_year}
          </p>
        )}
        {method.holder_name && (
          <p className="text-xs text-muted-foreground">{method.holder_name}</p>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {!method.is_default && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => onSetDefault(method.id)}
            title={isRu ? 'Сделать основной' : 'Set as default'}
          >
            <Star className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(method.id)}
          title={isRu ? 'Удалить' : 'Delete'}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
