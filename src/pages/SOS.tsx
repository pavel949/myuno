import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Shield, 
  Flame, 
  Car, 
  AlertTriangle,
  FileQuestion,
  Wallet,
  Heart,
  Bug,
  Users,
  Building2,
  Plane,
  HelpCircle,
  ExternalLink,
  MessageCircle,
  Star,
  Sparkles,
  Crown,
  ChefHat,
  Navigation
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { AnimatedList, AnimatedItem, FadeInUp } from '@/components/layout/AnimatedList';
import { cn } from '@/lib/utils';

// UNO Emergency Contact
const UNO_EMERGENCY_PHONE = '+66-XX-XXX-XXXX'; // Replace with actual number
const UNO_WHATSAPP = 'https://wa.me/66XXXXXXXXX'; // Replace with actual WhatsApp

interface EmergencyContact {
  id: string;
  icon: React.ElementType;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  phone?: string;
  phones?: { label: string; labelRu: string; number: string }[];
  color: string;
  bgColor: string;
  priority?: 'high' | 'medium' | 'low';
}

const emergencyContacts: EmergencyContact[] = [
  {
    id: 'police',
    icon: Shield,
    title: 'Tourist Police',
    titleRu: 'Туристическая полиция',
    description: '24/7 English-speaking officers for tourists',
    descriptionRu: 'Круглосуточно, говорят по-английски',
    phone: '1155',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    priority: 'high',
  },
  {
    id: 'emergency',
    icon: AlertTriangle,
    title: 'Emergency Services',
    titleRu: 'Экстренные службы',
    description: 'Fire, ambulance, rescue',
    descriptionRu: 'Пожарные, скорая, спасатели',
    phone: '191',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    priority: 'high',
  },
  {
    id: 'ambulance',
    icon: Heart,
    title: 'Ambulance',
    titleRu: 'Скорая помощь',
    description: 'Medical emergencies',
    descriptionRu: 'Медицинские экстренные случаи',
    phone: '1669',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    priority: 'high',
  },
  {
    id: 'fire',
    icon: Flame,
    title: 'Fire Department',
    titleRu: 'Пожарная служба',
    description: 'Fire emergencies',
    descriptionRu: 'Пожарные экстренные случаи',
    phone: '199',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    priority: 'high',
  },
  {
    id: 'accident',
    icon: Car,
    title: 'Traffic Accident',
    titleRu: 'ДТП',
    description: 'Road accidents and highway police',
    descriptionRu: 'Дорожные происшествия',
    phone: '1193',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    priority: 'medium',
  },
  {
    id: 'snake',
    icon: Bug,
    title: 'Snake Bite / Animal Attack',
    titleRu: 'Укус змеи / Нападение животного',
    description: 'Call ambulance immediately, go to hospital',
    descriptionRu: 'Вызовите скорую, езжайте в больницу',
    phones: [
      { label: 'Ambulance', labelRu: 'Скорая', number: '1669' },
      { label: 'Phuket Hospital', labelRu: 'Госпиталь Пхукета', number: '076-249400' },
    ],
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    priority: 'high',
  },
  {
    id: 'documents',
    icon: FileQuestion,
    title: 'Lost Documents',
    titleRu: 'Потеря документов',
    description: 'Report to tourist police, contact your embassy',
    descriptionRu: 'Обратитесь в турполицию и посольство',
    phones: [
      { label: 'Tourist Police', labelRu: 'Турполиция', number: '1155' },
      { label: 'Immigration Office', labelRu: 'Иммиграция', number: '1178' },
    ],
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    priority: 'medium',
  },
  {
    id: 'money',
    icon: Wallet,
    title: 'Lost Money / No Funds',
    titleRu: 'Остались без денег',
    description: 'Contact your embassy for emergency assistance',
    descriptionRu: 'Обратитесь в посольство за помощью',
    phones: [
      { label: 'Russian Embassy', labelRu: 'Посольство РФ', number: '02-234-9824' },
      { label: 'Tourist Police', labelRu: 'Турполиция', number: '1155' },
    ],
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    priority: 'medium',
  },
  {
    id: 'conflict',
    icon: Users,
    title: 'Conflict Situation',
    titleRu: 'Конфликтная ситуация',
    description: 'Call tourist police, do not escalate',
    descriptionRu: 'Позвоните в турполицию, не обостряйте',
    phone: '1155',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    priority: 'medium',
  },
  {
    id: 'embassy-ru',
    icon: Building2,
    title: 'Russian Embassy',
    titleRu: 'Посольство России',
    description: 'Consular assistance for Russian citizens',
    descriptionRu: 'Консульская помощь для граждан РФ',
    phones: [
      { label: 'Embassy Bangkok', labelRu: 'Посольство Бангкок', number: '02-234-9824' },
      { label: 'Consulate Phuket', labelRu: 'Консульство Пхукет', number: '076-510-392' },
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    priority: 'low',
  },
  {
    id: 'airport',
    icon: Plane,
    title: 'Airport Assistance',
    titleRu: 'Помощь в аэропорту',
    description: 'Lost luggage, flight issues',
    descriptionRu: 'Потерянный багаж, проблемы с рейсом',
    phone: '076-351-122',
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
    priority: 'low',
  },
];

const usefulNumbers = [
  { label: 'Phuket International Hospital', labelRu: 'Пхукет Интернешнл Госпиталь', number: '076-249-400' },
  { label: 'Bangkok Hospital Phuket', labelRu: 'Бангкок Госпиталь Пхукет', number: '076-254-425' },
  { label: 'Dibuk Hospital', labelRu: 'Госпиталь Дибук', number: '076-254-421' },
  { label: 'Immigration Phuket', labelRu: 'Иммиграция Пхукет', number: '076-221-905' },
  { label: 'Taxi Call Center', labelRu: 'Такси', number: '1681' },
];

export default function SOS() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const highPriority = emergencyContacts.filter(c => c.priority === 'high');
  const otherContacts = emergencyContacts.filter(c => c.priority !== 'high');

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title="SOS"
          showBack
        />

        {/* UNO ALERT - Premium Emergency Services */}
        <FadeInUp>
          <div className="mb-6 p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-red-500/20 border-2 border-amber-500/40 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
                <Star className="w-5 h-5 text-white" fill="white" />
              </div>
              <h2 className="font-bold text-xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                UNO ALERT
              </h2>
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            
            <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
              {language === 'ru' 
                ? 'Премиальная служба безопасности UNO. Мы оказываем услуги личной безопасности, помощь в экстремальных и SOS ситуациях. Круглосуточная поддержка на русском и английском языках.' 
                : 'UNO Premium Security Service. We provide personal security, assistance in extreme situations and SOS emergencies. 24/7 support in Russian and English.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg"
                onClick={() => window.location.href = `tel:${UNO_EMERGENCY_PHONE}`}
              >
                <Phone className="w-5 h-5 mr-2" />
                {language === 'ru' ? 'Позвонить в UNO' : 'Call UNO'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                onClick={() => window.open(UNO_WHATSAPP, '_blank')}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-amber-500/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>
                  {language === 'ru' 
                    ? 'Личная безопасность • Экстренная помощь • Круглосуточно' 
                    : 'Personal Security • Emergency Help • 24/7'}
                </span>
              </div>
            </div>
          </div>
        </FadeInUp>

        {/* VIP Concierge Link */}
        <FadeInUp delay={0.05}>
          <div 
            className="mb-6 p-5 rounded-3xl bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-fuchsia-500/15 border border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-colors"
            onClick={() => navigate('/vip-concierge')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                    {language === 'ru' ? 'VIP Консьерж' : 'VIP Concierge'}
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' 
                      ? 'Вертолёты, самолёты, повара, яхты...' 
                      : 'Helicopters, jets, chefs, yachts...'}
                  </p>
                </div>
              </div>
              <div className="text-purple-500">→</div>
            </div>
          </div>
        </FadeInUp>

        {/* Emergency Warning */}
        <FadeInUp delay={0.1}>
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-red-500 mb-1">
                  {language === 'ru' ? 'Экстренные ситуации' : 'Emergency Situations'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' 
                    ? 'Сохраните эту страницу! В экстренной ситуации позвоните по указанным номерам.' 
                    : 'Save this page! In an emergency, call the numbers listed below.'}
                </p>
              </div>
            </div>
          </div>
        </FadeInUp>

        {/* High Priority - Large Buttons */}
        <FadeInUp delay={0.15}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Phone className="w-5 h-5 text-red-500" />
            {language === 'ru' ? 'Срочные службы' : 'Emergency Services'}
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {highPriority.slice(0, 4).map((contact) => {
              const Icon = contact.icon;
              return (
                <button
                  key={contact.id}
                  onClick={() => contact.phone && handleCall(contact.phone)}
                  className={cn(
                    "relative overflow-hidden p-4 rounded-2xl border-2 transition-all active:scale-95",
                    contact.bgColor,
                    "border-current/20 hover:border-current/40"
                  )}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={cn("p-3 rounded-full", contact.bgColor)}>
                      <Icon className={cn("w-8 h-8", contact.color)} />
                    </div>
                    <div>
                      <div className="font-bold text-2xl">
                        {contact.phone}
                      </div>
                      <div className="text-sm font-medium">
                        {language === 'ru' ? contact.titleRu : contact.title}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </FadeInUp>

        {/* All Emergency Contacts */}
        <FadeInUp delay={0.25}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Все экстренные контакты' : 'All Emergency Contacts'}
          </h3>
          <AnimatedList className="space-y-3 mb-6">
            {emergencyContacts.map((contact) => {
              const Icon = contact.icon;
              return (
                <AnimatedItem key={contact.id}>
                  <SectionCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2.5 rounded-xl", contact.bgColor)}>
                        <Icon className={cn("w-5 h-5", contact.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">
                          {language === 'ru' ? contact.titleRu : contact.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {language === 'ru' ? contact.descriptionRu : contact.description}
                        </p>
                        
                        {/* Single phone */}
                        {contact.phone && (
                          <Button
                            variant="default"
                            size="sm"
                            className="mt-3"
                            onClick={() => handleCall(contact.phone!)}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            {contact.phone}
                          </Button>
                        )}
                        
                        {/* Multiple phones */}
                        {contact.phones && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {contact.phones.map((p, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => handleCall(p.number)}
                              >
                                <Phone className="w-3 h-3 mr-1.5" />
                                <span className="text-xs">
                                  {language === 'ru' ? p.labelRu : p.label}: {p.number}
                                </span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                </AnimatedItem>
              );
            })}
          </AnimatedList>
        </FadeInUp>

        {/* Useful Numbers */}
        <FadeInUp delay={0.35}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Полезные номера' : 'Useful Numbers'}
          </h3>
          <SectionCard className="divide-y divide-border">
            {usefulNumbers.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between py-3 px-1 first:pt-0 last:pb-0"
              >
                <span className="text-sm">
                  {language === 'ru' ? item.labelRu : item.label}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCall(item.number)}
                  className="text-primary"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  {item.number}
                </Button>
              </div>
            ))}
          </SectionCard>
        </FadeInUp>

        {/* Tips Section */}
        <FadeInUp delay={0.4}>
          <div className="mt-6 p-4 rounded-2xl bg-muted/50 border border-border">
            <h4 className="font-medium mb-2">
              {language === 'ru' ? '💡 Полезные советы' : '💡 Useful Tips'}
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>
                {language === 'ru' 
                  ? '• Сохраните эту страницу в закладки для быстрого доступа'
                  : '• Bookmark this page for quick access'}
              </li>
              <li>
                {language === 'ru' 
                  ? '• Туристическая полиция (1155) говорит по-английски'
                  : '• Tourist Police (1155) speaks English'}
              </li>
              <li>
                {language === 'ru' 
                  ? '• При укусе змеи — НЕ ПАНИКУЙТЕ, вызовите скорую'
                  : "• For snake bites — DON'T PANIC, call ambulance"}
              </li>
              <li>
                {language === 'ru' 
                  ? '• Сфотографируйте документы и храните копии в облаке'
                  : '• Photograph documents and keep copies in the cloud'}
              </li>
              <li>
                {language === 'ru' 
                  ? '• UNO ALERT — ваша личная служба безопасности 24/7'
                  : '• UNO ALERT — your personal security service 24/7'}
              </li>
            </ul>
          </div>
        </FadeInUp>
      </PageContainer>
    </AppLayout>
  );
}
