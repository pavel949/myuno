import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Download,
  Sparkles,
  Mail,
  Phone,
  MessageCircle,
  ChevronRight,
  Users,
  Flame,
  Thermometer,
  Snowflake,
  Database,
  Brain,
  ArrowRightCircle
} from 'lucide-react';
import { useLeadHub, LeadSource, LeadPriority, UnifiedLead } from '@/hooks/useLeadHub';
import { useLeadsFactory } from '@/hooks/useLeadsFactory';
import { APP_ROUTES } from '@/lib/config/routes';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

type ConvertLeadSource = 'consultation_requests' | 'mcc_leads';

interface ConvertLeadToDealResult {
  dealId: string;
  contactId: string;
  wasContactCreated: boolean;
}

function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '').replace(/^0/, '');
}

function mapRequestTypeToDealType(requestType: string): 'sale' | 'rent' | 'investment' | 'management' {
  const m: Record<string, 'sale' | 'rent' | 'investment' | 'management'> = {
    vacation_rental: 'rent',
    property_consultation: 'sale',
    property_tour: 'sale',
    investment_advice: 'investment',
    full_management: 'management',
    channel_management: 'management',
    long_term_rental: 'rent',
    property_purchase: 'sale',
  };
  return m[requestType] || 'sale';
}

function mapLeadSourceToClientSource(leadSource: string | null, entryPoint: string | null): string {
  if (leadSource === 'whatsapp_incoming') return 'whatsapp';
  if (leadSource === 'telegram') return 'telegram';
  if (entryPoint?.includes('whatsapp')) return 'whatsapp';
  if (entryPoint?.includes('telegram')) return 'telegram';
  if (leadSource === 'fab' || leadSource === 'cta' || leadSource === 'chat') return 'website';
  if (leadSource === 'external') return 'other';
  return leadSource || 'website';
}

