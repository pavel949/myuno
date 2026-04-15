import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { useCrmContacts, CrmContact } from '@/hooks/useCrmContacts';
import { useCrmOptions, type CrmCustomOption } from '@/hooks/useCrmSettings';
import { resolveCrmOptionLabel, findCrmOption } from '@/lib/crmOptionLabels';
import { useContactTags } from '@/hooks/useContactTags';
import { ContactTagsDisplay } from '@/components/owner/contacts/ContactTagPicker';
import { useUserRoles } from '@/hooks/useUserRoles';
import { maskPhone } from '@/lib/contactProtection';
import { LifecycleStageBar, LIFECYCLE_STAGES } from '@/components/owner/contacts/LifecycleStageBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Phone, Mail, ChevronRight, Filter, UserCircle, ChevronLeft, Upload, Lock, Star, MessageSquare, DollarSign, Briefcase, Clock, ArrowUpDown, LayoutGrid, List, Users } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { useDuplicatesQuery } from '@/hooks/useCrmDuplicates';
import { CreateContactSheet } from '@/components/owner/contacts/CreateContactSheet';
import { ContactExportButton } from '@/components/owner/contacts/ContactExportButton';
import { cn } from '@/lib/utils';
import { CRM_ROLES, CRM_ROLE_LABELS, type CrmRole } from '@/types/contact';

const PAGE_SIZE = 24;

const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-info/15 text-info',
  'bg-success/15 text-success',
  'bg-warning/15 text-warning',
  'bg-destructive/15 text-destructive',
  'bg-accent text-accent-foreground',
];

