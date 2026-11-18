/** Editorial decision prompts, not inventory, availability or measured local claims. */
export const rentalAreas = [
  {
    slug: "bang-tao",
    district: "bang_tao",
    name: { ru: "Банг Тао", en: "Bang Tao", th: "บางเทา" },
    note: {
      ru: "Пляж или жизнь внутри комплекса?",
      en: "Beach days or a community base?",
      th: "ใกล้ชายหาดหรือในโครงการ?",
    },
    copy: {
      ru: "Сравните расположение у моря и внутри района. Посмотрите, как устроен комплекс и что входит в аренду.",
      en: "Compare the coastline with locations further inland. Explore the community and what your rental includes.",
      th: "เปรียบเทียบทำเลริมทะเลกับด้านใน ดูรายละเอียดโครงการและสิ่งที่รวมในค่าเช่า",
    },
  },
  {
    slug: "kamala",
    district: "kamala",
    name: { ru: "Камала", en: "Kamala", th: "กมลา" },
    note: {
      ru: "У моря или с видом на холмы?",
      en: "By the sea or towards the hills?",
      th: "ใกล้ทะเลหรือวิวเนินเขา?",
    },
    copy: {
      ru: "Проверьте точку на карте, подъезд и ежедневные маршруты. Красивый вид не заменяет удобную дорогу.",
      en: "Check the map pin, access and everyday journeys. A beautiful view is only one part of the decision.",
      th: "ตรวจสอบตำแหน่ง ทางเข้า และเส้นทางประจำวัน วิวสวยเป็นเพียงส่วนหนึ่งของการเลือก",
    },
  },
  {
    slug: "rawai",
    district: "rawai",
    name: { ru: "Равай", en: "Rawai", th: "ราไวย์" },
    note: {
      ru: "Как будет выглядеть обычный день?",
      en: "What does your everyday look like?",
      th: "วันธรรมดาของคุณจะเป็นอย่างไร?",
    },
    copy: {
      ru: "Отметьте пляж, магазины и свои привычные дела. Сравнивайте жильё по вашим маршрутам, а не только по фотографии.",
      en: "Map your beach, shopping and daily plans. Compare homes around your own routine, beyond the listing photos.",
      th: "วางแผนเส้นทางไปชายหาด ร้านค้า และกิจวัตร เปรียบเทียบที่พักให้เหมาะกับชีวิตของคุณ",
    },
  },
  {
    slug: "phuket-town",
    district: "phuket_town",
    name: { ru: "Пхукет Таун", en: "Phuket Town", th: "เมืองภูเก็ต" },
    note: {
      ru: "Городской ритм или поездки к морю?",
      en: "City life or trips to the coast?",
      th: "ชีวิตในเมืองหรือเดินทางไปทะเล?",
    },
    copy: {
      ru: "Подумайте, где вы будете проводить больше времени. Сопоставьте городские планы с поездками на пляж.",
      en: "Think about where you will spend most of your time. Balance your city plans with journeys to the beach.",
      th: "คิดว่าคุณจะใช้เวลาส่วนใหญ่ที่ไหน แล้วเปรียบเทียบแผนในเมืองกับการเดินทางไปชายหาด",
    },
  },
] as const;
export const rentalDurations = [
  {
    tenancy: "short",
    title: { ru: "На время отпуска", en: "For a holiday", th: "สำหรับวันหยุด" },
    copy: {
      ru: "Несколько ночей или недель. Начните с дат и состава гостей.",
      en: "A few nights or weeks. Start with your dates and your group.",
      th: "ไม่กี่คืนหรือหลายสัปดาห์ เริ่มจากวันเข้าพักและจำนวนผู้เข้าพัก",
    },
  },
  {
    tenancy: "medium",
    title: {
      ru: "На несколько месяцев",
      en: "For a few months",
      th: "สำหรับหลายเดือน",
    },
    copy: {
      ru: "Больше времени на острове. Сравните район, быт и помесячные условия.",
      en: "More time on the island. Compare areas, daily life and monthly terms.",
      th: "ใช้เวลาบนเกาะมากขึ้น เปรียบเทียบย่าน ชีวิตประจำวัน และเงื่อนไขรายเดือน",
    },
  },
  {
    tenancy: "long",
    title: {
      ru: "Переехать и остаться",
      en: "To make a home",
      th: "สำหรับย้ายมาอยู่",
    },
    copy: {
      ru: "Долгосрочная аренда. Изучите договор, регулярные расходы и инфраструктуру.",
      en: "A longer-term rental. Review the contract, regular costs and local infrastructure.",
      th: "เช่าระยะยาว ตรวจสอบสัญญา ค่าใช้จ่ายประจำ และสิ่งอำนวยความสะดวกในพื้นที่",
    },
  },
] as const;
export const rentalChecklist = [
  {
    title: {
      ru: "Сначала — ваш ритм",
      en: "Start with your rhythm",
      th: "เริ่มจากจังหวะชีวิตของคุณ",
    },
    copy: {
      ru: "Пляж, школа, работа, прогулки: отметьте важные места и проверьте маршрут от конкретного дома.",
      en: "Beach, school, work, walks: map your priorities and check the journey from the actual home.",
      th: "ชายหาด โรงเรียน งาน หรือเดินเล่น ทำเครื่องหมายสถานที่สำคัญและตรวจสอบเส้นทางจากที่พักจริง",
    },
  },
  {
    title: {
      ru: "Затем — формат жилья",
      en: "Then choose your home",
      th: "จากนั้นเลือกรูปแบบที่พัก",
    },
    copy: {
      ru: "Квартира в комплексе или отдельная вилла? Сравните личное пространство, общие зоны и правила проживания.",
      en: "An apartment in a community or a private villa? Compare privacy, shared spaces and house rules.",
      th: "คอนโดในโครงการหรือวิลล่าส่วนตัว? เปรียบเทียบความเป็นส่วนตัว พื้นที่ส่วนกลาง และกฎการพัก",
    },
  },
  {
    title: {
      ru: "До решения — условия",
      en: "Before deciding, check the terms",
      th: "ตรวจสอบเงื่อนไขก่อนตัดสินใจ",
    },
    copy: {
      ru: "Уточните доступность, итоговую стоимость, депозит, коммунальные платежи и отмену. Цена в каталоге не подтверждает бронирование.",
      en: "Confirm availability, total cost, deposit, utilities and cancellation. A catalogue price does not confirm a booking.",
      th: "ยืนยันห้องว่าง ราคารวม เงินประกัน ค่าสาธารณูปโภค และการยกเลิก ราคาในรายการไม่ใช่การยืนยันการจอง",
    },
  },
] as const;
