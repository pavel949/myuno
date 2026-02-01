import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOtaConnections, useOtaSync, useOtaSyncedListing, useApplySyncedData } from '@/hooks/useOtaSync';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Globe, Sparkles, Loader2, CheckCircle2, AlertCircle, ExternalLink,
  Home, Bed, Bath, Users, DollarSign, Image, FileText, MapPin
} from 'lucide-react';
import { toast } from 'sonner';

// Supported OTA platforms
const OTA_PLATFORMS = [
  { id: 'airbnb', name: 'Airbnb', icon: '🏠', color: 'bg-red-100 text-red-800' },
  { id: 'booking', name: 'Booking.com', icon: '🏨', color: 'bg-blue-100 text-blue-800' },
  { id: 'vrbo', name: 'VRBO', icon: '🏡', color: 'bg-purple-100 text-purple-800' },
  { id: 'expedia', name: 'Expedia', icon: '✈️', color: 'bg-yellow-100 text-yellow-800' },
];

// Fields that can be imported
const IMPORT_FIELDS = [
  { id: 'title', labelEn: 'Title', labelRu: 'Название', icon: FileText },
  { id: 'description', labelEn: 'Description', labelRu: 'Описание', icon: FileText },
  { id: 'bedrooms', labelEn: 'Bedrooms', labelRu: 'Спальни', icon: Bed },
  { id: 'bathrooms', labelEn: 'Bathrooms', labelRu: 'Ванные', icon: Bath },
  { id: 'max_guests', labelEn: 'Max Guests', labelRu: 'Гостей', icon: Users },
  { id: 'price', labelEn: 'Price', labelRu: 'Цена', icon: DollarSign },
  { id: 'photos', labelEn: 'Photos', labelRu: 'Фото', icon: Image },
  { id: 'amenities', labelEn: 'Amenities', labelRu: 'Удобства', icon: Home },
  { id: 'address', labelEn: 'Address', labelRu: 'Адрес', icon: MapPin },
  { id: 'house_rules', labelEn: 'House Rules', labelRu: 'Правила', icon: FileText },
];

type ImportStep = 'input' | 'preview' | 'select' | 'complete';

