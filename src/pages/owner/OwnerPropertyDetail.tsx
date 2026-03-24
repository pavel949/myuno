import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, useServiceRequests, usePropertyInspections } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInHours } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PropertyDocumentsTab } from '@/components/owner/PropertyDocumentsTab';
import { JuristicContactsCard } from '@/components/owner/JuristicContactsCard';
import { usePropertyDocuments } from '@/hooks/usePropertyDocuments';
import { PropertyDetailHeader } from '@/components/owner/property-detail/PropertyDetailHeader';
import { MarketplaceStatusCard } from '@/components/owner/property-detail/MarketplaceStatusCard';
import { PropertyNotesTab } from '@/components/owner/property-detail/PropertyNotesTab';
import { PropertyOwnerInfoTab } from '@/components/owner/property-detail/PropertyOwnerInfoTab';
import { usePropertyNotes } from '@/hooks/usePropertyNotes';
import { usePropertyManagementTerms } from '@/hooks/usePropertyManagementTerms';
import { ManagementTermsForm } from '@/components/owner/management/ManagementTermsForm';
import { TermsActivityLog } from '@/components/owner/management/TermsActivityLog';
import { PropertyKeyAssignments } from '@/components/owner/property-detail/PropertyKeyAssignments';
import { PropertyUtilitySchedules } from '@/components/owner/property-detail/PropertyUtilitySchedules';
import { ChecklistCompletion } from '@/components/owner/checklists/ChecklistCompletion';
import { ChecklistHistory } from '@/components/owner/checklists/ChecklistHistory';
import {
  Home, Calendar, CheckCircle, Clock, AlertTriangle, FileText, Building2,
  Sparkles, Shield, Settings, Bed, Bath, SquareStack, Rocket, EyeOff,
  StickyNote, Users, Wrench, Eye, MapPin, DollarSign, Wifi, KeyRound,
  Handshake
} from 'lucide-react';

