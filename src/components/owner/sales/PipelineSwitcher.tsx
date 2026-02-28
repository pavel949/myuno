import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PipelineWithStages } from '@/hooks/useCrmPipelines';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Props {
  pipelines: PipelineWithStages[];
  activePipelineId: string | null;
  onSelect: (id: string) => void;
}

export function PipelineSwitcher({ pipelines, activePipelineId, onSelect }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (pipelines.length <= 1) return null;

  return (
    <Tabs value={activePipelineId || ''} onValueChange={onSelect}>
      <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
        {pipelines.map(p => (
          <TabsTrigger
            key={p.id}
            value={p.id}
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5 text-xs font-medium border border-border data-[state=active]:border-primary"
          >
            {isRu ? p.name_ru : p.name_en}
            {p.is_default && (
              <Badge variant="secondary" className="ml-1.5 text-[9px] h-4 px-1">
                {isRu ? 'Осн.' : 'Default'}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
