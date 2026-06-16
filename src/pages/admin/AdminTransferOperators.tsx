/**
 * AdminTransferOperators — CRUD for `transfer_operators` rows.
 *
 * Lives at /admin/transfer-operators. Lets the admin add a new operator
 * (Klod / Songklod / driver), edit existing ones, toggle is_primary /
 * is_active inline, and optionally fire an email invite via the
 * `admin-invite-user` Edge Function so the operator can set a password
 * and land in the system already wired to their `transfer_operators` row.
 *
 * Why this page exists:
 *   - Before this, new operators were SQL-only — every Klod replacement
 *     required a migration. `notify-transfer-booking` picks the row with
 *     `is_primary=true`, so flipping who is "active operator" has to be
 *     easy from the UI.
 *   - `transfer_operators.user_id` is a nullable FK to auth.users. When
 *     an invite is sent we patch that FK so an operator can also log in
 *     and (eventually) see /operate/transfers.
 *
 * Schema reference: see public.transfer_operators in
 * src/integrations/supabase/types.ts. Notes field holds an opaque
 * JSON-string (we use it to stash `line_id`).
 */
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Star,
  StarOff,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Link as LinkIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

type LangCode = 'en' | 'ru' | 'th';
const LANG_OPTIONS: LangCode[] = ['en', 'ru', 'th'];

interface TransferOperatorRow {
  id: string;
  name: string;
  phone_whatsapp: string;
  email: string | null;
  is_primary: boolean;
  is_active: boolean;
  languages: string[];
  notes: string | null;
  telegram_chat_id: string | null;
  user_id: string | null;
  shift_start: string | null;
  shift_end: string | null;
  created_at: string;
  updated_at: string;
}

interface OperatorFormData {
  name: string;
  phone_whatsapp: string;
  email: string;
  line_id: string;
  telegram_chat_id: string;
  languages: LangCode[];
  is_primary: boolean;
  is_active: boolean;
  shift_start: string;
  shift_end: string;
  send_invite: boolean;
}

const emptyForm: OperatorFormData = {
  name: '',
  phone_whatsapp: '',
  email: '',
  line_id: '',
  telegram_chat_id: '',
  languages: ['en'],
  is_primary: false,
  is_active: true,
  shift_start: '',
  shift_end: '',
  send_invite: false,
};

function parseLineId(notes: string | null): string {
  if (!notes) return '';
  try {
    const parsed = JSON.parse(notes);
    return typeof parsed?.line_id === 'string' ? parsed.line_id : '';
  } catch {
    return '';
  }
}

function buildNotes(lineId: string): string | null {
  const trimmed = lineId.trim();
  if (!trimmed) return null;
  return JSON.stringify({ line_id: trimmed });
}

function normalisePhone(value: string): string {
  return value.replace(/[^\d]/g, '');
}

