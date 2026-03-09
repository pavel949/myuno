import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProspects, useUpdateProspect, statusConfig, priorityConfig, type VendorProspect } from '@/hooks/useVendorAcquisition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { VendorProspectCard } from './VendorProspectCard';
import { VendorProspectDetail } from './VendorProspectDetail';
import { RefreshCw } from 'lucide-react';

const PIPELINE_STAGES = [
  { status: 'new', labelEn: 'New Leads', labelRu: 'Новые' },
  { status: 'researching', labelEn: 'Researching', labelRu: 'Исследование' },
  { status: 'contacted', labelEn: 'Contacted', labelRu: 'Контакт' },
  { status: 'replied', labelEn: 'Replied', labelRu: 'Ответил' },
  { status: 'meeting', labelEn: 'Meeting', labelRu: 'Встреча' },
  { status: 'negotiating', labelEn: 'Negotiating', labelRu: 'Переговоры' },
  { status: 'won', labelEn: 'Won', labelRu: 'Выигран' },
] as const;

export function VendorProspectsPipeline() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { data: prospects, isLoading, refetch } = useVendorProspects();
  const [selectedProspect, setSelectedProspect] = useState<VendorProspect | null>(null);

  const getProspectsByStatus = (status: string) => {
    return prospects?.filter(p => p.status === status) || [];
  };

  const handleDragStart = (e: React.DragEvent, prospect: VendorProspect) => {
    e.dataTransfer.setData('prospectId', prospect.id);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    // Would need updateProspect mutation here
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage.status} className="flex-shrink-0 w-72">
            <Skeleton className="h-12 mb-3" />
            <div className="space-y-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isRussian 
            ? `Всего: ${prospects?.length || 0} лидов` 
            : `Total: ${prospects?.length || 0} leads`}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {isRussian ? 'Обновить' : 'Refresh'}
        </Button>
      </div>

      {/* Kanban board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {PIPELINE_STAGES.map((stage) => {
            const stageProspects = getProspectsByStatus(stage.status);
            const config = statusConfig[stage.status];
            
            return (
              <div
                key={stage.status}
                className="flex-shrink-0 w-72"
                onDrop={(e) => handleDrop(e, stage.status)}
                onDragOver={handleDragOver}
              >
                <Card className="bg-muted/30">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <span className={config?.color || ''}>●</span>
                        {isRussian ? stage.labelRu : stage.labelEn}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {stageProspects.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-2 pb-2 pt-0">
                    <div className="space-y-2 min-h-[200px]">
                      {stageProspects.map((prospect) => (
                        <VendorProspectCard
                          key={prospect.id}
                          prospect={prospect}
                          onDragStart={(e) => handleDragStart(e, prospect)}
                          onClick={() => setSelectedProspect(prospect)}
                        />
                      ))}
                      {stageProspects.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          {isRussian ? 'Нет лидов' : 'No leads'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Detail sheet */}
      {selectedProspect && (
        <VendorProspectDetail
          prospect={selectedProspect}
          open={!!selectedProspect}
          onClose={() => setSelectedProspect(null)}
        />
      )}
    </div>
  );
}
