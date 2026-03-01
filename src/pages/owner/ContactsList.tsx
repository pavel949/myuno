import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { useCrmContacts, CrmContact, CONTACT_TYPES, CONTACT_SOURCES } from '@/hooks/useCrmContacts';
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
import { Plus, Search, Phone, Mail, ChevronRight, Filter, UserCircle, ChevronLeft, Upload, Lock, Star, MessageSquare, DollarSign, MapPin, Briefcase, Clock, ArrowUpDown } from 'lucide-react';
import { CreateContactSheet } from '@/components/owner/contacts/CreateContactSheet';
import { ContactExportButton } from '@/components/owner/contacts/ContactExportButton';
import { ContactImportSheet } from '@/components/owner/contacts/ContactImportSheet';
import { cn } from '@/lib/utils';

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

const SORT_OPTIONS = [
  { value: 'updated_at', labelEn: 'Last Updated', labelRu: 'Обновлён' },
  { value: 'created_at', labelEn: 'Created', labelRu: 'Создан' },
  { value: 'first_name', labelEn: 'Name', labelRu: 'Имя' },
  { value: 'scoring', labelEn: 'Scoring', labelRu: 'Скоринг' },
] as const;

function ContactCard({ contact, isOwnerOrAdmin, onClick }: { contact: CrmContact; isOwnerOrAdmin: boolean; onClick: () => void }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const avatarColor = getAvatarColor(contact.first_name + contact.last_name);
  const fullName = `${contact.first_name} ${contact.last_name}`.trim();
  const scoring = contact.scoring;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border bg-card hover:bg-accent/30 transition-all hover:shadow-md group"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0 text-base font-semibold", avatarColor)}>
            {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
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
          <LifecycleStageBar currentStage={(contact as any).lifecycle_stage || 'lead'} compact readonly />
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1 mt-2">
          {contact.contact_type && (
            <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5 border font-semibold uppercase', typeBadgeColors[contact.contact_type] || '')}>
              {contact.contact_type}
            </Badge>
          )}
          {contact.source && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
              {contact.source}
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
  const isOwnerOrAdmin = roles.some(r => r.role === 'admin' || r.role === 'owner');
  const { data: membership } = useMyCompanyId();
  const companyId = membership?.company_id;

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [lifecycleFilter, setLifecycleFilter] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>('updated_at');

  const handleSearchChange = (v: string) => { setSearch(v); setPage(0); };
  const handleTypeChange = (v: string | null) => { setTypeFilter(v); setPage(0); };
  const handleSourceChange = (v: string | null) => { setSourceFilter(v); setPage(0); };
  const handleTagChange = (v: string | null) => { setTagFilter(v); setPage(0); };
  const handleLifecycleChange = (v: string | null) => { setLifecycleFilter(v); setPage(0); };

  const { data: result, isLoading } = useCrmContacts(companyId, page, PAGE_SIZE, {
    search: search.trim(),
    contactType: typeFilter || undefined,
    tag: tagFilter || undefined,
    source: sourceFilter || undefined,
    lifecycleStage: lifecycleFilter || undefined,
    sortBy: sortBy as any,
  });
  const contacts = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const activeFiltersCount = [typeFilter, sourceFilter, tagFilter, lifecycleFilter].filter(Boolean).length;

  if (!companyId) {
    return (
      <div className="p-4 md:p-6 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-muted-foreground">{isRu ? 'Вы не состоите в управляющей компании' : 'You are not a member of a management company'}</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-4 pb-24 md:pb-8 max-w-[1536px] mx-auto w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{isRu ? 'Контакты' : 'Contacts'}</h1>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">{totalCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ContactExportButton contacts={contacts} />
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-1" />
            {isRu ? 'Импорт' : 'Import'}
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {isRu ? 'Новый' : 'New'}
          </Button>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск по имени, телефону, email...' : 'Search by name, phone, email...'}
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-9"
          />
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
              <button onClick={() => handleTypeChange(null)} className={cn('px-2 py-0.5 text-xs rounded-full border', !typeFilter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{isRu ? 'Все' : 'All'}</button>
              {CONTACT_TYPES.map(t => (
                <button key={t} onClick={() => handleTypeChange(typeFilter === t ? null : t)} className={cn('px-2 py-0.5 text-xs rounded-full border', typeFilter === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{t}</button>
              ))}
            </div>
          </div>

          {/* Source filter */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{isRu ? 'Источник' : 'Source'}</p>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => handleSourceChange(null)} className={cn('px-2 py-0.5 text-xs rounded-full border', !sourceFilter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{isRu ? 'Все' : 'All'}</button>
              {CONTACT_SOURCES.map(s => (
                <button key={s} onClick={() => handleSourceChange(sourceFilter === s ? null : s)} className={cn('px-2 py-0.5 text-xs rounded-full border', sourceFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{s}</button>
              ))}
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

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12">
          <UserCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{isRu ? 'Контакты не найдены' : 'No contacts found'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {isRu ? 'Добавить контакт' : 'Add contact'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {contacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              isOwnerOrAdmin={isOwnerOrAdmin}
              onClick={() => navigate(`/mc/contacts/${contact.id}`)}
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
        <>
          <CreateContactSheet open={showCreate} onOpenChange={setShowCreate} companyId={companyId} />
          <ContactImportSheet open={showImport} onOpenChange={setShowImport} companyId={companyId} />
        </>
      )}
    </div>
  );
}
