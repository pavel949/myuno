import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/uno/BackButton";
import { LoadingState } from "@/components/uno/LoadingSpinner";
import { useLegalService } from "@/hooks/useLegalServices";
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle2,
  Languages,
  Calendar,
  AlertCircle,
  Banknote
} from "lucide-react";

const LegalProviderDetail = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { service, isLoading } = useLegalService(id || '');

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState />
        </div>
      </AppLayout>
    );
  }

  if (!service) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            {isRu ? 'Услуга не найдена' : 'Service not found'}
          </p>
          <Button variant="outline" onClick={() => navigate('/legal')}>
            {isRu ? 'К списку услуг' : 'Back to services'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const name = isRu ? service.name_ru : service.name_en;
  const description = isRu ? service.description_ru : service.description_en;
  const serviceTypeLabel = service.service_type === 'law_firm' 
    ? (isRu ? 'Юридическая фирма' : 'Law Firm')
    : service.service_type === 'notary'
    ? (isRu ? 'Нотариус' : 'Notary')
    : service.service_type === 'visa_agent'
    ? (isRu ? 'Визовый агент' : 'Visa Agent')
    : (isRu ? 'Юридические услуги' : 'Legal Services');

  return (
    <AppLayout>
      <div className="pb-24">
        {/* Hero Image */}
        <div className="relative h-48">
          <BackButton fallbackPath="/legal" variant="overlay" className="absolute top-4 left-4 z-10" />
          <img
            src={service.cover_image || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop'}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground">{name}</h1>
              {service.is_verified && (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{serviceTypeLabel}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <span className="font-semibold">{service.rating?.toFixed(1) || '—'}</span>
                <span className="text-sm text-muted-foreground">({service.review_count || 0})</span>
              </div>
              {service.price_consultation && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Banknote className="w-4 h-4" />
                  <span>{service.currency} {service.price_consultation.toLocaleString()}</span>
                </div>
              )}
            </div>
            {service.languages && service.languages.length > 0 && (
              <div className="flex gap-1">
                {service.languages.slice(0, 3).map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    {lang.slice(0, 2).toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="about">{isRu ? "О нас" : "About"}</TabsTrigger>
            <TabsTrigger value="specializations">{isRu ? "Услуги" : "Services"}</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4 mt-4">
            {/* Description */}
            {description && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold">{isRu ? "Контакты" : "Contact"}</h3>
              <div className="space-y-2">
                {service.address && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="line-clamp-2">{service.address}</span>
                  </div>
                )}
                {service.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${service.phone}`} className="text-primary hover:underline">
                      {service.phone}
                    </a>
                  </div>
                )}
                {service.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${service.email}`} className="text-primary hover:underline">
                      {service.email}
                    </a>
                  </div>
                )}
                {service.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={service.website.startsWith('http') ? service.website : `https://${service.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {service.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Languages */}
            {service.languages && service.languages.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">{isRu ? "Языки" : "Languages"}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {service.languages.map((lang) => (
                    <Badge key={lang} variant="outline">{lang}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="specializations" className="space-y-3 mt-4">
            {service.specializations && service.specializations.length > 0 ? (
              service.specializations.map((spec, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-medium">{spec}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isRu ? 'Специализации не указаны' : 'No specializations listed'}
              </div>
            )}

            {/* Consultation Price */}
            {service.price_consultation && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{isRu ? 'Консультация' : 'Consultation'}</p>
                    <p className="text-sm text-muted-foreground">
                      {isRu ? 'Первичная консультация' : 'Initial consultation'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">
                      {service.currency} {service.price_consultation.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full mt-3"
                  onClick={() => navigate(`/legal/booking/${id}`)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {isRu ? "Записаться на консультацию" : "Book Consultation"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border safe-area-bottom">
          <div className="flex gap-3 max-w-lg mx-auto">
            {service.phone && (
              <Button 
                variant="outline" 
                className="flex-1 min-h-[44px]" 
                onClick={() => window.open(`tel:${service.phone}`)}
              >
                <Phone className="w-4 h-4 mr-2" />
                {isRu ? "Позвонить" : "Call"}
              </Button>
            )}
            <Button 
              className="flex-1 min-h-[44px]" 
              onClick={() => navigate(`/legal/booking/${id}`)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isRu ? "Записаться" : "Book"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LegalProviderDetail;