/**
 * Admin — Newbuilds management (approvals, featured, developers)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Star, StarOff, Shield, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NbProjectStatusBadge } from '@/components/newbuilds/NbProjectStatusBadge';
import { NbPriceDisplay } from '@/components/newbuilds/NbPriceDisplay';

export default function AdminNewbuilds() {
  const qc = useQueryClient();

  // All projects
  const { data: projects = [] } = useQuery({
    queryKey: ['admin-nb-projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('property_projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // All developers
  const { data: developers = [] } = useQuery({
    queryKey: ['admin-nb-developers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('developers').select('*').order('name_en');
      if (error) throw error;
      return data || [];
    },
  });

  // All leads
  const { data: leads = [] } = useQuery({
    queryKey: ['admin-nb-leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('nb_leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from('property_projects').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-nb-projects'] });
      toast.success('Обновлено');
    },
  });

  const updateDeveloper = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from('developers').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-nb-developers'] });
      toast.success('Обновлено');
    },
  });

  const pending = projects.filter((p: any) => !p.is_approved);
  const approved = projects.filter((p: any) => p.is_approved);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Новостройки — Управление</h1>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">На проверке ({pending.length})</TabsTrigger>
          <TabsTrigger value="all">Все проекты ({projects.length})</TabsTrigger>
          <TabsTrigger value="developers">Девелоперы ({developers.length})</TabsTrigger>
          <TabsTrigger value="leads">Лиды ({leads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 ? (
            <p className="text-muted-foreground">Нет проектов на проверке</p>
          ) : pending.map((p: any) => (
            <div key={p.id} className="border rounded-lg p-4 flex items-center gap-4">
              {p.cover_image && <img src={p.cover_image} className="w-16 h-16 rounded object-cover" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{p.name_en}</h3>
                <p className="text-sm text-muted-foreground">{p.developer_name} · {p.district || p.location_area}</p>
                {p.price_from && <NbPriceDisplay price={p.price_from} className="text-sm text-primary" />}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateProject.mutate({ id: p.id, updates: { is_approved: true } })} className="bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4 mr-1" /> Одобрить
                </Button>
                <Button size="sm" variant="destructive" onClick={() => updateProject.mutate({ id: p.id, updates: { is_active: false } })}>
                  <X className="w-4 h-4 mr-1" /> Отклонить
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Проект</th>
                  <th className="text-left p-3 font-medium">Девелопер</th>
                  <th className="text-left p-3 font-medium">Район</th>
                  <th className="text-left p-3 font-medium">Статус</th>
                  <th className="text-left p-3 font-medium">Цена</th>
                  <th className="text-left p-3 font-medium">Featured</th>
                  <th className="text-left p-3 font-medium">Одобрен</th>
                </tr>
              </thead>
              <tbody>
                {approved.slice(0, 50).map((p: any) => (
                  <tr key={p.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">{p.name_en}</td>
                    <td className="p-3 text-muted-foreground">{p.developer_name || '—'}</td>
                    <td className="p-3 text-muted-foreground">{p.district || p.location_area || '—'}</td>
                    <td className="p-3"><NbProjectStatusBadge status={p.project_status || 'under_construction'} /></td>
                    <td className="p-3">{p.price_from ? <NbPriceDisplay price={p.price_from} /> : '—'}</td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" onClick={() => updateProject.mutate({ id: p.id, updates: { is_featured: !p.is_featured } })}>
                        {p.is_featured ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" onClick={() => updateProject.mutate({ id: p.id, updates: { is_approved: !p.is_approved } })}>
                        {p.is_approved ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="developers" className="mt-4 space-y-3">
          {developers.map((d: any) => (
            <div key={d.id} className="border rounded-lg p-4 flex items-center gap-4">
              {d.logo_url && <img src={d.logo_url} className="w-12 h-12 rounded-full object-cover" />}
              <div className="flex-1">
                <h3 className="font-semibold">{d.name_en}</h3>
                <p className="text-sm text-muted-foreground">{d.email || d.website || '—'}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateDeveloper.mutate({ id: d.id, updates: { is_verified: !d.is_verified } })}
              >
                {d.is_verified ? <Shield className="w-4 h-4 text-green-500 mr-1" /> : <ShieldOff className="w-4 h-4 text-muted-foreground mr-1" />}
                {d.is_verified ? 'Верифицирован' : 'Верифицировать'}
              </Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Дата</th>
                  <th className="text-left p-3 font-medium">Имя</th>
                  <th className="text-left p-3 font-medium">Контакт</th>
                  <th className="text-left p-3 font-medium">Источник</th>
                  <th className="text-left p-3 font-medium">Статус</th>
                  <th className="text-left p-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 50).map((l: any) => (
                  <tr key={l.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-muted-foreground text-xs">{new Date(l.created_at).toLocaleDateString('ru-RU')}</td>
                    <td className="p-3">{l.full_name || '—'}</td>
                    <td className="p-3 text-muted-foreground">{l.phone || l.email || '—'}</td>
                    <td className="p-3 text-muted-foreground">{l.source}</td>
                    <td className="p-3">{l.status}</td>
                    <td className="p-3">{l.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
