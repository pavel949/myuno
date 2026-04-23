import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { ArrowLeft, MapPin, Sparkles, TrendingUp, Filter } from 'lucide-react';
import {
  CAPITAL_RANGES, DEAL_INTENTS, DEAL_CATEGORIES,
  getCategoryLabel, getIntentLabel, getCapitalRangeLabel,
  type DealIntent, type CapitalRangeKey,
} from '@/lib/investment/dealTaxonomy';
import { usePublicInvestmentDeals, type InvestmentDealPublic } from '@/hooks/investment-hub/useInvestmentDeals';
import { InvestorInterestModal } from '@/components/invest/InvestorInterestModal';
import { APP_ROUTES } from '@/lib/config/routes';

export default function InvestmentDeals() {
  const navigate = useNavigate();
  const [selectedIntent, setSelectedIntent] = useState<DealIntent | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRange, setSelectedRange] = useState<CapitalRangeKey | 'all'>('all');
  const [search, setSearch] = useState('');
  const [interestDeal, setInterestDeal] = useState<InvestmentDealPublic | null>(null);

  const filters = useMemo(() => ({
    intents: selectedIntent === 'all' ? undefined : [selectedIntent],
    categories: selectedCategory === 'all' ? undefined : [selectedCategory],
    ranges: selectedRange === 'all' ? undefined : [selectedRange],
  }), [selectedIntent, selectedCategory, selectedRange]);

  const { data: deals, isLoading } = usePublicInvestmentDeals(filters);

  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    if (!search.trim()) return deals;
    const q = search.toLowerCase();
    return deals.filter((d) =>
      d.teaser_public?.toLowerCase().includes(q) ||
      d.description_public?.toLowerCase().includes(q) ||
      d.location_display?.toLowerCase().includes(q)
    );
  }, [deals, search]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Investment Opportunities Thailand — myUNO Hub</title>
        <meta name="description" content="Curated, anonymized investment opportunities in Thailand: real estate, hospitality, businesses, and ventures. Express interest privately through myUNO." />
      </Helmet>

      {/* Hero */}
      <div className="bg-gradient-to-b from-success/10 via-background to-background border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <button onClick={() => navigate(APP_ROUTES.INVEST)} className="mb-4 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Investment Hub
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-success" />
            <span className="text-sm uppercase tracking-wider text-success font-medium">Curated deals</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Invest in Thailand
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Curated opportunities across real estate, business, and ventures. All deals anonymized — submit interest privately.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => navigate(APP_ROUTES.INVEST_PITCH)} variant="outline">
              Pitch your project
            </Button>
            <Button onClick={() => navigate('/invest/submit')} className="bg-success hover:bg-success">
              Submit opportunity
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6 sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Select value={selectedIntent} onValueChange={(v) => setSelectedIntent(v as DealIntent | 'all')}>
            <SelectTrigger><SelectValue placeholder="Intent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All intents</SelectItem>
              {DEAL_INTENTS.map((i) => <SelectItem key={i.key} value={i.key}>{i.icon} {i.labelEn}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="all">All categories</SelectItem>
              {DEAL_CATEGORIES.map((g) => (
                <SelectGroup key={g.key}>
                  <SelectLabel>{g.labelEn}</SelectLabel>
                  {g.options.map((o) => <SelectItem key={o.key} value={o.key}>{o.labelEn}</SelectItem>)}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRange} onValueChange={(v) => setSelectedRange(v as CapitalRangeKey | 'all')}>
            <SelectTrigger><SelectValue placeholder="Capital range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any size</SelectItem>
              {CAPITAL_RANGES.map((r) => <SelectItem key={r.key} value={r.key}>{r.labelShort}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Search teaser..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Deal grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No opportunities match your filters yet.</p>
            <Button onClick={() => { setSelectedIntent('all'); setSelectedCategory('all'); setSelectedRange('all'); setSearch(''); }} variant="outline">
              Clear filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeals.map((d) => (
              <Card key={d.id} className="p-5 hover:border-success/40/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">{getCategoryLabel(d.category)}</Badge>
                  {d.deal_stage && <Badge variant="secondary" className="text-xs">{d.deal_stage}</Badge>}
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold font-mono text-success">{getCapitalRangeLabel(d.capital_range)}</span>
                  <span className="text-xs text-muted-foreground">{getIntentLabel(d.deal_intent)}</span>
                </div>
                <h3 className="font-semibold mb-2 line-clamp-2">{d.teaser_public ?? '—'}</h3>
                {d.location_display && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <MapPin className="w-3 h-3" /> {d.location_display}
                  </div>
                )}
                {(d.expected_irr || d.target_timeline_months) && (
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                    {d.expected_irr && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> IRR {d.expected_irr}%</span>}
                    {d.target_timeline_months && <span>~{d.target_timeline_months} mo</span>}
                    {d.deal_structure && <span className="capitalize">{d.deal_structure.replace('_', ' ')}</span>}
                  </div>
                )}
                <Button onClick={() => setInterestDeal(d)} className="w-full bg-success hover:bg-success" size="sm">
                  Express interest
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {interestDeal && (
        <InvestorInterestModal
          open={!!interestDeal}
          onOpenChange={(v) => !v && setInterestDeal(null)}
          dealId={interestDeal.id}
          dealTitle={interestDeal.teaser_public ?? undefined}
        />
      )}
    </div>
  );
}
