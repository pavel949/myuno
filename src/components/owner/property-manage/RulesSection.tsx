import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CancellationPolicySelector } from '@/components/property/CancellationPolicySelector';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Key, Volume2, PawPrint, Baby, PartyPopper, 
  Sparkles, Zap, Car, Droplets, Bot
} from 'lucide-react';

interface RulesSectionProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
}

const KEY_HANDOVER_OPTIONS = [
  { value: 'in_person', labelEn: 'In person', labelRu: 'Лично' },
  { value: 'lockbox', labelEn: 'Lockbox with code', labelRu: 'Сейф с кодом' },
  { value: 'doorman', labelEn: 'Doorman / Security', labelRu: 'Консьерж' },
  { value: 'self_service', labelEn: 'Smart lock', labelRu: 'Умный замок' },
];

export function PropertyManageRulesSection({ formData, updateFormData }: RulesSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {isRu ? 'Правила и политики' : 'Policies & Rules'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu 
            ? 'Условия отмены, правила проживания и услуги' 
            : 'Cancellation policy, house rules and amenities'}
        </p>
      </div>

      {/* Cancellation Policy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isRu ? 'Политика отмены' : 'Cancellation Policy'}
          </CardTitle>
          <CardDescription>
            {isRu 
              ? 'Выберите условия возврата при отмене бронирования' 
              : 'Choose refund terms for booking cancellations'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CancellationPolicySelector
            value={formData.cancellation_policy || 'flexible'}
            onChange={(policy) => updateFormData({ cancellation_policy: policy })}
          />
        </CardContent>
      </Card>

      {/* Key Handover */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            {isRu ? 'Получение ключей' : 'Key Handover'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{isRu ? 'Способ передачи' : 'Handover method'}</Label>
            <Select
              value={formData.key_handover || 'in_person'}
              onValueChange={(value) => updateFormData({ key_handover: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KEY_HANDOVER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {isRu ? opt.labelRu : opt.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{isRu ? 'Инструкции (EN)' : 'Instructions (EN)'}</Label>
            <Textarea
              value={formData.check_in_instructions || ''}
              onChange={(e) => updateFormData({ check_in_instructions: e.target.value })}
              placeholder={isRu ? 'Как добраться, где встретиться...' : 'How to get there, where to meet...'}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>{isRu ? 'Инструкции (RU)' : 'Instructions (RU)'}</Label>
            <Textarea
              value={formData.check_in_instructions_ru || ''}
              onChange={(e) => updateFormData({ check_in_instructions_ru: e.target.value })}
              placeholder="Как добраться, где встретиться..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* House Rules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            {isRu ? 'Правила проживания' : 'House Rules'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quiet Hours */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isRu ? 'Тихие часы с' : 'Quiet hours from'}</Label>
              <Select
                value={formData.quiet_hours_start || '22:00'}
                onValueChange={(value) => updateFormData({ quiet_hours_start: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['20:00', '21:00', '22:00', '23:00'].map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'до' : 'until'}</Label>
              <Select
                value={formData.quiet_hours_end || '08:00'}
                onValueChange={(value) => updateFormData({ quiet_hours_end: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['06:00', '07:00', '08:00', '09:00', '10:00'].map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggle rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <PawPrint className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{isRu ? 'Можно с питомцами' : 'Pets allowed'}</span>
              </div>
              <Switch
                checked={formData.pets_allowed || false}
                onCheckedChange={(checked) => updateFormData({ pets_allowed: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Baby className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{isRu ? 'Подходит для детей' : 'Children friendly'}</span>
              </div>
              <Switch
                checked={formData.children_friendly ?? true}
                onCheckedChange={(checked) => updateFormData({ children_friendly: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <PartyPopper className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{isRu ? 'Можно вечеринки' : 'Parties allowed'}</span>
              </div>
              <Switch
                checked={formData.parties_allowed || false}
                onCheckedChange={(checked) => updateFormData({ parties_allowed: checked })}
              />
            </div>
          </div>

          {/* Pet deposit */}
          {formData.pets_allowed && (
            <div className="space-y-2">
              <Label>{isRu ? 'Депозит за питомца' : 'Pet deposit'}</Label>
              <Input
                type="number"
                value={formData.pet_deposit || ''}
                onChange={(e) => updateFormData({ pet_deposit: e.target.value })}
                placeholder="5000"
              />
            </div>
          )}

          {/* Smoking penalty */}
          <div className="space-y-2">
            <Label>{isRu ? 'Штраф за курение' : 'Smoking penalty'}</Label>
            <Input
              type="number"
              value={formData.smoking_penalty || ''}
              onChange={(e) => updateFormData({ smoking_penalty: e.target.value })}
              placeholder="5000"
            />
          </div>

          {/* Free-form rules */}
          <div className="space-y-2">
            <Label>{isRu ? 'Дополнительные правила (EN)' : 'Additional rules (EN)'}</Label>
            <Textarea
              value={formData.house_rules || ''}
              onChange={(e) => updateFormData({ house_rules: e.target.value })}
              placeholder={isRu ? 'Любые другие правила...' : 'Any other rules...'}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>{isRu ? 'Дополнительные правила (RU)' : 'Additional rules (RU)'}</Label>
            <Textarea
              value={formData.house_rules_ru || ''}
              onChange={(e) => updateFormData({ house_rules_ru: e.target.value })}
              placeholder="Любые другие правила..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Included Amenities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {isRu ? 'Услуги в стоимости' : 'Included Amenities'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm">{isRu ? 'Электричество' : 'Electricity'}</span>
                {!formData.electricity_included && (
                  <p className="text-xs text-muted-foreground">
                    {formData.electricity_unit_price || 7} ฿/{isRu ? 'кВт' : 'kWh'}
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={formData.electricity_included || false}
              onCheckedChange={(checked) => updateFormData({ electricity_included: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{isRu ? 'Вода' : 'Water'}</span>
            </div>
            <Switch
              checked={formData.water_included ?? true}
              onCheckedChange={(checked) => updateFormData({ water_included: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{isRu ? 'Уборка' : 'Cleaning'}</span>
            </div>
            <Switch
              checked={formData.cleaning_included ?? true}
              onCheckedChange={(checked) => updateFormData({ cleaning_included: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm">{isRu ? 'Парковка' : 'Parking'}</span>
                {formData.parking_included && (
                  <p className="text-xs text-muted-foreground">
                    {formData.parking_spaces || 1} {isRu ? 'мест' : 'spots'}
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={formData.parking_included ?? true}
              onCheckedChange={(checked) => updateFormData({ parking_included: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Auto-Reply */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" />
              {isRu ? 'AI Авто-ответы' : 'AI Auto-Reply'}
              <Badge variant="secondary" className="text-[10px]">AI</Badge>
            </CardTitle>
            <Switch
              checked={formData.ai_autoreply_enabled || false}
              onCheckedChange={(checked) => updateFormData({ ai_autoreply_enabled: checked })}
            />
          </div>
          <CardDescription>
            {isRu
              ? 'AI автоматически отвечает на сообщения гостей, используя данные вашего объекта'
              : 'AI automatically replies to guest messages using your property data'}
          </CardDescription>
        </CardHeader>
        {formData.ai_autoreply_enabled && (
          <CardContent>
            <div className="space-y-2">
              <Label>{isRu ? 'Дополнительные инструкции для AI' : 'Custom AI instructions'}</Label>
              <Textarea
                value={formData.ai_autoreply_instructions || ''}
                onChange={(e) => updateFormData({ ai_autoreply_instructions: e.target.value })}
                placeholder={isRu 
                  ? 'Например: Всегда предлагай трансфер из аэропорта. Упоминай скидку при бронировании от 7 ночей.'
                  : 'E.g.: Always offer airport transfer. Mention discount for 7+ night bookings.'}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {isRu
                  ? 'AI будет отвечать от имени менеджера, используя описание, правила и гайдбук объекта'
                  : 'AI will reply as manager using your property description, rules, and guidebook'}
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
