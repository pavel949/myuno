import { useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useTeamPermissions } from '@/hooks/useTeamPermissions';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/contexts/AuthContext';
import { usePropertyComplexes, type PropertyComplex } from '@/hooks/usePropertyComplexes';
import { ComplexCard } from '@/components/owner/ComplexCard';
import { ComplexFormDialog } from '@/components/owner/ComplexFormDialog';
import { ManagedComplexDrafts } from '@/components/owner/ManagedComplexDrafts';
import { Skeleton } from '@/components/ui/skeleton';
import { pickLang } from '@/lib/i18n/pickLang';

export default function ComplexesPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const { canAccess } = useTeamPermissions();
  const { hasRole } = useUserRoles();
  const text = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  const companyManager = !!activeCompany && ['director', 'admin', 'manager'].includes(activeCompany.role) && canAccess('properties', 'view') && canAccess('properties', 'edit');
  const { data: complexes, isLoading, error, refetch } = usePropertyComplexes({ companyId: activeCompany?.company_id, includeCompany: companyManager, platformAdmin: hasRole('admin') });
  const [search, setSearch] = useState('');
  const [editContext, setEditContext] = useState<{ row: PropertyComplex; actorId?: string; companyId?: string } | null>(null);
  const editing = editContext?.actorId === user?.id && editContext?.companyId === activeCompany?.company_id ? editContext?.row : null;
  // Employee-created records always use the checked form, even for dual-role users.
  const filtered = (complexes || []).filter(complex => !complex.approval_status).filter(complex => {
    const query = search.toLowerCase();
    return !query || complex.name.toLowerCase().includes(query) || complex.name_ru?.toLowerCase().includes(query) || complex.district?.toLowerCase().includes(query);
  });

  return <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
    <div>
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Building2 className="h-6 w-6 shrink-0 text-primary" />{text('Property Complexes', 'Жилые комплексы', 'โครงการที่พักอาศัย')}</h1>
      <p className="text-sm text-muted-foreground mt-1">{text('Complex content and publication review.', 'Данные комплексов и проверка перед публикацией.', 'ข้อมูลโครงการและการตรวจสอบก่อนเผยแพร่')}</p>
    </div>
    <ManagedComplexDrafts />
    <section className="space-y-4">
      <h2 className="font-semibold">{text('Existing complexes you manage', 'Существующие комплексы в вашем управлении', 'โครงการเดิมที่คุณดูแล')}</h2>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input aria-label={text('Search complexes', 'Поиск комплексов', 'ค้นหาโครงการ')} placeholder={text('Search by name or district…', 'Поиск по названию или району…', 'ค้นหาตามชื่อหรือพื้นที่…')} value={search} onChange={event => setSearch(event.target.value)} className="pl-9" />
      </div>
      {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(index => <Skeleton key={index} className="h-64 rounded-none" />)}</div>
        : error ? <div role="alert" className="space-y-2"><p>{text('Existing complexes could not be loaded.', 'Не удалось загрузить существующие комплексы.', 'โหลดโครงการเดิมไม่ได้')}</p><Button variant="outline" onClick={() => void refetch()}>{text('Retry', 'Повторить', 'ลองอีกครั้ง')}</Button></div>
          : filtered.length === 0 ? <p className="py-6 text-muted-foreground">{text('No existing complexes available to manage.', 'Нет существующих комплексов, доступных для управления.', 'ไม่มีโครงการเดิมที่คุณสามารถดูแลได้')}</p>
            : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(complex => <ComplexCard key={complex.id} complex={complex} onClick={() => setEditContext({ row: complex, actorId: user?.id, companyId: activeCompany?.company_id })} />)}</div>}
    </section>
    {editing && <ComplexFormDialog key={`${user?.id}:${activeCompany?.company_id}:${editing.id}`} open onOpenChange={value => { if (!value) setEditContext(null); }} complex={editing} />}
  </div>;
}
