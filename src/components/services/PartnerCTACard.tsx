/**
 * PartnerCTACard - Call-to-action for attracting new service providers
 * Prominent card to encourage listings
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  Users, 
  Shield, 
  ChevronRight,
  Zap,
  BadgeCheck,
  Calendar,
} from 'lucide-react';

export function PartnerCTACard() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const benefits = [
    {
      icon: Users,
      labelEn: '50K+ monthly users',
      labelRu: '50K+ пользователей',
    },
    {
      icon: Shield,
      labelEn: 'Verified badge',
      labelRu: 'Verified статус',
    },
    {
      icon: Calendar,
      labelEn: 'Online booking',
      labelRu: 'Онлайн-запись',
    },
  ];

  return (
    <section className="px-4 py-3">
      <button
        onClick={() => navigate('/become-partner')}
        className={cn(
          "relative w-full rounded-2xl overflow-hidden",
          "bg-gradient-to-br from-primary via-primary/90 to-accent",
          "p-5 text-left",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          "hover:scale-[1.01] active:scale-[0.99]",
          "group"
        )}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {isRu ? 'Развивайте бизнес' : 'Grow Your Business'}
                  </h3>
                  <p className="text-white/80 text-xs">
                    {isRu ? 'Станьте партнёром myUNO' : 'Become a myUNO partner'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-white/80 group-hover:text-white transition-colors">
              <span className="text-sm font-medium">
                {isRu ? 'Начать' : 'Start'}
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          
          {/* Benefits */}
          <div className="flex flex-wrap gap-2">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={idx}
                  className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5"
                >
                  <Icon className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-medium">
                    {isRu ? benefit.labelRu : benefit.labelEn}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Bottom CTA */}
          <div className="flex items-center gap-2 pt-1">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-white/90 text-sm">
              {isRu 
                ? 'Бесплатная регистрация • Комиссия от 5%' 
                : 'Free registration • Commission from 5%'
              }
            </span>
          </div>
        </div>
      </button>
    </section>
  );
}
