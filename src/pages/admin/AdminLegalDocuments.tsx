/**
 * @module AdminLegalDocuments
 * @description Admin page to manage versioned legal documents and view acceptance audit logs.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, FileText, Users, Plus, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminLegalDocuments() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('documents');

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Юридические документы' : 'Legal Documents'}
        subtitle={isRu ? 'Управление версиями и аудит принятий' : 'Version management & acceptance audit'}
        showBack
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {isRu ? 'Документы' : 'Documents'}
          </TabsTrigger>
          <TabsTrigger value="acceptances" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isRu ? 'Принятия' : 'Acceptances'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentsTab isRu={isRu} />
        </TabsContent>
        <TabsContent value="acceptances">
          <AcceptancesTab isRu={isRu} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

// ── Documents Tab ──
function DocumentsTab({ isRu }: { isRu: boolean }) {
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['admin-legal-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .order('doc_key')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('legal_documents')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-legal-documents'] });
      toast.success(isRu ? 'Обновлено' : 'Updated');
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {isRu ? 'Версии документов' : 'Document Versions'}
        </CardTitle>
        <Button size="sm" onClick={() => { setEditingDoc(null); setEditDialog(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Новая версия' : 'New Version'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRu ? 'Ключ' : 'Key'}</TableHead>
                <TableHead>{isRu ? 'Версия' : 'Version'}</TableHead>
                <TableHead>{isRu ? 'Название' : 'Title'}</TableHead>
                <TableHead>{isRu ? 'Применяется к' : 'Applies to'}</TableHead>
                <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
                <TableHead>{isRu ? 'Дата' : 'Date'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(documents || []).map((doc: any) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-xs">{doc.doc_key}</TableCell>
                  <TableCell>{doc.version}</TableCell>
                  <TableCell>{isRu ? doc.title_ru : doc.title_en}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(doc.applies_to || []).map((r: string) => (
                        <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={doc.is_active}
                      onCheckedChange={(checked) => toggleActive.mutate({ id: doc.id, is_active: checked })}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(doc.created_at), 'dd.MM.yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <DocumentEditDialog
        isRu={isRu}
        open={editDialog}
        onOpenChange={setEditDialog}
        document={editingDoc}
      />
    </Card>
  );
}

// ── Document Edit Dialog ──
function DocumentEditDialog({ isRu, open, onOpenChange, document }: any) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    doc_key: 'terms_of_use',
    version: 'v1.0',
    title_en: '',
    title_ru: '',
    applies_to: 'guest,owner,mc_admin,mc_staff',
    content_md: '',
    is_active: false,
  });

  const save = async () => {
    const applies = form.applies_to.split(',').map(s => s.trim()).filter(Boolean);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(form.content_md));
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

    const { error } = await supabase
      .from('legal_documents')
      .insert({
        doc_key: form.doc_key,
        version: form.version,
        title_en: form.title_en,
        title_ru: form.title_ru,
        applies_to: applies,
        content_md: form.content_md,
        content_hash: hashHex,
        is_active: form.is_active,
      });

    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['admin-legal-documents'] });
    toast.success(isRu ? 'Документ создан' : 'Document created');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Новая версия документа' : 'New Document Version'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Doc Key</Label>
              <Select value={form.doc_key} onValueChange={v => setForm({...form, doc_key: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="terms_of_use">terms_of_use</SelectItem>
                  <SelectItem value="privacy_policy">privacy_policy</SelectItem>
                  <SelectItem value="mc_commercial_terms">mc_commercial_terms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRu ? 'Версия' : 'Version'}</Label>
              <Input value={form.version} onChange={e => setForm({...form, version: e.target.value})} placeholder="v2.0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Title (EN)</Label>
              <Input value={form.title_en} onChange={e => setForm({...form, title_en: e.target.value})} />
            </div>
            <div>
              <Label>Название (RU)</Label>
              <Input value={form.title_ru} onChange={e => setForm({...form, title_ru: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Applies To (comma-separated)</Label>
            <Input value={form.applies_to} onChange={e => setForm({...form, applies_to: e.target.value})} />
          </div>
          <div>
            <Label>Content (Markdown)</Label>
            <Textarea
              value={form.content_md}
              onChange={e => setForm({...form, content_md: e.target.value})}
              rows={10}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} />
            <Label>{isRu ? 'Активный' : 'Active'}</Label>
          </div>
          <Button onClick={save} className="w-full">
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Acceptances Tab ──
function AcceptancesTab({ isRu }: { isRu: boolean }) {
  const [filters, setFilters] = useState({ doc_key: '', company_id: '' });

  const { data: acceptances, isLoading } = useQuery({
    queryKey: ['admin-legal-acceptances', filters],
    queryFn: async () => {
      let query = supabase
        .from('legal_acceptances')
        .select(`
          id, user_id, company_id, doc_key, version, content_hash,
          accepted_at, ip_address, user_agent, acceptance_source
        `)
        .order('accepted_at', { ascending: false })
        .limit(200);

      if (filters.doc_key) query = query.eq('doc_key', filters.doc_key);
      if (filters.company_id) query = query.eq('company_id', filters.company_id);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const exportCsv = () => {
    if (!acceptances?.length) return;
    const headers = ['accepted_at', 'user_id', 'company_id', 'doc_key', 'version', 'ip_address', 'user_agent', 'acceptance_source'];
    const rows = acceptances.map((a: any) => headers.map(h => a[h] ?? '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `legal-acceptances-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {isRu ? 'Журнал принятий' : 'Acceptance Audit Log'}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={filters.doc_key} onValueChange={v => setFilters({...filters, doc_key: v === 'all' ? '' : v})}>
            <SelectTrigger className="w-48"><SelectValue placeholder={isRu ? 'Все документы' : 'All documents'} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
              <SelectItem value="terms_of_use">Terms of Use</SelectItem>
              <SelectItem value="privacy_policy">Privacy Policy</SelectItem>
              <SelectItem value="mc_commercial_terms">MC Commercial Terms</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRu ? 'Дата' : 'Date'}</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>{isRu ? 'Документ' : 'Document'}</TableHead>
                  <TableHead>{isRu ? 'Версия' : 'Version'}</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>{isRu ? 'Источник' : 'Source'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(acceptances || []).map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs">
                      {format(new Date(a.accepted_at), 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.user_id?.slice(0, 8)}...</TableCell>
                    <TableCell>{a.doc_key}</TableCell>
                    <TableCell>{a.version}</TableCell>
                    <TableCell className="text-xs">{a.ip_address || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{a.acceptance_source}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
