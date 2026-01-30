import { Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLeadsFactory } from '@/hooks/useLeadsFactory';

export function BatchScoreButton() {
  const { batchScoreLeads } = useLeadsFactory();

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
          AI-скоринг
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleBatchScore(5)}>
          Проанализировать 5 лидов
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleBatchScore(10)}>
          Проанализировать 10 лидов
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleBatchScore(25)}>
          Проанализировать 25 лидов
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
