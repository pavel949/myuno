import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, Loader2, Search, ArrowLeft, ExternalLink, 
  CheckCircle2, AlertCircle, Globe 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CHANNEL_REGISTRY, 
  CATEGORY_LABELS, 
  type ChannelRegistryEntry, 
  type ChannelCategory 
} from '@/components/owner/channel-manager/channelRegistry';

interface OtaImportPanelProps {
  onDataExtracted: (data: Record<string, any>) => void;
}

/** OTA platforms that support listing page scraping (not just iCal) */
const SCRAPABLE_PLATFORMS: Record<string, { 
  urlValidator: (url: string) => boolean; 
  urlPlaceholder: string;
  syncFunction: string; // edge function name
}> = {
  airbnb: {
    urlValidator: (url) => /airbnb\.[a-z.]+\/(rooms|h)\//.test(url),
    urlPlaceholder: 'https://www.airbnb.com/rooms/12345678',
    syncFunction: 'airbnb-sync',
  },
  booking: {
    urlValidator: (url) => /booking\.com\/hotel/.test(url),
    urlPlaceholder: 'https://www.booking.com/hotel/th/your-hotel.html',
    syncFunction: 'ota-scrape',
  },
  vrbo: {
    urlValidator: (url) => /vrbo\.com\/([\d]+|[a-z])/i.test(url),
    urlPlaceholder: 'https://www.vrbo.com/12345678',
    syncFunction: 'ota-scrape',
  },
  expedia: {
    urlValidator: (url) => /expedia\.[a-z.]+\//i.test(url),
    urlPlaceholder: 'https://www.expedia.com/hotel/...',
    syncFunction: 'ota-scrape',
  },
  agoda: {
    urlValidator: (url) => /agoda\.com\//i.test(url),
    urlPlaceholder: 'https://www.agoda.com/hotel-name/...',
    syncFunction: 'ota-scrape',
  },
  tripadvisor: {
    urlValidator: (url) => /tripadvisor\.[a-z.]+\//i.test(url),
    urlPlaceholder: 'https://www.tripadvisor.com/VacationRental...',
    syncFunction: 'ota-scrape',
  },
  trip_com: {
    urlValidator: (url) => /trip\.com\//i.test(url),
    urlPlaceholder: 'https://www.trip.com/hotels/...',
    syncFunction: 'ota-scrape',
  },
  ostrovok: {
    urlValidator: (url) => /ostrovok\.ru\//i.test(url),
    urlPlaceholder: 'https://ostrovok.ru/hotel/...',
    syncFunction: 'ota-scrape',
  },
  sutochno: {
    urlValidator: (url) => /sutochno\.ru\//i.test(url),
    urlPlaceholder: 'https://sutochno.ru/...',
    syncFunction: 'ota-scrape',
  },
  avito: {
    urlValidator: (url) => /avito\.ru\//i.test(url),
    urlPlaceholder: 'https://www.avito.ru/phuket/...',
    syncFunction: 'ota-scrape',
  },
  cian: {
    urlValidator: (url) => /cian\.ru\//i.test(url),
    urlPlaceholder: 'https://www.cian.ru/rent/flat/...',
    syncFunction: 'ota-scrape',
  },
};

/** Categories to show in import panel (only platforms that have listings to scrape) */
const IMPORT_CATEGORIES: ChannelCategory[] = ['major_ota', 'russia_cis', 'asia_pacific', 'vacation_rental'];

