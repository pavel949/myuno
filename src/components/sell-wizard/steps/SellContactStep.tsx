import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserListingDraft } from '@/types/userListing';
import { Phone, MessageCircle, MapPin, Eye, EyeOff } from 'lucide-react';

interface SellContactStepProps {
  draft: UserListingDraft;
  onChange: (updates: Partial<UserListingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SellContactStep({ draft, onChange, onNext, onBack }: SellContactStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {isRu 
          ? 'Как покупатели смогут с вами связаться?' 
          : 'How can buyers contact you?'}
      </p>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {isRu ? 'Телефон' : 'Phone number'}
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+66 XX XXX XXXX"
            value={draft.contact_phone || ''}
            onChange={(e) => onChange({ contact_phone: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="+66 XX XXX XXXX"
            value={draft.contact_whatsapp || ''}
            onChange={(e) => onChange({ contact_whatsapp: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {isRu ? 'Местоположение' : 'Location'}
          </Label>
          <Input
            id="location"
            placeholder={isRu ? 'Например: Пхукет, Патонг' : 'e.g., Phuket, Patong'}
            value={draft.location || ''}
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between p-4 rounded-none bg-muted/50">
        <div className="flex items-center gap-3">
          {draft.show_phone ? (
            <Eye className="h-5 w-5 text-muted-foreground" />
          ) : (
            <EyeOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">
              {isRu ? 'Показывать телефон' : 'Show phone number'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Телефон будет виден в объявлении' 
                : 'Phone will be visible in your listing'}
            </p>
          </div>
        </div>
        <Switch
          checked={draft.show_phone}
          onCheckedChange={(checked) => onChange({ show_phone: checked })}
        />
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {isRu ? 'Назад' : 'Back'}
        </Button>
        <Button onClick={onNext} className="flex-1">
          {isRu ? 'Продолжить' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
