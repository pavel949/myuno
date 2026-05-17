import { InvestmentHubJtbd, InvestmentHubRole, InvestmentHubScenario } from '@/types/investmentHub';

export const INVESTMENT_HUB_ROLES: Array<{
  role: InvestmentHubRole;
  labelEn: string;
  labelRu: string;
  labelTh: string;
  primaryGoalEn: string;
  primaryGoalRu: string;
  primaryGoalTh: string;
}> = [
  {
    role: 'investor',
    labelEn: 'Investor',
    labelRu: 'Инвестор',
    labelTh: 'นักลงทุน',
    primaryGoalEn: 'Find vetted Thailand opportunities that match return and risk profile.',
    primaryGoalRu: 'Найти проверенные сделки в Таиланде с нужным риск-профилем и доходностью.',
    primaryGoalTh: 'ค้นหาโอกาสในประเทศไทยที่ผ่านการตรวจสอบและตรงกับเป้าหมายผลตอบแทนและความเสี่ยง',
  },
  {
    role: 'project_owner',
    labelEn: 'Project Owner',
    labelRu: 'Владелец проекта',
    labelTh: 'เจ้าของโครงการ',
    primaryGoalEn: 'List the project for buyers and strategic partners, with clear execution support.',
    primaryGoalRu: 'Разместить проект для покупателей и партнёров с прозрачной поддержкой сделки.',
    primaryGoalTh: 'ระดมทุนและหาพาร์ทเนอร์เชิงกลยุทธ์พร้อมการสนับสนุนการดำเนินงานที่ชัดเจน',
  },
  {
    role: 'advisor',
    labelEn: 'Advisor',
    labelRu: 'Адвайзер',
    labelTh: 'ที่ปรึกษา',
    primaryGoalEn: 'Qualify intros, structure syndicates, and earn advisory revenue.',
    primaryGoalRu: 'Квалифицировать интро, собирать синдикаты и зарабатывать на сопровождении.',
    primaryGoalTh: 'คัดกรองอินโทร จัดโครงสร้างซินดิเคต และสร้างรายได้จากบริการที่ปรึกษา',
  },
  {
    role: 'operator',
    labelEn: 'Operator',
    labelRu: 'Операционный менеджер',
    labelTh: 'ผู้ปฏิบัติการ',
    primaryGoalEn: 'Keep SLA on deal flow and maintain clean trusted data.',
    primaryGoalRu: 'Держать SLA по сделкам и качество проверенных данных.',
    primaryGoalTh: 'ควบคุม SLA ของดีลโฟลว์และรักษาคุณภาพข้อมูลที่เชื่อถือได้',
  },
  {
    role: 'admin',
    labelEn: 'Admin',
    labelRu: 'Администратор',
    labelTh: 'ผู้ดูแลระบบ',
    primaryGoalEn: 'Control policy, compliance, and monetization guardrails.',
    primaryGoalRu: 'Управлять policy, compliance и монетизационными правилами.',
    primaryGoalTh: 'ควบคุมนโยบาย compliance และกรอบการสร้างรายได้',
  },
];

