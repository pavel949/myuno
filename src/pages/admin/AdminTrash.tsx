import React, { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/uno/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeletedProperty {
  id: string;
  title_en: string;
  title_ru: string;
  district: string | null;
  price: number | null;
  deleted_at: string;
  deleted_by: string | null;
}

export default function AdminTrash() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [items, setItems] = useState<DeletedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeleted = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await (supabase.from('properties') as any)
      .select('id, title_en, title_ru, district, price, deleted_at, deleted_by')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    
    if (!error) setItems(data || []);
    else toast.error(error.message);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchDeleted(); }, [fetchDeleted]);

  const handleRestore = async (id: string) => {
    const { error } = await (supabase.from('properties') as any)
      .update({ deleted_at: null, deleted_by: null, is_active: true })
      .eq('id', id);
    if (!error) {
      toast.success(isRussian ? 'Объект восстановлен' : 'Property restored');
      fetchDeleted();
    } else toast.error(error.message);
  };

  const handlePermanentDelete = async (id: string) => {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (!error) {
      toast.success(isRussian ? 'Удалено навсегда' : 'Permanently deleted');
      fetchDeleted();
    } else toast.error(error.message);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title={isRussian ? 'Корзина' : 'Trash'}
        showBack
        fallbackPath="/admin/catalog"
      />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{isRussian ? 'Корзина пуста' : 'Trash is empty'}</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRussian ? 'Название' : 'Name'}</TableHead>
                <TableHead>{isRussian ? 'Район' : 'District'}</TableHead>
                <TableHead>{isRussian ? 'Удалено' : 'Deleted'}</TableHead>
                <TableHead className="text-right">{isRussian ? 'Действия' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {isRussian ? item.title_ru : item.title_en}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.district || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(item.deleted_at), {
                      addSuffix: true,
                      locale: isRussian ? ru : enUS,
                    })}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleRestore(item.id)}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {isRussian ? 'Восстановить' : 'Restore'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          {isRussian ? 'Навсегда' : 'Delete forever'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            {isRussian ? 'Удалить навсегда?' : 'Delete permanently?'}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {isRussian 
                              ? 'Это действие нельзя отменить. Объект будет удалён из базы данных безвозвратно.'
                              : 'This action cannot be undone. The property will be permanently removed from the database.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{isRussian ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handlePermanentDelete(item.id)}
                          >
                            {isRussian ? 'Удалить' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        {isRussian 
          ? 'Объекты в корзине автоматически удаляются через 30 дней.'
          : 'Items in trash are automatically deleted after 30 days.'}
      </p>
    </div>
  );
}
