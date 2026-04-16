import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MiniAppLayout } from '@/components/miniapp';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHubIntroRequests, useHubOpportunities } from '@/hooks/investment-hub/useInvestmentHub';
import { INVESTMENT_HUB_JTBD, INVESTMENT_HUB_ROLES, INVESTMENT_HUB_SCENARIOS } from '@/lib/investment-hub/scope';
import { INVESTMENT_MONETIZATION_RULES } from '@/lib/investment-hub/monetization';
import { INVESTMENT_HUB_KPIS, INVESTMENT_HUB_ROLLOUT } from '@/lib/investment-hub/kpi';
import { InvestmentHubZone } from '@/types/investmentHub';

const ZONE_ROUTE_MAP: Record<InvestmentHubZone, string> = {
  market: APP_ROUTES.INVEST_MARKET,
  deals: APP_ROUTES.INVEST_DEALS,
  network: APP_ROUTES.INVEST_NETWORK,
  execution: APP_ROUTES.INVEST_EXECUTION,
};

function getZoneFromPath(pathname: string): InvestmentHubZone {
  if (pathname.endsWith('/market')) return 'market';
  if (pathname.endsWith('/deals')) return 'deals';
  if (pathname.endsWith('/network')) return 'network';
  if (pathname.endsWith('/execution')) return 'execution';
  return 'market';
}

function pickByLanguage(language: string, values: { ru: string; en: string; th: string }, fallback?: string): string {
  if (language === 'ru') return values.ru || values.en || fallback || '';
  if (language === 'th') return values.th || values.en || fallback || '';
  return values.en || fallback || '';
}

function getLocalizedOpportunityTitle(language: string, title: string, metadata?: Record<string, unknown> | null): string {
  const i18n = metadata?.i18n as
    | { title?: { ru?: string; en?: string; th?: string } }
    | undefined;
  const titleMap = i18n?.title;
  if (!titleMap) return title;
  const byLang =
    language === 'ru' ? titleMap.ru :
    language === 'th' ? titleMap.th :
    titleMap.en;
  return byLang || titleMap.en || title;
}

