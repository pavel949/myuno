import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  Download
} from 'lucide-react';

export function MCCAnalyticsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Mock channel performance data
  const channelPerformance = [
    { channel: 'Google Ads', impressions: 125000, clicks: 4200, leads: 892, conversions: 127, spend: 2340, revenue: 8900, roas: 3.8 },
    { channel: 'Meta Ads', impressions: 89000, clicks: 2800, leads: 567, conversions: 78, spend: 1560, revenue: 5200, roas: 3.3 },
    { channel: 'TikTok', impressions: 234000, clicks: 5600, leads: 234, conversions: 23, spend: 890, revenue: 1800, roas: 2.0 },
    { channel: 'Organic', impressions: 45000, clicks: 3200, leads: 456, conversions: 89, spend: 0, revenue: 4500, roas: null },
    { channel: 'Email', impressions: 12000, clicks: 1800, leads: 234, conversions: 67, spend: 120, revenue: 3400, roas: 28.3 },
    { channel: 'WhatsApp', impressions: 3400, clicks: 890, leads: 123, conversions: 45, spend: 50, revenue: 2100, roas: 42.0 },
  ];

  // Attribution models
  const attributionModels = [
    { model: 'Last Click', conversions: 429, revenue: 25900 },
    { model: 'First Click', conversions: 389, revenue: 23400 },
    { model: 'Linear', conversions: 412, revenue: 24800 },
    { model: 'Time Decay', conversions: 421, revenue: 25200 },
    { model: 'Position-Based', conversions: 418, revenue: 25100 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {isRu ? 'Аналитика и атрибуция' : 'Analytics & Attribution'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Полная картина эффективности маркетинга' : 'Complete view of marketing performance'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="30d">
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{isRu ? '7 дней' : '7 days'}</SelectItem>
              <SelectItem value="30d">{isRu ? '30 дней' : '30 days'}</SelectItem>
              <SelectItem value="90d">{isRu ? '90 дней' : '90 days'}</SelectItem>
              <SelectItem value="ytd">{isRu ? 'С начала года' : 'Year to date'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {isRu ? 'Экспорт' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">{isRu ? 'Общий расход' : 'Total Spend'}</p>
                <p className="text-2xl font-bold">$4,960</p>
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs prev
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">{isRu ? 'Выручка' : 'Revenue'}</p>
                <p className="text-2xl font-bold">$25,900</p>
                <div className="flex items-center gap-1 text-xs text-success">
                  <TrendingUp className="h-3 w-3" />
                  +18% vs prev
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">ROAS</p>
                <p className="text-2xl font-bold">5.2x</p>
                <div className="flex items-center gap-1 text-xs text-success">
                  <TrendingUp className="h-3 w-3" />
                  +0.4x vs prev
                </div>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">CAC</p>
                <p className="text-2xl font-bold">$11.57</p>
                <div className="flex items-center gap-1 text-xs text-success">
                  <TrendingDown className="h-3 w-3" />
                  -8% vs prev
                </div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isRu ? 'Эффективность по каналам' : 'Channel Performance'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">{isRu ? 'Канал' : 'Channel'}</th>
                  <th className="text-right p-3 font-medium">{isRu ? 'Показы' : 'Impressions'}</th>
                  <th className="text-right p-3 font-medium">{isRu ? 'Клики' : 'Clicks'}</th>
                  <th className="text-right p-3 font-medium">{isRu ? 'Лиды' : 'Leads'}</th>
                  <th className="text-right p-3 font-medium">{isRu ? 'Конверсии' : 'Conversions'}</th>
                  <th className="text-right p-3 font-medium">{isRu ? 'Расход' : 'Spend'}</th>
                  <th className="text-right p-3 font-medium">{isRu ? 'Выручка' : 'Revenue'}</th>
                  <th className="text-right p-3 font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {channelPerformance.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3 font-medium">{row.channel}</td>
                    <td className="p-3 text-right">{row.impressions.toLocaleString()}</td>
                    <td className="p-3 text-right">{row.clicks.toLocaleString()}</td>
                    <td className="p-3 text-right">{row.leads.toLocaleString()}</td>
                    <td className="p-3 text-right">{row.conversions}</td>
                    <td className="p-3 text-right">${row.spend.toLocaleString()}</td>
                    <td className="p-3 text-right">${row.revenue.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      {row.roas ? (
                        <Badge variant={row.roas >= 3 ? 'default' : 'secondary'}>
                          {row.roas}x
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 font-medium">
                <tr>
                  <td className="p-3">{isRu ? 'Итого' : 'Total'}</td>
                  <td className="p-3 text-right">508,400</td>
                  <td className="p-3 text-right">18,490</td>
                  <td className="p-3 text-right">2,506</td>
                  <td className="p-3 text-right">429</td>
                  <td className="p-3 text-right">$4,960</td>
                  <td className="p-3 text-right">$25,900</td>
                  <td className="p-3 text-right"><Badge>5.2x</Badge></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Attribution Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isRu ? 'Сравнение моделей атрибуции' : 'Attribution Model Comparison'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {attributionModels.map((model, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">{model.model}</p>
                <p className="text-lg font-bold">{model.conversions}</p>
                <p className="text-xs text-muted-foreground">${model.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
