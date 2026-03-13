import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOtaConnections, useOtaSync, useOtaSyncedListing, useApplySyncedData } from '@/hooks/useOtaSync';
import { useIntakeAgent } from '@/hooks/useIntakeAgent';
import { useDataImport } from '@/hooks/useDataImport';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FileImporter } from '@/components/admin/data-import/FileImporter';
import { FieldMapper } from '@/components/admin/data-import/FieldMapper';
import { ImportPreview } from '@/components/admin/data-import/ImportPreview';
import { 
  Globe, Sparkles, Loader2, CheckCircle2, AlertCircle, ExternalLink,
  Home, Bed, Bath, Users, DollarSign, Image, FileText, MapPin, ShieldAlert, PenLine,
  Bot, Wand2, Edit3, ArrowRight, FileSpreadsheet, CheckCircle, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const errorLog = createErrorHandler('OwnerPropertyImport');

// Import modes
type ImportMode = 'spreadsheet' | 'url' | 'ai';

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

type ImportStep = 'input' | 'preview' | 'select' | 'complete' | 'blocked' | 'ai-result' | 'spreadsheet-map' | 'spreadsheet-preview' | 'spreadsheet-done';

export default function OwnerPropertyImport() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const [importMode, setImportMode] = useState<ImportMode>('spreadsheet');
  const [step, setStep] = useState<ImportStep>('input');
  const [url, setUrl] = useState('');
  const [aiText, setAiText] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'title', 'description', 'bedrooms', 'bathrooms', 'max_guests', 'price', 'photos', 'amenities'
  ]);
  
  const { createConnection } = useOtaConnections();
  const syncMutation = useOtaSync();
  const applyMutation = useApplySyncedData();
  const { data: syncedListing, isLoading: isLoadingListing } = useOtaSyncedListing(connectionId || undefined);
  
  // AI Intake
  const { session: intakeSession, isProcessing: isIntakeProcessing, analyze, reset: resetIntake } = useIntakeAgent();

  // Spreadsheet import
  const SPREADSHEET_TARGET = 'properties';
  const {
    parsedData,
    fieldMappings,
    isLoading: isSpreadsheetLoading,
    importResult,
    parseFile,
    generateAutoMappings,
    setFieldMappings,
    updateMapping,
    transformData,
    importData,
    reset: resetSpreadsheet,
  } = useDataImport();

  const handleSpreadsheetFileSelect = useCallback(async (file: File) => {
    const data = await parseFile(file);
    if (data) {
      const autoMappings = generateAutoMappings(data.headers, SPREADSHEET_TARGET);
      setFieldMappings(autoMappings);
      setStep('spreadsheet-map');
    }
    return data;
  }, [parseFile, generateAutoMappings, setFieldMappings]);

  const handleSpreadsheetAutoMap = useCallback(() => {
    if (parsedData) {
      const autoMappings = generateAutoMappings(parsedData.headers, SPREADSHEET_TARGET);
      setFieldMappings(autoMappings);
    }
  }, [parsedData, generateAutoMappings, setFieldMappings]);

  const spreadsheetTransformedData = useMemo(() => {
    if (!parsedData) return [];
    return transformData(parsedData, fieldMappings);
  }, [parsedData, fieldMappings, transformData]);

  const handleSpreadsheetImport = useCallback(async (selectedIndices?: number[]) => {
    await importData(SPREADSHEET_TARGET, spreadsheetTransformedData, selectedIndices);
    setStep('spreadsheet-done');
  }, [spreadsheetTransformedData, importData]);

  const handleSpreadsheetReset = useCallback(() => {
    resetSpreadsheet();
    setStep('input');
  }, [resetSpreadsheet]);

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

  // AI Intake handler
  const handleAiAnalyze = async () => {
    if (!aiText.trim()) {
      toast.error(isRu ? 'Введите описание объекта' : 'Please enter property description');
      return;
    }

    const result = await analyze({
      mode: 'single',
      rawText: aiText,
      forceVertical: 'properties',
    });

    if (result && result.items.length > 0) {
      setStep('ai-result');
    }
  };

  // Navigate to create property with AI extracted data
  const handleCreateFromAi = () => {
    if (!intakeSession || intakeSession.items.length === 0) return;
    
    const item = intakeSession.items[0];
    const fields = item.extractedFields;
    
    navigate('/mc/properties/new', {
      state: {
        prefillData: {
          name_en: item.suggestedTitle?.en || fields.name_en?.value,
          name_ru: item.suggestedTitle?.ru || fields.name_ru?.value,
          description_en: item.suggestedDescription?.en || fields.description_en?.value,
          description_ru: item.suggestedDescription?.ru || fields.description_ru?.value,
          bedrooms: fields.bedrooms?.value,
          bathrooms: fields.bathrooms?.value,
          max_guests: fields.max_guests?.value,
          price_per_night: fields.price_per_night?.value,
          district: fields.district?.value,
          address: fields.address?.value,
          property_type: fields.property_type?.value,
          amenities: fields.amenities?.value,
        },
        sourceType: 'ai-intake',
      }
    });
    
    toast.success(isRu ? 'Данные загружены! Проверьте и сохраните.' : 'Data loaded! Review and save.');
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
    } catch (error: unknown) {
      errorLog.silent(error, 'analyze_url');
      
      // Check for OTA blocked error
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('OTA_BLOCKED') || errorMessage.includes('blocklisted') || errorMessage.includes('blocked')) {
        setStep('blocked');
      }
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
      navigate('/mc/properties/new', {
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
      errorLog.error(error, 'create_property');
    }
  };

  const platform = selectedPlatform ? OTA_PLATFORMS.find(p => p.id === selectedPlatform) : null;
  const isAnalyzing = createConnection.isPending || syncMutation.isPending;

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title={isRu ? 'Импорт объектов' : 'Import Properties'}
        subtitle={isRu 
          ? 'Загрузите данные из Excel/CSV, ссылки OTA или через AI'
          : 'Upload from Excel/CSV, OTA link or via AI'
        }
      />

      {/* Step: Input - Mode selector */}
      {step === 'input' && (
        <div className="space-y-6">
          {/* Mode tabs */}
          <Tabs value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="spreadsheet" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                {isRu ? 'Таблица' : 'Spreadsheet'}
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {isRu ? 'Ссылка (OTA)' : 'URL (OTA)'}
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                {isRu ? 'AI Парсинг' : 'AI Parse'}
              </TabsTrigger>
            </TabsList>

            {/* Spreadsheet Mode */}
            <TabsContent value="spreadsheet" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    {isRu ? 'Импорт из таблицы' : 'Import from Spreadsheet'}
                  </CardTitle>
                  <CardDescription>
                    {isRu 
                      ? 'Скачайте таблицу из Google Sheets как .xlsx или .csv и загрузите сюда. Система автоматически распознает колонки.'
                      : 'Download your Google Sheet as .xlsx or .csv and upload here. The system will auto-detect columns.'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileImporter
                    onFileSelect={handleSpreadsheetFileSelect}
                    parsedData={parsedData}
                    isLoading={isSpreadsheetLoading}
                    onClear={handleSpreadsheetReset}
                  />
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2 text-foreground">
                        {isRu ? 'Подсказки:' : 'Tips:'}
                      </p>
                      <ul className="space-y-1 text-xs">
                        <li>• {isRu ? 'Google Sheets → Файл → Скачать → .xlsx или .csv' : 'Google Sheets → File → Download → .xlsx or .csv'}</li>
                        <li>• {isRu ? 'Первая строка должна быть заголовками колонок' : 'First row should be column headers'}</li>
                        <li>• {isRu ? 'Обязательные поля: название (EN), тип недвижимости, тип объявления' : 'Required: title (EN), property type, listing type'}</li>
                        <li>• {isRu ? 'AI автоматически сопоставит колонки с полями системы' : 'AI will auto-map columns to system fields'}</li>
                        <li>• {isRu ? 'Поддерживаются русские и английские названия колонок' : 'Both Russian and English column names are supported'}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* URL Mode */}
            <TabsContent value="url" className="space-y-6 mt-6">
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
            </TabsContent>

            {/* AI Parse Mode */}
            <TabsContent value="ai" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    {isRu ? 'AI Парсинг данных' : 'AI Data Parsing'}
                  </CardTitle>
                  <CardDescription>
                    {isRu 
                      ? 'Вставьте любой текст с описанием объекта — AI извлечёт все данные'
                      : 'Paste any text describing your property — AI will extract all data'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{isRu ? 'Описание объекта' : 'Property Description'}</Label>
                    <Textarea
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      placeholder={isRu 
                        ? 'Вставьте описание: название, расположение, спальни, цена, удобства...\n\nПример:\nВилла Sunset View в Камале\n3 спальни, 2 ванные, бассейн\nЦена: 15000 бат/ночь\nWiFi, кондиционер, парковка'
                        : 'Paste description: name, location, bedrooms, price, amenities...\n\nExample:\nSunset View Villa in Kamala\n3 bedrooms, 2 bathrooms, pool\nPrice: 15,000 THB/night\nWiFi, AC, parking'
                      }
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {isRu 
                        ? 'Можно вставить текст с сайта, сообщения в мессенджере, PDF — AI сам разберётся'
                        : 'You can paste text from website, messenger, PDF — AI will figure it out'
                      }
                    </p>
                  </div>

                  <Button
                    onClick={handleAiAnalyze}
                    disabled={!aiText.trim() || isIntakeProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isIntakeProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isRu ? 'AI анализирует...' : 'AI analyzing...'}
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        {isRu ? 'Распарсить через AI' : 'Parse with AI'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* AI Features */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2 text-foreground">
                        {isRu ? 'AI автоматически извлечёт:' : 'AI will automatically extract:'}
                      </p>
                      <ul className="grid grid-cols-2 gap-1 text-xs">
                        <li>• {isRu ? 'Название и описание' : 'Title & description'}</li>
                        <li>• {isRu ? 'Спальни, ванные, гости' : 'Bedrooms, baths, guests'}</li>
                        <li>• {isRu ? 'Цена за ночь' : 'Price per night'}</li>
                        <li>• {isRu ? 'Район и адрес' : 'District & address'}</li>
                        <li>• {isRu ? 'Тип недвижимости' : 'Property type'}</li>
                        <li>• {isRu ? 'Удобства' : 'Amenities'}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Step: AI Result */}
      {step === 'ai-result' && intakeSession && intakeSession.items.length > 0 && (
        <div className="space-y-6">
          <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              {isRu ? 'Данные успешно извлечены!' : 'Data Successfully Extracted!'}
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              {isRu 
                ? 'AI обработал текст и извлёк информацию об объекте'
                : 'AI processed the text and extracted property information'
              }
            </AlertDescription>
          </Alert>

          {/* Extracted data preview */}
          {(() => {
            const item = intakeSession.items[0];
            const fields = item.extractedFields;
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {item.suggestedTitle?.en || item.suggestedTitle?.ru || (isRu ? 'Новый объект' : 'New Property')}
                  </CardTitle>
                  <CardDescription>
                    {isRu ? 'Уверенность AI:' : 'AI Confidence:'} {Math.round(item.overallConfidence * 100)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key specs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {fields.bedrooms?.value && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{String(fields.bedrooms.value)} {isRu ? 'спален' : 'bed'}</span>
                      </div>
                    )}
                    {fields.bathrooms?.value && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Bath className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{String(fields.bathrooms.value)} {isRu ? 'ванных' : 'bath'}</span>
                      </div>
                    )}
                    {fields.max_guests?.value && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{String(fields.max_guests.value)} {isRu ? 'гостей' : 'guests'}</span>
                      </div>
                    )}
                    {fields.price_per_night?.value && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{String(fields.price_per_night.value)} {isRu ? '/ночь' : '/night'}</span>
                      </div>
                    )}
                  </div>

                  {/* Description preview */}
                  {(item.suggestedDescription?.en || item.suggestedDescription?.ru) && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {isRu ? item.suggestedDescription?.ru : item.suggestedDescription?.en}
                      </p>
                    </div>
                  )}

                  {/* Location */}
                  {(fields.district?.value || fields.address?.value) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {String(fields.district?.value || '')}{fields.address?.value ? `, ${String(fields.address.value)}` : ''}
                    </div>
                  )}

                  {/* Amenities */}
                  {fields.amenities?.value && Array.isArray(fields.amenities.value) && (
                    <div className="flex flex-wrap gap-1">
                      {fields.amenities.value.slice(0, 8).map((a: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {a}
                        </Badge>
                      ))}
                      {fields.amenities.value.length > 8 && (
                        <Badge variant="outline" className="text-xs">
                          +{fields.amenities.value.length - 8}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Warnings */}
                  {item.missingRequiredFields.length > 0 && (
                    <Alert variant="default" className="border-yellow-500/50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-sm">
                        {isRu ? 'Не удалось извлечь:' : 'Could not extract:'} {item.missingRequiredFields.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep('input');
                resetIntake();
              }}
              className="flex-1"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isRu ? 'Изменить текст' : 'Edit Text'}
            </Button>
            <Button
              onClick={handleCreateFromAi}
              className="flex-1"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              {isRu ? 'Создать объект' : 'Create Property'}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Blocked - OTA restricts automated access */}
      {step === 'blocked' && (
        <div className="space-y-6">
          <Alert variant="destructive" className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
            <ShieldAlert className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-800 dark:text-orange-200">
              {isRu ? 'Площадка ограничивает автоматический доступ' : 'Platform Restricts Automated Access'}
            </AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              {isRu 
                ? 'Airbnb и некоторые другие площадки блокируют автоматическое считывание данных. Это ограничение на стороне площадки, а не ошибка системы.'
                : 'Airbnb and some other platforms block automated data extraction. This is a platform-side restriction, not a system error.'
              }
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PenLine className="h-5 w-5 text-primary" />
                {isRu ? 'Альтернативные варианты' : 'Alternative Options'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Button 
                  onClick={() => navigate('/mc/properties/new')}
                  className="w-full justify-start h-auto py-4"
                  variant="outline"
                >
                  <div className="flex items-start gap-3 text-left">
                    <FileText className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">{isRu ? 'Создать объект вручную' : 'Create Property Manually'}</p>
                      <p className="text-sm text-muted-foreground">
                        {isRu 
                          ? 'Заполните форму самостоятельно — это займёт 5-10 минут'
                          : 'Fill out the form yourself — it takes 5-10 minutes'
                        }
                      </p>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => {
                    setStep('input');
                    setUrl('');
                    setSelectedPlatform(null);
                  }}
                  variant="ghost"
                  className="w-full justify-start h-auto py-4"
                >
                  <div className="flex items-start gap-3 text-left">
                    <Globe className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-medium">{isRu ? 'Попробовать другую ссылку' : 'Try Another URL'}</p>
                      <p className="text-sm text-muted-foreground">
                        {isRu 
                          ? 'Booking.com и VRBO могут работать'
                          : 'Booking.com and VRBO may work'
                        }
                      </p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">
                    {isRu ? 'Почему так происходит?' : 'Why does this happen?'}
                  </p>
                  <p>
                    {isRu 
                      ? 'Крупные площадки (Airbnb, Booking) активно защищают свои данные от автоматического считывания. Это стандартная практика в индустрии для защиты контента.'
                      : 'Major platforms (Airbnb, Booking) actively protect their data from automated extraction. This is standard industry practice to protect content.'
                    }
                  </p>
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

      {/* Spreadsheet: Field Mapping Step */}
      {step === 'spreadsheet-map' && parsedData && (
        <div className="space-y-4">
          <FieldMapper
            mappings={fieldMappings}
            targetId={SPREADSHEET_TARGET}
            sampleData={parsedData.rows.slice(0, 5)}
            onUpdateMapping={updateMapping}
            onAutoMap={handleSpreadsheetAutoMap}
          />
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleSpreadsheetReset}>
              {isRu ? 'Назад' : 'Back'}
            </Button>
            <Button 
              onClick={() => setStep('spreadsheet-preview')}
              disabled={fieldMappings.filter(m => m.targetField).length === 0}
            >
              {isRu ? 'Продолжить' : 'Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Spreadsheet: Preview & Import Step */}
      {step === 'spreadsheet-preview' && parsedData && (
        <div className="space-y-4">
          <ImportPreview
            parsedData={parsedData}
            mappings={fieldMappings}
            targetId={SPREADSHEET_TARGET}
            transformedData={spreadsheetTransformedData}
            onImport={handleSpreadsheetImport}
            isLoading={isSpreadsheetLoading}
          />
          
          <div className="flex justify-start">
            <Button variant="outline" onClick={() => setStep('spreadsheet-map')}>
              {isRu ? 'Назад к маппингу' : 'Back to mapping'}
            </Button>
          </div>
        </div>
      )}

      {/* Spreadsheet: Done Step */}
      {step === 'spreadsheet-done' && importResult && (
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isRu ? 'Импорт завершён!' : 'Import Complete!'}
            </h3>
            <div className="flex justify-center gap-4 mb-4">
              <Badge variant="default" className="text-lg px-4 py-1">
                {importResult.success} {isRu ? 'объектов' : 'properties'}
              </Badge>
              {importResult.failed > 0 && (
                <Badge variant="destructive" className="text-lg px-4 py-1">
                  {importResult.failed} {isRu ? 'ошибок' : 'failed'}
                </Badge>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <div className="text-left bg-destructive/10 p-3 rounded-lg mb-4 max-h-32 overflow-auto">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-xs text-destructive">{err}</p>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleSpreadsheetReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {isRu ? 'Новый импорт' : 'New Import'}
              </Button>
              <Button onClick={() => navigate('/mc/properties')}>
                {isRu ? 'К объектам' : 'View Properties'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
