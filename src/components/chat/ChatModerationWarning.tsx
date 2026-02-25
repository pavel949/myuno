import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, X, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ModerationResult, getViolationLabel } from '@/lib/chatModerationPatterns';
import { Link } from 'react-router-dom';

interface ChatModerationWarningProps {
  moderationResult: ModerationResult;
  onDismiss?: () => void;
  onAcknowledge?: () => void;
  isPreSend?: boolean; // Warning before sending vs after receiving
  className?: string;
}

export const ChatModerationWarning: React.FC<ChatModerationWarningProps> = ({
  moderationResult,
  onDismiss,
  onAcknowledge,
  isPreSend = false,
  className,
}) => {
  const { language } = useLanguage();
  const lang = language === 'ru' ? 'ru' : language === 'th' ? 'th' : 'en';
  const isRu = language === 'ru';

  if (!moderationResult.isViolation || !moderationResult.warningMessage) {
    return null;
  }

  const isCritical = moderationResult.severity === 'critical';
  const violationLabel = moderationResult.type 
    ? getViolationLabel(moderationResult.type, lang) 
    : '';

  return (
    <div 
      className={cn(
        'rounded-lg border p-3 animate-in slide-in-from-top-2 duration-300',
        isCritical 
          ? 'bg-destructive/10 border-destructive/30' 
          : 'bg-warning/10 border-warning/30',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-1.5 rounded-full flex-shrink-0',
          isCritical ? 'bg-destructive/20' : 'bg-warning/20'
        )}>
          {isCritical ? (
            <ShieldAlert className={cn(
              'w-4 h-4',
              isCritical ? 'text-destructive' : 'text-warning'
            )} />
          ) : (
            <AlertTriangle className="w-4 h-4 text-warning" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded',
              isCritical 
                ? 'bg-destructive/20 text-destructive' 
                : 'bg-warning/20 text-warning'
            )}>
              {violationLabel}
            </span>
            {isCritical && (
              <span className="text-[10px] text-destructive font-medium">
                {isRu ? 'КРИТИЧНО' : 'CRITICAL'}
              </span>
            )}
          </div>
          
          <p className="text-sm leading-relaxed">
            {moderationResult.warningMessage[lang]}
          </p>
          
          {isPreSend && (
            <p className="text-xs text-muted-foreground mt-2">
              {isRu 
                ? 'Ваше сообщение не будет отправлено. Пожалуйста, отредактируйте его.' 
                : 'Your message will not be sent. Please edit it.'}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Link 
              to="/terms#chat-policy" 
              className={cn(
                'text-xs flex items-center gap-1 hover:underline',
                isCritical ? 'text-destructive' : 'text-warning'
              )}
            >
              {isRu ? 'Правила чата' : 'Chat Policy'}
              <ExternalLink className="w-3 h-3" />
            </Link>
            
            {onAcknowledge && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onAcknowledge}
                className="h-7 text-xs"
              >
                {isRu ? 'Понятно' : 'Got it'}
              </Button>
            )}
          </div>
        </div>
        
        {onDismiss && !isCritical && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 flex-shrink-0"
            onClick={onDismiss}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatModerationWarning;