export default function OwnerPropertyImport() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const [step, setStep] = useState<ImportStep>('input');
  const [url, setUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'title', 'description', 'bedrooms', 'bathrooms', 'max_guests', 'price', 'photos', 'amenities'
  ]);
  
  const { createConnection } = useOtaConnections();
  const syncMutation = useOtaSync();
  const applyMutation = useApplySyncedData();
  const { data: syncedListing, isLoading: isLoadingListing } = useOtaSyncedListing(connectionId || undefined);

  // Detect platform from URL
  const detectPlatform = (inputUrl: string) => {
    const lowerUrl = inputUrl.toLowerCase();
    if (lowerUrl.includes('airbnb')) return 'airbnb';
    if (lowerUrl.includes('booking.com')) return 'booking';
    if (lowerUrl.includes('vrbo')) return 'vrbo';
    if (lowerUrl.includes('expedia')) return 'expedia';
    return null;
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    const detected = detectPlatform(value);
    if (detected) setSelectedPlatform(detected);
  };

  const handleAnalyze = async () => {
    if (!url.trim() || !selectedPlatform) {
      toast.error(isRu ? 'Введите корректную ссылку' : 'Please enter a valid URL');
      return;
    }

    try {
      // Create connection
      const connection = await createConnection.mutateAsync({
        platform: selectedPlatform as any,
        listing_url: url,
      });
      
      setConnectionId(connection.id);

      // Trigger sync
      await syncMutation.mutateAsync({
        connection_id: connection.id,
        sync_type: 'full',
      });

      setStep('preview');
    } catch (error) {
      console.error('Error analyzing URL:', error);
    }
  };

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleCreateProperty = async () => {
    if (!connectionId || !syncedListing) return;

    try {
      // For now, we'll navigate to property creation with prefilled data
      // In the future, this could directly create the property
      navigate('/owner/properties/new', {
        state: {
          prefillData: {
            title: syncedListing.title,
            description: syncedListing.description,
            bedrooms: syncedListing.bedrooms,
            bathrooms: syncedListing.bathrooms,
            max_guests: syncedListing.max_guests,
            price_per_night: syncedListing.price_per_night,
            images: syncedListing.photos?.map(p => p.url) || [],
            cover_image: syncedListing.cover_photo,
            address: syncedListing.address,
          },
          sourceConnection: connectionId,
        }
      });
      
      toast.success(isRu ? 'Данные загружены! Проверьте и сохраните объект.' : 'Data loaded! Review and save the property.');
    } catch (error) {
      console.error('Error creating property:', error);
    }
  };

  const platform = selectedPlatform ? OTA_PLATFORMS.find(p => p.id === selectedPlatform) : null;
  const isAnalyzing = createConnection.isPending || syncMutation.isPending;

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title={isRu ? 'Импорт с OTA' : 'Import from OTA'}
        subtitle={isRu 
          ? 'Автоматически перенесите данные с Airbnb, Booking и других площадок'
          : 'Automatically import your listing from Airbnb, Booking, and other platforms'
        }
      />

      {/* Step: Input URL */}
      {step === 'input' && (
        <div className="space-y-6">
          {/* Supported platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {isRu ? 'Поддерживаемые площадки' : 'Supported Platforms'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {OTA_PLATFORMS.map(p => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedPlatform === p.id 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{p.icon}</span>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* URL Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isRu ? 'Ссылка на объект' : 'Listing URL'}
              </CardTitle>
              <CardDescription>
                {isRu 
                  ? 'Вставьте ссылку на ваш объект с любой площадки'
                  : 'Paste the link to your listing from any platform'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isRu ? 'URL объекта' : 'Listing URL'}</Label>
                <Input
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://www.airbnb.com/rooms/123456..."
                  className="font-mono text-sm"
                />
                {platform && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {isRu ? 'Обнаружено:' : 'Detected:'} {platform.icon} {platform.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!url.trim() || !selectedPlatform || isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isRu ? 'Анализирую...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isRu ? 'Загрузить данные' : 'Import Data'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">
                    {isRu ? 'Как это работает:' : 'How it works:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{isRu ? 'AI извлекает все данные с площадки' : 'AI extracts all data from the platform'}</li>
                    <li>{isRu ? 'Вы проверяете и редактируете информацию' : 'You review and edit the information'}</li>
                    <li>{isRu ? 'Объект создаётся на myUNO' : 'Property is created on myUNO'}</li>
                    <li>{isRu ? 'Календарь синхронизируется автоматически' : 'Calendar syncs automatically'}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Loading state */}
          {isLoadingListing && (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">
                    {isRu ? 'Загружаем данные...' : 'Loading data...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Synced data preview */}
          {syncedListing && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{syncedListing.title || 'Untitled'}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {platform && (
                          <Badge variant="secondary" className={platform.color}>
                            {platform.icon} {platform.name}
                          </Badge>
                        )}
                        {syncedListing.rating && (
                          <span>★ {syncedListing.rating} ({syncedListing.review_count} reviews)</span>
                        )}
                      </CardDescription>
                    </div>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cover photo */}
                  {syncedListing.cover_photo && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={syncedListing.cover_photo} 
                        alt={syncedListing.title || ''} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Key stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Bed className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="font-semibold">{syncedListing.bedrooms || '—'}</p>
                      <p className="text-xs text-muted-foreground">{isRu ? 'Спальни' : 'Beds'}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Bath className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="font-semibold">{syncedListing.bathrooms || '—'}</p>
                      <p className="text-xs text-muted-foreground">{isRu ? 'Ванные' : 'Baths'}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="font-semibold">{syncedListing.max_guests || '—'}</p>
                      <p className="text-xs text-muted-foreground">{isRu ? 'Гостей' : 'Guests'}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="font-semibold">
                        {syncedListing.price_per_night 
                          ? `${syncedListing.currency === 'THB' ? '฿' : '$'}${syncedListing.price_per_night}`
                          : '—'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">{isRu ? '/ночь' : '/night'}</p>
                    </div>
                  </div>

                  {/* Description preview */}
                  {syncedListing.description && (
                    <div>
                      <Label className="text-sm">{isRu ? 'Описание' : 'Description'}</Label>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                        {syncedListing.description}
                      </p>
                    </div>
                  )}

                  {/* Amenities preview */}
                  {syncedListing.amenities && syncedListing.amenities.length > 0 && (
                    <div>
                      <Label className="text-sm">{isRu ? 'Удобства' : 'Amenities'}</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {syncedListing.amenities.slice(0, 8).map((amenity, i) => (
                          <Badge key={i} variant="outline">{amenity}</Badge>
                        ))}
                        {syncedListing.amenities.length > 8 && (
                          <Badge variant="outline">+{syncedListing.amenities.length - 8}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Photo count */}
                  {syncedListing.photos && syncedListing.photos.length > 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      {syncedListing.photos.length} {isRu ? 'фото загружено' : 'photos imported'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Field selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {isRu ? 'Выберите данные для импорта' : 'Select Data to Import'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {IMPORT_FIELDS.map(field => {
                      const Icon = field.icon;
                      const hasData = field.id === 'photos' 
                        ? syncedListing.photos?.length 
                        : syncedListing[field.id as keyof typeof syncedListing];
                      
                      return (
                        <div
                          key={field.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedFields.includes(field.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          } ${!hasData ? 'opacity-50' : ''}`}
                          onClick={() => hasData && handleFieldToggle(field.id)}
                        >
                          <Checkbox
                            checked={selectedFields.includes(field.id)}
                            disabled={!hasData}
                          />
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {isRu ? field.labelRu : field.labelEn}
                          </span>
                          {!hasData && (
                            <Badge variant="outline" className="ml-auto text-xs">
                              {isRu ? 'Нет' : 'N/A'}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('input');
                    setConnectionId(null);
                  }}
                  className="flex-1"
                >
                  {isRu ? 'Назад' : 'Back'}
                </Button>
                <Button
                  onClick={handleCreateProperty}
                  disabled={selectedFields.length === 0}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isRu ? 'Создать объект' : 'Create Property'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
}
