import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, CheckCircle2, Globe, Phone, Mail, MapPin, Star } from 'lucide-react';
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

interface DiscoveredSupplier {
  business_name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  district: string | null;
  description: string | null;
  rating: number | null;
  review_count: number | null;
  languages: string[];
  ai_score: number;
  ai_reasoning: string;
}

interface DiscoveryResult {
  success: boolean;
  vertical: string;
  location: string;
  search_results: number;
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
            ? `Найдено ${data.suppliers_analyzed}, добавлено ${data.suppliers_inserted} (${data.latency_ms}ms)`
            : `Found ${data.suppliers_analyzed}, added ${data.suppliers_inserted} (${data.latency_ms}ms)`,
        }
      );
    },
    onError: (error: Error) => {
      toast.error(isRu ? 'Ошибка поиска' : 'Discovery failed', {
        description: error.message,
      });
    },
  });

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-emerald-600 text-xs">{score}</Badge>;
    if (score >= 60) return <Badge variant="secondary" className="text-xs">{score}</Badge>;
    return <Badge variant="outline" className="text-xs">{score}</Badge>;
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
                <span>{isRu ? 'Результатов:' : 'Results:'} {lastResult.search_results}</span>
                <span>→ {isRu ? 'Проанализировано:' : 'Analyzed:'} {lastResult.suppliers_analyzed}</span>
                <span className="flex items-center gap-1 text-foreground font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {isRu ? 'Добавлено:' : 'Added:'} {lastResult.suppliers_inserted}
                </span>
                <span>{lastResult.latency_ms}ms</span>
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
                  <TableHead>{isRu ? 'Компания' : 'Business'}</TableHead>
                  <TableHead>{isRu ? 'Контакты' : 'Contacts'}</TableHead>
                  <TableHead>{isRu ? 'Район' : 'District'}</TableHead>
                  <TableHead>{isRu ? 'Рейтинг' : 'Rating'}</TableHead>
                  <TableHead>{isRu ? 'Языки' : 'Languages'}</TableHead>
                  <TableHead className="text-right">AI Score</TableHead>
                  <TableHead>{isRu ? 'Оценка' : 'Assessment'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastResult.suppliers.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{s.business_name}</div>
                        {s.description && (
                          <div className="text-xs text-muted-foreground max-w-[250px] truncate">{s.description}</div>
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
                        {s.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</span>}
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
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          {s.rating} {s.review_count ? `(${s.review_count})` : ''}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(s.languages || []).map(l => (
                          <Badge key={l} variant="outline" className="text-xs">{l.toUpperCase()}</Badge>
                        ))}
                      </div>
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
                ? 'AI найдёт поставщиков через Firecrawl, оценит их и добавит в воронку'
                : 'AI will find suppliers via web search, score them, and add to your pipeline'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
