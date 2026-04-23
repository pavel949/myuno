import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntakeAgent } from '@/hooks/useIntakeAgent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, Loader2, Wand2, Upload, Globe, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface AIIntakePanelProps {
  onDataExtracted: (data: Record<string, any>) => void;
}

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.heic';
const MAX_FILE_SIZE_MB = 20;

export function AIIntakePanel({ onDataExtracted }: AIIntakePanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { isProcessing, analyze } = useIntakeAgent();
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<Array<{ id: string; file: File; type: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles: Array<{ id: string; file: File; type: string }> = [];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(isRu ? `${file.name} слишком большой (макс ${MAX_FILE_SIZE_MB}MB)` : `${file.name} too large (max ${MAX_FILE_SIZE_MB}MB)`);
        continue;
      }
      newFiles.push({ id: `${Date.now()}-${i}`, file, type: file.type || 'application/octet-stream' });
    }
    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  };

  const handleParse = async () => {
    let options: Parameters<typeof analyze>[0];
    if (activeTab === 'text') {
      if (!text.trim()) { toast.error(isRu ? 'Введите описание объекта' : 'Enter property description'); return; }
      options = { mode: 'single', rawText: text, forceVertical: 'properties' };
    } else if (activeTab === 'url') {
      if (!url.trim()) { toast.error(isRu ? 'Введите URL' : 'Enter URL'); return; }
      options = { mode: 'bulk_urls', urls: [url.trim()], forceVertical: 'properties' };
    } else {
      if (files.length === 0) { toast.error(isRu ? 'Добавьте файлы' : 'Add files'); return; }
      options = { mode: 'files', files, forceVertical: 'properties' };
    }

    const result = await analyze(options);
    if (result && result.items.length > 0) {
      const item = result.items[0];
      const fields = item.extractedFields;
      const extractedData: Record<string, any> = {
        title: item.suggestedTitle?.en || fields.name_en?.value,
        title_ru: item.suggestedTitle?.ru || fields.name_ru?.value,
        description: item.suggestedDescription?.en || fields.description_en?.value,
        description_ru: item.suggestedDescription?.ru || fields.description_ru?.value,
        bedrooms: fields.bedrooms?.value, bathrooms: fields.bathrooms?.value,
        max_guests: fields.max_guests?.value,
        price_per_night: fields.price_per_night?.value?.toString(),
        district: fields.district?.value, address: fields.address?.value,
        property_type: fields.property_type?.value, area_sqm: fields.area_sqm?.value?.toString(),
      };
      onDataExtracted(extractedData);
      setText(''); setUrl(''); setFiles([]); setIsOpen(false);
      toast.success(isRu ? 'AI извлёк данные и заполнил форму!' : 'AI extracted data and filled the form!');
    }
  };

  const isSubmitDisabled = isProcessing || (
    activeTab === 'text' ? !text.trim() : activeTab === 'url' ? !url.trim() : files.length === 0
  );

  return (
    <>
      <Card className="border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setIsOpen(true)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10"><Bot className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium flex items-center gap-2">
                {isRu ? 'Быстрый ввод с AI' : 'Quick AI Input'}<Sparkles className="h-4 w-4 text-primary" />
              </p>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Текст, документы или ссылка — AI заполнит форму' : 'Text, documents or link — AI will fill the form'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ResponsiveModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={isRu ? 'Быстрый ввод с AI' : 'Quick AI Input'}
        description={isRu ? 'Вставьте текст, загрузите документы или укажите ссылку — AI заполнит форму' : 'Paste text, upload documents or enter a link — AI will fill the form'}
        icon={<Bot className="w-5 h-5 text-primary" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => { setText(''); setUrl(''); setFiles([]); setIsOpen(false); }}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleParse} disabled={isSubmitDisabled} className="gap-2">
              {isProcessing ? (<><Loader2 className="h-4 w-4 animate-spin" />{isRu ? 'Анализ...' : 'Analyzing...'}</>) : (<><Wand2 className="h-4 w-4" />{isRu ? 'Заполнить форму' : 'Fill Form'}</>)}
            </Button>
          </div>
        }
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="gap-1.5 text-xs sm:text-sm"><FileText className="h-3.5 w-3.5" />{isRu ? 'Текст' : 'Text'}</TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5 text-xs sm:text-sm">
              <Upload className="h-3.5 w-3.5" />{isRu ? 'Документы' : 'Documents'}
              {files.length > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">{files.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-1.5 text-xs sm:text-sm"><Globe className="h-3.5 w-3.5" />URL</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-3">
            <Textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder={isRu ? 'Вставьте описание из WhatsApp, Airbnb, сайта или любого источника...' : 'Paste description from WhatsApp, Airbnb, website or any source...'}
              className="min-h-[160px] resize-none text-base" autoFocus />
          </TabsContent>

          <TabsContent value="files" className="mt-3 space-y-3">
            <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_FILE_TYPES} onChange={handleFilesSelected} className="hidden" />
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-none p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm font-medium">{isRu ? 'Нажмите для загрузки файлов' : 'Click to upload files'}</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, CSV, фото — {isRu ? 'до' : 'up to'} {MAX_FILE_SIZE_MB}MB</p>
            </div>
            {files.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 p-2 rounded-none bg-muted/50">
                    <span className="text-lg">{getFileIcon(f.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.file.name}</p>
                      <p className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeFile(f.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="mt-3 space-y-3">
            <Input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder={isRu ? 'https://airbnb.com/rooms/... или любой сайт' : 'https://airbnb.com/rooms/... or any website'}
              type="url" className="text-base" />
            <p className="text-xs text-muted-foreground">
              {isRu ? 'AI скачает информацию со страницы и заполнит форму автоматически' : 'AI will download info from the page and fill the form automatically'}
            </p>
          </TabsContent>
        </Tabs>
      </ResponsiveModal>
    </>
  );
}
