import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Car, MapPin, Ship, Utensils, Ticket, Home, Building, Settings,
  Stethoscope, Sparkles, Dumbbell, Brush, Wrench, Baby, Flower2, Dog,
  Scale, GraduationCap, Shield, Clock, Globe, Users, CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const services = [
  { icon: Car, labelRu: 'Транспорт', labelEn: 'Transport' },
  { icon: MapPin, labelRu: 'Туры', labelEn: 'Tours' },
  { icon: Ship, labelRu: 'Чартер', labelEn: 'Boat Charters' },
  { icon: Utensils, labelRu: 'Рестораны', labelEn: 'Restaurants' },
  { icon: Ticket, labelRu: 'Мероприятия', labelEn: 'Events' },
  { icon: Home, labelRu: 'Аренда жилья', labelEn: 'Rentals' },
  { icon: Building, labelRu: 'Покупка', labelEn: 'Purchase' },
  { icon: Settings, labelRu: 'Управление', labelEn: 'Management' },
  { icon: Stethoscope, labelRu: 'Медицина', labelEn: 'Healthcare' },
  { icon: Sparkles, labelRu: 'СПА', labelEn: 'SPA' },
  { icon: Dumbbell, labelRu: 'Фитнес', labelEn: 'Fitness' },
  { icon: Brush, labelRu: 'Уборка', labelEn: 'Cleaning' },
  { icon: Wrench, labelRu: 'Ремонт', labelEn: 'Repair' },
  { icon: Baby, labelRu: 'Няни', labelEn: 'Babysitters' },
  { icon: Flower2, labelRu: 'Цветы', labelEn: 'Flowers' },
  { icon: Dog, labelRu: 'Питомцы', labelEn: 'Pets' },
  { icon: Scale, labelRu: 'Юристы', labelEn: 'Legal' },
  { icon: GraduationCap, labelRu: 'Образование', labelEn: 'Education' },
];

const userTypes = [
  { 
    emoji: '🧳', 
    titleRu: 'Путешественники', 
    titleEn: 'Travelers',
    descRu: 'Жильё, туры, трансфер, рестораны',
    descEn: 'Accommodation, tours, transfers, restaurants'
  },
  { 
    emoji: '🏠', 
    titleRu: 'Резиденты', 
    titleEn: 'Residents',
    descRu: 'Медицина, визы, школы, услуги',
    descEn: 'Healthcare, visas, schools, services'
  },
  { 
    emoji: '🏢', 
    titleRu: 'Владельцы недвижимости', 
    titleEn: 'Property Owners',
    descRu: 'Управление арендой, ремонт, финансы',
    descEn: 'Rental management, repairs, finances'
  },
  { 
    emoji: '💻', 
    titleRu: 'Digital Nomads', 
    titleEn: 'Digital Nomads',
    descRu: 'Коворкинги, связь, банкинг',
    descEn: 'Coworking, connectivity, banking'
  },
];

const guarantees = [
  { icon: Shield, labelRu: 'Проверенные партнёры', labelEn: 'Verified Partners' },
  { icon: CheckCircle2, labelRu: 'Гарантия качества', labelEn: 'Quality Guarantee' },
  { icon: Globe, labelRu: 'Честные цены', labelEn: 'Fair Prices' },
  { icon: Clock, labelRu: 'Поддержка 24/7', labelEn: '24/7 Support' },
];

export function GuideEcosystem() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="p-8 print:p-12 space-y-12">
      {/* What is UNO */}
      <section id="ecosystem" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Что такое myUNO?' : 'What is myUNO?'}
        </h2>
        
        <div className="prose prose-invert max-w-none mb-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            {isRu 
              ? 'myUNO — это не просто приложение, а единое место для жизни и отдыха за рубежом. Платформа объединяет три компонента: цифровой сервис, команду на месте и сеть проверенных партнёров (G-Trust).'
              : 'myUNO is not just an app — it\'s one place for everything abroad. The platform combines three components: a digital service, an on-ground team, and a network of verified partners (G-Trust).'
            }
          </p>
        </div>

        {/* User Types */}
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {isRu ? 'Для кого создан UNO' : 'Who is UNO for'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {userTypes.map((user) => (
            <Card key={user.titleEn} className="bg-card border-border">
              <CardContent className="p-4 flex items-start gap-4">
                <span className="text-3xl">{user.emoji}</span>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {isRu ? user.titleRu : user.titleEn}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? user.descRu : user.descEn}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* All Services */}
      <section id="services" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Все сервисы платформы' : 'All Platform Services'}
        </h2>
        
        <p className="text-muted-foreground mb-6">
          {isRu 
            ? 'UNO объединяет 15+ категорий услуг в одном приложении:'
            : 'UNO combines 15+ service categories in one app:'
          }
        </p>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {services.map((service) => (
            <div 
              key={service.labelEn}
              className="flex flex-col items-center gap-2 p-3 rounded-none bg-secondary/30 print:bg-muted/20"
            >
              <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
                <service.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-center text-muted-foreground">
                {isRu ? service.labelRu : service.labelEn}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* G-Trust Guarantees */}
      <section id="advantages" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Система гарантий G-Trust' : 'G-Trust Guarantee System'}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {guarantees.map((item) => (
            <Card key={item.labelEn} className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <span className="text-sm font-medium text-foreground">
                  {isRu ? item.labelRu : item.labelEn}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-secondary/30 rounded-none">
          <p className="text-sm text-muted-foreground">
            {isRu 
              ? 'Все партнёры проходят проверку документов, лицензий и отзывов. При проблемах — возврат денег или альтернатива.'
              : 'All partners undergo document, license, and review verification. If issues arise — refund or alternative solution.'
            }
          </p>
        </div>
      </section>
    </div>
  );
}
