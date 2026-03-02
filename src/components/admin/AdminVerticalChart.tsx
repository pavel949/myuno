import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { CHART_THEME } from '@/lib/chartTheme';

interface VerticalData {
  name: string;
  nameRu: string;
  count: number;
  color: string;
}

interface AdminVerticalChartProps {
  data: VerticalData[];
  loading?: boolean;
}

export function AdminVerticalChart({ data, loading }: AdminVerticalChartProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium tracking-[-0.01em]">
            {isRussian ? 'По вертикалям' : 'By Vertical'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">
              {isRussian ? 'Загрузка...' : 'Loading...'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item, i) => ({
      ...item,
      displayName: isRussian ? item.nameRu : item.name,
      color: item.color || CHART_THEME.palette[i % CHART_THEME.palette.length],
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium tracking-[-0.01em]">
          {isRussian ? 'По вертикалям' : 'By Vertical'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={sortedData} 
              layout="vertical"
              margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
            >
              <XAxis 
                type="number"
                tick={CHART_THEME.axisTick}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="category"
                dataKey="displayName"
                tick={{ ...CHART_THEME.axisTick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip 
                contentStyle={CHART_THEME.tooltip}
                labelStyle={CHART_THEME.tooltipLabel}
                formatter={(value: number) => [
                  value.toLocaleString(),
                  isRussian ? 'Количество' : 'Count'
                ]}
              />
              <Bar 
                dataKey="count" 
                radius={CHART_THEME.bar.radiusHorizontal}
                maxBarSize={22}
                animationDuration={CHART_THEME.bar.animationDuration}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
