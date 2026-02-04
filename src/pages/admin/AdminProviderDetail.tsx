import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProviderDetails } from '@/hooks/useProviderDetails';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Building2, 
  Package, 
  ShoppingCart, 
  FileText, 
  CalendarCheck,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle,
  XCircle,
  Star,
  DollarSign,
  Edit,
  Plus,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  Handshake
} from 'lucide-react';
import { format } from 'date-fns';
import { ContentCreatorMenu } from '@/components/admin/ContentCreatorMenu';
import { ProviderContractEditor } from '@/components/admin/ProviderContractEditor';

export default function AdminProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [activeTab, setActiveTab] = useState('overview');

  const { provider, services, products, contracts, bookings, isLoading, error } = useProviderDetails(id || null);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="font-medium mb-2">
              {isRussian ? 'Провайдер не найден' : 'Provider not found'}
            </h3>
            <Button variant="outline" onClick={() => navigate('/admin/providers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isRussian ? 'Назад к списку' : 'Back to list'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeServicesCount = services.filter(s => s.is_active).length;
  const activeProductsCount = products.filter(p => p.is_active).length;
  const activeContractsCount = contracts.filter(c => c.status === 'active').length;

  const formatCurrency = (amount: number, currency: string = 'THB') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending: 'secondary',
      confirmed: 'default',
      completed: 'default',
      cancelled: 'destructive',
      expired: 'destructive',
      terminated: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/providers')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{provider.name}</h1>
            {provider.is_verified ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {isRussian ? 'Верифицирован' : 'Verified'}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <XCircle className="h-3 w-3" />
                {isRussian ? 'Не верифицирован' : 'Not Verified'}
              </Badge>
            )}
            {!provider.is_active && (
              <Badge variant="destructive">
                {isRussian ? 'Неактивен' : 'Inactive'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{provider.business_category}</p>
        </div>
        <div className="flex items-center gap-2">
          <ContentCreatorMenu 
            providerId={provider.id} 
            providerName={provider.name}
            size="sm"
          />
          <Button variant="outline" onClick={() => navigate(`/admin/providers?edit=${provider.id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            {isRussian ? 'Редактировать' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeServicesCount}</p>
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Активных услуг' : 'Active Services'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeProductsCount}</p>
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Товаров' : 'Products'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeContractsCount}</p>
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Контрактов' : 'Contracts'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{provider.rating?.toFixed(1) || '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {provider.review_count || 0} {isRussian ? 'отзывов' : 'reviews'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 max-w-3xl">
          <TabsTrigger value="overview" className="gap-1">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Обзор' : 'Overview'}</span>
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="gap-1">
            <Handshake className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Условия' : 'Terms'}</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Услуги' : 'Services'}</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">{services.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Товары' : 'Products'}</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">{products.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Контракты' : 'Contracts'}</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">{contracts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1">
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Заказы' : 'Bookings'}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Contact Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  {isRussian ? 'Контактная информация' : 'Contact Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {provider.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.email}</span>
                  </div>
                )}
                {provider.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.phone}</span>
                  </div>
                )}
                {provider.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      {provider.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {provider.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.address}</span>
                  </div>
                )}
                {provider.description_en && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      {isRussian ? provider.description_ru : provider.description_en}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {isRussian ? 'Финансы' : 'Financials'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {isRussian ? 'К выплате' : 'Pending Payout'}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(provider.pending_payout || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {isRussian ? 'Всего заработано' : 'Total Earnings'}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(provider.total_earnings || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {isRussian ? 'Комиссия' : 'Commission Rate'}
                  </span>
                  <span className="font-semibold">
                    {provider.commission_rate ? `${provider.commission_rate}%` : '—'}
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    {isRussian ? 'Создан' : 'Created'}: {format(new Date(provider.created_at), 'dd MMM yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Collaboration Tab - Inline Contract Editor */}
        <TabsContent value="collaboration" className="mt-4">
          <div className="max-w-2xl">
            <ProviderContractEditor 
              providerId={provider.id} 
              providerName={provider.name}
            />
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{isRussian ? 'Услуги' : 'Services'}</CardTitle>
                <CardDescription>
                  {services.length} {isRussian ? 'услуг' : 'services'} ({activeServicesCount} {isRussian ? 'активных' : 'active'})
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate(`/admin/services?provider=${provider.id}&action=new`)}>
                <Plus className="h-4 w-4 mr-1" />
                {isRussian ? 'Добавить' : 'Add'}
              </Button>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isRussian ? 'Нет услуг' : 'No services'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRussian ? 'Название' : 'Name'}</TableHead>
                      <TableHead>{isRussian ? 'Цена' : 'Price'}</TableHead>
                      <TableHead>{isRussian ? 'Рейтинг' : 'Rating'}</TableHead>
                      <TableHead>{isRussian ? 'Статус' : 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/services?edit=${service.id}`)}>
                        <TableCell className="font-medium">
                          {isRussian ? service.name_ru : service.name_en}
                          {service.is_featured && <Badge variant="secondary" className="ml-2">★</Badge>}
                        </TableCell>
                        <TableCell>
                          {service.price ? formatCurrency(service.price, service.currency) : '—'}
                        </TableCell>
                        <TableCell>
                          {service.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              {service.rating.toFixed(1)}
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {service.is_active ? (
                            <Badge variant="default">{isRussian ? 'Активна' : 'Active'}</Badge>
                          ) : (
                            <Badge variant="secondary">{isRussian ? 'Неактивна' : 'Inactive'}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{isRussian ? 'Товары' : 'Products'}</CardTitle>
                <CardDescription>
                  {products.length} {isRussian ? 'товаров' : 'products'} ({activeProductsCount} {isRussian ? 'активных' : 'active'})
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate(`/admin/marketplace/products?provider=${provider.id}&action=new`)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isRussian ? 'Добавить' : 'Add'}
              </Button>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isRussian ? 'Нет товаров (провайдер не связан с вендором маркетплейса)' : 'No products (provider not linked to marketplace vendor)'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRussian ? 'Название' : 'Name'}</TableHead>
                      <TableHead>{isRussian ? 'Цена' : 'Price'}</TableHead>
                      <TableHead>{isRussian ? 'Остаток' : 'Stock'}</TableHead>
                      <TableHead>{isRussian ? 'Статус' : 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {isRussian ? product.name_ru : product.name_en}
                        </TableCell>
                        <TableCell>{formatCurrency(product.price, product.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={product.stock_quantity > 0 ? 'outline' : 'destructive'}>
                            {product.stock_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.is_active ? (
                            <Badge variant="default">{isRussian ? 'Активен' : 'Active'}</Badge>
                          ) : (
                            <Badge variant="secondary">{isRussian ? 'Неактивен' : 'Inactive'}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{isRussian ? 'Контракты' : 'Contracts'}</CardTitle>
                <CardDescription>
                  {contracts.length} {isRussian ? 'контрактов' : 'contracts'}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate(`/admin/contracts?provider=${provider.id}&action=new`)}>
                <Plus className="h-4 w-4 mr-1" />
                {isRussian ? 'Добавить' : 'Add'}
              </Button>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isRussian ? 'Нет контрактов' : 'No contracts'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRussian ? 'Тип' : 'Type'}</TableHead>
                      <TableHead>{isRussian ? 'Комиссия' : 'Commission'}</TableHead>
                      <TableHead>{isRussian ? 'Период' : 'Period'}</TableHead>
                      <TableHead>{isRussian ? 'Статус' : 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/contracts?edit=${contract.id}`)}>
                        <TableCell className="font-medium capitalize">{contract.contract_type}</TableCell>
                        <TableCell>
                          {contract.commission_rate ? `${contract.commission_rate}%` : '—'}
                        </TableCell>
                        <TableCell>
                          {contract.valid_from ? format(new Date(contract.valid_from), 'dd MMM yyyy') : '—'}
                          {contract.valid_until ? ` — ${format(new Date(contract.valid_until), 'dd MMM yyyy')}` : ''}
                        </TableCell>
                        <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isRussian ? 'Последние заказы' : 'Recent Bookings'}</CardTitle>
              <CardDescription>
                {isRussian ? 'Последние 20 заказов' : 'Last 20 bookings'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isRussian ? 'Нет заказов' : 'No bookings'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRussian ? 'Услуга' : 'Service'}</TableHead>
                      <TableHead>{isRussian ? 'Сумма' : 'Amount'}</TableHead>
                      <TableHead>{isRussian ? 'Дата' : 'Date'}</TableHead>
                      <TableHead>{isRussian ? 'Статус' : 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.service_name || '—'}</TableCell>
                        <TableCell>
                          {booking.total_amount ? formatCurrency(booking.total_amount, booking.currency || 'THB') : '—'}
                        </TableCell>
                        <TableCell>
                          {booking.scheduled_at ? format(new Date(booking.scheduled_at), 'dd MMM yyyy HH:mm') : format(new Date(booking.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
