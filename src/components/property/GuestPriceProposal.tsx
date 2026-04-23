import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Send } from 'lucide-react';
import { usePropertyPriceOffers } from '@/hooks/usePropertyPriceOffers';
import { toast } from 'sonner';

interface GuestPriceProposalProps {
  propertyId: string;
  pricePerNight: number;
  nights: number;
  checkIn?: string;
  checkOut?: string;
}

export function GuestPriceProposal({
  propertyId,
  pricePerNight,
  nights,
  checkIn,
  checkOut,
}: GuestPriceProposalProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { createOffer } = usePropertyPriceOffers(propertyId);

  const [open, setOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const originalTotal = pricePerNight * (nights || 1);
  const proposed = Number(proposedPrice) || 0;
  const discountPercent = proposed > 0 ? Math.round((1 - proposed / originalTotal) * 100) : 0;

  const handleSubmit = async () => {
    if (!proposed || proposed <= 0) return;
    setIsSubmitting(true);
    try {
      await createOffer({
        property_id: propertyId,
        type: 'negotiation_request',
        original_price: originalTotal,
        offered_price: proposed,
        discount_percent: discountPercent,
        nights: nights || 1,
        valid_from: checkIn || new Date().toISOString().split('T')[0],
        valid_until: checkOut || new Date().toISOString().split('T')[0],
        message: message || null,
        status: 'pending',
      });
      toast.success(isRu ? 'Предложение отправлено!' : 'Proposal sent!');
      setOpen(false);
      setProposedPrice('');
      setMessage('');
    } catch {
      toast.error(isRu ? 'Ошибка отправки' : 'Failed to send');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <MessageSquare className="h-4 w-4 mr-2" />
          {isRu ? 'Предложить свою цену' : 'Propose Your Price'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Предложить свою цену' : 'Propose Your Price'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-muted rounded-none text-sm">
            <p className="text-muted-foreground">
              {isRu ? 'Текущая цена:' : 'Current price:'}
              {' '}
              <span className="font-semibold text-foreground">
                ฿{originalTotal.toLocaleString()}
              </span>
              {' '}
              ({nights} {isRu ? 'ночей' : 'nights'})
            </p>
          </div>

          <div className="space-y-2">
            <Label>{isRu ? 'Ваша цена (THB)' : 'Your Price (THB)'}</Label>
            <Input
              type="number"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
              placeholder={String(Math.round(originalTotal * 0.85))}
            />
            {proposed > 0 && discountPercent > 0 && (
              <p className="text-xs text-success">
                {isRu ? `Скидка ${discountPercent}%` : `${discountPercent}% discount`}
              </p>
            )}
            {proposed > 0 && discountPercent < 0 && (
              <p className="text-xs text-destructive">
                {isRu ? 'Цена выше текущей' : 'Price is above current'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{isRu ? 'Сообщение (необязательно)' : 'Message (optional)'}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isRu ? 'Расскажите почему...' : 'Tell us why...'}
              rows={2}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!proposed || proposed <= 0 || isSubmitting}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isRu ? 'Отправить предложение' : 'Send Proposal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
