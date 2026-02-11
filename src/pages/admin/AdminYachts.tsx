import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminYachts } from '@/hooks/useAdminContent';
import { Yacht } from '@/hooks/useYachts';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Filter } from 'lucide-react';
import { AdminYachtForm } from '@/components/admin/yachts/AdminYachtForm';
import { AdminYachtList } from '@/components/admin/yachts/AdminYachtList';

export default function AdminYachts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();

  const [filterProviderId, setFilterProviderId] = useState('');
  const { yachts, isLoading: yachtsLoading, createYacht, updateYacht, deleteYacht } = useAdminYachts(filterProviderId || undefined);

  const urlProviderId = searchParams.get('provider');
  const urlAction = searchParams.get('action');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYacht, setEditingYacht] = useState<Yacht | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isRussian = language === 'ru';

  // Auto-open dialog from URL params
  React.useEffect(() => {
    if (urlAction === 'new') {
      setEditingYacht(null);
      setIsDialogOpen(true);
    }
  }, [urlAction]);

  // Auth guards
  React.useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  const handleFormSubmit = async (payload: any, isEdit: boolean, yachtId?: string) => {
    if (!payload.name_en || !payload.price_full_day || !payload.provider_id) {
      toast.error(isRussian ? 'Заполните обязательные поля (название, цена, провайдер)' : 'Please fill required fields (name, price, provider)');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEdit && yachtId) {
        const { error } = await updateYacht(yachtId, payload);
        if (error) throw error;
        toast.success(isRussian ? 'Яхта обновлена' : 'Yacht updated');
      } else {
        const { error } = await createYacht(payload);
        if (error) throw error;
        toast.success(isRussian ? 'Яхта добавлена' : 'Yacht added');
      }
      setIsDialogOpen(false);
      setEditingYacht(null);
    } catch (error) {
      console.error('Error saving yacht:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving yacht');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (yachtId: string) => {
    try {
      const { error } = await deleteYacht(yachtId);
      if (error) throw error;
      toast.success(isRussian ? 'Яхта удалена' : 'Yacht deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting yacht:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting yacht');
    }
  };

  if (authLoading || adminLoading) {
    return (
      <>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </PageContainer>
      </>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <PageContainer>
        <PageHeader title={isRussian ? 'Управление яхтами' : 'Yacht Management'} showBack />

        {/* Provider filter */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <Select value={filterProviderId || 'all'} onValueChange={(v) => setFilterProviderId(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRussian ? 'Все провайдеры' : 'All providers'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRussian ? 'Все провайдеры' : 'All providers'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full mb-4" onClick={() => { setEditingYacht(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          {isRussian ? 'Добавить яхту' : 'Add Yacht'}
        </Button>

        <AdminYachtList
          yachts={yachts}
          isLoading={yachtsLoading}
          onEdit={(yacht) => { setEditingYacht(yacht); setIsDialogOpen(true); }}
          onDelete={(id) => setDeleteConfirmId(id)}
        />

        {/* Form Dialog */}
        <AdminYachtForm
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingYacht={editingYacht}
          initialProviderId={urlProviderId || undefined}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить яхту?' : 'Delete yacht?'}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {isRussian
                ? 'Это действие нельзя отменить. Яхта будет удалена навсегда.'
                : 'This action cannot be undone. The yacht will be permanently deleted.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                {isRussian ? 'Удалить' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
