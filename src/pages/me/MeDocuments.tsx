/**
 * /me/documents — MeDocuments
 * Single grid surface for myUNO ID vault: passports, visas, vault docs.
 * Uses useMyDocuments aggregator. Includes upload dialog for vault documents.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Plane, Plus, ExternalLink, ShieldCheck, AlertTriangle, Upload } from 'lucide-react';
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingState, PageSection } from '@/components/page';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyDocuments, type MyDocument } from '@/hooks/useMyDocuments';
import { AddVaultDocumentDialog } from '@/components/me/AddVaultDocumentDialog';
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

function DocCard({ doc }: { doc: MyDocument }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const Icon = SOURCE_ICON[doc.source];
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
          {doc.fileUrl && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7 px-2"
              onClick={() => openDoc(doc)}
              aria-label={isRu ? 'Открыть' : 'Open'}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MeDocuments() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: docs, isLoading } = useMyDocuments();
  const [uploadOpen, setUploadOpen] = useState(false);

  const passports = (docs ?? []).filter((d) => d.source === 'passport');
  const visas     = (docs ?? []).filter((d) => d.source === 'visa');
  const vault     = (docs ?? []).filter((d) => d.source === 'vault');

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
              action={
                <Button size="sm" variant="ghost" onClick={() => setUploadOpen(true)}>
                  <Plus className="h-4 w-4" />
                  {isRu ? 'Добавить' : 'Add'}
                </Button>
              }
            >
              {vault.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vault.map((d) => <DocCard key={d.id} doc={d} />)}
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
    </MeShellLayout>
  );
}
