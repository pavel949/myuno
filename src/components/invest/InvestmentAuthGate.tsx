import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InvestmentAuthForm } from './InvestmentAuthForm';
import { TrendingUp, Shield, FileText, BarChart3, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvestmentAuthGateProps {
  children: React.ReactNode;
}

export function InvestmentAuthGate({ children }: InvestmentAuthGateProps) {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthDialog(true);
    } else if (user) {
      setShowAuthDialog(false);
    }
  }, [user, isLoading]);

  const handleBack = () => {
    navigate('/');
  };

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
  };

  const features = [
    {
      icon: Shield,
      textEn: 'Independent expert analysis of opportunities and risks',
      textRu: 'Независимый экспертный анализ возможностей и рисков',
    },
    {
      icon: BarChart3,
      textEn: 'muUNO Scoring™ — objective project rating',
      textRu: 'muUNO Scoring™ — объективная оценка проектов',
    },
    {
      icon: FileText,
      textEn: 'Due Diligence reports and documentation',
      textRu: 'Due Diligence материалы и документация',
    },
    {
      icon: CheckCircle2,
      textEn: 'Access to exclusive investment deals',
      textRu: 'Доступ к эксклюзивным инвестиционным сделкам',
    },
  ];

  return (
    <>
      {/* Content with blur when not authenticated */}
      <div className={cn(
        "transition-all duration-300",
        !user && !isLoading && "blur-sm pointer-events-none select-none"
      )}>
        {children}
      </div>

      {/* Auth Dialog - cannot be closed without authentication */}
      <Dialog 
        open={showAuthDialog} 
        onOpenChange={(open) => {
          // Only allow closing if user is authenticated
          if (!open && !user) {
            return;
          }
          setShowAuthDialog(open);
        }}
      >
        <DialogContent 
          className="max-w-md max-h-[90vh] overflow-y-auto"
          hideCloseButton={!user}
          onPointerDownOutside={(e) => {
            if (!user) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (!user) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-emerald-500 to-teal-600"
              )}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {isRu ? 'Инвестиционный анализ' : 'Investment Analysis'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isRu ? 'Профессиональная экспертиза muUNO' : 'Professional muUNO expertise'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Features list */}
          <div className="space-y-2 py-3 border-y border-border">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <feature.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {isRu ? feature.textRu : feature.textEn}
                </span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center py-2">
            {isRu 
              ? 'Для просмотра материалов требуется регистрация'
              : 'Registration is required to access materials'
            }
          </p>

          {/* Auth Form */}
          <InvestmentAuthForm 
            onSuccess={handleAuthSuccess}
            onBack={handleBack}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
