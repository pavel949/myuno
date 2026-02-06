import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, AlertCircle } from 'lucide-react';
import type { VariantContent } from '@/hooks/useABVariants';
import { cn } from '@/lib/utils';

interface ABVariantEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (variantA: VariantContent, variantB: VariantContent) => void;
  initialA?: VariantContent;
  initialB?: VariantContent;
  isLoading?: boolean;
}

const EMPTY_VARIANT: VariantContent = {
  headline_en: '',
  headline_ru: '',
  subheadline_en: '',
  subheadline_ru: '',
  cta_label_en: '',
  cta_label_ru: '',
};

const MAX_HEADLINE = 80;
const MAX_SUBHEADLINE = 160;
const MAX_CTA = 30;

function VariantFields({
  variant,
  onChange,
  label,
}: {
  variant: VariantContent;
  onChange: (v: VariantContent) => void;
  label: string;
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const errors: string[] = [];
  if (!variant.headline_en.trim()) errors.push(isRu ? 'Заголовок EN обязателен' : 'Headline EN required');
  if (variant.headline_en.length > MAX_HEADLINE) errors.push(`Headline EN > ${MAX_HEADLINE}`);
  if (variant.subheadline_en.length > MAX_SUBHEADLINE) errors.push(`Subheadline EN > ${MAX_SUBHEADLINE}`);
  if (variant.cta_label_en.length > MAX_CTA) errors.push(`CTA EN > ${MAX_CTA}`);

  return (
    <div className="space-y-4">
      <Badge variant="outline" className="text-xs mb-2">{label}</Badge>

      {/* EN fields */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs">{isRu ? 'Заголовок (EN)' : 'Headline (EN)'} *</Label>
          <Input
            value={variant.headline_en}
            onChange={e => onChange({ ...variant, headline_en: e.target.value })}
            placeholder="Your adventure starts here"
            className="mt-1"
          />
          <span className={cn("text-[10px]", variant.headline_en.length > MAX_HEADLINE ? "text-destructive" : "text-muted-foreground")}>
            {variant.headline_en.length}/{MAX_HEADLINE}
          </span>
        </div>
        <div>
          <Label className="text-xs">{isRu ? 'Подзаголовок (EN)' : 'Subheadline (EN)'}</Label>
          <Input
            value={variant.subheadline_en}
            onChange={e => onChange({ ...variant, subheadline_en: e.target.value })}
            placeholder="Premium services in Phuket"
            className="mt-1"
          />
          <span className={cn("text-[10px]", variant.subheadline_en.length > MAX_SUBHEADLINE ? "text-destructive" : "text-muted-foreground")}>
            {variant.subheadline_en.length}/{MAX_SUBHEADLINE}
          </span>
        </div>
        <div>
          <Label className="text-xs">{isRu ? 'CTA кнопка (EN)' : 'CTA Label (EN)'}</Label>
          <Input
            value={variant.cta_label_en}
            onChange={e => onChange({ ...variant, cta_label_en: e.target.value })}
            placeholder="Get Started"
            className="mt-1"
          />
        </div>
      </div>

      {/* RU fields */}
      <div className="space-y-3 border-t pt-3">
        <div>
          <Label className="text-xs">{isRu ? 'Заголовок (RU)' : 'Headline (RU)'}</Label>
          <Input
            value={variant.headline_ru}
            onChange={e => onChange({ ...variant, headline_ru: e.target.value })}
            placeholder="Ваше приключение начинается здесь"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">{isRu ? 'Подзаголовок (RU)' : 'Subheadline (RU)'}</Label>
          <Input
            value={variant.subheadline_ru}
            onChange={e => onChange({ ...variant, subheadline_ru: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">{isRu ? 'CTA кнопка (RU)' : 'CTA Label (RU)'}</Label>
          <Input
            value={variant.cta_label_ru}
            onChange={e => onChange({ ...variant, cta_label_ru: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      {errors.length > 0 && (
        <div className="flex items-start gap-1.5 text-destructive text-xs">
          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{errors.join('; ')}</span>
        </div>
      )}
    </div>
  );
}

function HeroPreview({
  variant,
  device,
}: {
  variant: VariantContent;
  device: 'desktop' | 'mobile';
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const headline = isRu ? (variant.headline_ru || variant.headline_en) : variant.headline_en;
  const sub = isRu ? (variant.subheadline_ru || variant.subheadline_en) : variant.subheadline_en;
  const cta = isRu ? (variant.cta_label_ru || variant.cta_label_en) : variant.cta_label_en;

  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border flex flex-col items-center justify-center text-center p-6",
        device === 'mobile' ? 'w-[240px] h-[380px]' : 'w-full h-[200px]'
      )}
    >
      <h2 className={cn("font-bold text-foreground leading-tight", device === 'mobile' ? 'text-lg' : 'text-2xl')}>
        {headline || '—'}
      </h2>
      <p className={cn("text-muted-foreground mt-2", device === 'mobile' ? 'text-xs' : 'text-sm')}>
        {sub || '—'}
      </p>
      {cta && (
        <div className="mt-4">
          <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
            {cta}
          </span>
        </div>
      )}
    </div>
  );
}

export function ABVariantEditorModal({
  open,
  onClose,
  onSave,
  initialA,
  initialB,
  isLoading,
}: ABVariantEditorModalProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [variantA, setVariantA] = useState<VariantContent>(initialA || EMPTY_VARIANT);
  const [variantB, setVariantB] = useState<VariantContent>(initialB || EMPTY_VARIANT);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewVariant, setPreviewVariant] = useState<'A' | 'B'>('A');

  useEffect(() => {
    if (open) {
      setVariantA(initialA || EMPTY_VARIANT);
      setVariantB(initialB || EMPTY_VARIANT);
    }
  }, [open, initialA, initialB]);

  const isValid = variantA.headline_en.trim().length > 0 && variantA.headline_en.length <= MAX_HEADLINE;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isRu ? 'Редактор A/B вариантов' : 'A/B Variant Editor'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Fields */}
          <div className="space-y-6">
            <Tabs defaultValue="A">
              <TabsList className="w-full">
                <TabsTrigger value="A" className="flex-1">Variant A</TabsTrigger>
                <TabsTrigger value="B" className="flex-1">Variant B</TabsTrigger>
              </TabsList>
              <TabsContent value="A" className="mt-4">
                <VariantFields variant={variantA} onChange={setVariantA} label="Variant A (Control)" />
              </TabsContent>
              <TabsContent value="B" className="mt-4">
                <VariantFields variant={variantB} onChange={setVariantB} label="Variant B (Test)" />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{isRu ? 'Предпросмотр' : 'Live Preview'}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant={previewVariant === 'A' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPreviewVariant('A')}
                >
                  A
                </Button>
                <Button
                  variant={previewVariant === 'B' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPreviewVariant('B')}
                >
                  B
                </Button>
                <div className="border-l pl-2 flex gap-1">
                  <Button
                    variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPreviewDevice('desktop')}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPreviewDevice('mobile')}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <HeroPreview
                variant={previewVariant === 'A' ? variantA : variantB}
                device={previewDevice}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button
            onClick={() => onSave(variantA, variantB)}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (isRu ? 'Сохранение...' : 'Saving...') : (isRu ? 'Сохранить' : 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
