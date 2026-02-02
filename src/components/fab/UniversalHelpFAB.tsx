import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Phone, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getLeadVerticalsSorted, 
  detectVerticalFromPath,
  LeadVerticalConfig 
} from '@/lib/leadVerticalConfig';
import { UniversalLeadForm } from '@/components/leads/UniversalLeadForm';

interface UniversalHelpFABProps {
  className?: string;
}

export function UniversalHelpFAB({ className }: UniversalHelpFABProps) {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Get sorted verticals with context-aware ordering
  const verticals = getLeadVerticalsSorted();
  const detectedVertical = detectVerticalFromPath(location.pathname);

  // Move detected vertical to top if found
  const sortedVerticals = React.useMemo(() => {
    if (!detectedVertical) return verticals;
    
    const detected = verticals.find(v => v.id === detectedVertical);
    if (!detected) return verticals;
    
    return [detected, ...verticals.filter(v => v.id !== detectedVertical)];
  }, [verticals, detectedVertical]);

  // Hide FAB on admin pages
  const isAdminPage = location.pathname.startsWith('/admin');
  if (isAdminPage) return null;

  const handleVerticalSelect = (verticalId: string) => {
    setSelectedVertical(verticalId);
    setShowForm(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedVertical(null);
    setShowForm(false);
  };

  const handleBack = () => {
    setShowForm(false);
    setSelectedVertical(null);
  };

  const handleSuccess = () => {
    handleClose();
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className={cn(
          "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90",
          "animate-in fade-in slide-in-from-bottom-4 duration-300",
          className
        )}
        aria-label={isRu ? 'Нужна помощь?' : 'Need help?'}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Help Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-3xl px-0"
        >
          <SheetHeader className="px-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>
                  {showForm && selectedVertical 
                    ? (isRu ? 'Оставить заявку' : 'Submit Request')
                    : (isRu ? 'Чем можем помочь?' : 'How can we help?')
                  }
                </SheetTitle>
                <SheetDescription>
                  {showForm 
                    ? (isRu ? 'Заполните форму и мы свяжемся с вами' : 'Fill out the form and we will contact you')
                    : (isRu ? 'Выберите, что вас интересует' : 'Choose what interests you')
                  }
                </SheetDescription>
              </div>
              {showForm && (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  {isRu ? 'Назад' : 'Back'}
                </Button>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100%-80px)]">
            {!showForm ? (
              <div className="p-4 space-y-2">
                {/* Suggested vertical banner if detected */}
                {detectedVertical && (
                  <div className="mb-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">
                      {isRu ? 'Возможно, вам нужно:' : 'You might be looking for:'}
                    </p>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto py-2 px-3 hover:bg-primary/10"
                      onClick={() => handleVerticalSelect(detectedVertical)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {sortedVerticals.find(v => v.id === detectedVertical)?.icon}
                        </span>
                        <div className="text-left">
                          <div className="font-medium">
                            {isRu 
                              ? sortedVerticals.find(v => v.id === detectedVertical)?.nameRu
                              : sortedVerticals.find(v => v.id === detectedVertical)?.nameEn
                            }
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                )}

                {/* All verticals list */}
                <div className="space-y-1">
                  {sortedVerticals
                    .filter(v => v.id !== detectedVertical) // Don't duplicate detected
                    .map((vertical) => (
                      <VerticalOption
                        key={vertical.id}
                        vertical={vertical}
                        isRu={isRu}
                        onClick={() => handleVerticalSelect(vertical.id)}
                      />
                    ))}
                </div>

                {/* Quick actions */}
                <div className="mt-6 pt-4 border-t space-y-2">
                  <p className="text-xs text-muted-foreground px-2 mb-2">
                    {isRu ? 'Или свяжитесь напрямую:' : 'Or contact us directly:'}
                  </p>
                <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        window.open('https://wa.me/66922407355', '_blank');
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        window.open('tel:+66922407355', '_blank');
                      }}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {isRu ? 'Позвонить' : 'Call'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                {selectedVertical && (
                  <UniversalLeadForm
                    verticalId={selectedVertical}
                    leadSource="fab"
                    entryPoint={location.pathname}
                    onSuccess={handleSuccess}
                    onCancel={handleBack}
                  />
                )}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Vertical option component
function VerticalOption({ 
  vertical, 
  isRu, 
  onClick 
}: { 
  vertical: LeadVerticalConfig; 
  isRu: boolean; 
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-between h-auto py-3 px-3 hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{vertical.icon}</span>
        <div className="text-left">
          <div className="font-medium text-sm">
            {isRu ? vertical.nameRu : vertical.nameEn}
          </div>
          <div className="text-xs text-muted-foreground">
            {isRu ? vertical.shortDescRu : vertical.shortDescEn}
          </div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}
