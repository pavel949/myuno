/**
 * /me/documents — MeDocuments
 * Single grid surface for myUNO ID vault: passports, visas, vault docs.
 * Uses useMyDocuments aggregator. Includes upload dialog for vault documents.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Shield, Plane, Plus, ExternalLink, ShieldCheck, AlertTriangle, Upload, Pencil, Trash2, Loader2 } from 'lucide-react';
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { EmptyState, LoadingState, PageSection } from '@/components/page';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyDocuments, type MyDocument } from '@/hooks/useMyDocuments';
import { useActionLock } from '@/hooks/useActionLock';
import { AddVaultDocumentDialog } from '@/components/me/AddVaultDocumentDialog';
import { EditVaultDocumentDialog } from '@/components/me/EditVaultDocumentDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('MeDocuments');

const SOURCE_ICON = { passport: Shield, visa: Plane, vault: FileText } as const;
const STATUS_TONE = {
  ok:       'bg-success/10 text-success',
  expiring: 'bg-warning/10 text-warning',
  expired:  'bg-destructive/10 text-destructive',
  unknown:  'bg-muted text-muted-foreground',
} as const;

// Note: opening a vault file (sign URL → window.open) is handled inside the page
// component via the shared `useActionLock` hook so re-clicks are debounced.

/**
 * ActionIconButton — standardized icon-only action button for DocCard rows.
 *
 * Renders a single Lucide icon and, when `isLoading=true`, swaps it for a
 * spinner in-place (icon hidden via opacity to keep button width stable).
 * Reused for Edit / Open / Delete so users always get the same visual cue
 * about which specific button is busy.
 */
function ActionIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  isLoading = false,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  tone?: 'destructive';
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className={cn(
        'h-7 px-2 relative',
        tone === 'destructive' && 'text-destructive hover:text-destructive',
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label={label}
    >
      <Icon className={cn('h-3.5 w-3.5', isLoading && 'opacity-0')} />
      {isLoading && (
        <Loader2 className="absolute inset-0 m-auto h-3.5 w-3.5 animate-spin" />
      )}
    </Button>
  );
}

