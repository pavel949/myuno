import { AudienceLanding } from '@/components/landings/AudienceLanding';
import { APP_ROUTES } from '@/lib/config/routes';
const c = (ru: string, en: string, th: string) => ({ ru, en, th });
export default function AgentLandingPage() {
  return <AudienceLanding path="/for/agent"
    eyebrow={c('Для агентов недвижимости', 'For property agents', 'สำหรับตัวแทนอสังหาริมทรัพย์')}
    title={c('Начните партнёрство с понятного разговора.', 'Start a partnership with a clear conversation.', 'เริ่มความร่วมมือด้วยการพูดคุยที่ชัดเจน')}
    intro={c('Расскажите о своей работе и клиентах. Для заявки используется путь подключения партнёра.', 'Tell us about your work and clients through the partner application.', 'แจ้งข้อมูลการทำงานและลูกค้าของคุณผ่านขั้นตอนสมัครพันธมิตร')}
    primary={{ title: c('Подать заявку партнёра', 'Apply as a partner', 'สมัครเป็นพันธมิตร'), href: APP_ROUTES.BECOME_PARTNER }}
    secondary={{ title: c('Проверить статус заявки', 'Check application status', 'ตรวจสอบสถานะใบสมัคร'), href: APP_ROUTES.PARTNER_STATUS }}
    choicesTitle={c('Выберите следующий шаг', 'Choose your next step', 'เลือกขั้นตอนถัดไป')}
    choices={[
      { title: c('Обсудить сотрудничество', 'Discuss working together', 'ปรึกษาความร่วมมือ'), description: c('Укажите специализацию и формат сотрудничества в заявке. Условия согласуются отдельно.', 'Describe your specialism and proposed collaboration in the application. Terms are agreed separately.', 'ระบุความเชี่ยวชาญและรูปแบบความร่วมมือในใบสมัคร โดยตกลงเงื่อนไขแยกต่างหาก'), href: APP_ROUTES.BECOME_PARTNER },
      { title: c('Посмотреть недвижимость', 'Explore property listings', 'ดูรายการอสังหาริมทรัพย์'), description: c('Изучите опубликованные предложения в каталоге.', 'Explore published offers in the catalogue.', 'ดูข้อเสนอที่เผยแพร่ในรายการ'), href: APP_ROUTES.PROPERTY_SEARCH },
    ]}
    nextTitle={c('Перед началом работы', 'Before you get started', 'ก่อนเริ่มทำงาน')}
    next={[
      { title: c('Условия партнёрства', 'Partner terms', 'เงื่อนไขพันธมิตร'), href: '/partner-agreement' },
      { title: c('Статус заявки', 'Application status', 'สถานะใบสมัคร'), href: APP_ROUTES.PARTNER_STATUS },
      { title: c('Новостройки', 'New developments', 'โครงการใหม่'), href: APP_ROUTES.OFFPLAN },
    ]}
    note={c('Комиссия, распределение обязанностей и сроки выплат определяются согласованными условиями. Эта страница не устанавливает индивидуальную ставку или статус партнёра.', 'Commission, responsibilities and payout timing follow agreed terms. This page does not establish a personal rate or partner status.', 'ค่าคอมมิชชั่น หน้าที่ และกำหนดจ่ายเป็นไปตามเงื่อนไขที่ตกลง หน้านี้ไม่ได้กำหนดอัตราหรือสถานะพันธมิตรของคุณ')}
  />;
}
