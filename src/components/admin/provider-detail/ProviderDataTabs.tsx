import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Star } from 'lucide-react';
import { format } from 'date-fns';
import type { ProviderService, ProviderProduct, ProviderContract, ProviderBooking } from '@/hooks/useProviderDetails';

function formatCurrency(amount: number, currency = 'THB') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default', pending: 'secondary', confirmed: 'default', completed: 'default',
    cancelled: 'destructive', expired: 'destructive', terminated: 'destructive',
  };
  return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
}

// Services
export function ProviderServicesTab({ services, providerId }: { services: ProviderService[]; providerId: string }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const activeCount = services.filter(s => s.is_active).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{isRu ? 'Услуги' : 'Services'}</CardTitle>
          <CardDescription>{services.length} {isRu ? 'услуг' : 'services'} ({activeCount} {isRu ? 'активных' : 'active'})</CardDescription>
        </div>
        <Button size="sm" onClick={() => navigate(`/admin/services?provider=${providerId}&action=new`)}>
          <Plus className="h-4 w-4 mr-1" />{isRu ? 'Добавить' : 'Add'}
        </Button>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{isRu ? 'Нет услуг' : 'No services'}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRu ? 'Название' : 'Name'}</TableHead>
                <TableHead>{isRu ? 'Цена' : 'Price'}</TableHead>
                <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/services?edit=${s.id}`)}>
                  <TableCell className="font-medium">{isRu ? s.name_ru : s.name_en}</TableCell>
                  <TableCell>{s.price ? formatCurrency(s.price, s.currency) : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? (isRu ? 'Активна' : 'Active') : (isRu ? 'Неактивна' : 'Inactive')}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Products
export function ProviderProductsTab({ products, providerId }: { products: ProviderProduct[]; providerId: string }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const activeCount = products.filter(p => p.is_active).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{isRu ? 'Товары' : 'Products'}</CardTitle>
          <CardDescription>{products.length} {isRu ? 'товаров' : 'products'} ({activeCount} {isRu ? 'активных' : 'active'})</CardDescription>
        </div>
        <Button size="sm" onClick={() => navigate(`/admin/catalog?provider=${providerId}&action=new`)}>
          <Plus className="h-4 w-4 mr-1" />{isRu ? 'Добавить' : 'Add'}
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{isRu ? 'Нет товаров' : 'No products'}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRu ? 'Название' : 'Name'}</TableHead>
                <TableHead>{isRu ? 'Цена' : 'Price'}</TableHead>
                <TableHead>{isRu ? 'Остаток' : 'Stock'}</TableHead>
                <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{isRu ? p.name_ru : p.name_en}</TableCell>
                  <TableCell>{formatCurrency(p.price, p.currency)}</TableCell>
                  <TableCell><Badge variant={p.stock_quantity > 0 ? 'outline' : 'destructive'}>{p.stock_quantity}</Badge></TableCell>
                  <TableCell><Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? (isRu ? 'Активен' : 'Active') : (isRu ? 'Неактивен' : 'Inactive')}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Contracts
export function ProviderContractsTab({ contracts, providerId }: { contracts: ProviderContract[]; providerId: string }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{isRu ? 'Контракты' : 'Contracts'}</CardTitle>
          <CardDescription>{contracts.length} {isRu ? 'контрактов' : 'contracts'}</CardDescription>
        </div>
        <Button size="sm" onClick={() => navigate(`/admin/contracts?provider=${providerId}&action=new`)}>
          <Plus className="h-4 w-4 mr-1" />{isRu ? 'Добавить' : 'Add'}
        </Button>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{isRu ? 'Нет контрактов' : 'No contracts'}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRu ? 'Тип' : 'Type'}</TableHead>
                <TableHead>{isRu ? 'Комиссия' : 'Commission'}</TableHead>
                <TableHead>{isRu ? 'Период' : 'Period'}</TableHead>
                <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/contracts?edit=${c.id}`)}>
                  <TableCell className="font-medium capitalize">{c.contract_type}</TableCell>
                  <TableCell>{c.commission_rate ? `${c.commission_rate}%` : '—'}</TableCell>
                  <TableCell>
                    {c.valid_from ? format(new Date(c.valid_from), 'dd MMM yyyy') : '—'}
                    {c.valid_until ? ` — ${format(new Date(c.valid_until), 'dd MMM yyyy')}` : ''}
                  </TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Bookings
export function ProviderBookingsTab({ bookings }: { bookings: ProviderBooking[] }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{isRu ? 'Последние заказы' : 'Recent Bookings'}</CardTitle>
        <CardDescription>{isRu ? 'Последние 20 заказов' : 'Last 20 bookings'}</CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{isRu ? 'Нет заказов' : 'No bookings'}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRu ? 'Услуга' : 'Service'}</TableHead>
                <TableHead>{isRu ? 'Сумма' : 'Amount'}</TableHead>
                <TableHead>{isRu ? 'Дата' : 'Date'}</TableHead>
                <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.service_name || '—'}</TableCell>
                  <TableCell>{b.total_amount ? formatCurrency(b.total_amount, b.currency || 'THB') : '—'}</TableCell>
                  <TableCell>{b.scheduled_at ? format(new Date(b.scheduled_at), 'dd MMM yyyy HH:mm') : format(new Date(b.created_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
