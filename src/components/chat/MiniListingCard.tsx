import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import type { ChatListingPayload } from '@/types/chatWidget';

const labels: Record<string, { book: string }> = {
  ru: { book: 'Забронировать' },
  en: { book: 'Book' },
  zh: { book: '预订' },
  de: { book: 'Buchen' },
  th: { book: 'จอง' },
};

interface Props {
  listing: ChatListingPayload;
  chatLang: string;
  className?: string;
}

export function MiniListingCard({ listing, chatLang, className }: Props) {
  const L = labels[chatLang] ?? labels.en;
  const img =
    listing.imageUrl || listing.image_url || listing.thumbnail_url || null;
  const [imgFailed, setImgFailed] = useState(false);
  const price = listing.price != null ? Number(listing.price) : null;
  const currency = listing.currency || 'THB';

  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-background/95 overflow-hidden shadow-sm max-w-[280px]',
        className,
      )}
    >
      <div className="aspect-[16/10] bg-muted relative flex items-center justify-center">
        {img && !imgFailed ? (
          <img
            src={img}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Building2 className="h-10 w-10 text-muted-foreground/50" aria-hidden />
        )}
      </div>
      <div className="p-2.5 space-y-2">
        <p className="text-sm font-medium line-clamp-2 leading-snug">{listing.title}</p>
        {price != null && !Number.isNaN(price) && (
          <p className="text-xs text-muted-foreground">
            {currency === 'THB' ? `฿ ${price.toLocaleString()}` : `${price.toLocaleString()} ${currency}`}
          </p>
        )}
        <Button asChild size="sm" className="w-full gradient-gold text-primary-foreground border-0">
          <Link to={APP_ROUTES.PROPERTY_DETAIL(listing.id)}>{L.book}</Link>
        </Button>
      </div>
    </div>
  );
}
