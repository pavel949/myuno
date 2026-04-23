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
  type: 'service' | 'property' | 'product' | 'provider' | 'listing';
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

  // Fetch items pending moderation (same sources as dashboard "pendingContent": listings + properties; plus services/products)
  const { data: moderationItems, isLoading } = useQuery({
    queryKey: ['moderation-queue'],
    queryFn: async () => {
      const items: ModerationItem[] = [];

      // Listings (yachts, restaurants, experiences, clinics, etc.) — main source of "252 need attention"
      const { data: listings } = await supabase
        .from('listings')
        .select('id, name_en, name_ru, created_at, approval_status, provider_id, providers:provider_id (name)')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(500);

      (listings || []).forEach((l: { id: string; name_en?: string; name_ru?: string; created_at: string; approval_status?: string; providers?: { name?: string } | null }) => {
        items.push({
          id: l.id,
          type: 'listing',
          name: isRussian ? (l.name_ru || l.name_en || '') : (l.name_en || l.name_ru || ''),
          created_at: l.created_at,
          status: l.approval_status === 'approved' ? 'approved' : 'pending',
          provider_name: l.providers && typeof l.providers === 'object' && 'name' in l.providers ? (l.providers as { name?: string }).name : undefined,
        });
      });

      // Properties pending approval
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, created_at, status, approval_status')
        .eq('approval_status', 'pending')
        .not('owner_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500);

      (properties || []).forEach((p: { id: string; title_en?: string; title_ru?: string; created_at: string; approval_status?: string }) => {
        items.push({
          id: p.id,
          type: 'property',
          name: isRussian ? (p.title_ru || p.title_en || '') : (p.title_en || p.title_ru || ''),
          created_at: p.created_at,
          status: p.approval_status === 'approved' ? 'approved' : 'pending',
        });
      });

      // Services pending (is_active = false) — optional, limit to avoid huge list
      const { data: services } = await supabase
        .from('services')
        .select('id, name_en, name_ru, created_at, is_active, providers:provider_id (name)')
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(100);

      (services || []).forEach((s: { id: string; name_en?: string; name_ru?: string; created_at: string; is_active?: boolean; providers?: { name?: string } | null }) => {
        items.push({
          id: s.id,
          type: 'service',
          name: isRussian ? (s.name_ru || s.name_en || '') : (s.name_en || s.name_ru || ''),
          created_at: s.created_at,
          status: s.is_active ? 'approved' : 'pending',
          provider_name: s.providers && typeof s.providers === 'object' && 'name' in s.providers ? (s.providers as { name?: string }).name : undefined,
        });
      });

      // Products pending (is_active = false)
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('id, name_en, name_ru, created_at, is_active')
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(100);

      (products || []).forEach((p: { id: string; name_en?: string; name_ru?: string; created_at: string; is_active?: boolean }) => {
        items.push({
          id: p.id,
          type: 'product',
          name: isRussian ? (p.name_ru || p.name_en || '') : (p.name_en || p.name_ru || ''),
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
      if (type === 'listing') {
        const { error } = await supabase
          .from('listings')
          .update({ approval_status: 'approved', is_active: true })
          .eq('id', id);
        if (error) throw error;
        return;
      }
      if (type === 'property') {
        const { error } = await supabase
          .from('properties')
          .update({ approval_status: 'approved', is_active: true })
          .eq('id', id);
        if (error) throw error;
        return;
      }
      const table = type === 'service' ? 'services' : 'marketplace_products';
      const { error } = await supabase
        .from(table)
        .update({ is_active: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success(isRussian ? 'Одобрено' : 'Approved');
    },
    onError: () => {
      toast.error(isRussian ? 'Ошибка' : 'Error');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      if (type === 'listing') {
        const { error } = await supabase
          .from('listings')
          .update({ approval_status: 'rejected', is_active: false })
          .eq('id', id);
        if (error) throw error;
        return;
      }
      if (type === 'property') {
        const { error } = await supabase
          .from('properties')
          .update({ approval_status: 'rejected', is_active: false })
          .eq('id', id);
        if (error) throw error;
        return;
      }
      const table = type === 'service' ? 'services' : 'marketplace_products';
      const { error } = await supabase
        .from(table)
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
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
      listing: { en: 'Listing', ru: 'Листинг' },
      service: { en: 'Service', ru: 'Услуга' },
      property: { en: 'Property', ru: 'Недвижимость' },
      product: { en: 'Product', ru: 'Товар' },
      provider: { en: 'Provider', ru: 'Провайдер' },
    };
    return isRussian ? labels[type]?.ru : labels[type]?.en;
  };

  const renderTable = (items: ModerationItem[], showActions: boolean) => (
    <div className="rounded-none border overflow-x-auto">
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
                      className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                      onClick={() => approveMutation.mutate({ id: item.id, type: item.type })}
                      disabled={approveMutation.isPending}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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
            <Clock className="h-8 w-8 text-warning" />
            <div>
              <p className="text-2xl font-bold">{pendingItems.length}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Ожидают проверки' : 'Pending Review'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{approvedItems.length}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Одобрено' : 'Approved'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-info" />
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
