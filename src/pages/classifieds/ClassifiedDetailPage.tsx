import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { UserListing, CONDITION_LABELS } from '@/types/userListing';
import { CatalogHeader } from '@/components/shared/CatalogHeader';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, MessageCircle, Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ClassifiedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [listing, setListing] = useState<UserListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchListing = async () => {
      const { data } = await supabase
        .from('user_listings')
        .select('*')
        .eq('id', id)
        .single();
      setListing(data as UserListing | null);
      setIsLoading(false);
    };
    fetchListing();
  }, [id]);

  if (isLoading) return <LoadingState />;
  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground">{isRu ? 'Объявление не найдено' : 'Listing not found'}</p>
        <Button variant="link" onClick={() => navigate('/classifieds')}>
          {isRu ? '← Назад' : '← Back'}
        </Button>
      </div>
    );
  }

  const title = (isRu && listing.title_ru) ? listing.title_ru : listing.title_en;
  const description = (isRu && listing.description_ru) ? listing.description_ru : listing.description_en;
  const conditionLabel = CONDITION_LABELS[listing.condition]?.[isRu ? 'ru' : 'en'];
  const allImages = listing.cover_image
    ? [listing.cover_image, ...(listing.images || []).filter(img => img !== listing.cover_image)]
    : listing.images || [];

  const timeAgo = formatDistanceToNow(new Date(listing.created_at), {
    addSuffix: true,
    locale: isRu ? ru : undefined,
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <CatalogHeader title={isRu ? 'Барахолка' : 'Flea Market'} />

      {/* Image Gallery */}
      {allImages.length > 0 ? (
        <div className="relative aspect-square bg-muted">
          <img
            src={allImages[currentImageIndex]}
            alt={title}
            className="w-full h-full object-cover"
          />
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex(i => (i > 0 ? i - 1 : allImages.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/70 flex items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(i => (i < allImages.length - 1 ? i + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/70 flex items-center justify-center"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${i === currentImageIndex ? 'bg-primary' : 'bg-background/60'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center text-5xl text-muted-foreground/30">
          📷
        </div>
      )}

      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* Price & Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {listing.price.toLocaleString()} {listing.currency}
          </h1>
          {listing.is_negotiable && (
            <span className="text-xs text-muted-foreground">
              {isRu ? 'Торг уместен' : 'Price negotiable'}
            </span>
          )}
          <h2 className="text-lg font-medium text-foreground mt-1">{title}</h2>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Tag className="h-3 w-3" />
            {conditionLabel}
          </Badge>
          {listing.location && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              {listing.location}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </Badge>
        </div>

        {/* Description */}
        {description && (
          <div>
            <h3 className="font-semibold text-sm mb-1">{isRu ? 'Описание' : 'Description'}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{description}</p>
          </div>
        )}

        {/* Contact */}
        <div className="space-y-2 pt-2 border-t">
          <h3 className="font-semibold text-sm">{isRu ? 'Связаться' : 'Contact'}</h3>
          <div className="flex gap-2">
            {listing.show_phone && listing.contact_phone && (
              <Button asChild variant="outline" className="flex-1 gap-2">
                <a href={`tel:${listing.contact_phone}`}>
                  <Phone className="h-4 w-4" />
                  {isRu ? 'Позвонить' : 'Call'}
                </a>
              </Button>
            )}
            {listing.contact_whatsapp && (
              <Button asChild className="flex-1 gap-2">
                <a
                  href={`https://wa.me/${listing.contact_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(isRu ? `Здравствуйте! Интересует ваше объявление: ${title}` : `Hi! I'm interested in your listing: ${title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