export default function InvestmentHubShell() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const currentZone = getZoneFromPath(location.pathname);

  const opportunities = useHubOpportunities(currentZone);
  const introRequests = useHubIntroRequests();

  const currentScenario = useMemo(
    () => INVESTMENT_HUB_SCENARIOS.find((item) => item.zone === currentZone),
    [currentZone],
  );

  return (
    <MiniAppLayout title={pickByLanguage(language, { ru: 'Investment Hub', en: 'Investment Hub', th: 'Investment Hub' })} showSearch={false}>
      <Helmet>
        <title>{pickByLanguage(language, { ru: 'Investment Hub | myUNO', en: 'Investment Hub | myUNO', th: 'Investment Hub | myUNO' })}</title>
      </Helmet>

      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {pickByLanguage(language, {
                ru: 'Единый центр сделок multi-asset Thailand',
                en: 'Unified multi-asset Thailand deal center',
                th: 'ศูนย์รวมดีลแบบ multi-asset Thailand',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {pickByLanguage(language, {
                ru: 'Hub объединяет buy-side, sell-side и advisory workflow: discovery -> matching -> execution.',
                en: 'Hub unifies buy-side, sell-side, and advisory workflow: discovery -> matching -> execution.',
                th: 'Hub รวม workflow ฝั่ง buy-side, sell-side และ advisory: discovery -> matching -> execution',
              })}
            </p>
            <Tabs value={currentZone} onValueChange={(value) => navigate(ZONE_ROUTE_MAP[value as InvestmentHubZone])}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="market">{pickByLanguage(language, { ru: 'Рынок', en: 'Market', th: 'ตลาด' })}</TabsTrigger>
                <TabsTrigger value="deals">{pickByLanguage(language, { ru: 'Сделки', en: 'Deals', th: 'ดีล' })}</TabsTrigger>
                <TabsTrigger value="network">{pickByLanguage(language, { ru: 'Сеть', en: 'Network', th: 'เครือข่าย' })}</TabsTrigger>
                <TabsTrigger value="execution">{pickByLanguage(language, { ru: 'Исполнение', en: 'Execution', th: 'ดำเนินการ' })}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pickByLanguage(language, { ru: 'Роли и JTBD', en: 'Roles and JTBD', th: 'บทบาทและ JTBD' })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {INVESTMENT_HUB_ROLES.map((item) => (
              <div key={item.role} className="rounded-lg border p-3">
                <div className="font-medium">{pickByLanguage(language, { ru: item.labelRu, en: item.labelEn, th: item.labelTh })}</div>
                <div className="text-sm text-muted-foreground">{pickByLanguage(language, { ru: item.primaryGoalRu, en: item.primaryGoalEn, th: item.primaryGoalTh })}</div>
              </div>
            ))}
            <div className="grid gap-2">
              {INVESTMENT_HUB_JTBD.slice(0, 3).map((item) => (
                <Badge key={item.id} variant="secondary" className="justify-start">
                  {pickByLanguage(language, { ru: item.titleRu, en: item.titleEn, th: item.titleTh })}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pickByLanguage(language, { ru: 'Сценарий зоны', en: 'Zone scenario', th: 'สถานการณ์ของโซน' })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">
              {currentScenario
                ? pickByLanguage(language, { ru: currentScenario.titleRu, en: currentScenario.titleEn, th: currentScenario.titleTh })
                : ''}
            </p>
            {(currentScenario
              ? (language === 'ru' ? currentScenario.stepsRu : language === 'th' ? currentScenario.stepsTh : currentScenario.stepsEn)
              : []
            ).map((step) => (
              <div key={step} className="text-muted-foreground">
                - {step}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pickByLanguage(language, { ru: 'Поток возможностей', en: 'Opportunity flow', th: 'โฟลว์ของโอกาส' })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {opportunities.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              opportunities.data.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{getLocalizedOpportunityTitle(language, item.title, item.metadata)}</div>
                    <Badge variant="outline">{item.stage}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    fit {item.fitScore ?? '-'} | reliability {item.reliabilityScore ?? '-'} | execution {item.executionScore ?? '-'}
                  </div>
                </div>
              ))
            )}
            <Badge variant="secondary">
              {pickByLanguage(language, { ru: 'Источник данных', en: 'Data source', th: 'แหล่งข้อมูล' })}: {opportunities.source}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pickByLanguage(language, { ru: 'Политика монетизации', en: 'Monetization policy', th: 'นโยบายการสร้างรายได้' })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {INVESTMENT_MONETIZATION_RULES.map((rule) => (
              <div key={rule.id} className="rounded-lg border p-3">
                <div className="font-medium">
                  {pickByLanguage(language, { ru: rule.titleRu, en: rule.titleEn, th: rule.titleTh })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {pickByLanguage(language, { ru: rule.descriptionRu, en: rule.descriptionEn, th: rule.descriptionTh })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pickByLanguage(language, { ru: 'Rollout и KPI', en: 'Rollout and KPI', th: 'Rollout และ KPI' })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {INVESTMENT_HUB_ROLLOUT.map((stage) => (
              <div key={stage.id} className="rounded-lg border p-3">
                <div className="font-medium">
                  {pickByLanguage(language, { ru: stage.titleRu, en: stage.titleEn, th: stage.titleTh })}
                </div>
              </div>
            ))}
            <div className="grid gap-2">
              {INVESTMENT_HUB_KPIS.map((kpi) => (
                <div key={kpi.key} className="text-sm text-muted-foreground">
                  {pickByLanguage(language, { ru: kpi.labelRu, en: kpi.labelEn, th: kpi.labelTh })}: {kpi.target}
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.CAPITAL_PIPELINE)}>
              {pickByLanguage(language, { ru: 'Открыть Capital Pipeline', en: 'Open Capital Pipeline', th: 'เปิด Capital Pipeline' })}
            </Button>
            {introRequests.data?.length ? (
              <div className="text-xs text-muted-foreground">
                {pickByLanguage(language, { ru: 'Последние intro requests', en: 'Recent intro requests', th: 'คำขอ intro ล่าสุด' })}: {introRequests.data.length}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </MiniAppLayout>
  );
}
