import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVisaServices } from '@/hooks/useVisaServices';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  FileCheck, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  MessageCircle,
  Building2,
  Star
} from 'lucide-react';

export default function VisaServiceDetail() {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { services, isLoading } = useVisaServices();

  const visa = services.find((s) => s.id === id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 space-y-4">
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-24 bg-muted animate-pulse rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!visa) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p>{language === 'ru' ? 'Услуга не найдена' : 'Service not found'}</p>
          <Button onClick={() => navigate('/legal')} className="mt-4">
            {language === 'ru' ? 'Назад' : 'Go back'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const requirements = (visa.requirements as { en?: string[]; ru?: string[] }) || {};
  const documents = (visa.documents_required as { en?: string[]; ru?: string[] }) || {};
  const process = (visa.process_steps as { en?: string[]; ru?: string[] }) || {};

  return (
    <AppLayout>
      <div className="pb-24">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-6 pt-16">
          <BackButton fallbackPath="/legal" variant="overlay" className="absolute top-4 left-4" />
          
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                className={`text-xs ${
                  visa.visa_type === 'elite' 
                    ? 'bg-amber-500 text-white' 
                    : visa.visa_type === 'retirement'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/20 text-white'
                }`}
              >
                {visa.visa_type?.replace('_', ' ').toUpperCase()}
              </Badge>
              {visa.is_popular && (
                <Badge className="bg-white/20 text-white text-xs">
                  ⭐ {language === 'ru' ? 'Популярно' : 'Popular'}
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl font-bold mb-2">
              {language === 'ru' ? visa.name_ru : visa.name_en}
            </h1>
            <p className="text-white/80 text-sm">
              {language === 'ru' ? visa.description_ru : visa.description_en}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-4 border-b border-border grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Срок' : 'Processing'}</p>
            <p className="text-sm font-semibold">{visa.processing_time || '-'}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <FileCheck className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Действие' : 'Validity'}</p>
            <p className="text-sm font-semibold">{visa.validity_period || '-'}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Продление' : 'Renewal'}</p>
            <p className="text-sm font-semibold">
              {visa.is_renewable 
                ? (language === 'ru' ? 'Да' : 'Yes') 
                : (language === 'ru' ? 'Нет' : 'No')}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">{language === 'ru' ? 'Обзор' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="documents">{language === 'ru' ? 'Документы' : 'Documents'}</TabsTrigger>
            <TabsTrigger value="process">{language === 'ru' ? 'Процесс' : 'Process'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Pricing */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-3">{language === 'ru' ? 'Стоимость' : 'Pricing'}</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {language === 'ru' ? 'Услуги агентства' : 'Agency fee'}
                  </span>
                  <span className="font-bold text-primary">฿{(visa.price || 0).toLocaleString()}</span>
                </div>
                {visa.government_fee && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Гос. сбор' : 'Government fee'}
                    </span>
                    <span className="font-semibold">฿{visa.government_fee.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 mt-2 flex justify-between items-center">
                  <span className="font-semibold">{language === 'ru' ? 'Итого' : 'Total'}</span>
                  <span className="font-bold text-lg text-primary">
                    ฿{((visa.price || 0) + (visa.government_fee || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Requirements */}
            {requirements && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  {language === 'ru' ? 'Требования' : 'Requirements'}
                </h3>
                <ul className="space-y-2">
                  {(language === 'ru' ? requirements.ru : requirements.en)?.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Provider */}
            {visa.provider && (
              <div 
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/legal/provider/${visa.provider_id}`)}
              >
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  {language === 'ru' ? 'Провайдер' : 'Provider'}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {language === 'ru' ? visa.provider.name_ru : visa.provider.name_en}
                    </p>
                    {visa.provider.rating && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{visa.provider.rating}</span>
                        {visa.provider.review_count && (
                          <span>({visa.provider.review_count})</span>
                        )}
                      </div>
                    )}
                  </div>
                  {visa.provider.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {language === 'ru' ? 'Проверен' : 'Verified'}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                {language === 'ru' ? 'Необходимые документы' : 'Required Documents'}
              </h3>
              <ul className="space-y-3">
                {(language === 'ru' ? documents.ru : documents.en)?.map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                    </div>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="process" className="space-y-4 mt-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-4">{language === 'ru' ? 'Этапы оформления' : 'Process Steps'}</h3>
              <div className="space-y-4">
                {(language === 'ru' ? process.ru : process.en)?.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
                        {idx + 1}
                      </div>
                      {idx < (process.en?.length || 0) - 1 && (
                        <div className="w-0.5 h-full bg-border my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Button variant="outline" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Консультация' : 'Consult'}
            </Button>
            <Button className="flex-1" onClick={() => navigate(`/legal/booking/${visa.provider_id}?visa=${visa.id}`)}>
              <Calendar className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Оформить' : 'Apply'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
