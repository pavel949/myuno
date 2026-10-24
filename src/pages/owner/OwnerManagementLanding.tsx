/** Public management inquiry; saved in the existing consultation_requests pipeline. */
import { useNavigate } from 'react-router-dom';
import { Brush, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingShell } from '@/components/landings/LandingShell';
import { LandingLeadForm } from '@/components/landings/LandingLeadForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';

export default function OwnerManagementLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = (v: LangValues) => pickLang(language, v);
  return <LandingShell
    eyebrow={{ ru: 'Собственникам', en: 'For property owners', th: 'สำหรับเจ้าของอสังหาริมทรัพย์' }}
    title={{ ru: 'Обсудим управление вашей недвижимостью', en: 'Let’s discuss managing your property', th: 'ปรึกษาเรื่องการจัดการอสังหาริมทรัพย์ของคุณ' }}
    subtitle={{ ru: 'Расскажите об объекте и вашей задаче. Команда сможет уточнить детали и предложить условия. Заявка не заключает договор и ни к чему не обязывает.', en: 'Tell the team about your property and what you need. Details and terms can then be discussed. This inquiry is not a management agreement.', th: 'บอกข้อมูลทรัพย์สินและความต้องการของคุณ เพื่อให้ทีมงานสอบถามรายละเอียดและหารือเงื่อนไข คำขอนี้ไม่ใช่สัญญาจัดการ' }}
    benefits={[
      { icon: Brush, title: { ru: 'Что нужно объекту', en: 'What your property needs', th: 'ความต้องการของทรัพย์สิน' }, desc: { ru: 'Сдача, обслуживание или полное управление — опишите, с чем нужна помощь.', en: 'Letting, maintenance or full management — describe what you need help with.', th: 'ปล่อยเช่า ดูแล หรือจัดการทั้งหมด บอกสิ่งที่คุณต้องการความช่วยเหลือ' } },
      { icon: FileText, title: { ru: 'Условия до решения', en: 'Terms before a decision', th: 'หารือเงื่อนไขก่อนตัดสินใจ' }, desc: { ru: 'Состав работ, стоимость и отчётность согласуются отдельно. Доходность и загрузка не гарантируются.', en: 'Scope, fees and reporting are agreed separately. Income and occupancy are not guaranteed.', th: 'ขอบเขตงาน ค่าบริการ และการรายงานต้องตกลงแยกต่างหาก ไม่มีการรับประกันรายได้หรืออัตราเข้าพัก' } },
    ]}
    formSlot={<div id="owner-request"><LandingLeadForm variant="universal" verticalId="properties" universalRequestType="full_management" entryPoint="/owner/management-landing" leadSource="cta"
      messagePlaceholder={{ ru: 'Район или комплекс, описание объекта и какая помощь нужна', en: 'Area or community, property details and the help you need', th: 'ย่านหรือโครงการ รายละเอียดทรัพย์สิน และความช่วยเหลือที่ต้องการ' }}
      successText={{ ru: 'Заявка сохранена. Ответ команды ожидается; условия управления ещё не согласованы.', en: 'Your inquiry is saved. A team reply is pending; management terms have not been agreed.', th: 'บันทึกคำขอแล้ว ยังรอการตอบกลับจากทีม และยังไม่ได้ตกลงเงื่อนไขการจัดการ' }}
      submitLabel={{ ru: 'Обсудить управление', en: 'Ask about management', th: 'สอบถามการจัดการ' }}
    /></div>}
    seoTitle={{ ru: 'Управление недвижимостью на Пхукете — myUNO', en: 'Property management in Phuket — myUNO', th: 'การจัดการอสังหาริมทรัพย์ในภูเก็ต — myUNO' }}
    seoDescription={{ ru: 'Отправьте запрос на обсуждение сдачи, обслуживания или управления вашей недвижимостью на Пхукете.', en: 'Send an inquiry about letting, maintaining or managing your property in Phuket.', th: 'ส่งคำขอปรึกษาเรื่องปล่อยเช่า ดูแล หรือจัดการอสังหาริมทรัพย์ของคุณในภูเก็ต' }}
  >
    <section className="border-t border-border pt-6"><h2 className="font-display text-2xl mb-3">{t({ ru: 'Уже есть кабинет собственника?', en: 'Already have an owner account?', th: 'มีบัญชีเจ้าของอยู่แล้วหรือไม่' })}</h2><p className="text-muted-foreground mb-4">{t({ ru: 'Для работы в кабинете потребуется вход и подтверждённый доступ к объектам.', en: 'The workspace requires sign-in and confirmed access to your properties.', th: 'การใช้พื้นที่ทำงานต้องเข้าสู่ระบบและมีสิทธิ์เข้าถึงทรัพย์สินที่ยืนยันแล้ว' })}</p><Button onClick={() => {
      const target = APP_ROUTES.OWNER_PORTAL;
      navigate(user ? target : `/auth?redirect=${encodeURIComponent(target)}`);
    }}>{t({ ru: 'Открыть кабинет собственника', en: 'Open owner workspace', th: 'เปิดพื้นที่ทำงานเจ้าของ' })}<ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" /></Button></section>
  </LandingShell>;
}
