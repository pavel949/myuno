import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, MapPin, TrendingUp, Eye, ArrowRight } from 'lucide-react';
import {
  BUSINESS_ASSET_CLASSES,
  LISTING_TYPE_LABELS,
  type BusinessListing,
} from '@/hooks/useBusinessListings';

interface Props {
  listing: BusinessListing;
}

function formatRange(amount: number | null, currency = 'THB'): string {
  if (!amount) return '—';
  const cur = currency === 'THB' ? '฿' : currency;
  // Render a fuzzy band, not the exact ask, to preserve anonymity
  if (amount < 5_000_000) return `${cur} <5M`;
  if (amount < 20_000_000) return `${cur} 5–20M`;
  if (amount < 100_000_000) return `${cur} 20–100M`;
  return `${cur} 100M+`;
}

export function AnonymizedListingCard({ listing }: Props) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const assetMeta = BUSINESS_ASSET_CLASSES.find((a) => a.key === listing.asset_class);
  const assetLabel = assetMeta ? (isRu ? assetMeta.ru : assetMeta.en) : listing.asset_class;
  const typeLabel = LISTING_TYPE_LABELS[listing.listing_type];
  const teaser = isRu ? listing.teaser_ru : listing.teaser_en;
  const title = isRu ? listing.title_ru : listing.title_en;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
      <div
        className="relative h-32 bg-gradient-to-br from-primary/15 via-accent/10 to-muted/20 flex items-center justify-center"
        onClick={() => navigate(`/invest/business/${listing.slug}`)}
      >
        <span className="text-5xl opacity-80">{assetMeta?.icon ?? '💼'}</span>
        {listing.is_anonymized && (
          <Badge variant="secondary" className="absolute top-2 right-2 gap-1">
            <Lock className="h-3 w-3" /> {isRu ? 'Анонимно' : 'Anonymous'}
          </Badge>
        )}
        <Badge
          variant="outline"
          className="absolute top-2 left-2 bg-background/80 text-[10px]"
        >
          {isRu ? typeLabel.ru : typeLabel.en}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>{assetLabel}</span>
            {listing.location_district && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {listing.location_district}
                </span>
              </>
            )}
          </div>
          <h3 className="font-semibold leading-tight line-clamp-2">{title}</h3>
        </div>

        {teaser && (
          <p className="text-sm text-muted-foreground line-clamp-2">{teaser}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {listing.listing_type === 'developer_raise' ||
              listing.listing_type === 'startup_pitch' ||
              listing.listing_type === 'operating_partner_wanted'
                ? isRu
                  ? 'Привлекают'
                  : 'Raising'
                : isRu
                ? 'Цена'
                : 'Ask'}
            </div>
            <div className="font-mono font-bold text-sm">
              {formatRange(listing.ask_amount, listing.currency ?? 'THB')}
            </div>
          </div>
          {listing.equity_offered_pct != null && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {isRu ? 'Доля' : 'Equity'}
              </div>
              <div className="font-mono font-bold text-sm flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                {listing.equity_offered_pct}%
              </div>
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5"
          onClick={() => navigate(`/invest/business/${listing.slug}`)}
        >
          <Eye className="h-3.5 w-3.5" />
          {isRu ? 'Запросить детали' : 'Request details'}
          <ArrowRight className="h-3.5 w-3.5 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}
