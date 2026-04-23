import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Check, X, Clock } from 'lucide-react';
import { usePropertyPriceOffers, type PropertyPriceOffer } from '@/hooks/usePropertyPriceOffers';
import { format } from 'date-fns';

interface NegotiationPanelProps {
  propertyId: string;
  pricePerNight: number;
  className?: string;
}

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: 'bg-warning/20 text-warning', icon: Clock },
  accepted: { color: 'bg-success/20 text-success', icon: Check },
  declined: { color: 'bg-destructive/20 text-destructive', icon: X },
  expired: { color: 'bg-muted text-muted-foreground', icon: Clock },
  countered: { color: 'bg-info/20 text-info', icon: MessageSquare },
};

/**
 * Manager-side panel for creating special offers and responding to guest negotiations
 */
export function NegotiationPanel({ propertyId, pricePerNight, className }: NegotiationPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { offers, isLoading, createOffer, respondToOffer } = usePropertyPriceOffers(propertyId);

  const [showForm, setShowForm] = useState(false);
  const [offerData, setOfferData] = useState({
    offered_price: '',
    nights: '',
    valid_from: '',
    valid_until: '',
    message: '',
  });

  const handleSendOffer = async () => {
    if (!offerData.offered_price || !offerData.valid_from || !offerData.valid_until) return;

    const nights = Number(offerData.nights) || 1;
    const original = pricePerNight * nights;
    const offered = Number(offerData.offered_price);

    await createOffer({
      property_id: propertyId,
      type: 'special_offer',
      original_price: original,
      offered_price: offered,
      discount_percent: Math.round((1 - offered / original) * 100),
      nights,
      valid_from: offerData.valid_from,
      valid_until: offerData.valid_until,
      message: offerData.message || null,
      status: 'pending',
    });

    setShowForm(false);
    setOfferData({ offered_price: '', nights: '', valid_from: '', valid_until: '', message: '' });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {isRu ? 'Спецпредложения и торг' : 'Offers & Negotiations'}
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Send className="h-3 w-3 mr-1" />
            {isRu ? 'Новое предложение' : 'New Offer'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Offer Form */}
        {showForm && (
          <div className="p-4 rounded-none border border-primary/20 bg-primary/5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Цена (THB)' : 'Price (THB)'}</Label>
                <Input
                  type="number"
                  value={offerData.offered_price}
                  onChange={(e) => setOfferData(d => ({ ...d, offered_price: e.target.value }))}
                  placeholder={String(pricePerNight)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Ночей' : 'Nights'}</Label>
                <Input
                  type="number"
                  value={offerData.nights}
                  onChange={(e) => setOfferData(d => ({ ...d, nights: e.target.value }))}
                  placeholder="7"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Действует с' : 'Valid from'}</Label>
                <Input
                  type="date"
                  value={offerData.valid_from}
                  onChange={(e) => setOfferData(d => ({ ...d, valid_from: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Действует до' : 'Valid until'}</Label>
                <Input
                  type="date"
                  value={offerData.valid_until}
                  onChange={(e) => setOfferData(d => ({ ...d, valid_until: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
            <Textarea
              value={offerData.message}
              onChange={(e) => setOfferData(d => ({ ...d, message: e.target.value }))}
              placeholder={isRu ? 'Сообщение для гостя...' : 'Message for the guest...'}
              rows={2}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleSendOffer}>
                <Send className="h-3 w-3 mr-1" />
                {isRu ? 'Отправить' : 'Send'}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}

        {/* Offers list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
        ) : offers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isRu ? 'Нет активных предложений' : 'No active offers'}
          </p>
        ) : (
          <div className="space-y-2">
            {offers.map((offer) => {
              const config = statusConfig[offer.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <div key={offer.id} className="p-3 rounded-none border flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={config.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {offer.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {offer.type === 'negotiation_request'
                          ? (isRu ? 'Запрос гостя' : 'Guest request')
                          : (isRu ? 'Спецпредложение' : 'Special offer')
                        }
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="line-through text-muted-foreground">
                        ฿{offer.original_price.toLocaleString()}
                      </span>
                      {' → '}
                      <span className="font-semibold">
                        ฿{offer.offered_price.toLocaleString()}
                      </span>
                      {offer.discount_percent && (
                        <span className="text-success text-xs ml-1">(-{offer.discount_percent}%)</span>
                      )}
                    </p>
                    {offer.message && (
                      <p className="text-xs text-muted-foreground">{offer.message}</p>
                    )}
                  </div>

                  {/* Actions for pending guest requests */}
                  {offer.status === 'pending' && offer.type === 'negotiation_request' && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-success"
                        onClick={() => respondToOffer(offer.id, 'accepted')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => respondToOffer(offer.id, 'declined')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
