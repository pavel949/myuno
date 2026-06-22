import { useState } from 'react';
import { VisaTracker } from '@/components/legal/VisaTracker';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVisaServices } from '@/hooks/useVisaServices';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plane, 
  Clock, 
  FileCheck, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Globe,
  Users,
  Briefcase,
  GraduationCap,
  Heart,
  Crown,
  RefreshCw,
  MapPin,
  Phone,
  ExternalLink,
  Info
} from 'lucide-react';

// Visa type information data
const VISA_TYPES = {
  en: [
    {
      id: 'tourist',
      name: 'Tourist Visa',
      icon: Plane,
      color: 'bg-primary',
      duration: '60 days',
      extendable: 'Yes, +30 days',
      cost: '฿1,900',
      description: 'For tourists visiting Thailand for leisure, sightseeing, or visiting friends/family.',
      requirements: [
        'Valid passport (6+ months validity)',
        'Completed visa application form',
        'Recent passport-sized photo',
        'Proof of accommodation',
        'Proof of sufficient funds (20,000 THB)',
        'Flight itinerary'
      ],
      bestFor: ['Short holidays', 'First-time visitors', 'Sightseeing']
    },
    {
      id: 'visa_exempt',
      name: 'Visa Exemption',
      icon: Globe,
      color: 'bg-success',
      duration: '30-90 days',
      extendable: 'Yes, +30 days',
      cost: 'Free',
      description: 'Citizens of eligible countries can enter Thailand without a visa for tourism.',
      requirements: [
        'Valid passport (6+ months validity)',
        'Proof of onward travel',
        'Proof of accommodation',
        'Proof of sufficient funds'
      ],
      bestFor: ['Short trips', 'Business meetings', 'Transit']
    },
    {
      id: 'education',
      name: 'Education Visa (ED)',
      icon: GraduationCap,
      color: 'bg-primary',
      duration: '90 days - 1 year',
      extendable: 'Yes, renewable',
      cost: '฿2,000',
      description: 'For students enrolled in Thai educational institutions, language schools, or training programs.',
      requirements: [
        'Valid passport (6+ months validity)',
        'Acceptance letter from school',
        'Completed ED visa application',
        'Proof of financial means',
        'Recent passport photos',
        'Academic transcripts'
      ],
      bestFor: ['Language learners', 'University students', 'Martial arts training']
    },
    {
      id: 'business',
      name: 'Non-Immigrant B (Business)',
      icon: Briefcase,
      color: 'bg-accent',
      duration: '90 days - 1 year',
      extendable: 'Yes, with Work Permit',
      cost: '฿2,000',
      description: 'For business activities, employment, or establishing a company in Thailand.',
      requirements: [
        'Valid passport (6+ months validity)',
        'Letter from Thai company',
        'Company registration documents',
        'Employment contract',
        'Proof of qualifications',
        'Financial statements'
      ],
      bestFor: ['Employees', 'Business owners', 'Investors']
    },
    {
      id: 'marriage',
      name: 'Non-Immigrant O (Marriage)',
      icon: Heart,
      color: 'bg-accent',
      duration: '90 days - 1 year',
      extendable: 'Yes, annually',
      cost: '฿2,000',
      description: 'For those married to Thai nationals or supporting family members in Thailand.',
      requirements: [
        'Valid passport (6+ months validity)',
        'Marriage certificate',
        'Spouse\'s ID and house registration',
        'Proof of income (40,000 THB/month) or 400,000 THB in bank',
        'Recent photos',
        'Completed application form'
      ],
      bestFor: ['Married to Thai citizen', 'Family of Thai nationals']
    },
    {
      id: 'retirement',
      name: 'Retirement Visa (O-A/O-X)',
      icon: Users,
      color: 'bg-success',
      duration: '1 year (O-A) / 5 years (O-X)',
      extendable: 'Yes, annually',
      cost: '฿2,000 / ฿10,000',
      description: 'For retirees aged 50+ who wish to live in Thailand long-term.',
      requirements: [
        'Age 50 years or older',
        'Valid passport (6+ months validity)',
        '800,000 THB in Thai bank (O-A) or 3,000,000 THB (O-X)',
        'Health insurance (outpatient 40,000 THB, inpatient 400,000 THB)',
        'Medical certificate',
        'Police clearance certificate'
      ],
      bestFor: ['Retirees', 'Long-term residents', 'Senior expats']
    },
    {
      id: 'elite',
      name: 'Thailand Elite Visa',
      icon: Crown,
      color: 'bg-accent',
      duration: '5-20 years',
      extendable: 'Via new membership',
      cost: '฿600,000 - ฿2,140,000',
      description: 'Premium long-term visa program with VIP benefits and services.',
      requirements: [
        'Valid passport',
        'Clean criminal record',
        'Membership fee payment',
        'No serious medical conditions',
        'Completed application'
      ],
      bestFor: ['Digital nomads', 'Investors', 'Long-term residents', 'VIP travelers']
    }
  ],
  ru: [
    {
      id: 'tourist',
      name: 'Туристическая виза',
      icon: Plane,
      color: 'bg-primary',
      duration: '60 дней',
      extendable: 'Да, +30 дней',
      cost: '฿1,900',
      description: 'Для туристов, посещающих Таиланд для отдыха, осмотра достопримечательностей или визита к друзьям/родственникам.',
      requirements: [
        'Действующий паспорт (от 6 месяцев)',
        'Заполненная анкета на визу',
        'Фото паспортного формата',
        'Подтверждение проживания',
        'Подтверждение финансов (20,000 THB)',
        'Маршрут полёта'
      ],
      bestFor: ['Короткий отдых', 'Первый визит', 'Туризм']
    },
    {
      id: 'visa_exempt',
      name: 'Безвизовый въезд',
      icon: Globe,
      color: 'bg-success',
      duration: '30-90 дней',
      extendable: 'Да, +30 дней',
      cost: 'Бесплатно',
      description: 'Граждане определённых стран могут въезжать в Таиланд без визы для туризма.',
      requirements: [
        'Действующий паспорт (от 6 месяцев)',
        'Билеты вылета',
        'Подтверждение проживания',
        'Подтверждение финансов'
      ],
      bestFor: ['Короткие поездки', 'Деловые встречи', 'Транзит']
    },
    {
      id: 'education',
      name: 'Учебная виза (ED)',
      icon: GraduationCap,
      color: 'bg-primary',
      duration: '90 дней - 1 год',
      extendable: 'Да, продлеваемая',
      cost: '฿2,000',
      description: 'Для студентов образовательных учреждений, языковых школ или программ обучения в Таиланде.',
      requirements: [
        'Действующий паспорт (от 6 месяцев)',
        'Приглашение от школы',
        'Заполненная анкета ED визы',
        'Подтверждение финансов',
        'Фото паспортного формата',
        'Академическая справка'
      ],
      bestFor: ['Изучение языка', 'Студенты университетов', 'Боевые искусства']
    },
    {
      id: 'business',
      name: 'Бизнес виза (Non-B)',
      icon: Briefcase,
      color: 'bg-accent',
      duration: '90 дней - 1 год',
      extendable: 'Да, с Work Permit',
      cost: '฿2,000',
      description: 'Для бизнес-деятельности, трудоустройства или открытия компании в Таиланде.',
      requirements: [
        'Действующий паспорт (от 6 месяцев)',
        'Письмо от тайской компании',
        'Регистрационные документы компании',
        'Трудовой контракт',
        'Подтверждение квалификации',
        'Финансовая отчётность'
      ],
      bestFor: ['Сотрудники', 'Владельцы бизнеса', 'Инвесторы']
    },
    {
      id: 'marriage',
      name: 'Виза по браку (Non-O)',
      icon: Heart,
      color: 'bg-accent',
      duration: '90 дней - 1 год',
      extendable: 'Да, ежегодно',
      cost: '฿2,000',
      description: 'Для супругов граждан Таиланда или тех, кто содержит членов семьи в Таиланде.',
      requirements: [
        'Действующий паспорт (от 6 месяцев)',
        'Свидетельство о браке',
        'ID и домовая книга супруга',
        'Подтверждение дохода (40,000 THB/мес) или 400,000 THB на счету',
        'Фото',
        'Заполненная анкета'
      ],
      bestFor: ['Брак с гражданином Таиланда', 'Семья тайцев']
    },
    {
      id: 'retirement',
      name: 'Пенсионная виза (O-A/O-X)',
      icon: Users,
      color: 'bg-success',
      duration: '1 год (O-A) / 5 лет (O-X)',
      extendable: 'Да, ежегодно',
      cost: '฿2,000 / ฿10,000',
      description: 'Для пенсионеров от 50 лет, желающих жить в Таиланде на постоянной основе.',
      requirements: [
        'Возраст от 50 лет',
        'Действующий паспорт (от 6 месяцев)',
        '800,000 THB в тайском банке (O-A) или 3,000,000 THB (O-X)',
        'Медицинская страховка (амбулаторно 40,000, стационар 400,000 THB)',
        'Медицинская справка',
        'Справка о несудимости'
      ],
      bestFor: ['Пенсионеры', 'Долгосрочные резиденты', 'Экспаты 50+']
    },
    {
      id: 'elite',
      name: 'Thailand Elite Visa',
      icon: Crown,
      color: 'bg-accent',
      duration: '5-20 лет',
      extendable: 'Через новое членство',
      cost: '฿600,000 - ฿2,140,000',
      description: 'Премиальная программа долгосрочных виз с VIP-услугами и привилегиями.',
      requirements: [
        'Действующий паспорт',
        'Отсутствие судимости',
        'Оплата членского взноса',
        'Отсутствие серьёзных заболеваний',
        'Заполненная анкета'
      ],
      bestFor: ['Цифровые кочевники', 'Инвесторы', 'Долгосрочные резиденты', 'VIP-путешественники']
    }
  ],
  th: [
    {
      id: 'tourist',
      name: 'วีซ่าท่องเที่ยว',
      icon: Plane,
      color: 'bg-primary',
      duration: '60 วัน',
      extendable: 'ได้ +30 วัน',
      cost: '฿1,900',
      description: 'สำหรับนักท่องเที่ยวที่เดินทางมาประเทศไทยเพื่อพักผ่อน ชมสถานที่ หรือเยี่ยมเพื่อน/ครอบครัว',
      requirements: [
        'หนังสือเดินทางที่มีอายุเหลือ 6 เดือนขึ้นไป',
        'แบบฟอร์มขอวีซ่าที่กรอกครบถ้วน',
        'รูปถ่ายขนาดติดหนังสือเดินทาง',
        'หลักฐานที่พัก',
        'หลักฐานการเงินเพียงพอ (20,000 บาท)',
        'แผนการเดินทางเที่ยวบิน'
      ],
      bestFor: ['พักผ่อนระยะสั้น', 'ผู้มาเยือนครั้งแรก', 'ท่องเที่ยว']
    },
    {
      id: 'visa_exempt',
      name: 'ยกเว้นวีซ่า',
      icon: Globe,
      color: 'bg-success',
      duration: '30-90 วัน',
      extendable: 'ได้ +30 วัน',
      cost: 'ฟรี',
      description: 'พลเมืองของประเทศที่มีสิทธิ์สามารถเข้าประเทศไทยเพื่อการท่องเที่ยวได้โดยไม่ต้องมีวีซ่า',
      requirements: [
        'หนังสือเดินทางที่มีอายุเหลือ 6 เดือนขึ้นไป',
        'หลักฐานการเดินทางออกนอกประเทศ',
        'หลักฐานที่พัก',
        'หลักฐานการเงินเพียงพอ'
      ],
      bestFor: ['ทริปสั้น ๆ', 'ประชุมธุรกิจ', 'ผ่านแดน']
    },
    {
      id: 'education',
      name: 'วีซ่านักเรียน (ED)',
      icon: GraduationCap,
      color: 'bg-primary',
      duration: '90 วัน - 1 ปี',
      extendable: 'ได้ ต่ออายุได้',
      cost: '฿2,000',
      description: 'สำหรับนักเรียนที่ลงทะเบียนในสถาบันการศึกษา โรงเรียนสอนภาษา หรือหลักสูตรฝึกอบรมในประเทศไทย',
      requirements: [
        'หนังสือเดินทางที่มีอายุเหลือ 6 เดือนขึ้นไป',
        'หนังสือตอบรับจากสถานศึกษา',
        'แบบฟอร์มขอวีซ่า ED ที่กรอกครบถ้วน',
        'หลักฐานทางการเงิน',
        'รูปถ่ายขนาดติดหนังสือเดินทาง',
        'ใบแสดงผลการเรียน'
      ],
      bestFor: ['ผู้เรียนภาษา', 'นักศึกษามหาวิทยาลัย', 'ฝึกศิลปะการต่อสู้']
    },
    {
      id: 'business',
      name: 'วีซ่าธุรกิจ (Non-B)',
      icon: Briefcase,
      color: 'bg-accent',
      duration: '90 วัน - 1 ปี',
      extendable: 'ได้ พร้อมใบอนุญาตทำงาน',
      cost: '฿2,000',
      description: 'สำหรับการทำธุรกิจ การจ้างงาน หรือการจัดตั้งบริษัทในประเทศไทย',
      requirements: [
        'หนังสือเดินทางที่มีอายุเหลือ 6 เดือนขึ้นไป',
        'หนังสือรับรองจากบริษัทไทย',
        'เอกสารจดทะเบียนบริษัท',
        'สัญญาจ้างงาน',
        'หลักฐานคุณวุฒิ',
        'งบการเงิน'
      ],
      bestFor: ['พนักงาน', 'เจ้าของธุรกิจ', 'นักลงทุน']
    },
    {
      id: 'marriage',
      name: 'วีซ่าสมรส (Non-O)',
      icon: Heart,
      color: 'bg-accent',
      duration: '90 วัน - 1 ปี',
      extendable: 'ได้ รายปี',
      cost: '฿2,000',
      description: 'สำหรับผู้ที่สมรสกับคนไทยหรือผู้ที่อุปการะสมาชิกครอบครัวในประเทศไทย',
      requirements: [
        'หนังสือเดินทางที่มีอายุเหลือ 6 เดือนขึ้นไป',
        'ทะเบียนสมรส',
        'บัตรประชาชนและทะเบียนบ้านของคู่สมรส',
        'หลักฐานรายได้ (40,000 บาท/เดือน) หรือ 400,000 บาทในบัญชี',
        'รูปถ่าย',
        'แบบฟอร์มที่กรอกครบถ้วน'
      ],
      bestFor: ['สมรสกับคนไทย', 'ครอบครัวคนไทย']
    },
    {
      id: 'retirement',
      name: 'วีซ่าเกษียณอายุ (O-A/O-X)',
      icon: Users,
      color: 'bg-success',
      duration: '1 ปี (O-A) / 5 ปี (O-X)',
      extendable: 'ได้ รายปี',
      cost: '฿2,000 / ฿10,000',
      description: 'สำหรับผู้เกษียณอายุ 50 ปีขึ้นไปที่ต้องการพำนักในประเทศไทยระยะยาว',
      requirements: [
        'อายุ 50 ปีขึ้นไป',
        'หนังสือเดินทางที่มีอายุเหลือ 6 เดือนขึ้นไป',
        '800,000 บาทในธนาคารไทย (O-A) หรือ 3,000,000 บาท (O-X)',
        'ประกันสุขภาพ (ผู้ป่วยนอก 40,000 บาท ผู้ป่วยใน 400,000 บาท)',
        'ใบรับรองแพทย์',
        'หนังสือรับรองความประพฤติ'
      ],
      bestFor: ['ผู้เกษียณอายุ', 'ผู้พำนักระยะยาว', 'ชาวต่างชาติวัย 50+']
    },
    {
      id: 'elite',
      name: 'Thailand Elite Visa',
      icon: Crown,
      color: 'bg-accent',
      duration: '5-20 ปี',
      extendable: 'ผ่านการสมัครสมาชิกใหม่',
      cost: '฿600,000 - ฿2,140,000',
      description: 'โปรแกรมวีซ่าระยะยาวระดับพรีเมียมพร้อมสิทธิประโยชน์และบริการ VIP',
      requirements: [
        'หนังสือเดินทางที่ยังมีอายุ',
        'ประวัติอาชญากรรมสะอาด',
        'ชำระค่าสมาชิก',
        'ไม่มีโรคร้ายแรง',
        'ใบสมัครที่กรอกครบถ้วน'
      ],
      bestFor: ['ดิจิทัลโนแมด', 'นักลงทุน', 'ผู้พำนักระยะยาว', 'นักเดินทาง VIP']
    }
  ]
};

