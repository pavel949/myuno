import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Files, Link2, Upload, MessageSquareText, FileSpreadsheet } from 'lucide-react';

export type IntakeMode = 'single' | 'bulk_text' | 'bulk_urls' | 'files' | 'agent_message' | 'csv';

interface IntakeModeSelectorProps {
  mode: IntakeMode;
  onChange: (mode: IntakeMode) => void;
  disabled?: boolean;
}

const modes = [
  { 
    id: 'single' as const, 
    icon: FileText, 
    labelEn: 'Single', 
    labelRu: 'Один',
    descEn: 'One listing at a time',
    descRu: 'Один листинг'
  },
  { 
    id: 'bulk_text' as const, 
    icon: Files, 
    labelEn: 'Bulk Text', 
    labelRu: 'Текст',
    descEn: 'Multiple items in text',
    descRu: 'Несколько в тексте'
  },
  { 
    id: 'bulk_urls' as const, 
    icon: Link2, 
    labelEn: 'URLs', 
    labelRu: 'Ссылки',
    descEn: 'Scrape from websites',
    descRu: 'Парсинг сайтов'
  },
  { 
    id: 'files' as const, 
    icon: Upload, 
    labelEn: 'Files', 
    labelRu: 'Файлы',
    descEn: 'Images, PDF, Excel',
    descRu: 'Фото, PDF, Excel'
  },
  { 
    id: 'agent_message' as const, 
    icon: MessageSquareText, 
    labelEn: 'Agent Post', 
    labelRu: 'Пост агента',
    descEn: 'From WA/TG groups',
    descRu: 'Из групп WA/TG'
  },
  { 
    id: 'csv' as const, 
    icon: FileSpreadsheet, 
    labelEn: 'CSV / Excel', 
    labelRu: 'CSV / Excel',
    descEn: 'Spreadsheet upload',
    descRu: 'Загрузка таблицы'
  },
];

export function IntakeModeSelector({ mode, onChange, disabled }: IntakeModeSelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.id;
        
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-none border-2 transition-all",
              isActive 
                ? "border-primary bg-primary/5 text-primary" 
                : "border-border hover:border-primary/50 hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-none flex items-center justify-center",
              isActive ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-center">
              <div className="font-medium text-sm">
                {isRu ? m.labelRu : m.labelEn}
              </div>
              <div className="text-xs text-muted-foreground">
                {isRu ? m.descRu : m.descEn}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
