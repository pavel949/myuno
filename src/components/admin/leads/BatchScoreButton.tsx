import { Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLeadsFactory } from '@/hooks/useLeadsFactory';
import { useLanguage } from '@/contexts/LanguageContext';

export function BatchScoreButton() {
  const { batchScoreLeads } = useLeadsFactory();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleBatchScore = (limit: number) => {
    batchScoreLeads.mutate({ limit, status: 'pending' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={batchScoreLeads.isPending}>
          {batchScoreLeads.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          {isRu ? 'AI-скоринг' : 'AI Scoring'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleBatchScore(5)}>
          {isRu ? 'Проанализировать 5 лидов' : 'Analyze 5 leads'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleBatchScore(10)}>
          {isRu ? 'Проанализировать 10 лидов' : 'Analyze 10 leads'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleBatchScore(25)}>
          {isRu ? 'Проанализировать 25 лидов' : 'Analyze 25 leads'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
