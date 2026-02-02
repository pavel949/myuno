import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { useCreateFinancial } from '@/hooks/usePropertyFinancials';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QuickPropertySelector } from '@/components/owner/QuickPropertySelector';
import { QuickCategoryGrid } from '@/components/owner/QuickCategoryGrid';
import { DragDropReceiptUpload } from '@/components/upload/DragDropReceiptUpload';
import { VendorCombobox } from '@/components/owner/expense/VendorCombobox';
import { VoiceInput } from '@/components/ui/voice-input';
import { 
  Loader2, Check, Banknote, CreditCard, ArrowLeftRight,
  Receipt, Camera
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

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

  const { data: properties, isLoading: propertiesLoading } = useOwnerProperties();
  const createFinancial = useCreateFinancial();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(preselectedPropertyId || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCategorySuggestion = (suggestedCategory: string) => {
    // Only auto-fill if category is not already selected
    if (!category) {
      setCategory(suggestedCategory);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    // Append to existing description or set new
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
      });
      
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/owner/financials');
      }, 1500);
    } catch (error) {
      console.error('Error creating expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isSuccess) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
            <Check className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-xl font-semibold">
            {isRu ? 'Расход добавлен!' : 'Expense Added!'}
          </h2>
          <p className="text-muted-foreground">
            {isRu ? 'Перенаправляем к финансам...' : 'Redirecting to financials...'}
          </p>
        </div>
      </PageContainer>
    );
  }

  const canSubmit = selectedPropertyId && amount && category;

  return (
    <PageContainer>
      <BackButton fallbackPath="/owner" />
      <PageHeader 
        title={isRu ? 'Быстрый расход' : 'Quick Expense'}
      />
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        {isRu ? 'Запишите расход за секунды' : 'Log an expense in seconds'}
      </p>

      <div className="space-y-5">
        {/* Receipt Photo First - Drag & Drop with Camera */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">
                {isRu ? 'Фото чека (опционально)' : 'Receipt Photo (optional)'}
              </Label>
            </div>
            <DragDropReceiptUpload
              value={receiptUrl}
              onChange={setReceiptUrl}
              folder="receipts"
              placeholder={isRu ? 'Сфотографировать чек' : 'Take receipt photo'}
              showCamera
            />
          </CardContent>
        </Card>

        {/* Property Selection - Card Swipe */}
        <div className="space-y-2">
          <Label className="text-sm font-medium px-1">
            {isRu ? 'Выберите объект' : 'Select Property'}
          </Label>
          <QuickPropertySelector
            properties={properties || []}
            selectedId={selectedPropertyId}
            onSelect={setSelectedPropertyId}
            isLoading={propertiesLoading}
          />
        </div>

        {/* Amount */}
        <Card>
          <CardContent className="pt-4">
            <Label className="text-sm font-medium mb-2 block">
              {isRu ? 'Сумма (THB)' : 'Amount (THB)'}
            </Label>
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 flex-wrap mb-3">
              {QUICK_AMOUNTS.map(amt => (
                <Button
                  key={amt}
                  type="button"
                  variant={amount === String(amt) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmount(String(amt))}
                  className="h-9"
                >
                  ฿{amt.toLocaleString()}
                </Button>
              ))}
            </div>
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">฿</span>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 text-2xl h-14 font-semibold"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vendor with Autocomplete */}
        <Card>
          <CardContent className="pt-4">
            <Label className="text-sm font-medium mb-2 block">
              {isRu ? 'Поставщик' : 'Vendor'}
            </Label>
            <VendorCombobox
              value={vendorName}
              onChange={setVendorName}
              onCategorySuggestion={handleCategorySuggestion}
            />
          </CardContent>
        </Card>

        {/* Category Grid */}
        <div className="space-y-2">
          <Label className="text-sm font-medium px-1">
            {isRu ? 'Категория' : 'Category'}
          </Label>
          <QuickCategoryGrid
            selectedCategory={category}
            onSelect={setCategory}
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label className="text-sm font-medium px-1">
            {isRu ? 'Способ оплаты' : 'Payment Method'}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.value;
              return (
                <Button
                  key={method.value}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'h-14 flex-col gap-1',
                    isSelected && 'ring-2 ring-primary ring-offset-2'
                  )}
                  onClick={() => setPaymentMethod(method.value)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{isRu ? method.labelRu : method.labelEn}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Description with Voice Input */}
        <Card>
          <CardContent className="pt-4">
            <Label className="text-sm font-medium mb-2 block">
              {isRu ? 'Что купили?' : 'What was purchased?'}
            </Label>
            <div className="flex gap-2">
              <Textarea
                placeholder={isRu ? 'Например: Средства для уборки' : 'e.g., Cleaning supplies'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                className="self-end"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          className="w-full h-14 text-lg" 
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {isRu ? 'Сохранение...' : 'Saving...'}
            </>
          ) : (
            <>
              <Receipt className="h-5 w-5 mr-2" />
              {isRu ? 'Записать расход' : 'Log Expense'}
            </>
          )}
        </Button>
      </div>
    </PageContainer>
  );
}
