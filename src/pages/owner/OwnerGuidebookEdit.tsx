import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePropertyGuidebook, GuidebookFormData, ApplianceGuide, EmergencyContact, LocalTip } from '@/hooks/usePropertyGuidebook';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wifi, 
  Key, 
  Phone, 
  MapPin,
  Plus,
  Trash2,
  Save,
  Loader2,
  Book,
  User
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

  const { guidebook, isLoading, saveGuidebook } = usePropertyGuidebook(propertyId);

  const [formData, setFormData] = useState<GuidebookFormData>({
    wifi_name: '',
    wifi_password: '',
    door_code: '',
    gate_code: '',
    lockbox_code: '',
    lockbox_location: '',
    appliance_guides: [],
    emergency_contacts: [],
    local_tips: [],
    trash_instructions: '',
    trash_instructions_ru: '',
    parking_instructions: '',
    parking_instructions_ru: '',
    checkout_instructions: '',
    checkout_instructions_ru: '',
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
        trash_instructions: guidebook.trash_instructions || '',
        trash_instructions_ru: guidebook.trash_instructions_ru || '',
        parking_instructions: guidebook.parking_instructions || '',
        parking_instructions_ru: guidebook.parking_instructions_ru || '',
        checkout_instructions: guidebook.checkout_instructions || '',
        checkout_instructions_ru: guidebook.checkout_instructions_ru || '',
      });
    }
  }, [guidebook]);

  const handleChange = (field: keyof GuidebookFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Appliance guides management
  const addApplianceGuide = () => {
    const newGuide: ApplianceGuide = {
      id: crypto.randomUUID(),
      name: '',
      instructions: '',
    };
    setFormData(prev => ({
      ...prev,
      appliance_guides: [...(prev.appliance_guides || []), newGuide],
    }));
  };

  const updateApplianceGuide = (id: string, field: keyof ApplianceGuide, value: string) => {
    setFormData(prev => ({
      ...prev,
      appliance_guides: (prev.appliance_guides || []).map(g =>
        g.id === id ? { ...g, [field]: value } : g
      ),
    }));
  };

  const removeApplianceGuide = (id: string) => {
    setFormData(prev => ({
      ...prev,
      appliance_guides: (prev.appliance_guides || []).filter(g => g.id !== id),
    }));
  };

  // Emergency contacts management
  const addEmergencyContact = () => {
    const newContact: EmergencyContact = {
      id: crypto.randomUUID(),
      name: '',
      phone: '',
      role: '',
    };
    setFormData(prev => ({
      ...prev,
      emergency_contacts: [...(prev.emergency_contacts || []), newContact],
    }));
  };

  const updateEmergencyContact = (id: string, field: keyof EmergencyContact, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: (prev.emergency_contacts || []).map(c =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  const removeEmergencyContact = (id: string) => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: (prev.emergency_contacts || []).filter(c => c.id !== id),
    }));
  };

  // Local tips management
  const addLocalTip = () => {
    const newTip: LocalTip = {
      id: crypto.randomUUID(),
      category: 'restaurant',
      name: '',
    };
    setFormData(prev => ({
      ...prev,
      local_tips: [...(prev.local_tips || []), newTip],
    }));
  };

  const updateLocalTip = (id: string, field: keyof LocalTip, value: string) => {
    setFormData(prev => ({
      ...prev,
      local_tips: (prev.local_tips || []).map(t =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  };

  const removeLocalTip = (id: string) => {
    setFormData(prev => ({
      ...prev,
      local_tips: (prev.local_tips || []).filter(t => t.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveGuidebook.mutateAsync(formData);
  };

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <User className="w-16 h-16 text-muted-foreground" />
          <p className="text-muted-foreground">
            {isRu ? 'Войдите для редактирования' : 'Please login to edit'}
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

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Гид по объекту' : 'Property Guidebook'} 
        showBack 
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* WiFi */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              WiFi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Название сети' : 'Network Name'}</Label>
                <Input
                  value={formData.wifi_name}
                  onChange={(e) => handleChange('wifi_name', e.target.value)}
                  placeholder="MyWiFi_5G"
                />
              </div>
              <div>
                <Label>{isRu ? 'Пароль' : 'Password'}</Label>
                <Input
                  value={formData.wifi_password}
                  onChange={(e) => handleChange('wifi_password', e.target.value)}
                  placeholder="password123"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Codes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5" />
              {isRu ? 'Коды доступа' : 'Access Codes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Код двери' : 'Door Code'}</Label>
                <Input
                  value={formData.door_code}
                  onChange={(e) => handleChange('door_code', e.target.value)}
                  placeholder="1234"
                />
              </div>
              <div>
                <Label>{isRu ? 'Код ворот' : 'Gate Code'}</Label>
                <Input
                  value={formData.gate_code}
                  onChange={(e) => handleChange('gate_code', e.target.value)}
                  placeholder="5678"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Код сейфа' : 'Lockbox Code'}</Label>
                <Input
                  value={formData.lockbox_code}
                  onChange={(e) => handleChange('lockbox_code', e.target.value)}
                  placeholder="9999"
                />
              </div>
              <div>
                <Label>{isRu ? 'Расположение сейфа' : 'Lockbox Location'}</Label>
                <Input
                  value={formData.lockbox_location}
                  onChange={(e) => handleChange('lockbox_location', e.target.value)}
                  placeholder={isRu ? 'Рядом с входной дверью' : 'Near front door'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appliance Guides */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Book className="w-5 h-5" />
              {isRu ? 'Инструкции по технике' : 'Appliance Guides'}
            </CardTitle>
            <CardDescription>
              {isRu ? 'Добавьте инструкции для кондиционера, стиралки и т.д.' : 'Add instructions for AC, washing machine, etc.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.appliance_guides || []).map((guide) => (
              <div key={guide.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={guide.name}
                    onChange={(e) => updateApplianceGuide(guide.id, 'name', e.target.value)}
                    placeholder={isRu ? 'Название (напр. Кондиционер)' : 'Name (e.g. Air Conditioner)'}
                    className="flex-1 mr-2"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeApplianceGuide(guide.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <Textarea
                  value={guide.instructions}
                  onChange={(e) => updateApplianceGuide(guide.id, 'instructions', e.target.value)}
                  placeholder={isRu ? 'Инструкции...' : 'Instructions...'}
                  rows={2}
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addApplianceGuide}>
              <Plus className="w-4 h-4 mr-2" />
              {isRu ? 'Добавить инструкцию' : 'Add Guide'}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {isRu ? 'Важная информация' : 'Important Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{isRu ? 'Мусор' : 'Trash'}</Label>
              <Textarea
                value={formData.trash_instructions}
                onChange={(e) => handleChange('trash_instructions', e.target.value)}
                placeholder={isRu ? 'Где выбрасывать мусор...' : 'Where to dispose trash...'}
                rows={2}
              />
            </div>
            <div>
              <Label>{isRu ? 'Парковка' : 'Parking'}</Label>
              <Textarea
                value={formData.parking_instructions}
                onChange={(e) => handleChange('parking_instructions', e.target.value)}
                placeholder={isRu ? 'Информация о парковке...' : 'Parking information...'}
                rows={2}
              />
            </div>
            <div>
              <Label>{isRu ? 'Инструкции при выезде' : 'Check-out Instructions'}</Label>
              <Textarea
                value={formData.checkout_instructions}
                onChange={(e) => handleChange('checkout_instructions', e.target.value)}
                placeholder={isRu ? 'Что нужно сделать при выезде...' : 'What to do at check-out...'}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5" />
              {isRu ? 'Экстренные контакты' : 'Emergency Contacts'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.emergency_contacts || []).map((contact) => (
              <div key={contact.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={contact.name}
                    onChange={(e) => updateEmergencyContact(contact.id, 'name', e.target.value)}
                    placeholder={isRu ? 'Имя' : 'Name'}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEmergencyContact(contact.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={contact.role}
                    onChange={(e) => updateEmergencyContact(contact.id, 'role', e.target.value)}
                    placeholder={isRu ? 'Роль (напр. Менеджер)' : 'Role (e.g. Manager)'}
                  />
                  <Input
                    value={contact.phone}
                    onChange={(e) => updateEmergencyContact(contact.id, 'phone', e.target.value)}
                    placeholder="+66 123 456 789"
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addEmergencyContact}>
              <Plus className="w-4 h-4 mr-2" />
              {isRu ? 'Добавить контакт' : 'Add Contact'}
            </Button>
          </CardContent>
        </Card>

        {/* Local Tips */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {isRu ? 'Рекомендации рядом' : 'Local Tips'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.local_tips || []).map((tip) => (
              <div key={tip.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Select
                    value={tip.category}
                    onValueChange={(value) => updateLocalTip(tip.id, 'category', value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tipCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {isRu ? cat.label.ru : cat.label.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={tip.name}
                    onChange={(e) => updateLocalTip(tip.id, 'name', e.target.value)}
                    placeholder={isRu ? 'Название' : 'Name'}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLocalTip(tip.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <Input
                  value={tip.address || ''}
                  onChange={(e) => updateLocalTip(tip.id, 'address', e.target.value)}
                  placeholder={isRu ? 'Адрес' : 'Address'}
                />
                <Input
                  value={tip.google_maps_url || ''}
                  onChange={(e) => updateLocalTip(tip.id, 'google_maps_url', e.target.value)}
                  placeholder="Google Maps URL"
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addLocalTip}>
              <Plus className="w-4 h-4 mr-2" />
              {isRu ? 'Добавить рекомендацию' : 'Add Tip'}
            </Button>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={saveGuidebook.isPending}
        >
          {saveGuidebook.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isRu ? 'Сохранение...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isRu ? 'Сохранить гид' : 'Save Guidebook'}
            </>
          )}
        </Button>
      </form>
    </PageContainer>
  );
}