// Extension info
const EXTENSION_INFO = {
  en: {
    title: 'Visa Extension',
    description: 'Most visas can be extended at Thai Immigration offices. Here\'s what you need to know:',
    steps: [
      'Visit Immigration office before visa expires',
      'Fill out TM.7 application form',
      'Provide passport-sized photos (4x6 cm)',
      'Pay extension fee (฿1,900 for most types)',
      'Wait for processing (same day or 1-3 days)'
    ],
    documents: [
      'Passport with current visa',
      'TM.6 departure card',
      'Completed TM.7 form',
      'One 4x6 cm photo',
      'Extension fee',
      'Copy of passport pages'
    ],
    tips: [
      'Apply 7-14 days before expiry',
      'Arrive early (8 AM recommended)',
      'Dress appropriately (no shorts/sandals)',
      'Bring cash in Thai Baht'
    ]
  },
  ru: {
    title: 'Продление визы',
    description: 'Большинство виз можно продлить в иммиграционных офисах Таиланда. Вот что нужно знать:',
    steps: [
      'Посетите иммиграционный офис до истечения визы',
      'Заполните форму TM.7',
      'Предоставьте фото (4x6 см)',
      'Оплатите сбор за продление (฿1,900 для большинства типов)',
      'Дождитесь обработки (в тот же день или 1-3 дня)'
    ],
    documents: [
      'Паспорт с текущей визой',
      'Карточка выезда TM.6',
      'Заполненная форма TM.7',
      'Одно фото 4x6 см',
      'Сбор за продление',
      'Копии страниц паспорта'
    ],
    tips: [
      'Подавайте за 7-14 дней до истечения',
      'Приходите рано (рекомендуется 8:00)',
      'Одевайтесь уместно (без шорт/сандалий)',
      'Берите наличные в тайских батах'
    ]
  },
  th: {
    title: 'การต่ออายุวีซ่า',
    description: 'วีซ่าส่วนใหญ่สามารถต่ออายุได้ที่สำนักงานตรวจคนเข้าเมือง นี่คือสิ่งที่คุณควรทราบ:',
    steps: [
      'ไปที่สำนักงานตรวจคนเข้าเมืองก่อนวีซ่าหมดอายุ',
      'กรอกแบบฟอร์ม TM.7',
      'เตรียมรูปถ่ายขนาด 4x6 ซม.',
      'ชำระค่าธรรมเนียมการต่ออายุ (฿1,900 สำหรับวีซ่าส่วนใหญ่)',
      'รอดำเนินการ (ภายในวันเดียวหรือ 1-3 วัน)'
    ],
    documents: [
      'หนังสือเดินทางพร้อมวีซ่าปัจจุบัน',
      'บัตรขาออก TM.6',
      'แบบฟอร์ม TM.7 ที่กรอกครบถ้วน',
      'รูปถ่ายขนาด 4x6 ซม. หนึ่งใบ',
      'ค่าธรรมเนียมการต่ออายุ',
      'สำเนาหน้าหนังสือเดินทาง'
    ],
    tips: [
      'ยื่นล่วงหน้า 7-14 วันก่อนหมดอายุ',
      'มาแต่เช้า (แนะนำ 8 โมงเช้า)',
      'แต่งกายให้เหมาะสม (ห้ามกางเกงขาสั้น/รองเท้าแตะ)',
      'นำเงินสดสกุลบาทมาด้วย'
    ]
  }
};

