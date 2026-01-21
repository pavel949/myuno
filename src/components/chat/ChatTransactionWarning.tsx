import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ChatTransactionWarningProps {
  variant?: 'banner' | 'compact';
  className?: string;
}

export const ChatTransactionWarning: React.FC<ChatTransactionWarningProps> = ({ 
  variant = 'banner',
  className 
}) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-primary/20 text-xs",
        className
      )}>
        <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span className="text-muted-foreground">
          {isRu 
            ? 'Транзакции защищены только при оплате через UNO' 
            : 'Transactions protected only when paid through UNO'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "mx-3 mt-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-amber-500/10 border border-primary/20",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-full bg-primary/20">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium mb-1">
            {isRu ? '🛡️ Защита транзакций' : '🛡️ Transaction Protection'}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isRu 
              ? 'Оплата вне платформы лишает вас гарантий возврата, кэшбека и поддержки. Все сделки должны проходить через UNO.' 
              : 'Payment outside the platform deprives you of refund guarantees, cashback, and support. All transactions must go through UNO.'}
          </p>
          <Link 
            to="/terms" 
            className="text-xs text-primary hover:underline mt-1 inline-block"
          >
            {isRu ? 'Подробнее →' : 'Learn more →'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ChatTransactionWarning;
