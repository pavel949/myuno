/**
 * MCCFunnelsTab — placeholder for the future Funnel Builder.
 *
 * Previously displayed 3 hardcoded "funnels" with fake numbers
 * (45 000 impressions, 6.5% CVR) and inert «Create / Edit / A/B Test»
 * buttons. The admin treated those numbers as real platform metrics,
 * which was actively misleading.
 *
 * Until a real funnels backend ships (events pipeline →
 * `marketing_funnels` + `marketing_funnel_steps` tables → analytics
 * RPCs), this tab renders an honest «not yet implemented» state so
 * nothing in the panel claims to know what it doesn't.
 */
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Sparkles, ArrowRight } from 'lucide-react';

export function MCCFunnelsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {isRu ? 'Воронки конверсии' : 'Conversion Funnels'}
          </h2>
          <Badge variant="outline" className="uppercase tracking-wide text-[10.5px]">
            {isRu ? 'В разработке' : 'In progress'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {isRu
            ? 'Визуализация и оптимизация пути пользователя по платформе.'
            : 'Visualize and optimize the user journey across the platform.'}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center text-center py-14 px-6 gap-4">
          <div className="p-3 rounded-none bg-primary/10">
            <GitBranch className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="font-semibold">
              {isRu ? 'Конструктор воронок ещё не готов' : 'Funnel builder is not ready yet'}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isRu
                ? 'Чтобы здесь появились настоящие воронки, нужен events-pipeline (impressions/clicks/conversions) и таблицы marketing_funnels/marketing_funnel_steps. До тех пор лучше показать честное «пока пусто», чем выдуманные цифры.'
                : 'Real funnels need an events pipeline (impressions/clicks/conversions) plus marketing_funnels / marketing_funnel_steps tables. Until then, an honest empty state beats fabricated numbers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-xl mt-2">
            {[
              { en: 'New User Acquisition', ru: 'Привлечение пользователей' },
              { en: 'Booking Funnel', ru: 'Воронка бронирования' },
              { en: 'Reactivation', ru: 'Реактивация' },
            ].map((f) => (
              <div
                key={f.en}
                className="p-3 border border-dashed border-border/60 rounded-none text-xs text-muted-foreground"
              >
                <div className="font-medium text-foreground/80">{isRu ? f.ru : f.en}</div>
                <div className="mt-1 opacity-70">{isRu ? 'Ждёт events-pipeline' : 'Awaiting events pipeline'}</div>
              </div>
            ))}
          </div>

          <Button asChild variant="outline" size="sm" className="gap-1.5 mt-2">
            <a
              href="https://github.com/pavel949/myuno/issues?q=label%3Amarketing-funnels"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isRu ? 'Следить за прогрессом' : 'Track progress'}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
