import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminFeatureFlags, useToggleFeatureFlag } from '@/hooks/useFeatureFlags';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function FeatureFlagManager() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { flags, isLoading } = useAdminFeatureFlags();
  const toggle = useToggleFeatureFlag();

  const handleToggle = (flagKey: string, currentEnabled: boolean) => {
    toggle.mutate(
      { flagKey, enabled: !currentEnabled },
      {
        onSuccess: () => toast.success(isRu ? 'Флаг обновлён' : 'Flag updated'),
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-3"><Skeleton className="h-10" /></CardContent></Card>
        ))}
      </div>
    );
  }

  // Group flags by category
  const groups: Record<string, typeof flags> = {};
  flags.forEach(f => {
    const category = f.constKey.startsWith('VERTICAL_') ? 'Verticals'
      : f.constKey.startsWith('AI_') ? 'AI'
      : f.constKey.startsWith('OWNER_') ? 'Owner'
      : f.constKey.startsWith('VENDOR_') ? 'Vendor'
      : f.key.includes('payment') || f.key.includes('stripe') || f.key.includes('wallet') || f.key.includes('cashback') ? 'Payments'
      : 'General';
    if (!groups[category]) groups[category] = [];
    groups[category].push(f);
  });

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([category, groupFlags]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{category}</h3>
          <div className="space-y-1.5">
            {groupFlags.map(flag => (
              <Card key={flag.key}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium font-mono">{flag.key}</span>
                      {flag.hasDbOverride && (
                        <Badge variant="outline" className="text-[10px]">DB</Badge>
                      )}
                      {flag.allowedRoles && (
                        <Badge variant="secondary" className="text-[10px]">
                          {flag.allowedRoles.join(', ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{flag.description}</p>
                  </div>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => handleToggle(flag.key, flag.enabled)}
                    disabled={toggle.isPending}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {toggle.isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isRu ? 'Сохранение...' : 'Saving...'}
        </div>
      )}
    </div>
  );
}