// Immigration offices
const IMMIGRATION_OFFICES = [
  {
    name: { en: 'Chaeng Wattana Immigration Center', ru: 'Иммиграционный центр Чаенг Ваттана', th: 'ศูนย์ตรวจคนเข้าเมืองแจ้งวัฒนะ' },
    location: 'Bangkok',
    address: 'Immigration Bureau Building B, Chaeng Wattana Soi 7',
    phone: '+66 2 141 9889',
    hours: '08:30 - 16:30',
    services: ['All visa types', 'Work Permits', '90-day reporting']
  },
  {
    name: { en: 'Phuket Immigration', ru: 'Иммиграция Пхукета', th: 'ตรวจคนเข้าเมืองภูเก็ต' },
    location: 'Phuket',
    address: '482 Phuket Road, Taladyai, Muang',
    phone: '+66 76 221 905',
    hours: '08:30 - 16:30',
    services: ['Tourist extensions', '90-day reporting', 'Re-entry permits']
  },
  {
    name: { en: 'Chiang Mai Immigration', ru: 'Иммиграция Чиангмая', th: 'ตรวจคนเข้าเมืองเชียงใหม่' },
    location: 'Chiang Mai',
    address: 'Promenada Mall, 192/1-4 Moo 2',
    phone: '+66 53 101 755',
    hours: '08:30 - 16:30',
    services: ['Tourist extensions', '90-day reporting', 'Non-Immigrant visas']
  },
  {
    name: { en: 'Koh Samui Immigration', ru: 'Иммиграция Ко Самуи', th: 'ตรวจคนเข้าเมืองเกาะสมุย' },
    location: 'Koh Samui',
    address: 'Na Thon, Moo 3',
    phone: '+66 77 421 069',
    hours: '08:30 - 12:00, 13:00 - 16:30',
    services: ['Tourist extensions', '90-day reporting']
  }
];

