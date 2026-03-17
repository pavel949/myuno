import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCrmCompanies, useCreateCrmCompany, useDeleteCrmCompany, COMPANY_INDUSTRIES, CrmCompanyEntity } from '@/hooks/useCrmCompanies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Building2, Plus, Search, Users, Globe, Trash2, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CrmCompaniesPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const { user } = useAuth();
  const navigate = useNavigate();
  const companyId = activeCompany?.company_id;
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: companies = [], isLoading, isError: companiesError, refetch: refetchCompanies } = useCrmCompanies(companyId, search);
  const createCompany = useCreateCrmCompany();
  const deleteCompany = useDeleteCrmCompany();

  const [form, setForm] = useState({
    name: '', domain: '', industry: '', phone: '', email: '', website: '', city: '', country: '', description: '',
  });

  const handleCreate = async () => {
    if (!form.name.trim() || !companyId || !user) return;
    try {
      await createCompany.mutateAsync({
        company_id: companyId,
        name: form.name.trim(),
        domain: form.domain || null,
        industry: form.industry || null,
        size: null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        address: null,
        city: form.city || null,
        country: form.country || null,
        description: form.description || null,
        logo_url: null,
        tags: [],
        is_active: true,
        created_by: user.id,
      });
      toast.success(isRu ? 'Компания создана' : 'Company created');
      setShowCreate(false);
      setForm({ name: '', domain: '', industry: '', phone: '', email: '', website: '', city: '', country: '', description: '' });
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompany.mutateAsync(id);
      toast.success(isRu ? 'Удалено' : 'Deleted');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  if (companiesError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-destructive font-medium">{isRu ? 'Ошибка загрузки компаний' : 'Failed to load companies'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchCompanies()}>
          {isRu ? 'Повторить' : 'Retry'}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-[1536px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {isRu ? 'Компании' : 'Companies'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Управление организациями-клиентами' : 'Manage client organizations'}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Компания' : 'Company'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRu ? 'Поиск компаний...' : 'Search companies...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Companies grid */}
      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Building2 className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isRu ? 'Компании пока не добавлены' : 'No companies added yet'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-sm">{c.name}</h3>
                      {c.industry && <p className="text-xs text-muted-foreground">{c.industry}</p>}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{isRu ? 'Удалить компанию?' : 'Delete company?'}</AlertDialogTitle>
                        <AlertDialogDescription>{isRu ? 'Контакты не будут удалены' : 'Contacts will not be deleted'}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground">
                          {isRu ? 'Удалить' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {c.email && (
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                  )}
                  {c.phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
                  )}
                  {c.website && (
                    <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-3 w-3" />{c.domain || c.website}
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {c.contact_count || 0} {isRu ? 'контактов' : 'contacts'}
                  </span>
                  {c.city && (
                    <Badge variant="outline" className="text-[10px]">{c.city}{c.country ? `, ${c.country}` : ''}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{isRu ? 'Новая компания' : 'New Company'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{isRu ? 'Название *' : 'Name *'}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isRu ? 'Отрасль' : 'Industry'}</Label>
                <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                  <SelectTrigger><SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    {COMPANY_INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isRu ? 'Домен' : 'Domain'}</Label>
                <Input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isRu ? 'Город' : 'City'}</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <Label>{isRu ? 'Страна' : 'Country'}</Label>
                <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{isRu ? 'Сайт' : 'Website'}</Label>
              <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            </div>
            <Button onClick={handleCreate} disabled={createCompany.isPending || !form.name.trim()} className="w-full">
              {createCompany.isPending ? '...' : (isRu ? 'Создать' : 'Create')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