export function OtaImportPanel({ onDataExtracted }: OtaImportPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<ChannelRegistryEntry | null>(null);
  const [url, setUrl] = useState('');
  const [search, setSearch] = useState('');
  const [step, setStep] = useState<'select' | 'url' | 'syncing' | 'done' | 'error'>('select');
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter channels that support scraping
  const scrapableChannels = useMemo(() => {
    return CHANNEL_REGISTRY.filter(c => 
      SCRAPABLE_PLATFORMS[c.id] && IMPORT_CATEGORIES.includes(c.category)
    );
  }, []);

  // Group by category
  const grouped = useMemo(() => {
    const filtered = search 
      ? scrapableChannels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
      : scrapableChannels;
    
    const groups: { category: ChannelCategory; label: string; channels: ChannelRegistryEntry[] }[] = [];
    for (const cat of IMPORT_CATEGORIES) {
      const channels = filtered.filter(c => c.category === cat);
      if (channels.length > 0) {
        groups.push({
          category: cat,
          label: isRu ? CATEGORY_LABELS[cat].ru : CATEGORY_LABELS[cat].en,
          channels,
        });
      }
    }
    return groups;
  }, [scrapableChannels, search, isRu]);

  const handleSelectPlatform = (platform: ChannelRegistryEntry) => {
    setSelectedPlatform(platform);
    setUrl('');
    setError(null);
    setStep('url');
  };

  const handleBack = () => {
    setSelectedPlatform(null);
    setStep('select');
    setError(null);
  };

  const handleImport = async () => {
    if (!selectedPlatform || !url.trim()) return;

    const config = SCRAPABLE_PLATFORMS[selectedPlatform.id];
    if (!config) return;

    // Validate URL loosely
    if (!url.startsWith('http')) {
      setError(isRu ? 'URL должен начинаться с https://' : 'URL must start with https://');
      return;
    }

    setStep('syncing');
    setIsSyncing(true);
    setError(null);

    try {
      if (config.syncFunction === 'airbnb-sync') {
        // Use dedicated Airbnb sync
        let connectionId: string | null = null;
        
        if (user) {
          const { data: conn } = await supabase
            .from('ota_listing_connections')
            .insert({
              owner_id: user.id,
              platform: 'airbnb' as any,
              listing_url: url,
            })
            .select('id')
            .single();
          connectionId = conn?.id || null;
        }

        const { data, error: fnError } = await supabase.functions.invoke('airbnb-sync', {
          body: { connection_id: connectionId, listing_url: url, sync_type: 'full' },
        });

        if (fnError) throw new Error(fnError.message);
        if (!data?.success) throw new Error(data?.error || 'Sync failed');

        const listing = data.listing;
        applyListingData(listing);
      } else {
        // Generic OTA scrape via Firecrawl + AI parsing
        const { data, error: fnError } = await supabase.functions.invoke('ota-scrape', {
          body: { 
            url, 
            platform: selectedPlatform.id,
            platform_name: selectedPlatform.name,
          },
        });

        if (fnError) throw new Error(fnError.message);
        if (!data?.success) throw new Error(data?.error || 'Scrape failed');

        applyListingData(data.listing);
      }

      setStep('done');
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err?.message || 'Unknown error');
      setStep('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const applyListingData = (listing: any) => {
    if (!listing) return;
    
    const extracted: Record<string, any> = {};
    
    // Basic info
    if (listing.title) extracted.title = listing.title;
    if (listing.description) extracted.description = listing.description;
    if (listing.bedrooms) extracted.bedrooms = listing.bedrooms;
    if (listing.bathrooms) extracted.bathrooms = listing.bathrooms;
    if (listing.maxGuests || listing.max_guests) extracted.max_guests = listing.maxGuests || listing.max_guests;
    if (listing.area_sqm) extracted.area_sqm = listing.area_sqm;
    
    // Property type
    if (listing.propertyType || listing.property_type) {
      extracted.property_type = listing.propertyType || listing.property_type;
    }
    
    // Location
    if (listing.address) extracted.address = listing.address;
    if (listing.district) extracted.district = listing.district;
    if (listing.lat) extracted.lat = listing.lat;
    if (listing.lng) extracted.lng = listing.lng;
    
    // Pricing
    if (listing.pricePerNight || listing.price_per_night) {
      extracted.price_per_night = String(listing.pricePerNight || listing.price_per_night);
    }
    if (listing.currency) extracted.currency = listing.currency;
    if (listing.min_stay_nights || listing.minStayNights) {
      extracted.min_stay_nights = listing.min_stay_nights || listing.minStayNights;
    }
    
    // Rental conditions
    if (listing.cancellationPolicy || listing.cancellation_policy) {
      extracted.cancellation_policy = listing.cancellationPolicy || listing.cancellation_policy;
    }
    if (listing.instantBooking !== undefined || listing.instant_booking !== undefined) {
      extracted.instant_booking = listing.instantBooking ?? listing.instant_booking;
    }
    if (listing.depositAmount || listing.deposit_amount) {
      extracted.deposit_amount = String(listing.depositAmount || listing.deposit_amount);
    }
    if (listing.depositCurrency || listing.deposit_currency) {
      extracted.deposit_currency = listing.depositCurrency || listing.deposit_currency;
    }
    if (listing.cleaningFee || listing.cleaning_fee) {
      extracted.cleaning_fee = String(listing.cleaningFee || listing.cleaning_fee);
    }
    
    // Equipment (amenities mapped to equipment IDs)
    const equipmentIds = listing.equipment || listing.amenities;
    if (equipmentIds?.length > 0) {
      extracted.equipment = equipmentIds;
    }
    
    // Highlights / Features
    if (listing.highlights?.length > 0) {
      extracted.highlights = listing.highlights;
    }
    
    // House rules
    if (listing.house_rules || listing.houseRules) extracted.house_rules = listing.house_rules || listing.houseRules;
    if (listing.pets_allowed !== undefined) extracted.pets_allowed = listing.pets_allowed;
    if (listing.smoking_allowed !== undefined) extracted.smoking_allowed = listing.smoking_allowed;
    if (listing.parties_allowed !== undefined) extracted.parties_allowed = listing.parties_allowed;
    if (listing.children_friendly !== undefined) extracted.children_friendly = listing.children_friendly;
    if (listing.check_in_time || listing.checkInTime) extracted.check_in_time = listing.check_in_time || listing.checkInTime;
    if (listing.check_out_time || listing.checkOutTime) extracted.check_out_time = listing.check_out_time || listing.checkOutTime;
    
    // Physical attributes
    if (listing.floor) extracted.floor = listing.floor;
    if (listing.view_type) extracted.view_type = listing.view_type;
    if (listing.furnishing_level) extracted.furnishing_level = listing.furnishing_level;
    if (listing.pool_type) extracted.pool_type = listing.pool_type;
    if (listing.parking_type) extracted.parking_type = listing.parking_type;
    
    // Photos
    if (listing.photos?.length > 0) {
      extracted.images = listing.photos.map((p: any) => typeof p === 'string' ? p : p.url);
    }
    if (listing.coverPhoto || listing.cover_photo) {
      extracted.cover_image = listing.coverPhoto || listing.cover_photo;
    }

    onDataExtracted(extracted);
    toast.success(isRu ? 'Данные импортированы и заполнены в форму!' : 'Data imported and filled into form!');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedPlatform(null);
    setStep('select');
    setUrl('');
    setSearch('');
    setError(null);
  };

  const config = selectedPlatform ? SCRAPABLE_PLATFORMS[selectedPlatform.id] : null;

  return (
    <>
      <Card 
        className="border-dashed border-accent-cyan/30 bg-accent-cyan/5 cursor-pointer hover:bg-accent-cyan/10 transition-colors" 
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent-cyan/10">
              <Download className="h-5 w-5 text-accent-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium flex items-center gap-2">
                {isRu ? 'Импорт с OTA-площадки' : 'Import from OTA'}
                <Badge variant="secondary" className="text-xs">Airbnb, Booking, VRBO...</Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                {isRu 
                  ? 'Вставьте ссылку на листинг — парсер извлечёт все данные' 
                  : 'Paste listing URL — parser will extract all data'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ResponsiveModal
        open={isOpen}
        onOpenChange={handleClose}
        title={
          step === 'select' 
            ? (isRu ? 'Импорт с OTA-площадки' : 'Import from OTA')
            : selectedPlatform 
              ? `${selectedPlatform.icon} ${selectedPlatform.name}`
              : ''
        }
        description={
          step === 'select'
            ? (isRu ? 'Выберите площадку для импорта листинга' : 'Choose platform to import listing from')
            : step === 'url'
              ? (isRu ? 'Вставьте ссылку на ваш листинг' : 'Paste your listing URL')
              : undefined
        }
        icon={<Globe className="w-5 h-5 text-accent-cyan" />}
        size="lg"
      >
        {step === 'select' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isRu ? 'Поиск площадки...' : 'Search platform...'}
                className="pl-9"
              />
            </div>

            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4 pr-2">
                {grouped.map(group => (
                  <div key={group.category}>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {group.channels.map(channel => (
                        <button
                          key={channel.id}
                          onClick={() => handleSelectPlatform(channel)}
                          className={`
                            flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left
                            ${channel.bgColor} ${channel.borderColor}
                            hover:scale-[1.02] active:scale-[0.98]
                          `}
                        >
                          <span className="text-xl shrink-0">{channel.icon}</span>
                          <span className="text-sm font-medium truncate">{channel.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {grouped.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {isRu ? 'Площадка не найдена' : 'Platform not found'}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {step === 'url' && selectedPlatform && config && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              {isRu ? 'Назад' : 'Back'}
            </Button>

            <div className="space-y-2">
              <Input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                placeholder={config.urlPlaceholder}
                type="url"
                className="text-base"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>

            {/* What will be imported */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p className="font-medium mb-1.5">
                {isRu ? 'Что будет извлечено:' : 'What will be extracted:'}
              </p>
              <ul className="space-y-0.5 text-xs">
                <li>• {isRu ? 'Название и описание' : 'Title and description'}</li>
                <li>• {isRu ? 'Фотографии объекта' : 'Property photos'}</li>
                <li>• {isRu ? 'Характеристики (спальни, ванные, гости)' : 'Specs (bedrooms, baths, guests)'}</li>
                <li>• {isRu ? 'Цена за ночь и валюта' : 'Price per night and currency'}</li>
                <li>• {isRu ? 'Правила отмены и депозит' : 'Cancellation policy and deposit'}</li>
                <li>• {isRu ? 'Check-in/out, мин. срок проживания' : 'Check-in/out, min stay'}</li>
                <li>• {isRu ? 'Удобства и правила дома' : 'Amenities and house rules'}</li>
                <li>• {isRu ? 'Адрес и координаты' : 'Address and coordinates'}</li>
              </ul>
            </div>

            {/* Platform-specific tips */}
            {selectedPlatform.helpUrl && (
              <a 
                href={selectedPlatform.helpUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {isRu ? `Справка ${selectedPlatform.name}` : `${selectedPlatform.name} Help`}
              </a>
            )}

            <Button onClick={handleImport} className="w-full" disabled={!url.trim()}>
              <Download className="h-4 w-4 mr-2" />
              {isRu ? 'Импортировать данные' : 'Import Data'}
            </Button>
          </div>
        )}

        {step === 'syncing' && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-lg font-medium">
              {isRu ? `Импорт с ${selectedPlatform?.name}...` : `Importing from ${selectedPlatform?.name}...`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isRu ? 'Парсер извлекает данные — до 30 секунд' : 'Parser extracting data — up to 30 seconds'}
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success" />
            <p className="text-lg font-medium">
              {isRu ? 'Данные импортированы!' : 'Data imported!'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isRu ? 'Форма заполнена — проверьте и дополните при необходимости' : 'Form filled — review and complete as needed'}
            </p>
            <Button className="mt-4" onClick={handleClose}>
              {isRu ? 'Закрыть' : 'Close'}
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-medium">
              {isRu ? 'Ошибка импорта' : 'Import failed'}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              {error || (isRu ? 'Попробуйте ещё раз или используйте AI-ввод' : 'Try again or use AI input')}
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Button variant="outline" onClick={() => setStep('url')}>
                {isRu ? 'Попробовать снова' : 'Try again'}
              </Button>
              <Button onClick={handleClose}>
                {isRu ? 'Закрыть' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </>
  );
}
