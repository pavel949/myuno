import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Mail, Phone, MapPin, Clock, MessageCircle, 
  Globe, Building2, Headphones, Send 
} from 'lucide-react';
import { COMPANY_CONTACTS, getWhatsAppUrl, getTelLink, getMailtoLink } from '@/lib/config';

export default function ContactPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const contactMethods = [
    {
      icon: Headphones,
      title: isRu ? 'Служба поддержки' : 'Customer Support',
      description: isRu ? 'Помощь с бронированиями и вопросами' : 'Help with bookings and questions',
      action: COMPANY_CONTACTS.email.support,
      actionLabel: isRu ? 'Написать' : 'Email',
      href: getMailtoLink('support'),
    },
    {
      icon: Phone,
      title: isRu ? 'Горячая линия' : 'Hotline',
      description: isRu ? 'Срочные вопросы и экстренная помощь' : 'Urgent questions and emergency help',
      action: COMPANY_CONTACTS.phone.display,
      actionLabel: isRu ? 'Позвонить' : 'Call',
      href: getTelLink(),
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: isRu ? 'Быстрые ответы в мессенджере' : 'Quick replies via messenger',
      action: COMPANY_CONTACTS.phone.display,
      actionLabel: isRu ? 'Написать' : 'Message',
      href: COMPANY_CONTACTS.whatsapp.link,
    },
  ];

  const departments = [
    {
      icon: Building2,
      title: isRu ? 'Для партнёров' : 'For Partners',
      email: COMPANY_CONTACTS.email.partners,
      description: isRu ? 'Сотрудничество и подключение бизнеса' : 'Partnership and business onboarding',
    },
    {
      icon: Mail,
      title: isRu ? 'Пресса и PR' : 'Press & PR',
      email: COMPANY_CONTACTS.email.press,
      description: isRu ? 'Медиа-запросы и интервью' : 'Media inquiries and interviews',
    },
    {
      icon: Globe,
      title: isRu ? 'Общие вопросы' : 'General Inquiries',
      email: COMPANY_CONTACTS.email.info,
      description: isRu ? 'Любые другие вопросы' : 'Any other questions',
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Контакты' : 'Contact Us'} 
          showBack 
        />

        {/* Main Contact Methods */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {contactMethods.map((method, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <method.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{method.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                <p className="text-sm font-medium mb-3">{method.action}</p>
                <Button asChild size="sm" className="w-full">
                  <a href={method.href} target="_blank" rel="noopener noreferrer">
                    <Send className="h-4 w-4 mr-2" />
                    {method.actionLabel}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Departments */}
        <h2 className="text-lg font-semibold mb-4">
          {isRu ? 'Отделы' : 'Departments'}
        </h2>
        <div className="space-y-3 mb-8">
          {departments.map((dept, index) => (
            <Card key={index}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <dept.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{dept.title}</h3>
                    <p className="text-sm text-muted-foreground">{dept.description}</p>
                  </div>
                  <a 
                    href={`mailto:${dept.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {dept.email}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Office Info */}
        <h2 className="text-lg font-semibold mb-4">
          {isRu ? 'Офис' : 'Office'}
        </h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{isRu ? 'Адрес' : 'Address'}</p>
                <p className="text-sm text-muted-foreground">
                  {COMPANY_CONTACTS.address.full}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{isRu ? 'Часы работы' : 'Working Hours'}</p>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? `Пн-Пт: ${COMPANY_CONTACTS.workingHours.office} (${COMPANY_CONTACTS.workingHours.officeTimezone})`
                    : `Mon-Fri: ${COMPANY_CONTACTS.workingHours.office} (${COMPANY_CONTACTS.workingHours.officeTimezone})`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? `Поддержка ${COMPANY_CONTACTS.workingHours.support} через WhatsApp`
                    : `${COMPANY_CONTACTS.workingHours.support} Support via WhatsApp`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Entity */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isRu ? 'Юридическая информация' : 'Legal Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <strong>{COMPANY_CONTACTS.legal.companyName}</strong><br />
              Tax ID: {COMPANY_CONTACTS.legal.taxId}<br />
              {isRu 
                ? `Зарегистрировано в Королевстве ${COMPANY_CONTACTS.legal.registrationCountry}`
                : `Registered in the Kingdom of ${COMPANY_CONTACTS.legal.registrationCountry}`}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
