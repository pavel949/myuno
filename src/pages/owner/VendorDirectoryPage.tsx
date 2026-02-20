import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, Phone, Mail, Globe, Building2 } from 'lucide-react';

interface VendorWithRating {
  id: string;
  business_name: string;
  business_name_ru: string | null;
  category: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  district: string | null;
  status: string | null;
  avg_score: number | null;
  review_count: number;
}

export default function VendorDirectoryPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendor-directory', user?.id],
    queryFn: async () => {
      // Fetch vendors
      const { data: prospects } = await supabase
        .from('vendor_prospects')
        .select('id, business_name, business_name_ru, category, contact_name, email, phone, whatsapp, website, district, status')
        .order('business_name');

      if (!prospects) return [];

      // Fetch reviews aggregated
      const { data: reviews } = await supabase
        .from('vendor_performance_reviews')
        .select('vendor_id, overall_score');

      // Aggregate reviews by vendor_id
      const reviewMap = new Map<string, { total: number; count: number }>();
      for (const r of (reviews || [])) {
        const existing = reviewMap.get(r.vendor_id) || { total: 0, count: 0 };
        existing.total += Number(r.overall_score || 0);
        existing.count += 1;
        reviewMap.set(r.vendor_id, existing);
      }

      return prospects.map(v => ({
        ...v,
        avg_score: reviewMap.has(v.id) ? reviewMap.get(v.id)!.total / reviewMap.get(v.id)!.count : null,
        review_count: reviewMap.get(v.id)?.count || 0,
      })) as VendorWithRating[];
    },
    enabled: !!user,
  });

  const categories = [...new Set((vendors || []).map(v => v.category).filter(Boolean))] as string[];

  const filtered = (vendors || []).filter(v => {
    const matchSearch = !search || 
      v.business_name.toLowerCase().includes(search.toLowerCase()) ||
      (v.business_name_ru || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.contact_name || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || v.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold">{isRu ? 'Справочник поставщиков' : 'Vendor Directory'}</h1>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск...' : 'Search...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={isRu ? 'Категория' : 'Category'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !filtered.length ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Поставщики не найдены' : 'No vendors found'}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => (
            <Card key={v.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{isRu && v.business_name_ru ? v.business_name_ru : v.business_name}</p>
                  {v.contact_name && <p className="text-xs text-muted-foreground">{v.contact_name}</p>}
                </div>
                {v.category && <Badge variant="secondary" className="text-xs">{v.category}</Badge>}
              </div>

              {v.avg_score !== null && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-medium">{v.avg_score.toFixed(1)}</span>
                  <span className="text-muted-foreground text-xs">({v.review_count} {isRu ? 'отзывов' : 'reviews'})</span>
                </div>
              )}

              {v.district && <p className="text-xs text-muted-foreground">📍 {v.district}</p>}

              <div className="flex gap-2 pt-1 flex-wrap">
                {v.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${v.phone}`}><Phone className="h-3 w-3 mr-1" />{isRu ? 'Звонок' : 'Call'}</a>
                  </Button>
                )}
                {v.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${v.email}`}><Mail className="h-3 w-3 mr-1" />Email</a>
                  </Button>
                )}
                {v.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={v.website} target="_blank" rel="noopener noreferrer"><Globe className="h-3 w-3 mr-1" />{isRu ? 'Сайт' : 'Website'}</a>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
