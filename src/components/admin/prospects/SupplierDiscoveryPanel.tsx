import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Loader2, CheckCircle2, Globe, Phone, Mail, MapPin, Star, ShieldCheck, ShieldAlert, MessageCircle, Instagram, Facebook } from 'lucide-react';
import { toast } from 'sonner';

const VERTICALS = [
  { value: 'transfers', labelEn: 'Transfers', labelRu: 'Трансферы' },
  { value: 'flowers', labelEn: 'Flowers', labelRu: 'Цветы' },
  { value: 'cleaning', labelEn: 'Cleaning', labelRu: 'Клининг' },
  { value: 'yachts', labelEn: 'Yachts', labelRu: 'Яхты' },
  { value: 'restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны' },
  { value: 'beauty', labelEn: 'Beauty & Spa', labelRu: 'Красота и SPA' },
  { value: 'medical', labelEn: 'Medical', labelRu: 'Медицина' },
  { value: 'events', labelEn: 'Events', labelRu: 'Мероприятия' },
];

interface QualitySignals {
  has_professional_website: boolean;
  has_russian_content: boolean;
  has_whatsapp: boolean;
  has_online_booking: boolean;
  has_recent_reviews: boolean;
  has_photos: boolean;
  response_time_indicator: string;
}

interface DiscoveredSupplier {
  business_name: string;
  business_name_ru: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  address: string | null;
  district: string | null;
  description_en: string | null;
  description_ru: string | null;
  rating: number | null;
  review_count: number | null;
  languages: string[];
  price_tier: string | null;
  working_hours: string | null;
  services_offered: string[];
  quality_signals: QualitySignals;
  ai_score: number;
  ai_reasoning: string;
  verification_flags: string[];
  is_verified: boolean;
}

interface DiscoveryResult {
  success: boolean;
  vertical: string;
  location: string;
  search_results: number;
  deep_scraped: number;
  suppliers_analyzed: number;
  suppliers_inserted: number;
  suppliers_skipped: number;
  latency_ms: number;
  suppliers: DiscoveredSupplier[];
}

