import { AudienceLanding } from '@/components/landings/AudienceLanding';
import { APP_ROUTES } from '@/lib/config/routes';
const c = (ru: string, en: string, th: string) => ({ ru, en, th });
export default function PartnersPage() {
  return <AudienceLanding path={APP_ROUTES.PARTNERS}
    eyebrow={c('Партнёрам myUNO', 'Partner with myUNO', 'ร่วมเป็นพันธมิตรกับ myUNO')}
    title={c('Ваш опыт. Понятный путь к сотрудничеству.', 'Your expertise. A clear way to work together.', 'ความเชี่ยวชาญของคุณ พร้อมเส้นทางความร่วมมือที่ชัดเจน')}
    intro={c('Выберите направление и расскажите о своём бизнесе. Заявка помогает уточнить формат работы и дальнейшие шаги.', 'Choose a direction and introduce your business. An application helps clarify how we can work together and what comes next.', 'เลือกแนวทางและแนะนำธุรกิจของคุณ ใบสมัครช่วยให้ระบุรูปแบบความร่วมมือและขั้นตอนต่อไป')}
    primary={{ title: c('Настроить пространство бизнеса', 'Start business setup', 'เริ่มตั้งค่าธุรกิจ'), href: APP_ROUTES.VENDOR_ONBOARDING }}
    secondary={{ title: c('Статус моей заявки', 'My application status', 'สถานะใบสมัครของฉัน'), href: APP_ROUTES.PARTNER_STATUS }}
    choicesTitle={c('С чего вы хотите начать?', 'Where would you like to start?', 'คุณต้องการเริ่มจากส่วนไหน?')}
    choices={[
      { title: c('Услуги и местный бизнес', 'Services and local business', 'บริการและธุรกิจท้องถิ่น'), description: c('Расскажите о компании, услугах и работе с клиентами.', 'Tell us about your company, services and customer experience.', 'แจ้งข้อมูลบริษัท บริการ และการดูแลลูกค้า'), href: APP_ROUTES.BECOME_PARTNER },
      { title: c('Недвижимость', 'Property partnerships', 'ความร่วมมือด้านอสังหาริมทรัพย์'), description: c('Собственникам, застройщикам и агентам доступны отдельные публичные входы.', 'Owners, developers and agents have dedicated public introductions.', 'เจ้าของ ผู้พัฒนา และตัวแทนมีหน้าแนะนำเฉพาะด้าน'), href: APP_ROUTES.FOR_OWNERS },
    ]}
    nextTitle={c('Найдите своё направление', 'Find your direction', 'ค้นหาแนวทางที่เหมาะกับคุณ')}
    next={[
      { title: c('Для застройщиков', 'For developers', 'สำหรับผู้พัฒนา'), href: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS },
      { title: c('Для агентов', 'For agents', 'สำหรับตัวแทน'), href: '/for/agent' },
      { title: c('Для местного бизнеса', 'For local businesses', 'สำหรับธุรกิจท้องถิ่น'), href: APP_ROUTES.FOR_BUSINESS },
    ]}
    note={c('Заявка не означает одобрение или гарантированное количество заказов. Доступ, обязанности и коммерческие условия определяются процессом подключения.', 'An application does not imply approval or a guaranteed number of orders. Access, responsibilities and commercial terms follow the onboarding process.', 'การสมัครไม่ได้หมายถึงการอนุมัติหรือรับประกันจำนวนคำสั่งซื้อ สิทธิ์ หน้าที่ และเงื่อนไขเป็นไปตามขั้นตอนการสมัคร')}
  />;
}
