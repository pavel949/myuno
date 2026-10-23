import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  const { user } = useAuth();
  const actor = useRef(user?.id); actor.current = user?.id;
  const { flags, isLoading, isFetching, error, refetch } = useAdminFeatureFlags();
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const toggle = useToggleFeatureFlag();

  const handleToggle = (flagKey: string, currentEnabled: boolean, rolloutPct: number) => {
    const expected = user?.id;
    toggle.mutate(
      { flagKey, enabled: !currentEnabled, rolloutPct },
      {
        onSuccess: () => { if (actor.current === expected) { setFailedFor(null); toast.success(isRu ? 'Настройка флага сохранена и проверена' : 'Flag setting saved and verified'); } },
        onError: () => { if (actor.current === expected && expected) { setFailedFor(expected); toast.error(isRu ? 'Сохранение не подтверждено. Загрузите настройки заново.' : 'Save not confirmed. Reload settings before retrying.'); } },
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

  if (!user) return <p role="alert">{isRu ? 'Войдите для управления настройками.' : 'Sign in to manage settings.'}</p>;
  const reload = async () => { const expected = user.id; const result = await refetch(); if (actor.current === expected && !result.error) setFailedFor(null); };
  if (error) return <div role="alert"><p>{isRu ? 'Настройки флагов недоступны.' : 'Feature flag settings are unavailable.'}</p><Button disabled={isFetching} onClick={() => void reload()}>{isRu ? 'Повторить загрузку' : 'Reload settings'}</Button></div>;

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
      <p className="text-sm text-muted-foreground">{isRu ? 'Общие настройки платформы. Запрошенное состояние не отменяет ограничения сборки и доступа.' : 'Platform-wide settings. Requested state does not override build or access gates.'}</p>
      {failedFor === user.id && <div role="alert"><p>{isRu ? 'Сохранение не подтверждено. Сначала загрузите настройки заново.' : 'Save not confirmed. Reload settings before retrying.'}</p><Button disabled={isFetching} onClick={() => void reload()}>{isRu ? 'Повторить загрузку' : 'Reload settings'}</Button></div>}
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
                    <p className="text-xs">{isRu ? 'Действует для вашего аккаунта' : 'Effective for your account'}: {flag.effectiveEnabled ? (isRu ? 'Вкл.' : 'On') : (isRu ? 'Выкл.' : 'Off')}</p>
                  </div>
                  <Switch
                    aria-label={`${isRu ? 'Запрошенное состояние' : 'Requested state'}: ${flag.key}`}
                    checked={flag.enabled}
                    onCheckedChange={() => handleToggle(flag.key, flag.enabled, flag.rolloutPct)}
                    disabled={toggle.isPending || isFetching || failedFor === user.id}
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