export function SupplierDiscoveryPanel() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const [selectedVertical, setSelectedVertical] = useState('');
  const [lastResult, setLastResult] = useState<DiscoveryResult | null>(null);

  const discovery = useMutation({
    mutationFn: async (vertical: string): Promise<DiscoveryResult> => {
      const { data, error } = await supabase.functions.invoke('supplier-discovery', {
        body: { vertical, location: 'Phuket', limit: 10 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setLastResult(data);
      queryClient.invalidateQueries({ queryKey: ['vendor-prospects'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-pipeline-stats'] });
      toast.success(
        isRu ? 'Поиск завершён' : 'Discovery complete',
        {
          description: isRu
            ? `Найдено ${data.suppliers_analyzed}, добавлено ${data.suppliers_inserted}, глубокий скрейп: ${data.deep_scraped} (${data.latency_ms}ms)`
            : `Found ${data.suppliers_analyzed}, added ${data.suppliers_inserted}, deep scraped: ${data.deep_scraped} (${data.latency_ms}ms)`,
        }
      );
    },
    onError: (error: Error) => {
      toast.error(isRu ? 'Ошибка поиска' : 'Discovery failed', { description: error.message });
    },
  });

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-success text-white text-xs">{score}</Badge>;
    if (score >= 60) return <Badge variant="secondary" className="text-xs">{score}</Badge>;
    if (score >= 40) return <Badge variant="outline" className="text-xs">{score}</Badge>;
    return <Badge variant="outline" className="text-xs text-muted-foreground">{score}</Badge>;
  };

  const getVerifiedBadge = (s: DiscoveredSupplier) => {
    if (s.is_verified) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <ShieldCheck className="h-4 w-4 text-success" />
            </TooltipTrigger>
            <TooltipContent>{isRu ? 'Верифицирован' : 'Verified'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    if (s.verification_flags?.length > 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <ShieldAlert className="h-4 w-4 text-warning" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-0.5">
                {s.verification_flags.map((f, i) => (
                  <div key={i}>⚠️ {f.replace(/_/g, ' ')}</div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null;
  };

  const getQualityPills = (qs: QualitySignals) => {
    const pills: { label: string; ok: boolean }[] = [
      { label: '🇷🇺 RU', ok: qs.has_russian_content },
      { label: 'WA', ok: qs.has_whatsapp },
      { label: '🌐', ok: qs.has_professional_website },
      { label: '📅', ok: qs.has_online_booking },
      { label: '⭐', ok: qs.has_recent_reviews },
    ];
    return (
      <div className="flex gap-1 flex-wrap">
        {pills.filter(p => p.ok).map((p, i) => (
          <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 h-4">
            {p.label}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedVertical} onValueChange={setSelectedVertical}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={isRu ? 'Выберите вертикаль' : 'Select vertical'} />
              </SelectTrigger>
              <SelectContent>
                {VERTICALS.map(v => (
                  <SelectItem key={v.value} value={v.value}>
                    {isRu ? v.labelRu : v.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => selectedVertical && discovery.mutate(selectedVertical)}
              disabled={!selectedVertical || discovery.isPending}
            >
              {discovery.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {discovery.isPending
                ? (isRu ? 'Поиск...' : 'Searching...')
                : (isRu ? 'Найти поставщиков' : 'Discover Suppliers')}
            </Button>

            {lastResult && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground ml-auto">
                <span>{isRu ? 'Найдено:' : 'Found:'} {lastResult.search_results}</span>
                <span>→ {isRu ? 'Скрейп:' : 'Scraped:'} {lastResult.deep_scraped}</span>
                <span>→ {isRu ? 'AI:' : 'AI:'} {lastResult.suppliers_analyzed}</span>
                <span className="flex items-center gap-1 text-foreground font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  {lastResult.suppliers_inserted}
                </span>
                <span className="text-xs">{lastResult.latency_ms}ms</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {lastResult && lastResult.suppliers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {isRu ? 'Найденные поставщики' : 'Discovered Suppliers'} ({lastResult.suppliers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>{isRu ? 'Компания' : 'Business'}</TableHead>
                  <TableHead>{isRu ? 'Контакты' : 'Contacts'}</TableHead>
                  <TableHead>{isRu ? 'Район' : 'District'}</TableHead>
                  <TableHead>{isRu ? 'Рейтинг' : 'Rating'}</TableHead>
                  <TableHead>{isRu ? 'Качество' : 'Quality'}</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>{isRu ? 'Оценка' : 'Assessment'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastResult.suppliers.map((s, i) => (
                  <TableRow key={i} className={s.is_verified ? '' : 'opacity-80'}>
                    <TableCell>{getVerifiedBadge(s)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{s.business_name}</div>
                        {s.business_name_ru && (
                          <div className="text-xs text-muted-foreground">{s.business_name_ru}</div>
                        )}
                        {s.description_en && (
                          <div className="text-xs text-muted-foreground max-w-[220px] truncate">{s.description_en}</div>
                        )}
                        {s.price_tier && (
                          <Badge variant="outline" className="text-[10px] mt-0.5">{s.price_tier}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs">
                        {s.website && (
                          <a href={s.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                            <Globe className="h-3 w-3" /> {isRu ? 'Сайт' : 'Website'}
                          </a>
                        )}
                        {s.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</span>}
                        {s.whatsapp && s.whatsapp !== s.phone && (
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> WA: {s.whatsapp}</span>
                        )}
                        {s.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</span>}
                        {s.instagram && (
                          <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener" className="flex items-center gap-1 text-primary hover:underline">
                            <Instagram className="h-3 w-3" /> @{s.instagram}
                          </a>
                        )}
                        {s.facebook && (
                          <a href={s.facebook} target="_blank" rel="noopener" className="flex items-center gap-1 text-primary hover:underline">
                            <Facebook className="h-3 w-3" /> FB
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.district ? (
                        <span className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" /> {s.district}</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {s.rating ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                          {s.rating} {s.review_count ? `(${s.review_count})` : ''}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {s.quality_signals && getQualityPills(s.quality_signals)}
                    </TableCell>
                    <TableCell className="text-right">{getScoreBadge(s.ai_score)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                      {s.ai_reasoning}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!lastResult && !discovery.isPending && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">
              {isRu ? 'Выберите вертикаль и запустите поиск' : 'Select a vertical and start discovery'}
            </p>
            <p className="text-sm mt-1">
              {isRu
                ? 'AI найдёт поставщиков, глубоко проанализирует их сайты, оценит качество и добавит в воронку'
                : 'AI will find suppliers, deep-scrape their sites, score quality, and add to your pipeline'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
