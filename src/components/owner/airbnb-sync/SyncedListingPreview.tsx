import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOtaSyncedListing, useApplySyncedData, OtaSyncedListing } from '@/hooks/useOtaSync';
import { 
  Image, 
  FileText, 
  BedDouble, 
  Bath, 
  Users, 
  DollarSign,
  CheckCircle2,
  Sparkles,
  MapPin,
  Star,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncedListingPreviewProps {
  connectionId: string;
  propertyId?: string;
  onApplied?: () => void;
}

interface FieldOption {
  id: string;
  label: string;
  labelRu: string;
  icon: React.ReactNode;
  getValue: (listing: OtaSyncedListing) => string | number | null;
}

const SYNC_FIELDS: FieldOption[] = [
  {
    id: 'title',
    label: 'Title',
    labelRu: 'Название',
    icon: <FileText className="h-4 w-4" />,
    getValue: (l) => l.title,
  },
  {
    id: 'description',
    label: 'Description',
    labelRu: 'Описание',
    icon: <FileText className="h-4 w-4" />,
    getValue: (l) => l.description ? `${l.description.slice(0, 100)}...` : null,
  },
  {
    id: 'photos',
    label: 'Photos',
    labelRu: 'Фотографии',
    icon: <Image className="h-4 w-4" />,
    getValue: (l) => l.photos ? `${l.photos.length} фото` : null,
  },
  {
    id: 'bedrooms',
    label: 'Bedrooms',
    labelRu: 'Спальни',
    icon: <BedDouble className="h-4 w-4" />,
    getValue: (l) => l.bedrooms,
  },
  {
    id: 'bathrooms',
    label: 'Bathrooms',
    labelRu: 'Ванные',
    icon: <Bath className="h-4 w-4" />,
    getValue: (l) => l.bathrooms,
  },
  {
    id: 'max_guests',
    label: 'Max Guests',
    labelRu: 'Макс. гостей',
    icon: <Users className="h-4 w-4" />,
    getValue: (l) => l.max_guests,
  },
  {
    id: 'price',
    label: 'Price',
    labelRu: 'Цена',
    icon: <DollarSign className="h-4 w-4" />,
    getValue: (l) => l.price_per_night ? `${l.currency || '฿'}${l.price_per_night}/night` : null,
  },
  {
    id: 'amenities',
    label: 'Amenities',
    labelRu: 'Удобства',
    icon: <Sparkles className="h-4 w-4" />,
    getValue: (l) => l.amenities ? `${l.amenities.length} amenities` : null,
  },
  {
    id: 'address',
    label: 'Address',
    labelRu: 'Адрес',
    icon: <MapPin className="h-4 w-4" />,
    getValue: (l) => l.address,
  },
  {
    id: 'house_rules',
    label: 'House Rules',
    labelRu: 'Правила',
    icon: <FileText className="h-4 w-4" />,
    getValue: (l) => l.house_rules ? 'Available' : null,
  },
];

export function SyncedListingPreview({ connectionId, propertyId, onApplied }: SyncedListingPreviewProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { data: listing, isLoading } = useOtaSyncedListing(connectionId);
  const applyMutation = useApplySyncedData();
  
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'title', 'description', 'photos', 'bedrooms', 'bathrooms', 'max_guests', 'price'
  ]);

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleApply = async () => {
    if (!propertyId) return;
    
    await applyMutation.mutateAsync({
      connectionId,
      propertyId,
      fields: selectedFields,
    });
    
    onApplied?.();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-2">
            {isRu ? 'Загрузка данных...' : 'Loading data...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!listing) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {isRu ? 'Данные не найдены. Запустите синхронизацию.' : 'No data found. Run sync first.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          {isRu ? 'Импортированные данные' : 'Imported Data'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cover Photo Preview */}
        {listing.cover_photo && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img 
              src={listing.cover_photo} 
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Rating & Reviews */}
        {(listing.rating || listing.review_count) && (
          <div className="flex items-center gap-2">
            {listing.rating && (
              <Badge variant="secondary" className="gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {listing.rating}
              </Badge>
            )}
            {listing.review_count && (
              <span className="text-sm text-muted-foreground">
                {listing.review_count} {isRu ? 'отзывов' : 'reviews'}
              </span>
            )}
          </div>
        )}

        {/* Fields Selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {isRu ? 'Выберите данные для применения:' : 'Select data to apply:'}
          </p>
          
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {SYNC_FIELDS.map((field) => {
                const value = field.getValue(listing);
                const hasValue = value !== null && value !== undefined;
                
                return (
                  <div
                    key={field.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      hasValue ? "bg-background cursor-pointer hover:bg-muted/50" : "bg-muted/30 opacity-50",
                      selectedFields.includes(field.id) && hasValue && "border-primary bg-primary/5"
                    )}
                    onClick={() => hasValue && toggleField(field.id)}
                  >
                    <Checkbox
                      checked={selectedFields.includes(field.id)}
                      disabled={!hasValue}
                      onCheckedChange={() => hasValue && toggleField(field.id)}
                    />
                    <div className={cn(
                      "h-8 w-8 rounded-md flex items-center justify-center",
                      hasValue ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {field.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {isRu ? field.labelRu : field.label}
                      </p>
                      {hasValue && (
                        <p className="text-xs text-muted-foreground truncate">
                          {String(value)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Apply Button */}
        {propertyId && (
          <Button 
            onClick={handleApply}
            disabled={selectedFields.length === 0 || applyMutation.isPending}
            className="w-full"
          >
            {applyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isRu 
              ? `Применить ${selectedFields.length} полей` 
              : `Apply ${selectedFields.length} fields`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
