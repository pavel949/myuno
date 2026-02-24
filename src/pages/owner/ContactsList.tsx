import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { useCrmContacts, CONTACT_TYPES, CONTACT_TAGS } from '@/hooks/useCrmContacts';
import { useUserRoles } from '@/hooks/useUserRoles';
import { maskPhone } from '@/lib/contactProtection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Phone, Mail, ChevronRight, Filter, UserCircle, ChevronLeft, Upload, Lock } from 'lucide-react';
import { CreateContactSheet } from '@/components/owner/contacts/CreateContactSheet';
import { ContactExportButton } from '@/components/owner/contacts/ContactExportButton';
import { ContactImportSheet } from '@/components/owner/contacts/ContactImportSheet';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

// Avatar color palette based on name hash
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
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Reset page when filters change
  const handleSearchChange = (v: string) => { setSearch(v); setPage(0); };
  const handleTypeChange = (v: string | null) => { setTypeFilter(v); setPage(0); };
  const handleTagChange = (v: string | null) => { setTagFilter(v); setPage(0); };

  const { data: result, isLoading } = useCrmContacts(companyId, page, PAGE_SIZE, {
    search: search.trim(),
    contactType: typeFilter || undefined,
    tag: tagFilter || undefined,
  });
  const contacts = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRu ? 'Поиск по имени, телефону, email...' : 'Search by name, phone, email...'}
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter toggle */}
      <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="text-xs">
        <Filter className="h-3 w-3 mr-1" />
        {isRu ? 'Фильтры' : 'Filters'}
        {(typeFilter || tagFilter) && <Badge variant="secondary" className="ml-1 text-[10px]">!</Badge>}
      </Button>

      {showFilters && (
        <div className="space-y-3">
          {/* Type section */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{isRu ? 'Тип' : 'Type'}</p>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => handleTypeChange(null)}
                className={cn('px-2 py-0.5 text-xs rounded-full border', !typeFilter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                {isRu ? 'Все' : 'All'}
              </button>
              {CONTACT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(typeFilter === t ? null : t)}
                  className={cn('px-2 py-0.5 text-xs rounded-full border', typeFilter === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {/* Tags section */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{isRu ? 'Теги' : 'Tags'}</p>
            <div className="flex flex-wrap gap-1">
              {CONTACT_TAGS.map(t => (
                <button
                  key={t}
                  onClick={() => handleTagChange(tagFilter === t ? null : t)}
                  className={cn('px-2 py-0.5 text-xs rounded-full border', tagFilter === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {totalCount > 0 ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} ${isRu ? 'из' : 'of'} ${totalCount}` : '0'} {isRu ? 'контактов' : 'contacts'}
      </p>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12">
          <UserCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{isRu ? 'Контакты не найдены' : 'No contacts found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {contacts.map(contact => {
            const avatarColor = getAvatarColor(contact.first_name + contact.last_name);
            return (
              <button
                key={contact.id}
                onClick={() => navigate(`/owner/contacts/${contact.id}`)}
                className="w-full text-left p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors flex items-center gap-3"
              >
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", avatarColor)}>
                  <span className="text-sm font-semibold">
                    {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{contact.first_name} {contact.last_name}</span>
                    {contact.contact_type && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">{contact.contact_type}</Badge>
                    )}
                    {contact.tags?.includes('VIP') && (
                      <Badge variant="default" className="text-[10px] shrink-0">VIP</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {isOwnerOrAdmin ? contact.phone : (
                          <span className="flex items-center gap-0.5">
                            {maskPhone(contact.phone)}
                            <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
                          </span>
                        )}
                      </span>
                    )}
                    {contact.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{contact.email}</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </button>
            );
          })}
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
