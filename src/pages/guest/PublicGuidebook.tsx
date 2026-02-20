import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePublicGuidebook, LocalTip, DirectionStep } from '@/hooks/usePropertyGuidebook';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wifi, Key, Phone, MapPin, Utensils, Coffee, Palmtree, ShoppingBag, Camera, Car,
  Trash2, ParkingCircle, LogOut, Copy, Check, Play, Loader2, AlertCircle, Book,
  Navigation, Clock, Home, ExternalLink, ChevronRight
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const categoryIcons: Record<string, React.ElementType> = {
  restaurant: Utensils, cafe: Coffee, beach: Palmtree, shopping: ShoppingBag,
  attraction: Camera, transport: Car, other: MapPin,
};

const categoryLabels: Record<string, { en: string; ru: string }> = {
  restaurant: { en: 'Restaurants', ru: 'Рестораны' },
  cafe: { en: 'Cafes', ru: 'Кафе' },
  beach: { en: 'Beaches', ru: 'Пляжи' },
  shopping: { en: 'Shopping', ru: 'Магазины' },
  attraction: { en: 'Attractions', ru: 'Достопримечательности' },
  transport: { en: 'Transport', ru: 'Транспорт' },
  other: { en: 'Other', ru: 'Другое' },
};

export default function PublicGuidebook() {
  const { token } = useParams<{ token: string }>();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading, error } = usePublicGuidebook(token);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: isRu ? 'Скопировано' : 'Copied', description: text });
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">
          {isRu ? 'Гид недоступен' : 'Guidebook Not Available'}
        </h2>
        <p className="text-muted-foreground text-center">
          {isRu ? 'Ссылка недействительна или срок действия истёк' : 'This link is invalid or has expired'}
        </p>
      </div>
    );
  }

  const { guidebook, property } = data;
  const propertyTitle = isRu ? (property?.title_ru || property?.title) : property?.title;
  const coverImage = property?.cover_image || (property?.images && property.images[0]);

  const groupedTips = guidebook.local_tips.reduce((acc, tip) => {
    if (!acc[tip.category]) acc[tip.category] = [];
    acc[tip.category].push(tip);
    return acc;
  }, {} as Record<string, LocalTip[]>);

  const welcomeMsg = isRu ? (guidebook.welcome_message_ru || guidebook.welcome_message) : guidebook.welcome_message;

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(text, field)}>
      {copiedField === field ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Welcome */}
      <div className="relative">
        {coverImage && (
          <div className="h-56 sm:h-72 w-full overflow-hidden">
            <img src={coverImage} alt={propertyTitle || ''} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        )}
        <div className={`${coverImage ? 'absolute bottom-0 left-0 right-0 p-6 text-white' : 'p-6 pt-12'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground text-xs">
              <Home className="w-3 h-3 mr-1" />
              myUNO
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{propertyTitle || (isRu ? 'Добро пожаловать!' : 'Welcome!')}</h1>
          {property?.address && (
            <p className={`text-sm mt-1 ${coverImage ? 'text-white/80' : 'text-muted-foreground'}`}>
              <MapPin className="w-3 h-3 inline mr-1" />
              {property.address}
            </p>
          )}
          {(property?.check_in_time || property?.check_out_time) && (
            <div className={`flex gap-4 mt-2 text-sm ${coverImage ? 'text-white/70' : 'text-muted-foreground'}`}>
              {property.check_in_time && <span><Clock className="w-3 h-3 inline mr-1" />{isRu ? 'Заезд' : 'Check-in'}: {property.check_in_time}</span>}
              {property.check_out_time && <span><LogOut className="w-3 h-3 inline mr-1" />{isRu ? 'Выезд' : 'Check-out'}: {property.check_out_time}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Welcome message */}
      {welcomeMsg && (
        <div className="px-4 pt-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm">{welcomeMsg}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 pt-4 pb-8">
        <Tabs defaultValue="essentials">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="essentials" className="flex-1">
              <Home className="w-4 h-4 mr-1" />
              {isRu ? 'Главное' : 'Essentials'}
            </TabsTrigger>
            {guidebook.directions.length > 0 && (
              <TabsTrigger value="directions" className="flex-1">
                <Navigation className="w-4 h-4 mr-1" />
                {isRu ? 'Как добраться' : 'Directions'}
              </TabsTrigger>
            )}
            <TabsTrigger value="local" className="flex-1">
              <MapPin className="w-4 h-4 mr-1" />
              {isRu ? 'Рядом' : 'Nearby'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="essentials" className="space-y-4">
            {/* WiFi */}
            {(guidebook.wifi_name || guidebook.wifi_password) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-primary" /> WiFi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guidebook.wifi_name && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">{isRu ? 'Сеть' : 'Network'}</p>
                        <p className="font-medium">{guidebook.wifi_name}</p>
                      </div>
                      <CopyBtn text={guidebook.wifi_name} field="wifi_name" />
                    </div>
                  )}
                  {guidebook.wifi_password && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">{isRu ? 'Пароль' : 'Password'}</p>
                        <p className="font-mono font-medium">{guidebook.wifi_password}</p>
                      </div>
                      <CopyBtn text={guidebook.wifi_password} field="wifi_password" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Access Codes */}
            {(guidebook.door_code || guidebook.gate_code || guidebook.lockbox_code) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    {isRu ? 'Коды доступа' : 'Access Codes'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guidebook.door_code && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">{isRu ? 'Код двери' : 'Door Code'}</p>
                        <p className="font-mono font-bold text-lg">{guidebook.door_code}</p>
                      </div>
                      <CopyBtn text={guidebook.door_code} field="door_code" />
                    </div>
                  )}
                  {guidebook.gate_code && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">{isRu ? 'Код ворот' : 'Gate Code'}</p>
                        <p className="font-mono font-bold text-lg">{guidebook.gate_code}</p>
                      </div>
                      <CopyBtn text={guidebook.gate_code} field="gate_code" />
                    </div>
                  )}
                  {guidebook.lockbox_code && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{isRu ? 'Код сейфа' : 'Lockbox Code'}</p>
                          <p className="font-mono font-bold text-lg">{guidebook.lockbox_code}</p>
                        </div>
                        <CopyBtn text={guidebook.lockbox_code} field="lockbox_code" />
                      </div>
                      {guidebook.lockbox_location && (
                        <p className="text-sm text-muted-foreground mt-2">📍 {guidebook.lockbox_location}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Appliance Guides */}
            {guidebook.appliance_guides.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Book className="w-5 h-5 text-primary" />
                    {isRu ? 'Инструкции по технике' : 'Appliance Guides'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guidebook.appliance_guides.map((guide) => (
                    <div key={guide.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{isRu && guide.name_ru ? guide.name_ru : guide.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {isRu && guide.instructions_ru ? guide.instructions_ru : guide.instructions}
                          </p>
                        </div>
                        {guide.video_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={guide.video_url} target="_blank" rel="noopener noreferrer"><Play className="w-4 h-4" /></a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Important Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{isRu ? 'Важная информация' : 'Important Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(guidebook.trash_instructions || guidebook.trash_instructions_ru) && (
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{isRu ? 'Мусор' : 'Trash'}</p>
                      <p className="text-sm text-muted-foreground">
                        {isRu ? guidebook.trash_instructions_ru || guidebook.trash_instructions : guidebook.trash_instructions}
                      </p>
                    </div>
                  </div>
                )}
                {(guidebook.parking_instructions || guidebook.parking_instructions_ru) && (
                  <div className="flex items-start gap-3">
                    <ParkingCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{isRu ? 'Парковка' : 'Parking'}</p>
                      <p className="text-sm text-muted-foreground">
                        {isRu ? guidebook.parking_instructions_ru || guidebook.parking_instructions : guidebook.parking_instructions}
                      </p>
                    </div>
                  </div>
                )}
                {(guidebook.checkout_instructions || guidebook.checkout_instructions_ru) && (
                  <div className="flex items-start gap-3">
                    <LogOut className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{isRu ? 'Выезд' : 'Check-out'}</p>
                      <p className="text-sm text-muted-foreground">
                        {isRu ? guidebook.checkout_instructions_ru || guidebook.checkout_instructions : guidebook.checkout_instructions}
                      </p>
                    </div>
                  </div>
                )}
                {/* House Rules from property */}
                {(property?.house_rules || property?.house_rules_ru) && (
                  <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{isRu ? 'Правила дома' : 'House Rules'}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {isRu ? property.house_rules_ru || property.house_rules : property.house_rules}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            {guidebook.emergency_contacts.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5 text-destructive" />
                    {isRu ? 'Экстренные контакты' : 'Emergency Contacts'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guidebook.emergency_contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{isRu && contact.name_ru ? contact.name_ru : contact.name}</p>
                        <p className="text-sm text-muted-foreground">{isRu && contact.role_ru ? contact.role_ru : contact.role}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${contact.phone}`}><Phone className="w-4 h-4 mr-1" />{contact.phone}</a>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Directions Tab */}
          <TabsContent value="directions" className="space-y-4">
            {guidebook.directions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{isRu ? 'Инструкции скоро появятся' : 'Directions coming soon'}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {guidebook.directions
                  .sort((a, b) => a.order - b.order)
                  .map((step, index) => (
                    <Card key={step.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="font-medium">
                              {isRu && step.instruction_ru ? step.instruction_ru : step.instruction}
                            </p>
                            {(step.landmark || step.landmark_ru) && (
                              <p className="text-sm text-muted-foreground">
                                🏷️ {isRu && step.landmark_ru ? step.landmark_ru : step.landmark}
                              </p>
                            )}
                            {step.photo_url && (
                              <img 
                                src={step.photo_url} 
                                alt={`Step ${index + 1}`} 
                                className="w-full h-40 object-cover rounded-lg mt-2"
                              />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Nearby Tab */}
          <TabsContent value="local" className="space-y-4">
            {Object.keys(groupedTips).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{isRu ? 'Рекомендации скоро появятся' : 'Recommendations coming soon'}</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedTips).map(([category, tips]) => {
                const Icon = categoryIcons[category] || MapPin;
                return (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" />
                        {isRu ? categoryLabels[category]?.ru : categoryLabels[category]?.en}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {tips.map((tip) => (
                        <div key={tip.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{isRu && tip.name_ru ? tip.name_ru : tip.name}</p>
                              {(tip.description || tip.description_ru) && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {isRu ? tip.description_ru || tip.description : tip.description}
                                </p>
                              )}
                              {tip.address && <p className="text-xs text-muted-foreground mt-1">📍 {tip.address}</p>}
                            </div>
                            {tip.google_maps_url && (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={tip.google_maps_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          {isRu ? 'Создано в' : 'Powered by'} <span className="font-semibold text-primary">myUNO</span>
        </p>
      </div>
    </div>
  );
}
