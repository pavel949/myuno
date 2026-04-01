/**
 * ResaleDetail — detail page for a secondary market property
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, BedDouble, Bath, Maximize2, Calendar, ArrowRightLeft,
  TrendingUp, Shield, ChevronLeft, Share2, Phone
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useResaleProperty } from '@/hooks/useResaleProperties';
import { UniversalLeadForm } from '@/components/leads/UniversalLeadForm';
import { cn } from '@/lib/utils';

export default function ResaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const { data: property, isLoading } = useResaleProperty(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{isRu ? 'Объект не найден' : 'Property not found'}</p>
      </div>
    );
  }

  const title = (isRu && property.title_ru) ? property.title_ru : property.title;
  const description = (isRu && property.description_ru) ? property.description_ru : property.description;
  const images = property.media?.length
    ? property.media.map((m: any) => m.url || m)
    : property.cover_image
      ? [property.cover_image]
      : ['/placeholder.svg'];

  const premiumPercent = property.original_purchase_price && property.original_purchase_price > 0
    ? Math.round(((property.asking_price - property.original_purchase_price) / property.original_purchase_price) * 100)
    : null;

  const TITLE_TYPE_LABELS: Record<string, string> = {
    freehold: 'Freehold',
    leasehold: `Leasehold${property.lease_years_remaining ? ` (${property.lease_years_remaining} ${isRu ? 'лет' : 'yrs'})` : ''}`,
    company_structure: isRu ? 'Через компанию' : 'Company structure',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Gallery */}
      <div className="relative aspect-[16/10] bg-muted">
        <img
          src={images[currentImageIdx] as string}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <BackButton fallback="/property/resale" />
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
            {currentImageIdx + 1}/{images.length}
          </div>
        )}
        {property.is_assignment && (
          <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
            <ArrowRightLeft className="w-3 h-3 mr-1" />
            {isRu ? 'Переуступка' : 'Assignment'}
          </Badge>
        )}
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Title & Location */}
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="w-4 h-4" />
            <span>{property.zone}{property.address ? `, ${property.address}` : ''}</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label={isRu ? 'Цена' : 'Price'}
            value={formatPrice(property.asking_price)}
            highlight
          />
          {property.area_sqm && (
            <MetricCard
              label={isRu ? 'Площадь' : 'Area'}
              value={`${property.area_sqm} м²`}
            />
          )}
          {property.estimated_roi && (
            <MetricCard
              label="ROI"
              value={`${property.estimated_roi}%`}
              icon={<TrendingUp className="w-4 h-4 text-primary" />}
            />
          )}
          <MetricCard
            label={isRu ? 'Владение' : 'Ownership'}
            value={TITLE_TYPE_LABELS[property.title_type] || property.title_type}
            icon={<Shield className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Assignment Details */}
        {property.is_assignment && property.original_purchase_price && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4" />
              {isRu ? 'Условия переуступки' : 'Assignment Details'}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">{isRu ? 'Покупка' : 'Original'}:</span>
                <span className="ml-1 font-medium">{formatPrice(property.original_purchase_price)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{isRu ? 'Сейчас' : 'Asking'}:</span>
                <span className="ml-1 font-medium">{formatPrice(property.asking_price)}</span>
              </div>
              {premiumPercent !== null && (
                <div>
                  <span className="text-muted-foreground">{isRu ? 'Наценка' : 'Premium'}:</span>
                  <span className={cn("ml-1 font-medium", premiumPercent > 0 ? 'text-destructive' : 'text-primary')}>
                    {premiumPercent > 0 ? '+' : ''}{premiumPercent}%
                  </span>
                </div>
              )}
              {property.transfer_fee_paid_by && (
                <div>
                  <span className="text-muted-foreground">{isRu ? 'Комиссия' : 'Transfer fee'}:</span>
                  <span className="ml-1 font-medium capitalize">{property.transfer_fee_paid_by}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Specs */}
        <div className="grid grid-cols-3 gap-3">
          {property.bedrooms != null && (
            <SpecItem icon={<BedDouble className="w-4 h-4" />} label={isRu ? 'Спальни' : 'Bedrooms'} value={String(property.bedrooms)} />
          )}
          {property.bathrooms != null && (
            <SpecItem icon={<Bath className="w-4 h-4" />} label={isRu ? 'Ванные' : 'Bathrooms'} value={String(property.bathrooms)} />
          )}
          {property.floor && (
            <SpecItem icon={<Maximize2 className="w-4 h-4" />} label={isRu ? 'Этаж' : 'Floor'} value={String(property.floor)} />
          )}
        </div>

        {/* Rental income */}
        {property.current_rental_income && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-1">
              {isRu ? 'Текущий доход от аренды' : 'Current Rental Income'}
            </h3>
            <p className="text-lg font-bold text-primary">
              {formatPrice(property.current_rental_income)}<span className="text-sm font-normal text-muted-foreground">/{isRu ? 'мес' : 'mo'}</span>
            </p>
          </div>
        )}

        {/* Description */}
        {description && (
          <div>
            <h3 className="font-semibold text-sm mb-2">{isRu ? 'Описание' : 'Description'}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{description}</p>
          </div>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 flex gap-2 z-30">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{isRu ? 'Цена' : 'Price'}</p>
          <p className="text-lg font-bold text-foreground">{formatPrice(property.asking_price)}</p>
        </div>
        <Button onClick={() => setShowLeadForm(true)} className="px-6">
          <Phone className="w-4 h-4 mr-1" />
          {isRu ? 'Запросить показ' : 'Request Viewing'}
        </Button>
      </div>

      {/* Lead Form Dialog */}
      <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Запросить показ' : 'Request Viewing'}
            </DialogTitle>
          </DialogHeader>
          <UniversalLeadForm
            verticalId="property"
            leadSource="property_resale_detail"
            entryPoint={`resale_${property.id}`}
            preselectedRequestType="property_viewing"
            onSuccess={() => setShowLeadForm(false)}
            onCancel={() => setShowLeadForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ label, value, icon, highlight }: {
  label: string; value: string; icon?: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl p-3 text-center border",
      highlight ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-border/50"
    )}>
      {icon && <div className="flex justify-center mb-1">{icon}</div>}
      <p className={cn("text-sm font-bold", highlight && "text-primary")}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm font-medium">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
