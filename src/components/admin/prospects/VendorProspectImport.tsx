import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateProspect, useBatchImport, useAnalyzeUrl } from '@/hooks/useVendorAcquisition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Bot, Loader2, Instagram, MapPin, Globe } from 'lucide-react';

export function VendorProspectImport() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { toast } = useToast();
  
  const createProspect = useCreateProspect();
  const batchImport = useBatchImport();
  const analyzeUrl = useAnalyzeUrl();

  const [importMode, setImportMode] = useState<'manual' | 'url' | 'batch'>('manual');
  const [isLoading, setIsLoading] = useState(false);

  // Manual form state
  const [manualForm, setManualForm] = useState({
    business_name: '',
    business_type: '',
    phone: '',
    email: '',
    instagram: '',
    website: '',
    district: '',
    source_type: 'manual' as const
  });

  // URL import state
  const [urlInput, setUrlInput] = useState('');

  // Batch import state
  const [batchInput, setBatchInput] = useState('');

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.business_name.trim()) {
      toast({ title: isRussian ? 'Укажите название' : 'Name required', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await createProspect.mutateAsync(manualForm);
      toast({ title: isRussian ? 'Лид добавлен' : 'Lead added' });
      setManualForm({
        business_name: '',
        business_type: '',
        phone: '',
        email: '',
        instagram: '',
        website: '',
        district: '',
        source_type: 'manual'
      });
    } catch (error) {
      toast({ title: isRussian ? 'Ошибка' : 'Error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      toast({ title: isRussian ? 'Укажите URL' : 'URL required', variant: 'destructive' });
      return;
    }

    // Detect source type from URL
    let sourceType = 'manual';
    if (urlInput.includes('instagram.com')) sourceType = 'instagram';
    else if (urlInput.includes('facebook.com')) sourceType = 'facebook';
    else if (urlInput.includes('google.com/maps') || urlInput.includes('goo.gl/maps')) sourceType = 'google_maps';

    setIsLoading(true);
    try {
      await analyzeUrl.mutateAsync({ url: urlInput, sourceType });
      toast({ title: isRussian ? 'Данные извлечены' : 'Data extracted' });
      setUrlInput('');
    } catch (error) {
      toast({ title: isRussian ? 'Ошибка анализа' : 'Analysis failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchImport = async () => {
    if (!batchInput.trim()) {
      toast({ title: isRussian ? 'Введите данные' : 'Data required', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Parse CSV-like input
      const lines = batchInput.trim().split('\n');
      const prospects = lines.map(line => {
        const [name, category, phone, location] = line.split(',').map(s => s.trim());
        return {
          business_name: name || '',
          business_type: category || '',
          phone: phone || '',
          district: location || '',
          source_type: 'manual' as const
        };
      }).filter(p => p.business_name);

      await batchImport.mutateAsync({ prospects });
      toast({ title: isRussian ? `Импортировано: ${prospects.length}` : `Imported: ${prospects.length}` });
      setBatchInput('');
    } catch (error) {
      toast({ title: isRussian ? 'Ошибка импорта' : 'Import failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Manual Import */}
      <Card className={importMode === 'manual' ? 'ring-2 ring-primary' : ''}>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setImportMode('manual')}
        >
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {isRussian ? 'Ручной ввод' : 'Manual Entry'}
          </CardTitle>
          <CardDescription>
            {isRussian ? 'Добавить одного вендора' : 'Add a single vendor'}
          </CardDescription>
        </CardHeader>
        {importMode === 'manual' && (
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <Label className="text-xs">{isRussian ? 'Название *' : 'Name *'}</Label>
                <Input
                  value={manualForm.business_name}
                  onChange={(e) => setManualForm(f => ({ ...f, business_name: e.target.value }))}
                  placeholder="Beach Club Phuket"
                />
              </div>
              <div>
                <Label className="text-xs">{isRussian ? 'Тип бизнеса' : 'Business Type'}</Label>
                <Select
                  value={manualForm.business_type}
                  onValueChange={(v) => setManualForm(f => ({ ...f, business_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRussian ? 'Выберите' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurants">Restaurants</SelectItem>
                    <SelectItem value="beauty">Beauty & Spa</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="tours">Tours & Activities</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{isRussian ? 'Телефон' : 'Phone'}</Label>
                  <Input
                    value={manualForm.phone}
                    onChange={(e) => setManualForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+66..."
                  />
                </div>
                <div>
                  <Label className="text-xs">Instagram</Label>
                  <Input
                    value={manualForm.instagram}
                    onChange={(e) => setManualForm(f => ({ ...f, instagram: e.target.value }))}
                    placeholder="@handle"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">{isRussian ? 'Район' : 'District'}</Label>
                <Input
                  value={manualForm.district}
                  onChange={(e) => setManualForm(f => ({ ...f, district: e.target.value }))}
                  placeholder="Patong"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  isRussian ? 'Добавить' : 'Add Lead'
                )}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* URL Import */}
      <Card className={importMode === 'url' ? 'ring-2 ring-primary' : ''}>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setImportMode('url')}
        >
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4" />
            {isRussian ? 'AI из URL' : 'AI from URL'}
          </CardTitle>
          <CardDescription>
            {isRussian ? 'Извлечь данные из ссылки' : 'Extract data from link'}
          </CardDescription>
        </CardHeader>
        {importMode === 'url' && (
          <CardContent className="space-y-3">
            <div className="flex gap-2 text-xs text-muted-foreground">
              <Instagram className="h-4 w-4" />
              <MapPin className="h-4 w-4" />
              <Globe className="h-4 w-4" />
              <span>{isRussian ? 'Instagram, Google Maps, сайты' : 'Instagram, Google Maps, websites'}</span>
            </div>
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://instagram.com/..."
            />
            <Button 
              className="w-full" 
              onClick={handleUrlImport}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  {isRussian ? 'Анализировать' : 'Analyze'}
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Batch Import */}
      <Card className={importMode === 'batch' ? 'ring-2 ring-primary' : ''}>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setImportMode('batch')}
        >
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {isRussian ? 'Массовый импорт' : 'Batch Import'}
          </CardTitle>
          <CardDescription>
            {isRussian ? 'Импорт из CSV/текста' : 'Import from CSV/text'}
          </CardDescription>
        </CardHeader>
        {importMode === 'batch' && (
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground">
              {isRussian 
                ? 'Формат: Название, Категория, Телефон, Район' 
                : 'Format: Name, Category, Phone, District'}
            </div>
            <Textarea
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              placeholder={`Beach Club, restaurants, +66123456789, Patong
Spa Center, beauty, +66987654321, Kata`}
              rows={5}
            />
            <Button 
              className="w-full" 
              onClick={handleBatchImport}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {isRussian ? 'Импортировать' : 'Import'}
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
