import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, ShieldCheck, Handshake, FileText, ChevronRight, Wrench } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

interface ToolTile {
  icon: React.ElementType;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  path: string;
  badgeRu?: string;
  badgeEn?: string;
}

const TOOLS: ToolTile[] = [
  {
    icon: ShieldCheck,
    titleRu: 'ClearView™ — рейтинг проектов',
    titleEn: 'ClearView™ — project rating',
    descRu: '8 критериев, шкала AAA–CCC. Independent due diligence по off-plan и resale.',
    descEn: '8 criteria, AAA–CCC scale. Independent due diligence for off-plan and resale.',
    path: APP_ROUTES.CLEARVIEW,
    badgeRu: 'Moat',
    badgeEn: 'Moat',
  },
  {
    icon: Calculator,
    titleRu: 'Калькулятор доходности',
    titleEn: 'ROI calculator',
    descRu: 'ROI, yield, окупаемость, сценарии аренды и перепродажи.',
    descEn: 'ROI, yield, payback, rental and resale scenarios.',
    path: APP_ROUTES.INVEST_CALCULATOR,
  },
  {
    icon: Handshake,
    titleRu: 'Capital advisory',
    titleEn: 'Capital advisory',
    descRu: 'Подбор сделки, представление интересов, сопровождение через юристов и BOI.',
    descEn: 'Deal sourcing, representation, legal and BOI support.',
    path: APP_ROUTES.INVEST_SERVICES,
  },
  {
    icon: FileText,
    titleRu: 'Due diligence отчёты',
    titleEn: 'Due diligence reports',
    descRu: 'Готовые DD-пакеты по конкретным проектам и компаниям.',
    descEn: 'Ready due diligence packs for projects and companies.',
    path: APP_ROUTES.CLEARVIEW,
  },
];

export default function InvestmentToolsHub() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Инвестиционные инструменты | myUNO' : 'Investment tools | myUNO'}</title>
        <meta
          name="description"
          content={
            isRu
              ? 'ClearView, калькулятор доходности, advisory и due diligence — все инструменты для инвестора в одном месте.'
              : 'ClearView, ROI calculator, advisory and due diligence — all investor tools in one place.'
          }
        />
      </Helmet>

      <MiniAppLayout title={isRu ? 'Инструменты' : 'Tools'} showSearch={false}>
        <div className="space-y-6 pb-10">
          <div className="rounded-none border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-none bg-cluster-invest/10 flex items-center justify-center flex-shrink-0">
                <Wrench className="h-5 w-5 text-cluster-invest" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-foreground leading-tight">
                  {isRu ? 'Инвестиционные инструменты' : 'Investment tools'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRu
                    ? 'Оценка, расчёт и сопровождение сделок'
                    : 'Rating, calculation, deal support'}
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card
                    key={tool.titleEn}
                    className={cn(
                      'group relative overflow-hidden border-border/60 bg-card hover:border-primary/40 transition-all cursor-pointer',
                    )}
                    onClick={() => navigate(tool.path)}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-11 h-11 rounded-none bg-primary/10 text-primary flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        {tool.badgeRu && (
                          <Badge variant="secondary" className="text-[10px]">
                            {isRu ? tool.badgeRu : tool.badgeEn}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base leading-tight">
                          {isRu ? tool.titleRu : tool.titleEn}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isRu ? tool.descRu : tool.descEn}
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-primary font-medium pt-1">
                        {isRu ? 'Открыть' : 'Open'}
                        <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </MiniAppLayout>
    </>
  );
}
