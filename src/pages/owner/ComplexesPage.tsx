import { useState } from 'react';
import { Plus, Building2, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyComplexes, useDeleteComplex, type PropertyComplex } from '@/hooks/usePropertyComplexes';
import { ComplexCard } from '@/components/owner/ComplexCard';
import { ComplexFormDialog } from '@/components/owner/ComplexFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function ComplexesPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: complexes, isLoading } = usePropertyComplexes();
  const deleteMutation = useDeleteComplex();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyComplex | null>(null);

  const filtered = (complexes || []).filter(c => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.name_ru?.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q)
    );
  });

  const handleEdit = (complex: PropertyComplex) => {
    setEditing(complex);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {isRu ? 'Жилые комплексы' : 'Property Complexes'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu
              ? 'Управление комплексами — удобства наследуются объектами'
              : 'Manage complexes — amenities inherited by properties'}
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          {isRu ? 'Добавить' : 'Add Complex'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRu ? 'Поиск по названию или району...' : 'Search by name or district...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">
            {isRu ? 'Комплексы не найдены' : 'No complexes found'}
          </p>
          <p className="text-sm mt-1">
            {isRu ? 'Создайте первый комплекс для группировки объектов' : 'Create your first complex to group properties'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(complex => (
            <ComplexCard key={complex.id} complex={complex} onClick={() => handleEdit(complex)} />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <ComplexFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        complex={editing}
      />
    </div>
  );
}