export default function OwnerPropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { data: property, isLoading } = useOwnerProperty(id);
  const { data: serviceRequests } = useServiceRequests(id);
  const { data: inspections } = usePropertyInspections(id);
  const { documents } = usePropertyDocuments(id || '');
  const { notes } = usePropertyNotes(id);
  const { data: termsList } = usePropertyManagementTerms(id);

  const serviceTypeLabels: Record<string, { en: string; ru: string }> = {
    check_in: { en: 'Check-in', ru: 'Заезд гостей' },
    check_out: { en: 'Check-out', ru: 'Выезд гостей' },
    cleaning: { en: 'Cleaning', ru: 'Уборка' },
    maintenance: { en: 'Maintenance', ru: 'Обслуживание' },
    key_handover: { en: 'Key Handover', ru: 'Передача ключей' },
    emergency: { en: 'Emergency', ru: 'Экстренная помощь' },
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-info" />;
      case 'pending':
      case 'confirmed': return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <BackButton />
        <Skeleton className="h-48 w-full rounded-xl mb-4" />
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </PageContainer>
    );
  }

  if (!property) {
    return (
      <PageContainer>
        <BackButton />
        <div className="text-center py-12">
          <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">{isRu ? 'Объект не найден' : 'Property not found'}</h2>
        </div>
      </PageContainer>
    );
  }

  const propertyTypeLabels: Record<string, { en: string; ru: string }> = {
    villa: { en: 'Villa', ru: 'Вилла' },
    apartment: { en: 'Apartment', ru: 'Квартира' },
    condo: { en: 'Condo', ru: 'Кондо' },
    house: { en: 'House', ru: 'Дом' },
  };

  return (
    <PageContainer>
      <BackButton />

      <PropertyDetailHeader property={property} isRu={isRu} />

      {/* Internal info bar — rich data for MC only */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="text-muted-foreground">
              {isRu ? propertyTypeLabels[property.property_type]?.ru : propertyTypeLabels[property.property_type]?.en || property.property_type}
            </span>
            {property.bedrooms && <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{property.bedrooms}</span>}
            {property.bathrooms && <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms}</span>}
            {property.area_sqm && <span className="flex items-center gap-1"><SquareStack className="h-4 w-4" />{property.area_sqm}{isRu ? 'м²' : ' sqm'}</span>}
            {property.floor && <span className="text-muted-foreground">{isRu ? `Этаж ${property.floor}` : `Floor ${property.floor}`}</span>}
            {property.unit_number && <span className="text-muted-foreground">#{property.unit_number}</span>}
            {property.price_per_night && (
              <span className="flex items-center gap-1 font-medium text-success">
                <DollarSign className="h-3.5 w-3.5" />
                ฿{Number(property.price_per_night).toLocaleString()}/{isRu ? 'ночь' : 'night'}
              </span>
            )}
            {property.deposit_amount && Number(property.deposit_amount) > 0 && (
              <span className="text-muted-foreground">
                {isRu ? 'Депозит:' : 'Deposit:'} {Number(property.deposit_amount).toLocaleString()} {(property as any).deposit_currency || 'USD'}
              </span>
            )}
            {(property as any).seasonal_pricing?.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {(property as any).seasonal_pricing.length} {isRu ? 'сезон.' : 'seasons'}
              </Badge>
            )}
          </div>
          {property.internal_name && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              {isRu ? 'Внутреннее имя:' : 'Internal name:'} {property.internal_name}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Publication & Quick Edit */}
      <div className="flex items-center gap-2 mb-4">
        <MarketplaceStatusCard
          propertyId={property.id}
          approvalStatus={property.approval_status}
          rejectionReason={property.rejection_reason}
          isActive={property.is_active}
          isRu={isRu}
        />
      </div>

      <div className="flex gap-2 mb-6">
        <Button className="flex-1" onClick={() => navigate(`/mc/properties/${id}/editor`)}>
          <Settings className="h-4 w-4 mr-2" />
          {isRu ? 'Редактировать объект' : 'Edit Property'}
        </Button>
        <Button variant="outline" onClick={() => navigate(`/mc/properties/${id}/guidebook`)}>
          {isRu ? 'Гайдбук' : 'Guidebook'}
        </Button>
      </div>

      {/* === UNIFIED TABS === */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="overview" className="text-xs">
            <Eye className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            {isRu ? 'Обзор' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="operations" className="text-xs">
            <Wrench className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            {isRu ? 'Операции' : 'Ops'}
            {((serviceRequests?.length || 0) + (inspections?.length || 0)) > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                {(serviceRequests?.length || 0) + (inspections?.length || 0)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">
            <FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            {isRu ? 'Документы' : 'Docs'}
            {(documents?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1">{documents?.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs">
            <StickyNote className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            {isRu ? 'Заметки' : 'Notes'}
            {(notes?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1">{notes?.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="terms" className="text-xs">
            <Handshake className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            {isRu ? 'Условия' : 'Terms'}
            {(termsList?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1">{termsList?.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="owners" className="text-xs">
            <Users className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            {isRu ? 'Собственник' : 'Owner'}
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Access codes quick view */}
          {(property as any).wifi_password && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <Wifi className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">WiFi</p>
                  <p className="text-sm font-mono">{(property as any).wifi_password}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key operational data */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{serviceRequests?.filter(r => r.status !== 'completed').length || 0}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Активных заявок' : 'Active Requests'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{documents?.length || 0}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Документов' : 'Documents'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{notes?.filter(n => n.is_pinned).length || 0}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Закреп. заметок' : 'Pinned Notes'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{inspections?.length || 0}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Инспекций' : 'Inspections'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Keys & Utilities */}
          {id && <PropertyKeyAssignments propertyId={id} />}
          {id && <PropertyUtilitySchedules propertyId={id} />}

          {/* Checklists */}
          {id && <ChecklistCompletion propertyId={id} />}
          {id && <ChecklistHistory propertyId={id} />}

          {/* MC / Juristic link */}
          {property?.project_id && (
            <JuristicContactsCard projectId={property.project_id} />
          )}

          {/* Quick actions grid */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(`/mc/properties/${id}/editor`)}>
              <Calendar className="h-4 w-4" />
              <span className="text-xs">{isRu ? 'Календарь' : 'Calendar'}</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(`/owner/service-request?property=${id}`)}>
              <Wrench className="h-4 w-4" />
              <span className="text-xs">{isRu ? 'Заявка' : 'Request'}</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(`/owner/inspection?property=${id}`)}>
              <Shield className="h-4 w-4" />
              <span className="text-xs">{isRu ? 'Инспекция' : 'Inspect'}</span>
            </Button>
          </div>
        </TabsContent>

        {/* OPERATIONS TAB */}
        <TabsContent value="operations" className="mt-4 space-y-4">
          <h3 className="font-semibold text-sm">{isRu ? 'Заявки на обслуживание' : 'Service Requests'}</h3>
          {!serviceRequests?.length ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">{isRu ? 'Нет активных заявок' : 'No active requests'}</CardContent></Card>
          ) : (
            serviceRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getServiceStatusIcon(request.status)}
                      <div>
                        <p className="font-medium">{isRu ? serviceTypeLabels[request.service_type]?.ru : serviceTypeLabels[request.service_type]?.en}</p>
                        {request.scheduled_at && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(request.scheduled_at), 'PPP', { locale: isRu ? ru : undefined })}
                          </p>
                        )}
                        {request.guest_name && <p className="text-sm text-muted-foreground">{isRu ? 'Гость:' : 'Guest:'} {request.guest_name}</p>}
                      </div>
                    </div>
                    <Badge variant="outline">{request.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <h3 className="font-semibold text-sm pt-4">{isRu ? 'Инспекции' : 'Inspections'}</h3>
          {!inspections?.length ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">{isRu ? 'Нет инспекций' : 'No inspections'}</CardContent></Card>
          ) : (
            inspections.map((inspection) => (
              <Card key={inspection.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getServiceStatusIcon(inspection.status)}
                      <div>
                        <p className="font-medium capitalize">{inspection.inspection_type}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(inspection.scheduled_at), 'PPP', { locale: isRu ? ru : undefined })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{inspection.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="mt-4">
          {id && <PropertyDocumentsTab propertyId={id} />}
        </TabsContent>

        {/* NOTES TAB */}
        <TabsContent value="notes" className="mt-4">
          {id && <PropertyNotesTab propertyId={id} />}
        </TabsContent>

        {/* TERMS TAB */}
        <TabsContent value="terms" className="mt-4 space-y-6">
          {id && (
            <>
              {termsList && termsList.length > 0 ? (
                termsList.map((terms) => (
                  <div key={terms.id} className="space-y-4">
                    <ManagementTermsForm
                      propertyId={id}
                      existing={terms}
                      compact
                    />
                    <TermsActivityLog termsId={terms.id} />
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Handshake className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">{isRu ? 'Условия не настроены' : 'No terms configured'}</p>
                      <p className="text-sm mt-1">{isRu ? 'Задайте комиссии, распределение расходов и условия оплаты' : 'Set commissions, expense split and payment terms'}</p>
                    </CardContent>
                  </Card>
                  <ManagementTermsForm propertyId={id} compact />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* OWNER TAB */}
        <TabsContent value="owners" className="mt-4">
          {id && (
            <PropertyOwnerInfoTab
              propertyId={id}
              property={{
                owner_name: (property as any).owner_name,
                owner_email: (property as any).owner_email,
                owner_phone: (property as any).owner_phone,
                owner_nationality: (property as any).owner_nationality,
                management_company_id: (property as any).management_company_id,
                management_type: property.management_type,
                project_id: property.project_id,
                owner_contact_id: (property as any).owner_contact_id,
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
