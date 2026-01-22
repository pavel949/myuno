import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

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
          <CardTitle className="text-base font-medium">
            {isRussian ? 'По вертикалям' : 'By Vertical'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              {isRussian ? 'Загрузка...' : 'Loading...'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by count descending and take top 8
  const sortedData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(item => ({
      ...item,
      displayName: isRussian ? item.nameRu : item.name,
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {isRussian ? 'По вертикалям' : 'By Vertical'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={sortedData} 
              layout="vertical"
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis 
                type="number"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="category"
                dataKey="displayName"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [
                  value.toLocaleString(),
                  isRussian ? 'Количество' : 'Count'
                ]}
              />
              <Bar 
                dataKey="count" 
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
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
