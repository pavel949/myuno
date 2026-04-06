import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePropertyGuidebook, GuidebookFormData, ApplianceGuide, EmergencyContact, LocalTip, DirectionStep } from '@/hooks/usePropertyGuidebook';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
import { toast } from 'sonner';
  Wifi, Key, Phone, MapPin, Plus, Trash2, Save, Loader2, Book, User,
  Share2, Copy, Check, Navigation, MessageSquare, ExternalLink
} from 'lucide-react';

const tipCategories = [
  { value: 'restaurant', label: { en: 'Restaurant', ru: 'Ресторан' } },
  { value: 'cafe', label: { en: 'Cafe', ru: 'Кафе' } },
  { value: 'beach', label: { en: 'Beach', ru: 'Пляж' } },
  { value: 'shopping', label: { en: 'Shopping', ru: 'Магазин' } },
  { value: 'attraction', label: { en: 'Attraction', ru: 'Достопримечательность' } },
  { value: 'transport', label: { en: 'Transport', ru: 'Транспорт' } },
  { value: 'other', label: { en: 'Other', ru: 'Другое' } },
];

export default function OwnerGuidebookEdit() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { guidebook, isLoading, saveGuidebook, shareUrl } = usePropertyGuidebook(propertyId);
  const [copiedLink, setCopiedLink] = useState(false);

  const [formData, setFormData] = useState<GuidebookFormData>({
    wifi_name: '', wifi_password: '',
    door_code: '', gate_code: '', lockbox_code: '', lockbox_location: '',
    appliance_guides: [], emergency_contacts: [], local_tips: [], directions: [],
    trash_instructions: '', trash_instructions_ru: '',
    parking_instructions: '', parking_instructions_ru: '',
    checkout_instructions: '', checkout_instructions_ru: '',
    welcome_message: '', welcome_message_ru: '',
    is_public: false,
  });

  useEffect(() => {
    if (guidebook) {
      setFormData({
        wifi_name: guidebook.wifi_name || '',
        wifi_password: guidebook.wifi_password || '',
        door_code: guidebook.door_code || '',
        gate_code: guidebook.gate_code || '',
        lockbox_code: guidebook.lockbox_code || '',
        lockbox_location: guidebook.lockbox_location || '',
        appliance_guides: guidebook.appliance_guides || [],
        emergency_contacts: guidebook.emergency_contacts || [],
        local_tips: guidebook.local_tips || [],
        directions: guidebook.directions || [],
        trash_instructions: guidebook.trash_instructions || '',
        trash_instructions_ru: guidebook.trash_instructions_ru || '',
        parking_instructions: guidebook.parking_instructions || '',
        parking_instructions_ru: guidebook.parking_instructions_ru || '',
        checkout_instructions: guidebook.checkout_instructions || '',
        checkout_instructions_ru: guidebook.checkout_instructions_ru || '',
        welcome_message: guidebook.welcome_message || '',
        welcome_message_ru: guidebook.welcome_message_ru || '',
        is_public: guidebook.is_public || false,
      });
    }
  }, [guidebook]);

  const handleChange = (field: keyof GuidebookFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Appliance guides
  const addApplianceGuide = () => {
    setFormData(prev => ({
      ...prev,
      appliance_guides: [...(prev.appliance_guides || []), { id: crypto.randomUUID(), name: '', instructions: '' }],
    }));
  };
  const updateApplianceGuide = (id: string, field: keyof ApplianceGuide, value: string) => {
    setFormData(prev => ({
      ...prev,
      appliance_guides: (prev.appliance_guides || []).map(g => g.id === id ? { ...g, [field]: value } : g),
    }));
  };
  const removeApplianceGuide = (id: string) => {
    setFormData(prev => ({ ...prev, appliance_guides: (prev.appliance_guides || []).filter(g => g.id !== id) }));
  };

  // Emergency contacts
  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: [...(prev.emergency_contacts || []), { id: crypto.randomUUID(), name: '', phone: '', role: '' }],
    }));
  };
  const updateEmergencyContact = (id: string, field: keyof EmergencyContact, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: (prev.emergency_contacts || []).map(c => c.id === id ? { ...c, [field]: value } : c),
    }));
  };
  const removeEmergencyContact = (id: string) => {
    setFormData(prev => ({ ...prev, emergency_contacts: (prev.emergency_contacts || []).filter(c => c.id !== id) }));
  };

  // Local tips
  const addLocalTip = () => {
    setFormData(prev => ({
      ...prev,
      local_tips: [...(prev.local_tips || []), { id: crypto.randomUUID(), category: 'restaurant' as const, name: '' }],
    }));
  };
  const updateLocalTip = (id: string, field: keyof LocalTip, value: string) => {
    setFormData(prev => ({
      ...prev,
      local_tips: (prev.local_tips || []).map(t => t.id === id ? { ...t, [field]: value } : t),
    }));
  };
  const removeLocalTip = (id: string) => {
    setFormData(prev => ({ ...prev, local_tips: (prev.local_tips || []).filter(t => t.id !== id) }));
  };

  // Directions
  const addDirection = () => {
    const currentDirs = formData.directions || [];
    setFormData(prev => ({
      ...prev,
      directions: [...currentDirs, { id: crypto.randomUUID(), order: currentDirs.length + 1, instruction: '' }],
    }));
  };
  const updateDirection = (id: string, field: keyof DirectionStep, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      directions: (prev.directions || []).map(d => d.id === id ? { ...d, [field]: value } : d),
    }));
  };
  const removeDirection = (id: string) => {
    setFormData(prev => ({
      ...prev,
      directions: (prev.directions || []).filter(d => d.id !== id).map((d, i) => ({ ...d, order: i + 1 })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveGuidebook.mutateAsync(formData);
  };

  const copyShareLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast(isRu);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <User className="w-16 h-16 text-muted-foreground" />
          <p className="text-muted-foreground">{isRu ? 'Войдите для редактирования' : 'Please login to edit'}</p>
          <Button onClick={() => navigate('/auth')}>{isRu ? 'Войти' : 'Login'}</Button>
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

  return (
    <PageContainer>
      <PageHeader title={isRu ? 'Гид по объекту' : 'Property Guidebook'} showBack />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Share Link & Public toggle */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              {isRu ? 'Поделиться с гостем' : 'Share with Guest'}
            </CardTitle>
            <CardDescription>
              {isRu 
                ? 'Включите публичный доступ, чтобы гости могли открывать гид без регистрации'
                : 'Enable public access so guests can open the guidebook without registration'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_public" className="cursor-pointer">
                {isRu ? 'Публичная ссылка' : 'Public Link'}
              </Label>
              <Switch 
                id="is_public"
                checked={formData.is_public || false}
                onCheckedChange={(v) => handleChange('is_public', v)}
              />
            </div>
            {guidebook?.share_token && formData.is_public && (
              <div className="flex items-center gap-2">
                <Input value={shareUrl || ''} readOnly className="text-sm font-mono" />
                <Button type="button" variant="outline" size="icon" onClick={copyShareLink}>
                  {copiedLink ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button type="button" variant="outline" size="icon" asChild>
                  <a href={shareUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            )}
            {!guidebook && formData.is_public && (
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Сохраните гид для получения ссылки' : 'Save the guidebook to get the share link'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {isRu ? 'Приветственное сообщение' : 'Welcome Message'}
            </CardTitle>
            <CardDescription>
              {isRu ? 'Персональное обращение к гостю при открытии гида' : 'Personal greeting shown when guest opens the guidebook'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{isRu ? 'Сообщение (EN)' : 'Message (EN)'}</Label>
              <Textarea
                value={formData.welcome_message || ''}
                onChange={(e) => handleChange('welcome_message', e.target.value)}
                placeholder="Welcome to our home! We hope you enjoy your stay..."
                rows={2}
              />
            </div>
            <div>
              <Label>{isRu ? 'Сообщение (RU)' : 'Message (RU)'}</Label>
              <Textarea
                value={formData.welcome_message_ru || ''}
                onChange={(e) => handleChange('welcome_message_ru', e.target.value)}
                placeholder="Добро пожаловать! Мы рады вас видеть..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* WiFi */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><Wifi className="w-5 h-5" /> WiFi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Название сети' : 'Network Name'}</Label>
                <Input value={formData.wifi_name || ''} onChange={(e) => handleChange('wifi_name', e.target.value)} placeholder="MyWiFi_5G" />
              </div>
              <div>
                <Label>{isRu ? 'Пароль' : 'Password'}</Label>
                <Input value={formData.wifi_password || ''} onChange={(e) => handleChange('wifi_password', e.target.value)} placeholder="password123" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Codes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5" /> {isRu ? 'Коды доступа' : 'Access Codes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Код двери' : 'Door Code'}</Label>
                <Input value={formData.door_code || ''} onChange={(e) => handleChange('door_code', e.target.value)} placeholder="1234" />
              </div>
              <div>
                <Label>{isRu ? 'Код ворот' : 'Gate Code'}</Label>
                <Input value={formData.gate_code || ''} onChange={(e) => handleChange('gate_code', e.target.value)} placeholder="5678" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Код сейфа' : 'Lockbox Code'}</Label>
                <Input value={formData.lockbox_code || ''} onChange={(e) => handleChange('lockbox_code', e.target.value)} placeholder="9999" />
              </div>
              <div>
                <Label>{isRu ? 'Расположение сейфа' : 'Lockbox Location'}</Label>
                <Input value={formData.lockbox_location || ''} onChange={(e) => handleChange('lockbox_location', e.target.value)} placeholder={isRu ? 'Рядом с входной дверью' : 'Near front door'} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Directions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              {isRu ? 'Как добраться' : 'Directions'}
            </CardTitle>
            <CardDescription>
              {isRu ? 'Пошаговая инструкция для гостя' : 'Step-by-step directions for your guest'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.directions || []).map((step, index) => (
              <div key={step.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {isRu ? `Шаг ${index + 1}` : `Step ${index + 1}`}
                    </span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeDirection(step.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label>{isRu ? 'Инструкция (EN)' : 'Instruction (EN)'}</Label>
                  <Input
                    value={step.instruction}
                    onChange={(e) => updateDirection(step.id, 'instruction', e.target.value)}
                    placeholder={isRu ? 'Поверните направо после 7-Eleven...' : 'Turn right after 7-Eleven...'}
                  />
                </div>
                <div>
                  <Label>{isRu ? 'Инструкция (RU)' : 'Instruction (RU)'}</Label>
                  <Input
                    value={step.instruction_ru || ''}
                    onChange={(e) => updateDirection(step.id, 'instruction_ru', e.target.value)}
                    placeholder={isRu ? 'Поверните направо после 7-Eleven...' : 'Turn right after 7-Eleven...'}
                  />
                </div>
                <div>
                  <Label>{isRu ? 'Ориентир' : 'Landmark'}</Label>
                  <Input
                    value={step.landmark || ''}
                    onChange={(e) => updateDirection(step.id, 'landmark', e.target.value)}
                    placeholder={isRu ? 'Красное здание напротив' : 'Red building across the street'}
                  />
                </div>
                <div>
                  <Label>{isRu ? 'URL фото шага' : 'Step photo URL'}</Label>
                  <Input
                    value={step.photo_url || ''}
                    onChange={(e) => updateDirection(step.id, 'photo_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addDirection}>
              <Plus className="w-4 h-4 mr-2" />
              {isRu ? 'Добавить шаг' : 'Add Step'}
            </Button>
          </CardContent>
        </Card>

        {/* Appliance Guides */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Book className="w-5 h-5" /> {isRu ? 'Инструкции по технике' : 'Appliance Guides'}
            </CardTitle>
            <CardDescription>{isRu ? 'Кондиционер, стиральная машина и т.д.' : 'AC, washing machine, etc.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.appliance_guides || []).map((guide) => (
              <div key={guide.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Input value={guide.name} onChange={(e) => updateApplianceGuide(guide.id, 'name', e.target.value)} placeholder={isRu ? 'Кондиционер' : 'Air Conditioner'} className="flex-1 mr-2" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeApplianceGuide(guide.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
                <Textarea value={guide.instructions} onChange={(e) => updateApplianceGuide(guide.id, 'instructions', e.target.value)} placeholder={isRu ? 'Инструкции...' : 'Instructions...'} rows={2} />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addApplianceGuide}>
              <Plus className="w-4 h-4 mr-2" /> {isRu ? 'Добавить инструкцию' : 'Add Guide'}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{isRu ? 'Важная информация' : 'Important Information'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{isRu ? 'Мусор' : 'Trash'}</Label>
              <Textarea value={formData.trash_instructions || ''} onChange={(e) => handleChange('trash_instructions', e.target.value)} placeholder={isRu ? 'Где выбрасывать мусор...' : 'Where to dispose trash...'} rows={2} />
            </div>
            <div>
              <Label>{isRu ? 'Парковка' : 'Parking'}</Label>
              <Textarea value={formData.parking_instructions || ''} onChange={(e) => handleChange('parking_instructions', e.target.value)} placeholder={isRu ? 'Информация о парковке...' : 'Parking information...'} rows={2} />
            </div>
            <div>
              <Label>{isRu ? 'Инструкции при выезде' : 'Check-out Instructions'}</Label>
              <Textarea value={formData.checkout_instructions || ''} onChange={(e) => handleChange('checkout_instructions', e.target.value)} placeholder={isRu ? 'Что нужно сделать при выезде...' : 'What to do at check-out...'} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5" /> {isRu ? 'Экстренные контакты' : 'Emergency Contacts'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.emergency_contacts || []).map((contact) => (
              <div key={contact.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={contact.name} onChange={(e) => updateEmergencyContact(contact.id, 'name', e.target.value)} placeholder={isRu ? 'Имя' : 'Name'} className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeEmergencyContact(contact.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={contact.role} onChange={(e) => updateEmergencyContact(contact.id, 'role', e.target.value)} placeholder={isRu ? 'Менеджер' : 'Manager'} />
                  <Input value={contact.phone} onChange={(e) => updateEmergencyContact(contact.id, 'phone', e.target.value)} placeholder="+66 123 456 789" />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addEmergencyContact}>
              <Plus className="w-4 h-4 mr-2" /> {isRu ? 'Добавить контакт' : 'Add Contact'}
            </Button>
          </CardContent>
        </Card>

        {/* Local Tips */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" /> {isRu ? 'Рекомендации рядом' : 'Local Tips'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.local_tips || []).map((tip) => (
              <div key={tip.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={tip.category} onValueChange={(value) => updateLocalTip(tip.id, 'category', value)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tipCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{isRu ? cat.label.ru : cat.label.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={tip.name} onChange={(e) => updateLocalTip(tip.id, 'name', e.target.value)} placeholder={isRu ? 'Название' : 'Name'} className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLocalTip(tip.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
                <Input value={tip.address || ''} onChange={(e) => updateLocalTip(tip.id, 'address', e.target.value)} placeholder={isRu ? 'Адрес' : 'Address'} />
                <Input value={tip.google_maps_url || ''} onChange={(e) => updateLocalTip(tip.id, 'google_maps_url', e.target.value)} placeholder="Google Maps URL" />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addLocalTip}>
              <Plus className="w-4 h-4 mr-2" /> {isRu ? 'Добавить рекомендацию' : 'Add Tip'}
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={saveGuidebook.isPending}>
          {saveGuidebook.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isRu ? 'Сохранение...' : 'Saving...'}</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />{isRu ? 'Сохранить гид' : 'Save Guidebook'}</>
          )}
        </Button>
      </form>
    </PageContainer>
  );
}
