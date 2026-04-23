import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ComputedPnL } from '@/lib/finance/financialModelMath';
import type { DcfResult } from '@/lib/finance/dcfMath';
import { cn } from '@/lib/utils';

interface Props {
  computed: ComputedPnL;
  dcf?: DcfResult | null;
  property?: { name?: string; type?: string; bedrooms?: number; district?: string; propertyValue?: number };
  monthlyOccupancy?: number[];
  monthlyAdr?: number[];
}

export function AIAdvisorPanel({ computed, dcf, property, monthlyOccupancy, monthlyAdr }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-financial-advisor', {
        body: {
          language: isRu ? 'ru' : 'en',
          property: property ?? {},
          computed: computed.totals,
          kpis: computed.kpis,
          dcf: dcf ? {
            irr: dcf.totals.irr,
            npv: dcf.totals.npv,
            moic: dcf.totals.moic,
            payback: dcf.totals.payback,
          } : undefined,
          drivers: { monthlyOccupancy, monthlyAdr },
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setNarrative((data as { narrative: string }).narrative || '');
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
        toast.error(isRu ? 'Превышен лимит запросов. Попробуйте через минуту.' : 'Rate limit exceeded. Try again in a minute.');
      } else if (msg.includes('402') || msg.toLowerCase().includes('credit')) {
        toast.error(isRu ? 'AI кредиты исчерпаны. Пополните в настройках.' : 'AI credits depleted. Please add credits.');
      } else {
        toast.error((isRu ? 'Ошибка: ' : 'Error: ') + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">
              {isRu ? 'AI финансовый аналитик' : 'AI financial analyst'}
            </h3>
          </div>
          <Button size="sm" variant="default" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : narrative ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span className="ml-1.5 text-xs">{narrative ? (isRu ? 'Обновить' : 'Refresh') : (isRu ? 'Анализ' : 'Analyze')}</span>
          </Button>
        </div>

        {!narrative && !loading && (
          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Получите экспертную оценку модели: красные флаги, рекомендации, бенчмарки рынка Пхукета.'
              : 'Get expert assessment: red flags, recommendations, Phuket market benchmarks.'}
          </p>
        )}

        {loading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-muted rounded-none w-3/4" />
            <div className="h-3 bg-muted rounded-none w-full" />
            <div className="h-3 bg-muted rounded-none w-5/6" />
          </div>
        )}

        {narrative && !loading && (
          <div className={cn(
            'text-xs sm:text-sm prose prose-sm max-w-none',
            'prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5',
            'prose-p:text-foreground prose-p:my-1.5',
            'prose-strong:text-foreground',
            'prose-ul:my-1.5 prose-li:my-0.5 prose-li:text-foreground',
          )}>
            <SimpleMarkdown text={narrative} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Minimal markdown renderer (bold, headers, lists) — no external dep. */
function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-0.5">
          {listBuffer.map((l, i) => <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(l) }} />)}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); return; }
    if (trimmed.startsWith('### ')) { flushList(); elements.push(<h4 key={i} className="font-semibold mt-2.5" dangerouslySetInnerHTML={{ __html: renderInline(trimmed.slice(4)) }} />); }
    else if (trimmed.startsWith('## ')) { flushList(); elements.push(<h3 key={i} className="font-semibold mt-2.5" dangerouslySetInnerHTML={{ __html: renderInline(trimmed.slice(3)) }} />); }
    else if (trimmed.startsWith('# ')) { flushList(); elements.push(<h3 key={i} className="font-bold mt-2.5" dangerouslySetInnerHTML={{ __html: renderInline(trimmed.slice(2)) }} />); }
    else if (/^[-*]\s/.test(trimmed)) { listBuffer.push(trimmed.replace(/^[-*]\s/, '')); }
    else if (/^\d+\.\s/.test(trimmed)) { listBuffer.push(trimmed.replace(/^\d+\.\s/, '')); }
    else { flushList(); elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: renderInline(trimmed) }} />); }
  });
  flushList();
  return <>{elements}</>;
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1 bg-muted rounded-none text-[0.85em]">$1</code>');
}
