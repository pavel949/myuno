import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Compass,
  Home,
  Building2,
  Briefcase,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COMPANY_CONTACTS, getTelLink } from '@/lib/config/contacts';

export default function AboutPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = (ru: string, en: string, th: string) => language === 'ru' ? ru : language === 'th' ? th : en;

  const audience = [
    {
      icon: Compass,
      title: t('Гости и туристы', 'Visitors & tourists', "ผู้มาเยือนและนักท่องเที่ยว"),
      body: t(
        'Жильё, трансфер, рестораны, активности — всё в одном аккаунте, оплата картой или переводом.',
        'Stays, transfers, restaurants, experiences — one account, card or bank payments.', "ที่พัก รถรับส่ง ร้านอาหาร และกิจกรรม ในบัญชีเดียว ชำระด้วยบัตรหรือโอนผ่านธนาคาร",
      ),
    },
    {
      icon: Home,
      title: t('Резиденты и релоканты', 'Residents & relocators', "ผู้อยู่อาศัยและผู้ย้ายถิ่นฐาน"),
      body: t(
        'Школы, клиники, визы, аренда, юристы — проверенные локальные сервисы на русском и английском.',
        'Schools, clinics, visas, rentals, lawyers — vetted local services in English and Russian.', "โรงเรียน คลินิก วีซ่า ที่พักให้เช่า และทนายความ พร้อมบริการท้องถิ่นที่ผ่านการตรวจสอบในภาษาอังกฤษและรัสเซีย",
      ),
    },
    {
      icon: Building2,
      title: t('Владельцы недвижимости', 'Property owners', "เจ้าของอสังหาริมทรัพย์"),
      body: t(
        'Управление арендой, отчётность, уборки, ремонты и выплаты собственнику в одном кабинете.',
        'Rental management, statements, cleaning, maintenance and owner payouts in one dashboard.', "จัดการการเช่า รายงาน การทำความสะอาด การบำรุงรักษา และการจ่ายเงินให้เจ้าของในแดชบอร์ดเดียว",
      ),
    },
    {
      icon: Briefcase,
      title: t('Инвесторы и предприниматели', 'Investors & operators', "นักลงทุนและผู้ประกอบการ"),
      body: t(
        'Каталог проектов off-plan, рейтинг ClearView™, юридическое сопровождение сделок.',
        'Off-plan catalogue, ClearView™ ratings, legal support for transactions.', "แคตตาล็อกโครงการก่อนก่อสร้าง การประเมิน ClearView™ และการสนับสนุนทางกฎหมายสำหรับธุรกรรม",
      ),
    },
  ];

  const principles = [
    {
      icon: ShieldCheck,
      title: t('Проверенные партнёры', 'Vetted partners', "พันธมิตรที่ผ่านการตรวจสอบ"),
      body: t(
        'Каждый сервис проходит верификацию: документы, лицензии, отзывы. Без анонимных контактов в чатах.',
        'Every service is verified: documents, licences, reviews. No anonymous chat contacts.', "ทุกบริการผ่านการตรวจสอบเอกสาร ใบอนุญาต และรีวิว ไม่มีผู้ติดต่อที่ไม่ระบุตัวตนในแชต",
      ),
    },
    {
      icon: CreditCard,
      title: t('Прозрачные платежи', 'Transparent payments', "การชำระเงินที่โปร่งใส"),
      body: t(
        'Цены в батах, комиссии видны заранее. Возврат при неоказании услуги — по правилам Stripe и нашей политики.',
        'Prices in THB, fees shown upfront. Refunds on failed services follow Stripe rules and our policy.', "ราคาเป็นเงินบาท แสดงค่าธรรมเนียมล่วงหน้า การคืนเงินเมื่อไม่ได้รับบริการเป็นไปตามกฎของ Stripe และนโยบายของเรา",
      ),
    },
    {
      icon: MessageCircle,
      title: t('Поддержка на вашем языке', 'Support in your language', "การช่วยเหลือในภาษาของคุณ"),
      body: t(
        'Чат, email и WhatsApp на русском и английском. Отвечаем по будням, срочные вопросы — круглосуточно.',
        'Chat, email and WhatsApp in English and Russian. Weekday hours, urgent issues 24/7.', "แชต อีเมล และ WhatsApp ในภาษาอังกฤษและรัสเซีย ให้บริการในวันทำการ และรับเรื่องเร่งด่วนตลอด 24 ชั่วโมงทุกวัน",
      ),
    },
  ];

  return (
    <AppLayout usePageContainer={false}>
      <PageContainer className="max-w-5xl">
        <PageHeader
          title={t('О myUNO', 'About myUNO', "เกี่ยวกับ myUNO")}
          subtitle={t(
            'Цифровая инфраструктура для жизни на Пхукете.',
            'Digital infrastructure for life in Phuket.', "โครงสร้างพื้นฐานดิจิทัลเพื่อการใช้ชีวิตในภูเก็ต",
          )}
        />

        <SectionCard className="mb-6">
          <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
            <p>
              {t(
                'myUNO — единый аккаунт для всего, что нужно иностранцу на Пхукете: жильё и бронирования, медицина и образование, юристы и визы, управление недвижимостью и инвестиции.',
                'myUNO is a single account for everything a foreigner needs in Phuket: stays and bookings, healthcare and education, lawyers and visas, property management and investments.', "myUNO คือบัญชีเดียวสำหรับทุกสิ่งที่ชาวต่างชาติต้องการในภูเก็ต ตั้งแต่ที่พักและการจอง การดูแลสุขภาพและการศึกษา ทนายความและวีซ่า ไปจนถึงการจัดการอสังหาริมทรัพย์และการลงทุน",
              )}
            </p>
            <p className="text-muted-foreground">
              {t(
                'Мы не оказываем услуги сами — мы соединяем вас с локальными командами и контролируем качество, оплаты и документы.',
                'We don\'t deliver the services ourselves — we connect you with local teams and oversee quality, payments and paperwork.', "เราไม่ได้ให้บริการเหล่านี้ด้วยตนเอง แต่เชื่อมต่อคุณกับทีมงานท้องถิ่น และดูแลคุณภาพ การชำระเงิน และเอกสาร",
              )}
            </p>
          </div>
        </SectionCard>

        <h2 className="mb-3 text-base font-semibold">
          {t('Для кого мы работаем', 'Who we serve', "เราให้บริการใคร")}
        </h2>
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {audience.map((item) => (
            <SectionCard key={item.title}>
              <div className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>

        <h2 className="mb-3 text-base font-semibold">
          {t('Как мы работаем', 'How we work', "เราทำงานอย่างไร")}
        </h2>
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {principles.map((item) => (
            <SectionCard key={item.title}>
              <item.icon className="mb-2 h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </SectionCard>
          ))}
        </div>

        <SectionCard className="mb-6">
          <h2 className="mb-2 text-base font-semibold">
            {t('Где мы', 'Where we operate', "พื้นที่ให้บริการ")}
          </h2>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              {t(
                'Главный офис и операционная команда — Пхукет, Таиланд. Постепенно расширяемся на соседние регионы Юго-Восточной Азии.',
                'HQ and operations team in Phuket, Thailand. Gradually expanding to neighbouring Southeast Asian regions.', "สำนักงานใหญ่และทีมปฏิบัติการอยู่ในภูเก็ต ประเทศไทย และกำลังทยอยขยายไปยังภูมิภาคใกล้เคียงในเอเชียตะวันออกเฉียงใต้",
              )}
            </p>
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="mb-2 text-base font-semibold">
            {t('Связаться с нами', 'Get in touch', "ติดต่อเรา")}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t(
              'Вопросы по сервису, партнёрству или сделке — пишите, мы ответим.',
              'Questions about the service, partnerships or a deal — drop us a line.', "หากมีคำถามเกี่ยวกับบริการ ความร่วมมือ หรือธุรกรรม ส่งข้อความหาเราได้",
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/info/contact')}>
              {t('Контакты', 'Contacts', "ข้อมูลติดต่อ")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {COMPANY_CONTACTS.email.support && (
              <Button variant="outline" asChild>
                <a href={`mailto:${COMPANY_CONTACTS.email.support}`}>
                  {COMPANY_CONTACTS.email.support}
                </a>
              </Button>
            )}
            {COMPANY_CONTACTS.phone.display && (
              <Button variant="outline" asChild>
                <a href={getTelLink()}>{COMPANY_CONTACTS.phone.display}</a>
              </Button>
            )}
          </div>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}
