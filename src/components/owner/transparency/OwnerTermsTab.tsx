import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyManagementTerms } from '@/hooks/usePropertyManagementTerms';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Percent, Calendar, Wallet, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  propertyId: string;
}

const EXPENSE_LABELS: Record<string, { en: string; ru: string }> = {
  cleaning: { en: 'Cleaning', ru: 'Уборка' },
  electricity: { en: 'Electricity', ru: 'Электричество' },
  water: { en: 'Water', ru: 'Вода' },
  internet: { en: 'Internet', ru: 'Интернет' },
  repairs_minor: { en: 'Minor repairs', ru: 'Мелкий ремонт' },
  repairs_major: { en: 'Major repairs', ru: 'Капитальный ремонт' },
  cam_fees: { en: 'CAM fees', ru: 'Обслуживание здания' },
  insurance: { en: 'Insurance', ru: 'Страхование' },
  marketing: { en: 'Marketing', ru: 'Маркетинг' },
};

const PARTY_STYLES: Record<string, { label: string; labelRu: string; className: string }> = {
  owner: { label: 'Owner', labelRu: 'Собственник', className: 'bg-info/10 text-info' },
  manager: { label: 'Manager', labelRu: 'УК', className: 'bg-success/10 text-success' },
  split: { label: 'Split', labelRu: 'Пополам', className: 'bg-warning/10 text-warning' },
};

export function OwnerTermsTab({ propertyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: termsList = [], isLoading } = usePropertyManagementTerms(propertyId);

  if (isLoading) {
    return <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-none" />)}</div>;
  }

  const activeTerms = termsList.find(t => t.status === 'active') || termsList[0];

  if (!activeTerms) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {isRu ? 'Условия управления не настроены' : 'No management terms configured'}
      </div>
    );
  }

  const expenses = activeTerms.expense_responsibility || {};

  return (
    <div className="space-y-4">
      {/* Commission */}
      <Card variant="content">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Percent className="w-4 h-4 text-primary" />
            {isRu ? 'Комиссия' : 'Commission'}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{isRu ? 'Ставка' : 'Rate'}</p>
              <p className="font-medium">
                {activeTerms.commission_type === 'percent'
                  ? `${activeTerms.commission_rate || 0}%`
                  : `${activeTerms.commission_amount?.toLocaleString()} ${activeTerms.payment_currency}`
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isRu ? 'База' : 'Base'}</p>
              <p className="font-medium capitalize">{activeTerms.commission_base}</p>
            </div>
            {activeTerms.revenue_split_owner && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Доля собственника' : 'Owner share'}</p>
                  <p className="font-medium">{activeTerms.revenue_split_owner}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Доля УК' : 'Manager share'}</p>
                  <p className="font-medium">{activeTerms.revenue_split_manager}%</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contract period */}
      <Card variant="content">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Calendar className="w-4 h-4 text-primary" />
            {isRu ? 'Период действия' : 'Contract Period'}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{isRu ? 'С' : 'From'}</p>
              <p className="font-medium">
                {activeTerms.valid_from
                  ? format(new Date(activeTerms.valid_from), 'd MMM yyyy', { locale: isRu ? ru : undefined })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isRu ? 'До' : 'Until'}</p>
              <p className="font-medium">
                {activeTerms.valid_until
                  ? format(new Date(activeTerms.valid_until), 'd MMM yyyy', { locale: isRu ? ru : undefined })
                  : (isRu ? 'Бессрочно' : 'Indefinite')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment terms */}
      <Card variant="content">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Wallet className="w-4 h-4 text-primary" />
            {isRu ? 'Условия оплаты' : 'Payment Terms'}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{isRu ? 'День выплаты' : 'Payment day'}</p>
              <p className="font-medium">{activeTerms.payment_day || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isRu ? 'Валюта' : 'Currency'}</p>
              <p className="font-medium">{activeTerms.payment_currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense responsibility */}
      <Card variant="content">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="w-4 h-4 text-primary" />
            {isRu ? 'Ответственность за расходы' : 'Expense Responsibility'}
          </div>
          <div className="space-y-2">
            {Object.entries(expenses).map(([key, party]) => {
              const label = EXPENSE_LABELS[key];
              const style = PARTY_STYLES[party as string] || PARTY_STYLES.owner;
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {label ? (isRu ? label.ru : label.en) : key}
                  </span>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", style.className)}>
                    {isRu ? style.labelRu : style.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {activeTerms.notes && (
        <Card variant="content">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <FileText className="w-4 h-4 text-primary" />
              {isRu ? 'Примечания' : 'Notes'}
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activeTerms.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
