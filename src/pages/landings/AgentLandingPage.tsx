import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Handshake, Users, Percent, FileSignature, LayoutDashboard, MessageSquare, ArrowRight, Award } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { SEOHead } from '@/components/seo';
import { LandingLeadForm } from '@/components/landings/LandingLeadForm';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const STEPS = [
  { icon: Users, labelEn: 'Bring your buyers', labelRu: 'Приводите своих клиентов', descEn: 'Investors, second-home, relocators', descRu: 'Инвесторы, вторые дома, релоканты', path: '?agentIntent=cooperation#agent-contact', color: 'primary' },
  { icon: Percent, labelEn: 'Discuss cooperation terms', labelRu: 'Обсудить условия сотрудничества', descEn: 'Commission and payment terms agreed individually', descRu: 'Комиссия и сроки согласуются индивидуально', path: '#commission', color: 'cluster-invest' },
  { icon: FileSignature, labelEn: 'Legal enquiries', labelRu: 'Юридические вопросы', descEn: 'Discuss the support your transaction needs', descRu: 'Обсудить необходимое сопровождение сделки', path: '/for/legal', color: 'accent-purple' },
  { icon: LayoutDashboard, labelEn: 'Ask about workspace access', labelRu: 'Уточнить доступ к рабочему пространству', descEn: 'Access requires separate confirmation', descRu: 'Доступ требует отдельного подтверждения', path: '?agentIntent=workspace#agent-contact', color: 'cluster-manage' },
  { icon: MessageSquare, labelEn: 'Public property catalogue', labelRu: 'Открытый каталог недвижимости', descEn: 'Browse published property listings', descRu: 'Посмотреть опубликованные объекты', path: '/property/browse', color: 'accent-amber' },
  { icon: Award, labelEn: 'About verification', labelRu: 'О проверке', descEn: 'Learn about verification; no status is granted here', descRu: 'Информация о проверке; статус здесь не присваивается', path: '/g-trust', color: 'cluster-arrive' },
];

export default function AgentLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const location = useLocation();
  const intent = new URLSearchParams(location.search).get('agentIntent') === 'workspace' ? 'workspace' : 'cooperation';
  useEffect(() => {
    if (location.hash === '#agent-contact' || location.hash === '#commission') {
      document.getElementById(location.hash.slice(1))?.scrollIntoView?.({ block: 'start' });
    }
  }, [location.hash, location.key]);
  const enquiryTo = (path: string) => {
    if (path.startsWith('#')) return { pathname: location.pathname, search: location.search, hash: path };
    if (!path.startsWith('?')) return path;
    const [search, hash] = path.split('#');
    const params = new URLSearchParams(location.search);
    new URLSearchParams(search).forEach((value, key) => params.set(key, value));
    return { pathname: location.pathname, search: params.toString(), hash: '#' + hash };
  };
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Я агент и хочу сотрудничать с myUNO' : 'Hello! I am an agent and I want to partner with myUNO');

  return (
    <>
      <SEOHead
        title={t ? 'Для агентов недвижимости — myUNO Partners' : 'For property agents, myUNO Partners'}
        description={t ? 'Обсудите сотрудничество с недвижимостью на Пхукете. Условия и доступ согласуются отдельно.' : 'Discuss property cooperation in Phuket. Terms and workspace access require separate agreement.'}
        url="https://www.myuno.app/for/agent"
      />
      <LandingLayout
        icon={Handshake}
        title={t ? 'Для агентов недвижимости' : 'For property agents'}
        subtitle={t ? 'Обсудите сотрудничество, условия и доступ с командой' : 'Discuss cooperation, terms and access with the team'}
        gradient="from-primary via-accent to-cluster-invest"
        heroCta={{ label: t ? 'Обсудить сотрудничество' : 'Discuss cooperation', onClick: () => navigate(enquiryTo('?agentIntent=cooperation#agent-contact'), { state: location.state }) }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={t ? 'Обсудить условия' : 'Discuss terms'}
      >
        <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
          <h2 className="text-xl font-bold font-display text-foreground mb-4 text-center">
            {t ? 'Как мы работаем с агентами' : 'How we work with agents'}
          </h2>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Link key={i} to={enquiryTo(s.path)} state={location.state} className="w-full flex items-center gap-4 p-4 rounded-none border border-border bg-card text-left transition-all hover:[box-shadow:var(--shadow-elevation-2)]">
                <div className="w-11 h-11 rounded-none flex items-center justify-center shrink-0" style={{ background: tokenColor(s.color, 0.15) }}>
                  <Icon className="w-5 h-5" style={{ color: tokenColor(s.color) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{t ? s.labelRu : s.labelEn}</h3>
                  <p className="text-xs text-muted-foreground">{t ? s.descRu : s.descEn}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
            );
          })}

        <section id="commission" className="py-6">
          <h2 className="text-xl font-semibold">{t ? 'Условия сотрудничества' : 'Cooperation terms'}</h2>
          <p className="text-sm text-muted-foreground">{t ? 'Комиссия, сроки и обязанности обсуждаются отдельно. Эта страница не подтверждает договор или статус партнёра.' : 'Commission, timing and responsibilities are discussed individually. This page does not confirm an agreement or partner status.'}</p>
        </section>
        <section id="agent-contact" className="py-6">
          <h2 className="text-xl font-semibold">{t ? 'Запрос команде' : 'Enquire with the team'}</h2>
          <p className="text-sm text-muted-foreground">{t ? 'Это запрос на обсуждение, а не регистрация агента или предоставление доступа. Сохранение заявки не подтверждает доставку уведомления или ответ команды.' : 'This is an enquiry, not agent enrolment or workspace access. Saving a request does not confirm notification delivery or a team reply.'}</p>
          <LandingLeadForm variant="universal" verticalId="properties" universalRequestType="property_consultation"
            entryPoint={`/for/agent?agentIntent=${intent}`}
            messagePlaceholder={{ en: 'Tell us about your agent cooperation or workspace question', ru: 'Расскажите о сотрудничестве или вопросе доступа', th: 'แจ้งเรื่องความร่วมมือหรือการเข้าถึงพื้นที่ทำงาน' }}
            submitLabel={{ en: 'Save enquiry', ru: 'Сохранить запрос', th: 'บันทึกคำขอ' }}
            successText={{ en: 'Enquiry saved. Agent approval, access and a team reply are not confirmed.', ru: 'Запрос сохранён. Одобрение агента, доступ и ответ команды не подтверждены.', th: 'บันทึกคำขอแล้ว ยังไม่ยืนยันการอนุมัติตัวแทน สิทธิ์เข้าถึง หรือคำตอบจากทีม' }} />
        </section>
        </div>
      </LandingLayout>
    </>
  );
}
