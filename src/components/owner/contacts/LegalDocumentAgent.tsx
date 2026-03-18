/**
 * LegalDocumentAgent — AI-powered legal document generator for CRM.
 * Supports both "generate from scratch" and "template-based" modes.
 */
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Scale, FileText, Sparkles, Loader2, Copy, Download, Languages } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface Props {
  contactId?: string;
  dealId?: string;
  propertyId?: string;
  companyId?: string;
}

const DOCUMENT_TYPES = [
  { value: 'rental_agreement', en: 'Rental Agreement', ru: 'Договор аренды' },
  { value: 'sale_contract', en: 'Sale & Purchase Agreement', ru: 'Договор купли-продажи' },
  { value: 'agency_agreement', en: 'Agency Agreement', ru: 'Агентский договор' },
  { value: 'management_contract', en: 'Property Management Contract', ru: 'Договор управления' },
  { value: 'power_of_attorney', en: 'Power of Attorney', ru: 'Доверенность' },
  { value: 'nda', en: 'Non-Disclosure Agreement', ru: 'Соглашение о конфиденциальности' },
  { value: 'commission_agreement', en: 'Commission Agreement', ru: 'Договор комиссии' },
  { value: 'service_agreement', en: 'Service Agreement', ru: 'Договор оказания услуг' },
  { value: 'lease_extension', en: 'Lease Extension', ru: 'Продление аренды' },
  { value: 'termination_notice', en: 'Termination Notice', ru: 'Уведомление о расторжении' },
  { value: 'deposit_agreement', en: 'Deposit Agreement', ru: 'Договор задатка' },
  { value: 'act_of_acceptance', en: 'Act of Acceptance', ru: 'Акт приёма-передачи' },
];

type Mode = 'generate' | 'template';

export function LegalDocumentAgent({ contactId, dealId, propertyId, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [mode, setMode] = useState<Mode>('generate');
  const [docType, setDocType] = useState('rental_agreement');
  const [docLang, setDocLang] = useState<'ru' | 'en'>(isRu ? 'ru' : 'en');
  const [instructions, setInstructions] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('legal-document-agent', {
        body: {
          mode,
          document_type: docType,
          language: docLang,
          contact_id: contactId,
          deal_id: dealId,
          property_id: propertyId,
          company_id: companyId,
          custom_instructions: instructions || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setResult(data?.document || 'No result');
    } catch (e: any) {
      toast.error(isRu ? 'Ошибка генерации документа' : 'Document generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast.success(isRu ? 'Скопировано' : 'Copied');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType}_${docLang}_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          {isRu ? 'AI Юридический агент' : 'AI Legal Agent'}
          <Badge variant="secondary" className="text-[10px]">AI</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'generate' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => setMode('generate')}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {isRu ? 'С нуля' : 'From Scratch'}
          </Button>
          <Button
            variant={mode === 'template' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => setMode('template')}
          >
            <FileText className="h-3 w-3 mr-1" />
            {isRu ? 'По шаблону' : 'From Template'}
          </Button>
        </div>

        {/* Document Type */}
        <div>
          <Label className="text-xs">{isRu ? 'Тип документа' : 'Document Type'}</Label>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map(dt => (
                <SelectItem key={dt.value} value={dt.value} className="text-xs">
                  {isRu ? dt.ru : dt.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div>
          <Label className="text-xs flex items-center gap-1">
            <Languages className="h-3 w-3" />
            {isRu ? 'Язык документа' : 'Document Language'}
          </Label>
          <div className="flex gap-2 mt-1">
            <Button
              variant={docLang === 'ru' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs h-7"
              onClick={() => setDocLang('ru')}
            >
              🇷🇺 Русский
            </Button>
            <Button
              variant={docLang === 'en' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs h-7"
              onClick={() => setDocLang('en')}
            >
              🇬🇧 English
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <Label className="text-xs">{isRu ? 'Дополнительные инструкции' : 'Additional Instructions'}</Label>
          <Textarea
            className="text-xs min-h-[60px] mt-1"
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder={isRu
              ? 'Укажите особые условия, сроки, суммы...'
              : 'Specify special conditions, terms, amounts...'}
          />
        </div>

        {/* Context info */}
        <div className="flex flex-wrap gap-1">
          {contactId && <Badge variant="outline" className="text-[10px]">👤 {isRu ? 'Контакт' : 'Contact'}</Badge>}
          {dealId && <Badge variant="outline" className="text-[10px]">💰 {isRu ? 'Сделка' : 'Deal'}</Badge>}
          {propertyId && <Badge variant="outline" className="text-[10px]">🏠 {isRu ? 'Объект' : 'Property'}</Badge>}
        </div>

        {/* Generate */}
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              {isRu ? 'Генерация...' : 'Generating...'}
            </>
          ) : (
            <>
              <Scale className="h-3.5 w-3.5 mr-1.5" />
              {isRu ? 'Сгенерировать документ' : 'Generate Document'}
            </>
          )}
        </Button>

        {/* Result */}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopy}>
                <Copy className="h-3 w-3 mr-1" /> {isRu ? 'Копировать' : 'Copy'}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleDownload}>
                <Download className="h-3 w-3 mr-1" /> .md
              </Button>
            </div>
            <div className="bg-card border rounded-lg p-4 max-h-[500px] overflow-y-auto prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
