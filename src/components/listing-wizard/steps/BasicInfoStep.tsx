import React, { useState } from 'react';
import { Languages, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import type { ListingApplicationDraft } from '@/hooks/useListingApplication';

type SourceLang = 'en' | 'ru' | 'th';

interface BasicInfoStepProps {
  draft: ListingApplicationDraft;
  onChange: (updates: Partial<ListingApplicationDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const LANG_META: Record<SourceLang, { flag: string; label: string }> = {
  en: { flag: '🇬🇧', label: 'English' },
  ru: { flag: '🇷🇺', label: 'Русский' },
  th: { flag: '🇹🇭', label: 'ภาษาไทย' },
};

const TITLE_KEY: Record<SourceLang, keyof ListingApplicationDraft> = {
  en: 'title_en',
  ru: 'title_ru',
  th: 'title_th',
};
const DESC_KEY: Record<SourceLang, keyof ListingApplicationDraft> = {
  en: 'description_en',
  ru: 'description_ru',
  th: 'description_th',
};

export function BasicInfoStep({ draft, onChange, onNext, onBack }: BasicInfoStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { translateMultiple, isTranslating } = useAutoTranslate();

  const sourceLang: SourceLang = (draft.source_lang as SourceLang) ?? (language === 'ru' ? 'ru' : 'en');
  const titleKey = TITLE_KEY[sourceLang];
  const descKey = DESC_KEY[sourceLang];
  const sourceTitle = (draft[titleKey] as string) ?? '';
  const sourceDesc = (draft[descKey] as string) ?? '';

  const [hasTranslated, setHasTranslated] = useState(false);

  const placeholder = () => {
    if (draft.listing_type === 'property') {
      return isRu ? 'Например: Уютная вилла с бассейном' : 'e.g. Cozy villa with pool';
    }
    if (draft.listing_type === 'service') {
      return isRu ? 'Например: Профессиональный массаж' : 'e.g. Professional massage';
    }
    return isRu ? 'Например: Органическое кокосовое масло' : 'e.g. Organic coconut oil';
  };

  const setSourceLang = (lang: SourceLang) => {
    onChange({ source_lang: lang });
    setHasTranslated(false);
  };

  const handleAutoTranslate = async () => {
    if (!sourceTitle.trim()) return;
    const targets: SourceLang[] = (['en', 'ru', 'th'] as SourceLang[]).filter((l) => l !== sourceLang);

    const updates: Record<string, string> = {};
    for (const target of targets) {
      const fields: Record<string, string> = {};
      if (sourceTitle.trim()) fields.title = sourceTitle;
      if (sourceDesc.trim()) fields.description = sourceDesc;
      if (Object.keys(fields).length === 0) continue;
      const result = await translateMultiple(fields, target);
      if (result.title) updates[TITLE_KEY[target] as string] = result.title;
      if (result.description) updates[DESC_KEY[target] as string] = result.description;
    }
    onChange(updates as Partial<ListingApplicationDraft>);
    setHasTranslated(true);
  };


  const isValid = sourceTitle.length >= 5;

  return (
    <div className="space-y-6">
      {/* Source language selector */}
      <div className="space-y-2">
        <Label>{isRu ? 'Язык заполнения' : 'Input language'}</Label>
        <div className="flex gap-2">
          {(['en', 'ru', 'th'] as SourceLang[]).map((lang) => (
            <Button
              key={lang}
              type="button"
              size="sm"
              variant={sourceLang === lang ? 'default' : 'outline'}
              onClick={() => setSourceLang(lang)}
            >
              <span className="mr-2">{LANG_META[lang].flag}</span>
              {LANG_META[lang].label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {isRu
            ? 'Заполните на удобном языке — система переведёт автоматически на остальные.'
            : 'Fill in any language — the system will translate to the others automatically.'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source_title">
          {isRu ? 'Название' : 'Title'} ({LANG_META[sourceLang].label}) *
        </Label>
        <Input
          id="source_title"
          value={sourceTitle}
          onChange={(e) => onChange({ [titleKey]: e.target.value } as Partial<ListingApplicationDraft>)}
          placeholder={placeholder()}
          dir={sourceLang === 'th' ? 'ltr' : 'auto'}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="source_desc">
          {isRu ? 'Описание' : 'Description'} ({LANG_META[sourceLang].label})
        </Label>
        <Textarea
          id="source_desc"
          value={sourceDesc}
          onChange={(e) => onChange({ [descKey]: e.target.value } as Partial<ListingApplicationDraft>)}
          placeholder={isRu ? 'Расскажите подробнее...' : 'Tell us more...'}
          rows={4}
        />
      </div>

      {/* Auto-translate */}
      <div className="rounded-md border border-border bg-muted/40 p-3 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              {isRu
                ? 'AI-перевод на остальные языки'
                : 'AI translation to other languages'}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleAutoTranslate}
            disabled={!sourceTitle.trim() || isTranslating}
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isRu ? 'Перевожу...' : 'Translating...'}
              </>
            ) : (
              <>
                <Languages className="mr-2 h-4 w-4" />
                {isRu ? 'Перевести автоматически' : 'Auto-translate'}
              </>
            )}
          </Button>
        </div>

        {(['en', 'ru', 'th'] as SourceLang[])
          .filter((l) => l !== sourceLang)
          .map((lang) => {
            const t = (draft[TITLE_KEY[lang]] as string) ?? '';
            const d = (draft[DESC_KEY[lang]] as string) ?? '';
            return (
              <div key={lang} className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span>{LANG_META[lang].flag}</span>
                  <span className="font-medium">{LANG_META[lang].label}</span>
                  {t && (
                    <Badge variant="outline" className="text-xs">
                      <Languages className="mr-1 h-3 w-3" />
                      {isRu ? 'Автоперевод' : 'Auto'}
                    </Badge>
                  )}
                </div>
                <Input
                  value={t}
                  onChange={(e) =>
                    onChange({ [TITLE_KEY[lang]]: e.target.value } as Partial<ListingApplicationDraft>)
                  }
                  placeholder={isRu ? 'Будет заполнено автоматически' : 'Will be filled automatically'}
                  className="bg-background"
                />
                <Textarea
                  value={d}
                  onChange={(e) =>
                    onChange({ [DESC_KEY[lang]]: e.target.value } as Partial<ListingApplicationDraft>)
                  }
                  placeholder={isRu ? 'Описание будет переведено' : 'Description will be translated'}
                  rows={2}
                  className="bg-background"
                />
              </div>
            );
          })}

        {hasTranslated && (
          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Проверьте переводы и при необходимости отредактируйте вручную.'
              : 'Review the translations and edit if needed.'}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {isRu ? 'Назад' : 'Back'}
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={!isValid}>
          {isRu ? 'Продолжить' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
