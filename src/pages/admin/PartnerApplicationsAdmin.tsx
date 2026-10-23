import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pickLang } from '@/lib/i18n/pickLang';
import { parseQueuePage } from '@/lib/adminDashboardQueues';
import { adminLiteralSearchOr } from '@/lib/adminLiteralSearch';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye,
  Search,
  Filter,
  ChevronDown,
  Building2,
  Mail,
  Phone,
  Globe,
  Calendar,
  AlertCircle,
  Shield,
  ExternalLink
} from 'lucide-react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

import { toast } from 'sonner';
interface PartnerApplication {
  id: string;
  user_id: string | null;
  business_name: string;
  business_category: string;
  business_description: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  license_number: string | null;
  tax_id: string | null;
  // BUG-11: DB column is `text` — keep widely typed and fall back in UI lookups.
  status: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

type KnownStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'suspended';

const statusConfig = {
  pending: { 
    icon: Clock, 
    color: 'bg-warning/20 text-warning border-warning/30',
    labelRu: 'Ожидает', 
    labelEn: 'Pending' 
  },
  reviewing: { 
    icon: Eye, 
    color: 'bg-info/20 text-info border-info/30',
    labelRu: 'На рассмотрении', 
    labelEn: 'Reviewing' 
  },
  approved: { 
    icon: CheckCircle2, 
    color: 'bg-success/20 text-success border-success/30',
    labelRu: 'Одобрено', 
    labelEn: 'Approved' 
  },
  rejected: { 
    icon: XCircle, 
    color: 'bg-destructive/20 text-destructive border-destructive/30',
    labelRu: 'Отклонено', 
    labelEn: 'Rejected' 
  },
  suspended: { 
    icon: AlertCircle, 
    color: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
    labelRu: 'Приостановлено', 
    labelEn: 'Suspended' 
  },
};

const categoryLabels: Record<string, { ru: string; en: string }> = {
  other: { ru: 'Другой бизнес', en: 'Other business' },
  services: { ru: 'Услуги', en: 'Services' },
  food: { ru: 'Еда и напитки', en: 'Food & Drinks' },
  beauty: { ru: 'Красота и спа', en: 'Beauty & Spa' },
  property: { ru: 'Недвижимость', en: 'Property' },
  transport: { ru: 'Транспорт', en: 'Transport' },
  medical: { ru: 'Медицина', en: 'Medical' },
  education: { ru: 'Образование', en: 'Education' },
  retail: { ru: 'Розничная торговля', en: 'Retail' },
};

export default function PartnerApplicationsAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, isLoading: adminCheckLoading } = useIsAdmin();

  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(false);
  const [totalCount, setTotalCount] = useState<number|null>(null);
  const readSequence = React.useRef(0);
  const [params, setParams] = useSearchParams();
  const searchQuery = params.get('q') || '';
  const rawStatus = params.get('status') || 'all';
  const statusFilter = Object.prototype.hasOwnProperty.call(statusConfig, rawStatus) ? rawStatus as KnownStatus : 'all';
  const page = parseQueuePage(params,'application_page');
  const readKey=JSON.stringify([user?.id,statusFilter,searchQuery,page]);
  const [loadedKey,setLoadedKey]=useState<string|null>(null);
  const setSearchQuery = (value: string) => setParams(previous => {
    const next = new URLSearchParams(previous);next.delete('application_page'); if (value) next.set('q',value); else next.delete('q'); return next;
  }, {replace:true});
  const setStatusFilter = (value: string) => {
    if (value !== 'all' && !Object.prototype.hasOwnProperty.call(statusConfig, value)) return;
    setParams(previous => { const next = new URLSearchParams(previous);next.delete('application_page'); if(value==='all') next.delete('status'); else next.set('status',value); return next; });
  };
  const setPage=(value:number)=>setParams(previous=>{const next=new URLSearchParams(previous);if(value===0)next.delete('application_page');else next.set('application_page',String(value));return next;});
  const [selectedApp, setSelectedApp] = useState<PartnerApplication | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isPageLoading = adminCheckLoading || (isAdmin && (listLoading||loadedKey!==readKey));

  const fetchApplications = React.useCallback(async () => {
    if (!user?.id || !isAdmin) return;
    const sequence=++readSequence.current;
    setListLoading(true);
    setListError(false);
    try {
      let query = supabase
        .from('partner_applications')
        .select('*',{count:'exact'})
        .order('created_at', { ascending: false }).order('id',{ascending:false});
      if(statusFilter!=='all')query=query.eq('status',statusFilter);
      const term=adminLiteralSearchOr('applications', searchQuery);
      if(term)query=query.or(term);
      const { data, error, count }=await query.range(page*50,page*50+49);
      if(sequence!==readSequence.current)return;
      if (error) throw error;
      setApplications((data as PartnerApplication[]) || []);
      setTotalCount(count??null);
    } catch {
      if(sequence!==readSequence.current)return;
      setListError(true);
      setTotalCount(null);
      toast.error(language === 'ru' ? 'Ошибка' : 'Error', {
        description:
          language === 'ru'
            ? 'Не удалось загрузить заявки'
            : 'Failed to load applications',
      });
      setApplications([]);
    } finally {
      if(sequence===readSequence.current){setLoadedKey(readKey);setListLoading(false);}
    }
  }, [user?.id, isAdmin, language,statusFilter,searchQuery,page,readKey]);

  useEffect(() => {
    if (!user?.id) {
      setApplications([]);
      return;
    }
    if (!isAdmin || adminCheckLoading) return;
    void fetchApplications();
    return()=>{readSequence.current+=1;};
  }, [user?.id, isAdmin, adminCheckLoading, fetchApplications]);

  const handleStatusChange = async (newStatus: 'approved' | 'rejected' | 'reviewing') => {
    if (!selectedApp || !user) return;

    setIsProcessing(true);
    try {
      if (newStatus === 'approved' || newStatus === 'rejected') {
        throw new Error('Partner decisions are paused pending a verified atomic activation contract.');
      } else {
        // reviewing — простая смена статуса, без письма
        const patch = {
          status: newStatus,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        } satisfies Partial<PartnerApplication>;
        const { data: saved, error } = await supabase
          .from('partner_applications')
          .update(patch)
          .eq('id', selectedApp.id)
          .eq('status', 'pending')
          .select('id, status, reviewed_by, reviewed_at')
          .maybeSingle();
        if (error) throw error;
        if (!saved || saved.id !== selectedApp.id || saved.status !== 'reviewing' || saved.reviewed_by !== user.id) throw new Error('Review transition was not confirmed. Refresh before retrying.');
        setApplications(prev =>
          prev.map(app => (app.id === selectedApp.id ? { ...app, ...saved } : app)),
        );
        toast(language === 'ru' ? 'Успешно' : 'Success', {
          description: language === 'ru' ? 'Статус обновлён' : 'Status updated',
        });
      }

      setIsActionDialogOpen(false);
      setIsDetailOpen(false);
      setRejectionReason('');
      setActionType(null);
      // Refresh the exact filtered count/page after the existing writer settles.
      void fetchApplications();
    } catch {
      toast.error(language === 'ru' ? 'Ошибка' : 'Error', {
        description: language === 'ru'
          ? 'Не удалось обновить статус'
          : 'Failed to update status',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (type: 'approve' | 'reject') => {
    setActionType(type);
    setIsActionDialogOpen(true);
  };

  // Exact count and rows share the same server-side literal search and status.
  const filteredApplications = applications;

  if (!user) {
    return (
      <PageContainer>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">
              {language === 'ru' ? 'Требуется авторизация' : 'Authorization Required'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ru' 
                ? 'Пожалуйста, войдите в систему для доступа к админ-панели' 
                : 'Please log in to access the admin panel'}
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!isAdmin && !isPageLoading) {
    return (
      <PageContainer>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">
              {language === 'ru' ? 'Доступ запрещён' : 'Access Denied'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ru' 
                ? 'У вас нет прав для просмотра этой страницы' 
                : 'You do not have permission to view this page'}
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={language === 'ru' ? 'Заявки партнёров' : 'Partner Applications'}
        showBack
      />

      {/* Filters */}
      <SectionCard className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ru' ? 'Поиск по названию, имени, email...' : 'Search by name, email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="w-4 h-4 mr-2" />
                {statusFilter === 'all' 
                  ? (language === 'ru' ? 'Все статусы' : 'All statuses')
                  : statusConfig[statusFilter as keyof typeof statusConfig]?.[language === 'ru' ? 'labelRu' : 'labelEn']
                }
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                {language === 'ru' ? 'Все статусы' : 'All statuses'}
              </DropdownMenuItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <DropdownMenuItem key={key} onClick={() => setStatusFilter(key)}>
                  <config.icon className="w-4 h-4 mr-2" />
                  {language === 'ru' ? config.labelRu : config.labelEn}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setParams(previous => { const next=new URLSearchParams(previous); next.delete('status'); next.delete('q'); next.delete('application_page'); return next; })}>{pickLang(language,{en:'Reset filters',ru:'Сбросить фильтры',th:'ล้างตัวกรอง'})}</Button>
        </div>
      </SectionCard>

      {/* Applications List */}
      {!isPageLoading && !listError && <div className="mb-4 flex flex-wrap items-center gap-3">
        <p role="status">{pickLang(language,{en:'Matching applications',ru:'Подходящие заявки',th:'ใบสมัครที่ตรงกัน'})}: {totalCount ?? pickLang(language,{en:'Count unavailable',ru:'Количество недоступно',th:'จำนวนไม่พร้อมใช้งาน'})} · {pickLang(language,{en:'Page',ru:'Страница',th:'หน้า'})} {page+1}</p>
        <Button variant="outline" disabled={page===0||listLoading} onClick={()=>setPage(page-1)}>{pickLang(language,{en:'Previous',ru:'Назад',th:'ก่อนหน้า'})}</Button>
        <Button variant="outline" disabled={listLoading||totalCount==null||(page+1)*50>=totalCount} onClick={()=>setPage(page+1)}>{pickLang(language,{en:'Next',ru:'Далее',th:'ถัดไป'})}</Button>
      </div>}
      {listError && loadedKey===readKey ? <div role="alert" className="border border-destructive p-4">
        {pickLang(language,{en:'Could not load partner applications. Counts and results are unavailable.',ru:'Не удалось загрузить заявки партнёров. Счётчики и результаты недоступны.',th:'โหลดใบสมัครพันธมิตรไม่สำเร็จ จำนวนและผลลัพธ์ไม่พร้อมใช้งาน'})}
        <Button variant="outline" disabled={listLoading} onClick={()=>fetchApplications()}>{pickLang(language,{en:'Retry',ru:'Повторить',th:'ลองอีกครั้ง'})}</Button>
      </div> : isPageLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-secondary/50 rounded-none animate-pulse" />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Заявки не найдены' : 'No applications found'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredApplications.map((app, index) => {
              const status = statusConfig[app.status as KnownStatus] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-card border border-border rounded-none p-4 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedApp(app);
                    setIsDetailOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{app.business_name}</h3>
                        <Badge variant="outline" className={cn("shrink-0", status.color)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {language === 'ru' ? status.labelRu : status.labelEn}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {categoryLabels[app.business_category]?.[language] || app.business_category}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {app.contact_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(app.created_at), 'dd MMM yyyy', { 
                            locale: language === 'ru' ? ru : enUS 
                          })}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" aria-label={language === 'ru' ? 'Просмотр' : 'View'}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedApp.business_name}
                  <Badge variant="outline" className={cn((statusConfig[selectedApp.status as KnownStatus] ?? statusConfig.pending).color)}>
                    {language === 'ru'
                      ? (statusConfig[selectedApp.status as KnownStatus] ?? statusConfig.pending).labelRu
                      : (statusConfig[selectedApp.status as KnownStatus] ?? statusConfig.pending).labelEn}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {language === 'ru' ? 'Заявка от' : 'Application from'}{' '}
                  {format(new Date(selectedApp.created_at), 'dd MMMM yyyy, HH:mm', { 
                    locale: language === 'ru' ? ru : enUS 
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Business Info */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    {language === 'ru' ? 'Информация о бизнесе' : 'Business Information'}
                  </h4>
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {language === 'ru' ? 'Категория' : 'Category'}
                      </span>
                      <span className="font-medium">
                        {categoryLabels[selectedApp.business_category]?.[language] || selectedApp.business_category}
                      </span>
                    </div>
                    {selectedApp.business_description && (
                      <div>
                        <span className="text-muted-foreground block mb-1">
                          {language === 'ru' ? 'Описание' : 'Description'}
                        </span>
                        <p className="bg-secondary/50 rounded-none p-3">
                          {selectedApp.business_description}
                        </p>
                      </div>
                    )}
                    {selectedApp.license_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {language === 'ru' ? 'Номер лицензии' : 'License Number'}
                        </span>
                        <span className="font-medium">{selectedApp.license_number}</span>
                      </div>
                    )}
                    {selectedApp.tax_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {language === 'ru' ? 'ИНН' : 'Tax ID'}
                        </span>
                        <span className="font-medium">{selectedApp.tax_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {language === 'ru' ? 'Контактная информация' : 'Contact Information'}
                  </h4>
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        {language === 'ru' ? 'Контактное лицо' : 'Contact Person'}
                      </span>
                      <span className="font-medium">{selectedApp.contact_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email</span>
                      <a 
                        href={`mailto:${selectedApp.contact_email}`} 
                        className="font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {selectedApp.contact_email}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {selectedApp.contact_phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {language === 'ru' ? 'Телефон' : 'Phone'}
                        </span>
                        <a 
                          href={`tel:${selectedApp.contact_phone}`}
                          className="font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          {selectedApp.contact_phone}
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {selectedApp.website && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {language === 'ru' ? 'Веб-сайт' : 'Website'}
                        </span>
                        <a 
                          href={selectedApp.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          {selectedApp.website.replace(/^https?:\/\//, '')}
                          <Globe className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {selectedApp.address && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {language === 'ru' ? 'Адрес' : 'Address'}
                        </span>
                        <span className="font-medium">{selectedApp.address}, {selectedApp.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason */}
                {selectedApp.status === 'rejected' && selectedApp.rejection_reason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-none p-4">
                    <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {language === 'ru' ? 'Причина отклонения' : 'Rejection Reason'}
                    </h4>
                    <p className="text-sm">{selectedApp.rejection_reason}</p>
                  </div>
                )}

                <p role="status" className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Одобрение и отклонение временно приостановлены: атомарная активация партнёра не подтверждена. Решения не сохраняются, письма не отправляются.' : 'Approval and rejection are paused until atomic partner activation is verified. No decision or email is sent.'}
                </p>
                {/* Review Info */}
                {selectedApp.reviewed_at && (
                  <div className="text-sm text-muted-foreground">
                    {language === 'ru' ? 'Рассмотрено' : 'Reviewed'}:{' '}
                    {format(new Date(selectedApp.reviewed_at), 'dd MMMM yyyy, HH:mm', { 
                      locale: language === 'ru' ? ru : enUS 
                    })}
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedApp.status === 'pending' && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleStatusChange('reviewing')}
                    disabled={isProcessing}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {language === 'ru' ? 'Взять на рассмотрение' : 'Start Review'}
                  </Button>
                )}
                {(selectedApp.status === 'pending' || selectedApp.status === 'reviewing') && (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={() => openActionDialog('reject')}
                      disabled
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {language === 'ru' ? 'Отклонить' : 'Reject'}
                    </Button>
                    <Button 
                      onClick={() => openActionDialog('approve')}
                      disabled
                      className="bg-success hover:bg-success/90"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {language === 'ru' ? 'Одобрить' : 'Approve'}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' 
                ? (language === 'ru' ? 'Одобрить заявку?' : 'Approve Application?')
                : (language === 'ru' ? 'Отклонить заявку?' : 'Reject Application?')
              }
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? (language === 'ru' 
                    ? 'Партнёр получит доступ к платформе после одобрения.' 
                    : 'The partner will get access to the platform after approval.')
                : (language === 'ru' 
                    ? 'Укажите причину отклонения заявки.' 
                    : 'Please provide a reason for rejection.')
              }
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="py-4">
              <Textarea
                placeholder={language === 'ru' 
                  ? 'Причина отклонения...' 
                  : 'Reason for rejection...'}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsActionDialogOpen(false)}
              disabled={isProcessing}
            >
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              onClick={() => handleStatusChange(actionType === 'approve' ? 'approved' : 'rejected')}
              disabled
              className={actionType === 'approve' ? 'bg-success hover:bg-success/90' : ''}
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : actionType === 'approve' ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {actionType === 'approve'
                ? (language === 'ru' ? 'Одобрить' : 'Approve')
                : (language === 'ru' ? 'Отклонить' : 'Reject')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
