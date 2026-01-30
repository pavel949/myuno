import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntakeAgent } from '@/hooks/useIntakeAgent';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IntakeModeSelector, IntakeMode } from '@/components/admin/intake/IntakeModeSelector';
import { IntakeInputForm } from '@/components/admin/intake/IntakeInputForm';
import { IntakeQueue } from '@/components/admin/intake/IntakeQueue';
import { Bot, Sparkles, Zap, Globe } from 'lucide-react';

export default function AdminIntake() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [mode, setMode] = useState<IntakeMode>('single');
  
  const {
    session,
    summary,
    isProcessing,
    isApproving,
    analyze,
    updateItem,
    approveItem,
    discardItem,
    approveAll,
    reset,
  } = useIntakeAgent();

  const handleAnalyze = async (options: Parameters<typeof analyze>[0]) => {
    await analyze(options);
  };

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title={isRu ? 'AI Intake' : 'AI Intake'}
        subtitle={isRu 
          ? 'Автоматическое создание листингов из любых данных'
          : 'Automatically create listings from any data'
        }
      />

      {/* Features highlight - show only when no session */}
      {!session && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-dashed">
            <CardContent className="pt-4 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">
                {isRu ? 'AI Извлечение' : 'AI Extraction'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Автоматически находит поля' : 'Auto-detects fields'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-4 text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">
                {isRu ? '22+ Категорий' : '22+ Categories'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Яхты, виллы, туры...' : 'Yachts, villas, tours...'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-4 text-center">
              <Globe className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">
                {isRu ? 'Парсинг URL' : 'URL Scraping'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Извлекает с сайтов' : 'Extracts from websites'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mode selector - show only when no session */}
      {!session && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              {isRu ? 'Режим ввода' : 'Input Mode'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IntakeModeSelector 
              mode={mode} 
              onChange={setMode}
              disabled={isProcessing}
            />
          </CardContent>
        </Card>
      )}

      {/* Input form - show only when no session */}
      {!session && (
        <IntakeInputForm
          mode={mode}
          onAnalyze={handleAnalyze}
          isProcessing={isProcessing}
        />
      )}

      {/* Queue - show when session exists */}
      {session && summary && (
        <IntakeQueue
          session={session}
          summary={summary}
          onApprove={approveItem}
          onDiscard={discardItem}
          onEdit={updateItem}
          onApproveAll={approveAll}
          onReset={reset}
          isApproving={isApproving}
        />
      )}
    </PageContainer>
  );
}
