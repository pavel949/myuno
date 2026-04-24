import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { resolveIcon } from '@/lib/iconMap';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, User, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getLeadVerticalById, 
  LeadSource 
} from '@/lib/leadVerticalConfig';
import { UniversalLeadForm } from './UniversalLeadForm';

type CTAVariant = 'banner' | 'compact' | 'sticky' | 'inline' | 'card';
type CTAContext = 'list' | 'detail' | 'empty' | 'search';

interface VerticalCTAProps {
  vertical: string;
  variant?: CTAVariant;
  context?: CTAContext;
  className?: string;
  preselectedRequestType?: string;
}

export function VerticalCTA({
  vertical,
  variant = 'banner',
  context = 'list',
  className,
  preselectedRequestType,
}: VerticalCTAProps) {
  const { language } = useLanguage();
  const location = useLocation();
  const isRu = language === 'ru';
  const [isOpen, setIsOpen] = useState(false);

  const verticalConfig = getLeadVerticalById(vertical);
  
  if (!verticalConfig) {
    return null;
  }

  // Context-aware text
  const getText = () => {
    const name = isRu ? verticalConfig.nameRu : verticalConfig.nameEn;
    
    if (context === 'empty') {
      return {
        title: isRu ? 'Не нашли подходящий вариант?' : "Couldn't find what you need?",
        subtitle: isRu 
          ? 'Оставьте заявку — подберём подходящие варианты под ваш запрос' 
          : 'Leave a request — we will pick suitable options for you',
        button: isRu ? 'Оставить заявку' : 'Submit Request',
      };
    }
    
    if (context === 'search') {
      return {
        title: isRu ? 'Нужна помощь с выбором?' : 'Need help choosing?',
        subtitle: isRu 
          ? 'Наш эксперт подберёт идеальный вариант' 
          : 'Our expert will find the perfect option',
        button: isRu ? 'Получить помощь' : 'Get Help',
      };
    }

    if (context === 'detail') {
      return {
        title: isRu ? 'Есть вопросы?' : 'Have questions?',
        subtitle: isRu 
          ? 'Наш менеджер ответит и поможет с бронированием' 
          : 'Our manager will answer and help with booking',
        button: isRu ? 'Связаться' : 'Contact Us',
      };
    }
    
    // Default (list context)
    return {
      title: isRu ? `Нужна помощь с ${name.toLowerCase()}?` : `Need help with ${name.toLowerCase()}?`,
      subtitle: isRu 
        ? 'Оставьте заявку — мы свяжемся с вами' 
        : 'Leave a request — we will contact you',
      button: isRu ? verticalConfig.ctaTextRu : verticalConfig.ctaTextEn,
    };
  };

  const text = getText();

  const handleSuccess = () => {
    setIsOpen(false);
  };

  // Compact button variant
  if (variant === 'compact') {
    return (
      <>
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(true)}
          className={cn("w-full", className)}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {text.button}
        </Button>

        <CTASheet
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          vertical={vertical}
          entryPoint={location.pathname}
          preselectedRequestType={preselectedRequestType}
          onSuccess={handleSuccess}
          isRu={isRu}
        />
      </>
    );
  }

  // Inline text link variant
  if (variant === 'inline') {
    return (
      <>
        <Button 
          variant="link" 
          onClick={() => setIsOpen(true)}
          className={cn("p-0 h-auto", className)}
        >
          {text.button}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>

        <CTASheet
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          vertical={vertical}
          entryPoint={location.pathname}
          preselectedRequestType={preselectedRequestType}
          onSuccess={handleSuccess}
          isRu={isRu}
        />
      </>
    );
  }

  // Card variant for empty states
  if (variant === 'card') {
    return (
      <>
        <Card className={cn("border-dashed", className)}>
          <CardContent className="py-8 text-center">
            {(() => { const Icon = resolveIcon(verticalConfig.icon); return <Icon className="w-10 h-10 text-primary mb-4 mx-auto" />; })()}
            <h3 className="font-semibold mb-2">{text.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{text.subtitle}</p>
            <Button onClick={() => setIsOpen(true)}>
              {text.button}
            </Button>
          </CardContent>
        </Card>

        <CTASheet
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          vertical={vertical}
          entryPoint={location.pathname}
          preselectedRequestType={preselectedRequestType}
          onSuccess={handleSuccess}
          isRu={isRu}
        />
      </>
    );
  }

  // Banner variant (default)
  const content = (
    <Card className={cn(
      "border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden",
      variant === 'sticky' && "shadow-lg shadow-primary/10",
      className
    )}>
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Avatar/Icon */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center border-2 border-primary/30">
              {(() => { const Icon = resolveIcon(verticalConfig.icon); return <Icon className="w-7 h-7 text-primary" />; })()}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success rounded-full border-2 border-background flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-0.5">
              {text.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {text.subtitle}
            </p>
          </div>
          
          <Button 
            size="sm"
            onClick={() => setIsOpen(true)}
            className="flex-shrink-0 relative overflow-hidden group"
          >
            <span className="absolute inset-0 rounded-none animate-ping bg-primary/30 opacity-75" style={{ animationDuration: '2s' }} />
            <span className="relative flex items-center">
              {text.button}
              <ArrowRight className="w-4 h-4 ml-1 transition-transform" />
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {variant === 'sticky' ? (
        <div className="fixed bottom-[calc(var(--bottom-nav-h)+1rem)] left-4 right-4 z-40 animate-fade-in-up">
          {content}
        </div>
      ) : (
        content
      )}

      <CTASheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        vertical={vertical}
        entryPoint={location.pathname}
        preselectedRequestType={preselectedRequestType}
        onSuccess={handleSuccess}
        isRu={isRu}
      />
    </>
  );
}

// Reusable sheet component
function CTASheet({
  isOpen,
  setIsOpen,
  vertical,
  entryPoint,
  preselectedRequestType,
  onSuccess,
  isRu,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  vertical: string;
  entryPoint: string;
  preselectedRequestType?: string;
  onSuccess: () => void;
  isRu: boolean;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-none px-0"
      >
        <SheetHeader className="px-6 pb-4 border-b">
          <SheetTitle>
            {isRu ? 'Оставить заявку' : 'Submit Request'}
          </SheetTitle>
          <SheetDescription>
            {isRu ? 'Заполните форму и мы свяжемся с вами' : 'Fill out the form and we will contact you'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="p-6">
            <UniversalLeadForm
              verticalId={vertical}
              leadSource="cta"
              entryPoint={entryPoint}
              preselectedRequestType={preselectedRequestType}
              onSuccess={onSuccess}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
