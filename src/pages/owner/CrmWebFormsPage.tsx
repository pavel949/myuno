import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useAuth } from '@/contexts/AuthContext';
import { useCrmWebForms, useCreateWebForm, useDeleteWebForm } from '@/hooks/useCrmWebForms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Trash2, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CrmWebFormsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const { user } = useAuth();
  const companyId = activeCompany?.company_id;
  const { data: forms = [], isLoading } = useCrmWebForms(companyId);
  const createForm = useCreateWebForm();
  const deleteForm = useDeleteWebForm();
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || !companyId || !user?.id) return;
    await createForm.mutateAsync({
      company_id: companyId,
      name: newName.trim(),
      description: null,
      fields_config: [
        { key: 'first_name', label: 'First Name', type: 'text', required: true },
        { key: 'last_name', label: 'Last Name', type: 'text', required: false },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'phone', label: 'Phone', type: 'tel', required: false },
        { key: 'message', label: 'Message', type: 'textarea', required: false },
      ],
      pipeline_id: null,
      default_stage_id: null,
      assign_rule_id: null,
      is_active: true,
      created_by: user.id,
    });
    setNewName('');
    setOpen(false);
    toast.success(isRu ? 'Форма создана' : 'Form created');
  };

  const copyEmbed = (formId: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const snippet = `<script>
  fetch('https://${projectId}.supabase.co/functions/v1/submit-web-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ form_id: '${formId}', data: { first_name, last_name, email, phone, message }, source_url: window.location.href })
  });
</script>`;
    navigator.clipboard.writeText(snippet);
    toast.success(isRu ? 'Код скопирован' : 'Embed code copied');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Веб-формы' : 'Web Forms'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Формы захвата лидов для вашего сайта' : 'Lead capture forms for your website'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0"><Plus className="h-4 w-4 mr-2" />{isRu ? 'Новая форма' : 'New Form'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Создать форму' : 'Create Form'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder={isRu ? 'Название формы' : 'Form name'}
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <Button onClick={handleCreate} disabled={!newName.trim() || createForm.isPending} className="w-full">
                {createForm.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isRu ? 'Нет форм' : 'No forms yet'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map(form => (
            <Card key={form.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm truncate">{form.name}</CardTitle>
                  <Badge variant={form.is_active ? 'default' : 'secondary'}>
                    {form.is_active ? (isRu ? 'Активна' : 'Active') : (isRu ? 'Неактивна' : 'Inactive')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  {form.submit_count} {isRu ? 'заявок' : 'submissions'}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyEmbed(form.id)}>
                    <Copy className="h-3 w-3 mr-1" />{isRu ? 'Код' : 'Embed'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      deleteForm.mutate(form.id);
                      toast.success(isRu ? 'Удалено' : 'Deleted');
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
