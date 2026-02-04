/**
 * VerticalShowcaseSection - Hero blocks for premium verticals
 * Visual showcase cards for Yachts, Property, Beauty, etc.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconBadge } from '@/components/ui/IconBadge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronRight, Star, Users, Shield, Sparkles } from 'lucide-react';

interface VerticalShowcase {
  id: string;
  icon: string;
  nameEn: string;
  nameRu: string;
  taglineEn: string;
  taglineRu: string;
  path: string;
  gradient: string;
  bgImage?: string;
  stats: {
    count: number;
    labelEn: string;
    labelRu: string;
  };
  badges: string[];
}

const SHOWCASES: VerticalShowcase[] = [
  {
    id: 'yachts',
    icon: '🛥️',
    nameEn: 'Luxury Yachts',
    nameRu: 'Яхты класса люкс',
    taglineEn: 'Charter the perfect vessel',
    taglineRu: 'Чартер идеальной яхты',
    path: '/yachts',
    gradient: 'from-blue-600 via-cyan-500 to-blue-400',
    stats: { count: 150, labelEn: 'vessels', labelRu: 'яхт' },
    badges: ['Premium', 'Verified Captains'],
  },
  {
    id: 'property',
    icon: '🏠',
    nameEn: 'Property',
    nameRu: 'Недвижимость',
    taglineEn: 'Rent, buy or invest in Phuket',
    taglineRu: 'Аренда, покупка, инвестиции',
    path: '/property',
    gradient: 'from-emerald-600 via-green-500 to-emerald-400',
    stats: { count: 2500, labelEn: 'listings', labelRu: 'объектов' },
    badges: ['Verified', 'Legal Support'],
  },
  {
    id: 'beauty',
    icon: '💅',
    nameEn: 'Beauty & Spa',
    nameRu: 'Красота и SPA',
    taglineEn: 'Top salons and wellness centers',
    taglineRu: 'Лучшие салоны и SPA',
    path: '/salons',
    gradient: 'from-pink-600 via-purple-500 to-pink-400',
    stats: { count: 320, labelEn: 'salons', labelRu: 'салонов' },
    badges: ['Licensed', 'Booking'],
  },
];

export function VerticalShowcaseSection() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <section className="px-4 py-3 space-y-3">
      <h2 className="font-bold text-foreground flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        {isRu ? 'Премиум услуги' : 'Premium Services'}
      </h2>
      
      <div className="space-y-3">
        {SHOWCASES.map((showcase) => (
          <ShowcaseCard 
            key={showcase.id} 
            showcase={showcase} 
            isRu={isRu}
            onClick={() => navigate(showcase.path)}
          />
        ))}
      </div>
    </section>
  );
}

interface ShowcaseCardProps {
  showcase: VerticalShowcase;
  isRu: boolean;
  onClick: () => void;
}

function ShowcaseCard({ showcase, isRu, onClick }: ShowcaseCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full h-[120px] rounded-2xl overflow-hidden",
        "bg-gradient-to-r",
        showcase.gradient,
        "shadow-lg hover:shadow-xl transition-all duration-300",
        "hover:scale-[1.02] active:scale-[0.98]",
        "text-left group"
      )}
    >
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(0,0,0,0.1),transparent_50%)]" />
      
      {/* Content */}
      <div className="relative h-full p-4 flex flex-col justify-between">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-2xl">{showcase.icon}</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">
                {isRu ? showcase.nameRu : showcase.nameEn}
              </h3>
              <p className="text-white/80 text-xs">
                {isRu ? showcase.taglineRu : showcase.taglineEn}
              </p>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>
        
        {/* Bottom row */}
        <div className="flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-1.5">
            <span className="text-white font-bold text-lg">
              {showcase.stats.count.toLocaleString()}+
            </span>
            <span className="text-white/70 text-xs">
              {isRu ? showcase.stats.labelRu : showcase.stats.labelEn}
            </span>
          </div>
          
          {/* Badges */}
          <div className="flex gap-1.5">
            {showcase.badges.map((badge, idx) => (
              <Badge 
                key={idx}
                className="bg-white/20 text-white text-[10px] backdrop-blur-sm border-0"
              >
                {idx === 0 && <Shield className="w-2.5 h-2.5 mr-0.5" />}
                {badge}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
