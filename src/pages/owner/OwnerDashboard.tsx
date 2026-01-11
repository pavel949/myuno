import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePropertyCareStats, useOwnerProperties, useServiceRequests, usePropertyInspections } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, Plus, ClipboardCheck, DollarSign, Calendar, 
  CheckCircle, Clock, AlertTriangle, ArrowRight, 
  Key, Camera, Wrench, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function OwnerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { data: stats, isLoading: statsLoading } = usePropertyCareStats();
  const { data: properties } = useOwnerProperties();
  const { data: requests } = useServiceRequests();
  const { data: inspections } = usePropertyInspections();

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Home className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'UNO Property Care' : 'UNO Property Care'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu 
              ? 'Войдите, чтобы управлять своей недвижимостью' 
              : 'Sign in to manage your property'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const pendingRequests = requests?.filter(r => 
    ['pending', 'confirmed', 'in_progress'].includes(r.status)
  ).slice(0, 3);

  const upcomingInspections = inspections?.filter(i => 
    i.status === 'scheduled'
  ).slice(0, 3);

  const quickActions = [
    { 
      icon: Calendar, 
      label: isRu ? 'Календарь' : 'Calendar', 
      color: 'bg-primary',
      onClick: () => navigate('/owner/calendar')
    },
    { 
      icon: Key, 
      label: isRu ? 'Check-in' : 'Check-in', 
      color: 'bg-green-500',
      onClick: () => navigate('/owner/service-request?type=check_in')
    },
    { 
      icon: Key, 
      label: isRu ? 'Check-out' : 'Check-out', 
      color: 'bg-orange-500',
      onClick: () => navigate('/owner/service-request?type=check_out')
    },
    { 
      icon: Camera, 
      label: isRu ? 'Инспекция' : 'Inspection', 
      color: 'bg-blue-500',
      onClick: () => navigate('/owner/inspection')
    },
    { 
      icon: Wrench, 
      label: isRu ? 'Ремонт' : 'Maintenance', 
      color: 'bg-purple-500',
      onClick: () => navigate('/owner/service-request?type=maintenance')
    },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Property Care' : 'Property Care'}
        subtitle={isRu ? 'Управление вашей недвижимостью' : 'Manage your property'}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalProperties || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Объектов' : 'Properties'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ฿{((stats?.netIncome || 0) / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Баланс' : 'Balance'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-500/20">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pendingRequests || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Активных заявок' : 'Active requests'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/20">
                <ClipboardCheck className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pendingInspections || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Инспекций' : 'Inspections'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isRu ? 'Быстрые действия' : 'Quick Actions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`p-2 rounded-full ${action.color} text-white`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Properties */}
      <Card className="mb-6">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {isRu ? 'Мои объекты' : 'My Properties'}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/owner/properties')}
          >
            {isRu ? 'Все' : 'All'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {!properties?.length ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                {isRu ? 'У вас пока нет объектов' : 'No properties yet'}
              </p>
              <Button onClick={() => navigate('/owner/properties/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {isRu ? 'Добавить объект' : 'Add Property'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.slice(0, 3).map((property) => (
                <div 
                  key={property.id}
                  onClick={() => navigate(`/owner/properties/${property.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                    {property.cover_image ? (
                      <img 
                        src={property.cover_image} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {isRu && property.title_ru ? property.title_ru : property.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {property.district || property.address}
                    </p>
                  </div>
                  <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                    {property.status === 'active' 
                      ? (isRu ? 'Активен' : 'Active')
                      : property.status === 'pending'
                        ? (isRu ? 'На проверке' : 'Pending')
                        : (isRu ? 'Неактивен' : 'Inactive')
                    }
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {isRu ? 'Активные заявки' : 'Active Requests'}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/owner/requests')}
            >
              {isRu ? 'Все' : 'All'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <div className={`p-2 rounded-full ${
                    request.service_type === 'check_in' ? 'bg-green-500/20 text-green-500' :
                    request.service_type === 'check_out' ? 'bg-orange-500/20 text-orange-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {request.service_type === 'check_in' || request.service_type === 'check_out' 
                      ? <Key className="h-4 w-4" />
                      : <Wrench className="h-4 w-4" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {request.service_type === 'check_in' ? 'Check-in' :
                       request.service_type === 'check_out' ? 'Check-out' :
                       request.service_type === 'cleaning' ? (isRu ? 'Клининг' : 'Cleaning') :
                       request.service_type === 'maintenance' ? (isRu ? 'Ремонт' : 'Maintenance') :
                       request.service_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.scheduled_at && format(
                        new Date(request.scheduled_at), 
                        'd MMM, HH:mm',
                        { locale: isRu ? ru : undefined }
                      )}
                      {request.guest_name && ` • ${request.guest_name}`}
                    </p>
                  </div>
                  <Badge variant={
                    request.status === 'pending' ? 'secondary' :
                    request.status === 'confirmed' ? 'default' :
                    'outline'
                  }>
                    {request.status === 'pending' ? (isRu ? 'Ожидает' : 'Pending') :
                     request.status === 'confirmed' ? (isRu ? 'Подтв.' : 'Confirmed') :
                     request.status === 'in_progress' ? (isRu ? 'В работе' : 'In Progress') :
                     request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Inspections */}
      {upcomingInspections && upcomingInspections.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {isRu ? 'Запланированные инспекции' : 'Upcoming Inspections'}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/owner/inspections')}
            >
              {isRu ? 'Все' : 'All'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingInspections.map((inspection) => (
                <div 
                  key={inspection.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <div className="p-2 rounded-full bg-blue-500/20 text-blue-500">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {inspection.inspection_type === 'routine' ? (isRu ? 'Плановая проверка' : 'Routine Check') :
                       inspection.inspection_type === 'check_in' ? 'Check-in Inspection' :
                       inspection.inspection_type === 'check_out' ? 'Check-out Inspection' :
                       (isRu ? 'Экстренная' : 'Emergency')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(inspection.scheduled_at), 
                        'd MMM, HH:mm',
                        { locale: isRu ? ru : undefined }
                      )}
                    </p>
                  </div>
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {isRu ? 'Запланировано' : 'Scheduled'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold mb-1">
              {isRu ? 'Нужна помощь?' : 'Need Help?'}
            </h3>
            <p className="text-sm opacity-90">
              {isRu 
                ? 'Свяжитесь с персональным менеджером' 
                : 'Contact your personal manager'}
            </p>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => window.open('https://wa.me/66922407355', '_blank')}
          >
            WhatsApp
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
