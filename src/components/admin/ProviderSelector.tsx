import React, { useState } from 'react';
import { useAdminProviders } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BusinessCardScanButton, ScannedProviderData } from './BusinessCardScanButton';

interface ProviderSelectorProps {
  value: string;
  onChange: (providerId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function ProviderSelector({ 
  value, 
  onChange, 
  label,
  required = false,
  disabled = false
}: ProviderSelectorProps) {
  const { language } = useLanguage();
  const { providers, isLoading, refetch } = useAdminProviders();
  const isRussian = language === 'ru';

  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleQuickCreate = async () => {
    if (!quickName.trim()) return;
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('providers')
        .insert({
          name: quickName.trim(),
          phone: quickPhone.trim() || null,
          email: quickEmail.trim() || null,
          is_active: true,
          is_verified: true,
          created_by_uno_team: true,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success(isRussian ? 'Провайдер создан' : 'Provider created');
      await refetch();
      onChange(data.id);
      setIsQuickCreateOpen(false);
      setQuickName('');
      setQuickPhone('');
      setQuickEmail('');
    } catch (err) {
      console.error('Quick create error:', err);
      toast.error(isRussian ? 'Ошибка создания' : 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  const handleScannedData = async (data: ScannedProviderData) => {
    setIsCreating(true);
    try {
      const { data: created, error } = await supabase
        .from('providers')
        .insert({
          name: data.name,
          business_category: data.business_category || 'other',
          description_en: data.description_en || null,
          description_ru: data.description_ru || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          address: data.address || null,
          is_active: true,
          is_verified: true,
          created_by_uno_team: true,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success(isRussian ? 'Провайдер создан из визитки!' : 'Provider created from card!');
      await refetch();
      onChange(created.id);
    } catch (err) {
      console.error('Create from scan error:', err);
      toast.error(isRussian ? 'Ошибка создания' : 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && '*'}
        </Label>
      )}
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange} disabled={disabled || isCreating}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={isRussian ? 'Выберите провайдера' : 'Select provider'} />
          </SelectTrigger>
          <SelectContent>
            {providers.map(provider => (
              <SelectItem key={provider.id} value={provider.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{provider.name}</span>
                  {!provider.is_verified && (
                    <span className="text-xs text-amber-500">
                      ({isRussian ? 'не верифицирован' : 'unverified'})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quick Create Button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsQuickCreateOpen(true)}
          disabled={disabled || isCreating}
          title={isRussian ? 'Быстро создать' : 'Quick create'}
        >
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>

        {/* Scan Card Button */}
        <BusinessCardScanButton
          onDataExtracted={handleScannedData}
          variant="outline"
          size="icon"
          className="shrink-0"
        />
      </div>

      {/* Quick Create Dialog */}
      <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isRussian ? 'Быстрое создание провайдера' : 'Quick Create Provider'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRussian ? 'Название *' : 'Name *'}</Label>
              <Input
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="Thai Massage & Spa"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isRussian ? 'Телефон' : 'Phone'}</Label>
                <Input
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  placeholder="+66..."
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={quickEmail}
                  onChange={(e) => setQuickEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickCreateOpen(false)}>
              {isRussian ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleQuickCreate} disabled={!quickName.trim() || isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isRussian ? 'Создать' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
