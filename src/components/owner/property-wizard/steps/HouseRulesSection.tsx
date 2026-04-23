import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Dog, 
  Cigarette, 
  Music, 
  Baby, 
  Clock,
  Volume2,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PropertyFormData } from '@/hooks/usePropertyWizard';

interface HouseRulesSectionProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

function HouseRulesSectionInner({ formData, updateFormData }: HouseRulesSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Home className="h-4 w-4" />
          {isRu ? 'Правила дома' : 'House Rules'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick toggles */}
        <div className="grid gap-3">
          {/* Pets */}
          <div className="flex items-center justify-between p-3 rounded-none border bg-background hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
                <Dog className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{isRu ? 'Домашние животные' : 'Pets'}</p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Разрешены ли питомцы' : 'Are pets allowed'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {formData.pets_allowed && (
                <Badge variant="secondary" className="text-xs">
                  {isRu ? 'Да' : 'Yes'}
                </Badge>
              )}
              <Switch
                checked={formData.pets_allowed || false}
                onCheckedChange={(checked) => updateFormData({ pets_allowed: checked })}
              />
            </div>
          </div>

          {/* Pet deposit - shown only when pets allowed */}
          {formData.pets_allowed && (
            <div className="ml-13 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label className="text-sm">{isRu ? 'Депозит за питомца (THB)' : 'Pet Deposit (THB)'}</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.pet_deposit || ''}
                  onChange={(e) => updateFormData({ pet_deposit: Number(e.target.value) || undefined })}
                  placeholder="2000"
                  className="max-w-[200px]"
                />
              </div>
            </div>
          )}

          {/* Smoking */}
          <div className="flex items-center justify-between p-3 rounded-none border bg-background hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-destructive/10 flex items-center justify-center">
                <Cigarette className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-sm">{isRu ? 'Курение' : 'Smoking'}</p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Разрешено курение в помещении' : 'Smoking allowed indoors'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {formData.smoking_allowed && (
                <Badge variant="destructive" className="text-xs">
                  {isRu ? 'Да' : 'Yes'}
                </Badge>
              )}
              <Switch
                checked={formData.smoking_allowed || false}
                onCheckedChange={(checked) => updateFormData({ smoking_allowed: checked })}
              />
            </div>
          </div>

          {/* Smoking penalty - shown only when smoking NOT allowed */}
          {!formData.smoking_allowed && (
            <div className="ml-13 pl-4 border-l-2 border-destructive/20">
              <div className="space-y-2">
                <Label className="text-sm">{isRu ? 'Штраф за курение (THB)' : 'Smoking Penalty (THB)'}</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.smoking_penalty || ''}
                  onChange={(e) => updateFormData({ smoking_penalty: Number(e.target.value) || undefined })}
                  placeholder="5000"
                  className="max-w-[200px]"
                />
              </div>
            </div>
          )}

          {/* Parties */}
          <div className="flex items-center justify-between p-3 rounded-none border bg-background hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-accent/10 flex items-center justify-center">
                <Music className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-sm">{isRu ? 'Вечеринки' : 'Parties'}</p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Разрешены ли мероприятия' : 'Are events allowed'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {formData.parties_allowed && (
                <Badge variant="secondary" className="text-xs bg-accent/20 text-accent">
                  {isRu ? 'Да' : 'Yes'}
                </Badge>
              )}
              <Switch
                checked={formData.parties_allowed || false}
                onCheckedChange={(checked) => updateFormData({ parties_allowed: checked })}
              />
            </div>
          </div>

          {/* Max party guests - shown only when parties allowed */}
          {formData.parties_allowed && (
            <div className="ml-13 pl-4 border-l-2 border-accent/40/20">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {isRu ? 'Макс. гостей на мероприятие' : 'Max party guests'}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.max_party_guests || ''}
                  onChange={(e) => updateFormData({ max_party_guests: Number(e.target.value) || undefined })}
                  placeholder="20"
                  className="max-w-[200px]"
                />
              </div>
            </div>
          )}

          {/* Children Friendly */}
          <div className="flex items-center justify-between p-3 rounded-none border bg-background hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
                <Baby className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{isRu ? 'Для семей с детьми' : 'Children Friendly'}</p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Подходит для детей' : 'Suitable for children'}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.children_friendly || false}
              onCheckedChange={(checked) => updateFormData({ children_friendly: checked })}
            />
          </div>

          {/* Child equipment - shown when children friendly */}
          {formData.children_friendly && (
            <div className="ml-13 pl-4 border-l-2 border-primary/40/20 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={formData.has_crib || false}
                    onCheckedChange={(checked) => updateFormData({ has_crib: checked })}
                  />
                  {isRu ? 'Есть кроватка' : 'Crib available'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={formData.has_high_chair || false}
                    onCheckedChange={(checked) => updateFormData({ has_high_chair: checked })}
                  />
                  {isRu ? 'Есть стульчик' : 'High chair available'}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Quiet Hours */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">{isRu ? 'Часы тишины' : 'Quiet Hours'}</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {isRu ? 'Начало' : 'Start'}
              </Label>
              <Input
                type="time"
                value={formData.quiet_hours_start || '22:00'}
                onChange={(e) => updateFormData({ quiet_hours_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {isRu ? 'Конец' : 'End'}
              </Label>
              <Input
                type="time"
                value={formData.quiet_hours_end || '08:00'}
                onChange={(e) => updateFormData({ quiet_hours_end: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Additional rules text */}
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-sm">
            {isRu ? 'Дополнительные правила' : 'Additional Rules'}
          </Label>
          <Textarea
            value={isRu ? (formData.house_rules_ru || '') : (formData.house_rules || '')}
            onChange={(e) => updateFormData({ 
              [isRu ? 'house_rules_ru' : 'house_rules']: e.target.value 
            })}
            placeholder={isRu 
              ? 'Например: не открывать окна при включённом кондиционере...' 
              : 'E.g., do not open windows with AC running...'}
            rows={2}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export const HouseRulesSection = memo(HouseRulesSectionInner);
