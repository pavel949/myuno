import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, Shield, Globe, Users } from 'lucide-react';

export function GuideCover() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center text-center p-8 print:min-h-[100vh] print:p-12">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-none flex items-center justify-center shadow-gold">
          <span className="text-4xl font-bold text-primary-foreground">U</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary print:text-foreground">
        {isRu ? 'myUNO' : 'myUNO'}
      </h1>
      
      <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-foreground">
        {isRu ? 'Руководство для собственников недвижимости' : 'Property Owner Guide'}
      </h2>

      <p className="text-lg text-muted-foreground max-w-xl mb-12">
        {isRu 
          ? 'Полное руководство по управлению недвижимостью в экосистеме myUNO'
          : 'Complete guide to property management in the myUNO ecosystem'
        }
      </p>

      {/* Key Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mb-12">
        <FeatureIcon 
          icon={Building2} 
          label={isRu ? 'Управление объектами' : 'Property Management'} 
        />
        <FeatureIcon 
          icon={Shield} 
          label={isRu ? 'Гарантии G-Trust' : 'G-Trust Guarantee'} 
        />
        <FeatureIcon 
          icon={Globe} 
          label={isRu ? 'Синхронизация OTA' : 'OTA Sync'} 
        />
        <FeatureIcon 
          icon={Users} 
          label={isRu ? 'Команда на месте' : 'On-ground Team'} 
        />
      </div>

      {/* Version & Date */}
      <div className="text-sm text-muted-foreground">
        <p>{isRu ? 'Версия 2.0' : 'Version 2.0'}</p>
        <p>{isRu ? 'Январь 2025' : 'January 2025'}</p>
      </div>

      {/* Tagline */}
      <div className="mt-8 py-4 px-6 bg-primary/10 rounded-none border border-primary/20">
        <p className="text-primary font-medium italic">
          {isRu 
            ? '«Чувствуйте себя дома — где бы вы ни были»'
            : '"Feel at home — wherever you are"'
          }
        </p>
      </div>
    </div>
  );
}

function FeatureIcon({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-none bg-secondary flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}
