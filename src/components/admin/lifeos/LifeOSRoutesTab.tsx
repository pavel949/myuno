/**
 * LifeOS Routes Admin Tab
 * Edit the 7 canonical blocks per route: recognition, reassurance, what_matters,
 * recommended, alternatives, CTA, next_routes
 * 
 * No WYSIWYG. Structured fields only.
 */
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminLifeSituations } from '@/hooks/useLifeOS';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Save, Eye, Route, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LifeOSRoute } from '@/hooks/useLifeOSRoutes';

function useAdminRoutes() {
  return useQuery({
    queryKey: ['admin-lifeos-routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lifeos_routes')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as LifeOSRoute[];
    },
  });
}

export function LifeOSRoutesTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const { data: situations } = useAdminLifeSituations();
  const { data: routes, isLoading } = useAdminRoutes();
  const [editingRoute, setEditingRoute] = useState<LifeOSRoute | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editingRoute) return;
    setSaving(true);

    const { error } = await supabase
      .from('lifeos_routes')
      .update({
        pain_type: editingRoute.pain_type,
        emotional_state: editingRoute.emotional_state,
        risk_level: editingRoute.risk_level,
        recognition_en: editingRoute.recognition_en,
        recognition_ru: editingRoute.recognition_ru,
        reassurance_en: editingRoute.reassurance_en,
        reassurance_ru: editingRoute.reassurance_ru,
        what_matters_en: editingRoute.what_matters_en,
        what_matters_ru: editingRoute.what_matters_ru,
        recommended_entity_type: editingRoute.recommended_entity_type,
        recommended_entity_id: editingRoute.recommended_entity_id,
        recommended_title_en: editingRoute.recommended_title_en,
        recommended_title_ru: editingRoute.recommended_title_ru,
        recommended_why_en: editingRoute.recommended_why_en,
        recommended_why_ru: editingRoute.recommended_why_ru,
        cta_text_en: editingRoute.cta_text_en,
        cta_text_ru: editingRoute.cta_text_ru,
        cta_type: editingRoute.cta_type,
        cta_target: editingRoute.cta_target,
        alternative_entity_ids: editingRoute.alternative_entity_ids,
        next_routes: editingRoute.next_routes,
        next_routes_labels_en: editingRoute.next_routes_labels_en,
        next_routes_labels_ru: editingRoute.next_routes_labels_ru,
      })
      .eq('id', editingRoute.id);

    setSaving(false);
    if (error) {
      toast.error(isRu ? 'Ошибка сохранения' : 'Save error');
    } else {
      toast.success(isRu ? 'Маршрут сохранён' : 'Route saved');
      queryClient.invalidateQueries({ queryKey: ['admin-lifeos-routes'] });
      queryClient.invalidateQueries({ queryKey: ['lifeos-route'] });
      setEditingRoute(null);
    }
  };

  const getSituationLabel = (situationId: string) => {
    const s = situations?.find(sit => sit.id === situationId);
    if (!s) return situationId.slice(0, 8);
    return isRu ? s.title_ru : s.title_en;
  };

  const updateField = <K extends keyof LifeOSRoute>(field: K, value: LifeOSRoute[K]) => {
    if (!editingRoute) return;
    setEditingRoute({ ...editingRoute, [field]: value });
  };

  const updateWhatMatters = (index: number, value: string, lang: 'en' | 'ru') => {
    if (!editingRoute) return;
    const key = lang === 'en' ? 'what_matters_en' : 'what_matters_ru';
    const arr = [...editingRoute[key]];
    arr[index] = value;
    updateField(key, arr);
  };

  const addWhatMatters = (lang: 'en' | 'ru') => {
    if (!editingRoute) return;
    const key = lang === 'en' ? 'what_matters_en' : 'what_matters_ru';
    updateField(key, [...editingRoute[key], '']);
  };

  const removeWhatMatters = (index: number, lang: 'en' | 'ru') => {
    if (!editingRoute) return;
    const key = lang === 'en' ? 'what_matters_en' : 'what_matters_ru';
    updateField(key, editingRoute[key].filter((_, i) => i !== index));
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">{isRu ? 'Загрузка...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{isRu ? 'Маршруты' : 'Routes'}</h3>
          <p className="text-xs text-muted-foreground">
            {isRu ? '7 канонических блоков на маршрут' : '7 canonical blocks per route'}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Route className="w-3 h-3" />
          {routes?.length || 0}
        </Badge>
      </div>

      {/* Routes list */}
      <div className="grid gap-3">
        {routes?.map(route => {
          const situation = situations?.find(s => s.id === route.life_situation_id);
          return (
            <Card
              key={route.id}
              className="cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setEditingRoute(route)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-none flex items-center justify-center"
                    style={{ backgroundColor: `${situation?.color || '#666'}20` }}
                  >
                    <Route className="w-4 h-4" style={{ color: situation?.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{getSituationLabel(route.life_situation_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {route.pain_type} · {route.emotional_state} · {route.risk_level}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{route.cta_type}</Badge>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editingRoute} onOpenChange={(open) => !open && setEditingRoute(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              {editingRoute && getSituationLabel(editingRoute.life_situation_id)}
            </SheetTitle>
          </SheetHeader>

          {editingRoute && (
            <div className="space-y-6 mt-4">
              {/* Meta */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{isRu ? 'Тип боли' : 'Pain type'}</Label>
                  <Select value={editingRoute.pain_type} onValueChange={v => updateField('pain_type', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['uncertainty','urgency','trust_deficit','cognitive_overload','emotional_stress'].map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{isRu ? 'Эмоция' : 'Emotion'}</Label>
                  <Select value={editingRoute.emotional_state} onValueChange={v => updateField('emotional_state', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['tired','anxious','rushed','confused','stressed','cautious','hopeful','determined'].map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{isRu ? 'Риск' : 'Risk'}</Label>
                  <Select value={editingRoute.risk_level} onValueChange={v => updateField('risk_level', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['low','medium','high','critical'].map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Block 1: Recognition */}
              <div className="space-y-2 p-3 rounded-none bg-muted/30 border">
                <p className="text-xs font-semibold text-muted-foreground">① {isRu ? 'Узнавание (эмпатия)' : 'Recognition (empathy)'}</p>
                <Textarea rows={2} value={editingRoute.recognition_en} onChange={e => updateField('recognition_en', e.target.value)} placeholder="EN" className="text-sm" />
                <Textarea rows={2} value={editingRoute.recognition_ru} onChange={e => updateField('recognition_ru', e.target.value)} placeholder="RU" className="text-sm" />
              </div>

              {/* Block 2: Reassurance */}
              <div className="space-y-2 p-3 rounded-none bg-muted/30 border">
                <p className="text-xs font-semibold text-muted-foreground">② {isRu ? 'Успокоение' : 'Reassurance'}</p>
                <Input value={editingRoute.reassurance_en} onChange={e => updateField('reassurance_en', e.target.value)} placeholder="EN" className="text-sm" />
                <Input value={editingRoute.reassurance_ru} onChange={e => updateField('reassurance_ru', e.target.value)} placeholder="RU" className="text-sm" />
              </div>

              {/* Block 3: What Matters */}
              <div className="space-y-2 p-3 rounded-none bg-muted/30 border">
                <p className="text-xs font-semibold text-muted-foreground">③ {isRu ? 'Что важно сейчас' : 'What matters now'}</p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">EN</Label>
                    {editingRoute.what_matters_en.map((item, i) => (
                      <div key={i} className="flex gap-1.5 mt-1">
                        <Input value={item} onChange={e => updateWhatMatters(i, e.target.value, 'en')} className="text-xs h-7" />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeWhatMatters(i, 'en')}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs" onClick={() => addWhatMatters('en')}>
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">RU</Label>
                    {editingRoute.what_matters_ru.map((item, i) => (
                      <div key={i} className="flex gap-1.5 mt-1">
                        <Input value={item} onChange={e => updateWhatMatters(i, e.target.value, 'ru')} className="text-xs h-7" />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeWhatMatters(i, 'ru')}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs" onClick={() => addWhatMatters('ru')}>
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Block 4: Recommendation */}
              <div className="space-y-2 p-3 rounded-none bg-muted/30 border">
                <p className="text-xs font-semibold text-muted-foreground">④ {isRu ? 'Рекомендация' : 'Recommendation'}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Entity type</Label>
                    <Input value={editingRoute.recommended_entity_type || ''} onChange={e => updateField('recommended_entity_type', e.target.value)} className="text-xs h-7" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Entity ID</Label>
                    <Input value={editingRoute.recommended_entity_id || ''} onChange={e => updateField('recommended_entity_id', e.target.value)} className="text-xs h-7" />
                  </div>
                </div>
                <Input value={editingRoute.recommended_title_en} onChange={e => updateField('recommended_title_en', e.target.value)} placeholder="Title EN" className="text-sm" />
                <Input value={editingRoute.recommended_title_ru} onChange={e => updateField('recommended_title_ru', e.target.value)} placeholder="Title RU" className="text-sm" />
                <Textarea rows={2} value={editingRoute.recommended_why_en} onChange={e => updateField('recommended_why_en', e.target.value)} placeholder="Why EN" className="text-sm" />
                <Textarea rows={2} value={editingRoute.recommended_why_ru} onChange={e => updateField('recommended_why_ru', e.target.value)} placeholder="Why RU" className="text-sm" />
              </div>

              {/* Block 5: Alternatives */}
              <div className="space-y-2 p-3 rounded-none bg-muted/30 border">
                <p className="text-xs font-semibold text-muted-foreground">⑤ {isRu ? 'Альтернативы (макс 2)' : 'Alternatives (max 2)'}</p>
                <Textarea
                  rows={2}
                  value={(editingRoute.alternative_entity_ids || []).join('\n')}
                  onChange={e => updateField('alternative_entity_ids', e.target.value.split('\n').filter(Boolean))}
                  placeholder="One entity ID per line"
                  className="text-xs font-mono"
                />
              </div>

              {/* Block 6: CTA */}
              <div className="space-y-2 p-3 rounded-none bg-muted/30 border">
                <p className="text-xs font-semibold text-muted-foreground">⑥ {isRu ? 'Действие (CTA)' : 'Action (CTA)'}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={editingRoute.cta_text_en} onChange={e => updateField('cta_text_en', e.target.value)} placeholder="CTA EN" className="text-sm" />
                  <Input value={editingRoute.cta_text_ru} onChange={e => updateField('cta_text_ru', e.target.value)} placeholder="CTA RU" className="text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Type</Label>
                    <Select value={editingRoute.cta_type} onValueChange={v => updateField('cta_type', v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="navigate">Navigate</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="lead">Lead form</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px]">Target</Label>
                    <Input value={editingRoute.cta_target || ''} onChange={e => updateField('cta_target', e.target.value || null)} className="text-xs h-7" placeholder="/path or tel:..." />
                  </div>
                </div>
              </div>

              {/* Block 7: Next Routes */}
              <div className="space-y-2 p-3 rounded-none bg-muted/30 border">
                <p className="text-xs font-semibold text-muted-foreground">⑦ {isRu ? 'Далее (next routes)' : 'Next routes'}</p>
                <Textarea
                  rows={2}
                  value={(editingRoute.next_routes || []).join('\n')}
                  onChange={e => updateField('next_routes', e.target.value.split('\n').filter(Boolean))}
                  placeholder="life_situation codes, one per line"
                  className="text-xs font-mono"
                />
                <Textarea
                  rows={2}
                  value={(editingRoute.next_routes_labels_en || []).join('\n')}
                  onChange={e => updateField('next_routes_labels_en', e.target.value.split('\n').filter(Boolean))}
                  placeholder="Labels EN, one per line"
                  className="text-xs"
                />
                <Textarea
                  rows={2}
                  value={(editingRoute.next_routes_labels_ru || []).join('\n')}
                  onChange={e => updateField('next_routes_labels_ru', e.target.value.split('\n').filter(Boolean))}
                  placeholder="Labels RU, one per line"
                  className="text-xs"
                />
              </div>

              {/* Save */}
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                <Save className="w-4 h-4" />
                {saving ? (isRu ? 'Сохранение...' : 'Saving...') : (isRu ? 'Сохранить маршрут' : 'Save route')}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
