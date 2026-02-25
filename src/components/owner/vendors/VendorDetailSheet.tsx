import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VendorDocumentsTab } from './VendorDocumentsTab';
import { VENDOR_CATEGORIES, type OwnerVendor } from '@/hooks/useOwnerVendors';
import { Phone, Mail, MessageCircle, Star, MapPin, Heart, HeartOff } from 'lucide-react';

interface VendorDetailSheetProps {
  vendor: OwnerVendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
}

export function VendorDetailSheet({ vendor, open, onOpenChange, onEdit, onToggleFavorite }: VendorDetailSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  if (!vendor) return null;

  const catLabel = VENDOR_CATEGORIES.find(c => c.value === vendor.category);
  const initials = vendor.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="sr-only">{vendor.name}</SheetTitle>
        </SheetHeader>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-16 w-16">
            {vendor.photo_url && <AvatarImage src={vendor.photo_url} />}
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">{isRu && vendor.name_ru ? vendor.name_ru : vendor.name}</h2>
            {vendor.contact_person && <p className="text-sm text-muted-foreground">{vendor.contact_person}</p>}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {catLabel && <Badge variant="secondary" className="text-xs">{isRu ? catLabel.ru : catLabel.en}</Badge>}
              {vendor.source === 'myuno' && <Badge variant="outline" className="text-xs border-primary/30 text-primary">myUNO</Badge>}
              {(vendor.avg_rating ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  {Number(vendor.avg_rating).toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onToggleFavorite}>
            {vendor.is_favorite ? <Heart className="h-5 w-5 text-destructive fill-destructive" /> : <HeartOff className="h-5 w-5 text-muted-foreground" />}
          </Button>
        </div>

        {/* Quick contacts */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {vendor.phone && (
            <Button size="sm" variant="outline" asChild>
              <a href={`tel:${vendor.phone}`}><Phone className="h-3.5 w-3.5 mr-1.5" />{isRu ? 'Звонок' : 'Call'}</a>
            </Button>
          )}
          {vendor.whatsapp && (
            <Button size="sm" variant="outline" asChild>
              <a href={`https://wa.me/${vendor.whatsapp.replace(/[^\d+]/g, '')}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />WhatsApp
              </a>
            </Button>
          )}
          {vendor.email && (
            <Button size="sm" variant="outline" asChild>
              <a href={`mailto:${vendor.email}`}><Mail className="h-3.5 w-3.5 mr-1.5" />Email</a>
            </Button>
          )}
        </div>

        {/* Tabs: Info, Docs */}
        <Tabs defaultValue="info">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">{isRu ? 'Инфо' : 'Info'}</TabsTrigger>
            <TabsTrigger value="docs" className="flex-1">{isRu ? 'Документы' : 'Documents'}</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {vendor.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm">{vendor.address}</p>
              </div>
            )}
            {vendor.line_id && (
              <div className="text-sm"><span className="text-muted-foreground">LINE:</span> {vendor.line_id}</div>
            )}
            {vendor.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{isRu ? 'Заметки' : 'Notes'}</p>
                <p className="text-sm whitespace-pre-wrap">{vendor.notes}</p>
              </div>
            )}
            {(vendor.total_jobs ?? 0) > 0 && (
              <p className="text-sm text-muted-foreground">{isRu ? 'Работ выполнено:' : 'Jobs completed:'} {vendor.total_jobs}</p>
            )}
            <Button variant="outline" className="w-full" onClick={onEdit}>
              {isRu ? 'Редактировать' : 'Edit'}
            </Button>
          </TabsContent>

          <TabsContent value="docs" className="mt-4">
            <VendorDocumentsTab vendorId={vendor.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
