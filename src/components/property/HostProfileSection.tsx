import React from 'react';
import { Shield, Globe, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PropertyRentalTerms } from '@/hooks/useProperties';

interface HostProfileSectionProps {
  rentalTerms?: PropertyRentalTerms | null;
  isVerified?: boolean;
}

export function HostProfileSection({ rentalTerms, isVerified }: HostProfileSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const hostName = rentalTerms?.manager_name;
  if (!hostName) return null;

  const languages = rentalTerms?.host_languages;
  const initials = hostName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-start gap-4">
      <Avatar className="w-14 h-14 border-2 border-primary/20">
        <AvatarImage src="" />
        <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-lg">
            {isRu ? `Хозяин: ${hostName}` : `Hosted by ${hostName}`}
          </h3>
          {isVerified && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Shield className="w-3 h-3" />
              {isRu ? 'Суперхост' : 'Superhost'}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
          {languages && languages.length > 0 && (
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              {languages.join(', ')}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          {isRu
            ? 'Ваш хозяин позаботится о комфортном проживании и ответит на все вопросы.'
            : 'Your host will ensure a comfortable stay and answer any questions.'}
        </p>
      </div>
    </div>
  );
}
