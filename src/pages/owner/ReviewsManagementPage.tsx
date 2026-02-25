import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Plus, Star, MessageCircle, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  property_id: string;
  platform: string;
  guest_name: string | null;
  rating: number | null;
  review_text: string | null;
  review_date: string | null;
  response_text: string | null;
  responded_at: string | null;
  sentiment: string | null;
}

export default function ReviewsManagementPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isRu = language === 'ru';
  const { allProperties } = useMyProperties();
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [tab, setTab] = useState('all');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['property-reviews', user?.id, selectedProperty],
    queryFn: async () => {
      let q = supabase
        .from('property_reviews')
        .select('*')
        .eq('owner_id', user!.id)
        .order('review_date', { ascending: false });
      if (selectedProperty !== 'all') q = q.eq('property_id', selectedProperty);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Review[];
    },
    enabled: !!user?.id,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { error } = await supabase.from('property_reviews').update({
        response_text: text,
        responded_at: new Date().toISOString(),
        responded_by: user!.id,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-reviews'] });
      setRespondingId(null);
      setResponseText('');
      toast.success(isRu ? 'Ответ сохранён' : 'Response saved');
    },
  });

  const filtered = reviews?.filter(r => {
    if (tab === 'unanswered') return !r.response_text;
    if (tab === 'negative') return r.sentiment === 'negative' || (r.rating && r.rating <= 3);
    return true;
  }) || [];

  const avgRating = reviews?.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.filter(r => r.rating).length).toFixed(1)
    : '—';

  const unanswered = reviews?.filter(r => !r.response_text).length || 0;

  const platformColors: Record<string, string> = {
    airbnb: 'bg-[#FF5A5F]/10 text-[#FF5A5F]',
    booking: 'bg-[#003580]/10 text-[#003580]',
    google: 'bg-[#4285F4]/10 text-[#4285F4]',
    manual: 'bg-muted text-muted-foreground',
  };

  const sentimentIcon = (s: string | null, rating: number | null) => {
    if (s === 'negative' || (rating && rating <= 2)) return <ThumbsDown className="h-3 w-3 text-destructive" />;
    if (s === 'positive' || (rating && rating >= 4)) return <ThumbsUp className="h-3 w-3 text-success" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/owner')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{isRu ? 'Управление отзывами' : 'Reviews Management'}</h1>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Мониторинг и ответы на отзывы' : 'Monitor and respond to guest reviews'}
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Добавить' : 'Add'}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Star className="h-4 w-4 text-warning mx-auto mb-1" />
            <p className="text-xl font-bold">{avgRating}</p>
            <p className="text-[10px] text-muted-foreground">{isRu ? 'Средний рейтинг' : 'Avg Rating'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <MessageCircle className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{reviews?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">{isRu ? 'Всего' : 'Total'}</p>
          </CardContent>
        </Card>
        <Card className={unanswered > 0 ? 'border-warning/50' : ''}>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{unanswered}</p>
            <p className="text-[10px] text-muted-foreground">{isRu ? 'Без ответа' : 'Unanswered'}</p>
          </CardContent>
        </Card>
      </div>

      {allProperties.length > 1 && (
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder={isRu ? 'Все объекты' : 'All properties'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все объекты' : 'All Properties'}</SelectItem>
            {allProperties.map(p => (
              <SelectItem key={p.property_id} value={p.property_id}>
                {p.title || p.property_id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">{isRu ? 'Все' : 'All'}</TabsTrigger>
          <TabsTrigger value="unanswered">
            {isRu ? 'Без ответа' : 'Unanswered'}
            {unanswered > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1 h-4">{unanswered}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="negative">{isRu ? 'Негативные' : 'Negative'}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">{isRu ? 'Нет отзывов' : 'No Reviews'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => {
            const property = allProperties.find(p => p.property_id === review.property_id);
            return (
              <Card key={review.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {sentimentIcon(review.sentiment, review.rating)}
                      <span className="font-medium text-sm">{review.guest_name || (isRu ? 'Гость' : 'Guest')}</span>
                      <Badge className={cn('text-[10px]', platformColors[review.platform] || platformColors.manual)}>
                        {review.platform}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {review.rating && (
                        <>
                          <Star className="h-3 w-3 text-warning fill-warning" />
                          <span className="text-sm font-medium">{review.rating}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {property && <p className="text-xs text-muted-foreground">{property.title}</p>}
                  {review.review_text && <p className="text-sm">{review.review_text}</p>}
                  {review.review_date && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.review_date), 'dd MMM yyyy', { locale: isRu ? ru : undefined })}
                    </p>
                  )}
                  {review.response_text ? (
                    <div className="bg-muted/50 rounded-lg p-3 mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{isRu ? 'Ваш ответ:' : 'Your response:'}</p>
                      <p className="text-sm">{review.response_text}</p>
                    </div>
                  ) : (
                    respondingId === review.id ? (
                      <div className="space-y-2 mt-2">
                        <Textarea
                          value={responseText}
                          onChange={e => setResponseText(e.target.value)}
                          placeholder={isRu ? 'Ваш ответ...' : 'Your response...'}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => respondMutation.mutate({ id: review.id, text: responseText })} disabled={!responseText}>
                            {isRu ? 'Отправить' : 'Submit'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRespondingId(null)}>
                            {isRu ? 'Отмена' : 'Cancel'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="mt-1" onClick={() => { setRespondingId(review.id); setResponseText(''); }}>
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {isRu ? 'Ответить' : 'Respond'}
                      </Button>
                    )
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddReviewSheet open={sheetOpen} onOpenChange={setSheetOpen} properties={allProperties} ownerId={user?.id || ''} />
    </div>
  );
}

function AddReviewSheet({ open, onOpenChange, properties, ownerId }: {
  open: boolean; onOpenChange: (v: boolean) => void; properties: any[]; ownerId: string;
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    property_id: '',
    platform: 'airbnb',
    guest_name: '',
    rating: '5',
    review_text: '',
    review_date: new Date().toISOString().slice(0, 10),
    sentiment: 'positive',
  });

  useEffect(() => {
    setForm({
      property_id: properties[0]?.property_id || '',
      platform: 'airbnb',
      guest_name: '',
      rating: '5',
      review_text: '',
      review_date: new Date().toISOString().slice(0, 10),
      sentiment: 'positive',
    });
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('property_reviews').insert({
        property_id: form.property_id,
        owner_id: ownerId,
        platform: form.platform,
        guest_name: form.guest_name || null,
        rating: Number(form.rating),
        review_text: form.review_text || null,
        review_date: form.review_date,
        sentiment: form.sentiment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-reviews'] });
      toast.success(isRu ? 'Отзыв добавлен' : 'Review added');
      onOpenChange(false);
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{isRu ? 'Добавить отзыв' : 'Add Review'}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>{isRu ? 'Объект' : 'Property'}</Label>
            <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {properties.map(p => (
                  <SelectItem key={p.property_id} value={p.property_id}>{p.title || p.property_id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Платформа' : 'Platform'}</Label>
              <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="booking">Booking.com</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="manual">{isRu ? 'Вручную' : 'Manual'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRu ? 'Рейтинг' : 'Rating'}</Label>
              <Select value={form.rating} onValueChange={v => setForm(f => ({ ...f, rating: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map(r => <SelectItem key={r} value={String(r)}>{'⭐'.repeat(r)} {r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{isRu ? 'Имя гостя' : 'Guest Name'}</Label>
            <Input value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} />
          </div>
          <div>
            <Label>{isRu ? 'Текст отзыва' : 'Review Text'}</Label>
            <Textarea value={form.review_text} onChange={e => setForm(f => ({ ...f, review_text: e.target.value }))} rows={4} />
          </div>
          <div>
            <Label>{isRu ? 'Дата' : 'Date'}</Label>
            <Input type="date" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} />
          </div>
          <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.property_id}>
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
