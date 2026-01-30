import React, { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useDataImport } from '@/hooks/useDataImport';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ImportTargetSelector } from '@/components/admin/data-import/ImportTargetSelector';
import { FileImporter } from '@/components/admin/data-import/FileImporter';
import { FieldMapper } from '@/components/admin/data-import/FieldMapper';
import { ImportPreview } from '@/components/admin/data-import/ImportPreview';
import { 
  Database, 
  Upload, 
  Link2, 
  Globe,
  CheckCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function AdminDataImport() {
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const {
    parsedData,
    fieldMappings,
    isLoading,
    importResult,
    parseFile,
    generateAutoMappings,
    setFieldMappings,
    updateMapping,
    transformData,
    importData,
    reset,
  } = useDataImport();

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('file');
  const [step, setStep] = useState<'select' | 'upload' | 'map' | 'preview' | 'done'>('select');

  // Handle target selection
  const handleTargetSelect = useCallback((targetId: string) => {
    setSelectedTarget(targetId);
    if (parsedData) {
      const autoMappings = generateAutoMappings(parsedData.headers, targetId);
      setFieldMappings(autoMappings);
    }
    setStep('upload');
  }, [parsedData, generateAutoMappings, setFieldMappings]);

  // Handle file parse
  const handleFileSelect = useCallback(async (file: File) => {
    const data = await parseFile(file);
    if (data && selectedTarget) {
      const autoMappings = generateAutoMappings(data.headers, selectedTarget);
      setFieldMappings(autoMappings);
      setStep('map');
    }
    return data;
  }, [parseFile, selectedTarget, generateAutoMappings, setFieldMappings]);

  // Handle auto-mapping
  const handleAutoMap = useCallback(() => {
    if (parsedData && selectedTarget) {
      const autoMappings = generateAutoMappings(parsedData.headers, selectedTarget);
      setFieldMappings(autoMappings);
    }
  }, [parsedData, selectedTarget, generateAutoMappings, setFieldMappings]);

  // Transform data based on current mappings
  const transformedData = useMemo(() => {
    if (!parsedData) return [];
    return transformData(parsedData, fieldMappings);
  }, [parsedData, fieldMappings, transformData]);

  // Handle import
  const handleImport = useCallback(async (selectedIndices?: number[]) => {
    if (!selectedTarget) return;
    await importData(selectedTarget, transformedData, selectedIndices);
    setStep('done');
  }, [selectedTarget, transformedData, importData]);

  // Start over
  const handleReset = useCallback(() => {
    reset();
    setSelectedTarget(null);
    setStep('select');
  }, [reset]);

  if (adminLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[400px]" />
        </div>
      </PageContainer>
    );
  }

  const steps = [
    { id: 'select', label: language === 'ru' ? 'Таблица' : 'Target', icon: Database },
    { id: 'upload', label: language === 'ru' ? 'Загрузка' : 'Upload', icon: Upload },
    { id: 'map', label: language === 'ru' ? 'Маппинг' : 'Mapping', icon: Link2 },
    { id: 'preview', label: language === 'ru' ? 'Превью' : 'Preview', icon: Globe },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title={language === 'ru' ? 'Data Import Hub' : 'Data Import Hub'}
        subtitle={language === 'ru' 
          ? 'Массовый импорт данных из Excel, CSV и других источников'
          : 'Bulk import data from Excel, CSV and other sources'
        }
      />

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((s, index) => {
            const isActive = s.id === step;
            const isComplete = currentStepIndex > index || step === 'done';
            const Icon = s.icon;
            
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isComplete 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isComplete ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    currentStepIndex > index ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Done State */}
      {step === 'done' && importResult && (
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {language === 'ru' ? 'Импорт завершён!' : 'Import Complete!'}
            </h3>
            <div className="flex justify-center gap-4 mb-4">
              <Badge variant="default" className="text-lg px-4 py-1">
                {importResult.success} {language === 'ru' ? 'успешно' : 'success'}
              </Badge>
              {importResult.failed > 0 && (
                <Badge variant="destructive" className="text-lg px-4 py-1">
                  {importResult.failed} {language === 'ru' ? 'ошибок' : 'failed'}
                </Badge>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <div className="text-left bg-destructive/10 p-3 rounded-lg mb-4 max-h-32 overflow-auto">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-xs text-destructive">{err}</p>
                ))}
              </div>
            )}
            <Button onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'ru' ? 'Новый импорт' : 'New Import'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Target Selection */}
      {step === 'select' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ru' ? 'Шаг 1: Выберите таблицу' : 'Step 1: Select Target Table'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImportTargetSelector
              selectedTarget={selectedTarget}
              onSelect={handleTargetSelect}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload */}
      {step === 'upload' && selectedTarget && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{language === 'ru' ? 'Шаг 2: Загрузите данные' : 'Step 2: Upload Data'}</span>
                <Button variant="ghost" size="sm" onClick={() => setStep('select')}>
                  {language === 'ru' ? 'Изменить таблицу' : 'Change target'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="file">
                    <Upload className="h-4 w-4 mr-2" />
                    {language === 'ru' ? 'Файл' : 'File'}
                  </TabsTrigger>
                  <TabsTrigger value="url" disabled>
                    <Link2 className="h-4 w-4 mr-2" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="scrape" disabled>
                    <Globe className="h-4 w-4 mr-2" />
                    {language === 'ru' ? 'Сайт' : 'Website'}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="file">
                  <FileImporter
                    onFileSelect={handleFileSelect}
                    parsedData={parsedData}
                    isLoading={isLoading}
                    onClear={handleReset}
                  />
                </TabsContent>
                
                <TabsContent value="url">
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ru' 
                      ? 'URL импорт будет добавлен в следующей версии'
                      : 'URL import coming in next version'
                    }
                  </div>
                </TabsContent>
                
                <TabsContent value="scrape">
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ru' 
                      ? 'Web scraping будет добавлен в следующей версии'
                      : 'Web scraping coming in next version'
                    }
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Mapping */}
      {step === 'map' && parsedData && selectedTarget && (
        <div className="space-y-4">
          <FieldMapper
            mappings={fieldMappings}
            targetId={selectedTarget}
            onUpdateMapping={updateMapping}
            onAutoMap={handleAutoMap}
          />
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('upload')}>
              {language === 'ru' ? 'Назад' : 'Back'}
            </Button>
            <Button 
              onClick={() => setStep('preview')}
              disabled={fieldMappings.filter(m => m.targetField).length === 0}
            >
              {language === 'ru' ? 'Продолжить' : 'Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 'preview' && parsedData && selectedTarget && (
        <div className="space-y-4">
          <ImportPreview
            parsedData={parsedData}
            mappings={fieldMappings}
            targetId={selectedTarget}
            transformedData={transformedData}
            onImport={handleImport}
            isLoading={isLoading}
          />
          
          <div className="flex justify-start">
            <Button variant="outline" onClick={() => setStep('map')}>
              {language === 'ru' ? 'Назад к маппингу' : 'Back to mapping'}
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
