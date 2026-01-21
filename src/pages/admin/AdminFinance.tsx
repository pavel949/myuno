import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Users, CreditCard, PiggyBank, Percent,
  ArrowUpRight, ArrowDownRight, Settings, Wallet, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAdminFinance, getVerticalLabel } from '@/hooks/useAdminFinance';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CommissionRulesEditor } from '@/components/admin/CommissionRulesEditor';
import { PayoutManager } from '@/components/admin/PayoutManager';
import { ProviderFinanceTable } from '@/components/admin/ProviderFinanceTable';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

function formatCurrency(amount: number, currency = 'THB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function AdminFinance() {
  const [days, setDays] = useState(30);
  const { summary, byVertical, byProvider, dailyData, isLoading } = useAdminFinance(days);

  const periodOptions = [
    { label: '7 дней', value: 7 },
    { label: '30 дней', value: 30 },
    { label: '90 дней', value: 90 },
  ];

  const summaryCards = [
    {
      title: 'GMV',
      value: formatCurrency(summary?.totalGmv || 0),
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      description: 'Общий объём продаж',
    },
    {
      title: 'Доход платформы',
      value: formatCurrency(summary?.platformRevenue || 0),
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      description: 'Комиссия с заказов',
    },
    {
      title: 'Выплаты вендорам',
      value: formatCurrency(summary?.vendorPayouts || 0),
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      description: 'Заработок партнёров',
    },
    {
      title: 'К выплате',
      value: formatCurrency(summary?.pendingPayouts || 0),
      icon: Wallet,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      description: 'Ожидает обработки',
    },
    {
      title: 'Подписки',
      value: formatCurrency(summary?.subscriptionRevenue || 0),
      icon: CreditCard,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      description: 'Доход с подписок',
    },
    {
      title: 'Ср. Take Rate',
      value: formatPercent(summary?.averageTakeRate || 0),
      icon: Percent,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      description: 'Средняя комиссия',
    },
  ];

  const chartData = dailyData.map(d => ({
    ...d,
    dateLabel: format(new Date(d.date), 'd MMM', { locale: ru }),
  }));

  const pieData = byVertical.map((v, i) => ({
    name: v.verticalLabel,
    value: v.gmv,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              Финансы
            </h1>
            <p className="text-muted-foreground mt-1">
              Аналитика доходов и управление комиссиями
            </p>
          </div>

          <div className="flex gap-2">
            {periodOptions.map((option) => (
              <Button
                key={option.value}
                variant={days === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDays(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center mb-3`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-foreground">
                    {isLoading ? '...' : card.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {card.title}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="verticals">Вертикали</TabsTrigger>
            <TabsTrigger value="providers">Провайдеры</TabsTrigger>
            <TabsTrigger value="commissions">Комиссии</TabsTrigger>
            <TabsTrigger value="payouts">Выплаты</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Динамика доходов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="dateLabel" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => `Дата: ${label}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="gmv" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorGmv)" 
                          name="GMV"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="platformRevenue" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                          name="Доход"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Verticals Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Распределение по вертикалям</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Verticals Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Доход по вертикалям</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byVertical.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                      <YAxis type="category" dataKey="verticalLabel" width={120} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="platformRevenue" fill="#3b82f6" name="Доход" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="gmv" fill="#10b981" name="GMV" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verticals Tab */}
          <TabsContent value="verticals">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Аналитика по вертикалям</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Вертикаль</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">GMV</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Доход</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Take Rate</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Заказов</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byVertical.map((v, index) => (
                        <motion.tr
                          key={v.vertical}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border/50 hover:bg-muted/50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="font-medium">{v.verticalLabel}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            {formatCurrency(v.gmv)}
                          </td>
                          <td className="text-right py-3 px-4 text-emerald-600 font-medium">
                            {formatCurrency(v.platformRevenue)}
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded-md text-sm">
                              {formatPercent(v.takeRate)}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-muted-foreground">
                            {v.orderCount}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-bold">
                        <td className="py-3 px-4">Итого</td>
                        <td className="text-right py-3 px-4">
                          {formatCurrency(summary?.totalGmv || 0)}
                        </td>
                        <td className="text-right py-3 px-4 text-emerald-600">
                          {formatCurrency(summary?.platformRevenue || 0)}
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded-md text-sm">
                            {formatPercent(summary?.averageTakeRate || 0)}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {summary?.orderCount || 0}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers">
            <ProviderFinanceTable providers={byProvider} isLoading={isLoading} />
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <CommissionRulesEditor />
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <PayoutManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
