import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { 
  Languages, 
  FileText, 
  Database, 
  Home,
  Bot,
  Wrench,
  Search,
  Inbox,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AIAgent } from '@/hooks/useAIAgents';

const iconMap: Record<string, React.ElementType> = {
  Languages,
  FileText,
  Database,
  Home,
  Bot,
  Wrench,
  Search,
  Inbox,
};

// Agents with dedicated UI pages
const AGENT_INTERFACES: Record<string, string> = {
  'intake-listing-agent': '/admin/intake',
};

// Detailed functionality descriptions for each agent
const AGENT_CAPABILITIES: Record<string, { en: string[]; ru: string[] }> = {
  'ai-translate': {
    en: ['Auto-translates EN↔RU for all listings', 'Maintains tone and terminology', 'Batch processing support'],
    ru: ['Авто-перевод EN↔RU для листингов', 'Сохранение тона и терминологии', 'Пакетная обработка'],
  },
  'ai-generate-description': {
    en: ['Generates SEO descriptions', 'Bilingual output (EN+RU)', 'Category-specific templates'],
    ru: ['Генерация SEO-описаний', 'Двуязычный вывод (EN+RU)', 'Шаблоны по категориям'],
  },
  'ai-smart-data': {
    en: ['Extracts fields from raw text', 'Normalizes prices & specs', 'Maps to DB schema'],
    ru: ['Извлечение полей из текста', 'Нормализация цен и спек', 'Маппинг на схему БД'],
  },
  'ai-personalize-home': {
    en: ['Personalizes home feed', 'Analyzes user preferences', 'Category prioritization'],
    ru: ['Персонализация главной', 'Анализ предпочтений', 'Приоритет категорий'],
  },
  'intake-listing-agent': {
    en: ['Scrapes URLs via Firecrawl', 'Detects vertical (22+ types)', 'Generates bilingual titles'],
    ru: ['Парсинг URL через Firecrawl', 'Детекция вертикали (22+ типа)', 'Генерация двуязычных заголовков'],
  },
};

const AVAILABLE_MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano' },
];

interface UtilityAgentCardProps {
  agent: AIAgent & { agent_type?: string };
  onUpdate: (updates: Partial<AIAgent>) => void;
  isUpdating?: boolean;
}

export function UtilityAgentCard({ agent, onUpdate, isUpdating }: UtilityAgentCardProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const IconComponent = iconMap[agent.icon] || Wrench;

  const typeLabel = {
    conversational: isRussian ? 'Чат-бот' : 'Chat Bot',
    utility: isRussian ? 'Утилита' : 'Utility',
    analyzer: isRussian ? 'Анализатор' : 'Analyzer',
  }[(agent as any).agent_type || 'utility'];

  const typeColor = {
    conversational: 'bg-blue-500/10 text-blue-600',
    utility: 'bg-orange-500/10 text-orange-600',
    analyzer: 'bg-purple-500/10 text-purple-600',
  }[(agent as any).agent_type || 'utility'];

  return (
    <Card className={`transition-all ${!agent.is_active ? 'opacity-60' : ''} ${isUpdating ? 'pointer-events-none' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${agent.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                {isRussian ? agent.name_ru : agent.name_en}
              </CardTitle>
              <code className="text-xs text-muted-foreground">{agent.slug}</code>
            </div>
          </div>
          <Switch
            checked={agent.is_active}
            onCheckedChange={(checked) => onUpdate({ is_active: checked })}
            aria-label={isRussian ? 'Включить/выключить' : 'Toggle active'}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Type Badge + Interface Link */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={typeColor}>
            {typeLabel}
          </Badge>
          {AGENT_INTERFACES[agent.slug] && (
            <Button variant="outline" size="sm" asChild className="h-7 text-xs gap-1">
              <Link to={AGENT_INTERFACES[agent.slug]}>
                <ExternalLink className="h-3 w-3" />
                {isRussian ? 'Открыть' : 'Open'}
              </Link>
            </Button>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {isRussian ? agent.description_ru : agent.description_en}
        </p>

        {/* Capabilities List */}
        {AGENT_CAPABILITIES[agent.slug] && (
          <div className="bg-muted/50 rounded-md p-2 space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              {isRussian ? 'Возможности' : 'Capabilities'}
            </span>
            <ul className="space-y-0.5">
              {(isRussian 
                ? AGENT_CAPABILITIES[agent.slug].ru 
                : AGENT_CAPABILITIES[agent.slug].en
              ).map((cap, idx) => (
                <li key={idx} className="text-[11px] text-foreground/80 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary/60" />
                  {cap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Model Select */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            {isRussian ? 'Модель' : 'Model'}
          </label>
          <Select
            value={agent.model}
            onValueChange={(model) => onUpdate({ model })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Temperature Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-xs text-muted-foreground">
              {isRussian ? 'Температура' : 'Temperature'}
            </label>
            <span className="text-xs font-mono">{agent.temperature}</span>
          </div>
          <Slider
            value={[agent.temperature]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={([temp]) => onUpdate({ temperature: temp })}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
