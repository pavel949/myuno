import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestGuidebook, LocalTip } from '@/hooks/usePropertyGuidebook';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Wifi, 
  Key, 
  Home, 
  Phone, 
  MapPin, 
  Utensils,
  Coffee,
  Palmtree,
  ShoppingBag,
  Camera,
  Car,
  Trash2,
  ParkingCircle,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  Play,
  User,
  Loader2,
  AlertCircle,
  Book
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const categoryIcons: Record<string, React.ElementType> = {
  restaurant: Utensils,
  cafe: Coffee,
  beach: Palmtree,
  shopping: ShoppingBag,
  attraction: Camera,
  transport: Car,
  other: MapPin,
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

export default function GuestGuidebook() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { data: guidebook, isLoading, error } = useGuestGuidebook(propertyId);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: isRu ? 'Скопировано' : 'Copied',
      description: text,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <User className="w-16 h-16 text-muted-foreground" />
          <p className="text-muted-foreground">
            {isRu ? 'Войдите для просмотра гида' : 'Please login to view the guidebook'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Login'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (error || !guidebook) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Гид по объекту' : 'Property Guide'} showBack />
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {isRu ? 'Гид недоступен' : 'Guidebook Not Available'}
            </h2>
            <p className="text-muted-foreground">
              {isRu 
                ? 'Гид будет доступен после подтверждения бронирования'
                : 'The guidebook will be available after your booking is confirmed'
              }
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const groupedTips = guidebook.local_tips.reduce((acc, tip) => {
    if (!acc[tip.category]) acc[tip.category] = [];
    acc[tip.category].push(tip);
    return acc;
  }, {} as Record<string, LocalTip[]>);

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Гид по объекту' : 'Property Guide'} 
        showBack 
      />

      <Tabs defaultValue="essentials">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="essentials" className="flex-1">
            <Home className="w-4 h-4 mr-1" />
            {isRu ? 'Главное' : 'Essentials'}
          </TabsTrigger>
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
                  <Wifi className="w-5 h-5 text-primary" />
                  WiFi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {guidebook.wifi_name && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">{isRu ? 'Сеть' : 'Network'}</p>
                      <p className="font-medium">{guidebook.wifi_name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(guidebook.wifi_name!, 'wifi_name')}
                    >
                      {copiedField === 'wifi_name' ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
                {guidebook.wifi_password && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">{isRu ? 'Пароль' : 'Password'}</p>
                      <p className="font-mono font-medium">{guidebook.wifi_password}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(guidebook.wifi_password!, 'wifi_password')}
                    >
                      {copiedField === 'wifi_password' ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(guidebook.door_code!, 'door_code')}
                    >
                      {copiedField === 'door_code' ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
                {guidebook.gate_code && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">{isRu ? 'Код ворот' : 'Gate Code'}</p>
                      <p className="font-mono font-bold text-lg">{guidebook.gate_code}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(guidebook.gate_code!, 'gate_code')}
                    >
                      {copiedField === 'gate_code' ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
                {guidebook.lockbox_code && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{isRu ? 'Код сейфа' : 'Lockbox Code'}</p>
                        <p className="font-mono font-bold text-lg">{guidebook.lockbox_code}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(guidebook.lockbox_code!, 'lockbox_code')}
                      >
                        {copiedField === 'lockbox_code' ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {guidebook.lockbox_location && (
                      <p className="text-sm text-muted-foreground mt-2">
                        📍 {guidebook.lockbox_location}
                      </p>
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
                        <p className="font-medium">
                          {isRu && guide.name_ru ? guide.name_ru : guide.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isRu && guide.instructions_ru ? guide.instructions_ru : guide.instructions}
                        </p>
                      </div>
                      {guide.video_url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={guide.video_url} target="_blank" rel="noopener noreferrer">
                            <Play className="w-4 h-4" />
                          </a>
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
              <CardTitle className="text-lg">
                {isRu ? 'Важная информация' : 'Important Information'}
              </CardTitle>
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
                      <p className="font-medium">
                        {isRu && contact.name_ru ? contact.name_ru : contact.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isRu && contact.role_ru ? contact.role_ru : contact.role}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${contact.phone}`}>
                        <Phone className="w-4 h-4 mr-1" />
                        {contact.phone}
                      </a>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="local" className="space-y-4">
          {Object.keys(groupedTips).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isRu ? 'Рекомендации скоро появятся' : 'Recommendations coming soon'}
                </p>
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
                            <p className="font-medium">
                              {isRu && tip.name_ru ? tip.name_ru : tip.name}
                            </p>
                            {(tip.description || tip.description_ru) && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {isRu ? tip.description_ru || tip.description : tip.description}
                              </p>
                            )}
                            {tip.address && (
                              <p className="text-sm text-muted-foreground mt-1">
                                📍 {tip.address}
                              </p>
                            )}
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
    </PageContainer>
  );
}
