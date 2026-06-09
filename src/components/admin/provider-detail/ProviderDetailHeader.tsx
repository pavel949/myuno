import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Edit, Loader2 } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { ContentCreatorMenu } from '@/components/admin/ContentCreatorMenu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProviderDetails } from '@/hooks/useProviderDetails';

interface Props {
  provider: ProviderDetails;
  onUpdate?: () => void;
}

export function ProviderDetailHeader({ provider, onUpdate }: Props) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [updating, setUpdating] = useState<string | null>(null);

  const toggleField = async (field: 'is_active' | 'is_verified', value: boolean) => {
    setUpdating(field);
    try {
      const payload = field === 'is_active' ? { is_active: value } : { is_verified: value };
      const { error } = await supabase
        .from('providers')
        .update(payload)
        .eq('id', provider.id);
      if (error) throw error;
      toast.success(isRu ? 'Обновлено' : 'Updated');
      onUpdate?.();
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <BackButton fallbackPath={APP_ROUTES.ADMIN_PROVIDERS} variant="ghost" size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold truncate">{provider.name}</h1>
            {provider.is_verified ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {isRu ? 'Верифицирован' : 'Verified'}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <XCircle className="h-3 w-3" />
                {isRu ? 'Не верифицирован' : 'Not Verified'}
              </Badge>
            )}
            {!provider.is_active && (
              <Badge variant="destructive">{isRu ? 'Неактивен' : 'Inactive'}</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{provider.business_category}</p>
        </div>
        <div className="flex items-center gap-2">
          <ContentCreatorMenu 
            providerId={provider.id} 
            providerName={provider.name}
            size="sm"
          />
          <Button variant="outline" onClick={() => navigate(`/admin/providers?edit=${provider.id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            {isRu ? 'Редактировать' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Inline status toggles */}
      <div className="flex items-center gap-6 pl-14">
        <div className="flex items-center gap-2">
          <Switch
            id="toggle-active"
            checked={provider.is_active}
            onCheckedChange={(v) => toggleField('is_active', v)}
            disabled={updating === 'is_active'}
          />
          <Label htmlFor="toggle-active" className="text-sm cursor-pointer">
            {isRu ? 'Активен' : 'Active'}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="toggle-verified"
            checked={provider.is_verified}
            onCheckedChange={(v) => toggleField('is_verified', v)}
            disabled={updating === 'is_verified'}
          />
          <Label htmlFor="toggle-verified" className="text-sm cursor-pointer">
            {isRu ? 'Верифицирован' : 'Verified'}
          </Label>
        </div>
        {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}