export const INVESTMENT_HUB_JTBD: InvestmentHubJtbd[] = [
  {
    id: 'investor-fast-screening',
    role: 'investor',
    titleEn: 'Screen 10+ opportunities quickly and shortlist by fit score.',
    titleRu: 'Быстро отсмотреть 10+ возможностей и выбрать shortlist по fit score.',
    titleTh: 'คัดกรองโอกาส 10+ รายการอย่างรวดเร็วและทำ shortlist ตาม fit score',
    successSignalEn: 'Investor requests intro within one session.',
    successSignalRu: 'Инвестор отправляет запрос на интро в рамках одной сессии.',
    successSignalTh: 'นักลงทุนส่งคำขอ intro ภายในหนึ่งเซสชัน',
  },
  {
    id: 'owner-capital-access',
    role: 'project_owner',
    titleEn: 'Get qualified intros to capital sources without cold outreach.',
    titleRu: 'Получить квалифицированные интро к капиталу без холодного outreach.',
    titleTh: 'ได้รับอินโทรที่ผ่านการคัดกรองไปยังแหล่งทุนโดยไม่ต้องทำ cold outreach',
    successSignalEn: 'First intro call scheduled in less than 7 days.',
    successSignalRu: 'Первый интро-звонок назначен менее чем за 7 дней.',
    successSignalTh: 'มีการนัดหมาย intro call แรกภายใน 7 วัน',
  },
  {
    id: 'advisor-syndication',
    role: 'advisor',
    titleEn: 'Build co-investment syndicates for multi-asset Thailand deals.',
    titleRu: 'Собрать co-investment синдикат под multi-asset сделки в Таиланде.',
    titleTh: 'สร้างซินดิเคต co-investment สำหรับดีล multi-asset ในประเทศไทย',
    successSignalEn: 'Syndicate moves opportunity to due diligence.',
    successSignalRu: 'Синдикат переводит возможность в due diligence.',
    successSignalTh: 'ซินดิเคตผลักดีลเข้าสู่ขั้นตอน due diligence',
  },
  {
    id: 'operator-sla-control',
    role: 'operator',
    titleEn: 'Track time-to-intro and DD SLA across the pipeline.',
    titleRu: 'Контролировать time-to-intro и SLA DD по всей воронке.',
    titleTh: 'ติดตาม time-to-intro และ SLA ของ DD ตลอดทั้ง pipeline',
    successSignalEn: 'No critical deal exceeds SLA thresholds.',
    successSignalRu: 'Нет критичных сделок с превышением SLA.',
    successSignalTh: 'ไม่มีดีลสำคัญใดเกินเกณฑ์ SLA',
  },
];

export const INVESTMENT_HUB_SCENARIOS: InvestmentHubScenario[] = [
  {
    id: 'buy-side-discovery',
    zone: 'market',
    titleEn: 'Buy-side investor discovery',
    titleRu: 'Buy-side discovery инвестора',
    titleTh: 'การค้นหาดีลฝั่ง Buy-side',
    stepsEn: ['Open Market Intelligence', 'Filter by asset class and thesis tags', 'Move shortlisted deals to execution'],
    stepsRu: ['Открыть Market Intelligence', 'Отфильтровать по asset class и thesis tags', 'Передать shortlist в execution'],
    stepsTh: ['เปิด Market Intelligence', 'กรองตาม asset class และ thesis tags', 'ส่ง shortlist ไปยัง execution'],
  },
  {
    id: 'sell-side-raise',
    zone: 'deals',
    titleEn: 'Sell-side capital raise',
    titleRu: 'Sell-side привлечение капитала',
    titleTh: 'การระดมทุนฝั่ง Sell-side',
    stepsEn: ['Create opportunity profile', 'Pass verification and reliability checks', 'Receive qualified intro requests'],
    stepsRu: ['Создать профиль возможности', 'Пройти верификацию и reliability checks', 'Получить квалифицированные intro requests'],
    stepsTh: ['สร้างโปรไฟล์โอกาส', 'ผ่านการตรวจสอบและ reliability checks', 'รับ qualified intro requests'],
  },
  {
    id: 'advisor-network',
    zone: 'network',
    titleEn: 'Advisor partner matching',
    titleRu: 'Партнерский matching для адвайзера',
    titleTh: 'การจับคู่พาร์ทเนอร์สำหรับที่ปรึกษา',
    stepsEn: ['Build trusted partner graph', 'Form syndicate by deal thesis', 'Launch coordinated intro'],
    stepsRu: ['Собрать граф доверенных партнеров', 'Сформировать синдикат по thesis сделки', 'Запустить координированное интро'],
    stepsTh: ['สร้างกราฟพาร์ทเนอร์ที่เชื่อถือได้', 'จัดตั้งซินดิเคตตาม thesis ของดีล', 'เริ่มอินโทรแบบประสานงาน'],
  },
  {
    id: 'execution-deal-room',
    zone: 'execution',
    titleEn: 'Execution deal-room flow',
    titleRu: 'Execution flow в deal-room',
    titleTh: 'โฟลว์ execution ใน deal-room',
    stepsEn: ['Qualify intro request', 'Run due diligence workspace', 'Move to close with partner rails'],
    stepsRu: ['Квалифицировать intro request', 'Провести due diligence workspace', 'Закрыть через partner rails'],
    stepsTh: ['คัดกรอง intro request', 'ดำเนินงานใน due diligence workspace', 'ปิดดีลผ่าน partner rails'],
  },
];
