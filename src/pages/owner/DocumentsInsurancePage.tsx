import { useState, useMemo } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, differenceInDays, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Plus, FileText, Shield, AlertTriangle, ChevronLeft, Clock, CheckCircle, Edit2, Trash2,
} from 'lucide-react';

const DOC_TYPES = [
  { value: 'insurance', labelEn: 'Insurance', labelRu: 'Страхование', icon: Shield },
  { value: 'license', labelEn: 'License', labelRu: 'Лицензия', icon: FileText },
  { value: 'contract', labelEn: 'Contract', labelRu: 'Договор', icon: FileText },
  { value: 'permit', labelEn: 'Permit', labelRu: 'Разрешение', icon: CheckCircle },
  { value: 'warranty', labelEn: 'Warranty', labelRu: 'Гарантия', icon: Shield },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое', icon: FileText },
];

export default function DocumentsInsurancePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isRu = language === 'ru';
  const { allProperties } = useMyProperties();
  const propertyIds = allProperties.map(p => p.property_id);
  const [tab, setTab] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  const { data: docs, isLoading } = useQuery({
    queryKey: ['property-documents-ins', user?.id, propertyIds.join(',')],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .in('property_id', propertyIds)
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && propertyIds.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('property_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents-ins'] });
      toast.success(isRu ? 'Удалено' : 'Deleted');
    },
  });

  const enriched = useMemo(() => {
    return (docs || []).map(doc => {
      let computedStatus = doc.status || 'active';
      if (doc.expiry_date) {
        const expiry = new Date(doc.expiry_date);
        if (isPast(expiry)) computedStatus = 'expired';
        else if (differenceInDays(expiry, new Date()) <= (doc.reminder_days || 30)) computedStatus = 'expiring_soon';
      }
      return { ...doc, computedStatus };
    });
  }, [docs]);

  const filtered = enriched.filter(d => {
    if (tab === 'expiring') return d.computedStatus === 'expiring_soon';
    if (tab === 'expired') return d.computedStatus === 'expired';
    if (tab === 'insurance') return d.doc_type === 'insurance';
    return true;
  });

  const expiringCount = enriched.filter(d => d.computedStatus === 'expiring_soon').length;
  const expiredCount = enriched.filter(d => d.computedStatus === 'expired').length;

  const statusStyles: Record<string, { badge: string; icon: React.ElementType }> = {
    active: { badge: 'bg-success/10 text-success', icon: CheckCircle },
    expiring_soon: { badge: 'bg-warning/10 text-warning', icon: Clock },
    expired: { badge: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/owner')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{isRu ? 'Документы и страхование' : 'Documents & Insurance'}</h1>
          <p className="text-sm text-muted-foreground">{isRu ? 'Трекинг сроков и напоминания' : 'Deadline tracking & reminders'}</p>
        </div>
        <Button onClick={() => { setEditingDoc(null); setSheetOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />{isRu ? 'Документ' : 'Document'}
        </Button>
      </div>

      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="flex gap-3">
          {expiredCount > 0 && (
            <Card className="flex-1 border-destructive/50">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">{expiredCount} {isRu ? 'просрочен' : 'expired'}</span>
              </CardContent>
            </Card>
          )}
          {expiringCount > 0 && (
            <Card className="flex-1 border-warning/50">
              <CardContent className="p-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">{expiringCount} {isRu ? 'скоро истекает' : 'expiring soon'}</span>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">{isRu ? 'Все' : 'All'}</TabsTrigger>
          <TabsTrigger value="insurance">{isRu ? 'Страховки' : 'Insurance'}</TabsTrigger>
          <TabsTrigger value="expiring">{isRu ? 'Истекающие' : 'Expiring'}{expiringCount > 0 && <Badge variant="secondary" className="ml-1 text-[10px] h-4">{expiringCount}</Badge>}</TabsTrigger>
          <TabsTrigger value="expired">{isRu ? 'Просроченные' : 'Expired'}{expiredCount > 0 && <Badge variant="destructive" className="ml-1 text-[10px] h-4">{expiredCount}</Badge>}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">{isRu ? 'Нет документов' : 'No Documents'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const typeInfo = DOC_TYPES.find(t => t.value === doc.doc_type) || DOC_TYPES[5];
            const TypeIcon = typeInfo.icon;
            const style = statusStyles[doc.computedStatus] || statusStyles.active;
            const StatusIcon = style.icon;
            const property = allProperties.find(p => p.property_id === doc.property_id);
            const daysLeft = doc.expiry_date ? differenceInDays(new Date(doc.expiry_date), new Date()) : null;

            return (
              <Card key={doc.id} className={doc.computedStatus === 'expired' ? 'border-destructive/30' : doc.computedStatus === 'expiring_soon' ? 'border-warning/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted shrink-0"><TypeIcon className="h-4 w-4 text-foreground/70" /></div>
                      <div className="space-y-0.5">
                        <h3 className="font-medium text-sm">{doc.title}</h3>
                        {property && <p className="text-xs text-muted-foreground">{property.title}</p>}
                        {doc.provider_name && <p className="text-xs text-muted-foreground">{doc.provider_name}</p>}
                        {doc.policy_number && <p className="text-[10px] text-muted-foreground">#{doc.policy_number}</p>}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={cn('text-[10px]', style.badge)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {doc.computedStatus === 'expired' ? (isRu ? 'Просрочен' : 'Expired') :
                         doc.computedStatus === 'expiring_soon' ? (isRu ? `${daysLeft} дн.` : `${daysLeft}d left`) :
                         (isRu ? 'Активен' : 'Active')}
                      </Badge>
                      {doc.expiry_date && <p className="text-xs text-muted-foreground">{format(new Date(doc.expiry_date), 'dd MMM yyyy', { locale: isRu ? ru : undefined })}</p>}
                      {doc.coverage_amount && <p className="text-xs font-medium">฿{doc.coverage_amount.toLocaleString()}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingDoc(doc); setSheetOpen(true); }}><Edit2 className="h-3 w-3 mr-1" />{isRu ? 'Изменить' : 'Edit'}</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(doc.id)}><Trash2 className="h-3 w-3 mr-1" />{isRu ? 'Удалить' : 'Delete'}</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DocSheet open={sheetOpen} onOpenChange={setSheetOpen} editingDoc={editingDoc} properties={allProperties} userId={user?.id || ''} />
    </div>
  );
}

function DocSheet({ open, onOpenChange, editingDoc, properties, userId }: {
  open: boolean; onOpenChange: (v: boolean) => void; editingDoc: any; properties: any[]; userId: string;
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    property_id: editingDoc?.property_id || properties[0]?.property_id || '',
    doc_type: editingDoc?.doc_type || 'insurance',
    document_type: editingDoc?.document_type || 'insurance',
    title: editingDoc?.title || '',
    description: editingDoc?.description || '',
    issue_date: editingDoc?.issue_date || '',
    expiry_date: editingDoc?.expiry_date || '',
    coverage_amount: editingDoc?.coverage_amount ? String(editingDoc.coverage_amount) : '',
    provider_name: editingDoc?.provider_name || '',
    policy_number: editingDoc?.policy_number || '',
    reminder_days: String(editingDoc?.reminder_days || 30),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        property_id: form.property_id,
        uploaded_by: userId,
        doc_type: form.doc_type,
        document_type: form.doc_type,
        title: form.title,
        description: form.description || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        coverage_amount: form.coverage_amount ? Number(form.coverage_amount) : null,
        provider_name: form.provider_name || null,
        policy_number: form.policy_number || null,
        reminder_days: Number(form.reminder_days) || 30,
      };
      if (editingDoc) {
        const { error } = await supabase.from('property_documents').update(payload).eq('id', editingDoc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('property_documents').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents-ins'] });
      toast.success(isRu ? 'Сохранено' : 'Saved');
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message || (isRu ? 'Ошибка' : 'Error')),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{editingDoc ? (isRu ? 'Редактировать' : 'Edit') : (isRu ? 'Новый документ' : 'New Document')}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>{isRu ? 'Тип' : 'Type'}</Label>
            <Select value={form.doc_type} onValueChange={v => setForm(f => ({ ...f, doc_type: v, document_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isRu ? t.labelRu : t.labelEn}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{isRu ? 'Название' : 'Title'}</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div>
            <Label>{isRu ? 'Объект' : 'Property'}</Label>
            <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{properties.map(p => <SelectItem key={p.property_id} value={p.property_id}>{p.title || p.property_id.slice(0, 8)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{isRu ? 'Дата выдачи' : 'Issue Date'}</Label><Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} /></div>
            <div><Label>{isRu ? 'Срок действия' : 'Expiry'}</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
          </div>
          <div><Label>{isRu ? 'Сумма покрытия (฿)' : 'Coverage (฿)'}</Label><Input type="number" value={form.coverage_amount} onChange={e => setForm(f => ({ ...f, coverage_amount: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{isRu ? 'Провайдер' : 'Provider'}</Label><Input value={form.provider_name} onChange={e => setForm(f => ({ ...f, provider_name: e.target.value }))} /></div>
            <div><Label>{isRu ? '№ полиса' : 'Policy #'}</Label><Input value={form.policy_number} onChange={e => setForm(f => ({ ...f, policy_number: e.target.value }))} /></div>
          </div>
          <div><Label>{isRu ? 'Напомнить за (дней)' : 'Remind (days)'}</Label><Input type="number" value={form.reminder_days} onChange={e => setForm(f => ({ ...f, reminder_days: e.target.value }))} /></div>
          <div><Label>{isRu ? 'Описание' : 'Description'}</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
          <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.title || !form.property_id}>{isRu ? 'Сохранить' : 'Save'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
