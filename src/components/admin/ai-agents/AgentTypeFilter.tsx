import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Bot, Wrench, Search, LayoutGrid } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type AgentTypeFilter = 'all' | 'conversational' | 'utility' | 'analyzer';

interface AgentTypeFilterProps {
  value: AgentTypeFilter;
  onChange: (value: AgentTypeFilter) => void;
  counts: {
    all: number;
    conversational: number;
    utility: number;
    analyzer: number;
  };
}

export function AgentTypeFilter({ value, onChange, counts }: AgentTypeFilterProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  const options = [
    { value: 'all' as const, icon: LayoutGrid, label: isRussian ? 'Все' : 'All' },
    { value: 'conversational' as const, icon: Bot, label: isRussian ? 'Чат-боты' : 'Chat' },
    { value: 'utility' as const, icon: Wrench, label: isRussian ? 'Утилиты' : 'Utility' },
    { value: 'analyzer' as const, icon: Search, label: isRussian ? 'Анализ' : 'Analyzer' },
  ];

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as AgentTypeFilter)}
      className="justify-start"
    >
      {options.map(({ value: optValue, icon: Icon, label }) => (
        <ToggleGroupItem
          key={optValue}
          value={optValue}
          aria-label={label}
          className="gap-1.5 px-3"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
          <span className="text-xs text-muted-foreground">({counts[optValue]})</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
