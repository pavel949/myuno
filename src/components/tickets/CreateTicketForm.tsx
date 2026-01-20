import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCcw, 
  Star, 
  ShieldAlert, 
  Wrench, 
  CreditCard, 
  Truck, 
  XCircle, 
  HelpCircle,
  Loader2,
  Upload 
} from 'lucide-react';
import { useTickets, type TicketCategory, type TicketPriority, type CreateTicketInput } from '@/hooks/useTickets';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useLanguage } from '@/contexts/LanguageContext';

const categories: { value: TicketCategory; label: string; labelRu: string; icon: React.ElementType }[] = [
  { value: 'refund', label: 'Refund Request', labelRu: 'Запрос возврата', icon: RefreshCcw },
  { value: 'quality', label: 'Quality Issue', labelRu: 'Проблема качества', icon: Star },
  { value: 'fraud', label: 'Fraud Report', labelRu: 'Мошенничество', icon: ShieldAlert },
  { value: 'damage', label: 'Damage Claim', labelRu: 'Повреждение', icon: Wrench },
  { value: 'payment', label: 'Payment Issue', labelRu: 'Проблема с оплатой', icon: CreditCard },
  { value: 'delivery', label: 'Delivery Problem', labelRu: 'Проблема доставки', icon: Truck },
  { value: 'cancellation', label: 'Cancellation', labelRu: 'Отмена заказа', icon: XCircle },
  { value: 'other', label: 'Other', labelRu: 'Другое', icon: HelpCircle },
];

const priorities: { value: TicketPriority; label: string; labelRu: string }[] = [
  { value: 'low', label: 'Low', labelRu: 'Низкий' },
  { value: 'normal', label: 'Normal', labelRu: 'Обычный' },
  { value: 'high', label: 'High', labelRu: 'Высокий' },
  { value: 'urgent', label: 'Urgent', labelRu: 'Срочно' },
];

interface CreateTicketFormProps {
  orderId?: string;
  orderNumber?: string;
  prefilledCategory?: TicketCategory;
  onSuccess?: () => void;
}

export function CreateTicketForm({ orderId, orderNumber, prefilledCategory, onSuccess }: CreateTicketFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { createTicket } = useTickets();
  const { language } = useLanguage();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateTicketInput>({
    category: prefilledCategory || 'other',
    priority: 'normal',
    subject: orderNumber ? `Проблема с заказом ${orderNumber}` : '',
    description: '',
    reporter_name: profile?.full_name || '',
    reporter_email: profile?.email || user?.email || '',
    reporter_phone: profile?.phone || '',
    order_id: orderId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      const ticket = await createTicket(formData);
      if (ticket) {
        onSuccess?.();
        navigate(`/support/tickets/${ticket.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'ru' ? 'Тип обращения' : 'Issue Type'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs text-center ${isSelected ? 'font-medium' : ''}`}>
                    {language === 'ru' ? cat.labelRu : cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'ru' ? 'Детали обращения' : 'Issue Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">
              {language === 'ru' ? 'Тема' : 'Subject'} *
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder={language === 'ru' ? 'Кратко опишите проблему' : 'Brief description of the issue'}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">
              {language === 'ru' ? 'Описание' : 'Description'} *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={language === 'ru' 
                ? 'Подробно опишите ситуацию: что произошло, когда это случилось, какой результат вы ожидаете...' 
                : 'Describe the situation in detail: what happened, when it occurred, what outcome you expect...'}
              rows={5}
              required
            />
          </div>

          <div>
            <Label htmlFor="priority">
              {language === 'ru' ? 'Приоритет' : 'Priority'}
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TicketPriority }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {language === 'ru' ? p.labelRu : p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Attachments placeholder */}
          <div>
            <Label>
              {language === 'ru' ? 'Прикрепить файлы' : 'Attachments'}
            </Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {language === 'ru' 
                  ? 'Перетащите файлы или нажмите для выбора' 
                  : 'Drag files here or click to select'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{language === 'ru' ? 'Имя' : 'Name'}</Label>
              <Input
                id="name"
                value={formData.reporter_name}
                onChange={(e) => setFormData(prev => ({ ...prev, reporter_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">{language === 'ru' ? 'Телефон' : 'Phone'}</Label>
              <Input
                id="phone"
                value={formData.reporter_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, reporter_phone: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.reporter_email}
              onChange={(e) => setFormData(prev => ({ ...prev, reporter_email: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {language === 'ru' ? 'Отправка...' : 'Submitting...'}
          </>
        ) : (
          language === 'ru' ? 'Отправить обращение' : 'Submit Ticket'
        )}
      </Button>
    </form>
  );
}
