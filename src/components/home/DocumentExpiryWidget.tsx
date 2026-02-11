/**
 * DocumentExpiryWidget — dashboard widget showing upcoming document expirations
 * Shows on home page for logged-in users with documents
 */
import React from 'react';
import { FileText, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserDocuments } from '@/hooks/useUserDocuments';
import { isPast, addDays, differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

export function DocumentExpiryWidget() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { documents, isLoading } = useUserDocuments();

  if (!user || isLoading || !documents?.length) return null;

  // Find documents expiring within 90 days or already expired
  const alerts = documents
    .filter(doc => doc.expiry_date)
    .map(doc => {
      const expiryDate = new Date(doc.expiry_date!);
      const daysLeft = differenceInDays(expiryDate, new Date());
      const expired = isPast(expiryDate);
      return { ...doc, daysLeft, expired };
    })
    .filter(doc => doc.expired || doc.daysLeft <= 90)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (alerts.length === 0) return null;

  const docTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      visa: { en: 'Visa', ru: 'Виза' },
      passport: { en: 'Passport', ru: 'Паспорт' },
      insurance: { en: 'Insurance', ru: 'Страховка' },
      driver_license: { en: 'Driver License', ru: 'Вод. удостоверение' },
      other: { en: 'Document', ru: 'Документ' },
    };
    return isRu ? labels[type]?.ru || type : labels[type]?.en || type;
  };

  return (
    <Link
      to="/profile/documents"
      className="block bg-card border border-border/60 rounded-xl p-4 hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <FileText className="w-4 h-4 text-accent-foreground" />
          </div>
          <h3 className="text-sm font-semibold">
            {isRu ? 'Документы' : 'Documents'}
          </h3>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>

      <div className="space-y-2">
        {alerts.slice(0, 3).map(doc => (
          <div
            key={doc.id}
            className={cn(
              'flex items-center justify-between py-1.5 px-2 rounded-lg text-sm',
              doc.expired
                ? 'bg-destructive/10'
                : doc.daysLeft <= 14
                ? 'bg-accent'
                : 'bg-muted/50'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              {doc.expired ? (
                <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate font-medium">
                {docTypeLabel(doc.document_type)}
              </span>
            </div>
            <span className={cn(
              'text-xs font-medium flex-shrink-0 ml-2',
              doc.expired ? 'text-destructive' : doc.daysLeft <= 14 ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {doc.expired
                ? (isRu ? 'Истёк' : 'Expired')
                : doc.daysLeft <= 1
                ? (isRu ? 'Завтра' : 'Tomorrow')
                : (isRu ? `${doc.daysLeft} дн.` : `${doc.daysLeft}d left`)}
            </span>
          </div>
        ))}
      </div>
    </Link>
  );
}
