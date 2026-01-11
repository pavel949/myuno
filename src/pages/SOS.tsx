import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Shield, 
  Flame, 
  Car, 
  AlertTriangle,
  FileQuestion,
  Heart,
  MessageCircle,
  Star,
  Sparkles,
  Crown,
  Stethoscope,
  Wrench,
  Key,
  ChevronRight,
  Lightbulb,
  WifiOff,
  Download,
  CheckCircle2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { FadeInUp } from '@/components/layout/AnimatedList';
import { cn } from '@/lib/utils';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { toast } from 'sonner';

// UNO Emergency Contact
const UNO_EMERGENCY_PHONE = '+66922407355';
const UNO_WHATSAPP = 'https://wa.me/66922407355';

// Quick action buttons for most critical services
const quickActions = [
  { id: 'police', icon: Shield, phone: '1155', label: 'Police', labelRu: 'Полиция', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'ambulance', icon: Heart, phone: '1669', label: 'Ambulance', labelRu: 'Скорая', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'fire', icon: Flame, phone: '199', label: 'Fire', labelRu: 'Пожарные', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'emergency', icon: AlertTriangle, phone: '191', label: 'Emergency', labelRu: 'SOS', color: 'text-red-500', bg: 'bg-red-500/10' },
];

// Organized by category
const emergencyCategories = [
  {
    id: 'medical',
    icon: Stethoscope,
    title: 'Medical',
    titleRu: 'Медицина',
    color: 'text-rose-500',
    contacts: [
      { name: 'Ambulance', nameRu: 'Скорая помощь', phone: '1669', desc: 'Medical emergencies', descRu: 'Медицинские экстренные случаи' },
      { name: 'Phuket International Hospital', nameRu: 'Пхукет Интернешнл', phone: '076-249-400' },
      { name: 'Bangkok Hospital Phuket', nameRu: 'Бангкок Госпиталь', phone: '076-254-425' },
      { name: 'Dibuk Hospital', nameRu: 'Госпиталь Дибук', phone: '076-254-421' },
    ]
  },
  {
    id: 'police',
    icon: Shield,
    title: 'Police & Safety',
    titleRu: 'Полиция и безопасность',
    color: 'text-blue-500',
    contacts: [
      { name: 'Tourist Police', nameRu: 'Туристическая полиция', phone: '1155', desc: '24/7 English-speaking', descRu: 'Круглосуточно, на английском' },
      { name: 'Emergency Services', nameRu: 'Экстренные службы', phone: '191', desc: 'Fire, ambulance, rescue', descRu: 'Пожарные, скорая, спасатели' },
      { name: 'Traffic Accident', nameRu: 'ДТП', phone: '1193', desc: 'Road accidents', descRu: 'Дорожные происшествия' },
    ]
  },
  {
    id: 'documents',
    icon: FileQuestion,
    title: 'Documents & Money',
    titleRu: 'Документы и деньги',
    color: 'text-purple-500',
    contacts: [
      { name: 'Immigration Phuket', nameRu: 'Иммиграция Пхукет', phone: '076-221-905' },
      { name: 'Immigration Hotline', nameRu: 'Горячая линия иммиграции', phone: '1178' },
      { name: 'Russian Embassy Bangkok', nameRu: 'Посольство РФ Бангкок', phone: '02-234-9824' },
      { name: 'Russian Consulate Phuket', nameRu: 'Консульство РФ Пхукет', phone: '076-510-392' },
    ]
  },
  {
    id: 'transport',
    icon: Car,
    title: 'Transport',
    titleRu: 'Транспорт',
    color: 'text-amber-500',
    contacts: [
      { name: 'Taxi Call Center', nameRu: 'Такси', phone: '1681' },
      { name: 'Phuket Airport', nameRu: 'Аэропорт Пхукета', phone: '076-351-122' },
    ]
  },
];

