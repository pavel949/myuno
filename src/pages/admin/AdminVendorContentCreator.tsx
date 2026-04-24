/**
 * AdminVendorContentCreator - Official Admin-as-Vendor Workflow
 * 
 * Enables admin to create vendor content ON BEHALF OF vendors:
 * - Create/select vendors
 * - Create services/products/properties for vendors
 * - Full attribution tracking (created_by, created_on_behalf)
 * - Clear UX showing "Creating for Vendor X"
 * 
 * PRINCIPLE: Admin provisions, Vendor owns.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminProviders } from '@/hooks/useAdmin';

import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Search,
  Package,
  ShoppingCart,
  Home,
  Flower2,
  Car,
  Ship,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserPlus,
  Loader2,
  Shield,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Content type definitions
interface ContentType {
  id: string;
  icon: React.ReactNode;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  route: string;
  color: string;
}

const CONTENT_TYPES: ContentType[] = [
  {
    id: 'service',
    icon: <Package className="h-6 w-6" />,
    labelEn: 'Service',
    labelRu: 'Услуга',
    descEn: 'Spa, salon, clinic, education, etc.',
    descRu: 'Спа, салон, клиника, обучение и др.',
    route: '/admin/services',
    color: 'bg-info/10 text-info border-info/30',
  },
  {
    id: 'product',
    icon: <ShoppingCart className="h-6 w-6" />,
    labelEn: 'Product',
    labelRu: 'Товар',
    descEn: 'Marketplace products',
    descRu: 'Товары маркетплейса',
    route: '/admin/catalog',
    color: 'bg-success/10 text-success border-success/30',
  },
  {
    id: 'bouquet',
    icon: <Flower2 className="h-6 w-6" />,
    labelEn: 'Bouquet',
    labelRu: 'Букет',
    descEn: 'Flower arrangements',
    descRu: 'Цветочные композиции',
    route: '/admin/flowers',
    color: 'bg-accent/10 text-accent border-accent/40',
  },
  {
    id: 'property',
    icon: <Home className="h-6 w-6" />,
    labelEn: 'Property',
    labelRu: 'Недвижимость',
    descEn: 'Real estate listings',
    descRu: 'Объекты недвижимости',
    route: '/admin/properties',
    color: 'bg-success/10 text-success border-success/40',
  },
  {
    id: 'vehicle',
    icon: <Car className="h-6 w-6" />,
    labelEn: 'Vehicle',
    labelRu: 'Транспорт',
    descEn: 'Cars, bikes, scooters',
    descRu: 'Авто, мото, скутеры',
    route: '/admin/vehicles',
    color: 'bg-primary/10 text-primary border-primary/40',
  },
  {
    id: 'yacht',
    icon: <Ship className="h-6 w-6" />,
    labelEn: 'Yacht',
    labelRu: 'Яхта',
    descEn: 'Boats and yachts',
    descRu: 'Лодки и яхты',
    route: '/admin/yachts',
    color: 'bg-primary/10 text-primary border-primary/40',
  },
];

export default function AdminVendorContentCreator() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const { providers, isLoading, refetch } = useAdminProviders();

  // State
  const [step, setStep] = useState<'select-vendor' | 'select-content'>('select-vendor');
  const [selectedProvider, setSelectedProvider] = useState<typeof providers[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateVendorOpen, setIsCreateVendorOpen] = useState(false);
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);
  const [newVendorData, setNewVendorData] = useState({
    name: '',
    email: '',
    phone: '',
    business_category: 'services',
  });

  // Filter providers
  const filteredProviders = providers.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create new vendor
  const handleCreateVendor = async () => {
    if (!newVendorData.name.trim()) {
      toast.error(isRu ? 'Введите название' : 'Enter name');
      return;
    }

    setIsCreatingVendor(true);
    try {
      const { data, error } = await supabase
        .from('providers')
        .insert({
          name: newVendorData.name.trim(),
          email: newVendorData.email.trim() || null,
          phone: newVendorData.phone.trim() || null,
          business_category: newVendorData.business_category,
          is_active: true,
          is_verified: true,
          approval_status: 'approved',
          created_by_uno_team: true,
          uno_team_creator_id: user?.id,
          pending_payout: 0,
          rating: 0,
          review_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(isRu ? 'Вендор создан!' : 'Vendor created!');
      await refetch();
      
      // Auto-select newly created vendor
      setSelectedProvider(data);
      setStep('select-content');
      setIsCreateVendorOpen(false);
      setNewVendorData({ name: '', email: '', phone: '', business_category: 'services' });
    } catch (err) {
      console.error('Error creating vendor:', err);
      toast.error(isRu ? 'Ошибка создания' : 'Creation failed');
    } finally {
      setIsCreatingVendor(false);
    }
  };

  // Navigate to content form with vendor context
  const handleContentSelect = (contentType: ContentType) => {
    if (!selectedProvider) return;

    const params = new URLSearchParams({
      provider: selectedProvider.id,
      action: 'new',
      type: contentType.id,
      on_behalf: 'true',
    });

    navigate(`${contentType.route}?${params.toString()}`);
  };

  // Render step 1: Select vendor
  const renderVendorSelection = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">
          {isRu ? 'Шаг 1: Выберите вендора' : 'Step 1: Select Vendor'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu 
            ? 'Выберите существующего вендора или создайте нового' 
            : 'Select an existing vendor or create a new one'}
        </p>
      </div>

      {/* Search + Create */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRu ? 'Поиск вендоров...' : 'Search vendors...'}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsCreateVendorOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {isRu ? 'Создать' : 'Create'}
        </Button>
      </div>

      {/* Vendors list */}
      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : filteredProviders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {searchQuery 
                ? (isRu ? 'Вендоры не найдены' : 'No vendors found')
                : (isRu ? 'Нет вендоров' : 'No vendors yet')}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsCreateVendorOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Создать первого вендора' : 'Create first vendor'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid gap-3">
            {filteredProviders.map((provider) => (
              <Card
                key={provider.id}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50 hover:shadow-md',
                  selectedProvider?.id === provider.id && 'border-primary ring-2 ring-primary/20'
                )}
                onClick={() => {
                  setSelectedProvider(provider);
                  setStep('select-content');
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-none bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {provider.business_category || 'services'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {provider.is_verified && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {isRu ? 'Верифицирован' : 'Verified'}
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  // Render step 2: Select content type
  const renderContentSelection = () => (
    <div className="space-y-6">
      {/* Back to vendor selection */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setStep('select-vendor')}
        className="gap-2"
      >
        ← {isRu ? 'Назад к выбору вендора' : 'Back to vendor selection'}
      </Button>

      {/* Active context banner */}
      <Alert className="border-primary/30 bg-primary/5">
        <Shield className="h-4 w-4" />
        <AlertTitle>
          {isRu ? 'Создание от имени вендора' : 'Creating on behalf of vendor'}
        </AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="font-semibold">{selectedProvider?.name}</span>
          <Badge variant="outline" className="ml-2">
            {isRu ? 'Вендор сохраняет права' : 'Vendor retains ownership'}
          </Badge>
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">
          {isRu ? 'Шаг 2: Выберите тип контента' : 'Step 2: Select Content Type'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu 
            ? 'Контент будет создан для вендора и доступен ему для редактирования' 
            : 'Content will be created for the vendor and available for their editing'}
        </p>
      </div>

      {/* Content type grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONTENT_TYPES.map((type) => (
          <Card
            key={type.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg border-2',
              type.color.includes('border') ? type.color : 'hover:border-primary/50'
            )}
            onClick={() => handleContentSelect(type)}
          >
            <CardContent className="p-6">
              <div className={cn('h-12 w-12 rounded-none flex items-center justify-center mb-4', type.color)}>
                {type.icon}
              </div>
              <h3 className="font-semibold mb-1">
                {isRu ? type.labelRu : type.labelEn}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRu ? type.descRu : type.descEn}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-3 p-4 rounded-none bg-muted/50">
        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">
            {isRu ? 'После создания:' : 'After creation:'}
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>{isRu ? 'Контент появится в каталоге (если опубликован)' : 'Content appears in catalog (if published)'}</li>
            <li>{isRu ? 'Вендор увидит его в своем кабинете' : 'Vendor sees it in their dashboard'}</li>
            <li>{isRu ? 'Действия будут записаны в журнал аудита' : 'Actions logged for audit trail'}</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PageContainer>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            {isRu ? 'Создание контента для вендора' : 'Create Vendor Content'}
          </h1>
          <p className="text-muted-foreground">
            {isRu 
              ? 'Официальный workflow для создания контента от имени вендоров' 
              : 'Official workflow for creating content on behalf of vendors'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-8">
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full',
            step === 'select-vendor' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            <span className="font-medium">1</span>
            <span className="hidden sm:inline">{isRu ? 'Выбор вендора' : 'Select Vendor'}</span>
          </div>
          <div className="h-0.5 w-8 bg-border" />
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full',
            step === 'select-content' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            <span className="font-medium">2</span>
            <span className="hidden sm:inline">{isRu ? 'Тип контента' : 'Content Type'}</span>
          </div>
        </div>

        {/* Main content */}
        {step === 'select-vendor' ? renderVendorSelection() : renderContentSelection()}

        {/* Create Vendor Dialog */}
        <Dialog open={isCreateVendorOpen} onOpenChange={setIsCreateVendorOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isRu ? 'Создать нового вендора' : 'Create New Vendor'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Название *' : 'Name *'}</Label>
                <Input
                  value={newVendorData.name}
                  onChange={(e) => setNewVendorData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={isRu ? 'Название компании' : 'Company name'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newVendorData.email}
                    onChange={(e) => setNewVendorData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
                  <Input
                    value={newVendorData.phone}
                    onChange={(e) => setNewVendorData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+66..."
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateVendorOpen(false)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleCreateVendor} disabled={isCreatingVendor}>
                {isCreatingVendor && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
