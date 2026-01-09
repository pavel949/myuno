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
  MessageCircle
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { AnimatedList, AnimatedItem, FadeInUp } from '@/components/layout/AnimatedList';
import { cn } from '@/lib/utils';

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

        {/* Emergency Warning */}
        <FadeInUp>
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
        <FadeInUp delay={0.1}>
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
        <FadeInUp delay={0.2}>
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
        <FadeInUp delay={0.3}>
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
            </ul>
          </div>
        </FadeInUp>
      </PageContainer>
    </AppLayout>
  );
}
