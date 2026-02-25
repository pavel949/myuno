import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePharmacy, usePharmacyProducts } from "@/hooks/usePharmacy";
import { useCart } from "@/contexts/CartContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChip } from "@/components/uno/FilterChip";
import { 
  ArrowLeft, Star, MapPin, Shield, Phone, Truck, 
  Plus, FileText 
} from "lucide-react";
import { StickyCartBar } from "@/components/cart/StickyCartBar";
import { useCartToast } from "@/hooks/useCartToast";

const PRODUCT_CATEGORIES = [
  { id: 'all', labelKey: 'pharmacy.all' },
  { id: 'general', labelKey: 'pharmacy.general' },
  { id: 'vitamins', labelKey: 'pharmacy.vitamins' },
  { id: 'first_aid', labelKey: 'pharmacy.firstAid' },
  { id: 'skincare', labelKey: 'pharmacy.skincare' },
  { id: 'personal_care', labelKey: 'pharmacy.personalCare' },
];

export default function PharmacyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { pharmacy, isLoading } = usePharmacy(id);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { products, isLoading: productsLoading } = usePharmacyProducts(id, selectedCategory);
  const { addItem } = useCart();
  const { showAddedToast } = useCartToast();

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <Skeleton className="w-full h-48 rounded-2xl" />
          <Skeleton className="w-3/4 h-8 mt-4" />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!pharmacy) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="text-center py-12">
            <p>{t('pharmacy.notFound')}</p>
            <Button onClick={() => navigate('/pharmacy')} className="mt-4">
              {t('action.back')}
            </Button>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const handleAddToCart = (product: any) => {
    const item = {
      id: product.id,
      type: 'product' as const,
      name: language === 'ru' ? product.name_ru : product.name_en,
      nameRu: product.name_ru,
      price: product.price,
      currency: '฿',
      image: product.image,
      providerId: pharmacy.id,
      providerName: language === 'ru' ? pharmacy.name_ru : pharmacy.name_en,
      providerNameRu: pharmacy.name_ru,
    };
    addItem(item);
    showAddedToast({ item });
  };

  return (
    <AppLayout>
      <PageContainer className="pb-24">
        {/* Header */}
        <div className="relative -mx-4 -mt-4">
          <img
            src={pharmacy.cover_image || 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800'}
            alt=""
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
            onClick={() => navigate('/pharmacy')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {pharmacy.is_24h && (
            <Badge className="absolute top-4 right-4 bg-success text-success-foreground">{t('pharmacy.24h')}</Badge>
          )}
        </div>

        {/* Info Card */}
        <div className="relative -mt-12 bg-card rounded-2xl p-4 shadow-lg border mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {language === 'ru' ? pharmacy.name_ru : pharmacy.name_en}
              </h1>
              <div className="flex items-center gap-2 text-sm mt-1">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span>{pharmacy.rating}</span>
                <span className="text-muted-foreground">({pharmacy.review_count})</span>
              </div>
            </div>
            {pharmacy.is_verified && (
              <Badge className="bg-primary/10 text-primary">
                <Shield className="w-3 h-3 mr-1" />
                {t('pharmacy.verified')}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
            <MapPin className="w-4 h-4" />
            <span>{pharmacy.address}</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {pharmacy.delivery_available && (
              <Badge variant="secondary">
                <Truck className="w-3 h-3 mr-1" />
                {t('pharmacy.deliveryFrom')} ฿{pharmacy.delivery_fee}
              </Badge>
            )}
            {pharmacy.has_pharmacist && (
              <Badge variant="secondary">
                {t('pharmacy.pharmacistAvailable')}
              </Badge>
            )}
          </div>

          {pharmacy.phone && (
            <Button variant="outline" className="w-full mt-4" asChild>
              <a href={`tel:${pharmacy.phone}`}>
                <Phone className="w-4 h-4 mr-2" />
                {pharmacy.phone}
              </a>
            </Button>
          )}
        </div>

        {/* Products */}
        <div>
          <h2 className="font-semibold mb-4">
            {t('pharmacy.products')}
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {PRODUCT_CATEGORIES.map(cat => (
              <FilterChip
                key={cat.id}
                label={t(cat.labelKey)}
                isActive={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
              />
            ))}
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('pharmacy.noProducts')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => (
                <div key={product.id} className="bg-card rounded-xl border overflow-hidden">
                  <div className="relative">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200'}
                      alt=""
                      className="w-full h-28 object-cover"
                    />
                    {product.requires_prescription && (
                      <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px]">
                        <FileText className="w-3 h-3 mr-0.5" />
                        Rx
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">
                      {language === 'ru' ? product.name_ru : product.name_en}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-primary">
                        ฿{product.price}
                      </span>
                      <Button 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.requires_prescription}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <StickyCartBar providerId={pharmacy.id} />
      </PageContainer>
    </AppLayout>
  );
}
