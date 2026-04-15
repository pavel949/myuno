/**
 * AI Offer Generator Modal
 * Generates multilingual property offers for deals via Claude API.
 */
import { useState } from 'react';
import { Sparkles, Copy, Check, Send, RefreshCw, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useGenerateOffer,
  OfferLanguage,
  OfferDealType,
  OfferTone,
  OfferLength,
  OfferChannel,
  OfferGeneratorInput,
} from '@/hooks/useOfferGenerator';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: {
    id: string;
    client_name?: string | null;
    client_phone?: string | null;
    client_email?: string | null;
    deal_type?: string | null;
    budget_min?: number | null;
    budget_max?: number | null;
    currency?: string | null;
    preferred_districts?: string[] | null;
    preferred_types?: string[] | null;
    bedrooms_min?: number | null;
    notes?: string | null;
  };
}

const DEAL_TYPE_MAP: Record<string, OfferDealType> = {
  sale: 'secondary',
  rent: 'ltr',
  investment: 'new_project',
  management: 'str',
};

export function OfferGeneratorModal({ open, onOpenChange, deal }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const generateOffer = useGenerateOffer();

  const [offerLang, setOfferLang] = useState<OfferLanguage>('ru');
  const [dealType, setDealType] = useState<OfferDealType>(
    DEAL_TYPE_MAP[deal.deal_type || 'sale'] || 'secondary'
  );
  const [tone, setTone] = useState<OfferTone>('professional');
  const [length, setLength] = useState<OfferLength>('medium');
  const [channel, setChannel] = useState<OfferChannel>('whatsapp');
  const [projectName, setProjectName] = useState('');
  const [projectROI, setProjectROI] = useState('');
  const [projectCompletion, setProjectCompletion] = useState('');
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ offerText: string; subject?: string } | null>(null);

  const handleGenerate = async () => {
    const input: OfferGeneratorInput = {
      dealId: deal.id,
      language: offerLang,
      dealType,
      tone,
      length,
      channel,
      clientName: deal.client_name || 'Client',
      clientPhone: deal.client_phone,
      clientEmail: deal.client_email,
      budgetMin: deal.budget_min,
      budgetMax: deal.budget_max,
      currency: deal.currency,
      preferredDistricts: deal.preferred_districts,
      preferredTypes: deal.preferred_types,
      bedroomsMin: deal.bedrooms_min,
      notes: deal.notes,
      ...(dealType === 'new_project' && {
        projectName: projectName || undefined,
        projectROI: projectROI ? Number(projectROI) : undefined,
        projectCompletion: projectCompletion || undefined,
      }),
    };
    const res = await generateOffer.mutateAsync(input);
    setResult(res);
  };

  const handleCopy = async () => {
    if (!result?.offerText) return;
    await navigator.clipboard.writeText(result.offerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!result?.offerText || !deal.client_phone) return;
    const phone = deal.client_phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(result.offerText);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const isLoading = generateOffer.isPending;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isRu ? 'AI Генератор предложений' : 'AI Offer Generator'}
      size="lg"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            {isRu ? 'Закрыть' : 'Close'}
          </Button>
          {result && (
            <>
              <Button variant="outline" onClick={handleCopy} className="gap-1">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? (isRu ? 'Скопировано' : 'Copied!') : (isRu ? 'Копировать' : 'Copy')}
              </Button>
              {channel === 'whatsapp' && deal.client_phone && (
                <Button variant="outline" onClick={handleOpenWhatsApp} className="gap-1 text-success border-success/30">
                  <Send className="h-4 w-4" />
                  WhatsApp
                </Button>
              )}
            </>
          )}
          <Button onClick={result ? handleGenerate : handleGenerate} disabled={isLoading} className="gap-1">
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {result
              ? (isRu ? 'Перегенерировать' : 'Regenerate')
              : (isRu ? 'Генерировать' : 'Generate')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Settings row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">{isRu ? 'Язык' : 'Language'}</Label>
            <Select value={offerLang} onValueChange={v => setOfferLang(v as OfferLanguage)}>
              <SelectTrigger className="mt-1">
                <Globe className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{isRu ? 'Тип сделки' : 'Deal Type'}</Label>
            <Select value={dealType} onValueChange={v => setDealType(v as OfferDealType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new_project">{isRu ? 'Новый проект' : 'New Project'}</SelectItem>
                <SelectItem value="secondary">{isRu ? 'Вторичный рынок' : 'Secondary Market'}</SelectItem>
                <SelectItem value="str">{isRu ? 'Краткосрочная аренда' : 'Short-term Rental'}</SelectItem>
                <SelectItem value="ltr">{isRu ? 'Долгосрочная аренда' : 'Long-term Rental'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{isRu ? 'Стиль' : 'Tone'}</Label>
            <Select value={tone} onValueChange={v => setTone(v as OfferTone)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">{isRu ? 'Профессиональный' : 'Professional'}</SelectItem>
                <SelectItem value="friendly">{isRu ? 'Дружеский' : 'Friendly'}</SelectItem>
                <SelectItem value="luxury">{isRu ? 'Премиум' : 'Luxury'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{isRu ? 'Длина' : 'Length'}</Label>
            <Select value={length} onValueChange={v => setLength(v as OfferLength)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="short">{isRu ? 'Короткое (WhatsApp)' : 'Short (WhatsApp)'}</SelectItem>
                <SelectItem value="medium">{isRu ? 'Среднее' : 'Medium'}</SelectItem>
                <SelectItem value="long">{isRu ? 'Подробное (email)' : 'Long (email)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Channel */}
        <div>
          <Label className="text-xs">{isRu ? 'Канал отправки' : 'Channel'}</Label>
          <div className="flex gap-2 mt-1">
            {(['whatsapp', 'email', 'sms'] as OfferChannel[]).map(ch => (
              <Button
                key={ch}
                variant={channel === ch ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChannel(ch)}
                className="capitalize"
              >
                {ch}
              </Button>
            ))}
          </div>
        </div>

        {/* NEW_PROJECT extra fields */}
        {dealType === 'new_project' && (
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-xs">{isRu ? 'Проект' : 'Project'}</Label>
              <Input
                className="mt-1 h-8 text-sm"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Laguna Beach..."
              />
            </div>
            <div>
              <Label className="text-xs">ROI %</Label>
              <Input
                type="number"
                className="mt-1 h-8 text-sm"
                value={projectROI}
                onChange={e => setProjectROI(e.target.value)}
                placeholder="7.5"
              />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Сдача' : 'Completion'}</Label>
              <Input
                className="mt-1 h-8 text-sm"
                value={projectCompletion}
                onChange={e => setProjectCompletion(e.target.value)}
                placeholder="Q4 2026"
              />
            </div>
          </div>
        )}

        {/* Client context summary */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            {isRu ? 'Клиент' : 'Client'}: {deal.client_name || '—'}
          </Badge>
          {deal.budget_max && (
            <Badge variant="secondary" className="text-[10px]">
              {isRu ? 'Бюджет' : 'Budget'}: {(deal.budget_max / 1e6).toFixed(1)}M {deal.currency || 'THB'}
            </Badge>
          )}
          {deal.preferred_districts?.map(d => (
            <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
          ))}
        </div>

        {/* Generated offer */}
        {result && (
          <div className="space-y-2">
            {result.subject && (
              <div className="text-xs">
                <span className="text-muted-foreground">{isRu ? 'Тема письма:' : 'Subject:'} </span>
                <span className="font-medium">{result.subject}</span>
              </div>
            )}
            <Textarea
              value={result.offerText}
              onChange={e => setResult(r => r ? { ...r, offerText: e.target.value } : null)}
              rows={12}
              className="font-mono text-sm resize-none"
              placeholder={isRu ? 'Здесь появится сгенерированное предложение...' : 'Generated offer will appear here...'}
            />
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Вы можете отредактировать текст перед отправкой' : 'You can edit the text before sending'}
            </p>
          </div>
        )}

        {!result && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {isRu
                ? 'Настройте параметры и нажмите "Генерировать"'
                : 'Configure settings and click "Generate"'}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
            <p className="text-sm">
              {isRu ? 'Генерируем предложение...' : 'Generating offer...'}
            </p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
