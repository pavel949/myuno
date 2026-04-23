import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOwnerVendors, VENDOR_CATEGORIES, type OwnerVendor } from '@/hooks/useOwnerVendors';
import { AddVendorDialog } from '@/components/owner/vendors/AddVendorDialog';
import { VendorDetailSheet } from '@/components/owner/vendors/VendorDetailSheet';
import { toast } from 'sonner';
import {
  Search, Star, Phone, MessageCircle, Plus, Heart,
  Building2, Trash2,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function VendorDirectoryPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const { vendors, isLoading, createVendor, updateVendor, deleteVendor, toggleFavorite } = useOwnerVendors();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'own' | 'myuno'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<OwnerVendor | null>(null);
  const [detailVendor, setDetailVendor] = useState<OwnerVendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OwnerVendor | null>(null);

  const filtered = (vendors || []).filter(v => {
    if (!v.is_active) return false;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      v.name.toLowerCase().includes(q) ||
      (v.name_ru || '').toLowerCase().includes(q) ||
      (v.contact_person || '').toLowerCase().includes(q) ||
      (v.phone || '').includes(q);
    const matchCat = categoryFilter === 'all' || v.category === categoryFilter;
    const matchSource = sourceFilter === 'all' || v.source === sourceFilter;
    return matchSearch && matchCat && matchSource;
  });

  const handleCreate = async (data: any) => {
    try {
      await createVendor.mutateAsync(data);
      toast.success(isRu ? 'Поставщик добавлен' : 'Vendor added');
      setAddOpen(false);
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editVendor) return;
    try {
      await updateVendor.mutateAsync({ id: editVendor.id, ...data });
      toast.success(isRu ? 'Сохранено' : 'Saved');
      setEditVendor(null);
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteVendor.mutateAsync(deleteTarget.id);
    toast.success(isRu ? 'Удалено' : 'Deleted');
    setDeleteTarget(null);
    setDetailVendor(null);
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isRu ? 'Мои поставщики' : 'My Vendors'}</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          {isRu ? 'Добавить' : 'Add'}
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск по имени, телефону...' : 'Search by name, phone...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={isRu ? 'Категория' : 'Category'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRu ? 'Все категории' : 'All categories'}</SelectItem>
              {VENDOR_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{isRu ? c.ru : c.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={sourceFilter} onValueChange={v => setSourceFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">{isRu ? 'Все' : 'All'}</TabsTrigger>
              <TabsTrigger value="own">{isRu ? 'Мои' : 'Own'}</TabsTrigger>
              <TabsTrigger value="myuno">myUNO</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-none" />)}
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground mb-4">{isRu ? 'Поставщики не найдены' : 'No vendors found'}</p>
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              {isRu ? 'Добавить первого' : 'Add first vendor'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(v => (
            <VendorCard
              key={v.id}
              vendor={v}
              isRu={isRu}
              onClick={() => setDetailVendor(v)}
              onFavorite={() => toggleFavorite.mutate({ id: v.id, is_favorite: !v.is_favorite })}
            />
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <AddVendorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleCreate}
        isSaving={createVendor.isPending}
      />

      {/* Edit Dialog */}
      {editVendor && (
        <AddVendorDialog
          open={!!editVendor}
          onOpenChange={(o) => { if (!o) setEditVendor(null); }}
          onSave={handleUpdate}
          isSaving={updateVendor.isPending}
          initialData={editVendor}
        />
      )}

      {/* Detail Sheet */}
      <VendorDetailSheet
        vendor={detailVendor}
        open={!!detailVendor}
        onOpenChange={o => { if (!o) setDetailVendor(null); }}
        onEdit={() => { setEditVendor(detailVendor); setDetailVendor(null); }}
        onToggleFavorite={() => {
          if (detailVendor) {
            toggleFavorite.mutate({ id: detailVendor.id, is_favorite: !detailVendor.is_favorite });
          }
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить поставщика?' : 'Delete vendor?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} — {isRu ? 'это действие нельзя отменить' : 'this cannot be undone'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VendorCard({ vendor, isRu, onClick, onFavorite }: { vendor: OwnerVendor; isRu: boolean; onClick: () => void; onFavorite: () => void }) {
  const catLabel = VENDOR_CATEGORIES.find(c => c.value === vendor.category);
  const initials = vendor.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            {vendor.photo_url && <AvatarImage src={vendor.photo_url} />}
            <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{isRu && vendor.name_ru ? vendor.name_ru : vendor.name}</p>
              <button
                onClick={e => { e.stopPropagation(); onFavorite(); }}
                className="shrink-0"
              >
                <Heart className={`h-4 w-4 ${vendor.is_favorite ? 'text-destructive fill-destructive' : 'text-muted-foreground/30'}`} />
              </button>
            </div>
            {vendor.contact_person && <p className="text-xs text-muted-foreground">{vendor.contact_person}</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {catLabel && <Badge variant="secondary" className="text-xs">{isRu ? catLabel.ru : catLabel.en}</Badge>}
              {vendor.source === 'myuno' && <Badge variant="outline" className="text-xs border-primary/30 text-primary">myUNO</Badge>}
            </div>
            {(vendor.avg_rating ?? 0) > 0 && (
              <div className="flex items-center gap-1 mt-1 text-sm">
                <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                <span className="font-medium">{Number(vendor.avg_rating).toFixed(1)}</span>
                {(vendor.total_jobs ?? 0) > 0 && (
                  <span className="text-muted-foreground text-xs">({vendor.total_jobs} {isRu ? 'работ' : 'jobs'})</span>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Quick contact buttons */}
        <div className="flex gap-2 mt-3 pt-2 border-t border-border/40">
          {vendor.phone && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" asChild onClick={e => e.stopPropagation()}>
              <a href={`tel:${vendor.phone}`}><Phone className="h-3 w-3 mr-1" />{isRu ? 'Звонок' : 'Call'}</a>
            </Button>
          )}
          {vendor.whatsapp && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" asChild onClick={e => e.stopPropagation()}>
              <a href={`https://wa.me/${vendor.whatsapp.replace(/[^\d+]/g, '')}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3 w-3 mr-1" />WA
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
