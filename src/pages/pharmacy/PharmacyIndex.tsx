import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePharmacies } from "@/hooks/usePharmacy";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { SkeletonCard } from "@/components/uno/SkeletonCard";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock, MapPin, Star, Truck, Shield, Phone } from "lucide-react";

export default function PharmacyIndex() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { pharmacies, isLoading } = usePharmacies();

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={t('pharmacy.title')} 
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-4 mb-6">
          <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20">
            <Clock className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-sm">
              {t('pharmacy.open24h')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('pharmacy.openAroundClock')}
            </p>
          </div>
          <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20">
            <Truck className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-sm">
              {t('pharmacy.fastDelivery')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('pharmacy.from30min')}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
        ) : pharmacies.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p>{t('pharmacy.noPharmaciesFound')}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pharmacies.map(pharmacy => (
              <div 
                key={pharmacy.id} 
                onClick={() => navigate(`/pharmacy/${pharmacy.id}`)} 
                className="cursor-pointer bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-all"
              >
                <div className="flex">
                  <div className="w-28 h-32 flex-shrink-0 relative">
                    <img 
                      src={pharmacy.cover_image || 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400'} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                    {pharmacy.is_24h && (
                      <Badge className="absolute top-2 left-2 bg-green-500 text-white text-[10px]">
                        24/7
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold line-clamp-1 text-sm">
                          {language === 'ru' ? pharmacy.name_ru : pharmacy.name_en}
                        </h3>
                        {pharmacy.is_verified && (
                          <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{pharmacy.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-2">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          {pharmacy.rating}
                        </span>
                        <span className="text-muted-foreground">
                          ({pharmacy.review_count})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-1 flex-wrap">
                        {pharmacy.delivery_available && (
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            <Truck className="w-3 h-3 mr-0.5" />
                            {t('pharmacy.delivery')}
                          </Badge>
                        )}
                        {pharmacy.has_pharmacist && (
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {t('pharmacy.consultation')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
