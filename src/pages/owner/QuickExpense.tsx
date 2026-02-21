import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateFinancial } from '@/hooks/usePropertyFinancials';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuickPropertySelector } from '@/components/owner/QuickPropertySelector';
import { QuickCategoryGrid } from '@/components/owner/QuickCategoryGrid';
import { DragDropReceiptUpload } from '@/components/upload/DragDropReceiptUpload';
import { VendorCombobox } from '@/components/owner/expense/VendorCombobox';
import { VoiceInput } from '@/components/ui/voice-input';
import {
  Loader2, Check, Banknote, CreditCard, ArrowLeftRight,
  Receipt, Camera, ChevronLeft, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { errorHandler } from '@/lib/errorHandler';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const QUICK_PAYMENT_METHODS = [
  { value: 'cash', icon: Banknote, labelRu: 'Наличные', labelEn: 'Cash' },
  { value: 'card', icon: CreditCard, labelRu: 'Карта', labelEn: 'Card' },
  { value: 'transfer', icon: ArrowLeftRight, labelRu: 'Перевод', labelEn: 'Transfer' },
];

export default function QuickExpense() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRu = language === 'ru';

  const preselectedPropertyId = searchParams.get('propertyId');
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['owner-properties-for-financials', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('owner_properties')
        .select('id, title, title_ru, cover_image, images, address, district, bedrooms, bathrooms, price_per_night, deposit_currency')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(p => ({
        id: p.id,
        title: p.title || 'Untitled',
        title_en: p.title,
        title_ru: p.title_ru,
        cover_image: p.cover_image,
        images: p.images,
        address: p.address,
        district: p.district,
        is_active: true,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        price_per_night: p.price_per_night,
        currency: p.deposit_currency || 'THB',
        deposit_currency: p.deposit_currency,
      }));
    },
    enabled: !!user,
  });
  const createFinancial = useCreateFinancial();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(preselectedPropertyId || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('monthly');

  const handleCategorySuggestion = (suggestedCategory: string) => {
    if (!category) setCategory(suggestedCategory);
  };

  const handleVoiceTranscript = (transcript: string) => {
    setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
  };

  const handleSubmit = async () => {
    if (!selectedPropertyId || !amount || !category) return;

    setIsSubmitting(true);
    try {
      await createFinancial.mutateAsync({
        property_id: selectedPropertyId,
        transaction_type: 'expense',
        amount: parseFloat(amount),
        currency: 'THB',
        category,
        description,
        payment_method: paymentMethod || 'cash',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'completed',
        receipt_url: receiptUrl || undefined,
        vendor_name: vendorName || undefined,
        recurring: isRecurring || undefined,
        recurring_interval: isRecurring ? recurringInterval : undefined,
      });

      setIsSuccess(true);
      setTimeout(() => navigate('/owner/financials'), 1500);
    } catch (error) {
      errorHandler.error(error, {
        toastTitleRu: 'Ошибка при сохранении расхода',
        toastTitle: 'Error saving expense',
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
          <h2 className="text-xl font-semibold">{isRu ? 'Расход добавлен!' : 'Expense Added!'}</h2>
          <p className="text-muted-foreground text-sm">{isRu ? 'Перенаправляем...' : 'Redirecting...'}</p>
        </div>
      </div>
    );
  }

  const canSubmit = selectedPropertyId && amount && category;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">{isRu ? 'Быстрый расход' : 'Quick Expense'}</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Property */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">{isRu ? 'Объект' : 'Property'}</Label>
          <QuickPropertySelector
            properties={(properties || []) as any}
            selectedId={selectedPropertyId}
            onSelect={setSelectedPropertyId}
            isLoading={propertiesLoading}
          />
        </div>

        {/* Amount */}
        <div className="bg-card rounded-2xl p-4 border">
          <Label className="text-xs text-muted-foreground mb-2 block">{isRu ? 'Сумма' : 'Amount'}</Label>
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide -mx-1 px-1 touch-pan-y">
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
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">฿</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-12 text-3xl h-16 font-bold border-0 bg-muted/50 rounded-xl focus-visible:ring-2"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">{isRu ? 'Категория' : 'Category'}</Label>
          <QuickCategoryGrid selectedCategory={category} onSelect={setCategory} />
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

        {/* Recurring toggle */}
        <div className={cn(
          'flex items-center justify-between p-3 rounded-xl border transition-colors',
          isRecurring ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
        )}>
          <div className="flex items-center gap-2">
            <RefreshCw className={cn('h-4 w-4', isRecurring ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <p className="text-sm font-medium">{isRu ? 'Повторяется' : 'Recurring'}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Электричество, аренда...' : 'Electricity, rent...'}</p>
            </div>
          </div>
          <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
        </div>

        {isRecurring && (
          <Select value={recurringInterval} onValueChange={setRecurringInterval}>
            <SelectTrigger className="h-10">
              <RefreshCw className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">{isRu ? 'Еженедельно' : 'Weekly'}</SelectItem>
              <SelectItem value="monthly">{isRu ? 'Ежемесячно' : 'Monthly'}</SelectItem>
              <SelectItem value="quarterly">{isRu ? 'Ежеквартально' : 'Quarterly'}</SelectItem>
              <SelectItem value="annual">{isRu ? 'Ежегодно' : 'Annually'}</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Collapsible Extras */}
        <Collapsible open={showExtras} onOpenChange={setShowExtras}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full h-10 text-muted-foreground hover:text-foreground gap-2">
              {showExtras ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isRu ? 'Дополнительно' : 'More details'}
              {(vendorName || description || receiptUrl) && (
                <span className="ml-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">{isRu ? 'Поставщик' : 'Vendor'}</Label>
              <VendorCombobox
                value={vendorName}
                onChange={setVendorName}
                onCategorySuggestion={handleCategorySuggestion}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">{isRu ? 'Описание' : 'Description'}</Label>
              <div className="flex gap-2">
                <Textarea
                  placeholder={isRu ? 'Что купили?' : 'What was purchased?'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="flex-1 text-sm resize-none"
                />
                <VoiceInput onTranscript={handleVoiceTranscript} className="self-end shrink-0" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">{isRu ? 'Фото чека' : 'Receipt'}</Label>
              </div>
              <DragDropReceiptUpload
                value={receiptUrl}
                onChange={setReceiptUrl}
                folder="receipts"
                placeholder={isRu ? 'Добавить чек' : 'Add receipt'}
                showCamera
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t safe-area-bottom">
        <Button
          className="w-full h-12 text-base font-semibold shadow-lg"
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
