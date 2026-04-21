/**
 * /me/documents — MeDocuments
 * Single grid surface for myUNO ID vault: passports, visas, vault docs.
 * Uses useMyDocuments aggregator. Includes upload dialog for vault documents.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { AddVaultDocumentDialog } from '@/components/me/AddVaultDocumentDialog';
import { EditVaultDocumentDialog } from '@/components/me/EditVaultDocumentDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SOURCE_ICON = { passport: Shield, visa: Plane, vault: FileText } as const;
const STATUS_TONE = {
  ok:       'bg-success/10 text-success',
  expiring: 'bg-warning/10 text-warning',
  expired:  'bg-destructive/10 text-destructive',
  unknown:  'bg-muted text-muted-foreground',
} as const;

/** Open a vault file: vault entries store a storage path → signed URL.
 *  Passport/visa rows already store full URLs → opened as-is. */
async function openDoc(doc: MyDocument) {
  if (!doc.fileUrl) return;
  const isFullUrl = /^https?:\/\//i.test(doc.fileUrl);
  if (isFullUrl) {
    window.open(doc.fileUrl, '_blank', 'noopener');
    return;
  }
  const { data, error } = await supabase.storage
    .from('user-documents')
    .createSignedUrl(doc.fileUrl, 3600);
  if (error) {
    toast.error(error.message);
    return;
  }
  window.open(data.signedUrl, '_blank', 'noopener');
}

function DocCard({
  doc,
  onEdit,
  onDelete,
}: {
  doc: MyDocument;
  onEdit?: (d: MyDocument) => void;
  onDelete?: (d: MyDocument) => void;
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
    <Card variant="content">
      <CardContent className="p-4 flex flex-col gap-3 h-full">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
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
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => onEdit(doc)}
                aria-label={isRu ? 'Редактировать' : 'Edit'}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {doc.fileUrl && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => openDoc(doc)}
                aria-label={isRu ? 'Открыть' : 'Open'}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
            {isVault && onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-destructive hover:text-destructive"
                onClick={() => onDelete(doc)}
                aria-label={isRu ? 'Удалить' : 'Delete'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
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
  // Documents pending delete are hidden optimistically until the undo window passes
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());

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

  /** Confirm flow: hide locally + show 5s toast with Undo. */
  const confirmDelete = (doc: MyDocument) => {
    setDeletingDoc(null);
    setPendingDeleteIds((prev) => new Set(prev).add(doc.id));

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
            setPendingDeleteIds((prev) => {
              const next = new Set(prev);
              next.delete(doc.id);
              return next;
            });
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
        // Restore on failure so user doesn't silently lose the doc
        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          next.delete(doc.id);
          return next;
        });
        toast.error((e as Error).message);
      } finally {
        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          next.delete(doc.id);
          return next;
        });
      }
    }, UNDO_MS);
  };

  const visibleDocs = (docs ?? []).filter((d) => !pendingDeleteIds.has(d.id));
  const passports = visibleDocs.filter((d) => d.source === 'passport');
  const visas     = visibleDocs.filter((d) => d.source === 'visa');
  const vault     = visibleDocs.filter((d) => d.source === 'vault');

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
                  {passports.map((d) => <DocCard key={d.id} doc={d} />)}
                </div>
              </PageSection>
            )}
            {visas.length > 0 && (
              <PageSection title={isRu ? 'Визы' : 'Visas'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visas.map((d) => <DocCard key={d.id} doc={d} />)}
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
        onOpenChange={(v) => { if (!v && !deleteMutation.isPending) setDeletingDoc(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Удалить документ?' : 'Delete document?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu
                ? `«${deletingDoc?.title ?? ''}» будет удалён из вашего сейфа. Это действие нельзя отменить.`
                : `"${deletingDoc?.title ?? ''}" will be removed from your vault. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {isRu ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deletingDoc) deleteMutation.mutate(deletingDoc);
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MeShellLayout>
  );
}
