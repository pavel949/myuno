import { Flame, Thermometer, Snowflake, Brain, Loader2, Copy, MessageCircle, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLeadsFactory, getPriorityColor, getScoreColor, LeadScoreResult } from '@/hooks/useLeadsFactory';
import { toast } from 'sonner';
import { useState } from 'react';

interface LeadAIInsightsProps {
  leadId: string;
  aiScore: number | null;
  aiPriority: string | null;
  aiReasoning: string | null;
  aiRecommendedAction: string | null;
  aiAnalysisAt: string | null;
  compact?: boolean;
}

export function LeadAIInsights({
  leadId,
  aiScore,
  aiPriority,
  aiReasoning,
  aiRecommendedAction,
  aiAnalysisAt,
  compact = false,
}: LeadAIInsightsProps) {
  const { analyzeLead, generateFollowUp } = useLeadsFactory();
  const [followUpMessage, setFollowUpMessage] = useState<string | null>(null);

  const PriorityIcon = aiPriority === 'hot' 
    ? Flame 
    : aiPriority === 'warm' 
      ? Thermometer 
      : Snowflake;

  const handleAnalyze = () => {
    analyzeLead.mutate(leadId);
  };

  const handleGenerateWhatsApp = async () => {
    const result = await generateFollowUp.mutateAsync({ leadId, channel: 'whatsapp' });
    setFollowUpMessage(result.message);
  };

  const handleCopyMessage = () => {
    if (followUpMessage) {
      navigator.clipboard.writeText(followUpMessage);
      toast.success('Скопировано в буфер обмена');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {aiScore !== null ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className={`${getPriorityColor(aiPriority)} cursor-help`}>
                  <PriorityIcon className="h-3 w-3 mr-1" />
                  {aiScore}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-1">{aiReasoning}</p>
                <p className="text-xs text-muted-foreground">{aiRecommendedAction}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzeLead.isPending}
            className="h-6 px-2 text-xs"
          >
            {analyzeLead.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Brain className="h-3 w-3 mr-1" />
                AI
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI-анализ
          </span>
          {aiAnalysisAt && (
            <span className="text-xs text-muted-foreground font-normal">
              {new Date(aiAnalysisAt).toLocaleString('ru-RU')}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {aiScore !== null ? (
          <>
            <div className="flex items-center gap-3">
              <div className={`text-2xl font-bold ${getScoreColor(aiScore)}`}>
                {aiScore}
              </div>
              <Badge className={getPriorityColor(aiPriority)}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                {aiPriority === 'hot' ? 'Горячий' : aiPriority === 'warm' ? 'Тёплый' : 'Холодный'}
              </Badge>
            </div>

            {aiReasoning && (
              <p className="text-sm text-muted-foreground">{aiReasoning}</p>
            )}

            {aiRecommendedAction && (
              <div className="bg-muted/50 rounded-none p-2">
                <p className="text-sm font-medium">💡 Рекомендация:</p>
                <p className="text-sm">{aiRecommendedAction}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateWhatsApp}
                disabled={generateFollowUp.isPending}
              >
                {generateFollowUp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <MessageCircle className="h-4 w-4 mr-1" />
                )}
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateFollowUp.mutate({ leadId, channel: 'email' })}
                disabled={generateFollowUp.isPending}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAnalyze}
                disabled={analyzeLead.isPending}
              >
                {analyzeLead.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
              </Button>
            </div>

            {followUpMessage && (
              <div className="bg-muted rounded-none p-3 mt-2">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium">Сообщение:</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={handleCopyMessage}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{followUpMessage}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Лид ещё не проанализирован
            </p>
            <Button onClick={handleAnalyze} disabled={analyzeLead.isPending}>
              {analyzeLead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Запустить анализ
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
