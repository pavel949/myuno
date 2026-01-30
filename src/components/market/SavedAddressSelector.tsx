import React, { useState } from 'react';
import { MapPin, Plus, Check, Trash2, Home, Briefcase, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserAddresses, UserAddress, CreateAddressData } from '@/hooks/useUserAddresses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface SavedAddressSelectorProps {
  selectedId: string | null;
  onSelect: (address: UserAddress) => void;
  onNewAddress?: (data: { name: string; phone: string; address: string }) => void;
}

const labelIcons: Record<string, React.ElementType> = {
  Home: Home,
  Work: Briefcase,
  Дом: Home,
  Работа: Briefcase,
};

export const SavedAddressSelector: React.FC<SavedAddressSelectorProps> = ({
  selectedId,
  onSelect,
  onNewAddress,
}) => {
  const { language } = useLanguage();
  const { 
    addresses, 
    isLoading, 
    createAddressAsync, 
    deleteAddress, 
    setDefault,
    isCreating 
  } = useUserAddresses();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState<CreateAddressData>({
    label: 'Home',
    recipient_name: '',
    phone: '',
    address_text: '',
    city: '',
    is_default: false,
  });

  const handleSaveNewAddress = async () => {
    if (!newAddress.recipient_name || !newAddress.phone || !newAddress.address_text) return;
    
    try {
      const saved = await createAddressAsync(newAddress);
      if (saved) {
        onSelect(saved as UserAddress);
        onNewAddress?.({
          name: newAddress.recipient_name,
          phone: newAddress.phone,
          address: newAddress.address_text,
        });
      }
      setIsDialogOpen(false);
      setNewAddress({
        label: 'Home',
        recipient_name: '',
        phone: '',
        address_text: '',
        city: '',
        is_default: false,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-muted rounded-xl" />
        <div className="h-16 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Saved Addresses List */}
      <RadioGroup
        value={selectedId || ''}
        onValueChange={(value) => {
          const address = addresses.find(a => a.id === value);
          if (address) onSelect(address);
        }}
      >
        {addresses.map((address) => {
          const Icon = labelIcons[address.label] || MapPin;
          return (
            <div
              key={address.id}
              className={cn(
                'relative flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer',
                selectedId === address.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => onSelect(address)}
            >
              <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{address.label}</span>
                  {address.is_default && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {language === 'ru' ? 'По умолчанию' : 'Default'}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium">{address.recipient_name}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{address.address_text}</p>
                <p className="text-xs text-muted-foreground">{address.phone}</p>
              </div>

              {/* Actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!address.is_default && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDefault(address.id); }}>
                      <Check className="w-4 h-4 mr-2" />
                      {language === 'ru' ? 'Сделать основным' : 'Set as default'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); deleteAddress(address.id); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === 'ru' ? 'Удалить' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </RadioGroup>

      {/* Add New Address Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            {language === 'ru' ? 'Добавить новый адрес' : 'Add new address'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Новый адрес' : 'New Address'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Label selector */}
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map((label) => (
                <Button
                  key={label}
                  type="button"
                  variant={newAddress.label === label ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewAddress(prev => ({ ...prev, label }))}
                >
                  {language === 'ru' 
                    ? (label === 'Home' ? 'Дом' : label === 'Work' ? 'Работа' : 'Другое')
                    : label
                  }
                </Button>
              ))}
            </div>

            <div>
              <Label>{language === 'ru' ? 'Получатель' : 'Recipient name'} *</Label>
              <Input
                value={newAddress.recipient_name}
                onChange={(e) => setNewAddress(prev => ({ ...prev, recipient_name: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{language === 'ru' ? 'Телефон' : 'Phone'} *</Label>
              <Input
                value={newAddress.phone}
                onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+66"
                className="mt-1"
              />
            </div>

            <div>
              <Label>{language === 'ru' ? 'Адрес' : 'Address'} *</Label>
              <Input
                value={newAddress.address_text}
                onChange={(e) => setNewAddress(prev => ({ ...prev, address_text: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{language === 'ru' ? 'Город' : 'City'}</Label>
              <Input
                value={newAddress.city || ''}
                onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={newAddress.is_default || false}
                onChange={(e) => setNewAddress(prev => ({ ...prev, is_default: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="is_default" className="text-sm cursor-pointer">
                {language === 'ru' ? 'Использовать по умолчанию' : 'Set as default'}
              </Label>
            </div>

            <Button 
              onClick={handleSaveNewAddress} 
              disabled={isCreating || !newAddress.recipient_name || !newAddress.phone || !newAddress.address_text}
              className="w-full"
            >
              {isCreating 
                ? (language === 'ru' ? 'Сохранение...' : 'Saving...') 
                : (language === 'ru' ? 'Сохранить' : 'Save')
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {addresses.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          {language === 'ru' 
            ? 'Сохраните адрес для быстрого оформления заказов' 
            : 'Save an address for faster checkout'
          }
        </p>
      )}
    </div>
  );
};
