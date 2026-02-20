import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
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
import { toast } from 'sonner';

interface Promotion {
  id: string;
  title: string;
  type: 'discount' | 'early_bird' | 'last_minute' | 'seasonal';
  value: number;
  unit: '%' | 'fixed';
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired';
}

// Mock data for demonstration
const MOCK_PROMOTIONS: Promotion[] = [
  { id: '1', title: 'Early Bird Summer 2026', type: 'early_bird', value: 15, unit: '%', startDate: '2026-03-01', endDate: '2026-05-31', status: 'active' },
  { id: '2', title: 'Long Stay Discount', type: 'discount', value: 20, unit: '%', startDate: '2026-01-01', endDate: '2026-12-31', status: 'active' },
];

const MOCK_STATS = {
  totalViews: 1248,
  viewsChange: 12,
  inquiries: 34,
  inquiriesChange: 8,
  conversionRate: 2.7,
  topSource: 'Airbnb',
};

export default function MarketingHubPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [promos, setPromos] = useState<Promotion[]>(MOCK_PROMOTIONS);
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

  const handleCreatePromo = () => {
    if (!promoTitle.trim()) {
      toast.error(isRu ? 'Укажите название' : 'Title required');
      return;
    }
    const newPromo: Promotion = {
      id: Date.now().toString(),
      title: promoTitle,
      type: promoType as any,
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

          {promos.length === 0 ? (
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
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Percent className="h-3 w-3" />{p.value}%
                        </span>
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
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center">
              <Eye className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{MOCK_STATS.totalViews}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Просмотров' : 'Views'}</p>
              <p className="text-xs text-success mt-1">+{MOCK_STATS.viewsChange}%</p>
            </Card>
            <Card className="p-4 text-center">
              <Mail className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{MOCK_STATS.inquiries}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Запросов' : 'Inquiries'}</p>
              <p className="text-xs text-success mt-1">+{MOCK_STATS.inquiriesChange}%</p>
            </Card>
            <Card className="p-4 text-center">
              <Tag className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{MOCK_STATS.conversionRate}%</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Конверсия' : 'Conversion'}</p>
            </Card>
            <Card className="p-4 text-center">
              <Megaphone className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{MOCK_STATS.topSource}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Топ источник' : 'Top Source'}</p>
            </Card>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {isRu ? 'Данные обновляются ежедневно' : 'Data updates daily'}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
