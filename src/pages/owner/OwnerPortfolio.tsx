import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { usePropertyFinancialsFull, useFinancialStats, EXPENSE_CATEGORIES } from '@/hooks/usePropertyFinancials';
import { useAllPropertyBookings } from '@/hooks/usePropertyBookings';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, TrendingDown, DollarSign, Home, 
  Calendar, PieChart, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { format, subDays, differenceInDays, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function OwnerPortfolio() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { data: properties, isLoading: propertiesLoading } = useOwnerProperties();
  const { data: financials, isLoading: financialsLoading } = usePropertyFinancialsFull();
  const { data: stats } = useFinancialStats();
  const { bookings, isLoading: bookingsLoading } = useAllPropertyBookings();

  const isLoading = propertiesLoading || financialsLoading || bookingsLoading;

  // Calculate property-level metrics
  const propertyMetrics = useMemo(() => {
    if (!properties || !financials || !bookings) return [];

    const last30Days = {
      start: subDays(new Date(), 30),
      end: new Date(),
    };

    return properties.map(property => {
      // Financials for this property
      const propertyFinancials = financials.filter(f => f.property_id === property.id);
      const income = propertyFinancials
        .filter(f => f.transaction_type === 'income')
        .reduce((sum, f) => sum + Number(f.amount), 0);
      const expenses = propertyFinancials
        .filter(f => f.transaction_type === 'expense')
        .reduce((sum, f) => sum + Number(f.amount), 0);
      const netProfit = income - expenses;

      // Bookings for this property
      const propertyBookings = bookings.filter(b => b.property_id === property.id);
      
      // Calculate occupancy (last 30 days)
      let bookedDays = 0;
      propertyBookings.forEach(booking => {
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        
        // Count days within last 30 days
        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
          if (isWithinInterval(d, last30Days)) {
            bookedDays++;
          }
        }
      });
      const occupancyRate = Math.min((bookedDays / 30) * 100, 100);

      // Average nightly rate
      const confirmedBookings = propertyBookings.filter(b => 
        b.status === 'confirmed' && b.total_amount && b.total_amount > 0
      );
      const avgNightlyRate = confirmedBookings.length > 0
        ? confirmedBookings.reduce((sum, b) => {
            const nights = differenceInDays(new Date(b.check_out), new Date(b.check_in));
            return sum + (Number(b.total_amount) / Math.max(nights, 1));
          }, 0) / confirmedBookings.length
        : property.price_per_night || 0;

      // Simple ROI calculation (annual projection based on current data)
      const monthlyNet = netProfit; // Assuming data is for ~1 month
      const annualProjection = monthlyNet * 12;
      const estimatedValue = (property.price_per_night || 0) * 365 * 0.6; // Rough estimate
      const roi = estimatedValue > 0 ? (annualProjection / estimatedValue) * 100 : 0;

      return {
        id: property.id,
        title: isRu && property.title_ru ? property.title_ru : property.title,
        coverImage: property.cover_image,
        income,
        expenses,
        netProfit,
        occupancyRate,
        avgNightlyRate,
        roi,
        totalBookings: propertyBookings.length,
      };
    });
  }, [properties, financials, bookings, isRu]);

  // Expense breakdown by category
  const expensesByCategory = useMemo(() => {
    if (!financials) return [];

    const categoryTotals: Record<string, number> = {};
    financials
      .filter(f => f.transaction_type === 'expense')
      .forEach(f => {
        const cat = f.category || 'other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(f.amount);
      });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => {
        const catInfo = EXPENSE_CATEGORIES.find(c => c.value === category);
        return {
          name: catInfo ? (isRu ? catInfo.labelRu : catInfo.labelEn) : category,
          value: amount,
          category,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [financials, isRu]);

  // Portfolio totals
  const totals = useMemo(() => {
    const totalIncome = propertyMetrics.reduce((sum, p) => sum + p.income, 0);
    const totalExpenses = propertyMetrics.reduce((sum, p) => sum + p.expenses, 0);
    const avgOccupancy = propertyMetrics.length > 0
      ? propertyMetrics.reduce((sum, p) => sum + p.occupancyRate, 0) / propertyMetrics.length
      : 0;
    
    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      avgOccupancy,
      propertyCount: properties?.length || 0,
    };
  }, [propertyMetrics, properties]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `฿${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `฿${(value / 1000).toFixed(0)}K`;
    return `฿${value.toFixed(0)}`;
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <PageContainer>
      <BackButton fallbackPath="/owner" />
      <PageHeader 
        title={isRu ? 'Аналитика портфеля' : 'Portfolio Analytics'}
        subtitle={isRu ? 'Обзор всех объектов' : 'Overview of all properties'}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Доходы' : 'Income'}
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className="text-xl font-bold text-success">
                {formatCurrency(totals.totalIncome)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Расходы' : 'Expenses'}
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className="text-xl font-bold text-destructive">
                {formatCurrency(totals.totalExpenses)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Чистая прибыль' : 'Net Profit'}
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className={`text-xl font-bold ${totals.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(totals.netProfit)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-info/10 to-info/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-info" />
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Загрузка' : 'Occupancy'}
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className="text-xl font-bold text-info">
                {totals.avgOccupancy.toFixed(0)}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Property Comparison Table */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {isRu ? 'Сравнение объектов' : 'Property Comparison'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : propertyMetrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{isRu ? 'Нет объектов для анализа' : 'No properties to analyze'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {propertyMetrics.map((property, index) => (
                <div 
                  key={property.id}
                  className="p-3 rounded-none border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/mc/properties/${property.id}`)}
                >
                  <div className="flex items-start gap-3">
                    {property.coverImage ? (
                      <img 
                        src={property.coverImage} 
                        alt={property.title}
                        className="w-16 h-12 rounded-none object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded-none bg-muted flex items-center justify-center flex-shrink-0">
                        <Home className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{property.title}</p>
                      
                      <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">{isRu ? 'Доход' : 'Income'}</p>
                          <p className="font-medium text-success">{formatCurrency(property.income)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{isRu ? 'Расход' : 'Expense'}</p>
                          <p className="font-medium text-destructive">{formatCurrency(property.expenses)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{isRu ? 'Загр.' : 'Occ.'}</p>
                          <p className="font-medium">{property.occupancyRate.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{isRu ? 'Ночь' : 'Night'}</p>
                          <p className="font-medium">฿{property.avgNightlyRate.toFixed(0)}</p>
                        </div>
                      </div>
                      
                      {/* Occupancy Progress Bar */}
                      <div className="mt-2">
                        <Progress value={property.occupancyRate} className="h-1.5" />
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <Badge 
                        variant={property.netProfit >= 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {property.netProfit >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {formatCurrency(property.netProfit)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Category Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            {isRu ? 'Расходы по категориям' : 'Expenses by Category'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : expensesByCategory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {isRu ? 'Нет данных о расходах' : 'No expense data'}
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend 
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