function useConvertLeadToDeal() {
  const { user } = useAuth();
  const { data: membership } = useMyCompanyId();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      source,
    }: {
      leadId: string;
      source: ConvertLeadSource;
    }): Promise<ConvertLeadToDealResult> => {
      if (!user || !membership?.company_id) {
        throw new Error('User must be logged in and belong to a management company');
      }

      const companyId = membership.company_id;
      const agentId = user.id;

      let name = '';
      let phone: string | null = null;
      let email: string | null = null;
      let leadSource: string | null = null;
      let entryPoint: string | null = null;
      let requestType = '';
      let budgetMin: number | null = null;
      let budgetMax: number | null = null;
      let currency = 'THB';
      let districts: string[] | null = null;
      let propertyTypes: string[] | null = null;
      let bedroomsMin: number | null = null;
      let notes: string | null = null;

      if (source === 'consultation_requests') {
        const { data: lead, error } = await supabase
          .from('consultation_requests')
          .select('*')
          .eq('id', leadId)
          .maybeSingle();
        if (error) throw error;
        if (!lead) throw new Error('Lead not found');
        if ((lead as { status?: string }).status === 'converted') {
          throw new Error('Lead already converted');
        }
        const r = lead as {
          name: string;
          phone: string;
          email: string | null;
          lead_source: string | null;
          entry_point: string | null;
          request_type: string;
          budget_min: number | null;
          budget_max: number | null;
          currency: string | null;
          districts: string[] | null;
          property_types: string[] | null;
          bedrooms_min: number | null;
          notes: string | null;
        };
        name = r.name;
        phone = r.phone;
        email = r.email;
        leadSource = r.lead_source;
        entryPoint = r.entry_point;
        requestType = r.request_type;
        budgetMin = r.budget_min;
        budgetMax = r.budget_max;
        currency = r.currency || 'THB';
        districts = r.districts;
        propertyTypes = r.property_types;
        bedroomsMin = r.bedrooms_min;
        notes = r.notes;
      } else {
        const { data: lead, error } = await supabase
          .from('mcc_leads')
          .select('*')
          .eq('id', leadId)
          .maybeSingle();
        if (error) throw error;
        if (!lead) throw new Error('Lead not found');
        if ((lead as { status?: string }).status === 'converted') {
          throw new Error('Lead already converted');
        }
        const r = lead as {
          name: string | null;
          phone: string | null;
          email: string | null;
          source: string;
          content: string | null;
        };
        name = r.name || r.email || r.phone || 'Unknown';
        phone = r.phone;
        email = r.email;
        leadSource = r.source;
        notes = r.content;
      }

      if (!phone && !email) {
        throw new Error('Lead must have phone or email');
      }

      const phoneNorm = normalizePhone(phone);
      const clientSource = mapLeadSourceToClientSource(leadSource, entryPoint);

      // 2. Check if crm_contact exists with same phone/email
      let contactId: string | null = null;
      if (phoneNorm || email) {
        const orParts: string[] = [];
        if (phone) orParts.push(`phone.eq.${phone}`, `mobile.eq.${phone}`, `whatsapp.eq.${phone}`);
        if (email) orParts.push(`email.eq.${email}`);
        if (orParts.length > 0) {
          const { data: existing } = await supabase
            .from('crm_contacts')
            .select('id')
            .eq('company_id', companyId)
            .or(orParts.join(','))
            .limit(1)
            .maybeSingle();
          contactId = existing?.id ?? null;
        }
      }

      let wasContactCreated = false;
      if (!contactId) {
        const parts = name.trim().split(/\s+/);
        const firstName = parts[0] || name;
        const lastName = parts.slice(1).join(' ') || '';
        const { data: newContact, error: contactErr } = await supabase
          .from('crm_contacts')
          .insert({
            company_id: companyId,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            email: email || null,
            source: clientSource,
            created_by: user.id,
            notes: notes,
            preferred_districts: districts,
            preferred_types: propertyTypes,
            bedrooms_min: bedroomsMin,
            budget_min: budgetMin,
            budget_max: budgetMax,
            currency: currency,
          })
          .select('id')
          .single();
        if (contactErr) throw contactErr;
        contactId = newContact.id;
        wasContactCreated = true;
      }

      // 4. Create agent_deal
      const dealType = mapRequestTypeToDealType(requestType);
      const { data: deal, error: dealErr } = await supabase
        .from('agent_deals')
        .insert({
          company_id: companyId,
          agent_id: agentId,
          contact_id: contactId,
          client_name: name,
          client_phone: phone,
          client_email: email,
          client_source: clientSource,
          stage: 'new',
          deal_type: dealType,
          deal_status: 'active',
          budget_min: budgetMin,
          budget_max: budgetMax,
          currency: currency,
          preferred_districts: districts,
          preferred_types: propertyTypes,
          bedrooms_min: bedroomsMin,
          notes: notes,
          priority: 1,
          is_vip: false,
          tags: [],
        })
        .select('id')
        .single();
      if (dealErr) throw dealErr;
      const dealId = deal.id;

      // 5. Mark original lead as converted
      const now = new Date().toISOString();
      if (source === 'consultation_requests') {
        const { error: updateErr } = await supabase
          .from('consultation_requests')
          .update({
            status: 'converted',
            converted_at: now,
            converted_deal_id: dealId,
          })
          .eq('id', leadId);
        if (updateErr) throw updateErr;
      } else {
        const { error: updateErr } = await supabase
          .from('mcc_leads')
          .update({
            status: 'converted',
            converted_at: now,
            converted_to: dealId,
          })
          .eq('id', leadId);
        if (updateErr) throw updateErr;
      }

      // 6. Log to crm_activities
      let loggedBy = user.id;
      const { data: admin } = await supabase
        .from('management_company_members')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .in('role', ['director', 'manager', 'admin'])
        .limit(1)
        .maybeSingle();
      if (admin?.user_id) loggedBy = admin.user_id;

      await supabase.from('crm_activities').insert({
        company_id: companyId,
        contact_id: contactId,
        deal_id: dealId,
        activity_type: 'lead_converted',
        subject: `Lead converted to deal (${source})`,
        description: `Lead ${leadId} from ${source} converted to deal ${dealId}`,
        logged_by: loggedBy,
      });

      return { dealId, contactId, wasContactCreated };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['agent-deals'] });
      qc.invalidateQueries({ queryKey: ['admin-consultations'] });
      qc.invalidateQueries({ queryKey: ['lead-hub'] });
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
  });
}

