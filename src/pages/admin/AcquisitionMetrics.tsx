import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAcquisitionMetrics, useAirbnbMetrics } from "@/hooks/useAcquisitionMetrics";

import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, DollarSign, Users, Building2, Ship, MapPin,
  Target, Repeat, ArrowRightLeft, Percent, Activity, Home
} from "lucide-react";
import { format } from "date-fns";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AcquisitionMetrics() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { hasRole, isLoading: adminLoading } = useUserRoles();
  const isAdmin = hasRole('admin');
  const [period, setPeriod] = useState(30);
  
  const { 
    platformMetrics, 
    cohortMetrics, 
    verticalSummary, 
    crossSellMatrix,
    summary,
    isLoading 
  } = useAcquisitionMetrics(period);
  
  const { airbnbMetrics } = useAirbnbMetrics(period);

  if (authLoading || adminLoading) {
    return (
      <>
        <PageContainer>
          <Skeleton className="h-96" />
        </PageContainer>
      </>
    );
  }

  if (!user || !isAdmin) {
    navigate("/");
    return null;
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Prepare chart data
  const ltvChartData = platformMetrics.map(m => ({
    date: format(new Date(m.date), "MMM d"),
    LTV: m.ltv || 0,
    AOV: m.avg_order_value || 0,
  }));

  const retentionChartData = cohortMetrics.map(m => ({
    cohort: format(new Date(m.cohort_date), "MMM d"),
    D1: m.d1_retention_rate || 0,
    D7: m.d7_retention_rate || 0,
    D30: m.d30_retention_rate || 0,
    D90: m.d90_retention_rate || 0,
  }));

  const verticalPieData = verticalSummary.slice(0, 6).map(v => ({
    name: v.vertical.charAt(0).toUpperCase() + v.vertical.slice(1),
    value: v.gmv,
  }));

  const crossSellData = Object.entries(crossSellMatrix).slice(0, 5).map(([from, toMap]) => ({
    from,
    ...Object.fromEntries(Object.entries(toMap).slice(0, 4)),
  }));

  return (
    <>
      <PageContainer>
        <PageHeader title="M&A Acquisition Metrics" />
        
        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={period === days ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(days)}
            >
              {days}D
            </Button>
          ))}
        </div>

        {/* Top KPIs for Acquirers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>LTV</span>
              </div>
              <p className="text-2xl font-bold mt-1">{formatCurrency(summary.avgLTV)}</p>
              <p className="text-xs text-muted-foreground">Per Customer</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>LTV/CAC</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summary.ltvCacRatio.toFixed(1)}x</p>
              <Badge variant={summary.ltvCacRatio >= 3 ? "default" : "secondary"} className="mt-1">
                {summary.ltvCacRatio >= 3 ? "Healthy" : "Growing"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Repeat className="h-4 w-4" />
                <span>Repeat Rate</span>
              </div>
              <p className="text-2xl font-bold mt-1">{formatPercent(summary.repeatPurchaseRate)}</p>
              <p className="text-xs text-muted-foreground">2+ Orders</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowRightLeft className="h-4 w-4" />
                <span>Cross-Sell</span>
              </div>
              <p className="text-2xl font-bold mt-1">{formatPercent(summary.crossSellRate)}</p>
              <p className="text-xs text-muted-foreground">2+ Verticals</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="unit-economics" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="unit-economics">Unit Economics</TabsTrigger>
            <TabsTrigger value="retention">Retention</TabsTrigger>
            <TabsTrigger value="verticals">Verticals</TabsTrigger>
            <TabsTrigger value="cross-sell">Cross-Sell</TabsTrigger>
            <TabsTrigger value="airbnb">Airbnb Fit</TabsTrigger>
          </TabsList>

          {/* Unit Economics Tab */}
          <TabsContent value="unit-economics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    LTV & AOV Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={ltvChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="LTV" stroke="hsl(var(--primary))" strokeWidth={2} />
                        <Line type="monotone" dataKey="AOV" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Health</CardTitle>
                  <CardDescription>Key unit economics indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Average Order Value</span>
                    <span className="font-bold">{formatCurrency(summary.avgOrderValue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Take Rate</span>
                    <span className="font-bold">{formatPercent(summary.avgTakeRate)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Gross Margin</span>
                    <span className="font-bold">{formatPercent(summary.grossMargin)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium">Customer Acquisition Cost</span>
                    <span className="font-bold">{formatCurrency(summary.avgCAC)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Retention Tab */}
          <TabsContent value="retention" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Cohort Retention Analysis
                </CardTitle>
                <CardDescription>User retention by signup cohort</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64" />
                ) : retentionChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={retentionChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="cohort" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, '']} />
                      <Legend />
                      <Bar dataKey="D1" fill="hsl(var(--primary))" />
                      <Bar dataKey="D7" fill="hsl(var(--chart-2))" />
                      <Bar dataKey="D30" fill="hsl(var(--chart-3))" />
                      <Bar dataKey="D90" fill="hsl(var(--chart-4))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No cohort data available yet
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{formatPercent(summary.avgD7Retention)}</p>
                  <p className="text-sm text-muted-foreground">D7 Retention</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{formatPercent(summary.avgD30Retention)}</p>
                  <p className="text-sm text-muted-foreground">D30 Retention</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">{formatPercent(summary.repeatPurchaseRate)}</p>
                  <p className="text-sm text-muted-foreground">Repeat Purchase</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">{formatPercent(summary.crossSellRate)}</p>
                  <p className="text-sm text-muted-foreground">Cross-Sell Rate</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Verticals Tab */}
          <TabsContent value="verticals" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>GMV by Vertical</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={verticalPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {verticalPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vertical Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                  {verticalSummary.map((v, i) => (
                    <div key={v.vertical} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium capitalize">{v.vertical}</p>
                          <p className="text-xs text-muted-foreground">{v.bookings} bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(v.gmv)}</p>
                        <p className="text-xs text-muted-foreground">AOV: {formatCurrency(v.avgAOV)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cross-Sell Tab */}
          <TabsContent value="cross-sell" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Cross-Sell Matrix
                </CardTitle>
                <CardDescription>Users who purchased in one vertical and then another</CardDescription>
              </CardHeader>
              <CardContent>
                {crossSellData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">From →</th>
                          {Object.keys(crossSellData[0] || {}).filter(k => k !== 'from').map(k => (
                            <th key={k} className="p-2 font-medium capitalize">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {crossSellData.map((row) => (
                          <tr key={row.from} className="border-b">
                            <td className="p-2 font-medium capitalize">{row.from}</td>
                            {Object.entries(row).filter(([k]) => k !== 'from').map(([k, v]) => (
                              <td key={k} className="p-2 text-center">
                                <Badge variant={Number(v) > 10 ? "default" : "secondary"}>
                                  {v}
                                </Badge>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    Cross-sell data will appear as users use multiple verticals
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Super-App Value Proposition</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-4xl font-bold">{verticalSummary.length}</p>
                  <p className="text-sm text-muted-foreground">Active Verticals</p>
                </div>
                <div className="p-4 bg-success/10 rounded-lg text-center">
                  <p className="text-4xl font-bold">{formatPercent(summary.crossSellRate)}</p>
                  <p className="text-sm text-muted-foreground">Cross-Sell Rate</p>
                </div>
                <div className="p-4 bg-info/10 rounded-lg text-center">
                  <p className="text-4xl font-bold">{summary.ltvCacRatio.toFixed(1)}x</p>
                  <p className="text-sm text-muted-foreground">LTV/CAC Multiplier</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Airbnb Fit Tab */}
          <TabsContent value="airbnb" className="space-y-6">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Airbnb Strategic Fit Analysis
                </CardTitle>
                <CardDescription>Metrics aligned with Airbnb's core business</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Properties Section */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Stays (Core)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Listings</span>
                        <span className="font-bold">{airbnbMetrics.propertyListings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Occupancy</span>
                        <span className="font-bold">{formatPercent(airbnbMetrics.propertyOccupancyRate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">ADR</span>
                        <span className="font-bold">{formatCurrency(airbnbMetrics.propertyADR)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">RevPAR</span>
                        <span className="font-bold">{formatCurrency(airbnbMetrics.propertyRevPAR)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-medium">GMV</span>
                        <span className="font-bold text-primary">{formatCurrency(airbnbMetrics.propertyGMV)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Experiences Section */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Experiences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Tours</span>
                        <span className="font-bold">{airbnbMetrics.toursCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Rating</span>
                        <span className="font-bold">{airbnbMetrics.toursAvgRating.toFixed(1)} ⭐</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-medium">GMV</span>
                        <span className="font-bold text-primary">{formatCurrency(airbnbMetrics.toursGMV)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Luxe Section */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Ship className="h-4 w-4" />
                        Luxe Tier
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Yachts</span>
                        <span className="font-bold">{airbnbMetrics.yachtsCount}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-medium">GMV</span>
                        <span className="font-bold text-primary">{formatCurrency(airbnbMetrics.yachtsGMV)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strategic Value for Airbnb</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">💡 Acquisition Rationale</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span><strong>Market Expansion:</strong> Access to Russian-speaking tourists in Thailand</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span><strong>Super-App Model:</strong> Proven cross-sell at {formatPercent(airbnbMetrics.crossSellRate)}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span><strong>Experience Integration:</strong> {airbnbMetrics.toursCount} tour experiences ready</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span><strong>Luxury Segment:</strong> {airbnbMetrics.yachtsCount} yachts for Airbnb Luxe</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">📊 Key Metrics Summary</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-2xl font-bold">{airbnbMetrics.uniqueVerticals}</p>
                        <p className="text-xs text-muted-foreground">Verticals</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-2xl font-bold">{formatCurrency(airbnbMetrics.totalGMV)}</p>
                        <p className="text-xs text-muted-foreground">Combined GMV</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-2xl font-bold">{formatPercent(airbnbMetrics.crossSellRate)}</p>
                        <p className="text-xs text-muted-foreground">Cross-Sell</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-2xl font-bold">{summary.ltvCacRatio.toFixed(1)}x</p>
                        <p className="text-xs text-muted-foreground">LTV/CAC</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
