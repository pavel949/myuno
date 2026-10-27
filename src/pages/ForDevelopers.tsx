import { AudienceLanding } from '@/components/landings/AudienceLanding';
import { APP_ROUTES } from '@/lib/config/routes';
const c = (ru: string, en: string, th: string) => ({ ru, en, th });
export default function ForDevelopers() {
  return <AudienceLanding path={APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS}
    eyebrow={c('Для застройщиков', 'For developers', 'สำหรับผู้พัฒนาโครงการ')}
    title={c('Представьте проект ясно и уверенно.', 'Give your project a clear introduction.', 'นำเสนอโครงการอย่างชัดเจน')}
    intro={c('Расскажите о компании и подготовьте материалы проекта. Кабинет объединяет проекты, материалы и обращения.', 'Introduce your company and prepare your project materials. The portal brings projects, information and enquiries together.', 'แนะนำบริษัทและเตรียมข้อมูลโครงการ พอร์ทัลรวบรวมโครงการ ข้อมูล และคำสอบถามไว้ด้วยกัน')}
    primary={{ title: c('Представить компанию', 'Introduce your company', 'แนะนำบริษัทของคุณ'), href: APP_ROUTES.DEVELOPER_PORTAL_APPLY }}
    secondary={{ title: c('Войти в кабинет', 'Open developer portal', 'เข้าสู่พอร์ทัลผู้พัฒนา'), href: APP_ROUTES.DEVELOPER_PORTAL }}
    choicesTitle={c('Начните с текущей задачи', 'Start with your current task', 'เริ่มจากงานที่ต้องการทำ')}
    choices={[
      { title: c('Подключить компанию', 'Apply as a company', 'สมัครในนามบริษัท'), description: c('Передайте сведения через заявку. Публикация и доступ зависят от проверки и согласованных условий.', 'Use the application to provide company details. Publication and access depend on review and agreed terms.', 'ส่งข้อมูลบริษัทผ่านแบบฟอร์ม การเผยแพร่และสิทธิ์เข้าถึงขึ้นอยู่กับการตรวจสอบและเงื่อนไขที่ตกลง'), href: APP_ROUTES.DEVELOPER_PORTAL_APPLY },
      { title: c('Продолжить работу с проектами', 'Continue your projects', 'ทำงานโครงการต่อ'), description: c('Откройте кабинет и доступные вам проекты. Для входа нужна авторизация.', 'Open the portal and the projects you can access. Sign-in is required.', 'เปิดพอร์ทัลและโครงการที่คุณมีสิทธิ์เข้าถึง โดยต้องเข้าสู่ระบบ'), href: APP_ROUTES.DEVELOPER_PORTAL_PROJECTS },
    ]}
    nextTitle={c('Подготовка к публикации', 'Prepare for publication', 'เตรียมข้อมูลสำหรับเผยแพร่')}
    next={[
      { title: c('Профиль компании', 'Company profile', 'ข้อมูลบริษัท'), href: APP_ROUTES.DEVELOPER_PORTAL_COMPANY },
      { title: c('Материалы проекта', 'Project materials', 'ข้อมูลโครงการ'), description: c('Используйте точные названия, разрешённые медиа и проверяемые условия.', 'Use precise names, permitted media and supportable terms.', 'ใช้ชื่อที่ถูกต้อง สื่อที่ได้รับอนุญาต และเงื่อนไขที่ตรวจสอบได้'), href: APP_ROUTES.DEVELOPER_PORTAL_PROJECTS },
      { title: c('Публичный каталог', 'Public project catalogue', 'รายการโครงการสาธารณะ'), href: APP_ROUTES.OFFPLAN },
    ]}
    note={c('Отправка заявки не означает автоматической публикации или гарантированных обращений. Не указывайте неподтверждённые цены, наличие и сроки.', 'An application does not guarantee publication or enquiries. Avoid unconfirmed prices, availability and timelines.', 'การส่งใบสมัครไม่ได้รับประกันการเผยแพร่หรือคำสอบถาม โปรดหลีกเลี่ยงราคา สถานะว่าง และกำหนดเวลาที่ยังไม่ยืนยัน')}
  />;
}
