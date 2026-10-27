import { AudienceLanding } from '@/components/landings/AudienceLanding';
import { APP_ROUTES } from '@/lib/config/routes';
const c = (ru: string, en: string, th: string) => ({ ru, en, th });
export default function ForOwnersPage() {
  return <AudienceLanding path={APP_ROUTES.FOR_OWNERS}
    eyebrow={c('Для собственников', 'For property owners', 'สำหรับเจ้าของที่พัก')}
    title={c('Ваш дом. Понятный следующий шаг.', 'Your home. A clear next step.', 'บ้านของคุณ พร้อมก้าวต่อไปที่ชัดเจน')}
    intro={c('Выберите самостоятельное управление или обсудите помощь с объектом. Начните с того, что нужно вашему дому сейчас.', 'Manage your property yourself or discuss support for your home. Start with what you need today.', 'เลือกจัดการที่พักด้วยตนเองหรือปรึกษาความช่วยเหลือ เริ่มจากสิ่งที่บ้านของคุณต้องการในวันนี้')}
    primary={{ title: c('Выбрать подходящий путь', 'Explore your options', 'ดูทางเลือกของคุณ'), href: '#paths' }}
    secondary={{ title: c('Войти в кабинет собственника', 'Open owner space', 'เข้าสู่พื้นที่เจ้าของ'), href: APP_ROUTES.OWNER_PORTAL }}
    choicesTitle={c('Как вы хотите управлять домом?', 'How would you like to manage your home?', 'คุณต้องการดูแลบ้านอย่างไร?')}
    choices={[
      { title: c('Обсудить управление', 'Discuss property management', 'ปรึกษาการจัดการที่พัก'), description: c('Расскажите об объекте и задачах. Объём работы и условия нужно согласовать перед началом.', 'Tell us about your property and the support you need. Scope and terms are agreed before work begins.', 'แจ้งข้อมูลที่พักและความช่วยเหลือที่ต้องการ โดยตกลงขอบเขตงานและเงื่อนไขก่อนเริ่ม'), href: APP_ROUTES.OWNER_MANAGEMENT_LANDING },
      { title: c('Управлять самостоятельно', 'Manage it yourself', 'จัดการด้วยตนเอง'), description: c('Перейдите к настройке рабочего пространства. Доступные инструменты и условия зависят от выбранного подключения.', 'Continue to workspace setup. Available tools and terms depend on your setup.', 'เริ่มตั้งค่าพื้นที่ทำงาน เครื่องมือและเงื่อนไขขึ้นอยู่กับการตั้งค่าของคุณ'), href: '/mc/onboarding' },
    ]}
    nextTitle={c('Полезное для следующего шага', 'Useful next steps', 'สิ่งที่ช่วยให้เริ่มต้นได้')}
    next={[
      { title: c('Мои объекты', 'My properties', 'ที่พักของฉัน'), description: c('Откройте доступные вам объекты после входа.', 'Sign in to see properties you can access.', 'เข้าสู่ระบบเพื่อดูที่พักที่คุณมีสิทธิ์เข้าถึง'), href: APP_ROUTES.OWNER_PORTAL },
      { title: c('Для управляющих компаний', 'For management companies', 'สำหรับบริษัทจัดการที่พัก'), href: APP_ROUTES.FOR_MANAGEMENT_COMPANIES },
      { title: c('Программа приглашений', 'Referral programme', 'โปรแกรมแนะนำ'), description: c('Актуальные условия и личная ссылка находятся в профиле.', 'Find current terms and your personal link in your profile.', 'ดูเงื่อนไขและลิงก์ส่วนตัวในโปรไฟล์'), href: '/profile/referral' },
      { title: c('Контакты команды', 'Contact the team', 'ติดต่อทีมงาน'), href: APP_ROUTES.CONTACT },
    ]}
    note={c('Стоимость, состав услуг и сроки обсуждаются для конкретного объекта. Доступ к кабинету не заменяет согласование управления.', 'Pricing, scope and timing are agreed for the specific property. Workspace access does not establish a management agreement.', 'ราคา ขอบเขตบริการ และระยะเวลาต้องตกลงตามที่พักแต่ละแห่ง การเข้าถึงพื้นที่ทำงานไม่ได้หมายถึงมีข้อตกลงจัดการที่พักแล้ว')}
  />;
}