function DocCard({
  doc,
  onEdit,
  onDelete,
  onOpen,
  isDeleting = false,
  isOpening = false,
}: {
  doc: MyDocument;
  onEdit?: (d: MyDocument) => void;
  onDelete?: (d: MyDocument) => void;
  onOpen?: (d: MyDocument) => void;
  /** Card is in the "pending delete" window — show spinner overlay + lock actions. */
  isDeleting?: boolean;
  /** Open action is in flight (signing URL etc.) — disable to prevent re-clicks. */
  isOpening?: boolean;
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const Icon = SOURCE_ICON[doc.source];
  const isVault = doc.source === 'vault';
  const statusLabel =
    doc.expiryStatus === 'expired'  ? (isRu ? 'Истёк'        : 'Expired') :
    doc.expiryStatus === 'expiring' ? (isRu ? 'Скоро истечёт' : 'Expiring') :
    doc.expiryStatus === 'ok'       ? (isRu ? 'Активен'       : 'Active') :
                                       (isRu ? 'Без даты'      : 'No date');

  return (
    <Card variant="content" className={cn('relative', isDeleting && 'pointer-events-none')}>
      <CardContent
        className={cn(
          'p-4 flex flex-col gap-3 h-full transition-opacity',
          isDeleting && 'opacity-50',
        )}
        aria-busy={isDeleting}
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-none bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-snug truncate">{doc.title}</p>
            {doc.subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.subtitle}</p>
            )}
          </div>
          {doc.verified && <ShieldCheck className="h-4 w-4 text-success shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-auto">
          <Badge className={cn('font-normal', STATUS_TONE[doc.expiryStatus])}>
            {doc.expiryStatus === 'expired' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {statusLabel}
          </Badge>
          {doc.expiryDate && (
            <span className="text-xs text-muted-foreground">{doc.expiryDate}</span>
          )}
          <div className="ml-auto flex items-center gap-0.5">
            {isVault && onEdit && (
              <ActionIconButton
                icon={Pencil}
                label={isRu ? 'Редактировать' : 'Edit'}
                onClick={() => onEdit(doc)}
                disabled={isDeleting}
              />
            )}
            {doc.fileUrl && onOpen && (
              <ActionIconButton
                icon={ExternalLink}
                label={isRu ? 'Открыть' : 'Open'}
                onClick={() => onOpen(doc)}
                disabled={isDeleting}
                isLoading={isOpening}
              />
            )}
            {isVault && onDelete && (
              <ActionIconButton
                icon={Trash2}
                label={isRu ? 'Удалить' : 'Delete'}
                onClick={() => onDelete(doc)}
                disabled={isDeleting}
                isLoading={isDeleting}
                tone="destructive"
              />
            )}
          </div>
        </div>
      </CardContent>

      {isDeleting && (
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 rounded-none bg-background/60-[1px] pointer-events-auto"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {isRu ? 'Удаление…' : 'Deleting…'}
          </span>
        </div>
      )}
    </Card>
  );
}

export default function MeDocuments() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const qc = useQueryClient();
  const { data: docs, isLoading } = useMyDocuments();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<MyDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<MyDocument | null>(null);

  // Centralized re-click guard for all card actions (delete + open).
  // Keys are namespaced so the same doc can have independent locks per action.
  const actionLock = useActionLock();
  const deleteKey = (id: string) => `delete:${id}`;
  const openKey   = (id: string) => `open:${id}`;

  /** Soft-delete the document in DB (used after the undo window expires). */
  const archiveDoc = async (doc: MyDocument) => {
    const dbId = doc.id.startsWith('vault-') ? doc.id.slice('vault-'.length) : null;
    if (!dbId) throw new Error('Invalid document');
    const { error } = await supabase
      .from('user_documents_vault')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', dbId);
    if (error) throw error;
  };

  /** Sign + open a vault file, or open the public URL directly. */
  const handleOpen = (doc: MyDocument) => {
    if (!doc.fileUrl) return;
    void actionLock.withLock(openKey(doc.id), async () => {
      const isFullUrl = /^https?:\/\//i.test(doc.fileUrl!);
      if (isFullUrl) {
        window.open(doc.fileUrl!, '_blank', 'noopener');
        return;
      }
      const { data, error } = await supabase.storage
        .from('user-documents')
        .createSignedUrl(doc.fileUrl!, 3600);
      if (error) {
        toast.error(error.message);
        return;
      }
      window.open(data.signedUrl, '_blank', 'noopener');
    });
  };

  /** Confirm flow: lock card + show 5s toast with Undo. */
  const confirmDelete = (doc: MyDocument) => {
    setDeletingDoc(null);
    const key = deleteKey(doc.id);
    if (actionLock.isLocked(key)) return; // already pending — ignore re-trigger
    actionLock.lock(key);

    let undone = false;
    const UNDO_MS = 5000;

    const toastId = toast(
      isRu ? `«${doc.title}» удалён` : `"${doc.title}" deleted`,
      {
        description: isRu ? 'Можно отменить в течение 5 секунд' : 'You can undo within 5 seconds',
        duration: UNDO_MS,
        action: {
          label: isRu ? 'Отменить' : 'Undo',
          onClick: () => {
            undone = true;
            actionLock.unlock(key);
            toast.dismiss(toastId);
            toast.success(isRu ? 'Удаление отменено' : 'Delete cancelled');
          },
        },
      },
    );

    setTimeout(async () => {
      if (undone) return;
      try {
        await archiveDoc(doc);
        qc.invalidateQueries({ queryKey: ['me-documents'] });
      } catch (e) {
        // Archive failed → restore card in UI and surface a clear, actionable error.
        // Refetch ensures the card reappears even if any optimistic state lingers,
        // since `archived_at` was never written in DB.
        const message = (e as Error)?.message || (isRu ? 'Неизвестная ошибка' : 'Unknown error');
        // Client-side diagnostics: log full context (doc id, source, category, action)
        // to console + error reporting pipeline so we can trace failures by doc id.
        console.error('[MeDocuments] archive failed', {
          action: 'archive_document',
          docId: doc.id,
          source: doc.source,
          category: doc.category,
          error: message,
        });
        errorLog.error(e, `archive_document:${doc.id}`);
        toast.error(
          isRu ? `Не удалось удалить «${doc.title}»` : `Failed to delete "${doc.title}"`,
          {
            description: isRu
              ? `Документ восстановлен. ${message}`
              : `Document restored. ${message}`,
            duration: 6000,
            action: {
              label: isRu ? 'Повторить' : 'Retry',
              onClick: () => confirmDelete(doc),
            },
          },
        );
        qc.invalidateQueries({ queryKey: ['me-documents'] });
      } finally {
        actionLock.unlock(key);
      }
    }, UNDO_MS);
  };

  // Keep pending-delete docs visible (with overlay) so user can clearly see what's being removed
  const allDocs = docs ?? [];
  const passports = allDocs.filter((d) => d.source === 'passport');
  const visas     = allDocs.filter((d) => d.source === 'visa');
  const vault     = allDocs.filter((d) => d.source === 'vault');

  return (
    <MeShellLayout title={isRu ? 'Документы' : 'Documents'}>
      <div className="space-y-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {isRu ? 'Мои документы' : 'My documents'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRu ? 'Паспорта, визы и сейф документов.' : 'Passports, visas and document vault.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" />
              {isRu ? 'Загрузить' : 'Upload'}
            </Button>
            <Button asChild size="sm">
              <Link to="/account?action=add-passport">
                <Plus className="h-4 w-4" />
                {isRu ? 'Паспорт' : 'Passport'}
              </Link>
            </Button>
          </div>
        </header>

        {isLoading ? (
          <LoadingState />
        ) : !docs || docs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={isRu ? 'Документов пока нет' : 'No documents yet'}
            description={isRu
              ? 'Добавьте паспорт или загрузите документ, чтобы начать.'
              : 'Add a passport or upload a document to get started.'}
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4" />
                  {isRu ? 'Загрузить файл' : 'Upload file'}
                </Button>
                <Button asChild>
                  <Link to="/account?action=add-passport">
                    <Plus className="h-4 w-4" />
                    {isRu ? 'Добавить паспорт' : 'Add passport'}
                  </Link>
                </Button>
              </div>
            }
          />
        ) : (
          <>
            {passports.length > 0 && (
              <PageSection title={isRu ? 'Паспорта' : 'Passports'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {passports.map((d) => (
                    <DocCard
                      key={d.id}
                      doc={d}
                      onOpen={handleOpen}
                      isOpening={actionLock.isLocked(openKey(d.id))}
                    />
                  ))}
                </div>
              </PageSection>
            )}
            {visas.length > 0 && (
              <PageSection title={isRu ? 'Визы' : 'Visas'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visas.map((d) => (
                    <DocCard
                      key={d.id}
                      doc={d}
                      onOpen={handleOpen}
                      isOpening={actionLock.isLocked(openKey(d.id))}
                    />
                  ))}
                </div>
              </PageSection>
            )}
            <PageSection
              title={isRu ? 'Сейф документов' : 'Vault'}
              action={{ label: isRu ? 'Добавить' : 'Add', onClick: () => setUploadOpen(true) }}
            >
              {vault.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vault.map((d) => (
                    <DocCard
                      key={d.id}
                      doc={d}
                      onEdit={setEditingDoc}
                      onDelete={setDeletingDoc}
                      onOpen={handleOpen}
                      isDeleting={actionLock.isLocked(deleteKey(d.id))}
                      isOpening={actionLock.isLocked(openKey(d.id))}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'В сейфе пока ничего нет.' : 'Vault is empty.'}
                </p>
              )}
            </PageSection>
          </>
        )}
      </div>

      <AddVaultDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <EditVaultDocumentDialog
        open={!!editingDoc}
        onOpenChange={(v) => { if (!v) setEditingDoc(null); }}
        doc={editingDoc}
      />
      <AlertDialog
        open={!!deletingDoc}
        onOpenChange={(v) => { if (!v) setDeletingDoc(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Удалить документ?' : 'Delete document?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu
                ? `«${deletingDoc?.title ?? ''}» будет удалён из вашего сейфа. У вас будет 5 секунд, чтобы отменить.`
                : `"${deletingDoc?.title ?? ''}" will be removed from your vault. You'll have 5 seconds to undo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isRu ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deletingDoc) confirmDelete(deletingDoc);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MeShellLayout>
  );
}
