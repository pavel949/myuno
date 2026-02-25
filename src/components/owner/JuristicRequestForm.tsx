import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
  useJuristicRequests, 
  RequestCategory, 
  RequestType,
  requestTypeLabels,
  requestCategoryLabels,
  CreateJuristicRequestInput 
} from '@/hooks/useJuristicRequests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Wrench, AlertTriangle, CreditCard, FileText, 
  ArrowRight, Calculator, Info
} from 'lucide-react';

interface JuristicRequestFormProps {
  propertyId: string;
  projectId?: string;
  onSuccess?: () => void;
}

const categoryIcons: Record<RequestCategory, React.ElementType> = {
  maintenance: Wrench,
  complaint: AlertTriangle,
  payment: CreditCard,
  administrative: FileText,
};

const SERVICE_FEE_PERCENT = 5;

export function JuristicRequestForm({ propertyId, projectId, onSuccess }: JuristicRequestFormProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { createRequest, isCreating } = useJuristicRequests();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<RequestCategory | ''>('');
  const [formData, setFormData] = useState<Partial<CreateJuristicRequestInput>>({
    property_id: propertyId,
    project_id: projectId,
    priority: 'normal',
    requires_payment: false,
  });

  const availableTypes = Object.entries(requestTypeLabels)
    .filter(([_, value]) => value.category === category)
    .map(([key, value]) => ({ id: key as RequestType, ...value }));

  const calculateFee = (amount: number) => Math.round(amount * SERVICE_FEE_PERCENT) / 100;
  const calculateTotal = (amount: number) => amount + calculateFee(amount);

  const handleSubmit = async () => {
    if (!formData.request_type || !formData.subject || !formData.description) {
      toast.error(isRu ? 'Заполните все обязательные поля' : 'Fill in all required fields');
      return;
    }

    try {
      await createRequest.mutateAsync({
        ...formData,
        property_id: propertyId,
        project_id: projectId,
        request_category: category as RequestCategory,
        request_type: formData.request_type as RequestType,
        subject: formData.subject,
        description: formData.description,
        requires_payment: formData.requires_payment,
        payment_amount: formData.payment_amount,
      } as CreateJuristicRequestInput);

      toast.success(isRu ? 'Запрос создан' : 'Request created');
      onSuccess?.();
    } catch (error) {
      toast.error(isRu ? 'Ошибка при создании запроса' : 'Failed to create request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Category Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{isRu ? 'Выберите категорию' : 'Select Category'}</CardTitle>
            <CardDescription>
              {isRu 
                ? 'Какой тип запроса вы хотите отправить?' 
                : 'What type of request would you like to submit?'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(requestCategoryLabels) as [RequestCategory, typeof requestCategoryLabels[RequestCategory]][]).map(([key, value]) => {
                const Icon = categoryIcons[key];
                const isSelected = category === key;
                
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setCategory(key);
                      setFormData(prev => ({ ...prev, requires_payment: key === 'payment' }));
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`inline-flex p-2 rounded-lg mb-2 ${
                      value.color === 'orange' ? 'bg-accent-amber/10 text-accent-amber' :
                      value.color === 'red' ? 'bg-destructive/10 text-destructive' :
                      value.color === 'green' ? 'bg-success/10 text-success' :
                      'bg-info/10 text-info'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium">
                      {isRu ? value.ru : value.en}
                    </h3>
                  </button>
                );
              })}
            </div>
            
            <Button 
              className="w-full mt-4"
              disabled={!category}
              onClick={() => setStep(2)}
            >
              {isRu ? 'Далее' : 'Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Request Type */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{isRu ? 'Тип запроса' : 'Request Type'}</CardTitle>
            <CardDescription>
              {isRu ? 'Уточните, что именно требуется' : 'Specify what you need'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.request_type || ''}
              onValueChange={(v) => setFormData(prev => ({ ...prev, request_type: v as RequestType }))}
              className="space-y-2"
            >
              {availableTypes.map((type) => (
                <label
                  key={type.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.request_type === type.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={type.id} />
                  <span>{isRu ? type.ru : type.en}</span>
                </label>
              ))}
            </RadioGroup>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                {isRu ? 'Назад' : 'Back'}
              </Button>
              <Button 
                className="flex-1"
                disabled={!formData.request_type}
                onClick={() => setStep(3)}
              >
                {isRu ? 'Далее' : 'Continue'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{isRu ? 'Детали запроса' : 'Request Details'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Тема' : 'Subject'} *</Label>
              <Input
                value={formData.subject || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder={isRu ? 'Кратко опишите суть запроса' : 'Brief summary of your request'}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Описание' : 'Description'} *</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={isRu ? 'Подробное описание...' : 'Detailed description...'}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Приоритет' : 'Priority'}</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v as 'low' | 'normal' | 'high' | 'urgent' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{isRu ? 'Низкий' : 'Low'}</SelectItem>
                  <SelectItem value="normal">{isRu ? 'Обычный' : 'Normal'}</SelectItem>
                  <SelectItem value="high">{isRu ? 'Высокий' : 'High'}</SelectItem>
                  <SelectItem value="urgent">{isRu ? 'Срочный' : 'Urgent'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Section */}
            {category === 'payment' && (
              <div className="space-y-4 p-4 rounded-lg bg-success/5 border border-success/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-success" />
                    <Label className="text-base">{isRu ? 'Оплата через UNO' : 'Pay via UNO'}</Label>
                  </div>
                  <Switch
                    checked={formData.requires_payment}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, requires_payment: v }))}
                  />
                </div>

                {formData.requires_payment && (
                  <>
                    <div className="space-y-2">
                      <Label>{isRu ? 'Сумма платежа (THB)' : 'Payment Amount (THB)'}</Label>
                      <Input
                        type="number"
                        value={formData.payment_amount || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_amount: parseFloat(e.target.value) || undefined }))}
                        placeholder="15000"
                      />
                    </div>

                    {formData.payment_amount && formData.payment_amount > 0 && (
                      <div className="space-y-2 pt-2 border-t border-success/20">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{isRu ? 'Сумма' : 'Amount'}:</span>
                          <span>฿{formData.payment_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            {isRu ? 'Сервисный сбор' : 'Service Fee'} ({SERVICE_FEE_PERCENT}%)
                            <Info className="h-3 w-3" />
                          </span>
                          <span>฿{calculateFee(formData.payment_amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t border-success/20">
                          <span>{isRu ? 'Итого' : 'Total'}:</span>
                          <span className="text-success">
                            ฿{calculateTotal(formData.payment_amount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {isRu 
                        ? 'UNO выполнит перевод в УК комплекса и предоставит подтверждение оплаты' 
                        : 'UNO will transfer funds to the building management and provide payment confirmation'}
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                {isRu ? 'Назад' : 'Back'}
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSubmit}
                disabled={isCreating || !formData.subject || !formData.description}
              >
                {isCreating 
                  ? (isRu ? 'Создание...' : 'Creating...') 
                  : (isRu ? 'Создать запрос' : 'Create Request')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
