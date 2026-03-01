/**
 * PortalDocumentsTab — Read-only view of CRM documents for the property.
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDocumentUrl, DOCUMENT_TYPE_LABELS } from '@/hooks/useCrmDocuments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  propertyId: string;
}

export function PortalDocumentsTab({ propertyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: docs, isLoading } = useQuery({
    queryKey: ['portal-documents', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_documents')
        .select('id, document_type, title, file_url, file_name, file_size, created_at')
        .eq('property_id', propertyId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId,
  });

  const handleDownload = async (doc: { id: string; file_url: string; file_name: string }) => {
    setDownloading(doc.id);
    try {
      const url = await getDocumentUrl(doc.file_url);
      window.open(url, '_blank');
    } catch (e: any) {
      toast.error(isRu ? 'Ошибка загрузки' : 'Download error');
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground text-sm">{isRu ? 'Загрузка...' : 'Loading...'}</div>;
  }

  if (!docs || docs.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>{isRu ? 'Нет документов' : 'No documents'}</p>
      </div>
    );
  }

  // Group by document_type
  const grouped = docs.reduce<Record<string, typeof docs>>((acc, doc) => {
    const type = doc.document_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([type, items]) => {
        const typeLabel = DOCUMENT_TYPE_LABELS[type];
        return (
          <div key={type} className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span>{typeLabel?.icon || '📎'}</span>
              {isRu ? typeLabel?.ru : typeLabel?.en || type}
            </h3>
            {items.map(doc => (
              <Card key={doc.id}>
                <CardContent className="py-3 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(doc.created_at), 'dd MMM yyyy')}
                      {doc.file_size && ` · ${(doc.file_size / 1024).toFixed(0)} KB`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc.id}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}
