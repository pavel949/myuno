import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { useMyDelegations } from '@/hooks/usePropertyDelegates';
import { useCreateFinancial, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/hooks/usePropertyFinancials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QuickPropertySelector } from '@/components/owner/QuickPropertySelector';
import { DragDropReceiptUpload } from '@/components/upload/DragDropReceiptUpload';
import { VoiceInput } from '@/components/ui/voice-input';
import {
  Loader2, Check, Banknote, CreditCard, ArrowLeftRight,
  Receipt, ChevronLeft, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { errorHandler } from '@/lib/errorHandler';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

const QUICK_PAYMENT_METHODS = [
  { value: 'bank_transfer', icon: ArrowLeftRight, labelRu: 'Перевод', labelEn: 'Transfer' },
  { value: 'cash', icon: Banknote, labelRu: 'Наличные', labelEn: 'Cash' },
  { value: 'card', icon: CreditCard, labelRu: 'Карта', labelEn: 'Card' },
];

const INCOME_ICONS: Record<string, string> = {
  rent: '🏠',
  deposit: '🔐',
  cleaning_fee: '🧹',
  late_fee: '⏰',
  other_income: '💰',
};

export default function QuickIncome() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRu = language === 'ru';

  const preselectedPropertyId = searchParams.get('propertyId');

  const { data: ownedProperties, isLoading: ownedLoading } = useOwnerProperties();
  const { data: delegations } = useMyDelegations();
  const createFinancial = useCreateFinancial();

  // Merge owned + delegated (with financials permission) properties
  const delegatedProperties = (delegations || [])
    .filter(d => d.status === 'active' && (d.permissions as any)?.financials)
    .map(d => d.property)
    .filter(Boolean);

  const allProperties = [
    ...(ownedProperties || []),
    ...delegatedProperties.filter(dp => !ownedProperties?.some(op => op.id === dp.id)),
  ];

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(preselectedPropertyId || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('rent');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [transactionDate, setTransactionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  const handleVoiceTranscript = (transcript: string) => {
    setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
  };

  const handleSubmit = async () => {
    if (!selectedPropertyId || !amount || !category) return;

    setIsSubmitting(true);
    try {
      await createFinancial.mutateAsync({
        property_id: selectedPropertyId,
        transaction_type: 'income',
        amount: parseFloat(amount),
        currency: 'THB',
        category,
        description,
        payment_method: paymentMethod,
        transaction_date: transactionDate,
        status: 'completed',
        receipt_url: receiptUrl || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/owner/financials');
      }, 1500);
    } catch (error) {
      errorHandler.error(error, {
        toastTitleRu: 'Ошибка при сохранении дохода',
        toastTitle: 'Error saving income',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) { navigate('/auth'); return null; }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center space-y-4 p-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center animate-in zoom-in-50">
            <Check className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-xl font-semibold">
            {isRu ? 'Доход записан!' : 'Income Added!'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isRu ? 'Перенаправляем...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  const canSubmit = selectedPropertyId && amount && category;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{isRu ? 'Записать доход' : 'Record Income'}</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Property */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            {isRu ? 'Объект' : 'Property'}
          </Label>
          <QuickPropertySelector
            properties={allProperties as any}
            selectedId={selectedPropertyId}
            onSelect={setSelectedPropertyId}
            isLoading={ownedLoading}
          />
        </div>

        {/* Amount */}
        <div className="bg-card rounded-2xl p-4 border border-success/20">
          <Label className="text-xs text-muted-foreground mb-2 block">
            {isRu ? 'Сумма дохода' : 'Income Amount'}
          </Label>
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {QUICK_AMOUNTS.map(amt => (
              <Button
                key={amt}
                type="button"
                variant={amount === String(amt) ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setAmount(String(amt))}
                className="h-8 px-3 shrink-0 text-xs"
              >
                ฿{amt.toLocaleString()}
              </Button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-success">฿</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-12 text-3xl h-16 font-bold border-0 bg-success/5 rounded-xl focus-visible:ring-2 focus-visible:ring-success text-success"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            {isRu ? 'Категория' : 'Category'}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {INCOME_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border text-left transition-all text-sm',
                  category === cat.value
                    ? 'border-success bg-success/10 text-success font-medium'
                    : 'border-border bg-card hover:border-success/50'
                )}
              >
                <span className="text-lg">{INCOME_ICONS[cat.value] || '💵'}</span>
                <span className="text-xs leading-tight">
                  {isRu ? cat.labelRu : cat.labelEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="flex gap-2">
          {QUICK_PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const isSelected = paymentMethod === method.value;
            return (
              <Button
                key={method.value}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className={cn('flex-1 h-10 gap-1.5', isSelected && 'ring-2 ring-primary ring-offset-2')}
                onClick={() => setPaymentMethod(method.value)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{isRu ? method.labelRu : method.labelEn}</span>
              </Button>
            );
          })}
        </div>

        {/* Date */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            {isRu ? 'Дата поступления' : 'Date received'}
          </Label>
          <Input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="h-10"
          />
        </div>

        {/* Extras */}
        <Collapsible open={showExtras} onOpenChange={setShowExtras}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full h-10 text-muted-foreground hover:text-foreground gap-2">
              {showExtras ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isRu ? 'Дополнительно' : 'More details'}
              {(description || receiptUrl) && <span className="ml-1 w-2 h-2 rounded-full bg-primary" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                {isRu ? 'Комментарий' : 'Description'}
              </Label>
              <div className="flex gap-2">
                <Textarea
                  placeholder={isRu ? 'Арендатор, период, примечания...' : 'Tenant, period, notes...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="flex-1 text-sm resize-none"
                />
                <VoiceInput onTranscript={handleVoiceTranscript} className="self-end shrink-0" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                {isRu ? 'Подтверждение / квитанция' : 'Receipt / confirmation'}
              </Label>
              <DragDropReceiptUpload
                value={receiptUrl}
                onChange={setReceiptUrl}
                folder="receipts"
                placeholder={isRu ? 'Прикрепить документ' : 'Attach document'}
                showCamera
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t safe-area-bottom">
        <Button
          className="w-full h-12 text-base font-semibold shadow-lg bg-success hover:bg-success/90"
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" />{isRu ? 'Сохранение...' : 'Saving...'}</>
          ) : (
            <><Receipt className="h-5 w-5 mr-2" />{isRu ? 'Записать' : 'Save'} {amount ? `฿${parseInt(amount).toLocaleString()}` : ''}</>
          )}
        </Button>
      </div>
    </div>
  );
}
