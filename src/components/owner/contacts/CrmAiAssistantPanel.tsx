import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCrmAiAssistant, AiAction } from '@/hooks/useCrmAiAssistant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, FileText, Target, Mail, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Props {
  contactId?: string;
  dealId?: string;
  companyId?: string;
}

const AI_ACTIONS: { action: AiAction; labelEn: string; labelRu: string; icon: React.ElementType; color: string }[] = [
  { action: 'summarize', labelEn: 'Summarize', labelRu: 'Резюме', icon: FileText, color: 'text-primary' },
  { action: 'next_action', labelEn: 'Next Best Action', labelRu: 'Следующий шаг', icon: Target, color: 'text-success' },
  { action: 'draft_email', labelEn: 'Draft Email', labelRu: 'Черновик письма', icon: Mail, color: 'text-info' },
  { action: 'risk_alert', labelEn: 'Risk Analysis', labelRu: 'Анализ рисков', icon: AlertTriangle, color: 'text-warning' },
];

export function CrmAiAssistantPanel({ contactId, dealId, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const aiAssistant = useCrmAiAssistant();
  const [result, setResult] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<AiAction | null>(null);

  const handleAction = async (action: AiAction) => {
    setActiveAction(action);
    setResult(null);
    try {
      const res = await aiAssistant.mutateAsync({
        action,
        contact_id: contactId,
        deal_id: dealId,
        company_id: companyId,
      });
      setResult(res);
    } catch {
      setResult(isRu ? 'Ошибка получения ответа от AI' : 'Failed to get AI response');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {isRu ? 'AI Ассистент' : 'AI Assistant'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {AI_ACTIONS.map(a => (
            <Button
              key={a.action}
              variant="outline"
              size="sm"
              className="h-auto py-2 px-3 justify-start"
              disabled={aiAssistant.isPending}
              onClick={() => handleAction(a.action)}
            >
              <a.icon className={cn('h-3.5 w-3.5 mr-2 shrink-0', a.color)} />
              <span className="text-xs">{isRu ? a.labelRu : a.labelEn}</span>
            </Button>
          ))}
        </div>

        {aiAssistant.isPending && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">{isRu ? 'Думаю...' : 'Thinking...'}</span>
          </div>
        )}

        {result && (
          <div className="bg-muted/50 rounded-none p-3 text-sm prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
