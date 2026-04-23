import { useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PaymentMethodCard } from './PaymentMethodCard';
import { usePaymentMethods, CreatePaymentMethodData } from '@/hooks/usePaymentMethods';
import { useLanguage } from '@/contexts/LanguageContext';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';

export function PaymentMethodsSection() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const {
    paymentMethods,
    isLoading,
    addPaymentMethod,
    setDefaultMethod,
    deletePaymentMethod,
    isAdding,
  } = usePaymentMethods();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePaymentMethodData>({
    type: 'card',
    last4: '',
    brand: 'visa',
    exp_month: undefined,
    exp_year: undefined,
    holder_name: '',
    is_default: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.last4.length !== 4) return;

    addPaymentMethod(formData);
    setIsDialogOpen(false);
    setFormData({
      type: 'card',
      last4: '',
      brand: 'visa',
      exp_month: undefined,
      exp_year: undefined,
      holder_name: '',
      is_default: false,
    });
  };

  if (isLoading) {
    return <ContentSkeleton variant="card" count={2} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {isRu ? 'Мои карты' : 'My Cards'}
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              {isRu ? 'Добавить' : 'Add'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isRu ? 'Добавить карту' : 'Add Card'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Последние 4 цифры' : 'Last 4 digits'}</Label>
                <Input
                  value={formData.last4}
                  onChange={(e) => setFormData({ ...formData, last4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="1234"
                  maxLength={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Платёжная система' : 'Card Brand'}</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(value) => setFormData({ ...formData, brand: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="mir">МИР</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Месяц' : 'Month'}</Label>
                  <Select
                    value={formData.exp_month?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, exp_month: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {String(month).padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Год' : 'Year'}</Label>
                  <Select
                    value={formData.exp_year?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, exp_year: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="YY" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => 2025 + i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Имя держателя' : 'Cardholder Name'}</Label>
                <Input
                  value={formData.holder_name}
                  onChange={(e) => setFormData({ ...formData, holder_name: e.target.value.toUpperCase() })}
                  placeholder="IVAN PETROV"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRu ? 'Сделать основной' : 'Set as default'}</Label>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isAdding || formData.last4.length !== 4}>
                {isAdding ? (isRu ? 'Добавление...' : 'Adding...') : (isRu ? 'Добавить карту' : 'Add Card')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-none border-dashed">
          <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{isRu ? 'Нет сохранённых карт' : 'No saved cards'}</p>
          <p className="text-xs">{isRu ? 'Добавьте карту для быстрой оплаты' : 'Add a card for quick payments'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
              >
                <PaymentMethodCard
                  method={method}
                  onSetDefault={setDefaultMethod}
                  onDelete={deletePaymentMethod}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
