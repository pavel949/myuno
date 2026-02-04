/**
 * OffplanCTASection - CTA block for promoting offplan/new development properties
 * Appears at bottom of property search page with links to investment hub
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, TrendingUp, ShieldCheck, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UniversalLeadForm } from '@/components/leads/UniversalLeadForm';

interface OffplanCTASectionProps {
  className?: string;
}

export function OffplanCTASection({ className }: OffplanCTASectionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [showLeadForm, setShowLeadForm] = useState(false);

  const features = [
    {
      icon: TrendingUp,
      title: isRu ? 'Узнать реальную доходность' : 'Check Real ROI',
      description: isRu ? 'Независимая аналитика muUNO' : 'Independent muUNO analytics',
      action: () => navigate('/invest'),
    },
    {
      icon: ShieldCheck,
      title: isRu ? 'Проверить риски застройщика' : 'Verify Developer Risks',
      description: isRu ? 'Скоринг надёжности проектов' : 'Project reliability scoring',
      action: () => navigate('/offplan'),
    },
    {
      icon: MessageCircle,
      title: isRu ? 'Получить экспертную консультацию' : 'Get Expert Consultation',
      description: isRu ? 'Бесплатно, без обязательств' : 'Free, no obligations',
      action: () => setShowLeadForm(true),
    },
  ];

  return (
    <>
      <section
        className={cn(
          "rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/10 border border-border/50 p-5",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base flex items-center gap-2">
              {isRu ? 'Интересуют новостройки Пхукета?' : 'Interested in Phuket New Developments?'}
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRu 
                ? 'Проверьте надёжность проекта с экспертизой muUNO' 
                : 'Verify project reliability with muUNO expertise'}
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-3 mb-5">
          {features.map((feature, index) => (
            <button
              key={index}
              onClick={feature.action}
              className="flex items-center gap-3 p-3 rounded-xl bg-background/80 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/offplan')}
            className="flex-1 gap-2"
          >
            <Building2 className="w-4 h-4" />
            {isRu ? 'Смотреть новостройки' : 'View New Developments'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowLeadForm(true)}
            className="flex-1 gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {isRu ? 'Помочь подобрать' : 'Help Me Choose'}
          </Button>
        </div>
      </section>

      {/* Lead Form Dialog */}
      <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Консультация по новостройкам' : 'New Development Consultation'}
            </DialogTitle>
          </DialogHeader>
          <UniversalLeadForm
            verticalId="property"
            entryPoint="offplan_cta"
            leadSource="cta"
            onSuccess={() => setShowLeadForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OffplanCTASection;
