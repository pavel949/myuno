import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserListing, CONDITION_LABELS } from '@/types/userListing';
import { MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ClassifiedCardProps {
  listing: UserListing;
  onClick: () => void;
}

export function ClassifiedCard({ listing, onClick }: ClassifiedCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const title = (isRu && listing.title_ru) ? listing.title_ru : listing.title_en;
  const conditionLabel = CONDITION_LABELS[listing.condition]?.[isRu ? 'ru' : 'en'] || listing.condition;
  
  const timeAgo = formatDistanceToNow(new Date(listing.created_at), {
    addSuffix: true,
    locale: isRu ? ru : undefined,
  });

  return (
    <button
      onClick={onClick}
      className="text-left rounded-none overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-shadow w-full"
    >
      {/* Image */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        {listing.cover_image ? (
          <img
            src={listing.cover_image}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground/30">
            📷
          </div>
        )}
        {/* Condition badge */}
        {listing.condition !== 'good' && (
          <span className="absolute top-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground">
            {conditionLabel}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="font-semibold text-sm text-foreground truncate">{title}</p>
        
        <p className="text-base font-bold text-primary mt-0.5">
          {listing.price.toLocaleString()} {listing.currency}
          {listing.is_negotiable && (
            <span className="text-[10px] font-normal text-muted-foreground ml-1">
              {isRu ? 'торг' : 'negotiable'}
            </span>
          )}
        </p>

        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
          {listing.location && (
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {listing.location}
            </span>
          )}
          <span className="flex items-center gap-0.5 shrink-0">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
        </div>
      </div>
    </button>
  );
}
