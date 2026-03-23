/**
 * @module LegalComplianceModal
 * @description Blocking modal that requires users to accept updated legal documents.
 */
import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLegalCompliance, LegalDocument } from '@/hooks/useLegalCompliance';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function LegalComplianceModal() {
  const { pendingDocs, allAccepted, isLoading, acceptDocuments } = useLegalCompliance();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();

  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || allAccepted || dismissed) return null;

  const allChecked = pendingDocs.every(doc => checkedDocs.has(doc.id));

  const toggleDoc = (docId: string) => {
    setCheckedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const handleAccept = async () => {
    if (!allChecked) return;
    setIsSubmitting(true);
    try {
      await acceptDocuments(pendingDocs.map(d => d.id));
      setDismissed(true);
      queryClient.invalidateQueries({ queryKey: ['legal-compliance'] });
      toast.success(isRu ? 'Документы приняты' : 'Documents accepted');
    } catch (err) {
      logger.error('Accept error:', err);
      toast.error(isRu ? 'Ошибка при сохранении' : 'Failed to save acceptance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent
        hideCloseButton
        className="max-w-2xl max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isRu ? 'Обновление документов' : 'Updated Documents'}
          </DialogTitle>
          <DialogDescription>
            {isRu
              ? 'Пожалуйста, ознакомьтесь и примите обновлённые документы для продолжения работы.'
              : 'Please review and accept the updated documents to continue.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-4">
          <div className="space-y-4">
            {pendingDocs.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`doc-${doc.id}`}
                    checked={checkedDocs.has(doc.id)}
                    onCheckedChange={() => toggleDoc(doc.id)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`doc-${doc.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {isRu ? doc.title_ru : doc.title_en}
                      <span className="text-xs text-muted-foreground ml-2">
                        {doc.version}
                      </span>
                    </label>
                    <button
                      onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                      className="text-sm text-primary hover:underline block mt-1"
                    >
                      {expandedDoc === doc.id
                        ? (isRu ? 'Скрыть' : 'Hide')
                        : (isRu ? 'Читать полностью' : 'Read full text')}
                    </button>
                    {expandedDoc === doc.id && (
                      <div className="mt-3 p-3 bg-muted/50 rounded text-sm prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{doc.content_md}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!allChecked || isSubmitting}
            className="w-full"
          >
            {isSubmitting
              ? (isRu ? 'Сохранение...' : 'Saving...')
              : (isRu ? 'Принять и продолжить' : 'Accept & Continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
