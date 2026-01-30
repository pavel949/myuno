import React from 'react';
import { HeadphonesIcon, Users, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface ChatDelegationBannerProps {
  isDelegated: boolean;
  onToggleDelegation: (enabled: boolean) => void;
  isLoading?: boolean;
  variant?: 'compact' | 'full';
  className?: string;
}

export const ChatDelegationBanner: React.FC<ChatDelegationBannerProps> = ({
  isDelegated,
  onToggleDelegation,
  isLoading = false,
  variant = 'full',
  className,
}) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center justify-between gap-3 px-3 py-2 rounded-lg border',
        isDelegated 
          ? 'bg-primary/5 border-primary/20' 
          : 'bg-muted/50 border-border',
        className
      )}>
        <div className="flex items-center gap-2">
          <HeadphonesIcon className={cn(
            'w-4 h-4',
            isDelegated ? 'text-primary' : 'text-muted-foreground'
          )} />
          <span className="text-sm">
            {isRu 
              ? (isDelegated ? 'Чат ведёт myUNO' : 'Делегировать чат myUNO')
              : (isDelegated ? 'Chat managed by myUNO' : 'Delegate chat to myUNO')
            }
          </span>
        </div>
        <Switch
          checked={isDelegated}
          onCheckedChange={onToggleDelegation}
          disabled={isLoading}
        />
      </div>
    );
  }

  return (
    <Card className={cn(
      'overflow-hidden',
      isDelegated ? 'border-primary/30' : 'border-border',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            'p-3 rounded-xl',
            isDelegated ? 'bg-primary/10' : 'bg-muted'
          )}>
            <HeadphonesIcon className={cn(
              'w-6 h-6',
              isDelegated ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">
                {isRu ? 'Делегировать чат команде myUNO' : 'Delegate Chat to myUNO Team'}
              </h3>
              {isDelegated && (
                <Badge variant="default" className="text-[10px]">
                  {isRu ? 'АКТИВНО' : 'ACTIVE'}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {isRu 
                ? 'Наши специалисты будут отвечать гостям от вашего имени, обрабатывать запросы и решать вопросы 24/7.'
                : 'Our specialists will respond to guests on your behalf, handle requests, and resolve issues 24/7.'}
            </p>

            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{isRu ? 'Профессиональная поддержка' : 'Professional support'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isRu ? 'Соблюдение правил' : 'Policy compliance'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={isDelegated ? 'outline' : 'default'}
                size="sm"
                onClick={() => onToggleDelegation(!isDelegated)}
                disabled={isLoading}
                className="gap-2"
              >
                {isDelegated ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    {isRu ? 'Отключить делегирование' : 'Disable Delegation'}
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    {isRu ? 'Делегировать myUNO' : 'Delegate to myUNO'}
                  </>
                )}
              </Button>
              
              {isDelegated && (
                <span className="text-xs text-primary">
                  {isRu 
                    ? '✓ Команда myUNO отвечает за вас'
                    : '✓ myUNO team responds for you'}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatDelegationBanner;
