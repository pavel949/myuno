/**
 * LifeOS Situations Registry Tab
 * Per LIFE OS Contract: code is immutable, no physical delete (soft disable only)
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminLifeSituations, LifeSituation } from '@/hooks/useLifeOS';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Plus, Lock, Eye, EyeOff, Save } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { cn } from '@/lib/utils';

function hslToHex(hslString: string): string | null {
  const match = hslString.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) return null;
  const h = Number(match[1]);
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getPrimaryHexColor(): string {
  const defaultPrimary = hslToHex('224 55% 32%')!;
  if (typeof window === 'undefined') return defaultPrimary;
  const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary');
  return hslToHex(primary) ?? defaultPrimary;
}

export function LifeOSSituationsTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const queryClient = useQueryClient();
  const { data: situations, isLoading } = useAdminLifeSituations();
  
  const [editingSituation, setEditingSituation] = useState<LifeSituation | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSituation, setNewSituation] = useState({
    code: '',
    title_en: '',
    title_ru: '',
    description_en: '',
    description_ru: '',
    icon: 'Compass',
    color: getPrimaryHexColor(),
    priority: 100,
  });


  const handleToggleActive = async (situation: LifeSituation) => {
    const { error } = await supabase
      .from('life_situations')
      .update({ is_active: !situation.is_active })
      .eq('id', situation.id);

    if (error) {
      toast.error(isRussian ? 'Ошибка обновления' : 'Failed to update');
      return;
    }

    toast.success(situation.is_active 
      ? (isRussian ? 'Ситуация скрыта' : 'Situation hidden')
      : (isRussian ? 'Ситуация активна' : 'Situation activated')
    );
    queryClient.invalidateQueries({ queryKey: ['admin-life-situations'] });
  };

  const handleCreate = async () => {
    if (!newSituation.code || !newSituation.title_en || !newSituation.title_ru) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Fill required fields');
      return;
    }

    const { error } = await supabase.from('life_situations').insert({
      code: newSituation.code.toLowerCase().replace(/\s+/g, '_'),
      title_en: newSituation.title_en,
      title_ru: newSituation.title_ru,
      description_en: newSituation.description_en || null,
      description_ru: newSituation.description_ru || null,
      icon: newSituation.icon,
      color: newSituation.color,
      priority: newSituation.priority,
      is_active: true,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error(isRussian ? 'Код уже существует' : 'Code already exists');
      } else {
        toast.error(isRussian ? 'Ошибка создания' : 'Failed to create');
      }
      return;
    }

    toast.success(isRussian ? 'Ситуация создана' : 'Situation created');
    setIsCreateOpen(false);
    setNewSituation({
      code: '',
      title_en: '',
      title_ru: '',
      description_en: '',
      description_ru: '',
      icon: 'Compass',
      color: getPrimaryHexColor(),
      priority: 100,
    });
    queryClient.invalidateQueries({ queryKey: ['admin-life-situations'] });
  };

  const handleUpdate = async () => {
    if (!editingSituation) return;

    const { error } = await supabase
      .from('life_situations')
      .update({
        title_en: editingSituation.title_en,
        title_ru: editingSituation.title_ru,
        description_en: editingSituation.description_en,
        description_ru: editingSituation.description_ru,
        icon: editingSituation.icon,
        color: editingSituation.color,
        priority: editingSituation.priority,
      })
      .eq('id', editingSituation.id);

    if (error) {
      toast.error(isRussian ? 'Ошибка сохранения' : 'Failed to save');
      return;
    }

    toast.success(isRussian ? 'Изменения сохранены' : 'Changes saved');
    setEditingSituation(null);
    queryClient.invalidateQueries({ queryKey: ['admin-life-situations'] });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isRussian 
            ? 'Реестр жизненных ситуаций. Код неизменяем после создания.' 
            : 'Life situation registry. Code is immutable after creation.'}
        </p>
        <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {isRussian ? 'Создать' : 'Create'}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{isRussian ? 'Новая ситуация' : 'New Situation'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input 
                  placeholder="e.g. first_day_arrival"
                  value={newSituation.code}
                  onChange={(e) => setNewSituation(s => ({ ...s, code: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Системный код (неизменяемый)' : 'System code (immutable)'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Title EN *</Label>
                  <Input 
                    value={newSituation.title_en}
                    onChange={(e) => setNewSituation(s => ({ ...s, title_en: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title RU *</Label>
                  <Input 
                    value={newSituation.title_ru}
                    onChange={(e) => setNewSituation(s => ({ ...s, title_ru: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description EN</Label>
                <Textarea 
                  value={newSituation.description_en}
                  onChange={(e) => setNewSituation(s => ({ ...s, description_en: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description RU</Label>
                <Textarea 
                  value={newSituation.description_ru}
                  onChange={(e) => setNewSituation(s => ({ ...s, description_ru: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Input 
                    placeholder="Compass"
                    value={newSituation.icon}
                    onChange={(e) => setNewSituation(s => ({ ...s, icon: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input 
                    type="color"
                    value={newSituation.color}
                    onChange={(e) => setNewSituation(s => ({ ...s, color: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input 
                  type="number"
                  value={newSituation.priority}
                  onChange={(e) => setNewSituation(s => ({ ...s, priority: Number(e.target.value) }))}
                />
              </div>
              <Button className="w-full" onClick={handleCreate}>
                {isRussian ? 'Создать ситуацию' : 'Create Situation'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Situations Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {situations?.map((situation) => {
            const isEditing = editingSituation?.id === situation.id;

            return (
              <Card 
                key={situation.id} 
                className={cn(
                  "transition-all",
                  !situation.is_active && "opacity-60",
                  isEditing && "ring-2 ring-primary"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${situation.color}20` }}
                    >
                      <DynamicIcon name={situation.icon} className="w-6 h-6" style={{ color: situation.color }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={situation.is_active ? 'default' : 'secondary'}>
                        {situation.is_active 
                          ? (isRussian ? 'Активна' : 'Active') 
                          : (isRussian ? 'Скрыта' : 'Hidden')
                        }
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <>
                      <Input 
                        value={editingSituation.title_en}
                        onChange={(e) => setEditingSituation(s => s ? { ...s, title_en: e.target.value } : null)}
                        placeholder="Title EN"
                        className="text-sm"
                      />
                      <Input 
                        value={editingSituation.title_ru}
                        onChange={(e) => setEditingSituation(s => s ? { ...s, title_ru: e.target.value } : null)}
                        placeholder="Title RU"
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdate}>
                          <Save className="w-4 h-4 mr-1" />
                          {isRussian ? 'Сохранить' : 'Save'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingSituation(null)}>
                          {isRussian ? 'Отмена' : 'Cancel'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <CardTitle className="text-base">
                          {isRussian ? situation.title_ru : situation.title_en}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                          <code className="text-xs text-muted-foreground">{situation.code}</code>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {isRussian ? situation.description_ru : situation.description_en}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingSituation(situation)}
                        >
                          {isRussian ? 'Редактировать' : 'Edit'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(situation)}
                        >
                          {situation.is_active ? (
                            <><EyeOff className="w-4 h-4 mr-1" /> {isRussian ? 'Скрыть' : 'Hide'}</>
                          ) : (
                            <><Eye className="w-4 h-4 mr-1" /> {isRussian ? 'Показать' : 'Show'}</>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
