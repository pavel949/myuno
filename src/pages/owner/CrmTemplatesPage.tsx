import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCrmTemplates, useCreateTemplate, useDeleteTemplate, CHANNELS, MERGE_TAGS } from '@/hooks/useCrmTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Trash2, Copy, Mail, MessageCircle, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

const channelIcons: Record<string, React.ElementType> = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  telegram: Send,
};

export default function CrmTemplatesPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const { data: templates = [], isLoading, isError: templatesError, refetch: refetchTemplates } = useCrmTemplates(companyId, channelFilter === 'all' ? undefined : channelFilter);
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'email', subject: '', body: '', language: 'en' });

  const handleCreate = async () => {
    if (!companyId || !user) return;
    try {
      await createTemplate.mutateAsync({
        company_id: companyId,
        channel: form.channel,
        name: form.name,
        subject: form.subject || null,
        body: form.body,
        merge_tags: MERGE_TAGS.filter(tag => form.body.includes(tag)),
        language: form.language,
        created_by: user.id,
      });
      setOpen(false);
      setForm({ name: '', channel: 'email', subject: '', body: '', language: 'en' });
      toast(isRu);
    } catch {
      toast.error(isRu);
    }
  };

  const insertTag = (tag: string) => {
    setForm(f => ({ ...f, body: f.body + tag }));
  };

  if (templatesError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-destructive font-medium">{isRu ? 'Ошибка загрузки шаблонов' : 'Failed to load templates'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchTemplates()}>
          {isRu ? 'Повторить' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Шаблоны коммуникаций' : 'Communication Templates'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Готовые шаблоны для email, WhatsApp, SMS' : 'Ready-made templates for email, WhatsApp, SMS'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{isRu ? 'Новый шаблон' : 'New Template'}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isRu ? 'Новый шаблон' : 'New Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>{isRu ? 'Название' : 'Name'}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRu ? 'Канал' : 'Channel'}</Label>
                  <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          {isRu ? c.labelRu : c.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isRu ? 'Язык' : 'Language'}</Label>
                  <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.channel === 'email' && (
                <div>
                  <Label>{isRu ? 'Тема' : 'Subject'}</Label>
                  <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
              )}
              <div>
                <Label>{isRu ? 'Тело сообщения' : 'Body'}</Label>
                <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={5} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{isRu ? 'Merge-теги' : 'Merge Tags'}</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {MERGE_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTag(tag)}
                      className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/80 border text-muted-foreground"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!form.name || !form.body || createTemplate.isPending} className="w-full">
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Channel filter */}
      <Tabs value={channelFilter} onValueChange={setChannelFilter}>
        <TabsList>
          <TabsTrigger value="all">{isRu ? 'Все' : 'All'}</TabsTrigger>
          {CHANNELS.map(c => (
            <TabsTrigger key={c.value} value={c.value}>{isRu ? c.labelRu : c.labelEn}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Нет шаблонов' : 'No templates yet'}</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {templates.map(tpl => {
            const Icon = channelIcons[tpl.channel] || FileText;
            return (
              <Card key={tpl.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{tpl.name}</span>
                        <Badge variant="outline" className="text-[10px]">{tpl.channel}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{tpl.language}</Badge>
                      </div>
                      {tpl.subject && <p className="text-xs text-muted-foreground mt-1">{tpl.subject}</p>}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.body}</p>
                      {tpl.merge_tags && tpl.merge_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tpl.merge_tags.map(tag => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                      onClick={() => {
                        if (confirm(isRu ? 'Удалить?' : 'Delete?')) deleteTemplate.mutate(tpl.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
