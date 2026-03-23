import React, { useState, useMemo, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useAdminProviders } from '@/hooks/useAdmin';
import { useManagementCompanies } from '@/hooks/useManagementCompanies';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Loader2, Check, ChevronsUpDown, Search, Home } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BusinessCardScanButton, ScannedProviderData } from './BusinessCardScanButton';

// Russian keyboard → Latin layout map
const RU_TO_EN: Record<string, string> = {
  'й':'q','ц':'w','у':'e','к':'r','е':'t','н':'y','г':'u','ш':'i','щ':'o','з':'p',
  'ф':'a','ы':'s','в':'d','а':'f','п':'g','р':'h','о':'j','л':'k','д':'l',
  'я':'z','ч':'x','с':'c','м':'v','и':'b','т':'n','ь':'m','б':',','ю':'.',
};

function convertLayout(input: string) {
  return input.toLowerCase().split('').map(c => RU_TO_EN[c] || c).join('');
}

function matchesSearch(name: string, search: string): boolean {
  if (!search) return true;
  const s = search.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes(s)) return true;
  if (n.includes(convertLayout(s))) return true;
  return false;
}

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
  const { data: managementCompanies, isLoading: mcLoading } = useManagementCompanies();
  const isRussian = language === 'ru';

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Management companies list (now unified single table)
  const allMCs = useMemo(() => {
    return (managementCompanies || []).map(c => ({
      id: c.id,
      name: isRussian ? c.name_ru : c.name_en,
    }));
  }, [managementCompanies, isRussian]);

  const selectedProvider = useMemo(
    () => providers.find(p => p.id === value),
    [providers, value]
  );

  const selectedMC = useMemo(
    () => !selectedProvider ? allMCs.find(c => c.id === value) : null,
    [allMCs, value, selectedProvider]
  );

  const selectedLabel = selectedProvider?.name || selectedMC?.name || null;

  const filteredProviders = useMemo(
    () => providers.filter(p => matchesSearch(p.name, search)),
    [providers, search]
  );

  const filteredMCs = useMemo(
    () => allMCs.filter(c => matchesSearch(c.name, search)),
    [allMCs, search]
  );

  // Auto-focus search input when popover opens
  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

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
      logger.error('Quick create error:', err);
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
      logger.error('Create from scan error:', err);
      toast.error(isRussian ? 'Ошибка создания' : 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading || mcLoading) {
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
        <Popover open={open} onOpenChange={setOpen} modal>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled || isCreating}
              className="flex-1 justify-between font-normal"
            >
              {selectedLabel ? (
                <span className="flex items-center gap-2 truncate">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {selectedLabel}
                  {selectedMC && (
                    <span className="text-xs text-muted-foreground">(УК)</span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {isRussian ? 'Выберите провайдера / УК...' : 'Select provider / PM...'}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0 z-[100]"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {/* Search input */}
            <div className="flex items-center border-b px-3 bg-popover">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isRussian ? 'Начните вводить название...' : 'Type provider name...'}
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            {/* Provider list */}
            <ScrollArea className="max-h-[300px]">
              {filteredMCs.length === 0 && filteredProviders.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {isRussian ? 'Не найдено' : 'No results found'}
                </p>
              ) : (
                <div className="p-1">
                  {/* Management Companies section */}
                  {filteredMCs.length > 0 && (
                    <>
                      <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        {isRussian ? 'Управляющие компании' : 'Management Companies'}
                      </p>
                      {filteredMCs.map(mc => (
                        <button
                          key={`mc-${mc.id}`}
                          type="button"
                          onClick={() => {
                            onChange(mc.id);
                            setOpen(false);
                          }}
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                            "hover:bg-accent hover:text-accent-foreground",
                            value === mc.id && "bg-accent"
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              value === mc.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Home className="mr-2 h-4 w-4 shrink-0 text-primary" />
                          <span className="truncate">
                            {mc.name}
                          </span>
                          <span className="ml-auto text-xs text-muted-foreground">УК</span>
                        </button>
                      ))}
                    </>
                  )}
                  {/* Providers section */}
                  {filteredProviders.length > 0 && (
                    <>
                      <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        {isRussian ? 'Провайдеры' : 'Providers'}
                      </p>
                      {filteredProviders.map(provider => (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => {
                            onChange(provider.id);
                            setOpen(false);
                          }}
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                            "hover:bg-accent hover:text-accent-foreground",
                            value === provider.id && "bg-accent"
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              value === provider.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{provider.name}</span>
                          {!provider.is_verified && (
                            <span className="ml-auto text-xs text-warning">
                              {isRussian ? 'не верифицирован' : 'unverified'}
                            </span>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
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
