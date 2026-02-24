import React, { useState, useMemo, useCallback } from 'react';
import { useAdminProviders } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

  const [open, setOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedProvider = useMemo(
    () => providers.find(p => p.id === value),
    [providers, value]
  );

  // Keyboard layout mapping: Russian keys → Latin equivalents
  const ruToEnMap: Record<string, string> = {
    'й':'q','ц':'w','у':'e','к':'r','е':'t','н':'y','г':'u','ш':'i','щ':'o','з':'p',
    'ф':'a','ы':'s','в':'d','а':'f','п':'g','р':'h','о':'j','л':'k','д':'l',
    'я':'z','ч':'x','с':'c','м':'v','и':'b','т':'n','ь':'m','б':',','ю':'.',
  };

  const convertLayout = useCallback((input: string) => {
    return input.toLowerCase().split('').map(c => ruToEnMap[c] || c).join('');
  }, []);

  const commandFilter = useCallback((value: string, search: string) => {
    const s = search.toLowerCase();
    const v = value.toLowerCase();
    // Direct match
    if (v.includes(s)) return 1;
    // Try converting search from Russian keyboard layout to English
    const converted = convertLayout(s);
    if (v.includes(converted)) return 1;
    return 0;
  }, [convertLayout]);

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
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled || isCreating}
              className="flex-1 justify-between font-normal"
            >
              {selectedProvider ? (
                <span className="flex items-center gap-2 truncate">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {selectedProvider.name}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {isRussian ? 'Выберите провайдера...' : 'Select provider...'}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50" align="start">
            <Command filter={commandFilter}>
              <CommandInput
                placeholder={isRussian ? 'Начните вводить название...' : 'Type provider name...'}
              />
              <CommandList>
                <CommandEmpty>
                  {isRussian ? 'Не найдено' : 'No provider found'}
                </CommandEmpty>
                <CommandGroup>
                  {providers.map(provider => (
                    <CommandItem
                      key={provider.id}
                      value={provider.name}
                      onSelect={() => {
                        onChange(provider.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === provider.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{provider.name}</span>
                      {!provider.is_verified && (
                        <span className="ml-auto text-xs text-amber-500">
                          {isRussian ? 'не верифицирован' : 'unverified'}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

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
        <DialogContent className="sm:max-w-md" hideOverlay>
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