export default function VisaImmigrationPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { services: visaServices, isLoading } = useVisaServices();
  const [selectedVisaType, setSelectedVisaType] = useState<string | null>(null);
  
  const visaTypes = language === 'ru' ? VISA_TYPES.ru : language === 'th' ? VISA_TYPES.th : VISA_TYPES.en;
  const extensionInfo = language === 'ru' ? EXTENSION_INFO.ru : language === 'th' ? EXTENSION_INFO.th : EXTENSION_INFO.en;

  const selectedVisa = selectedVisaType 
    ? visaTypes.find(v => v.id === selectedVisaType) 
    : null;

  return (
    <AppLayout>
      <div className="pb-24">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-primary via-primary to-primary p-6 pt-16 pb-8">
          <BackButton fallbackPath="/legal" variant="overlay" className="absolute top-4 left-4" />
          
          <div className="text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-none flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {language === 'ru' ? 'Визы и Иммиграция' : language === 'th' ? 'วีซ่าและตรวจคนเข้าเมือง' : 'Visa & Immigration'}
            </h1>
            <p className="text-white/80 text-sm max-w-md mx-auto">
              {language === 'ru'
                ? 'Полная информация о типах виз, требованиях и процедурах для пребывания в Таиланде'
                : language === 'th'
                ? 'คู่มือฉบับสมบูรณ์เกี่ยวกับประเภทวีซ่า ข้อกำหนด และขั้นตอนสำหรับการพำนักในประเทศไทย'
                : 'Complete guide to visa types, requirements and procedures for staying in Thailand'}
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="px-4 -mt-4">
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">
                  {language === 'ru' ? 'Важная информация' : language === 'th' ? 'ข้อควรทราบ' : 'Important Notice'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'ru'
                    ? 'Визовые правила могут меняться. Всегда проверяйте актуальную информацию в Иммиграционном бюро Таиланда или посольстве.'
                    : language === 'th'
                    ? 'กฎระเบียบเกี่ยวกับวีซ่าอาจมีการเปลี่ยนแปลง โปรดตรวจสอบข้อมูลล่าสุดกับสำนักงานตรวจคนเข้าเมืองหรือสถานทูตเสมอ'
                    : 'Visa rules may change. Always verify current information with Thai Immigration Bureau or embassy.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="types" className="px-4 pt-6">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="tracker" className="text-xs sm:text-sm">
              {language === 'ru' ? 'Трекер' : language === 'th' ? 'ติดตามสถานะ' : 'Tracker'}
            </TabsTrigger>
            <TabsTrigger value="types" className="text-xs sm:text-sm">
              {language === 'ru' ? 'Типы виз' : language === 'th' ? 'ประเภทวีซ่า' : 'Visa Types'}
            </TabsTrigger>
            <TabsTrigger value="extension" className="text-xs sm:text-sm">
              {language === 'ru' ? 'Продление' : language === 'th' ? 'ต่ออายุ' : 'Extension'}
            </TabsTrigger>
            <TabsTrigger value="services" className="text-xs sm:text-sm">
              {language === 'ru' ? 'Услуги' : language === 'th' ? 'บริการ' : 'Services'}
            </TabsTrigger>
          </TabsList>

          {/* Visa Tracker Tab */}
          <TabsContent value="tracker" className="space-y-4 mt-4">
            <VisaTracker />
          </TabsContent>

          {/* Visa Types Tab */}
          <TabsContent value="types" className="space-y-4 mt-4">
            {selectedVisa ? (
              // Detail view
              <div className="space-y-4 animate-in fade-in">
                <Button 
                  variant="ghost" 
                  className="mb-2 -ml-2"
                  onClick={() => setSelectedVisaType(null)}
                >
                  ← {language === 'ru' ? 'Назад к списку' : language === 'th' ? 'กลับไปที่รายการ' : 'Back to list'}
                </Button>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-none ${selectedVisa.color} flex items-center justify-center`}>
                    <selectedVisa.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedVisa.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedVisa.description}</p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">
                        {language === 'ru' ? 'Срок' : language === 'th' ? 'ระยะเวลา' : 'Duration'}
                      </p>
                      <p className="text-sm font-semibold">{selectedVisa.duration}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <RefreshCw className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">
                        {language === 'ru' ? 'Продление' : language === 'th' ? 'ต่ออายุ' : 'Extend'}
                      </p>
                      <p className="text-sm font-semibold">{selectedVisa.extendable}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <FileCheck className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">
                        {language === 'ru' ? 'Стоимость' : 'Cost'}
                      </p>
                      <p className="text-sm font-semibold">{selectedVisa.cost}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Requirements */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-primary" />
                      {language === 'ru' ? 'Требования' : 'Requirements'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {selectedVisa.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Best for */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      {language === 'ru' ? 'Подходит для' : 'Best For'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {selectedVisa.bestFor.map((item, idx) => (
                        <Badge key={idx} variant="secondary">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CTA */}
                <Button 
                  className="w-full"
                  onClick={() => navigate('/legal?category=visa')}
                >
                  {language === 'ru' ? 'Получить помощь с визой' : 'Get Visa Assistance'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              // List view
              <div className="grid grid-cols-1 gap-3">
                {visaTypes.map((visa) => (
                  <Card 
                    key={visa.id}
                    className="cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => setSelectedVisaType(visa.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-none ${visa.color} flex items-center justify-center flex-shrink-0`}>
                          <visa.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{visa.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {visa.duration}
                            </span>
                            <span className="font-medium text-primary">{visa.cost}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Extension Tab */}
          <TabsContent value="extension" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  {extensionInfo.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {extensionInfo.description}
                </p>

                {/* Steps */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {language === 'ru' ? 'Шаги' : 'Steps'}
                  </h4>
                  <ol className="space-y-2">
                    {extensionInfo.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-primary" />
                    {language === 'ru' ? 'Документы' : 'Documents'}
                  </h4>
                  <ul className="grid grid-cols-2 gap-2">
                    {extensionInfo.documents.map((doc, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tips */}
                <div className="bg-muted/50 rounded-none p-3">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    {language === 'ru' ? 'Советы' : 'Tips'}
                  </h4>
                  <ul className="space-y-1">
                    {extensionInfo.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Immigration Offices */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {language === 'ru' ? 'Иммиграционные офисы' : 'Immigration Offices'}
              </h3>
              <div className="space-y-3">
                {IMMIGRATION_OFFICES.map((office, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-sm">
                            {language === 'ru' ? office.name.ru : office.name.en}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">{office.address}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {office.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {office.hours}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {office.location}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                {language === 'ru' ? 'Визовые услуги' : 'Visa Services'}
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/legal?category=visa')}
              >
                {language === 'ru' ? 'Все услуги' : 'All Services'}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-none" />
                ))}
              </div>
            ) : visaServices.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {language === 'ru' ? 'Услуги скоро появятся' : 'Services coming soon'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {visaServices.slice(0, 10).map((visa) => (
                  <Card
                    key={visa.id}
                    className="cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => navigate(`/legal/visa/${visa.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                visa.visa_type === 'elite' 
                                  ? 'border-warning text-warning bg-warning/10' 
                                  : visa.visa_type === 'retirement'
                                  ? 'border-success text-success bg-success/10'
                                  : ''
                              }`}
                            >
                              {visa.visa_type?.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {visa.is_popular && (
                              <Badge variant="secondary" className="text-xs">
                                ⭐ {language === 'ru' ? 'Популярно' : 'Popular'}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold">
                            {language === 'ru' ? visa.name_ru : visa.name_en}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                            {language === 'ru' ? visa.description_ru : visa.description_en}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-2">
                            {visa.processing_time && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {visa.processing_time}
                              </div>
                            )}
                            {visa.validity_period && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <FileCheck className="w-3 h-3" />
                                {visa.validity_period}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <p className="font-bold text-primary">
                            ฿{(visa.price || 0).toLocaleString()}
                          </p>
                          {visa.government_fee && (
                            <p className="text-xs text-muted-foreground">
                              +฿{visa.government_fee.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* CTA */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold mb-1">
                  {language === 'ru' ? 'Нужна помощь с визой?' : 'Need Visa Help?'}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {language === 'ru' 
                    ? 'Наши партнёры помогут с оформлением любого типа визы'
                    : 'Our partners can help you with any visa type'}
                </p>
                <Button onClick={() => navigate('/legal?category=visa')}>
                  {language === 'ru' ? 'Найти специалиста' : 'Find a Specialist'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
