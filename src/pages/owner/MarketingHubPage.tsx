import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Megaphone, Mail, BarChart3, Tag, Percent, Calendar, Eye, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Promotion {
  id: string;
  title: string;
  type: string;
  value: number;
  unit: '%' | 'fixed';
  startDate: string;
  endDate: string;
  status: string;
}

interface MarketingStats {
  totalViews: number;
  viewsChange: number;
  inquiries: number;
  inquiriesChange: number;
  conversionRate: number;
  topSource: string;
}

export default function MarketingHubPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [promosLoading, setPromosLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [emailSheetOpen, setEmailSheetOpen] = useState(false);

  // Promo form
  const [promoTitle, setPromoTitle] = useState('');
  const [promoType, setPromoType] = useState<string>('discount');
  const [promoValue, setPromoValue] = useState(10);
  const [promoStart, setPromoStart] = useState('');
  const [promoEnd, setPromoEnd] = useState('');

  // Email form
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Fetch promotions from DB
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const fetchPromos = async () => {
      setPromosLoading(true);
      const { data } = await supabase
        .from('property_promotions')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (!cancelled && data) {
        setPromos(data.map(p => ({
          id: p.id,
          title: `${p.promotion_type} promotion`,
          type: p.promotion_type || 'discount',
          value: p.cost || 0,
          unit: '%' as const,
          startDate: p.starts_at,
          endDate: p.ends_at,
          status: p.status || 'active',
        })));
      }
      if (!cancelled) setPromosLoading(false);
    };
    fetchPromos();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Fetch analytics stats from DB
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const fetchStats = async () => {
      setStatsLoading(true);
      // Get all properties for the owner
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

      if (!properties?.length) {
        if (!cancelled) {
          setStats({ totalViews: 0, viewsChange: 0, inquiries: 0, inquiriesChange: 0, conversionRate: 0, topSource: '—' });
          setStatsLoading(false);
        }
        return;
      }

      const propertyIds = properties.map(p => p.id);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0];

      // Current 30 days
      const { data: current } = await supabase
        .from('property_analytics')
        .select('views, inquiries, source')
        .in('property_id', propertyIds)
        .gte('date', thirtyDaysAgo);

      // Previous 30 days
      const { data: previous } = await supabase
        .from('property_analytics')
        .select('views, inquiries')
        .in('property_id', propertyIds)
        .gte('date', sixtyDaysAgo)
        .lt('date', thirtyDaysAgo);

      if (!cancelled) {
        const curViews = (current || []).reduce((s, r) => s + (r.views || 0), 0);
        const curInq = (current || []).reduce((s, r) => s + (r.inquiries || 0), 0);
        const prevViews = (previous || []).reduce((s, r) => s + (r.views || 0), 0);
        const prevInq = (previous || []).reduce((s, r) => s + (r.inquiries || 0), 0);

        // Find top source
        const sourceMap: Record<string, number> = {};
        (current || []).forEach(r => {
          if (r.source) sourceMap[r.source] = (sourceMap[r.source] || 0) + (r.views || 0);
        });
        const topSource = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

        const viewsChange = prevViews > 0 ? Math.round(((curViews - prevViews) / prevViews) * 100) : 0;
        const inqChange = prevInq > 0 ? Math.round(((curInq - prevInq) / prevInq) * 100) : 0;
        const convRate = curViews > 0 ? Math.round((curInq / curViews) * 1000) / 10 : 0;

        setStats({ totalViews: curViews, viewsChange, inquiries: curInq, inquiriesChange: inqChange, conversionRate: convRate, topSource });
        setStatsLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleCreatePromo = () => {
    if (!promoTitle.trim()) {
      toast.error(isRu ? 'Укажите название' : 'Title required');
      return;
    }
    const newPromo: Promotion = {
      id: Date.now().toString(),
      title: promoTitle,
      type: promoType,
      value: promoValue,
      unit: '%',
      startDate: promoStart,
      endDate: promoEnd,
      status: new Date(promoStart) <= new Date() ? 'active' : 'scheduled',
    };
    setPromos([newPromo, ...promos]);
    toast.success(isRu ? 'Промо создано' : 'Promotion created');
    setSheetOpen(false);
    setPromoTitle(''); setPromoValue(10); setPromoStart(''); setPromoEnd('');
  };

  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error(isRu ? 'Заполните все поля' : 'Fill in all fields');
      return;
    }
    toast.success(isRu ? 'Рассылка запланирована' : 'Email campaign scheduled');
    setEmailSheetOpen(false);
    setEmailSubject(''); setEmailBody('');
  };

  const promoTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      discount: { en: 'Discount', ru: 'Скидка' },
      early_bird: { en: 'Early Bird', ru: 'Раннее бронирование' },
      last_minute: { en: 'Last Minute', ru: 'Горящее' },
      seasonal: { en: 'Seasonal', ru: 'Сезонное' },
      boost: { en: 'Boost', ru: 'Продвижение' },
      featured: { en: 'Featured', ru: 'Топ-размещение' },
    };
    return labels[type] ? (isRu ? labels[type].ru : labels[type].en) : type;
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold">{isRu ? 'Маркетинг' : 'Marketing Hub'}</h1>

      <Tabs defaultValue="promos">
        <TabsList className="w-full">
          <TabsTrigger value="promos" className="flex-1">
            <Megaphone className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Промо' : 'Promos'}
          </TabsTrigger>
          <TabsTrigger value="email" className="flex-1">
            <Mail className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Рассылки' : 'Campaigns'}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1">
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Аналитика' : 'Analytics'}
          </TabsTrigger>
        </TabsList>

        {/* Promotions Tab */}
        <TabsContent value="promos" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />{isRu ? 'Создать' : 'Create'}</Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{isRu ? 'Новая промо-акция' : 'New Promotion'}</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>{isRu ? 'Название' : 'Title'} *</Label>
                    <Input value={promoTitle} onChange={e => setPromoTitle(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{isRu ? 'Тип' : 'Type'}</Label>
                      <Select value={promoType} onValueChange={setPromoType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">{isRu ? 'Скидка' : 'Discount'}</SelectItem>
                          <SelectItem value="early_bird">{isRu ? 'Раннее' : 'Early Bird'}</SelectItem>
                          <SelectItem value="last_minute">{isRu ? 'Горящее' : 'Last Minute'}</SelectItem>
                          <SelectItem value="seasonal">{isRu ? 'Сезонное' : 'Seasonal'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{isRu ? 'Скидка %' : 'Discount %'}</Label>
                      <Input type="number" min={1} max={100} value={promoValue} onChange={e => setPromoValue(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{isRu ? 'Начало' : 'Start'}</Label>
                      <Input type="date" value={promoStart} onChange={e => setPromoStart(e.target.value)} />
                    </div>
                    <div>
                      <Label>{isRu ? 'Конец' : 'End'}</Label>
                      <Input type="date" value={promoEnd} onChange={e => setPromoEnd(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleCreatePromo}>{isRu ? 'Создать' : 'Create Promotion'}</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {promosLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : promos.length === 0 ? (
            <Card className="p-8 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{isRu ? 'Нет промо-акций' : 'No promotions yet'}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {promos.map(p => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{p.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{promoTypeLabel(p.type)}</Badge>
                        {p.value > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <Percent className="h-3 w-3" />{p.value}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                      {p.status === 'active' ? (isRu ? 'Активно' : 'Active') :
                       p.status === 'scheduled' ? (isRu ? 'Запланировано' : 'Scheduled') :
                       isRu ? 'Завершено' : 'Expired'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {p.startDate} → {p.endDate}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Email Campaigns Tab */}
        <TabsContent value="email" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Sheet open={emailSheetOpen} onOpenChange={setEmailSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />{isRu ? 'Новая рассылка' : 'New Campaign'}</Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{isRu ? 'Новая email-рассылка' : 'New Email Campaign'}</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>{isRu ? 'Тема письма' : 'Subject'} *</Label>
                    <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                  </div>
                  <div>
                    <Label>{isRu ? 'Текст письма' : 'Email Body'} *</Label>
                    <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6}
                      placeholder={isRu ? 'Напишите текст рассылки...' : 'Write your email content...'}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Рассылка будет отправлена всем вашим контактам из CRM' : 'Will be sent to all your CRM contacts'}
                  </p>
                  <Button className="w-full" onClick={handleSendEmail}>
                    <Send className="h-4 w-4 mr-1" />
                    {isRu ? 'Запланировать отправку' : 'Schedule Send'}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Card className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">{isRu ? 'История рассылок появится здесь' : 'Campaign history will appear here'}</p>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 text-center">
                  <Eye className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Просмотров' : 'Views'}</p>
                  {stats.viewsChange !== 0 && (
                    <p className={`text-xs mt-1 ${stats.viewsChange > 0 ? 'text-success' : 'text-destructive'}`}>
                      {stats.viewsChange > 0 ? '+' : ''}{stats.viewsChange}%
                    </p>
                  )}
                </Card>
                <Card className="p-4 text-center">
                  <Mail className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{stats.inquiries}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Запросов' : 'Inquiries'}</p>
                  {stats.inquiriesChange !== 0 && (
                    <p className={`text-xs mt-1 ${stats.inquiriesChange > 0 ? 'text-success' : 'text-destructive'}`}>
                      {stats.inquiriesChange > 0 ? '+' : ''}{stats.inquiriesChange}%
                    </p>
                  )}
                </Card>
                <Card className="p-4 text-center">
                  <Tag className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Конверсия' : 'Conversion'}</p>
                </Card>
                <Card className="p-4 text-center">
                  <Megaphone className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{stats.topSource}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Топ источник' : 'Top Source'}</p>
                </Card>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {isRu ? 'Данные за последние 30 дней' : 'Data for the last 30 days'}
              </p>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