export function MCCLeadsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | null>(null);
  const [sourceFilter, setSourceFilter] = useState<LeadSource>('all');

  const { leads, stats, isLoading, error } = useLeadHub({
    source: sourceFilter,
    priority: priorityFilter,
    search: searchQuery,
  });

  const { batchScoreLeads, generateFollowUp } = useLeadsFactory();
  const convertToDeal = useConvertLeadToDeal();
  const navigate = useNavigate();

  const handleWhatsApp = async (lead: UnifiedLead) => {
    if (!lead.phone) return;
    const phone = lead.phone.replace(/[^0-9+]/g, '').replace('+', '');
    
    // Try to generate AI message first
    if (lead.source_table === 'consultation_requests') {
      try {
        const result = await generateFollowUp.mutateAsync({ leadId: lead.id, channel: 'whatsapp' });
        const encoded = encodeURIComponent(result.message);
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
        return;
      } catch {
        // Fallback to simple message
      }
    }

    const fallback = encodeURIComponent(`Здравствуйте, ${lead.name}! Это UNO Properties. Мы получили вашу заявку и хотели бы обсудить детали. Когда вам удобно поговорить?`);
    window.open(`https://wa.me/${phone}?text=${fallback}`, '_blank');
  };

  const handleEmail = async (lead: UnifiedLead) => {
    if (!lead.email) return;
    
    if (lead.source_table === 'consultation_requests') {
      try {
        const result = await generateFollowUp.mutateAsync({ leadId: lead.id, channel: 'email' });
        const subject = encodeURIComponent(result.subject || 'UNO Properties');
        const body = encodeURIComponent(result.message);
        window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank');
        return;
      } catch {
        // Fallback
      }
    }

    window.open(`mailto:${lead.email}?subject=${encodeURIComponent('UNO Properties — ваша заявка')}&body=${encodeURIComponent(`Здравствуйте, ${lead.name}!\n\nСпасибо за вашу заявку.`)}`, '_blank');
  };

  const handlePhone = (lead: UnifiedLead) => {
    if (!lead.phone) return;
    window.open(`tel:${lead.phone}`, '_blank');
  };

  const handleConvertToDeal = (lead: UnifiedLead) => {
    if (lead.source_table === 'profiles') return;
    const source = lead.source_table === 'consultation_requests' ? 'consultation_requests' : 'mcc_leads';
    convertToDeal.mutate(
      { leadId: lead.id, source },
      {
        onSuccess: (result) => {
          toast.success(isRu ? 'Лид конвертирован в сделку' : 'Lead converted to deal');
          navigate(`${APP_ROUTES.MC_SALES}/${result.dealId}`);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Conversion failed');
        },
      }
    );
  };

  const handleBatchScore = () => {
    batchScoreLeads.mutate({ limit: 20 });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'hot':
        return <Badge className="bg-destructive/20 text-destructive gap-1"><Flame className="h-3 w-3" /> Hot</Badge>;
      case 'warm':
        return <Badge className="bg-warning/20 text-warning gap-1"><Thermometer className="h-3 w-3" /> Warm</Badge>;
      case 'cold':
        return <Badge className="bg-info/20 text-info gap-1"><Snowflake className="h-3 w-3" /> Cold</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-chart-1/20 text-chart-1',
      contacted: 'bg-chart-2/20 text-chart-2',
      engaged: 'bg-chart-3/20 text-chart-3',
      qualified: 'bg-chart-4/20 text-chart-4',
      converted: 'bg-success/20 text-success',
      lost: 'bg-destructive/20 text-destructive',
    };
    return <Badge className={colors[status] || 'bg-muted'} variant="secondary">{status}</Badge>;
  };

  const getSourceBadge = (lead: UnifiedLead) => {
    if (lead.source_table === 'profiles') {
      return (
        <Badge variant="outline" className="gap-1 text-xs bg-success/10 text-success">
          <Users className="h-3 w-3" />
          {lead.request_type || (isRu ? 'Пользователь' : 'User')}
        </Badge>
      );
    }
    if (lead.source_table === 'consultation_requests') {
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          <Database className="h-3 w-3" />
          {lead.request_type || 'Consultation'}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        {lead.source_channel || 'MCC'}
      </Badge>
    );
  };

  const getTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: isRu ? ru : enUS 
    });
  };

  const activateOnEnterOrSpace = (event: React.KeyboardEvent, callback: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => { setPriorityFilter(null); setSourceFilter('all'); }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => activateOnEnterOrSpace(event, () => { setPriorityFilter(null); setSourceFilter('all'); })}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Всего' : 'Total'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${priorityFilter === 'hot' ? 'ring-2 ring-destructive' : ''}`} 
          onClick={() => setPriorityFilter(priorityFilter === 'hot' ? null : 'hot')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => activateOnEnterOrSpace(event, () => setPriorityFilter(priorityFilter === 'hot' ? null : 'hot'))}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Flame className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.hot}</p>
              <p className="text-xs text-muted-foreground">Hot</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${priorityFilter === 'warm' ? 'ring-2 ring-warning' : ''}`} 
          onClick={() => setPriorityFilter(priorityFilter === 'warm' ? null : 'warm')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => activateOnEnterOrSpace(event, () => setPriorityFilter(priorityFilter === 'warm' ? null : 'warm'))}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Thermometer className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.warm}</p>
              <p className="text-xs text-muted-foreground">Warm</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${priorityFilter === 'cold' ? 'ring-2 ring-info' : ''}`} 
          onClick={() => setPriorityFilter(priorityFilter === 'cold' ? null : 'cold')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => activateOnEnterOrSpace(event, () => setPriorityFilter(priorityFilter === 'cold' ? null : 'cold'))}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Snowflake className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.cold}</p>
              <p className="text-xs text-muted-foreground">Cold</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <ChevronRight className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.converted}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Конверсии' : 'Converted'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-chart-5/10">
              <Brain className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.withAiScore}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'AI Скор' : 'AI Scored'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Stats */}
      <div className="flex gap-2 text-sm text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {isRu ? 'Зарегистрированные:' : 'Registered:'} <strong>{stats.fromRegistered}</strong>
        </span>
        <span>|</span>
        <span className="flex items-center gap-1">
          <Database className="h-4 w-4" />
          {isRu ? 'Консультации:' : 'Consultations:'} <strong>{stats.fromConsultations}</strong>
        </span>
        <span>|</span>
        <span>
          MCC Leads: <strong>{stats.fromMCC}</strong>
        </span>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск по имени, email, телефону...' : 'Search by name, email, phone...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as LeadSource)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={isRu ? 'Источник' : 'Source'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRu ? 'Все источники' : 'All Sources'}</SelectItem>
              <SelectItem value="registered">{isRu ? 'Зарегистрированные' : 'Registered'}</SelectItem>
              <SelectItem value="consultations">{isRu ? 'Консультации' : 'Consultations'}</SelectItem>
              <SelectItem value="mcc">MCC Leads</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleBatchScore} disabled={batchScoreLeads.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            {batchScoreLeads.isPending ? (isRu ? 'Скоринг...' : 'Scoring...') : (isRu ? 'AI Скоринг' : 'AI Score')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {isRu ? 'Экспорт' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              {isRu ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-destructive">
                {isRu ? 'Не удалось загрузить лиды' : 'Failed to load leads'}
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                {isRu ? 'Повторить' : 'Retry'}
              </Button>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {isRu ? 'Лиды не найдены' : 'No leads found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-sm">{isRu ? 'Лид' : 'Lead'}</th>
                    <th className="text-left p-4 font-medium text-sm">{isRu ? 'Источник' : 'Source'}</th>
                    <th className="text-left p-4 font-medium text-sm">{isRu ? 'Приоритет' : 'Priority'}</th>
                    <th className="text-left p-4 font-medium text-sm">{isRu ? 'Статус' : 'Status'}</th>
                    <th className="text-left p-4 font-medium text-sm">{isRu ? 'AI Скор' : 'AI Score'}</th>
                    <th className="text-left p-4 font-medium text-sm">{isRu ? 'Время' : 'Time'}</th>
                    <th className="text-left p-4 font-medium text-sm">{isRu ? 'Действия' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={`${lead.source_table}-${lead.id}`} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary">
                            {lead.name?.charAt(0) || lead.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{lead.name || 'Unknown'}</p>
                              {lead.user_id && (
                                <Badge variant="outline" className="text-xs bg-success/10 text-success">
                                  {isRu ? 'Зарег.' : 'Registered'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getSourceBadge(lead)}
                      </td>
                      <td className="p-4">
                        {getPriorityBadge(lead.priority)}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="p-4">
                        {lead.ai_score !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-chart-5 rounded-full"
                                style={{ width: `${lead.ai_score}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{lead.ai_score}</span>
                            {lead.ai_reasoning && (
                            <span title={lead.ai_reasoning || undefined}>
                              <Sparkles className="h-3 w-3 text-chart-5" />
                            </span>
                            )}
                          </div>
                        ) : lead.score !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${lead.score}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{lead.score}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(lead.created_at)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 items-center">
                          {lead.source_table !== 'profiles' && lead.status !== 'converted' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1 h-8"
                              onClick={() => handleConvertToDeal(lead)}
                              disabled={convertToDeal.isPending}
                              title={isRu ? 'Конвертировать в сделку' : 'Convert to deal'}
                            >
                              <ArrowRightCircle className="h-3.5 w-3.5" />
                              {isRu ? 'В сделку' : 'Deal'}
                            </Button>
                          )}
                          {lead.email && (
                            <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-8 sm:w-8" onClick={() => handleEmail(lead)} title={isRu ? 'Написать email' : 'Send email'} aria-label={isRu ? 'Написать email' : 'Send email'}>
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          {lead.phone && (
                            <>
                              <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-8 sm:w-8" onClick={() => handlePhone(lead)} title={isRu ? 'Позвонить' : 'Call'} aria-label={isRu ? 'Позвонить' : 'Call'}>
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-8 sm:w-8" onClick={() => handleWhatsApp(lead)} title="WhatsApp" aria-label="WhatsApp">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
