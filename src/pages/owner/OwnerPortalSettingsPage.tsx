/**
 * OwnerPortalSettingsPage — MC configures what a property owner can see
 * in their Owner Portal. Per-property + per-owner visibility toggles.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useOwnerPortalSettings, PORTAL_VISIBILITY_FIELDS, PORTAL_SETTINGS_GROUPS } from '@/hooks/useOwnerPortalSettings';
import { usePropertyDelegates } from '@/hooks/usePropertyDelegates';
import { useSupabaseSingle } from '@/hooks/useSupabaseQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Settings, Eye, Save, Users } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function OwnerPortalSettingsPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();

  // Get property delegates who are owners
  const { data: delegates } = usePropertyDelegates(propertyId);
  const ownerDelegates = delegates?.filter(d => (d.role === 'owner_readonly' || d.role === 'trustee') && d.status === 'active') || [];

  // Get property info
  const { data: property } = useSupabaseSingle<any>({
    table: 'properties',
    id: propertyId,
    select: 'id, title, title_ru, owner_id',
  });

  // Select first owner or property.owner_id
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!selectedOwnerId) {
      if (ownerDelegates.length > 0) {
        setSelectedOwnerId(ownerDelegates[0].user_id);
      } else if (property?.owner_id) {
        setSelectedOwnerId(property.owner_id);
      }
    }
  }, [ownerDelegates, property, selectedOwnerId]);

  const { settings, isLoading, upsert, isUpdating } = useOwnerPortalSettings(propertyId, selectedOwnerId || undefined);

  // Local state for toggles
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
  const [welcomeEn, setWelcomeEn] = useState('');
  const [welcomeRu, setWelcomeRu] = useState('');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (settings) {
      const toggles: Record<string, any> = {};
      PORTAL_VISIBILITY_FIELDS.forEach(f => {
        toggles[f.key] = settings[f.key];
      });
      setLocalSettings(toggles);
      setWelcomeEn(settings.custom_welcome_message || '');
      setWelcomeRu(settings.custom_welcome_message_ru || '');
      setStartDate(settings.statement_start_date || '');
    } else {
      // Defaults
      const toggles: Record<string, any> = {};
      PORTAL_VISIBILITY_FIELDS.forEach(f => {
        toggles[f.key] = f.key === 'show_guest_names' || f.key === 'show_mc_commission' || f.key === 'show_owner_stays' ? false : true;
      });
      setLocalSettings(toggles);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!propertyId || !selectedOwnerId) return;
    try {
      await upsert({
        property_id: propertyId,
        owner_user_id: selectedOwnerId,
        company_id: activeCompany?.company_id || undefined,
        ...localSettings,
        custom_welcome_message: welcomeEn || null,
        custom_welcome_message_ru: welcomeRu || null,
        statement_start_date: startDate || null,
      });
      toast.success(isRu ? 'Настройки портала сохранены' : 'Portal settings saved');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const propertyTitle = isRu ? (property?.title_ru || property?.title) : property?.title;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton fallbackPath={APP_ROUTES.MC} variant="ghost" />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            {isRu ? 'Настройки портала владельца' : 'Owner Portal Settings'}
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            {propertyTitle}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isUpdating || !selectedOwnerId} size="sm">
          <Save className="w-4 h-4 mr-1.5" />
          {isRu ? 'Сохранить' : 'Save'}
        </Button>
      </div>

      {/* Owner selector (if multiple) */}
      {(ownerDelegates.length > 1 || (ownerDelegates.length > 0 && property?.owner_id)) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              {isRu ? 'Выберите владельца' : 'Select Owner'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            {ownerDelegates.map(d => (
              <button
                key={d.user_id}
                onClick={() => setSelectedOwnerId(d.user_id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  selectedOwnerId === d.user_id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {d.profile?.full_name || d.profile?.email || d.user_id.slice(0, 8)}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {!selectedOwnerId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            {isRu 
              ? 'Сначала назначьте владельца объекта через раздел делегатов' 
              : 'First assign a property owner via the delegates section'}
          </CardContent>
        </Card>
      )}

      {selectedOwnerId && (
        <>
          {/* Visibility toggles grouped */}
          {PORTAL_SETTINGS_GROUPS.map(group => (
            <Card key={group.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  {isRu ? group.labelRu : group.labelEn}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {PORTAL_VISIBILITY_FIELDS.filter(f => f.group === group.key).map(field => (
                  <div key={field.key} className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm cursor-pointer">
                      <span>{field.icon}</span>
                      <span>{isRu ? field.labelRu : field.labelEn}</span>
                    </Label>
                    <Switch
                      checked={localSettings[field.key] ?? true}
                      onCheckedChange={(v) => setLocalSettings(prev => ({ ...prev, [field.key]: v }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Welcome message */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {isRu ? 'Персонализация' : 'Customization'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">{isRu ? 'Приветственное сообщение (EN)' : 'Welcome Message (EN)'}</Label>
                <Textarea
                  value={welcomeEn}
                  onChange={e => setWelcomeEn(e.target.value)}
                  placeholder={isRu ? 'Необязательное сообщение...' : 'Optional message for the owner...'}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{isRu ? 'Приветственное сообщение (RU)' : 'Welcome Message (RU)'}</Label>
                <Textarea
                  value={welcomeRu}
                  onChange={e => setWelcomeRu(e.target.value)}
                  placeholder="Необязательное сообщение..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{isRu ? 'Показывать данные с' : 'Show data from'}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {isRu 
                    ? 'Финансовые отчёты будут показаны только с этой даты' 
                    : 'Financial statements will only be shown from this date'}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
