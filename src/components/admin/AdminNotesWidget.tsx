/**
 * AdminNotesWidget — collapsible internal-notes panel for any entity.
 *
 * Renders on detail pages (provider, user, order, transfer operator…)
 * Lets the admin team pin private notes («watch this vendor», «klod
 * prefers Telegram», «property #41 has billing dispute») without
 * polluting public fields. RLS in the migration blocks reads for
 * anyone outside admin/uno_team/staff.
 *
 * Usage:
 *   <AdminNotesWidget entityType="provider" entityId={provider.id} />
 *
 * Backed by the `admin_notes` table (see
 * supabase/migrations/20260616072908_admin_notes.sql).
 */
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  StickyNote,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  User as UserIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export type AdminNoteEntityType =
  | 'provider'
  | 'user'
  | 'order'
  | 'property'
  | 'transfer_operator'
  | 'project'
  | 'partner_application'
  | 'ticket';

interface AdminNoteRow {
  id: string;
  entity_type: string;
  entity_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string | null;
  author_email?: string | null;
}

interface Props {
  entityType: AdminNoteEntityType;
  entityId: string;
  defaultOpen?: boolean;
  className?: string;
}

export function AdminNotesWidget({
  entityType,
  entityId,
  defaultOpen = true,
  className,
}: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [open, setOpen] = useState(defaultOpen);

  const queryKey = useMemo(
    () => ['admin-notes', entityType, entityId],
    [entityType, entityId],
  );

  const { data: notes, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<AdminNoteRow[]> => {
      const { data, error } = await supabase
        .from('admin_notes')
        .select('*, profiles!admin_notes_created_by_fkey(full_name, email)')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data || []) as Array<AdminNoteRow & { profiles?: { full_name?: string; email?: string } }>).map((row) => ({
        ...row,
        author_name: row.profiles?.full_name ?? null,
        author_email: row.profiles?.email ?? null,
      }));
    },
    enabled: !!isAdmin && !!entityId,
  });

  const addNote = useMutation({
    mutationFn: async (note: string) => {
      const { error } = await supabase.from('admin_notes').insert({
        entity_type: entityType,
        entity_id: entityId,
        note,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey });
      toast.success(isRu ? 'Заметка сохранена' : 'Note saved');
    },
    onError: (err) => {
      toast.error(isRu ? 'Не удалось сохранить' : 'Save failed', {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { error } = await supabase
        .from('admin_notes')
        .update({ note })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      setEditDraft('');
      queryClient.invalidateQueries({ queryKey });
      toast.success(isRu ? 'Заметка обновлена' : 'Note updated');
    },
    onError: (err) => {
      toast.error(isRu ? 'Не удалось обновить' : 'Update failed', {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(isRu ? 'Заметка удалена' : 'Note deleted');
    },
    onError: (err) => {
      toast.error(isRu ? 'Не удалось удалить' : 'Delete failed', {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  if (!isAdmin) return null;

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) return;
    addNote.mutate(text);
  };

  const startEdit = (note: AdminNoteRow) => {
    setEditingId(note.id);
    setEditDraft(note.note);
  };

  const handleSaveEdit = (id: string) => {
    const text = editDraft.trim();
    if (!text) return;
    updateNote.mutate({ id, note: text });
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={`border border-border/60 bg-card ${className || ''}`}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">
              {isRu ? 'Внутренние заметки' : 'Internal notes'}
            </span>
            {!isLoading && notes && notes.length > 0 && (
              <Badge variant="outline" className="font-mono text-[10.5px]">
                {notes.length}
              </Badge>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isRu ? 'Загрузка…' : 'Loading…'}
            </div>
          ) : !notes || notes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              {isRu
                ? 'Заметок пока нет. Эта заметка видна только админ-команде.'
                : 'No notes yet. These notes are visible to the admin team only.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.map((note) => {
                const isEditing = editingId === note.id;
                const author =
                  note.author_name || note.author_email || (isRu ? 'Админ' : 'Admin');
                return (
                  <li
                    key={note.id}
                    className="border border-border/40 bg-muted/30 p-3 space-y-1.5"
                  >
                    {isEditing ? (
                      <>
                        <Textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={3}
                          className="text-sm"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(null);
                              setEditDraft('');
                            }}
                            className="gap-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            {isRu ? 'Отмена' : 'Cancel'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(note.id)}
                            disabled={updateNote.isPending}
                            className="gap-1"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {isRu ? 'Сохранить' : 'Save'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap break-words">{note.note}</p>
                        <div className="flex items-center justify-between gap-2 text-[10.5px] text-muted-foreground">
                          <span className="flex items-center gap-1 truncate min-w-0">
                            <UserIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate">{author}</span>
                            <span className="opacity-50">·</span>
                            <span className="shrink-0">
                              {formatDistanceToNow(new Date(note.updated_at), {
                                addSuffix: true,
                                locale,
                              })}
                            </span>
                          </span>
                          {user?.id === note.created_by && (
                            <span className="flex items-center gap-0.5 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => startEdit(note)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => deleteNote.mutate(note.id)}
                                disabled={deleteNote.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                isRu
                  ? 'Добавить заметку (видно только админ-команде)…'
                  : 'Add a note (admin team only)…'
              }
              rows={2}
              className="text-sm"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!draft.trim() || addNote.isPending}
                className="gap-1.5"
              >
                {addNote.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {isRu ? 'Добавить' : 'Add note'}
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
