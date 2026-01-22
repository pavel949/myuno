import { CreditCard, Star, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaymentMethod } from '@/hooks/usePaymentMethods';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const brandColors: Record<string, string> = {
  visa: 'from-blue-600 to-blue-800',
  mastercard: 'from-orange-500 to-red-600',
  mir: 'from-green-500 to-teal-600',
  amex: 'from-gray-600 to-gray-800',
  default: 'from-gray-500 to-gray-700',
};

const brandLogos: Record<string, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  mir: 'МИР',
  amex: 'AMEX',
};

export function PaymentMethodCard({
  method,
  onSetDefault,
  onDelete,
  compact = false,
}: PaymentMethodCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const brand = method.brand?.toLowerCase() || 'default';
  const gradientClass = brandColors[brand] || brandColors.default;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className={cn(
          'w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r',
          gradientClass
        )}>
          {brandLogos[brand] || <CreditCard className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">•••• {method.last4}</p>
          {method.exp_month && method.exp_year && (
            <p className="text-xs text-muted-foreground">
              {String(method.exp_month).padStart(2, '0')}/{String(method.exp_year).slice(-2)}
            </p>
          )}
        </div>
        {method.is_default && (
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl p-4 text-white bg-gradient-to-br',
      gradientClass,
      method.is_default && 'ring-2 ring-yellow-400/50'
    )}>
      {/* Card pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 right-2 w-16 h-16 rounded-full border-2" />
        <div className="absolute top-4 right-4 w-12 h-12 rounded-full border-2" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="text-lg font-bold tracking-wider">
            {brandLogos[brand] || method.brand?.toUpperCase() || 'CARD'}
          </div>
          
          {(onSetDefault || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onSetDefault && !method.is_default && (
                  <DropdownMenuItem onClick={() => onSetDefault(method.id)}>
                    <Star className="w-4 h-4 mr-2" />
                    {isRu ? 'Сделать основной' : 'Set as default'}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(method.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isRu ? 'Удалить' : 'Delete'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mb-4">
          <div className="text-xl tracking-widest font-mono">
            •••• •••• •••• {method.last4}
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            {method.holder_name && (
              <p className="text-xs text-white/70 uppercase tracking-wide">
                {method.holder_name}
              </p>
            )}
          </div>
          <div className="text-right">
            {method.exp_month && method.exp_year && (
              <>
                <p className="text-[10px] text-white/60 uppercase">
                  {isRu ? 'Действует до' : 'Valid thru'}
                </p>
                <p className="text-sm font-mono">
                  {String(method.exp_month).padStart(2, '0')}/{String(method.exp_year).slice(-2)}
                </p>
              </>
            )}
          </div>
        </div>

        {method.is_default && (
          <div className="absolute top-4 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 text-xs">
            <Star className="w-3 h-3 fill-current" />
            {isRu ? 'Основная' : 'Default'}
          </div>
        )}
      </div>
    </div>
  );
}
