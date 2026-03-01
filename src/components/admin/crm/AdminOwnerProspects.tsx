import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProspects, useUpdateOwnerProspect, useCreateOwnerProspect, type OwnerProspect } from '@/hooks/useOwnerProspects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUSES = ['new', 'contacted', 'interested', 'converted', 'lost'] as const;

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  interested: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

export function AdminOwnerProspects() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: prospects, isLoading, refetch } = useOwnerProspects(statusFilter || undefined);
  const updateMutation = useUpdateOwnerProspect();
  const createMutation = useCreateOwnerProspect();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleStatusChange = (id: string, status: string) => {
    updateMutation.mutate({ id, status } as any);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ owner_name: newName, phone: newPhone || null, email: newEmail || null, status: 'new' as const }, {
      onSuccess: () => { setAddOpen(false); setNewName(''); setNewPhone(''); setNewEmail(''); },
    });
  };

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={isRu ? 'Все статусы' : 'All statuses'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />{isRu ? 'Добавить' : 'Add'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{isRu ? 'Новый собственник' : 'New Owner Prospect'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{isRu ? 'Имя' : 'Name'}</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
              <div><Label>{isRu ? 'Телефон' : 'Phone'}</Label><Input value={newPhone} onChange={e => setNewPhone(e.target.value)} /></div>
              <Button onClick={handleAdd} disabled={!newName.trim()}>{isRu ? 'Создать' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRu ? 'Имя' : 'Name'}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>{isRu ? 'Телефон' : 'Phone'}</TableHead>
                <TableHead>{isRu ? 'Тип' : 'Type'}</TableHead>
                <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
                <TableHead>{isRu ? 'Создан' : 'Created'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(prospects || []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.owner_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.email || '—'}</TableCell>
                  <TableCell className="text-sm">{p.phone || '—'}</TableCell>
                  <TableCell className="text-sm">{p.property_type || '—'}</TableCell>
                  <TableCell>
                    <Select value={p.status} onValueChange={(v) => handleStatusChange(p.id, v)}>
                      <SelectTrigger className="h-7 w-28">
                        <Badge className={`${statusColors[p.status]} text-xs`}>{p.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
              {(!prospects || prospects.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isRu ? 'Нет записей' : 'No prospects yet'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
