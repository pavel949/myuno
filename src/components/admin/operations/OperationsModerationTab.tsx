import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Clock, CheckCircle, XCircle, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ModerationItem = {
  id: string;
  type: 'service' | 'property' | 'product' | 'provider';
  name: string;
  created_at: string;
  status: string;
  provider_name?: string;
};

export function OperationsModerationTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');

  // Fetch items pending moderation
  const { data: moderationItems, isLoading } = useQuery({
    queryKey: ['moderation-queue'],
    queryFn: async () => {
      const items: ModerationItem[] = [];

      // Fetch services pending approval (is_active = false means pending)
      const { data: services } = await supabase
        .from('services')
        .select('id, name_en, name_ru, created_at, is_active, providers:provider_id (name)')
        .order('created_at', { ascending: false })
        .limit(50);

      services?.forEach(s => {
        items.push({
          id: s.id,
          type: 'service',
          name: isRussian ? s.name_ru : s.name_en,
          created_at: s.created_at,
          status: s.is_active ? 'approved' : 'pending',
          provider_name: s.providers?.name,
        });
      });

      // Fetch properties pending approval
      const { data: properties } = await supabase
        .from('owner_properties')
        .select('id, title, title_ru, created_at, status')
        .order('created_at', { ascending: false })
        .limit(50);

      properties?.forEach(p => {
        items.push({
          id: p.id,
          type: 'property',
          name: isRussian ? p.title_ru || p.title : p.title,
          created_at: p.created_at,
          status: p.status === 'active' ? 'approved' : 'pending',
        });
      });

      // Fetch products pending approval
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('id, name_en, name_ru, created_at, is_active')
        .order('created_at', { ascending: false })
        .limit(50);

      products?.forEach(p => {
        items.push({
          id: p.id,
          type: 'product',
          name: isRussian ? p.name_ru : p.name_en,
          created_at: p.created_at,
          status: p.is_active ? 'approved' : 'pending',
        });
      });

      return items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const table = type === 'service' ? 'services' 
        : type === 'property' ? 'owner_properties' 
        : 'marketplace_products';
      
      const { error } = await supabase
        .from(table)
        .update({ is_active: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      toast.success(isRussian ? 'Одобрено' : 'Approved');
    },
    onError: () => {
      toast.error(isRussian ? 'Ошибка' : 'Error');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const table = type === 'service' ? 'services' 
        : type === 'property' ? 'owner_properties' 
        : 'marketplace_products';
      
      // For rejection, we could add a rejection_reason field or just keep inactive
      const { error } = await supabase
        .from(table)
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      toast.success(isRussian ? 'Отклонено' : 'Rejected');
    },
    onError: () => {
      toast.error(isRussian ? 'Ошибка' : 'Error');
    }
  });

  const pendingItems = moderationItems?.filter(i => i.status === 'pending') || [];
  const approvedItems = moderationItems?.filter(i => i.status === 'approved') || [];

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      service: { en: 'Service', ru: 'Услуга' },
      property: { en: 'Property', ru: 'Недвижимость' },
      product: { en: 'Product', ru: 'Товар' },
      provider: { en: 'Provider', ru: 'Провайдер' },
    };
    return isRussian ? labels[type]?.ru : labels[type]?.en;
  };

  const renderTable = (items: ModerationItem[], showActions: boolean) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isRussian ? 'Тип' : 'Type'}</TableHead>
            <TableHead>{isRussian ? 'Название' : 'Name'}</TableHead>
            <TableHead>{isRussian ? 'Провайдер' : 'Provider'}</TableHead>
            <TableHead>{isRussian ? 'Дата создания' : 'Created'}</TableHead>
            {showActions && <TableHead className="w-[120px]">{isRussian ? 'Действия' : 'Actions'}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={`${item.type}-${item.id}`}>
              <TableCell>
                <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.provider_name || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(item.created_at), 'dd.MM.yyyy')}
              </TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => approveMutation.mutate({ id: item.id, type: item.type })}
                      disabled={approveMutation.isPending}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => rejectMutation.mutate({ id: item.id, type: item.type })}
                      disabled={rejectMutation.isPending}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={showActions ? 5 : 4} className="text-center py-8 text-muted-foreground">
                {isRussian ? 'Нет элементов' : 'No items'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{pendingItems.length}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Ожидают проверки' : 'Pending Review'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{approvedItems.length}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Одобрено' : 'Approved'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{moderationItems?.length || 0}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Всего' : 'Total'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Queue */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {isRussian ? 'Очередь модерации' : 'Moderation Queue'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                {isRussian ? 'Ожидают' : 'Pending'}
                {pendingItems.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                    {pendingItems.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                {isRussian ? 'Одобренные' : 'Approved'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isRussian ? 'Загрузка...' : 'Loading...'}
                </div>
              ) : (
                renderTable(pendingItems, true)
              )}
            </TabsContent>

            <TabsContent value="approved">
              {renderTable(approvedItems, false)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
