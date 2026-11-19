/** Editorial buying prompts; never inventory, assessment or offer authority. */
const words = (ru: string, en: string, th: string) => ({ ru, en, th });
export const newbuildCopy = {
  title: words(
    "Новостройки Пхукета: районы, проекты и застройщики",
    "New developments in Phuket: areas, projects and developers",
    "โครงการใหม่ในภูเก็ต: ทำเล โครงการ และผู้พัฒนา",
  ),
  description: words(
    "Разберитесь в районах и проектах Пхукета. Узнайте, что проверяет ClearView, изучите застройщиков и перейдите к объектам и условиям покупки.",
    "Understand Phuket areas and new developments. Explore developers, learn how ClearView works and find project units and purchase terms.",
    "ทำความเข้าใจทำเลและโครงการใหม่ในภูเก็ต รู้จักผู้พัฒนาและ ClearView แล้วเลือกยูนิตและเงื่อนไขการซื้อ",
  ),
  eyebrow: words(
    "Новостройки Пхукета",
    "New developments in Phuket",
    "โครงการใหม่ในภูเก็ต",
  ),
  headline: words(
    "Выбирайте с ясностью.",
    "Choose with clarity.",
    "เลือกด้วยความเข้าใจ",
  ),
  lead: words(
    "Сначала место и ваши планы. Затем проект, застройщик и условия. Соберите картину будущего дома — шаг за шагом.",
    "Start with a place and your plans. Then explore the project, developer and terms. Build a clear picture of your future home, step by step.",
    "เริ่มจากทำเลและแผนชีวิต แล้วศึกษาโครงการ ผู้พัฒนา และเงื่อนไข เพื่อเห็นภาพบ้านในอนาคตอย่างชัดเจน",
  ),
  projects: words("Выбрать проект", "Explore projects", "เลือกโครงการ"),
  units: words("Выбрать объект", "Explore units", "เลือกยูนิต"),
  allProjects: words("Все проекты", "All projects", "ทุกโครงการ"),
  retry: words("Повторить", "Try again", "ลองอีกครั้ง"),
  loading: words(
    "Загружаем публичные сведения…",
    "Loading public information…",
    "กำลังโหลดข้อมูลสาธารณะ…",
  ),
  error: words(
    "Данные сейчас не загрузились. Попробуйте ещё раз.",
    "Information could not be loaded. Please try again.",
    "โหลดข้อมูลไม่สำเร็จ โปรดลองอีกครั้ง",
  ),
  empty: words(
    "Пока нет опубликованных записей для этого раздела.",
    "There are no published entries for this section yet.",
    "ยังไม่มีข้อมูลที่เผยแพร่ในส่วนนี้",
  ),
};
export const newbuildGoals = [
  {
    title: words("Для жизни", "For everyday living", "สำหรับอยู่อาศัย"),
    copy: words(
      "Начните с ежедневных маршрутов, окружения и планировки. Проверьте, удобно ли здесь будет жить именно вам.",
      "Start with everyday journeys, surroundings and the floor plan. Check how the home would fit your routine.",
      "เริ่มจากการเดินทางประจำวัน สภาพแวดล้อม และแปลนห้อง ให้เหมาะกับชีวิตของคุณ",
    ),
  },
  {
    title: words(
      "Для своего сезона",
      "For your island seasons",
      "สำหรับพักตามฤดูกาล",
    ),
    copy: words(
      "Подумайте о времени на острове и уходе за домом в ваше отсутствие. Изучите правила комплекса и расходы.",
      "Think about your time on the island and care for the home while you are away. Review community rules and running costs.",
      "พิจารณาช่วงเวลาที่อยู่บนเกาะและการดูแลบ้านเมื่อคุณไม่อยู่ ตรวจสอบกฎและค่าใช้จ่าย",
    ),
  },
  {
    title: words(
      "Для сдачи в аренду",
      "For a rental plan",
      "สำหรับแผนปล่อยเช่า",
    ),
    copy: words(
      "Изучите условия управления, ограничения и полный состав расходов. Отделяйте прогноз дохода от подтверждённых результатов.",
      "Review management terms, restrictions and the full cost picture. Separate income forecasts from evidenced results.",
      "ศึกษาเงื่อนไขการบริหาร ข้อจำกัด และค่าใช้จ่ายทั้งหมด แยกประมาณการรายได้ออกจากผลลัพธ์ที่ยืนยันได้",
    ),
  },
];
export const newbuildAreas = [
  {
    slug: "bang-tao",
    district: "bang_tao",
    name: words("Банг Тао", "Bang Tao", "บางเทา"),
    copy: words(
      "Сравните расположение у побережья и внутри района. Отметьте важные для вас места на карте.",
      "Compare coastal locations with those further inland. Map the places that matter to you.",
      "เปรียบเทียบทำเลใกล้ชายฝั่งกับด้านใน และดูสถานที่สำคัญสำหรับคุณบนแผนที่",
    ),
  },
  {
    slug: "kamala",
    district: "kamala",
    name: words("Камала", "Kamala", "กมลา"),
    copy: words(
      "Рассмотрите подъезд к проекту, рельеф и свои ежедневные маршруты вместе с видом из окна.",
      "Consider access, terrain and your daily journeys alongside the view.",
      "พิจารณาทางเข้า ภูมิประเทศ และเส้นทางประจำวันควบคู่กับวิว",
    ),
  },
  {
    slug: "rawai",
    district: "rawai",
    name: words("Равай", "Rawai", "ราไวย์"),
    copy: words(
      "Сопоставьте формат дома с вашим ритмом жизни. Проверьте окружение и расстояния от конкретного проекта.",
      "Match the home format to your routine. Check the surroundings and distances from the actual project.",
      "เลือกประเภทบ้านให้เข้ากับชีวิต ตรวจสอบบริเวณรอบโครงการและระยะทางจริง",
    ),
  },
  {
    slug: "phuket-town",
    district: "phuket_town",
    name: words("Пхукет Таун", "Phuket Town", "เมืองภูเก็ต"),
    copy: words(
      "Сравните городские планы с поездками к морю. Выбирайте по реальным маршрутам, а не названию района.",
      "Balance city plans with trips to the coast. Choose around actual journeys, beyond the area name.",
      "เปรียบเทียบชีวิตในเมืองกับการเดินทางไปทะเล เลือกจากเส้นทางจริง ไม่ใช่เพียงชื่อย่าน",
    ),
  },
];
export const newbuildTrust = [
  {
    title: words("Застройщик", "Developer", "ผู้พัฒนา"),
    copy: words(
      "Сведения о компании и её проектах. Проверка компании не заменяет оценку конкретного проекта.",
      "Company information and its projects. A company check does not replace assessment of a specific project.",
      "ข้อมูลบริษัทและโครงการ การตรวจสอบบริษัทไม่แทนการประเมินโครงการเฉพาะ",
    ),
  },
  {
    title: words(
      "Проект и ClearView",
      "Project and ClearView",
      "โครงการและ ClearView",
    ),
    copy: words(
      "Для оценки важны опубликованный отчёт, дата, версия методологии и ограничения. Наличие проекта в каталоге не означает наличие рейтинга.",
      "An assessment needs a published report, date, methodology version and limitations. A catalogue entry does not mean a rating exists.",
      "การประเมินต้องมีรายงานที่เผยแพร่ วันที่ รุ่นวิธีประเมิน และข้อจำกัด การอยู่ในรายการไม่ได้หมายความว่ามีเรตติ้ง",
    ),
  },
  {
    title: words("Предложение", "Offer", "ข้อเสนอ"),
    copy: words(
      "Цена, доступность и условия уточняются для выбранного объекта. Дата загрузки страницы не является датой проверки предложения.",
      "Confirm price, availability and terms for the selected unit. Loading this page does not establish when an offer was verified.",
      "ยืนยันราคา ยูนิตว่าง และเงื่อนไขของยูนิตที่เลือก วันที่โหลดหน้าไม่ใช่วันที่ตรวจสอบข้อเสนอ",
    ),
  },
];
export const newbuildSteps = [
  {
    title: words("Определите задачу", "Define your plans", "กำหนดเป้าหมาย"),
    copy: words(
      "Район, формат дома, бюджет и горизонт покупки. Сохраните вопросы, которые важны лично вам.",
      "Area, home format, budget and purchase horizon. Keep a list of questions that matter to you.",
      "ทำเล ประเภทบ้าน งบประมาณ และช่วงเวลาซื้อ พร้อมคำถามที่สำคัญสำหรับคุณ",
    ),
  },
  {
    title: words(
      "Изучите основания",
      "Explore the evidence",
      "ศึกษาข้อมูลประกอบ",
    ),
    copy: words(
      "Сопоставьте проект, документы, застройщика и доступные оценки. Запросите пояснения к отсутствующим данным.",
      "Compare the project, documents, developer and available assessments. Ask for clarification where evidence is missing.",
      "เปรียบเทียบโครงการ เอกสาร ผู้พัฒนา และการประเมิน ขอคำชี้แจงเมื่อข้อมูลไม่ครบ",
    ),
  },
  {
    title: words("Проверьте условия", "Review the terms", "ตรวจสอบเงื่อนไข"),
    copy: words(
      "Для конкретного объекта уточните итоговую цену, график платежей, обязательные расходы, оформление и сроки. Заявка на подбор не резервирует объект.",
      "For the specific unit, confirm total price, payment schedule, mandatory costs, ownership terms and timing. An enquiry does not reserve a unit.",
      "ยืนยันราคารวม กำหนดชำระ ค่าใช้จ่าย เงื่อนไขกรรมสิทธิ์ และเวลาของยูนิต การสอบถามไม่ใช่การจอง",
    ),
  },
];
