import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MapPin, Calendar, TrendingUp, DollarSign, Layers, Sparkles, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { usePublicInvestmentDeal } from '@/hooks/investment-hub/useInvestmentDeals';
import { InvestorInterestModal } from '@/components/invest/InvestorInterestModal';
import {
  getCategoryLabel, getIntentLabel, getCapitalRangeLabel,
} from '@/lib/investment/dealTaxonomy';
import { APP_ROUTES } from '@/lib/config/routes';
import { AppLayout } from '@/components/layout/AppLayout';

export default function InvestmentDealPublicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: deal, isLoading } = usePublicInvestmentDeal(id);
  const [showInterest, setShowInterest] = useState(false);

  if (isLoading) {
    return (
      <AppLayout showHeader={false} showBottomNav usePageContainer={false}>
        <div className="container max-w-3xl mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full rounded-none" />
          <Skeleton className="h-32 w-full rounded-none" />
        </div>
      </AppLayout>
    );
  }

  if (!deal) {
    return (
      <AppLayout showHeader={false} showBottomNav usePageContainer={false}>
        <div className="container max-w-3xl mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Deal not found</h1>
          <p className="text-muted-foreground mb-4">This opportunity may have been delisted or moved.</p>
          <Button onClick={() => navigate(APP_ROUTES.INVEST_DEALS_BOARD)}>Browse all opportunities</Button>
        </div>
      </AppLayout>
    );
  }

  const intentLabel = getIntentLabel(deal.deal_intent, 'en');
  const categoryLabel = getCategoryLabel(deal.category, 'en');
  const rangeLabel = getCapitalRangeLabel(deal.capital_range);

  return (
    <AppLayout showHeader={false} showBottomNav usePageContainer={false}>
      <Helmet>
        <title>{`${categoryLabel} — ${rangeLabel} | myUNO Capital`}</title>
        <meta
          name="description"
          content={deal.teaser_public ?? `Anonymized investment opportunity in ${deal.location_display ?? 'Thailand'}`}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl mx-auto p-4 space-y-5 pb-24">
          {/* Back */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(APP_ROUTES.INVEST_DEALS_BOARD)}
            className="gap-1.5 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            All opportunities
          </Button>

          {/* Hero */}
          <Card className="overflow-hidden border-success/40 bg-gradient-to-br from-success/5 via-background to-primary/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-success/10 text-success dark:text-success border-success/40">
                  {categoryLabel}
                </Badge>
                <Badge variant="outline">{intentLabel}</Badge>
                {deal.deal_stage && (
                  <Badge variant="secondary" className="capitalize">
                    {deal.deal_stage.replace('_', ' ')}
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight">{rangeLabel}</h1>
                </div>
                {deal.location_display && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {deal.location_display}
                  </div>
                )}
              </div>

              {deal.teaser_public && (
                <p className="text-base leading-relaxed text-foreground/90">{deal.teaser_public}</p>
              )}

              <Button
                size="lg"
                onClick={() => setShowInterest(true)}
                className="w-full bg-success hover:bg-success text-white gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Express interest
              </Button>
            </CardContent>
          </Card>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {deal.deal_structure && (
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" /> Structure
                  </div>
                  <div className="font-semibold capitalize text-sm">{deal.deal_structure}</div>
                </CardContent>
              </Card>
            )}
            {deal.target_timeline_months && (
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> Timeline
                  </div>
                  <div className="font-semibold text-sm">{deal.target_timeline_months} months</div>
                </CardContent>
              </Card>
            )}
            {deal.expected_irr != null && (
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" /> Target IRR
                  </div>
                  <div className="font-semibold text-sm">{Number(deal.expected_irr).toFixed(1)}%</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Description */}
          {deal.description_public && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="font-bold text-lg">About this opportunity</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                  {deal.description_public}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Anonymity disclosure */}
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="p-4 flex gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-sm">All opportunities are anonymized</div>
                <p className="text-xs text-muted-foreground">
                  Identifying details (company name, exact address, financials) are shared only after
                  myUNO qualifies your interest. All communication runs through our team — we never
                  auto-connect parties.
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Secondary CTA */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Have a similar opportunity to list?</p>
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.INVEST_SUBMIT)} className="gap-2">
              Submit your opportunity
            </Button>
          </div>
        </div>

        <InvestorInterestModal
          open={showInterest}
          onOpenChange={setShowInterest}
          dealId={deal.id}
          dealTitle={`${categoryLabel} — ${rangeLabel}`}
        />
      </div>
    </AppLayout>
  );
}