// Service links
const serviceLinks = [
  { 
    id: 'road', 
    icon: Wrench, 
    title: 'Road Assistance', 
    titleRu: 'Помощь на дороге',
    desc: 'Tow, fuel, battery, tires',
    descRu: 'Эвакуатор, топливо, аккумулятор',
    path: '/services?category=road-assistance',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  { 
    id: 'locksmith', 
    icon: Key, 
    title: 'Locksmith', 
    titleRu: 'Слесарь',
    desc: 'Keys, locks, safes',
    descRu: 'Ключи, замки, сейфы',
    path: '/services?category=locksmith',
    color: 'text-slate-500',
    bg: 'bg-slate-500/10'
  },
];

// Grouped emergency tips
const tipCategories = [
  {
    id: 'medical',
    title: 'Medical Emergencies',
    titleRu: 'Медицинские ситуации',
    icon: '🏥',
    tips: [
      { en: 'For snake bites, call 1669 and go to hospital immediately', ru: 'При укусе змеи звоните 1669 и езжайте в больницу' },
      { en: 'Jellyfish sting: rinse with vinegar, remove tentacles, seek medical help', ru: 'Укус медузы: промойте уксусом, удалите щупальца, обратитесь к врачу' },
      { en: 'Sunstroke: move to shade, cool down with wet cloths, drink water, call ambulance if severe', ru: 'Солнечный удар: переместитесь в тень, охладите тело, пейте воду, при тяжёлом состоянии — скорая' },
      { en: 'Food poisoning: drink plenty of water, take activated charcoal, visit hospital if symptoms persist', ru: 'Отравление: пейте много воды, примите активированный уголь, при ухудшении — в больницу' },
      { en: 'Allergic reaction: take antihistamine, call 1669 if breathing difficulty', ru: 'Аллергия: примите антигистаминное, при затруднении дыхания — 1669' },
      { en: 'Burns: cool with running water 10+ min, do not apply ice or butter, seek help for large burns', ru: 'Ожоги: охладите водой 10+ мин, не прикладывайте лёд или масло, при сильных — к врачу' },
      { en: 'Dengue fever symptoms: high fever, rash, joint pain — go to hospital immediately', ru: 'Симптомы денге: высокая температура, сыпь, боль в суставах — сразу в больницу' },
      { en: 'Dehydration: drink ORS solution or coconut water, seek shade, rest', ru: 'Обезвоживание: пейте раствор ORS или кокосовую воду, укрытие в тени, отдых' },
      { en: 'Insect bites: clean wound, apply antihistamine cream, watch for infection signs', ru: 'Укусы насекомых: очистите рану, нанесите антигистаминный крем, следите за признаками инфекции' },
      { en: 'Sprained ankle: RICE method - Rest, Ice, Compression, Elevation', ru: 'Растяжение: метод RICE — Покой, Лёд, Компрессия, Подъём ноги' },
    ]
  },
  {
    id: 'water',
    title: 'Water & Beach Safety',
    titleRu: 'Безопасность на воде',
    icon: '🌊',
    tips: [
      { en: 'Drowning risk: swim only at beaches with lifeguards, avoid red flag areas', ru: 'Риск утонуть: купайтесь только на пляжах со спасателями, избегайте зон с красным флагом' },
      { en: 'Rip current: do not swim against it, swim parallel to shore, then back to beach', ru: 'Отбойное течение: не плывите против него, плывите параллельно берегу, затем к пляжу' },
      { en: 'Red flags mean no swimming — this is strictly enforced during monsoon', ru: 'Красные флаги означают запрет купания — строго соблюдается в сезон муссонов' },
      { en: 'Never swim alone, especially at night or after drinking alcohol', ru: 'Никогда не плавайте в одиночку, особенно ночью или после алкоголя' },
      { en: 'Coral cuts: clean thoroughly with fresh water, apply antiseptic, monitor for infection', ru: 'Порезы о кораллы: тщательно промойте пресной водой, нанесите антисептик, следите за инфекцией' },
      { en: 'Sea urchin spines: soak in hot water, remove carefully, seek medical help if deep', ru: 'Иглы морского ежа: замочите в горячей воде, аккуратно удалите, при глубоких — к врачу' },
      { en: 'Boat accident: wear life jacket, stay calm, signal for help with bright colors', ru: 'ДТП на лодке: наденьте спасжилет, сохраняйте спокойствие, подавайте сигналы яркими цветами' },
      { en: 'Diving emergency: do not fly for 24h after diving, call DAN hotline for decompression', ru: 'Экстренная ситуация при дайвинге: не летайте 24ч после погружения, звоните на горячую линию DAN' },
    ]
  },
  {
    id: 'traffic',
    title: 'Traffic & Transport',
    titleRu: 'Дорожные ситуации',
    icon: '🛵',
    tips: [
      { en: 'Motorbike accident: do not move the injured, call 1669 immediately', ru: 'ДТП на мотобайке: не перемещайте пострадавших, сразу звоните 1669' },
      { en: 'Scooter breakdown: call your rental company or use Road Assistance in this app', ru: 'Поломка скутера: звоните в прокат или используйте Помощь на дороге в приложении' },
      { en: 'Always wear a helmet — fines are strict and hospitals may not treat without it', ru: 'Всегда носите шлем — штрафы строгие, больницы могут отказать без него' },
      { en: 'Traffic accident: take photos of damage, license plates, and call Tourist Police 1155', ru: 'ДТП: сфотографируйте повреждения, номера, позвоните в турполицию 1155' },
      { en: 'Never leave the scene of an accident — call police and wait', ru: 'Никогда не покидайте место ДТП — вызовите полицию и ждите' },
      { en: 'Flat tire: pull over safely, turn on hazard lights, call Road Assistance', ru: 'Спущенное колесо: безопасно остановитесь, включите аварийку, вызовите помощь на дороге' },
      { en: 'Out of fuel: many 7-Elevens sell bottled gasoline, or call for delivery', ru: 'Закончился бензин: многие 7-Eleven продают бутылочный бензин, или вызовите доставку' },
      { en: 'Lost rental key: contact rental immediately, do not leave bike unattended', ru: 'Потеряли ключ от аренды: сразу свяжитесь с прокатом, не оставляйте байк без присмотра' },
    ]
  },
  {
    id: 'documents',
    title: 'Documents & Legal',
    titleRu: 'Документы и право',
    icon: '📄',
    tips: [
      { en: 'Lost passport: contact your embassy and file a police report at Tourist Police', ru: 'Потеря паспорта: свяжитесь с посольством и подайте заявление в турполицию' },
      { en: 'Theft: file a report at Tourist Police for insurance claims', ru: 'Кража: подайте заявление в турполицию для страховой компании' },
      { en: 'Keep copies of passport, visa, and insurance in cloud storage', ru: 'Храните копии паспорта, визы и страховки в облаке' },
      { en: 'Visa overstay: contact Immigration immediately — fines increase daily', ru: 'Просрочка визы: сразу свяжитесь с иммиграцией — штрафы растут ежедневно' },
      { en: 'Police stop: stay calm, be polite, ask for Tourist Police if needed', ru: 'Остановила полиция: будьте спокойны, вежливы, попросите турполицию при необходимости' },
      { en: 'Never hand over your original passport — show a copy instead', ru: 'Никогда не отдавайте оригинал паспорта — показывайте копию' },
      { en: 'For legal disputes, contact your consulate for recommended lawyers', ru: 'При юридических спорах свяжитесь с консульством для рекомендаций адвокатов' },
      { en: 'Traffic fine: pay at police station, get receipt, do not pay to officers directly', ru: 'Штраф за ПДД: платите в участке, берите квитанцию, не платите офицерам напрямую' },
    ]
  },
  {
    id: 'wildlife',
    title: 'Wildlife & Nature',
    titleRu: 'Животные и природа',
    icon: '🐒',
    tips: [
      { en: 'Monkeys: do not feed or provoke, keep belongings secure, seek help if bitten', ru: 'Обезьяны: не кормите и не провоцируйте, держите вещи при себе, при укусе — к врачу' },
      { en: 'Stray dogs: avoid eye contact, do not run, back away slowly', ru: 'Бродячие собаки: избегайте зрительного контакта, не бегите, медленно отступайте' },
      { en: 'Dog or cat bite: wash wound, get rabies vaccination within 24h — very important!', ru: 'Укус собаки/кошки: промойте рану, сделайте прививку от бешенства в течение 24ч — очень важно!' },
      { en: 'Centipede bite: extremely painful, apply ice, take painkiller, seek medical help', ru: 'Укус сороконожки: очень больно, приложите лёд, примите обезболивающее, обратитесь к врачу' },
      { en: 'Scorpion sting: apply ice, take antihistamine, go to hospital if severe reaction', ru: 'Укус скорпиона: приложите лёд, примите антигистаминное, при сильной реакции — в больницу' },
      { en: 'Elephant encounter: stay calm, do not run, give them space', ru: 'Встреча со слоном: сохраняйте спокойствие, не бегите, дайте им пространство' },
      { en: 'Gecko bites are harmless — clean with antiseptic, no treatment needed', ru: 'Укусы гекконов безвредны — обработайте антисептиком, лечение не нужно' },
      { en: 'Avoid touching any unfamiliar marine life — many are venomous', ru: 'Не трогайте незнакомых морских обитателей — многие ядовиты' },
    ]
  },
  {
    id: 'weather',
    title: 'Weather & Natural Disasters',
    titleRu: 'Погода и стихийные бедствия',
    icon: '⛈️',
    tips: [
      { en: 'Monsoon season: flash floods possible, avoid low areas, do not cross flooded roads', ru: 'Сезон муссонов: возможны наводнения, избегайте низин, не переезжайте затопленные дороги' },
      { en: 'Thunderstorm: get out of water, seek shelter, avoid open areas and tall objects', ru: 'Гроза: выйдите из воды, найдите укрытие, избегайте открытых мест и высоких объектов' },
      { en: 'Earthquake: drop, cover, hold on, then evacuate to open area', ru: 'Землетрясение: упадите, укройтесь, держитесь, затем эвакуируйтесь на открытое место' },
      { en: 'Tsunami warning: move immediately to high ground or upper floors', ru: 'Предупреждение о цунами: немедленно двигайтесь на возвышенность или верхние этажи' },
      { en: 'If sea suddenly recedes far from shore — this is a tsunami sign, run to high ground!', ru: 'Если море внезапно отступило далеко — это знак цунами, бегите на возвышенность!' },
      { en: 'Landslide risk after heavy rain — avoid hillsides and unstable slopes', ru: 'Риск оползней после сильного дождя — избегайте склонов холмов' },
    ]
  },
  {
    id: 'security',
    title: 'Personal Security',
    titleRu: 'Личная безопасность',
    icon: '🔒',
    tips: [
      { en: 'UNO ALERT provides personal security and emergency help 24/7', ru: 'UNO ALERT — личная безопасность и экстренная помощь 24/7' },
      { en: 'Tourist Police (1155) speaks English and helps tourists', ru: 'Турполиция (1155) говорит по-английски и помогает туристам' },
      { en: 'Scam alert: never show your credit card to strangers, use official taxis', ru: 'Осторожно, мошенники: не показывайте карту посторонним, пользуйтесь официальным такси' },
      { en: 'ATM skimming: use ATMs inside banks, cover keypad when entering PIN', ru: 'Скимминг банкоматов: используйте банкоматы внутри банков, прикрывайте клавиатуру при вводе PIN' },
      { en: 'Drink spiking: never leave drinks unattended, watch your drink being made', ru: 'Подсыпание в напитки: не оставляйте напитки без присмотра, следите за приготовлением' },
      { en: 'Fake police: real officers have ID cards, ask to see them', ru: 'Фальшивая полиция: у настоящих офицеров есть удостоверения, попросите показать' },
      { en: 'Jet ski scam: photograph any damage before renting, use reputable companies', ru: 'Обман с гидроциклами: фотографируйте повреждения до аренды, пользуйтесь надёжными компаниями' },
      { en: 'Share your location with family/friends when going on tours or remote areas', ru: 'Делитесь геолокацией с семьёй/друзьями при поездках на экскурсии или в отдалённые места' },
    ]
  },
  {
    id: 'accommodation',
    title: 'Accommodation Issues',
    titleRu: 'Проблемы с жильём',
    icon: '🏠',
    tips: [
      { en: 'Power outage: check if it is building-wide, contact reception or landlord', ru: 'Отключение электричества: проверьте, во всём ли здании, свяжитесь с ресепшн или владельцем' },
      { en: 'AC not working: check if filters are clean, call maintenance, use fans temporarily', ru: 'Не работает кондиционер: проверьте чистоту фильтров, вызовите обслуживание, временно используйте вентилятор' },
      { en: 'Water leak: turn off main valve, contact building management immediately', ru: 'Протечка воды: перекройте главный вентиль, сразу свяжитесь с управляющей компанией' },
      { en: 'Locked out: contact reception or use locksmith service in this app', ru: 'Заперлись снаружи: свяжитесь с ресепшн или используйте службу слесаря в приложении' },
      { en: 'Fire in building: do not use elevators, use fire stairs, meet at assembly point', ru: 'Пожар в здании: не пользуйтесь лифтами, используйте пожарные лестницы, соберитесь в точке сбора' },
      { en: 'Suspicious person: do not confront, go to safe area, call security or police', ru: 'Подозрительный человек: не вступайте в контакт, идите в безопасное место, вызовите охрану или полицию' },
    ]
  },
  {
    id: 'general',
    title: 'General Tips',
    titleRu: 'Общие советы',
    icon: '💡',
    tips: [
      { en: 'Save this page offline for emergencies', ru: 'Сохраните эту страницу для офлайн-доступа' },
      { en: 'Always have travel insurance — medical costs can be very high', ru: 'Всегда имейте туристическую страховку — медицинские расходы могут быть очень высокими' },
      { en: 'Carry emergency cash in THB — not all places accept cards', ru: 'Имейте при себе наличные в батах — не везде принимают карты' },
      { en: 'Know your hotel address in Thai — show to taxi drivers', ru: 'Знайте адрес отеля на тайском — покажите водителю такси' },
      { en: 'Download offline maps of Phuket — GPS works without internet', ru: 'Скачайте офлайн-карты Пхукета — GPS работает без интернета' },
      { en: 'Register with your embassy for emergency notifications', ru: 'Зарегистрируйтесь в посольстве для экстренных уведомлений' },
    ]
  },
];

export default function SOS() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isOffline, isSOSCached, cacheSOS } = useOfflineStatus();
  const [isCaching, setIsCaching] = useState(false);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSaveOffline = async () => {
    setIsCaching(true);
    try {
      const success = await cacheSOS();
      if (success) {
        toast.success(
          language === 'ru' 
            ? 'Страница SOS сохранена для офлайн-доступа' 
            : 'SOS page saved for offline access'
        );
      } else {
        toast.error(
          language === 'ru' 
            ? 'Не удалось сохранить. Попробуйте обновить страницу.' 
            : 'Could not save. Try refreshing the page.'
        );
      }
    } catch {
      toast.error(language === 'ru' ? 'Ошибка сохранения' : 'Save failed');
    }
    setIsCaching(false);
  };

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title="SOS" showBack />

        {/* Offline indicator */}
        {isOffline && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              {language === 'ru' ? 'Вы офлайн — данные из кеша' : 'You are offline — using cached data'}
            </span>
          </div>
        )}

        {/* UNO ALERT */}
        <FadeInUp>
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-red-500/20 border-2 border-amber-500/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
                <Star className="w-4 h-4 text-white" fill="white" />
              </div>
              <h2 className="font-bold text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                UNO ALERT
              </h2>
              <Crown className="w-4 h-4 text-amber-500" />
            </div>
            
            <p className="text-sm text-foreground/80 mb-3">
              {language === 'ru' 
                ? 'Личная безопасность и помощь в экстремальных ситуациях. 24/7.' 
                : 'Personal security & emergency assistance. 24/7.'}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                onClick={() => window.location.href = `tel:${UNO_EMERGENCY_PHONE}`}
              >
                <Phone className="w-4 h-4 mr-1.5" />
                {language === 'ru' ? 'Позвонить' : 'Call'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                onClick={() => window.open(UNO_WHATSAPP, '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-1.5" />
                WhatsApp
              </Button>
            </div>
          </div>
        </FadeInUp>

        {/* Quick Actions - 4 big buttons */}
        <FadeInUp delay={0.05}>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleCall(action.phone)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-xl border transition-all active:scale-95",
                    action.bg, "border-transparent hover:border-current/20"
                  )}
                >
                  <Icon className={cn("w-6 h-6 mb-1", action.color)} />
                  <span className="font-bold text-lg">{action.phone}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {language === 'ru' ? action.labelRu : action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </FadeInUp>

        {/* VIP Concierge Link */}
        <FadeInUp delay={0.1}>
          <button 
            className="w-full mb-5 p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-purple-500/30 flex items-center justify-between hover:border-purple-500/50 transition-colors"
            onClick={() => navigate('/vip-concierge')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm flex items-center gap-1">
                  {language === 'ru' ? 'VIP Консьерж' : 'VIP Concierge'}
                  <Sparkles className="w-3 h-3 text-purple-500" />
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Вертолёты, яхты, повара...' : 'Helicopters, yachts, chefs...'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-500" />
          </button>
        </FadeInUp>

        {/* Service Links */}
        <FadeInUp delay={0.15}>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {serviceLinks.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  onClick={() => navigate(service.path)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    service.bg, "border-transparent hover:border-current/20"
                  )}
                >
                  <Icon className={cn("w-5 h-5", service.color)} />
                  <div>
                    <div className="font-medium text-sm">
                      {language === 'ru' ? service.titleRu : service.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {language === 'ru' ? service.descRu : service.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </FadeInUp>

        {/* Emergency Categories */}
        {emergencyCategories.map((category, catIdx) => {
          const CatIcon = category.icon;
          return (
            <FadeInUp key={category.id} delay={0.2 + catIdx * 0.05}>
              <SectionCard className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <CatIcon className={cn("w-5 h-5", category.color)} />
                  <SectionTitle className="mb-0">
                    {language === 'ru' ? category.titleRu : category.title}
                  </SectionTitle>
                </div>
                <div className="space-y-2">
                  {category.contacts.map((contact, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {language === 'ru' ? contact.nameRu : contact.name}
                        </div>
                        {contact.desc && (
                          <div className="text-xs text-muted-foreground">
                            {language === 'ru' ? contact.descRu : contact.desc}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-primary"
                        onClick={() => handleCall(contact.phone)}
                      >
                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                        {contact.phone}
                      </Button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </FadeInUp>
          );
        })}

        {/* Grouped Tips */}
        <FadeInUp delay={0.45}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-lg">
              {language === 'ru' ? 'Экстренные ситуации и советы' : 'Emergency Situations & Tips'}
            </h2>
          </div>
        </FadeInUp>

        {tipCategories.map((category, catIdx) => (
          <FadeInUp key={category.id} delay={0.5 + catIdx * 0.03}>
            <SectionCard className="mb-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{category.icon}</span>
                <SectionTitle className="mb-0 text-sm">
                  {language === 'ru' ? category.titleRu : category.title}
                </SectionTitle>
              </div>
              <ul className="space-y-1.5">
                {category.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5 text-xs">•</span>
                    <span>{language === 'ru' ? tip.ru : tip.en}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </FadeInUp>
        ))}

        {/* Save Offline Button */}
        <FadeInUp delay={0.5}>
          <Button
            variant="outline"
            className="w-full mt-4 gap-2"
            onClick={handleSaveOffline}
            disabled={isCaching}
          >
            {isSOSCached ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {language === 'ru' ? 'Сохранено для офлайн' : 'Saved for offline'}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {isCaching 
                  ? (language === 'ru' ? 'Сохранение...' : 'Saving...') 
                  : (language === 'ru' ? 'Сохранить для офлайн' : 'Save for offline')}
              </>
            )}
          </Button>
        </FadeInUp>

        <div className="h-8" />
      </PageContainer>
    </AppLayout>
  );
}
