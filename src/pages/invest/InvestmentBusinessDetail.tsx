import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBusinessListing, BUSINESS_ASSET_CLASSES, LISTING_TYPE_LABELS } from '@/hooks/useBusinessListings';
import { MiniAppLayout } from '@/components/miniapp';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CapitalIntroForm } from '@/components/invest/CapitalIntroForm';
import { Lock, MapPin, TrendingUp, Users, FileText, Calendar, ArrowLeft, MessageSquare } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

function fmtBand(amount: number | null, currency = 'THB'): string {
  if (!amount) return '—';
  const cur = currency === 'THB' ? '฿' : currency;
  if (amount < 5_000_000) return `${cur} <5M`;
  if (amount < 20_000_000) return `${cur} 5–20M`;
  if (amount < 100_000_000) return `${cur} 20–100M`;
  return `${cur} 100M+`;
}

export default function InvestmentBusinessDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: listing, isLoading } = useBusinessListing(slug);

  if (isLoading) {
    return (
      <MiniAppLayout title={isRu ? 'Загрузка...' : 'Loading...'} showSearch={false}>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-none" />
          <Skeleton className="h-32 rounded-none" />
        </div>
      </MiniAppLayout>
    );
  }

  if (!listing) {
    return (
      <MiniAppLayout title={isRu ? 'Не найдено' : 'Not found'} showSearch={false}>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-muted-foreground">
              {isRu ? 'Объявление не найдено или снято с публикации.' : 'Listing not found or unpublished.'}
            </p>
            <Button onClick={() => navigate(APP_ROUTES.INVEST_BUSINESS)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isRu ? 'К каталогу' : 'Back to catalog'}
            </Button>
          </CardContent>
        </Card>
      </MiniAppLayout>
    );
  }

  const assetMeta = BUSINESS_ASSET_CLASSES.find((a) => a.key === listing.asset_class);
  const assetLabel = assetMeta ? (isRu ? assetMeta.ru : assetMeta.en) : listing.asset_class;
  const typeLabel = LISTING_TYPE_LABELS[listing.listing_type];
  const title = isRu ? listing.title_ru : listing.title_en;
  const teaser = isRu ? listing.teaser_ru : listing.teaser_en;

  return (
    <>
      <Helmet>
        <title>{title} | myUNO Invest</title>
        {teaser && <meta name="description" content={teaser} />}
      </Helmet>
      <MiniAppLayout title={isRu ? 'Объявление' : 'Listing'} showSearch={false}>
        <div className="space-y-4 pb-10">
          {/* Hero */}
          <div className="relative h-44 rounded-none bg-gradient-to-br from-primary/20 via-accent/10 to-muted/20 flex items-center justify-center overflow-hidden">
            <span className="text-7xl opacity-80">{assetMeta?.icon ?? '💼'}</span>
            <Badge variant="secondary" className="absolute top-3 right-3 gap-1">
              <Lock className="h-3 w-3" /> {isRu ? 'Анонимно' : 'Anonymous'}
            </Badge>
            <Badge className="absolute top-3 left-3">
              {isRu ? typeLabel.ru : typeLabel.en}
            </Badge>
          </div>

          {/* Title block */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>{assetMeta?.icon}</span>
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
            <h1 className="text-xl font-bold leading-tight">{title}</h1>
            {teaser && <p className="text-sm text-muted-foreground mt-2">{teaser}</p>}
          </div>

          {/* Key metrics (anonymized bands) */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{isRu ? 'Объём' : 'Ticket'}</div>
                <div className="font-mono font-bold text-lg">
                  {fmtBand(listing.ask_amount, listing.currency ?? 'THB')}
                </div>
              </CardContent>
            </Card>
            {listing.equity_offered_pct != null && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">{isRu ? 'Доля' : 'Equity'}</div>
                  <div className="font-mono font-bold text-lg flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {listing.equity_offered_pct}%
                  </div>
                </CardContent>
              </Card>
            )}
            {listing.monthly_revenue != null && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">
                    {isRu ? 'Выручка/мес' : 'Monthly revenue'}
                  </div>
                  <div className="font-mono font-bold text-lg">
                    {fmtBand(listing.monthly_revenue, listing.currency ?? 'THB')}
                  </div>
                </CardContent>
              </Card>
            )}
            {listing.staff_count != null && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">{isRu ? 'Команда' : 'Staff'}</div>
                  <div className="font-mono font-bold text-lg flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary" />
                    {listing.staff_count}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gated full description */}
          <Card className="border-dashed border-primary/30 bg-primary/5">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">
                  {isRu ? 'Полная информация после интро' : 'Full details after intro'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Финансовая модель, точное местоположение, контакты владельца и причина продажи доступны после согласования NDA и одобрения интро нашей командой.'
                  : 'Financials, exact location, owner contacts and reason for sale unlock after NDA + our team-approved intro.'}
              </p>

              <div className="flex flex-wrap gap-2 text-xs">
                {listing.lease_remaining_months != null && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {isRu ? 'Аренда' : 'Lease'}: {listing.lease_remaining_months} {isRu ? 'мес' : 'mo'}
                  </Badge>
                )}
                {listing.license_status && (
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3 w-3" /> {listing.license_status}
                  </Badge>
                )}
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {isRu ? 'Запросить интро' : 'Request intro'}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>
                      {isRu ? 'Запросить детали по объекту' : 'Request listing intro'}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <CapitalIntroForm
                      defaults={{
                        request_type: 'intro_to_listing',
                        listing_id: listing.id,
                        asset_class: listing.asset_class,
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>

          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> {isRu ? 'Назад' : 'Back'}
          </Button>
        </div>
      </MiniAppLayout>
    </>
  );
}
