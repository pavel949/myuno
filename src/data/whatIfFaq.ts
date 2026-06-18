/**
 * "Что делать, если…" — trilingual FAQ data (RU/EN/TH).
 * Source of truth: content brief from product, 9 categories × 40 items.
 * Format conventions for answers:
 *   - `\n` separates paragraphs
 *   - Lines starting with `– ` (en-dash + space) are rendered as <li>
 */
import {
  Stethoscope,
  Waves,
  Car,
  FileText,
  PawPrint,
  CloudRain,
  ShieldAlert,
  Home,
  Info,
  type LucideIcon,
} from 'lucide-react';

export type WhatIfLang = 'ru' | 'en' | 'th';

export interface WhatIfItem {
  id: string;
  q: Record<WhatIfLang, string>;
  a: Record<WhatIfLang, string>;
}

export interface WhatIfCategory {
  id:
    | 'medical'
    | 'beach'
    | 'road'
    | 'documents'
    | 'animals'
    | 'weather'
    | 'safety'
    | 'housing'
    | 'essentials';
  icon: LucideIcon;
  title: Record<WhatIfLang, string>;
  items: WhatIfItem[];
}

export const WHAT_IF_FAQ: WhatIfCategory[] = [
  // ─────────────────────────────────────────── 1. Медицина
  {
    id: 'medical',
    icon: Stethoscope,
    title: {
      ru: 'Медицина',
      en: 'Medical',
      th: 'การแพทย์',
    },
    items: [
      {
        id: '1.1',
        q: {
          ru: 'Что делать, если у меня лёгкое недомогание (простуда, лёгкая диарея, расстройство желудка) на Пхукете?',
          en: 'What should I do if I have a mild illness (cold, mild diarrhea, stomach upset) in Phuket?',
          th: 'หากมีอาการป่วยเล็กน้อย (ไข้หวัด ท้องเสียเล็กน้อย ปวดท้อง) ที่ภูเก็ต ควรทำอย่างไร?',
        },
        a: {
          ru: 'Отдыхайте, пейте много воды, избегайте алкоголя и тяжёлой еды. Можно принять безрецептурные препараты от температуры, боли и диареи. Если симптомы длятся более 2 дней, усиливаются, появляется высокая температура или сильная боль — обратитесь в ближайшую клинику или больницу.',
          en: 'Rest, drink plenty of water, avoid alcohol and heavy food. You may take over-the-counter medicine for fever, pain, or diarrhea. If symptoms last more than 2 days, get worse, or you have high fever or strong pain, visit the nearest clinic or hospital.',
          th: 'ควรพักผ่อน ดื่มน้ำมาก ๆ หลีกเลี่ยงแอลกอฮอล์และอาหารหนัก สามารถทานยาสามัญประจำบ้านเพื่อลดไข้ บรรเทาปวด หรือแก้ท้องเสียได้ หากอาการนานเกิน 2 วัน แย่ลง หรือมีไข้สูง/ปวดมาก ควรไปพบแพทย์ที่คลินิกหรือโรงพยาบาลใกล้ที่สุด',
        },
      },
      {
        id: '1.2',
        q: {
          ru: 'Что делать, если нужна срочная медицинская помощь?',
          en: 'What should I do if I need urgent medical help?',
          th: 'หากต้องการความช่วยเหลือทางการแพทย์เร่งด่วนควรทำอย่างไร?',
        },
        a: {
          ru: 'При угрозе жизни (сильное кровотечение, потеря сознания, подозрение на инфаркт, тяжёлая травма) немедленно звоните по номеру 1669 (скорая помощь Таиланда) или 191 (полиция). Операторы говорят по-английски. Сообщите своё местоположение и характер проблемы. До приезда врачей обеспечьте пострадавшему покой и не давайте лекарства без необходимости.',
          en: 'If it is life-threatening (severe bleeding, loss of consciousness, suspected heart attack, serious injury), immediately call 1669 (Thai ambulance) or 191 (police). Operators speak English. Tell them your location and what happened. Before help arrives, keep the person still and do not give unnecessary medication.',
          th: 'หากเป็นกรณีฉุกเฉินอันตรายถึงชีวิต (เลือดออกมาก หมดสติ สงสัยหัวใจวาย บาดเจ็บรุนแรง) ให้โทร 1669 (รถพยาบาล) หรือ 191 (ตำรวจ) ทันที เจ้าหน้าที่รับสายสามารถสื่อสารภาษาอังกฤษได้ แจ้งตำแหน่งและอาการของผู้ป่วย ระหว่างรอความช่วยเหลือ ควรให้ผู้ป่วยนอนนิ่ง ๆ และหลีกเลี่ยงการให้ยาโดยไม่จำเป็น',
        },
      },
      {
        id: '1.3',
        q: {
          ru: 'Что делать, если мне нужна клиника или врач на Пхукете?',
          en: 'What should I do if I need a clinic or a doctor in Phuket?',
          th: 'หากต้องการไปคลินิกหรือพบแพทย์ที่ภูเก็ตควรทำอย่างไร?',
        },
        a: {
          ru: 'Используйте раздел «Медицина» в приложении myUNO, чтобы найти ближайшую клинику, проверить рейтинг и язык персонала. На Пхукете есть международные госпитали и частные клиники с англо- и русскоязычными врачами. В экстренной ситуации можно поехать в ближайший крупный госпиталь — там есть круглосуточный приём.',
          en: 'Use the “Medicine” section in the myUNO app to find the nearest clinic, check its rating and languages spoken by staff. Phuket has international hospitals and private clinics with English- and sometimes Russian-speaking doctors. In an emergency, go to the nearest large hospital, they have 24/7 emergency departments.',
          th: 'ใช้ส่วน “การแพทย์ (Medicine)” ในแอป myUNO เพื่อค้นหาคลินิกใกล้คุณ ดูคะแนนรีวิวและภาษาที่บุคลากรใช้สื่อสาร ที่ภูเก็ตมีโรงพยาบาลนานาชาติและคลินิกเอกชนที่มีแพทย์พูดภาษาอังกฤษ (และบางแห่งมีล่ามภาษารัสเซีย) หากเป็นกรณีฉุกเฉิน ให้ไปโรงพยาบาลขนาดใหญ่ที่ใกล้ที่สุด ซึ่งมีห้องฉุกเฉินตลอด 24 ชม.',
        },
      },
      {
        id: '1.4',
        q: {
          ru: 'Что делать, если мне нужны лекарства?',
          en: 'What should I do if I need medicine?',
          th: 'หากต้องการซื้อยาที่ภูเก็ตควรทำอย่างไร?',
        },
        a: {
          ru: 'Аптеки («ร้านขายยา») есть в торговых центрах, рядом с клиниками и на туристических улицах. Возьмите с собой фото или название препарата на английском. Фармацевт предложит аналогичный тайский или международный препарат. Сильнодействующие лекарства (антибиотики, гормоны и т.п.) могут потребовать рецепт от местного врача.',
          en: 'Pharmacies (“ร้านขายยา”) are located in malls, near clinics, and on main tourist streets. Bring the name or a photo of your medicine in English. The pharmacist will offer a Thai or international equivalent. Strong medicines (antibiotics, hormones, etc.) may require a local doctor’s prescription.',
          th: 'ร้านขายยา (ร้านขายยา) มีอยู่ตามห้างสรรพสินค้า ใกล้คลินิก และบนถนนท่องเที่ยวหลัก ๆ ให้นำชื่อยาเป็นภาษาอังกฤษหรือรูปถ่ายฉลากยาไปให้เภสัชกรดู เภสัชกรจะช่วยแนะนำยาที่มีตัวยาใกล้เคียงกันได้ ยาบางประเภท เช่น ยาปฏิชีวนะหรือยาฮอร์โมน อาจต้องใช้ใบสั่งแพทย์จากแพทย์ท้องถิ่น',
        },
      },
      {
        id: '1.5',
        q: {
          ru: 'Что делать, если у меня хроническое заболевание и заканчиваются необходимые лекарства?',
          en: 'What should I do if I have a chronic condition and my regular medicine is running out?',
          th: 'หากมีโรคประจำตัวและยาที่ใช้ประจำใกล้หมดควรทำอย่างไร?',
        },
        a: {
          ru: 'Не ждите полного окончания лекарства. Обратитесь в международную клинику, возьмите с собой упаковку и рецепт (если есть). Врач подберёт аналог и выпишет тайский рецепт. Через myUNO можно найти клиники, которые работают с иностранными страховками, и организовать доставку лекарства из аптеки.',
          en: 'Do not wait until you completely run out. Visit an international clinic and bring your current medication package and (if available) your prescription. The doctor will choose an equivalent and issue a Thai prescription. Via myUNO you can find clinics working with foreign insurance and arrange pharmacy delivery.',
          th: 'อย่ารอจนยาหมดสนิท ควรไปพบแพทย์ที่คลินิกนานาชาติ พร้อมนำกล่องยาและใบสั่งยาที่มีอยู่ไปด้วย แพทย์จะช่วยหายาที่มีตัวยาเทียบเท่าและออกใบสั่งยาแบบไทยได้ ผ่านแอป myUNO คุณสามารถค้นหาคลินิกที่ทำงานร่วมกับประกันต่างประเทศ และสั่งให้ร้านขายยาจัดส่งยาไปยังที่พักได้',
        },
      },
      {
        id: '1.6',
        q: {
          ru: 'Что делать, если у меня есть медицинская страховка и я заболел?',
          en: 'What should I do if I have medical insurance and I get sick?',
          th: 'หากมีประกันสุขภาพและล้มป่วยที่ภูเก็ตควรทำอย่างไร?',
        },
        a: {
          ru: 'Перед визитом в клинику проверьте в myUNO или в полисе, с какими больницами работает ваша страховая. В выбранной клинике предъявите паспорт и страховой полис. В большинстве случаев клиника свяжется со страховой напрямую. Если вам пришлось оплатить всё самостоятельно, сохраните все счета и выписки для последующего возмещения.',
          en: 'Before going to a clinic, check in myUNO or in your policy which hospitals work with your insurance. At the clinic, show your passport and insurance policy. In many cases the clinic will contact the insurer directly. If you pay by yourself, keep all receipts and medical reports to claim reimbursement later.',
          th: 'ก่อนเข้ารับการรักษา ควรตรวจสอบในแอป myUNO หรือในกรมธรรม์ว่าประกันของคุณทำสัญญากับโรงพยาบาลใดบ้าง เมื่อไปถึงคลินิก/โรงพยาบาล ให้แสดงหนังสือเดินทางและกรมธรรม์ประกัน ในหลายกรณี โรงพยาบาลจะติดต่อบริษัทประกันให้โดยตรง หากคุณต้องจ่ายเงินเองก่อน ควรเก็บใบเสร็จและเอกสารทางการแพทย์ทั้งหมดไว้เพื่อยื่นขอคืนเงินภายหลัง',
        },
      },
      {
        id: '1.7',
        q: {
          ru: 'Что делать, если у меня лёгкое пищевое отравление или укус насекомого?',
          en: 'What should I do if I have mild food poisoning or an insect bite?',
          th: 'หากมีอาการอาหารเป็นพิษเล็กน้อยหรือถูกแมลงกัดต่อยควรทำอย่างไร?',
        },
        a: {
          ru: 'При лёгком отравлении пейте воду небольшими глотками, можно принять сорбент. Избегайте жирной и острой пищи. При укусе комаров или других насекомых промойте место водой с мылом, нанесите противозудный или антигистаминный гель. Если появляются сильная слабость, сыпь по всему телу, отёк лица или затруднённое дыхание — срочно обратитесь к врачу или вызовите скорую.',
          en: 'For mild food poisoning, drink water in small sips, you may take an absorbent. Avoid fatty and spicy food. For insect bites, wash the area with soap and water and apply anti-itch or antihistamine gel. If you develop severe weakness, widespread rash, facial swelling, or difficulty breathing, see a doctor urgently or call an ambulance.',
          th: 'หากอาหารเป็นพิษเล็กน้อย ให้จิบน้ำบ่อย ๆ ทานยาดูดซับพิษในลำไส้ และหลีกเลี่ยงอาหารมันหรือเผ็ด สำหรับแมลงกัดต่อย ให้ล้างบริเวณที่ถูกกัดด้วยน้ำและสบู่ แล้วทายาแก้คันหรือยาทาแก้แพ้ หากมีอาการอ่อนเพลียมาก ผื่นขึ้นทั้งตัว หน้าบวม หรือหายใจลำบาก ควรไปพบแพทย์ทันทีหรือโทรเรียกรถพยาบาล',
        },
      },
    ],
  },

  // ─────────────────────────────────────────── 2. Пляж и море
  {
    id: 'beach',
    icon: Waves,
    title: {
      ru: 'Пляж и море',
      en: 'Beach & Sea',
      th: 'ชายหาดและทะเล',
    },
    items: [
      {
        id: '2.1',
        q: {
          ru: 'Что делать, если я вижу красные или жёлтые флаги на пляже?',
          en: 'What should I do if I see red or yellow flags on the beach?',
          th: 'หากเห็นธงแดงหรือธงเหลืองบนชายหาดควรทำอย่างไร?',
        },
        a: {
          ru: 'На пляжах Пхукета действует система флагов:\n– Красный флаг — купание запрещено (сильные течения, высокие волны).\n– Жёлтый флаг — купаться можно, но с большой осторожностью.\n– Зелёный флаг — купание безопасно.\nПри красном флаге не заходите в воду даже по колено. Соблюдайте указания спасателей.',
          en: 'Phuket beaches use flag warnings:\n– Red flag – swimming is prohibited (strong currents, high waves).\n– Yellow flag – swim with great caution.\n– Green flag – generally safe for swimming.\nDo not enter the water when a red flag is shown, even in shallow water. Follow lifeguards’ instructions.',
          th: 'ชายหาดในภูเก็ตใช้ระบบธงเตือนภัย:\n– ธงแดง – ห้ามลงเล่นน้ำ (กระแสน้ำแรง คลื่นสูง)\n– ธงเหลือง – เล่นน้ำได้แต่ต้องระมัดระวังเป็นพิเศษ\n– ธงเขียว – โดยทั่วไปปลอดภัยในการว่ายน้ำ\nหากเป็นธงแดง ไม่ควรลงน้ำแม้เพียงระดับเข่า และควรปฏิบัติตามคำแนะนำของเจ้าหน้าที่กู้ภัยอย่างเคร่งครัด',
        },
      },
      {
        id: '2.2',
        q: {
          ru: 'Что делать, если меня уносит течением в море?',
          en: 'What should I do if I’m being pulled away by a current in the sea?',
          th: 'หากถูกกระแสน้ำพัดออกจากชายฝั่งควรทำอย่างไร?',
        },
        a: {
          ru: 'Не паникуйте и не плывите против течения. Плывите параллельно берегу, пока не выйдете из зоны сильного течения, затем направляйтесь к берегу по диагонали. Зовите на помощь и подавайте сигналы руками, чтобы вас заметили спасатели или другие люди на пляже.',
          en: 'Do not panic and don’t swim against the current. Swim parallel to the shore until you are out of the strongest current, then head back towards the beach diagonally. Call for help and wave your arms so lifeguards or other people can see you.',
          th: 'อย่าตกใจ และอย่าว่ายน้ำสวนกระแสน้ำ ให้พยายามว่ายน้ำขนานไปกับแนวชายฝั่ง จนกว่าจะหลุดออกจากกระแสน้ำแรง จากนั้นจึงค่อยว่ายกลับเข้าฝั่งในแนวทแยงมุม ตะโกนขอความช่วยเหลือและโบกมือเพื่อให้เจ้าหน้าที่กู้ภัยหรือคนบนฝั่งมองเห็นคุณ',
        },
      },
      {
        id: '2.3',
        q: {
          ru: 'Что делать, если я порезался о кораллы или камни?',
          en: 'What should I do if I cut myself on coral or rocks?',
          th: 'หากโดนปะการังหรือหินบาดควรทำอย่างไร?',
        },
        a: {
          ru: 'Выйдите из воды, аккуратно промойте рану пресной водой с мылом, удалите видимые кусочки песка, ракушек или кораллов (не трите сильно). Обработайте рану антисептиком. Если рана глубокая, сильно кровоточит или вы не делали прививку от столбняка — обратитесь в клинику.',
          en: 'Leave the water, gently rinse the wound with fresh water and soap, remove visible sand, shells, or coral pieces (do not scrub hard). Disinfect the wound with antiseptic. If it is deep, bleeding heavily, or your last tetanus shot was long ago, visit a clinic.',
          th: 'ให้ขึ้นจากน้ำ ล้างแผลด้วยน้ำสะอาดและสบู่อย่างเบามือ เอาเศษทราย เปลือกหอย หรือชิ้นปะการังที่มองเห็นออกอย่างระมัดระวัง (อย่าถูแรง) จากนั้นทายาฆ่าเชื้อ หากแผลลึก เลือดออกมาก หรือไม่ได้ฉีดวัคซีนบาดทะยักมานาน ควรไปพบแพทย์',
        },
      },
      {
        id: '2.4',
        q: {
          ru: 'Что делать, если меня ужалила медуза?',
          en: 'What should I do if I’m stung by a jellyfish?',
          th: 'หากถูกแมงกะพรุนต่อยควรทำอย่างไร?',
        },
        a: {
          ru: 'Выйдите из воды, не трите место ожога. Осторожно удалите щупальца (при необходимости через ткань или перчатку). Промойте место солёной водой, можно приложить холодный компресс через ткань. При сильной боли, отёке, затруднённом дыхании или головокружении немедленно обратитесь в ближайшую клинику или вызовите скорую.',
          en: 'Get out of the water and do not rub the sting area. Carefully remove tentacles (if any) using a cloth or glove. Rinse with seawater and apply a cold compress through cloth. If you have intense pain, swelling, breathing difficulty, or dizziness, go to the nearest clinic or call an ambulance.',
          th: 'ให้ขึ้นจากน้ำทันที อย่าถูบริเวณที่ถูกต่อย ใช้ผ้าหรือถุงมือช่วยคีบหนวดแมงกะพรุนที่ติดออกเบา ๆ ล้างด้วยน้ำทะเล แล้วประคบเย็นผ่านผ้า หากมีอาการปวดมาก บวม หายใจลำบาก หรือเวียนศีรษะ ควรรีบไปพบแพทย์หรือติดต่อรถพยาบาลทันที',
        },
      },
      {
        id: '2.5',
        q: {
          ru: 'Что делать, если на пляже стало плохо от жары или солнца?',
          en: 'What should I do if I feel sick from heat or sun on the beach?',
          th: 'หากรู้สึกไม่สบายเพราะร้อนหรือแดดแรงบนชายหาดควรทำอย่างไร?',
        },
        a: {
          ru: 'Уйдите в тень или помещение с кондиционером, снимите или расстегните лишнюю одежду, пейте прохладную (не ледяную) воду небольшими глотками, смочите водой шею и лоб. Если появляется сильная слабость, тошнота, спутанность сознания, судороги или высокая температура — срочно обратитесь к врачу или вызовите скорую.',
          en: 'Move to the shade or an air-conditioned place, remove or loosen extra clothing, drink cool (not ice-cold) water in small sips, and wet your neck and forehead with water. If you experience severe weakness, nausea, confusion, seizures, or high body temperature, see a doctor urgently or call an ambulance.',
          th: 'ให้ย้ายไปอยู่ในที่ร่มหรือห้องปรับอากาศ ถอดหรือคลายเสื้อผ้าที่รัดแน่น ดื่มน้ำเย็นแบบไม่เย็นจัดทีละน้อย และใช้ผ้าชุบน้ำเช็ดหรือประคบที่คอและหน้าผาก หากมีอาการอ่อนเพลียมาก คลื่นไส้ สับสน ชัก หรือมีไข้สูง ควรรีบไปพบแพทย์หรือโทรเรียกรถพยาบาลทันที',
        },
      },
    ],
  },

  // ─────────────────────────────────────────── 3. Дорога
  {
    id: 'road',
    icon: Car,
    title: {
      ru: 'Дорога',
      en: 'On the Road',
      th: 'การเดินทาง',
    },
    items: [
      {
        id: '3.1',
        q: {
          ru: 'Что делать, если я попал в небольшое ДТП на Пхукете?',
          en: 'What should I do if I have a minor traffic accident in Phuket?',
          th: 'หากเกิดอุบัติเหตุทางจราจรเล็กน้อยที่ภูเก็ตควรทำอย่างไร?',
        },
        a: {
          ru: 'Остановитесь, включите аварийку, при необходимости выставьте знак. Убедитесь, что никто не пострадал. При травмах звоните 1669 (скорая) и 191 (полиция). Сделайте фото места происшествия и повреждений. Обменяйтесь контактами и данными страховки с другим водителем. Сообщите в свою страховую компанию как можно скорее.',
          en: 'Stop and turn on hazard lights. If anyone is injured, call 1669 (ambulance) and 191 (police). Take photos of the scene and damage. Exchange contact details and insurance information with the other driver. Inform your insurance company as soon as possible.',
          th: 'ให้หยุดรถและเปิดไฟฉุกเฉิน หากมีผู้บาดเจ็บให้โทร 1669 (รถพยาบาล) และ 191 (ตำรวจ) ถ่ายรูปที่เกิดเหตุและความเสียหายของรถ แลกเปลี่ยนข้อมูลการติดต่อและประกันภัยกับคู่กรณี แจ้งบริษัทประกันของคุณโดยเร็วที่สุด',
        },
      },
      {
        id: '3.2',
        q: {
          ru: 'Что делать, если меня остановила полиция и просит права?',
          en: 'What should I do if the police stop me and ask for my license?',
          th: 'หากตำรวจเรียกตรวจและขอดูใบขับขี่ควรทำอย่างไร?',
        },
        a: {
          ru: 'Спокойно предъявите:\n– национальные водительские права;\n– международное водительское удостоверение (если есть);\n– документы на транспорт и страховку (если вы владелец).\nЕсли вам выписали штраф, попросите официальный чек. Не предлагайте и не принимайте взятки.',
          en: 'Calmly show your:\n– national driving license;\n– International Driving Permit (if you have one);\n– vehicle registration and insurance (if you are the owner).\nIf you receive a fine, ask for an official receipt. Do not offer or accept bribes.',
          th: 'ควรแสดงเอกสารอย่างสุภาพ ได้แก่\n– ใบอนุญาตขับขี่จากประเทศต้นทางของคุณ\n– ใบอนุญาตขับขี่ระหว่างประเทศ (ถ้ามี)\n– เอกสารจดทะเบียนรถและประกันภัย (หากคุณเป็นเจ้าของรถ)\nหากถูกออกใบสั่งปรับ ให้ขอใบเสร็จรับเงินอย่างเป็นทางการ อย่าเสนอหรือรับสินบน',
        },
      },
      {
        id: '3.3',
        q: {
          ru: 'Что делать, если я хочу арендовать байк или автомобиль?',
          en: 'What should I do if I want to rent a motorbike or car?',
          th: 'หากต้องการเช่ามอเตอร์ไซค์หรือรถยนต์ควรทำอย่างไร?',
        },
        a: {
          ru: 'Выберите надёжную компанию (можно через myUNO), обязательно сфотографируйте транспорт со всех сторон перед выездом, проверьте тормоза, свет и шины. Никогда не оставляйте оригинал паспорта в залог — только копию и депозит. Убедитесь, что у вас есть права, подходящие для выбранного транспорта, и страховка.',
          en: 'Choose a reliable rental company (you can use myUNO), take photos of the vehicle from all sides before leaving, check brakes, lights and tires. Never leave your original passport as a deposit – only a copy and a monetary deposit. Make sure you have the correct driving license and insurance.',
          th: 'ควรเลือกบริษัทเช่าที่น่าเชื่อถือ (สามารถใช้ myUNO ช่วยค้นหาได้) ถ่ายรูปสภาพรถทุกมุมก่อนนำออกไปใช้งาน ตรวจสอบระบบเบรก ไฟ และยาง ห้ามทิ้งหนังสือเดินทางตัวจริงไว้เป็นหลักประกัน ให้ใช้สำเนาพร้อมเงินมัดจำแทน และตรวจสอบว่าคุณมีใบขับขี่และประกันที่ถูกต้องตามประเภทยานพาหนะ',
        },
      },
      {
        id: '3.4',
        q: {
          ru: 'Что делать, если я не уверен, можно ли здесь парковаться?',
          en: 'What should I do if I’m not sure whether I can park here?',
          th: 'หากไม่แน่ใจว่าสามารถจอดรถตรงนี้ได้หรือไม่ควรทำอย่างไร?',
        },
        a: {
          ru: 'Ориентируйтесь на разметку и знаки. В целом безопаснее всего парковаться: на официальных парковках, у торговых центров и гостиниц, в местах с белой разметкой. Не паркуйтесь у пешеходных переходов, автобусных остановок и выездов. При сомнениях лучше найти платную парковку.',
          en: 'Check road signs and markings. Safest options are official parking areas, malls, hotels, and places with white markings. Do not park near pedestrian crossings, bus stops, or building entrances. If you are unsure, choose a paid parking lot.',
          th: 'ให้ดูป้ายจราจรและเส้นแบ่งบนถนน ทางที่ปลอดภัยที่สุดคือจอดในลานจอดรถที่เป็นทางการ ตามห้างสรรพสินค้า โรงแรม หรือพื้นที่ที่มีเส้นขาวกำหนดไว้ ห้ามจอดใกล้ทางม้าลาย ป้ายหยุดรถประจำทาง และทางเข้า/ออกอาคาร หากไม่แน่ใจควรเลือกใช้ลานจอดรถแบบเสียค่าบริการ',
        },
      },
      {
        id: '3.5',
        q: {
          ru: 'Что делать, если я не могу найти такси или не хочу торговаться с водителями?',
          en: 'What should I do if I can’t find a taxi or don’t want to haggle over the price?',
          th: 'หากหารถแท็กซี่ไม่ได้ หรือไม่อยากต่อรองราคาควรทำอย่างไร?',
        },
        a: {
          ru: 'Используйте приложения с фиксированным тарифом (Grab и др.) или вызов транспорта через myUNO. Вы увидите цену заранее и сможете оплатить картой или наличными. Это безопаснее и чаще всего дешевле, чем договариваться на улице.',
          en: 'Use fixed-price apps such as Grab or transport booking via myUNO. You will see the price in advance and can pay by card or cash. This is usually safer and often cheaper than negotiating on the street.',
          th: 'ให้ใช้แอปเรียกรถที่มีราคาคงที่ เช่น Grab หรือใช้บริการเรียกรถผ่านแอป myUNO คุณจะเห็นราคาก่อนยืนยันการเดินทาง และสามารถจ่ายเงินด้วยบัตรหรือเงินสด วิธีนี้มักปลอดภัยและคุ้มค่ากว่าการโบกรถต่อรองราคาข้างถนน',
        },
      },
    ],
  },

  // ─────────────────────────────────────────── 4. Документы
  {
    id: 'documents',
    icon: FileText,
    title: {
      ru: 'Документы',
      en: 'Documents',
      th: 'เอกสาร',
    },
    items: [
      {
        id: '4.1',
        q: {
          ru: 'Что делать, если я потерял паспорт на Пхукете?',
          en: 'What should I do if I lose my passport in Phuket?',
          th: 'หากทำหนังสือเดินทางหายที่ภูเก็ตควรทำอย่างไร?',
        },
        a: {
          ru: 'Сразу же обратитесь в ближайший полицейский участок и оформите заявление о потере, сохраните справку. Затем свяжитесь с посольством или консульством вашей страны (контакты можно найти в myUNO), чтобы оформить временный документ или новый паспорт. После этого нужно обновить данные визы в иммиграционном офисе.',
          en: 'Go to the nearest police station and report the loss, keep the police report. Then contact your embassy or consulate (contacts are available in myUNO) to issue a temporary travel document or a new passport. After that, you must update your visa data at the immigration office.',
          th: 'ให้ไปแจ้งความที่สถานีตำรวจใกล้ที่สุดและขอใบรับรองการสูญหาย จากนั้นติดต่อสถานทูตหรือสถานกงสุลของประเทศคุณ (ค้นหาข้อมูลติดต่อได้ในแอป myUNO) เพื่อขอหนังสือเดินทางชั่วคราวหรือออกเล่มใหม่ แล้วนำเอกสารดังกล่าวไปอัปเดตข้อมูลวีซ่าที่สำนักงานตรวจคนเข้าเมือง',
        },
      },
      {
        id: '4.2',
        q: {
          ru: 'Что делать, если я просрочил визу?',
          en: 'What should I do if my visa is expired?',
          th: 'หากวีซ่าหมดอายุแล้วควรทำอย่างไร?',
        },
        a: {
          ru: 'Не пытайтесь уехать тайно. Чем дольше просрочка, тем больше штраф и риск депортации. Как можно скорее обратитесь в иммиграционный офис, возьмите с собой паспорт, билеты, документы о проживании. Там объяснят, как оплатить штраф и продлить или изменить статус пребывания.',
          en: 'Do not try to leave the country secretly. The longer the overstay, the higher the fine and the risk of deportation. Go to the immigration office as soon as possible with your passport, tickets, and proof of stay. They will explain how to pay the fine and extend or change your visa status.',
          th: 'ไม่ควรพยายามออกนอกประเทศอย่างผิดกฎหมาย ยิ่งอยู่เกินกำหนดนาน ค่าปรับและความเสี่ยงที่จะถูกเนรเทศยิ่งสูงขึ้น ให้ไปที่สำนักงานตรวจคนเข้าเมืองโดยเร็วที่สุด พร้อมหนังสือเดินทาง ตั๋วเดินทาง และหลักฐานที่พัก เจ้าหน้าที่จะอธิบายขั้นตอนการชำระค่าปรับและการต่ออายุหรือเปลี่ยนประเภทวีซ่าให้',
        },
      },
      {
        id: '4.3',
        q: {
          ru: 'Что делать, если мне нужно продлить визу или штамп пребывания?',
          en: 'What should I do if I need to extend my visa or stay stamp?',
          th: 'หากต้องการต่ออายุวีซ่าหรือสแตมป์พำนักควรทำอย่างไร?',
        },
        a: {
          ru: 'Проверьте тип вашей визы и сроки в паспорте. Через myUNO можно посмотреть актуальные правила и записаться в иммиграционный офис на Пхукете. Подготовьте: паспорт, фото, адрес проживания, денежные средства для оплаты госпошлины. Приходите заранее, так как возможны очереди.',
          en: 'Check your visa type and expiry date in your passport. Through myUNO you can see current rules and book an appointment at the Phuket immigration office. Prepare your passport, photo, proof of address, and cash for the government fee. Come early as there may be queues.',
          th: 'ตรวจสอบประเภทวีซ่าและวันที่หมดอายุในหนังสือเดินทางของคุณ สามารถใช้แอป myUNO ดูกฎปัจจุบันและจองคิวที่สำนักงานตรวจคนเข้าเมืองภูเก็ตได้ เตรียมหนังสือเดินทาง รูปถ่าย หลักฐานที่อยู่ และเงินสดสำหรับค่าธรรมเนียมรัฐ ควรไปถึงก่อนเวลาเพราะอาจมีคิวรอ',
        },
      },
      {
        id: '4.4',
        q: {
          ru: 'Что делать, если мне нужен официальный перевод документов или нотариальное заверение?',
          en: 'What should I do if I need an official translation or notarization of documents?',
          th: 'หากต้องการแปลเอกสารอย่างเป็นทางการหรือรับรองเอกสารโดยทนาย/โนตารีควรทำอย่างไร?',
        },
        a: {
          ru: 'В myUNO есть список аккредитованных переводчиков и нотариусов на Пхукете. Выберите специалиста, загрузите документ для предварительной оценки, согласуйте сроки и стоимость. Для документов, которые пойдут в государственные органы Таиланда, уточните, нужен ли ещё апостиль или легализация в посольстве.',
          en: 'myUNO provides a list of accredited translators and notaries in Phuket. Choose a specialist, upload the document for a preliminary quote, and agree on the timeframe and price. For documents to be used in Thai authorities, check whether you also need an apostille or embassy legalization.',
          th: 'ในแอป myUNO มีรายชื่อผู้แปลเอกสารและโนตารีที่ได้รับการรับรองในภูเก็ต ให้เลือกผู้ให้บริการ อัปโหลดเอกสารเพื่อประเมินราคาและระยะเวลา จากนั้นตกลงเงื่อนไขกัน หากเอกสารถูกใช้กับหน่วยงานราชการไทย ให้ตรวจสอบว่าจำเป็นต้องมีตรา Apostille หรือการรับรองจากสถานทูตเพิ่มเติมหรือไม่',
        },
      },
    ],
  },

  // ─────────────────────────────────────────── 5. Животные
  {
    id: 'animals',
    icon: PawPrint,
    title: {
      ru: 'Животные',
      en: 'Animals',
      th: 'สัตว์',
    },
    items: [
      {
        id: '5.1',
        q: {
          ru: 'Что делать, если меня укусила собака или кошка?',
          en: 'What should I do if I’m bitten by a dog or a cat?',
          th: 'หากถูกสุนัขหรือแมวกัดควรทำอย่างไร?',
        },
        a: {
          ru: 'Сразу промойте рану водой с мылом не менее 10–15 минут и обработайте антисептиком. Как можно быстрее обратитесь в клинику для оценки риска бешенства и столбняка и, при необходимости, для вакцинации. Не откладывайте визит к врачу, даже если укус кажется незначительным.',
          en: 'Immediately wash the wound with soap and water for at least 10–15 minutes and disinfect it. As soon as possible, go to a clinic to assess the risk of rabies and tetanus and to receive vaccination if needed. Do not delay seeing a doctor, even if the bite looks small.',
          th: 'ให้รีบล้างแผลด้วยน้ำและสบู่อย่างน้อย 10–15 นาที จากนั้นทายาฆ่าเชื้อ แล้วไปพบแพทย์ที่คลินิกโดยเร็วที่สุด เพื่อตรวจประเมินความเสี่ยงโรคพิษสุนัขบ้าและบาดทะยัก และรับวัคซีนหากจำเป็น ไม่ควรชะลอการพบแพทย์แม้แผลจะดูเล็กน้อย',
        },
      },
      {
        id: '5.2',
        q: {
          ru: 'Что делать, если меня укусила змея?',
          en: 'What should I do if I’m bitten by a snake?',
          th: 'หากถูกงูกัดควรทำอย่างไร?',
        },
        a: {
          ru: 'Постарайтесь сохранять спокойствие и не двигаться лишний раз, чтобы яд распространялся медленнее. Зафиксируйте укушенную конечность в удобном положении. Не разрезайте рану и не отсасывайте яд. Немедленно вызовите скорую (1669) или отправляйтесь в ближайшую больницу. Если возможно, запомните цвет и размеры змеи, но не пытайтесь её ловить.',
          en: 'Stay as calm and still as possible so the venom spreads more slowly. Keep the bitten limb immobilized in a comfortable position. Do not cut the wound or suck out the venom. Call an ambulance (1669) or go to the nearest hospital immediately. If possible, remember the snake’s color and size, but do not try to catch it.',
          th: 'พยายามตั้งสติและอย่าขยับตัวหรือขยับบริเวณที่ถูกกัดมากเกินไป เพื่อให้พิษแพร่กระจายช้าลง ยึดตรึงแขนหรือขาที่ถูกกัดให้อยู่ในท่าที่สบาย ห้ามกรีดแผลหรือดูดพิษออก โทรเรียกรถพยาบาลที่ 1669 หรือไปโรงพยาบาลที่ใกล้ที่สุดทันที หากทำได้ให้จำสีและขนาดของงูไว้ แต่ห้ามพยายามจับงู',
        },
      },
      {
        id: '5.3',
        q: {
          ru: 'Что делать, если я увидел змею, варана или крупное дикое животное возле дома или отеля?',
          en: 'What should I do if I see a snake, monitor lizard, or other wild animal near my home or hotel?',
          th: 'หากเห็นงู ตัวเงินตัวทอง หรือสัตว์ป่าขนาดใหญ่อยู่ใกล้บ้านหรือโรงแรมควรทำอย่างไร?',
        },
        a: {
          ru: 'Не подходите близко и не пытайтесь трогать или кормить животное. Сообщите администрации отеля, охране комплекса или управляющему дому. При необходимости они вызовут специалистов для отлова. Дикие животные обычно не нападают без причины, если их не провоцировать.',
          en: 'Do not approach, touch, or feed the animal. Inform the hotel reception, security, or property manager. They will call the appropriate service to remove the animal if necessary. Wild animals usually do not attack unless they are disturbed or provoked.',
          th: 'อย่าเข้าไปใกล้ อย่าพยายามจับหรือให้อาหารสัตว์นั้น ให้แจ้งพนักงานโรงแรม รปภ. หรือผู้ดูแลอาคาร พวกเขาจะติดต่อหน่วยงานที่เกี่ยวข้องให้มาช่วยจับหรือย้ายสัตว์ออกไป สัตว์ป่าส่วนใหญ่จะไม่ทำร้ายคน หากไม่ถูกรบกวนหรือยั่วยุ',
        },
      },
      {
        id: '5.4',
        q: {
          ru: 'Что делать, если меня поцарапала или укусила обезьяна?',
          en: 'What should I do if a monkey bites or scratches me?',
          th: 'หากถูกลิงกัดหรือข่วนควรทำอย่างไร?',
        },
        a: {
          ru: 'Обезьяны могут переносить опасные инфекции. Немедленно промойте место укуса/царапины водой с мылом 10–15 минут, обработайте антисептиком и как можно скорее обратитесь в клинику для оценки необходимости прививки от бешенства и других инфекций. В дальнейшем избегайте кормления и близкого контакта с дикими обезьянами.',
          en: 'Monkeys can carry dangerous infections. Immediately wash the wound with soap and water for 10–15 minutes, disinfect it, and go to a clinic as soon as possible to check if rabies or other vaccines are needed. Avoid feeding or closely interacting with wild monkeys in the future.',
          th: 'ลิงสามารถนำเชื้อโรคอันตรายได้ ให้รีบล้างแผลด้วยน้ำและสบู่ 10–15 นาที ทายาฆ่าเชื้อ แล้วไปพบแพทย์โดยเร็วที่สุด เพื่อประเมินความจำเป็นในการฉีดวัคซีนป้องกันโรคพิษสุนัขบ้าและโรคอื่น ๆ ต่อไปไม่ควรให้อาหารหรือเข้าไปใกล้ลิงป่า',
        },
      },
    ],
  },

  // ─────────────────────────────────────────── 6. Погода
  {
    id: 'weather',
    icon: CloudRain,
    title: {
      ru: 'Погода',
      en: 'Weather',
      th: 'สภาพอากาศ',
    },
    items: [
      {
        id: '6.1',
        q: {
          ru: 'Что делать, если начался сильный ливень или наводнение?',
          en: 'What should I do if there is heavy rain or flooding?',
          th: 'หากเกิดฝนตกหนักหรือน้ำท่วมควรทำอย่างไร?',
        },
        a: {
          ru: 'Избегайте езды на байке и прогулок по низинам, где вода быстро поднимается. Оставайтесь в безопасном помещении, не пересекайте затопленные участки дороги пешком или на машине. Следите за предупреждениями в новостях и через местные каналы (в том числе подсказки в myUNO).',
          en: 'Avoid riding a motorbike and walking in low-lying areas where water rises quickly. Stay indoors in a safe place and do not cross flooded roads on foot or by car. Follow weather warnings in the news and local channels (including alerts in myUNO).',
          th: 'หลีกเลี่ยงการขี่มอเตอร์ไซค์และเดินในพื้นที่ลุ่มต่ำที่น้ำท่วมง่าย ให้อยู่ภายในอาคารที่ปลอดภัย และไม่ควรเดินหรือขับรถผ่านถนนที่มีน้ำท่วมขัง ติดตามประกาศเตือนภัยฝนฟ้าคะนองผ่านข่าวหรือช่องทางท้องถิ่น (รวมถึงการแจ้งเตือนในแอป myUNO)',
        },
      },
      {
        id: '6.2',
        q: {
          ru: 'Что делать, если объявлено штормовое предупреждение?',
          en: 'What should I do if there is a storm warning?',
          th: 'หากมีการประกาศเตือนพายุควรทำอย่างไร?',
        },
        a: {
          ru: 'Откажитесь от морских прогулок, катания на лодках и посещения отдалённых островов. Закройте окна и балконы, уберите с них предметы, которые может сдуть ветром. Следите за сообщениями властей и администрации отеля. При сильном шторме лучше оставаться в помещении.',
          en: 'Cancel boat trips, sea excursions, and visits to remote islands. Close windows and balconies, remove any loose objects that could be blown away. Follow announcements from authorities and your hotel. During a strong storm, stay indoors.',
          th: 'ควรงดทริปล่องเรือ กิจกรรมทางทะเล และการเดินทางไปเกาะไกล ๆ ปิดหน้าต่างและประตูระเบียง เก็บสิ่งของที่ลมอาจพัดปลิวได้ ให้ติดตามประกาศจากหน่วยงานรัฐและโรงแรมของคุณ ในช่วงที่พายุแรงควรอยู่ภายในอาคาร',
        },
      },
      {
        id: '6.3',
        q: {
          ru: 'Что делать, если на улице очень жарко и душно?',
          en: 'What should I do if it’s extremely hot and humid outside?',
          th: 'หากอากาศร้อนอบอ้าวมากควรทำอย่างไร?',
        },
        a: {
          ru: 'Сократите пребывание на солнце в середине дня, пейте воду в течение всего дня, надевайте лёгкую светлую одежду и головной убор. Используйте солнцезащитный крем. При головокружении, тошноте или сильной слабости — перейдите в прохладное место и отдохните, при необходимости обратитесь к врачу.',
          en: 'Limit time outdoors during midday, drink water throughout the day, wear light-colored clothing and a hat. Use sunscreen. If you feel dizzy, nauseous, or very weak, move to a cool place to rest and see a doctor if needed.',
          th: 'ควรหลีกเลี่ยงการออกกลางแดดในช่วงเที่ยงถึงบ่าย ดื่มน้ำให้เพียงพอตลอดทั้งวัน สวมเสื้อผ้าบางสีอ่อนและหมวก ใช้ครีมกันแดด หากมีอาการเวียนศีรษะ คลื่นไส้ หรืออ่อนเพลียมาก ให้เข้าไปพักในที่เย็นและปรึกษาแพทย์หากจำเป็น',
        },
      },
    ],
  },

  // ─────────────────────────────────────────── 7. Безопасность
  {
    id: 'safety',
    icon: ShieldAlert,
    title: {
      ru: 'Безопасность',
      en: 'Safety',
      th: 'ความปลอดภัย',
    },
    items: [
      {
        id: '7.1',
        q: {
          ru: 'Какие экстренные номера нужно знать на Пхукете?',
          en: 'Which emergency numbers should I know in Phuket?',
          th: 'ควรรู้หมายเลขฉุกเฉินใดบ้างที่ภูเก็ต?',
        },
        a: {
          ru: 'Основные номера:\n– 1669 — скорая помощь;\n– 191 — полиция;\n– 199 — пожарная служба;\n– 1155 — туристическая полиция (английский язык).\nСохраните их в телефоне и сообщайте оператору, что вы находитесь на Пхукете.',
          en: 'Key numbers:\n– 1669 – ambulance;\n– 191 – police;\n– 199 – fire service;\n– 1155 – tourist police (English).\nSave them in your phone and tell the operator you are in Phuket.',
          th: 'หมายเลขสำคัญ:\n– 1669 – รถพยาบาล\n– 191 – ตำรวจ\n– 199 – ดับเพลิง\n– 1155 – ตำรวจท่องเที่ยว (มีบริการภาษาอังกฤษ)\nควรบันทึกหมายเลขเหล่านี้ในโทรศัพท์ และแจ้งให้เจ้าหน้าที่ทราบว่าคุณอยู่ที่ภูเก็ต',
        },
      },
      {
        id: '7.2',
        q: {
          ru: 'Что делать, если у меня украли или я потерял кошелёк, телефон или другие вещи?',
          en: 'What should I do if my wallet, phone, or other belongings are stolen or lost?',
          th: 'หากกระเป๋าสตางค์ โทรศัพท์ หรือของใช้สำคัญหาย/ถูกขโมยควรทำอย่างไร?',
        },
        a: {
          ru: 'Попробуйте вспомнить, где вы были в последний раз с этой вещью, сообщите в отель или администрацию места, где могли потерять. Заблокируйте банковские карты через банк. Затем обратитесь в полицию и оформите заявление — справка может понадобиться для страховой компании или консульства. При необходимости обратитесь в поддержку myUNO за подсказками на русском и английском.',
          en: 'Try to remember where you last had the item and inform the hotel or venue. Block your bank cards via your bank. Then go to the police to file a report – you may need this document for insurance or your consulate. If needed, contact myUNO support for guidance in Russian and English.',
          th: 'พยายามนึกถึงสถานที่สุดท้ายที่คุณใช้หรือถือของชิ้นนั้น แจ้งโรงแรมหรือสถานที่ที่คาดว่าอาจทำหาย ให้รีบอายัดบัตรธนาคารผ่านธนาคารของคุณ จากนั้นไปแจ้งความที่สถานีตำรวจและขอเอกสารรับแจ้ง ซึ่งอาจจำเป็นสำหรับการเคลมประกันหรือยื่นต่อสถานทูต หากต้องการคำแนะนำเพิ่มเติมสามารถติดต่อฝ่ายช่วยเหลือของ myUNO ได้',
        },
      },
      {
        id: '7.3',
        q: {
          ru: 'Что делать, если я оказался в небезопасной ситуации или конфликте?',
          en: 'What should I do if I find myself in an unsafe situation or conflict?',
          th: 'หากพบสถานการณ์ไม่ปลอดภัยหรือมีปัญหาทะเลาะวิวาทควรทำอย่างไร?',
        },
        a: {
          ru: 'Старайтесь не вступать в спор и быстро, но спокойно покинуть место конфликта. Не используйте физическую силу, если нет непосредственной угрозы жизни. При необходимости обратитесь за помощью к персоналу заведения, охране или позвоните в полицию по номеру 191.',
          en: 'Avoid arguments and leave the area calmly but quickly. Do not use physical force unless there is an immediate threat to life. Ask staff or security for help, or call the police at 191 if necessary.',
          th: 'พยายามหลีกเลี่ยงการโต้เถียงและออกจากพื้นที่นั้นอย่างสงบแต่รวดเร็ว หลีกเลี่ยงการใช้ความรุนแรง เว้นแต่มีภัยคุกคามต่อชีวิตโดยตรง ขอความช่วยเหลือจากพนักงานหรือ รปภ. ในพื้นที่ หรือโทรแจ้งตำรวจที่ 191 หากจำเป็น',
        },
      },
      {
        id: '7.4',
        q: {
          ru: 'Что делать, чтобы безопасно передвигаться по Пхукету ночью?',
          en: 'What should I do to move around Phuket safely at night?',
          th: 'ควรทำอย่างไรเพื่อเดินทางในภูเก็ตตอนกลางคืนอย่างปลอดภัย?',
        },
        a: {
          ru: 'Выбирайте освещённые и людные улицы, не оставляйте ценности на виду, пользуйтесь официальными такси или приложениями для вызова машины. Избегайте конфликтов с нетрезвыми людьми. Храните копию паспорта отдельно от оригинала.',
          en: 'Use well-lit and busy streets, keep valuables out of sight, and use official taxis or ride-hailing apps. Avoid arguments with intoxicated people. Keep a copy of your passport separately from the original.',
          th: 'เลือกเดินหรือเดินทางบนถนนที่มีไฟสว่างและมีผู้คน ไม่ควรโชว์ของมีค่า ใช้บริการแท็กซี่ที่เชื่อถือได้หรือแอปเรียกรถ หลีกเลี่ยงการมีปากเสียงกับผู้ที่มึนเมา และเก็บสำเนาหนังสือเดินทางแยกจากเล่มจริง',
        },
      },
      {
        id: '7.5',
        q: {
          ru: 'Что делать, если мне предлагают что-то подозрительное (сомнительные туры, вложения, «лёгкий заработок»)?',
          en: 'What should I do if someone offers me something suspicious (shady tours, investments, “easy money”)?',
          th: 'หากมีคนนำเสนอสิ่งที่ดูน่าสงสัย (ทัวร์ราคาถูกเกินจริง การลงทุนแปลก ๆ หรือ “งานได้เงินง่าย”) ควรทำอย่างไร?',
        },
        a: {
          ru: 'Не переводите деньги и не передавайте документы незнакомым людям. Проверяйте компании через отзывы в myUNO и официальные сайты. Если вы почувствовали себя обманутым, соберите максимум доказательств (скриншоты, переписка, чеки) и обратитесь в полицию или к юристам через myUNO.',
          en: 'Do not send money or give documents to strangers. Check companies via reviews in myUNO and official websites. If you feel you were scammed, collect all evidence (screenshots, messages, receipts) and contact the police or a lawyer via myUNO.',
          th: 'อย่าโอนเงินหรือส่งเอกสารสำคัญให้คนแปลกหน้า ควรตรวจสอบบริษัทผ่านรีวิวในแอป myUNO และเว็บไซต์ทางการ หากสงสัยว่าถูกหลอก ให้รวบรวมหลักฐานทั้งหมด เช่น ภาพหน้าจอ ข้อความสนทนา ใบเสร็จ แล้วติดต่อแจ้งตำรวจหรือขอคำปรึกษาทางกฎหมายผ่าน myUNO',
        },
      },
    ],
  },

  // ─────────────────────────────────────────── 8. Жильё
  {
    id: 'housing',
    icon: Home,
    title: {
      ru: 'Жильё',
      en: 'Housing',
      th: 'ที่พักอาศัย',
    },
    items: [
      {
        id: '8.1',
        q: {
          ru: 'Что делать, если в квартире проблемы (нет воды, света, поломка техники)?',
          en: 'What should I do if there are problems in my rented apartment (no water, no electricity, broken equipment)?',
          th: 'หากที่พักเช่ามีปัญหา (น้ำไม่ไหล ไฟดับ เครื่องใช้ไฟฟ้าเสีย) ควรทำอย่างไร?',
        },
        a: {
          ru: 'Сразу сообщите арендодателю или управляющей компании (контакты обычно указаны в договоре или в объявлении). Опишите проблему, приложите фото/видео. Храните переписку. При долгой задержке с решением вопроса можно попросить юридическую консультацию через myUNO.',
          en: 'Inform your landlord or property manager immediately (their contacts are usually in your contract or listing). Describe the problem and attach photos/videos. Keep a record of all communication. If the issue is not solved for a long time, you can request legal advice via myUNO.',
          th: 'ให้รีบแจ้งเจ้าของบ้านหรือบริษัทบริหารทรัพย์สินทันที (ช่องทางติดต่อมักระบุไว้ในสัญญาหรือประกาศเช่า) อธิบายปัญหา พร้อมแนบรูปหรือวิดีโอ เก็บหลักฐานการสนทนาไว้ หากปัญหาถูกปล่อยทิ้งไว้นานโดยไม่ได้รับการแก้ไข สามารถขอคำปรึกษาทางกฎหมายผ่าน myUNO ได้',
        },
      },
      {
        id: '8.2',
        q: {
          ru: 'Что делать, если соседи сильно шумят и мешают отдыхать?',
          en: 'What should I do if neighbors are too noisy and disturb my rest?',
          th: 'หากเพื่อนบ้านส่งเสียงดังรบกวนการพักผ่อนควรทำอย่างไร?',
        },
        a: {
          ru: 'Сначала попробуйте мирно поговорить с соседями или сообщить на ресепшн/управляющему. Если это не помогает и шум систематический ночью, узнайте правила комплекса и предусмотренные штрафы. В крайних случаях можно вызвать полицию, особенно если присутствует агрессия или нарушение общественного порядка.',
          en: 'First, try to talk to them politely or inform the reception/management. If it continues and the noise is regular at night, check the building rules and possible fines. In extreme cases, you can call the police, particularly if there is aggression or public disturbance.',
          th: 'ลองพูดคุยกับเพื่อนบ้านด้วยความสุภาพ หรือแจ้งพนักงานต้อนรับ/ผู้จัดการอาคารก่อน หากปัญหายังไม่หายและมีเสียงดังรบกวนเป็นประจำในเวลากลางคืน ให้ตรวจสอบกฎระเบียบของอาคารและบทลงโทษที่มี ในกรณีร้ายแรง โดยเฉพาะหากมีความก้าวร้าวหรือสร้างความวุ่นวายในที่สาธารณะ สามารถแจ้งตำรวจได้',
        },
      },
      {
        id: '8.3',
        q: {
          ru: 'Что делать, если арендодатель не возвращает депозит?',
          en: 'What should I do if the landlord refuses to return my deposit?',
          th: 'หากเจ้าของที่พักไม่คืนเงินมัดจำควรทำอย่างไร?',
        },
        a: {
          ru: 'Попросите письменное объяснение причин удержания депозита и список повреждений с фото. Сравните это с состоянием жилья на момент въезда (фото, акт приёма-передачи). Если вы не согласны, попробуйте договориться мирно. При отказе можно обратиться за юридической помощью через myUNO и, при необходимости, в полицию или суд.',
          en: 'Ask for a written explanation, reasons, and a list of damages with photos. Compare it with the condition of the property when you moved in (photos, check-in report). If you disagree, try to negotiate a compromise. If that fails, seek legal assistance via myUNO and, if necessary, contact the police or court.',
          th: 'ให้ขอคำอธิบายเป็นลายลักษณ์อักษร พร้อมเหตุผลและรายการความเสียหายที่อ้างถึงแนบรูปถ่าย นำไปเปรียบเทียบกับสภาพห้องตอนที่คุณย้ายเข้า (รูปถ่ายหรือเอกสารตรวจรับ) หากคุณไม่เห็นด้วย ให้ลองเจรจาหาข้อตกลงก่อน หากตกลงกันไม่ได้ สามารถขอคำปรึกษาทางกฎหมายผ่าน myUNO และหากจำเป็นอาจต้องแจ้งตำรวจหรือดำเนินคดีตามกฎหมาย',
        },
      },
    ],
  },

  // ─────────────────────────────────────────── 9. Важное
  {
    id: 'essentials',
    icon: Info,
    title: {
      ru: 'Важное',
      en: 'Essentials',
      th: 'เรื่องสำคัญ',
    },
    items: [
      {
        id: '9.1',
        q: {
          ru: 'Что делать, если я не понимаю, как решить ситуацию, и мне нужна помощь?',
          en: 'What should I do if I don’t understand how to solve my situation and need help?',
          th: 'หากไม่รู้ว่าควรจัดการปัญหาของตนเองอย่างไรและต้องการความช่วยเหลือควรทำอย่างไร?',
        },
        a: {
          ru: 'Откройте приложение myUNO и напишите в службу поддержки, выбрав удобный язык (русский/английский/тайский). Кратко опишите проблему и приложите фото или документы. Команда подскажет, к каким службам обратиться и какие шаги предпринять.',
          en: 'Open the myUNO app and contact support, choosing your preferred language (Russian/English/Thai). Briefly describe the problem and attach photos or documents. Our team will advise which services to contact and what steps to take.',
          th: 'ให้เปิดแอป myUNO แล้วติดต่อฝ่ายช่วยเหลือ โดยเลือกภาษาที่คุณสะดวก (รัสเซีย/อังกฤษ/ไทย) อธิบายปัญหาโดยสั้น ๆ และแนบรูปหรือเอกสารที่เกี่ยวข้อง ทีมงานจะช่วยแนะนำว่าควรติดต่อหน่วยงานใดและควรดำเนินการขั้นตอนใดต่อไป',
        },
      },
      {
        id: '9.2',
        q: {
          ru: 'Что делать, если карта не проходит в магазине или банкомате?',
          en: 'What should I do if my card is declined at a shop or ATM?',
          th: 'หากบัตรเครดิต/เดบิตไม่สามารถใช้ได้ที่ร้านค้าหรือเอทีเอ็มควรทำอย่างไร?',
        },
        a: {
          ru: 'Попробуйте другой банкомат/терминал или другой банк. Если проблема повторяется, свяжитесь со своим банком (часто номер указан на карте) через мобильное приложение или по телефону. На всякий случай всегда имейте небольшую сумму наличных. В myUNO можно найти ближайшие банки и обменные пункты.',
          en: 'Try another ATM/terminal or a different bank. If the problem persists, contact your bank (the number is usually on the card) via mobile app or phone. Always keep some cash as a backup. In myUNO you can find nearby banks and currency exchange offices.',
          th: 'ลองใช้เอทีเอ็มหรือเครื่องรูดบัตรของธนาคารอื่นก่อน หากปัญหายังคงอยู่ ให้ติดต่อธนาคารผู้ออกบัตรของคุณ (เบอร์โทรมักจะระบุหลังบัตร) ผ่านแอปมือถือหรือทางโทรศัพท์ ควรพกเงินสดจำนวนหนึ่งสำรองไว้เสมอ ในแอป myUNO คุณสามารถค้นหาธนาคารและร้านแลกเงินใกล้ตัวได้',
        },
      },
      {
        id: '9.3',
        q: {
          ru: 'Что делать, если у меня проблемы с интернетом или мобильной связью?',
          en: 'What should I do if I have problems with internet or mobile signal?',
          th: 'หากมีปัญหาเรื่องอินเทอร์เน็ตหรือสัญญาณมือถือควรทำอย่างไร?',
        },
        a: {
          ru: 'Проверьте баланс и пакет трафика у вашего оператора (через приложение или USSD-команду). Попробуйте перезагрузить телефон. Если проблема сохраняется, зайдите в ближайший офис оператора или магазин, где вы покупали SIM-карту. В myUNO можно посмотреть карту точек продаж и офисов операторов.',
          en: 'Check your balance and data package with your operator (via app or USSD code). Try restarting your phone. If the issue remains, go to the nearest operator office or the shop where you bought the SIM card. myUNO shows a map of operator offices and SIM shops.',
          th: 'ตรวจสอบยอดเงินและแพ็กเกจอินเทอร์เน็ตจากผู้ให้บริการของคุณ (ผ่านแอปหรือรหัส USSD) ลองปิด–เปิดเครื่องใหม่ หากยังมีปัญหาให้ไปที่ศูนย์บริการหรือร้านค้าที่คุณซื้อซิมการ์ดมา ในแอป myUNO มีแผนที่แสดงจุดบริการและร้านขายซิมของผู้ให้บริการต่าง ๆ',
        },
      },
      {
        id: '9.4',
        q: {
          ru: 'Что делать, если мне срочно нужно связаться с консульством моей страны?',
          en: 'What should I do if I urgently need to contact my country’s consulate?',
          th: 'หากจำเป็นต้องติดต่อสถานทูต/กงสุลของประเทศตนเองอย่างเร่งด่วนควรทำอย่างไร?',
        },
        a: {
          ru: 'Откройте myUNO и найдите раздел с контактами посольств и консульств. Позвоните по экстренному номеру консульства или напишите на официальный e-mail, кратко опишите ситуацию и укажите, что вы на Пхукете. При серьёзных происшествиях (тяжёлые травмы, арест, серьёзные проблемы с документами) обращайтесь незамедлительно.',
          en: 'Open myUNO and go to the section with embassy and consulate contacts. Call the consulate’s emergency number or write to the official email, briefly describe your situation, and mention that you are in Phuket. In serious cases (severe injuries, arrest, major document issues), contact them immediately.',
          th: 'ให้เปิดแอป myUNO ไปยังส่วนที่มีข้อมูลการติดต่อของสถานทูตและสถานกงสุล โทรไปยังหมายเลขฉุกเฉินของกงสุลหรือส่งอีเมลไปยังอีเมลทางการ อธิบายสถานการณ์โดยย่อและแจ้งว่าคุณอยู่ที่ภูเก็ต หากเป็นกรณีร้ายแรง เช่น บาดเจ็บหนัก ถูกจับกุม หรือมีปัญหาเอกสารรุนแรง ควรติดต่อทันที',
        },
      },
    ],
  },
];
