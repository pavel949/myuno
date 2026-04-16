export interface InvestmentHubKpi {
  key: string;
  labelEn: string;
  labelRu: string;
  labelTh: string;
  target: string;
}

export interface InvestmentHubRolloutStage {
  id: string;
  titleEn: string;
  titleRu: string;
  titleTh: string;
  deliverablesEn: string[];
  deliverablesRu: string[];
  deliverablesTh: string[];
}

export const INVESTMENT_HUB_KPIS: InvestmentHubKpi[] = [
  { key: 'qualified_intros_per_month', labelEn: 'Qualified intros / month', labelRu: 'Квалифицированные интро / месяц', labelTh: 'จำนวน qualified intro / เดือน', target: '>= 40' },
  { key: 'deals_progressed_to_dd', labelEn: 'Deals progressed to DD', labelRu: 'Сделки, дошедшие до DD', labelTh: 'ดีลที่เข้าสู่ DD', target: '>= 12 / month' },
  { key: 'match_acceptance_rate', labelEn: 'Match acceptance rate', labelRu: 'Доля принятых матчей', labelTh: 'อัตราการยอมรับ match', target: '>= 30%' },
  { key: 'time_to_intro', labelEn: 'Median time to intro', labelRu: 'Медианное время до интро', labelTh: 'เวลามัธยฐานถึง intro', target: '<= 72h' },
  { key: 'dd_completion_rate', labelEn: 'DD completion rate', labelRu: 'Доля завершенных DD', labelTh: 'อัตราการเสร็จสิ้น DD', target: '>= 55%' },
];

export const INVESTMENT_HUB_ROLLOUT: InvestmentHubRolloutStage[] = [
  {
    id: 'stage-a',
    titleEn: 'Stage A — Data foundation and unified routes',
    titleRu: 'Этап A — Data foundation и единый роутинг',
    titleTh: 'ระยะ A — รากฐานข้อมูลและเส้นทางแบบรวม',
    deliverablesEn: ['Core entity graph tables', 'Read APIs for market/deals/network/execution', 'Investment Hub Shell routes'],
    deliverablesRu: ['Таблицы core entity graph', 'Read API для market/deals/network/execution', 'Маршруты Investment Hub Shell'],
    deliverablesTh: ['ตาราง core entity graph', 'Read API สำหรับ market/deals/network/execution', 'เส้นทาง Investment Hub Shell'],
  },
  {
    id: 'stage-b',
    titleEn: 'Stage B — Marketplace and matching',
    titleRu: 'Этап B — Marketplace и matching',
    titleTh: 'ระยะ B — Marketplace และ matching',
    deliverablesEn: ['Opportunity listing and filters', 'Fit score + reliability score', 'Qualified intro request workflow'],
    deliverablesRu: ['Каталог сделок и фильтры', 'Fit score + reliability score', 'Workflow квалифицированных интро-запросов'],
    deliverablesTh: ['รายการดีลและฟิลเตอร์', 'Fit score + reliability score', 'Workflow สำหรับ qualified intro request'],
  },
  {
    id: 'stage-c',
    titleEn: 'Stage C — Execution and monetization hooks',
    titleRu: 'Этап C — Execution и monetization hooks',
    titleTh: 'ระยะ C — Execution และ monetization hooks',
    deliverablesEn: ['Due diligence rooms', 'Pipeline SLA board', 'Intro fee billing events'],
    deliverablesRu: ['Due diligence rooms', 'SLA-доска pipeline', 'События биллинга intro fee'],
    deliverablesTh: ['ห้อง due diligence', 'บอร์ด SLA ของ pipeline', 'เหตุการณ์บิลลิ่ง intro fee'],
  },
  {
    id: 'stage-d',
    titleEn: 'Stage D — Partner compliance rails',
    titleRu: 'Этап D — Partner compliance rails',
    titleTh: 'ระยะ D — Partner compliance rails',
    deliverablesEn: ['Licensed partner routing', 'Success-fee settlement events', 'Compliance audit reporting'],
    deliverablesRu: ['Маршрутизация через licensed partners', 'События расчета success fee', 'Compliance-аудит и отчеты'],
    deliverablesTh: ['การกำหนดเส้นทางผ่าน licensed partner', 'เหตุการณ์ชำระ success fee', 'รายงาน compliance audit'],
  },
];
