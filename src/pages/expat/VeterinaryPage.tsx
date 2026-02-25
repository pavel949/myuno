import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVeterinaryClinics, VeterinaryClinic } from '@/hooks/useVeterinaryClinics';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Stethoscope, Search, Star, MapPin, Phone, Clock, 
  AlertCircle, Home, Languages, ExternalLink, CheckCircle2
} from 'lucide-react';

const VeterinaryPage = () => {
  const { language } = useLanguage();
  const { clinics, isLoading, getName, getDescription } = useVeterinaryClinics();
  const [searchQuery, setSearchQuery] = useState('');
  const [show24h, setShow24h] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<VeterinaryClinic | null>(null);

  const isRussian = language === 'ru';

  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = getName(clinic).toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matches24h = !show24h || clinic.is_24h;
    const matchesEmergency = !showEmergency || clinic.has_emergency;
    return matchesSearch && matches24h && matchesEmergency;
  });

  const featuredClinics = filteredClinics.filter(c => c.is_featured);
  const otherClinics = filteredClinics.filter(c => !c.is_featured);

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Ветеринарные клиники' : 'Veterinary Clinics'}
          showBack
        />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRussian ? 'Поиск клиник...' : 'Search clinics...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Switch id="24h" checked={show24h} onCheckedChange={setShow24h} />
            <Label htmlFor="24h" className="text-sm cursor-pointer">
              {isRussian ? '24/7' : '24/7'}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="emergency" checked={showEmergency} onCheckedChange={setShowEmergency} />
            <Label htmlFor="emergency" className="text-sm cursor-pointer">
              {isRussian ? 'Экстренная помощь' : 'Emergency'}
            </Label>
          </div>
        </div>

        {/* Emergency Banner */}
        <Card className="mb-4 bg-gradient-to-r from-destructive/10 to-accent-amber/10 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-sm mb-1">
                  {isRussian ? 'Экстренная помощь' : 'Pet Emergency'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRussian 
                    ? 'Клиники с пометкой 24/7 работают круглосуточно. Позвоните заранее в случае экстренной ситуации.'
                    : 'Clinics marked 24/7 operate round the clock. Call ahead in case of emergency.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : filteredClinics.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {isRussian ? 'Клиники не найдены' : 'No clinics found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Featured */}
            {featuredClinics.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {isRussian ? 'Рекомендуемые' : 'Featured'}
                </h3>
                {featuredClinics.map(clinic => (
                  <ClinicCard 
                    key={clinic.id} 
                    clinic={clinic} 
                    isRussian={isRussian} 
                    getName={getName}
                    onClick={() => setSelectedClinic(clinic)}
                  />
                ))}
              </>
            )}

            {/* Other */}
            {otherClinics.length > 0 && (
              <>
                {featuredClinics.length > 0 && (
                  <h3 className="text-sm font-medium text-muted-foreground mt-4">
                    {isRussian ? 'Все клиники' : 'All Clinics'}
                  </h3>
                )}
                {otherClinics.map(clinic => (
                  <ClinicCard 
                    key={clinic.id} 
                    clinic={clinic} 
                    isRussian={isRussian}
                    getName={getName}
                    onClick={() => setSelectedClinic(clinic)}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* Clinic Details Dialog */}
        <Dialog open={!!selectedClinic} onOpenChange={() => setSelectedClinic(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {selectedClinic && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-accent-coral" />
                    {getName(selectedClinic)}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Cover Image */}
                  {selectedClinic.cover_image && (
                    <img 
                      src={selectedClinic.cover_image} 
                      alt={getName(selectedClinic)}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}

                  {getDescription(selectedClinic) && (
                    <p className="text-sm text-muted-foreground">
                      {getDescription(selectedClinic)}
                    </p>
                  )}

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {selectedClinic.is_24h && (
                      <Badge className="gap-1 bg-success">
                        <Clock className="h-3 w-3" />
                        24/7
                      </Badge>
                    )}
                    {selectedClinic.has_emergency && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {isRussian ? 'Скорая помощь' : 'Emergency'}
                      </Badge>
                    )}
                    {selectedClinic.home_visits && (
                      <Badge variant="secondary" className="gap-1">
                        <Home className="h-3 w-3" />
                        {isRussian ? 'Выезд на дом' : 'Home Visits'}
                      </Badge>
                    )}
                    {selectedClinic.is_verified && (
                      <Badge variant="outline" className="gap-1 text-success border-success">
                        <CheckCircle2 className="h-3 w-3" />
                        {isRussian ? 'Проверено' : 'Verified'}
                      </Badge>
                    )}
                  </div>

                  {/* Services */}
                  {selectedClinic.services.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        {isRussian ? 'Услуги' : 'Services'}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedClinic.services.map(service => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specializations */}
                  {selectedClinic.specializations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        {isRussian ? 'Специализация' : 'Specializations'}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedClinic.specializations.map(spec => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {selectedClinic.languages.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Languages className="h-4 w-4 text-muted-foreground" />
                      {selectedClinic.languages.join(', ')}
                    </div>
                  )}

                  {/* Address */}
                  {selectedClinic.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span>{selectedClinic.address}{selectedClinic.district && `, ${selectedClinic.district}`}</span>
                    </div>
                  )}

                  {/* Price */}
                  {selectedClinic.price_consultation && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        {isRussian ? 'Консультация от' : 'Consultation from'}
                      </p>
                      <p className="text-lg font-bold text-primary">
                        ฿{selectedClinic.price_consultation}
                      </p>
                    </div>
                  )}

                  {/* Contact */}
                  {selectedClinic.phone && (
                    <Button className="w-full gap-2" asChild>
                      <a href={`tel:${selectedClinic.phone}`}>
                        <Phone className="h-4 w-4" />
                        {selectedClinic.phone}
                      </a>
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
};

interface ClinicCardProps {
  clinic: VeterinaryClinic;
  isRussian: boolean;
  getName: (clinic: VeterinaryClinic) => string;
  onClick: () => void;
}

const ClinicCard = ({ clinic, isRussian, getName, onClick }: ClinicCardProps) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <CardContent className="p-4">
      <div className="flex gap-3">
        {clinic.cover_image ? (
          <img 
            src={clinic.cover_image} 
            alt={getName(clinic)}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-accent-coral to-destructive flex items-center justify-center flex-shrink-0">
            <Stethoscope className="h-7 w-7 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium line-clamp-1">{getName(clinic)}</h3>
              {clinic.address && (
                <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {clinic.district || clinic.address}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {clinic.is_24h && (
              <Badge className="text-xs bg-success">24/7</Badge>
            )}
            {clinic.has_emergency && (
              <Badge variant="destructive" className="text-xs">
                {isRussian ? 'Скорая' : 'Emergency'}
              </Badge>
            )}
            {clinic.home_visits && (
              <Badge variant="outline" className="text-xs gap-1">
                <Home className="h-3 w-3" />
                {isRussian ? 'Выезд' : 'Home'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs">
            {clinic.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {clinic.rating.toFixed(1)}
              </span>
            )}
            {clinic.price_consultation && clinic.price_consultation > 0 && (
              <span className="font-bold text-primary">
                ฿{clinic.price_consultation}
              </span>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default VeterinaryPage;
