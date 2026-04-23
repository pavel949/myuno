/**
 * LifeOS Resolver Preview Tab - Safety Module
 * Per LIFE OS Contract: READ-ONLY, NEVER mutates data
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminLifeSituations, useResolveLifeOSContext, type LifeOSRole } from '@/hooks/useLifeOS';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, Eye, Layers, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES: { value: LifeOSRole; label: string }[] = [
  { value: 'guest', label: 'Guest' },
  { value: 'resident', label: 'Resident' },
  { value: 'owner', label: 'Owner' },
  { value: 'investor', label: 'Investor' },
];

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
];

export function LifeOSResolverPreviewTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  // Controls
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<LifeOSRole>('guest');
  const [selectedLocale, setSelectedLocale] = useState<'en' | 'ru'>('en');
  const [trustOnly, setTrustOnly] = useState(false);
  const [includeFallback, setIncludeFallback] = useState(true);

  // Fetch situations
  const { data: situations } = useAdminLifeSituations();
  const selectedSituation = situations?.find(s => s.code === selectedCode);

  // Resolve context
  const { data: resolvedItems, isLoading, refetch } = useResolveLifeOSContext(
    selectedCode || null,
    { role: selectedRole, limit: 100 }
  );

  // Filter by trust if needed
  const displayItems = trustOnly 
    ? resolvedItems?.filter(item => item.trust_level === 'verified' || item.trust_level === 'featured')
    : resolvedItems;

  // Group by entity type
  const groupedItems = displayItems?.reduce((acc, item) => {
    if (!acc[item.entity_type]) acc[item.entity_type] = [];
    acc[item.entity_type].push(item);
    return acc;
  }, {} as Record<string, typeof displayItems>);

  // Warnings
  const warnings: { type: 'error' | 'warning'; message: string }[] = [];
  
  if (selectedCode && displayItems) {
    if (displayItems.length === 0) {
      warnings.push({ type: 'error', message: isRussian ? 'Пустой сценарий!' : 'Empty scenario!' });
    }
    
    const primaryBlocks = Object.entries(groupedItems || {}).filter(([_, items]) => 
      items?.some(i => i.weight >= 70)
    );
    
    if (primaryBlocks.length === 0 && displayItems.length > 0) {
      warnings.push({ type: 'warning', message: isRussian ? 'Нет основных блоков (weight >= 70)' : 'No primary blocks (weight >= 70)' });
    }

    const trustedCount = displayItems.filter(i => i.trust_level === 'verified' || i.trust_level === 'featured').length;
    if (trustedCount < displayItems.length * 0.3) {
      warnings.push({ type: 'warning', message: isRussian ? 'Низкое покрытие доверенными элементами' : 'Low trusted item coverage' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {isRussian ? 'Предпросмотр резолвера' : 'Resolver Preview'}
          </CardTitle>
          <CardDescription>
            {isRussian 
              ? 'Тестируйте результаты без изменения данных. Только чтение.'
              : 'Test resolution results without modifying data. Read-only.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{isRussian ? 'Ситуация' : 'Situation'}</Label>
              <Select value={selectedCode} onValueChange={setSelectedCode}>
                <SelectTrigger>
                  <SelectValue placeholder={isRussian ? 'Выберите...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {situations?.filter(s => s.is_active).map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {isRussian ? s.title_ru : s.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRussian ? 'Роль' : 'Role'}</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as LifeOSRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRussian ? 'Язык' : 'Locale'}</Label>
              <Select value={selectedLocale} onValueChange={(v) => setSelectedLocale(v as 'en' | 'ru')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch checked={trustOnly} onCheckedChange={setTrustOnly} id="trust-only" />
                <Label htmlFor="trust-only" className="text-sm">
                  {isRussian ? 'Только доверенные' : 'Trust-only'}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={includeFallback} onCheckedChange={setIncludeFallback} id="fallback" />
                <Label htmlFor="fallback" className="text-sm">
                  {isRussian ? 'С fallback' : 'Include fallback'}
                </Label>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={!selectedCode || isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            {isRussian ? 'Обновить' : 'Refresh'}
          </Button>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div 
              key={i}
              className={cn(
                "flex items-center gap-2 p-3 rounded-none",
                w.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
              )}
            >
              {w.type === 'error' ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm font-medium">{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {selectedCode && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              {displayItems?.length || 0} {isRussian ? 'элементов' : 'items'}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {Object.keys(groupedItems || {}).length} {isRussian ? 'блоков' : 'blocks'}
            </Badge>
            {warnings.length === 0 && displayItems && displayItems.length > 0 && (
              <Badge className="bg-success/10 text-success border-success/30">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {isRussian ? 'Валидно' : 'Valid'}
              </Badge>
            )}
          </div>

          {/* Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedItems || {}).map(([entityType, items]) => {
              const isPrimary = items?.some(i => i.weight >= 70);
              const trustedCount = items?.filter(i => i.trust_level === 'verified' || i.trust_level === 'featured').length || 0;

              return (
                <Card 
                  key={entityType}
                  className={cn(
                    "transition-all",
                    isPrimary && "border-primary/50 bg-primary/5"
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <CardTitle className="text-sm capitalize">{entityType}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPrimary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{items?.length}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-3 h-3" />
                      {trustedCount}/{items?.length} {isRussian ? 'доверенных' : 'trusted'}
                    </div>
                    <Separator />
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {items?.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1">
                          <span className="truncate flex-1">{item.title_localized || item.title}</span>
                          <div className="flex items-center gap-2">
                            {item.price && (
                              <span className="text-muted-foreground">
                                {item.currency} {item.price?.toLocaleString()}
                              </span>
                            )}
                            <Badge variant="secondary" className="text-[10px]">
                              {item.weight}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {items && items.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          +{items.length - 10} {isRussian ? 'ещё' : 'more'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State with Fallback */}
          {displayItems?.length === 0 && includeFallback && (
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="py-8 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-warning mb-4" />
                <h3 className="font-semibold mb-2">
                  {isRussian ? 'Нет результатов для этой комбинации' : 'No results for this combination'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isRussian 
                    ? 'В production будет показан Guided Fallback (Concierge/Support)'
                    : 'In production, Guided Fallback will be shown (Concierge/Support)'}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Badge variant="outline">🤖 Concierge Chat</Badge>
                  <Badge variant="outline">📞 Phone Support</Badge>
                  <Badge variant="outline">📂 Explore Catalog</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty initial state */}
      {!selectedCode && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>{isRussian ? 'Выберите ситуацию для предпросмотра' : 'Select a situation to preview'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
