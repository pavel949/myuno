import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCapitalInvestmentDeal, useUpdateCapitalInvestmentDeal, useCapitalInvestmentDealInquiries } from '@/hooks/capital/useCapitalInvestmentDeals';
import { PIPELINE_STAGES, DEAL_INTENTS, type DealPipelineStatus } from '@/lib/investment/dealTaxonomy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Mail, MessageCircle, Save } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { toast } from 'sonner';

const fmtUsd = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;

export default function CapitalInvestmentDealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: deal, isLoading } = useCapitalInvestmentDeal(id);
  const { data: inquiries = [] } = useCapitalInvestmentDealInquiries(id);
  const update = useUpdateCapitalInvestmentDeal();

  const [form, setForm] = useState({ teaser_public: '', location_display: '', probability_score: 30, admin_notes: '', status: 'submitted' as DealPipelineStatus, is_published: false });

  useEffect(() => {
    if (deal) {
      setForm({
        teaser_public: deal.teaser_public ?? '',
        location_display: deal.location_display ?? '',
        probability_score: deal.probability_score ?? 30,
        admin_notes: deal.admin_notes ?? '',
        status: deal.status,
        is_published: deal.is_published,
      });
    }
  }, [deal]);

  const save = async () => {
    if (!id) return;
    try {
      await update.mutateAsync({ id, patch: form });
      toast.success('Сохранено и синхронизировано с воронкой Capital');
    } catch (err) {
      toast.error(`Ошибка: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-96" /></div>;
  if (!deal) return <div className="p-6 text-center text-muted-foreground">Сделка не найдена</div>;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(APP_ROUTES.CAPITAL_INVESTMENT_DEALS)}>
        <ArrowLeft className="w-4 h-4 mr-1" />Назад к воронке
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">{deal.title_private}</h1>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <Badge variant="secondary">{DEAL_INTENTS.find(i => i.key === deal.deal_intent)?.icon} {deal.deal_intent}</Badge>
            <Badge variant="outline">{deal.category}</Badge>
            <Badge className="bg-success/15 text-success">{fmtUsd(deal.deal_size_midpoint_usd)}</Badge>
            <Badge variant="outline">≈ {fmtUsd(Number(deal.platform_fee_estimate_usd || 0))} комиссия</Badge>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Submitter (private) */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Контакт (private)</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div><span className="text-muted-foreground">Имя:</span> {deal.submitter_name}</div>
            {deal.submitter_company && <div><span className="text-muted-foreground">Компания:</span> {deal.submitter_company}</div>}
            <div className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-muted-foreground" /> {deal.submitter_email}</div>
            {deal.submitter_whatsapp && <div className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-muted-foreground" /> {deal.submitter_whatsapp}</div>}
            <div className="pt-2 text-xs text-muted-foreground">{deal.location_full ?? '—'}</div>
            <div className="pt-2 whitespace-pre-wrap text-xs">{deal.description_private ?? '—'}</div>
          </CardContent>
        </Card>

        {/* Public copy + admin */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Публичное представление + CRM</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Публичный teaser (анонимизированный)</Label>
              <Textarea value={form.teaser_public} onChange={(e) => setForm(f => ({ ...f, teaser_public: e.target.value }))} rows={2} maxLength={150} />
            </div>
            <div>
              <Label className="text-xs">Публичная локация</Label>
              <Input value={form.location_display} onChange={(e) => setForm(f => ({ ...f, location_display: e.target.value }))} placeholder="e.g. Phuket, Thailand" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Вероятность %</Label>
                <Input type="number" min={0} max={100} value={form.probability_score} onChange={(e) => setForm(f => ({ ...f, probability_score: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs">Стадия</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as DealPipelineStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.labelRu}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Заметки (private)</Label>
              <Textarea value={form.admin_notes} onChange={(e) => setForm(f => ({ ...f, admin_notes: e.target.value }))} rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm(f => ({ ...f, is_published: v }))} />
              <Label className="text-xs">Опубликовать на доске инвесторов</Label>
            </div>
            <Button onClick={save} disabled={update.isPending} className="w-full bg-success hover:bg-success">
              <Save className="w-4 h-4 mr-1" /> Сохранить
            </Button>
            <p className="text-[10px] text-muted-foreground">Изменения автоматически отражаются в воронке Capital и в карточке контакта.</p>
          </CardContent>
        </Card>
      </div>

      {/* Inquiries */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Запросы инвесторов ({inquiries.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {inquiries.length === 0 ? (
            <p className="text-xs text-muted-foreground">Пока нет запросов</p>
          ) : inquiries.map(inq => (
            <div key={inq.id} className="border border-border/40 rounded-none p-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{inq.investor_name}</span>
                <Badge variant="outline" className="text-[10px]">{inq.investor_type}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{inq.investor_email} · {inq.investor_whatsapp ?? ''}</div>
              {inq.investment_capacity_usd && <div className="text-xs">Capacity: ${inq.investment_capacity_usd.toLocaleString()}</div>}
              {inq.message && <div className="text-xs mt-1 italic">"{inq.message}"</div>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
