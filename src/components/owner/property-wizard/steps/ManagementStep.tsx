import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PropertyFormData } from '@/hooks/usePropertyWizard';

interface ManagementStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

export function ManagementStep({ formData, updateFormData }: ManagementStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const managementTypes = [
    { value: 'full', labelEn: 'Full Management', labelRu: 'Полное управление', desc: isRu ? 'UNO берёт на себя всё: маркетинг, бронирования, гостей, обслуживание' : 'UNO handles everything: marketing, bookings, guests, maintenance' },
    { value: 'partial', labelEn: 'Service Partner', labelRu: 'Сервис-партнёр', desc: isRu ? 'Check-in/out, депозит, коммуналка + услуги по партнёрским ценам' : 'Check-in/out, deposit, utilities + services at partner rates' },
    { value: 'self', labelEn: 'Listing Only', labelRu: 'Только листинг', desc: isRu ? 'Публикация на платформе, услуги по стандартным ценам' : 'Platform listing, services at standard rates' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {isRu ? 'Тип управления' : 'Management Type'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {managementTypes.map((type) => (
          <div
            key={type.value}
            onClick={() => updateFormData({ management_type: type.value })}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
              formData.management_type === type.value 
                ? 'border-primary bg-primary/5' 
                : 'border-muted hover:border-muted-foreground/30'
            }`}
          >
            <p className="font-medium">{isRu ? type.labelRu : type.labelEn}</p>
            <p className="text-sm text-muted-foreground">{type.desc}</p>
          </div>
        ))}

        {/* Management type details */}
        {formData.management_type === 'full' && (
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 space-y-3">
            <h4 className="font-semibold text-primary">
              🏆 {isRu ? 'Полное управление UNO' : 'Full UNO Management'}
            </h4>
            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="font-bold text-lg text-primary">
                {isRu ? 'Доход: 70% вам / 30% UNO' : 'Revenue: 70% You / 30% UNO'}
              </p>
            </div>
            <ul className="text-sm space-y-1 pl-4">
              <li>✓ {isRu ? 'Маркетинг и динамическое ценообразование' : 'Marketing and dynamic pricing'}</li>
              <li>✓ {isRu ? 'Проверка и поддержка гостей 24/7' : 'Guest verification and 24/7 support'}</li>
              <li>✓ {isRu ? 'Уборка и техобслуживание' : 'Cleaning and maintenance'}</li>
              <li>✓ {isRu ? 'Ежемесячные финансовые отчёты' : 'Monthly financial reports'}</li>
            </ul>
          </div>
        )}

        {formData.management_type === 'partial' && (
          <div className="p-4 bg-secondary/50 rounded-xl border border-secondary space-y-3">
            <h4 className="font-semibold">
              🤝 {isRu ? 'Сервис-партнёр — 15%' : 'Service Partner — 15%'}
            </h4>
            <ul className="text-sm space-y-1 pl-4">
              <li>✓ {isRu ? 'Check-in/out гостей' : 'Guest Check-in/out'}</li>
              <li>✓ {isRu ? 'Управление депозитом' : 'Deposit management'}</li>
              <li>✓ {isRu ? 'Оплата коммунальных' : 'Utility payments'}</li>
              <li>✓ {isRu ? 'Партнёрские цены на услуги' : 'Partner rates on services'}</li>
            </ul>
          </div>
        )}

        {formData.management_type === 'self' && (
          <div className="p-4 bg-muted rounded-xl border border-border space-y-3">
            <h4 className="font-semibold">
              📋 {isRu ? 'Только листинг — 10%' : 'Listing Only — 10%'}
            </h4>
            <ul className="text-sm space-y-1 pl-4">
              <li>✓ {isRu ? 'Публикация на платформе UNO' : 'Listing on UNO platform'}</li>
              <li>✓ {isRu ? 'Синхронизация календаря' : 'Calendar sync'}</li>
              <li>✓ {isRu ? 'Услуги по запросу' : 'On-demand services'}</li>
            </ul>
          </div>
        )}

        {/* Rental status */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{isRu ? 'Сдаётся в аренду' : 'Currently Rented'}</p>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Объект сдаётся через площадки' : 'Property is listed on platforms'}
              </p>
            </div>
            <Switch
              checked={formData.is_rented}
              onCheckedChange={(checked) => updateFormData({ is_rented: checked })}
            />
          </div>

          {formData.is_rented && (
            <div className="mt-4 space-y-3">
              <Label>{isRu ? 'Каналы бронирования' : 'Booking Channels'}</Label>
              <div className="flex flex-wrap gap-2">
                {['Airbnb', 'Booking.com', 'Agoda', 'VRBO', isRu ? 'Напрямую' : 'Direct'].map((platform) => {
                  const value = platform.toLowerCase().replace('.com', '').replace('напрямую', 'direct');
                  const isSelected = formData.rental_platforms.includes(value);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => {
                        updateFormData({
                          rental_platforms: isSelected
                            ? formData.rental_platforms.filter(p => p !== value)
                            : [...formData.rental_platforms, value]
                        });
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