export default function AdminTransferOperators() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransferOperatorRow | null>(null);
  const [formData, setFormData] = useState<OperatorFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TransferOperatorRow | null>(null);

  const { data: operators, isLoading } = useQuery({
    queryKey: ['admin-transfer-operators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfer_operators')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('is_active', { ascending: false })
        .order('name');
      if (error) throw error;
      return (data || []) as TransferOperatorRow[];
    },
    enabled: isAdmin,
  });

  const togglePrimary = useMutation({
    mutationFn: async (op: TransferOperatorRow) => {
      if (op.is_primary) {
        const { error } = await supabase
          .from('transfer_operators')
          .update({ is_primary: false, updated_at: new Date().toISOString() })
          .eq('id', op.id);
        if (error) throw error;
        return;
      }
      const { error: demoteErr } = await supabase
        .from('transfer_operators')
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('is_primary', true);
      if (demoteErr) throw demoteErr;
      const { error } = await supabase
        .from('transfer_operators')
        .update({ is_primary: true, is_active: true, updated_at: new Date().toISOString() })
        .eq('id', op.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transfer-operators'] });
      toast.success(isRu ? 'Основной оператор обновлён' : 'Primary operator updated');
    },
    onError: (err) => {
      toast.error(isRu ? 'Не удалось обновить' : 'Update failed', {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (op: TransferOperatorRow) => {
      const { error } = await supabase
        .from('transfer_operators')
        .update({ is_active: !op.is_active, updated_at: new Date().toISOString() })
        .eq('id', op.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transfer-operators'] });
    },
    onError: (err) => {
      toast.error(isRu ? 'Не удалось обновить' : 'Update failed', {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const deleteOperator = useMutation({
    mutationFn: async (op: TransferOperatorRow) => {
      const { error } = await supabase
        .from('transfer_operators')
        .delete()
        .eq('id', op.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transfer-operators'] });
      toast.success(isRu ? 'Оператор удалён' : 'Operator deleted');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(isRu ? 'Не удалось удалить' : 'Delete failed', {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const openAddForm = () => {
    setEditing(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (op: TransferOperatorRow) => {
    setEditing(op);
    setFormData({
      name: op.name,
      phone_whatsapp: op.phone_whatsapp,
      email: op.email || '',
      line_id: parseLineId(op.notes),
      telegram_chat_id: op.telegram_chat_id || '',
      languages: (op.languages || []).filter((l): l is LangCode =>
        LANG_OPTIONS.includes(l as LangCode),
      ),
      is_primary: op.is_primary,
      is_active: op.is_active,
      shift_start: op.shift_start || '',
      shift_end: op.shift_end || '',
      send_invite: false,
    });
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (!isFormOpen) {
      setIsSubmitting(false);
    }
  }, [isFormOpen]);

  const toggleLanguage = (lang: LangCode) => {
    setFormData((prev) => {
      const has = prev.languages.includes(lang);
      return {
        ...prev,
        languages: has
          ? prev.languages.filter((l) => l !== lang)
          : [...prev.languages, lang],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = formData.name.trim();
    const phone = normalisePhone(formData.phone_whatsapp);
    const email = formData.email.trim();

    if (!name) {
      toast.error(isRu ? 'Введите имя оператора' : 'Operator name is required');
      return;
    }
    if (!phone || phone.length < 8) {
      toast.error(isRu ? 'Введите телефон в WhatsApp (формат 66xxxxxxxxx)' : 'WhatsApp phone required (format 66xxxxxxxxx)');
      return;
    }
    if (formData.send_invite && !email) {
      toast.error(isRu ? 'Email нужен для отправки приглашения' : 'Email required to send invite');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(isRu ? 'Email указан некорректно' : 'Invalid email');
      return;
    }

    setIsSubmitting(true);
    try {
      let operatorId = editing?.id ?? null;

      // Single-source-of-truth: demote others if this row becomes primary.
      if (formData.is_primary) {
        let demoteQuery = supabase
          .from('transfer_operators')
          .update({ is_primary: false, updated_at: new Date().toISOString() })
          .eq('is_primary', true);
        if (editing) demoteQuery = demoteQuery.neq('id', editing.id);
        const { error: demoteErr } = await demoteQuery;
        if (demoteErr) throw demoteErr;
      }

      const payload = {
        name,
        phone_whatsapp: phone,
        email: email || null,
        languages: formData.languages.length ? formData.languages : ['en'],
        is_primary: formData.is_primary,
        is_active: formData.is_active,
        notes: buildNotes(formData.line_id),
        telegram_chat_id: formData.telegram_chat_id.trim() || null,
        shift_start: formData.shift_start || null,
        shift_end: formData.shift_end || null,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await supabase
          .from('transfer_operators')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('transfer_operators')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        operatorId = data?.id ?? null;
      }

      toast.success(
        editing
          ? (isRu ? 'Оператор обновлён' : 'Operator updated')
          : (isRu ? 'Оператор добавлен' : 'Operator added'),
      );

      // Optional invite — admin-invite-user grants base role 'staff' and
      // links the operator row to the freshly-created auth.users.id.
      if (formData.send_invite && email && operatorId) {
        const { data: inviteData, error: inviteErr } = await supabase.functions.invoke(
          'admin-invite-user',
          {
            body: {
              email,
              full_name: name,
              role: 'staff',
              transfer_operator_id: operatorId,
            },
          },
        );
        if (inviteErr) throw inviteErr;
        const inviteError = (inviteData as { error?: string } | null)?.error;
        if (inviteError) throw new Error(inviteError);
        toast.success(isRu ? 'Приглашение отправлено' : 'Invite sent', {
          description: email,
        });
      }

      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-transfer-operators'] });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(isRu ? 'Не удалось сохранить' : 'Save failed', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const rows = operators || [];
    return {
      total: rows.length,
      active: rows.filter((o) => o.is_active).length,
      linked: rows.filter((o) => o.user_id).length,
      primary: rows.find((o) => o.is_primary)?.name || '—',
    };
  }, [operators]);

  if (adminLoading) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Операторы трансферов' : 'Transfer operators'} />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!isAdmin) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Операторы трансферов' : 'Transfer operators'} />
        <div className="flex items-start gap-3 rounded-none border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="font-semibold text-sm">{isRu ? 'Доступ только для админов' : 'Admin access only'}</p>
            <p className="text-muted-foreground text-sm">{isRu ? 'Нужна роль admin или uno_team.' : 'admin or uno_team role required.'}</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Операторы трансферов' : 'Transfer operators'}
        subtitle={
          isRu
            ? 'Кто получает WhatsApp с новыми заказами на трансфер. Один primary = SSOT для notify-transfer-booking.'
            : 'Who receives WhatsApp for new transfer orders. One primary = SSOT for notify-transfer-booking.'
        }
        actions={
          <Button onClick={openAddForm} className="gap-2">
            <Plus className="h-4 w-4" />
            {isRu ? 'Добавить оператора' : 'Add operator'}
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <div className="p-3 border border-border/50 bg-card rounded-none">
          <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{isRu ? 'Всего' : 'Total'}</div>
          <div className="text-lg font-bold mt-1">{stats.total}</div>
        </div>
        <div className="p-3 border border-border/50 bg-card rounded-none">
          <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{isRu ? 'Активных' : 'Active'}</div>
          <div className="text-lg font-bold mt-1 text-success">{stats.active}</div>
        </div>
        <div className="p-3 border border-border/50 bg-card rounded-none">
          <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{isRu ? 'С аккаунтом' : 'Linked'}</div>
          <div className="text-lg font-bold mt-1 text-primary">{stats.linked}</div>
        </div>
        <div className="p-3 border border-border/50 bg-card rounded-none">
          <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{isRu ? 'Primary' : 'Primary'}</div>
          <div className="text-sm font-semibold mt-1 truncate">{stats.primary}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !operators || operators.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border/50 rounded-none">
          <p className="text-muted-foreground">
            {isRu ? 'Операторов пока нет. Добавьте первого.' : 'No operators yet. Add the first one.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {operators.map((op) => {
            const lineId = parseLineId(op.notes);
            return (
              <div key={op.id} className="p-4 rounded-none border border-border/50 bg-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base truncate">{op.name}</h3>
                      {op.is_primary && (
                        <Badge className="bg-primary/10 text-primary gap-1 whitespace-nowrap">
                          <Star className="h-3 w-3" />
                          {isRu ? 'Primary' : 'Primary'}
                        </Badge>
                      )}
                      {!op.is_active && (
                        <Badge variant="outline" className="text-muted-foreground whitespace-nowrap">
                          {isRu ? 'Неактивен' : 'Inactive'}
                        </Badge>
                      )}
                      {op.user_id && (
                        <Badge className="bg-success/10 text-success gap-1 whitespace-nowrap">
                          <CheckCircle2 className="h-3 w-3" />
                          {isRu ? 'Аккаунт' : 'Account'}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                        <a
                          href={`https://wa.me/${op.phone_whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground underline-offset-2 hover:underline"
                        >
                          +{op.phone_whatsapp}
                        </a>
                      </div>
                      {op.email && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <a href={`mailto:${op.email}`} className="truncate hover:text-foreground">
                            {op.email}
                          </a>
                        </div>
                      )}
                      {op.telegram_chat_id && (
                        <div className="flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5 shrink-0" />
                          <span>TG: {op.telegram_chat_id}</span>
                        </div>
                      )}
                      {lineId && (
                        <div className="flex items-center gap-1.5">
                          <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                          <span>Line: {lineId}</span>
                        </div>
                      )}
                      {op.languages?.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0 opacity-0" />
                          <span className="uppercase tracking-wide">{op.languages.join(' · ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      variant={op.is_primary ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1"
                      onClick={() => togglePrimary.mutate(op)}
                      disabled={togglePrimary.isPending}
                    >
                      {op.is_primary ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">
                        {op.is_primary ? (isRu ? 'Снять primary' : 'Unset primary') : (isRu ? 'Сделать primary' : 'Make primary')}
                      </span>
                    </Button>
                    <div className="flex items-center gap-2 px-2 h-9 border border-border/60 rounded-none">
                      <Label htmlFor={`active-${op.id}`} className="text-xs cursor-pointer">
                        {isRu ? 'Активен' : 'Active'}
                      </Label>
                      <Switch
                        id={`active-${op.id}`}
                        checked={op.is_active}
                        onCheckedChange={() => toggleActive.mutate(op)}
                        disabled={toggleActive.isPending}
                      />
                    </div>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => openEditForm(op)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(op)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ResponsiveModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editing ? (isRu ? 'Редактировать оператора' : 'Edit operator') : (isRu ? 'Новый оператор' : 'New operator')}
        description={
          editing
            ? (isRu ? 'Измените данные и сохраните.' : 'Update fields and save.')
            : (isRu ? 'Заполните данные. Опционально — отправьте приглашение на email.' : 'Fill in the details. Optionally send an email invite.')
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
          <div className="space-y-2">
            <Label htmlFor="op-name">{isRu ? 'Имя' : 'Name'} *</Label>
            <Input
              id="op-name"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder={isRu ? 'Klod / Songklod / ...' : 'Klod / Songklod / ...'}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="op-phone">{isRu ? 'WhatsApp (формат 66xxxxxxxxx)' : 'WhatsApp (format 66xxxxxxxxx)'} *</Label>
              <Input
                id="op-phone"
                value={formData.phone_whatsapp}
                onChange={(e) => setFormData((p) => ({ ...p, phone_whatsapp: e.target.value }))}
                placeholder="66629655545"
                required
                inputMode="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-email">Email</Label>
              <Input
                id="op-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="operator@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="op-line">Line ID</Label>
              <Input
                id="op-line"
                value={formData.line_id}
                onChange={(e) => setFormData((p) => ({ ...p, line_id: e.target.value }))}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-telegram">Telegram chat ID</Label>
              <Input
                id="op-telegram"
                value={formData.telegram_chat_id}
                onChange={(e) => setFormData((p) => ({ ...p, telegram_chat_id: e.target.value }))}
                placeholder="123456789"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isRu ? 'Языки' : 'Languages'}</Label>
            <div className="flex flex-wrap gap-2">
              {LANG_OPTIONS.map((lang) => {
                const active = formData.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 text-xs uppercase tracking-wide border rounded-none transition ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border/60 hover:border-primary/40'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="op-shift-start">{isRu ? 'Смена с' : 'Shift start'}</Label>
              <Input
                id="op-shift-start"
                type="time"
                value={formData.shift_start}
                onChange={(e) => setFormData((p) => ({ ...p, shift_start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-shift-end">{isRu ? 'Смена до' : 'Shift end'}</Label>
              <Input
                id="op-shift-end"
                type="time"
                value={formData.shift_end}
                onChange={(e) => setFormData((p) => ({ ...p, shift_end: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 p-3 border border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="op-primary" className="cursor-pointer">{isRu ? 'Primary' : 'Primary'}</Label>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Все новые заказы уходят этому оператору.' : 'All new orders go to this operator.'}
                </p>
              </div>
              <Switch
                id="op-primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_primary: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="op-active" className="cursor-pointer">{isRu ? 'Активен' : 'Active'}</Label>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Неактивные операторы скрыты из выбора.' : 'Inactive operators are excluded from selection.'}
                </p>
              </div>
              <Switch
                id="op-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_active: checked }))}
              />
            </div>
          </div>

          {!editing && (
            <div className="flex items-start gap-3 p-3 border border-primary/30 bg-primary/[0.04]">
              <Checkbox
                id="op-invite"
                checked={formData.send_invite}
                onCheckedChange={(checked) =>
                  setFormData((p) => ({ ...p, send_invite: checked === true }))
                }
                className="mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="op-invite" className="cursor-pointer text-sm font-medium">
                  {isRu ? 'Отправить приглашение по email' : 'Send invitation email'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isRu
                    ? 'Создаст аккаунт со ссылкой на /auth/setup-password. Роль staff. Привяжет оператора к новому user_id.'
                    : 'Creates an account with a link to /auth/setup-password. Role: staff. Links the operator to the new user_id.'}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? (isRu ? 'Сохранить' : 'Save') : (isRu ? 'Добавить' : 'Add')}
            </Button>
          </div>
        </form>
      </ResponsiveModal>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Удалить оператора?' : 'Delete operator?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu
                ? `«${deleteTarget?.name}» будет удалён. Связанные заказы останутся, но новые WhatsApp не будут уходить на этот номер.`
                : `"${deleteTarget?.name}" will be removed. Existing orders stay, but new WhatsApp messages will no longer go to this number.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteOperator.mutate(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
