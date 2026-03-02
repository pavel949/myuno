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
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { resolveIcon } from '@/lib/iconMap';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { toast } from 'sonner';
import { COMPANY_CONTACTS, getTelLink } from '@/lib/config/contacts';
import { OfflineEmergencyCard } from '@/components/home/OfflineEmergencyCard';

// Quick action buttons for most critical services
const quickActions = [
  { id: 'police', icon: Shield, phone: '1155', label: 'Police', labelRu: 'Полиция', color: 'text-info', bg: 'bg-info/10' },
  { id: 'ambulance', icon: Heart, phone: '1669', label: 'Ambulance', labelRu: 'Скорая', color: 'text-destructive', bg: 'bg-destructive/10' },
  { id: 'fire', icon: Flame, phone: '199', label: 'Fire', labelRu: 'Пожарные', color: 'text-warning', bg: 'bg-warning/10' },
  { id: 'emergency', icon: AlertTriangle, phone: '191', label: 'Emergency', labelRu: 'SOS', color: 'text-destructive', bg: 'bg-destructive/10' },
];

// Organized by category
const emergencyCategories = [
  {
    id: 'medical',
    icon: Stethoscope,
    title: 'Medical',
    titleRu: 'Медицина',
    color: 'text-destructive',
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
    color: 'text-info',
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
    color: 'text-accent-purple',
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
    color: 'text-warning',
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

// Grouped emergency tips - more practical with clear actions
const tipCategories = [
  {
    id: 'medical',
    title: 'Medical',
    titleRu: 'Медицина',
    icon: '🏥',
    tips: [
      { en: 'Snake bite → Call 1669, do NOT suck venom, keep limb below heart level', ru: 'Укус змеи → Звоните 1669, НЕ отсасывайте яд, держите конечность ниже сердца' },
      { en: 'Jellyfish → Rinse with vinegar (NOT fresh water), scrape tentacles with card', ru: 'Медуза → Промойте уксусом (НЕ пресной водой), соскребите щупальца картой' },
      { en: 'Sunstroke → Shade + wet towels on neck/armpits + sips of water → 1669 if unconscious', ru: 'Солнечный удар → Тень + мокрые полотенца на шею/подмышки + вода → 1669 при потере сознания' },
      { en: 'Food poisoning → ORS/coconut water + activated charcoal → hospital if blood in stool', ru: 'Отравление → Раствор ОРС/кокос + уголь → больница если кровь в стуле' },
      { en: 'Allergic reaction → Antihistamine now, EpiPen if have → 1669 if throat swelling', ru: 'Аллергия → Антигистамин сейчас, EpiPen если есть → 1669 при отёке горла' },
      { en: 'Dengue signs: fever + rash + joint pain → hospital immediately, drink fluids', ru: 'Признаки денге: температура + сыпь + боль в суставах → в больницу, пить жидкость' },
      { en: 'Burns → 10+ min under cool (not ice) water → cling film → hospital for large burns', ru: 'Ожоги → 10+ мин под прохладной водой → пищевая плёнка → больница при больших ожогах' },
    ]
  },
  {
    id: 'water',
    title: 'Beach & Sea',
    titleRu: 'Пляж и море',
    icon: '🌊',
    tips: [
      { en: 'Rip current → Do NOT fight it! Swim PARALLEL to shore until free, then to beach', ru: 'Отбойное течение → НЕ боритесь! Плывите ПАРАЛЛЕЛЬНО берегу, затем к пляжу' },
      { en: 'Red flags = NO SWIMMING. Fines + real danger. Lifeguards enforce strictly.', ru: 'Красные флаги = КУПАТЬСЯ НЕЛЬЗЯ. Штрафы + реальная опасность.' },
      { en: 'Sea urchin spines → Soak in hot water 30min, tweezers for shallow ones, doctor for deep', ru: 'Иглы ежа → Замочите в горячей воде 30мин, пинцет для мелких, врач для глубоких' },
      { en: 'Coral cuts → Wash with fresh water + soap, antiseptic, watch for infection 3 days', ru: 'Порезы о кораллы → Промыть пресной водой + мыло, антисептик, следить 3 дня' },
      { en: 'Diving: no flying 24h after! DAN emergency: +66-2-256-7939', ru: 'Дайвинг: не летать 24ч после! DAN экстренный: +66-2-256-7939' },
    ]
  },
  {
    id: 'traffic',
    title: 'Road & Transport',
    titleRu: 'Дорога',
    icon: '🛵',
    tips: [
      { en: 'Accident → Photos of everything FIRST (damage, plates, scene) → then call 1155', ru: 'ДТП → СНАЧАЛА фото всего (повреждения, номера, место) → потом звоните 1155' },
      { en: 'No helmet = hospital may refuse treatment + insurance void. Always wear!', ru: 'Без шлема = больница может отказать + страховка недействительна. Всегда носите!' },
      { en: 'Out of fuel → 7-Eleven sells bottles (40-50 THB), or Grab delivery', ru: 'Кончился бензин → 7-Eleven продаёт бутылки (40-50 бат), или доставка Grab' },
      { en: 'Flat tire/breakdown → Hazards on, move off road, use Road Assistance in this app', ru: 'Прокол/поломка → Аварийка, съехать с дороги, Помощь на дороге в приложении' },
      { en: 'Traffic fine → Pay ONLY at police station with receipt. Never to officer directly.', ru: 'Штраф → Платите ТОЛЬКО в участке с квитанцией. Никогда напрямую офицеру.' },
    ]
  },
  {
    id: 'documents',
    title: 'Documents',
    titleRu: 'Документы',
    icon: '📄',
    tips: [
      { en: 'Lost passport → 1) Police report at Tourist Police 1155, 2) Embassy for temp passport', ru: 'Потеря паспорта → 1) Заявление в турполицию 1155, 2) Посольство за временным' },
      { en: 'Theft → Police report needed for insurance. Tourist Police speaks English: 1155', ru: 'Кража → Нужен полицейский отчёт для страховки. Турполиция на английском: 1155' },
      { en: 'Visa overstay → Immigration ASAP. Fine: 500 THB/day, max 20,000. Overstay 90+ days = ban', ru: 'Просрочка визы → В иммиграцию СРОЧНО. Штраф: 500 бат/день, макс 20,000. 90+ дней = бан' },
      { en: 'Keep passport COPY on phone + cloud. Never give original to tuk-tuk/jet-ski rentals', ru: 'Держите КОПИЮ паспорта в телефоне + облаке. Никогда не давайте оригинал прокату' },
    ]
  },
  {
    id: 'wildlife',
    title: 'Animals',
    titleRu: 'Животные',
    icon: '🐒',
    tips: [
      { en: 'Dog/cat bite → Wash 15min with soap → Rabies shots WITHIN 24H. Not optional!', ru: 'Укус собаки/кошки → Мыть 15мин с мылом → Прививки от бешенства ЧЕРЕЗ 24Ч. Обязательно!' },
      { en: 'Monkeys → No eye contact, no food showing, bag closed. If bitten = rabies shots', ru: 'Обезьяны → Без зрительного контакта, еда спрятана, сумка закрыта. Укус = прививки' },
      { en: 'Stray dogs → Freeze, no eye contact, back away slowly. Never run.', ru: 'Бродячие собаки → Замрите, без зрительного контакта, медленно отступайте. Не бегите.' },
      { en: 'Centipede (very painful!) → Ice + painkiller + antihistamine → hospital if severe', ru: 'Сороконожка (очень больно!) → Лёд + обезболивающее + антигистамин → больница при сильной' },
    ]
  },
  {
    id: 'weather',
    title: 'Weather',
    titleRu: 'Погода',
    icon: '⛈️',
    tips: [
      { en: 'Tsunami sign → Sea suddenly pulls FAR back = RUN to high ground/upper floors NOW', ru: 'Знак цунами → Море внезапно отступило ДАЛЕКО = БЕГИТЕ на возвышенность СЕЙЧАС' },
      { en: 'Monsoon floods → Never cross flooded roads. 30cm water can sweep a car.', ru: 'Муссонные наводнения → Никогда не переезжайте затопленные дороги. 30см сносят машину.' },
      { en: 'Thunderstorm → Exit water immediately, avoid trees/metal, crouch if caught in open', ru: 'Гроза → Выйти из воды немедленно, избегать деревьев/металла, присесть на открытом месте' },
    ]
  },
  {
    id: 'security',
    title: 'Safety & Scams',
    titleRu: 'Безопасность',
    icon: '🔒',
    tips: [
      { en: 'Jet-ski scam → Video ALL scratches before rent. Use phone timestamp.', ru: 'Обман с гидроциклами → Снимите ВСЕ царапины до аренды. Используйте метку времени.' },
      { en: 'Drink spiking → Never leave drink, watch it being made, buy your own', ru: 'Подсыпание в напиток → Не оставляйте напиток, следите за приготовлением, покупайте сами' },
      { en: 'ATM → Use bank ATMs inside. Cover PIN. 200 THB fee is normal, more = scam', ru: 'Банкомат → Используйте в банках. Прикрывайте PIN. 200 бат комиссия нормально, больше = обман' },
      { en: 'Fake police → Real police have ID card + badge number. Ask to see. Call 1155 if unsure.', ru: 'Фальшивая полиция → У настоящих есть удостоверение + номер значка. Попросите. Звоните 1155.' },
      { en: 'Share location with someone when going to remote areas or on tours', ru: 'Делитесь локацией когда едете в отдалённые места или на экскурсии' },
    ]
  },
  {
    id: 'accommodation',
    title: 'Accommodation',
    titleRu: 'Жильё',
    icon: '🏠',
    tips: [
      { en: 'Locked out → Reception first, or Locksmith service in this app (24/7)', ru: 'Заперлись → Сначала ресепшн, или Слесарь в приложении (24/7)' },
      { en: 'Power out → Check breaker box first. If building-wide, wait 10-30min usually', ru: 'Нет света → Проверьте автоматы. Если во всём доме, обычно ждать 10-30мин' },
      { en: 'Fire → Do NOT use elevator. Wet towel over mouth. Fire stairs only.', ru: 'Пожар → НЕ используйте лифт. Мокрое полотенце на рот. Только пожарная лестница.' },
    ]
  },
  {
    id: 'general',
    title: 'Pro Tips',
    titleRu: 'Важное',
    icon: '💡',
    tips: [
      { en: 'Save this page offline NOW — works without internet', ru: 'Сохраните эту страницу офлайн СЕЙЧАС — работает без интернета' },
      { en: 'Travel insurance = MUST. Hospital bill can be 50,000-500,000 THB easily', ru: 'Страховка = ОБЯЗАТЕЛЬНО. Счёт больницы легко 50,000-500,000 бат' },
      { en: 'Keep 2000+ THB cash always — not all accept cards, ATMs may be far', ru: 'Всегда 2000+ бат наличными — не везде карты, банкоматы могут быть далеко' },
      { en: 'Hotel address in Thai on phone — show taxi driver, they often cannot read English', ru: 'Адрес отеля на тайском в телефоне — показать таксисту, часто не читают английский' },
    ]
  },
];

export default function SOS() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isOffline, isSOSCached, cacheSOS } = useOfflineStatus();
  const [isCaching, setIsCaching] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

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
    <AppLayout showHeader={false}>
      <PageContainer>
        <PageHeader title="SOS" showBack fallbackPath="/" />

        {/* Offline indicator + Emergency Card */}
        {isOffline && (
          <div className="mb-4 space-y-3">
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-warning" />
              <span className="text-sm text-warning font-medium">
                {language === 'ru' ? 'Вы офлайн — данные из кеша' : 'You are offline — using cached data'}
              </span>
            </div>
            <OfflineEmergencyCard />
          </div>
        )}

        {/* UNO ALERT */}
        <div className="mb-5 p-4 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-full bg-primary">
              <Star className="w-4 h-4 text-primary-foreground" fill="currentColor" />
            </div>
            <h2 className="font-bold text-lg text-foreground">
              UNO ALERT
            </h2>
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
              onClick={() => window.location.href = getTelLink()}
            >
              <Phone className="w-4 h-4 mr-1.5" />
              {language === 'ru' ? 'Позвонить' : 'Call'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
              onClick={() => window.open(COMPANY_CONTACTS.whatsapp.link, '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Quick Actions - 4 big buttons */}
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

        {/* VIP Concierge Link */}
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

        {/* Service Links */}
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

        {/* Emergency Categories */}
        {emergencyCategories.map((category) => {
          const CatIcon = category.icon;
          return (
            <div id={category.id} className="scroll-mt-20">
            <SectionCard key={category.id} className="mb-4">
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
            </div>
          );
        })}

        {/* Grouped Tips - Accordion Style */}
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-lg">
            {language === 'ru' ? 'Что делать если...' : 'What to do if...'}
          </h2>
        </div>

        <div className="space-y-2">
          {tipCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            return (
              <div key={category.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {(() => { const Icon = resolveIcon(category.icon); return <Icon className="w-5 h-5" />; })()}
                    <span className="font-medium text-sm">
                      {language === 'ru' ? category.titleRu : category.title}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {category.tips.length}
                    </span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )} 
                  />
                </button>
                
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-border/30">
                    <ul className="space-y-2">
                      {category.tips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2 py-1">
                          <span className="text-primary mt-0.5 font-bold">→</span>
                          <span>{language === 'ru' ? tip.ru : tip.en}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save Offline Button */}
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

        <div className="h-8" />
      </PageContainer>
    </AppLayout>
  );
}
