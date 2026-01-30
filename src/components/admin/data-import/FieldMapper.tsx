import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { FieldMapping } from '@/hooks/useDataImport';
import { importTargets, getTargetFields } from '@/lib/importTemplates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Check, X, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FieldMapperProps {
  mappings: FieldMapping[];
  targetId: string;
  onUpdateMapping: (sourceColumn: string, targetField: string | null) => void;
  onAutoMap: () => void;
}

export function FieldMapper({ mappings, targetId, onUpdateMapping, onAutoMap }: FieldMapperProps) {
  const { language } = useLanguage();
  
  const target = importTargets.find(t => t.id === targetId);
  const targetFields = getTargetFields(targetId);
  const usedFields = mappings.filter(m => m.targetField).map(m => m.targetField);
  
  const getMappingStatus = (mapping: FieldMapping) => {
    if (!mapping.targetField) return 'unmapped';
    if (target?.requiredFields.includes(mapping.targetField)) return 'required';
    return 'optional';
  };

  const getFieldLabel = (field: string): string => {
    if (!target) return field;
    const labels = target.fieldLabels[field];
    if (labels) {
      return language === 'ru' ? labels.ru : labels.en;
    }
    return field;
  };

  const mappedCount = mappings.filter(m => m.targetField).length;
  const requiredMapped = target?.requiredFields.filter(f => 
    mappings.some(m => m.targetField === f)
  ).length || 0;
  const requiredTotal = target?.requiredFields.length || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {language === 'ru' ? 'Маппинг полей' : 'Field Mapping'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={requiredMapped === requiredTotal ? 'default' : 'destructive'}>
              {language === 'ru' 
                ? `Обязательные: ${requiredMapped}/${requiredTotal}`
                : `Required: ${requiredMapped}/${requiredTotal}`
              }
            </Badge>
            <Button variant="outline" size="sm" onClick={onAutoMap}>
              <Wand2 className="h-3 w-3 mr-1" />
              {language === 'ru' ? 'Авто' : 'Auto'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {mappings.map((mapping) => {
          const status = getMappingStatus(mapping);
          
          return (
            <div 
              key={mapping.sourceColumn}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                status === 'unmapped' 
                  ? 'bg-muted/50' 
                  : status === 'required'
                    ? 'bg-green-500/10'
                    : 'bg-blue-500/10'
              }`}
            >
              {/* Source column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm truncate">
                    {mapping.sourceColumn}
                  </span>
                </div>
              </div>
              
              {/* Arrow */}
              <ArrowRight className={`h-4 w-4 flex-shrink-0 ${
                mapping.targetField ? 'text-primary' : 'text-muted-foreground'
              }`} />
              
              {/* Target field selector */}
              <div className="flex-1 min-w-0">
                <Select
                  value={mapping.targetField || 'none'}
                  onValueChange={(value) => onUpdateMapping(
                    mapping.sourceColumn, 
                    value === 'none' ? null : value
                  )}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={language === 'ru' ? 'Не выбрано' : 'Not mapped'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">
                        {language === 'ru' ? '— Не импортировать —' : '— Skip field —'}
                      </span>
                    </SelectItem>
                    {targetFields.map((field) => {
                      const isUsed = usedFields.includes(field) && mapping.targetField !== field;
                      const isRequired = target?.requiredFields.includes(field);
                      
                      return (
                        <SelectItem 
                          key={field} 
                          value={field}
                          disabled={isUsed}
                        >
                          <div className="flex items-center gap-2">
                            <span>{getFieldLabel(field)}</span>
                            {isRequired && (
                              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                *
                              </Badge>
                            )}
                            {isUsed && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                {language === 'ru' ? 'занято' : 'used'}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Status indicator */}
              <div className="flex-shrink-0">
                {status === 'required' && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {status === 'optional' && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
                {status === 'unmapped' && (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          );
        })}
        
        {mappings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {language === 'ru' 
              ? 'Загрузите файл для настройки маппинга'
              : 'Upload a file to configure mapping'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}
