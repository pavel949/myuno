import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Sparkles } from 'lucide-react';
import { Translation } from '@/hooks/useTranslationsAdmin';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';

interface TranslationEditorProps {
  onSave: (translation: Omit<Translation, 'id' | 'updated_at' | 'updated_by' | 'is_custom'>) => Promise<boolean>;
  existingCategories: string[];
}

export function TranslationEditor({ onSave, existingCategories }: TranslationEditorProps) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [category, setCategory] = useState('');
  const [valueRu, setValueRu] = useState('');
  const [valueEn, setValueEn] = useState('');
  const [valueTh, setValueTh] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { translate, isTranslating } = useAutoTranslate();

  const reset = () => {
    setKey('');
    setCategory('');
    setValueRu('');
    setValueEn('');
    setValueTh('');
  };

  const handleSave = async () => {
    if (!key.trim() || !valueRu.trim() || !valueEn.trim()) {
      return;
    }

    setIsSaving(true);
    const success = await onSave({
      key: key.trim(),
      category: category.trim() || null,
      value_ru: valueRu.trim(),
      value_en: valueEn.trim(),
      value_th: valueTh.trim() || null,
    });

    if (success) {
      reset();
      setOpen(false);
    }
    setIsSaving(false);
  };

  const handleAutoTranslate = async (source: string, targetLang: 'ru' | 'en') => {
    const result = await translate(source, targetLang);
    if (result.success) {
      if (targetLang === 'ru') {
        setValueRu(result.translated);
      } else {
        setValueEn(result.translated);
      }
    }
  };

  // Auto-detect category from key
  const handleKeyChange = (value: string) => {
    setKey(value);
    const parts = value.split('.');
    if (parts.length > 1 && !category) {
      setCategory(parts[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Добавить перевод
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый перевод</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key">Ключ *</Label>
              <Input
                id="key"
                placeholder="nav.home"
                value={key}
                onChange={(e) => handleKeyChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Input
                id="category"
                placeholder="nav"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="categories"
              />
              <datalist id="categories">
                {existingCategories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="valueRu">Русский *</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                disabled={isTranslating || !valueEn}
                onClick={() => handleAutoTranslate(valueEn, 'ru')}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                AI из EN
              </Button>
            </div>
            <Textarea
              id="valueRu"
              placeholder="Главная"
              value={valueRu}
              onChange={(e) => setValueRu(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="valueEn">English *</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                disabled={isTranslating || !valueRu}
                onClick={() => handleAutoTranslate(valueRu, 'en')}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                AI из RU
              </Button>
            </div>
            <Textarea
              id="valueEn"
              placeholder="Home"
              value={valueEn}
              onChange={(e) => setValueEn(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valueTh">ภาษาไทย (опционально)</Label>
            <Textarea
              id="valueTh"
              placeholder="หน้าแรก"
              value={valueTh}
              onChange={(e) => setValueTh(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!key.trim() || !valueRu.trim() || !valueEn.trim() || isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