function getAvatarColor(name: string): string {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

const typeBadgeColors: Record<string, string> = {
  buyer: 'bg-primary/15 text-primary border-primary/30',
  seller: 'bg-success/15 text-success border-success/30',
  investor: 'bg-warning/15 text-warning border-warning/30',
  tenant: 'bg-info/15 text-info border-info/30',
  landlord: 'bg-accent text-accent-foreground border-accent/30',
  agent: 'bg-muted text-muted-foreground border-border',
};

const LEAD_TEMPERATURE_OPTIONS = [
  { value: 'hot', labelEn: 'Hot', labelRu: 'Горячий' },
  { value: 'warm', labelEn: 'Warm', labelRu: 'Тёплый' },
  { value: 'cold', labelEn: 'Cold', labelRu: 'Холодный' },
] as const;

const SORT_OPTIONS = [
  { value: 'updated_at', labelEn: 'Last Updated', labelRu: 'Обновлён' },
  { value: 'created_at', labelEn: 'Created', labelRu: 'Создан' },
  { value: 'first_name', labelEn: 'Name', labelRu: 'Имя' },
  { value: 'scoring', labelEn: 'Scoring', labelRu: 'Скоринг' },
] as const;

function ContactCard({
  contact,
  isOwnerOrAdmin,
  onClick,
  contactTypeOptions,
  leadSourceOptions,
}: {
  contact: CrmContact;
  isOwnerOrAdmin: boolean;
  onClick: () => void;
  contactTypeOptions: CrmCustomOption[];
  leadSourceOptions: CrmCustomOption[];
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const firstName = contact.first_name ?? '';
  const lastName = contact.last_name ?? '';
  const avatarColor = getAvatarColor(firstName + lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const scoring = contact.scoring;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border bg-card hover:bg-accent/30 transition-all hover:shadow-md group"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0 text-base font-semibold", avatarColor)}>
            {firstName.charAt(0) || '?'}{lastName.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight line-clamp-2">{fullName}</p>
            {contact.company_name && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                <Briefcase className="h-3 w-3 shrink-0" />
                {contact.company_name}
              </p>
            )}
            {contact.job_title && !contact.company_name && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{contact.job_title}</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
        </div>

        {/* Lifecycle stage compact */}
        <div className="mt-2">
          <LifecycleStageBar currentStage={contact.lifecycle_stage ?? 'lead'} compact readonly />
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1 mt-2">
          {contact.contact_type && (() => {
            const opt = findCrmOption(contact.contact_type, contactTypeOptions);
            const label = resolveCrmOptionLabel(contact.contact_type, contactTypeOptions, isRu) || contact.contact_type;
            return (
              <Badge
                variant="outline"
                className={cn('text-[9px] h-4 px-1.5 border font-semibold uppercase', !opt?.color && typeBadgeColors[contact.contact_type])}
                style={opt?.color ? { borderColor: opt.color, color: opt.color } : undefined}
              >
                {label}
              </Badge>
            );
          })()}
          {contact.source && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border" title={contact.source}>
              {resolveCrmOptionLabel(contact.source, leadSourceOptions, isRu) || contact.source}
            </Badge>
          )}
          <ContactTagsDisplay tags={contact.tags || []} companyId={contact.company_id} max={2} />
        </div>

        {/* Contact info */}
        <div className="mt-2 space-y-1">
          {contact.email && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
              <Mail className="h-3 w-3 shrink-0" />
              {contact.email}
            </p>
          )}
          {contact.phone && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
              <Phone className="h-3 w-3 shrink-0" />
              {isOwnerOrAdmin ? contact.phone : (
                <span className="flex items-center gap-0.5">
                  {maskPhone(contact.phone)}
                  <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 rounded-b-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map(i => (
              <Star
                key={i}
                className={cn('h-3 w-3', scoring !== null && scoring >= i * 33 ? 'fill-warning text-warning' : 'text-muted-foreground/30')}
              />
            ))}
          </div>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <MessageSquare className="h-3 w-3" /> {contact.deal_count ?? 0}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <DollarSign className="h-3 w-3" /> {contact.budget_max ? `${(contact.budget_max / 1e6).toFixed(1)}M` : '0'}
          </span>
        </div>
        <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
    </button>
  );
}

function ContactListRow({
  contact,
  isOwnerOrAdmin,
  onClick,
  contactTypeOptions,
}: {
  contact: CrmContact;
  isOwnerOrAdmin: boolean;
  onClick: () => void;
  contactTypeOptions: CrmCustomOption[];
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const firstName = contact.first_name ?? '';
  const lastName = contact.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const typeKey = contact.contact_type ?? '';
  const typeOpt = findCrmOption(typeKey || undefined, contactTypeOptions);
  const typeLabel = typeKey
    ? (resolveCrmOptionLabel(typeKey, contactTypeOptions, isRu) || typeKey)
    : '—';
  const avatarColor = getAvatarColor(firstName + lastName);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors text-left"
    >
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold', avatarColor)}>
        {firstName.charAt(0) || '?'}{lastName.charAt(0) || '?'}
      </div>
      <div className="min-w-0 flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-1">
        <div className="col-span-2 md:col-span-1">
          <p className="font-medium text-sm truncate">{fullName}</p>
          {(contact.company_name || contact.job_title) && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Briefcase className="h-3 w-3 shrink-0" />
              {contact.company_name || contact.job_title}
            </p>
          )}
          <div className="mt-1 md:hidden">
            <LifecycleStageBar currentStage={contact.lifecycle_stage ?? 'lead'} compact readonly />
          </div>
        </div>
        <div className="hidden sm:block">
          <Badge
            variant="outline"
            className={cn('text-[10px] h-5', !typeOpt?.color && typeBadgeColors[contact.contact_type ?? ''])}
            style={typeOpt?.color ? { borderColor: typeOpt.color, color: typeOpt.color } : undefined}
          >
            {typeLabel}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {contact.phone ? (isOwnerOrAdmin ? contact.phone : maskPhone(contact.phone)) : '—'}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {contact.email || '—'}
        </div>
        <div className="hidden md:block">
          <LifecycleStageBar currentStage={contact.lifecycle_stage ?? 'lead'} compact readonly />
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function TagFilterChips({ companyId, tagFilter, onTagChange }: { companyId?: string; tagFilter: string | null; onTagChange: (v: string | null) => void }) {
  const { data: tags = [] } = useContactTags(companyId);
  if (!tags.length) return <p className="text-xs text-muted-foreground">—</p>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(t => (
        <button
          key={t.id}
          onClick={() => onTagChange(tagFilter === t.name ? null : t.name)}
          className={cn('px-2 py-0.5 text-xs rounded-full border transition-colors', tagFilter === t.name ? 'text-primary-foreground' : 'text-muted-foreground')}
          style={tagFilter === t.name ? { backgroundColor: t.color, borderColor: t.color, color: 'white' } : { borderColor: `${t.color}40` }}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}

export default function ContactsList() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const safeRoles = roles ?? [];
  const isOwnerOrAdmin = safeRoles.some(r => r.role === 'admin' || r.role === 'owner');
  const { data: membership } = useMyCompanyId();
  const companyId = membership?.company_id;

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [lifecycleFilter, setLifecycleFilter] = useState<string | null>(null);
  const [vipFilter, setVipFilter] = useState<'all' | 'vip' | 'standard'>('all');
  const [leadTempFilter, setLeadTempFilter] = useState<string | null>(null);
  const [crmRoleFilter, setCrmRoleFilter] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSearchChange = (v: string) => { setSearch(v); setPage(0); };
  const handleTypeChange = (v: string | null) => { setTypeFilter(v); setPage(0); };
  const handleSourceChange = (v: string | null) => { setSourceFilter(v); setPage(0); };
  const handleTagChange = (v: string | null) => { setTagFilter(v); setPage(0); };
  const handleLifecycleChange = (v: string | null) => { setLifecycleFilter(v); setPage(0); };
  const handleVipChange = (v: 'all' | 'vip' | 'standard') => { setVipFilter(v); setPage(0); };
  const handleLeadTempChange = (v: string | null) => { setLeadTempFilter(v); setPage(0); };
  const handleCrmRoleChange = (v: string | null) => { setCrmRoleFilter(v); setPage(0); };

  const { data: contactTypeOptions = [] } = useCrmOptions(companyId, 'contact_type');
  const { data: leadSourceOptions = [] } = useCrmOptions(companyId, 'lead_source');
  const activeContactTypeOptions = contactTypeOptions.filter((o) => o.is_active !== false);
  const activeLeadSourceOptions = leadSourceOptions.filter((o) => o.is_active !== false);

  const { data: duplicatesData } = useDuplicatesQuery(companyId, !!companyId);
  const duplicatePairsCount = duplicatesData?.total ?? 0;

  const { data: result, isLoading, isError, error, refetch } = useCrmContacts(companyId, page, PAGE_SIZE, {
    search: search.trim(),
    contactType: typeFilter || undefined,
    tag: tagFilter || undefined,
    source: sourceFilter || undefined,
    lifecycleStage: lifecycleFilter || undefined,
    sortBy,
    vip: vipFilter === 'all' ? undefined : vipFilter,
    leadTemperature: leadTempFilter || undefined,
    crmRole: crmRoleFilter || undefined,
  });
  const contacts = result?.data ?? [];
  const totalCount = result?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const activeFiltersCount =
    [typeFilter, sourceFilter, tagFilter, lifecycleFilter, leadTempFilter, crmRoleFilter].filter(Boolean).length +
    (vipFilter !== 'all' ? 1 : 0);

  if (!companyId) {
    return (
      <div className="p-4 md:p-6 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-muted-foreground">{isRu ? 'Вы не состоите в управляющей компании' : 'You are not a member of a management company'}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-destructive font-medium">{isRu ? 'Ошибка загрузки контактов' : 'Failed to load contacts'}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : String(error)}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => refetch()}
        >
          {isRu ? 'Повторить' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-4 pb-24 md:pb-8 max-w-[1536px] mx-auto w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{isRu ? 'Контакты' : 'Contacts'}</h1>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">{totalCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap md:justify-end">
          <Button variant="outline" size="sm" onClick={() => navigate(APP_ROUTES.MC_CONTACTS_DUPLICATES)}>
            <Users className="h-4 w-4 mr-1" />
            {isRu ? 'Дубликаты' : 'Review Duplicates'}
            {duplicatePairsCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                {duplicatePairsCount}
              </Badge>
            )}
          </Button>
          <ContactExportButton contacts={contacts} />
          <Button variant="default" size="sm" onClick={() => navigate(APP_ROUTES.MC_CONTACTS_IMPORT)} className="font-semibold">
            <Upload className="h-4 w-4 mr-1" />
            {isRu ? 'Импорт контактов' : 'Import Contacts'}
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {isRu ? 'Новый' : 'New'}
          </Button>
        </div>
      </div>

      {/* Type chips — из crm_custom_options (как в формах), включая кастомные типы */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground mr-1">{isRu ? 'Тип:' : 'Type:'}</span>
        <button
          onClick={() => handleTypeChange(null)}
          className={cn(
            'px-2.5 py-1 text-xs rounded-full border transition-colors',
            !typeFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}
        >
          {isRu ? 'Все' : 'All'}
        </button>
        {activeContactTypeOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => handleTypeChange(typeFilter === o.value ? null : o.value)}
            className={cn(
              'px-2.5 py-1 text-xs rounded-full border transition-colors max-w-[160px] truncate',
              typeFilter === o.value ? typeBadgeColors[o.value] || 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
            style={typeFilter === o.value && o.color ? { borderColor: o.color } : undefined}
            title={isRu ? o.label_ru : o.label_en}
          >
            {isRu ? o.label_ru : o.label_en}
          </button>
        ))}
      </div>

      {/* Search + Sort + View mode */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск по имени, телефону, email...' : 'Search by name, phone, email...'}
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 border rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn('p-1.5 rounded', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
            title={isRu ? 'Сетка' : 'Grid'}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn('p-1.5 rounded', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
            title={isRu ? 'Список' : 'List'}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{isRu ? s.labelRu : s.labelEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter toggle + pagination info */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="text-xs">
          <Filter className="h-3 w-3 mr-1" />
          {isRu ? 'Фильтры' : 'Filters'}
          {activeFiltersCount > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{activeFiltersCount}</Badge>}
        </Button>
        <p className="text-xs text-muted-foreground">
          {totalCount > 0 ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} ${isRu ? 'из' : 'of'} ${totalCount}` : '0'}
        </p>
      </div>

      {showFilters && (
        <div className="space-y-3 p-3 rounded-xl border bg-card">
          {/* Type filter */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{isRu ? 'Тип' : 'Type'}</p>
            <div className="flex flex-wrap gap-1">
              <button type="button" onClick={() => handleTypeChange(null)} className={cn('px-2 py-0.5 text-xs rounded-full border', !typeFilter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{isRu ? 'Все' : 'All'}</button>
              {activeContactTypeOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleTypeChange(typeFilter === o.value ? null : o.value)}
                  className={cn('px-2 py-0.5 text-xs rounded-full border max-w-[140px] truncate', typeFilter === o.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                  title={isRu ? o.label_ru : o.label_en}
                >
                  {isRu ? o.label_ru : o.label_en}
                </button>
              ))}
            </div>
          </div>

          {/* Source filter — lead_source из CRM (включая кастомные) */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{isRu ? 'Источник' : 'Source'}</p>
            <div className="flex flex-wrap gap-1">
              <button type="button" onClick={() => handleSourceChange(null)} className={cn('px-2 py-0.5 text-xs rounded-full border', !sourceFilter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{isRu ? 'Все' : 'All'}</button>
              {activeLeadSourceOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSourceChange(sourceFilter === o.value ? null : o.value)}
                  className={cn('px-2 py-0.5 text-xs rounded-full border max-w-[140px] truncate', sourceFilter === o.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                  title={`${isRu ? o.label_ru : o.label_en} (${o.value})`}
                >
                  {isRu ? o.label_ru : o.label_en}
                </button>
              ))}
            </div>
          </div>

          {/* VIP + lead temperature + CRM role (маркетинг / продажи) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">VIP</p>
              <div className="flex flex-wrap gap-1">
                {(['all', 'vip', 'standard'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleVipChange(k)}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full border',
                      vipFilter === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {k === 'all' ? (isRu ? 'Все' : 'All') : k === 'vip' ? 'VIP' : (isRu ? 'Не VIP' : 'Non-VIP')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{isRu ? 'Темп. лида' : 'Lead temp.'}</p>
              <div className="flex flex-wrap gap-1">
                <button type="button" onClick={() => handleLeadTempChange(null)} className={cn('px-2 py-0.5 text-xs rounded-full border', !leadTempFilter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{isRu ? 'Все' : 'All'}</button>
                {LEAD_TEMPERATURE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => handleLeadTempChange(leadTempFilter === o.value ? null : o.value)}
                    className={cn('px-2 py-0.5 text-xs rounded-full border', leadTempFilter === o.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                  >
                    {isRu ? o.labelRu : o.labelEn}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{isRu ? 'Роль CRM' : 'CRM role'}</p>
              <div className="flex flex-wrap gap-1">
                <button type="button" onClick={() => handleCrmRoleChange(null)} className={cn('px-2 py-0.5 text-xs rounded-full border', !crmRoleFilter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{isRu ? 'Все' : 'All'}</button>
                {CRM_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleCrmRoleChange(crmRoleFilter === r ? null : r)}
                    className={cn('px-2 py-0.5 text-xs rounded-full border max-w-[120px] truncate', crmRoleFilter === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                    title={isRu ? CRM_ROLE_LABELS[r as CrmRole].ru : CRM_ROLE_LABELS[r as CrmRole].en}
                  >
                    {isRu ? CRM_ROLE_LABELS[r as CrmRole].ru : CRM_ROLE_LABELS[r as CrmRole].en}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lifecycle filter */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{isRu ? 'Стадия' : 'Lifecycle'}</p>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => handleLifecycleChange(null)} className={cn('px-2 py-0.5 text-xs rounded-full border', !lifecycleFilter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{isRu ? 'Все' : 'All'}</button>
              {LIFECYCLE_STAGES.map(s => (
                <button key={s.key} onClick={() => handleLifecycleChange(lifecycleFilter === s.key ? null : s.key)} className={cn('px-2 py-0.5 text-xs rounded-full border', lifecycleFilter === s.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{isRu ? s.ru : s.en}</button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{isRu ? 'Теги' : 'Tags'}</p>
            <TagFilterChips companyId={companyId} tagFilter={tagFilter} onTagChange={handleTagChange} />
          </div>
        </div>
      )}

      {/* Grid or List */}
      {isLoading ? (
        viewMode === 'list' ? (
          <div className="space-y-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
          </div>
        )
      ) : contacts.length === 0 ? (
        <div className="text-center py-12">
          <UserCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{isRu ? 'Контакты не найдены' : 'No contacts found'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {isRu ? 'Добавить контакт' : 'Add contact'}
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-1.5">
          {/* List header (desktop) */}
          <div className="hidden md:grid grid-cols-[auto_1fr] gap-3 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <div className="w-10" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4">
              <span>{isRu ? 'Имя / Компания' : 'Name / Company'}</span>
              <span>{isRu ? 'Тип' : 'Type'}</span>
              <span>{isRu ? 'Телефон' : 'Phone'}</span>
              <span className="hidden md:inline">{isRu ? 'Email' : 'Email'}</span>
              <span className="hidden lg:inline">{isRu ? 'Стадия' : 'Stage'}</span>
            </div>
          </div>
          {contacts.map(contact => (
            <ContactListRow
              key={contact.id}
              contact={contact}
              isOwnerOrAdmin={isOwnerOrAdmin}
              contactTypeOptions={activeContactTypeOptions}
              onClick={() => navigate(APP_ROUTES.MC_CONTACT_DETAIL(contact.id))}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {contacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              isOwnerOrAdmin={isOwnerOrAdmin}
              contactTypeOptions={activeContactTypeOptions}
              leadSourceOptions={activeLeadSourceOptions}
              onClick={() => navigate(APP_ROUTES.MC_CONTACT_DETAIL(contact.id))}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {companyId && (
        <CreateContactSheet open={showCreate} onOpenChange={setShowCreate} companyId={companyId} />
      )}
    </div>
  );
}
