/**
 * "What to do if…" survival tips shown on the /sos hub.
 *
 * This is emergency *content* (not contacts) and is consumed only by
 * src/pages/SOS.tsx. Kept here so SOS.tsx stays a thin view layer. Bilingual.
 * `icon` values are emoji strings resolved via `resolveIcon` (src/lib/iconMap.ts).
 */

export interface EmergencyTip {
  en: string;
  ru: string;
}

export interface EmergencyTipCategory {
  id: string;
  title: string;
  titleRu: string;
  /** Emoji string, resolved to a Lucide icon by resolveIcon(). */
  icon: string;
  tips: EmergencyTip[];
}

export const EMERGENCY_TIP_CATEGORIES: EmergencyTipCategory[] = [
  {
    id: 'medical',
    title: 'Medical',
    titleRu: 'Медицина',
    icon: '🏥',
    tips: [
      { en: 'Snake bite → Call 1669, do NOT suck venom, keep limb below heart level', ru: 'Укус змеи → Звоните 1669, НЕ отсасывайте яд, держите конечность ниже сердца' },
      { en: 'Jellyfish → Rinse with vinegar (NOT fresh water), scrape tentacles with card', ru: 'Медуза → Промойте уксусом (НЕ пресной водой), соскребите щупальца картой' },
      { en: 'Sunstroke → Shade + wet towels on neck/armpits + sips of water → 1669 if unconscious', ru: 'Солнечный удар → Тень + мокрые полотенца на шею/подмышки + вода → 1669 при потере сознания' },
      { en: 'Food poisoning → ORS/coconut water + activated charcoal → hospital if blood in stool', ru: 'Отравление → Раствор ОРС/кокос + уголь → больница если кровь в стуле' },
      { en: 'Allergic reaction → Antihistamine now, EpiPen if have → 1669 if throat swelling', ru: 'Аллергия → Антигистамин сейчас, EpiPen если есть → 1669 при отёке горла' },
      { en: 'Dengue signs: fever + rash + joint pain → hospital immediately, drink fluids', ru: 'Признаки денге: температура + сыпь + боль в суставах → в больницу, пить жидкость' },
      { en: 'Burns → 10+ min under cool (not ice) water → cling film → hospital for large burns', ru: 'Ожоги → 10+ мин под прохладной водой → пищевая плёнка → больница при больших ожогах' },
    ],
  },
  {
    id: 'water',
    title: 'Beach & Sea',
    titleRu: 'Пляж и море',
    icon: '🌊',
    tips: [
      { en: 'Rip current → Do NOT fight it! Swim PARALLEL to shore until free, then to beach', ru: 'Отбойное течение → НЕ боритесь! Плывите ПАРАЛЛЕЛЬНО берегу, затем к пляжу' },
      { en: 'Red flags = NO SWIMMING. Fines + real danger. Lifeguards enforce strictly.', ru: 'Красные флаги = КУПАТЬСЯ НЕЛЬЗЯ. Штрафы + реальная опасность.' },
      { en: 'Sea urchin spines → Soak in hot water 30min, tweezers for shallow ones, doctor for deep', ru: 'Иглы ежа → Замочите в горячей воде 30мин, пинцет для мелких, врач для глубоких' },
      { en: 'Coral cuts → Wash with fresh water + soap, antiseptic, watch for infection 3 days', ru: 'Порезы о кораллы → Промыть пресной водой + мыло, антисептик, следить 3 дня' },
      { en: 'Diving: no flying 24h after! DAN emergency: +66-2-256-7939', ru: 'Дайвинг: не летать 24ч после! DAN экстренный: +66-2-256-7939' },
    ],
  },
  {
    id: 'traffic',
    title: 'Road & Transport',
    titleRu: 'Дорога',
    icon: '🛵',
    tips: [
      { en: 'Accident → Photos of everything FIRST (damage, plates, scene) → then call 1155', ru: 'ДТП → СНАЧАЛА фото всего (повреждения, номера, место) → потом звоните 1155' },
      { en: 'No helmet = hospital may refuse treatment + insurance void. Always wear!', ru: 'Без шлема = больница может отказать + страховка недействительна. Всегда носите!' },
      { en: 'Out of fuel → 7-Eleven sells bottles (40-50 THB), or Grab delivery', ru: 'Кончился бензин → 7-Eleven продаёт бутылки (40-50 бат), или доставка Grab' },
      { en: 'Flat tire/breakdown → Hazards on, move off road, use Road Assistance in this app', ru: 'Прокол/поломка → Аварийка, съехать с дороги, Помощь на дороге в приложении' },
      { en: 'Traffic fine → Pay ONLY at police station with receipt. Never to officer directly.', ru: 'Штраф → Платите ТОЛЬКО в участке с квитанцией. Никогда напрямую офицеру.' },
    ],
  },
  {
    id: 'documents',
    title: 'Documents',
    titleRu: 'Документы',
    icon: '📄',
    tips: [
      { en: 'Lost passport → 1) Police report at Tourist Police 1155, 2) Embassy for temp passport', ru: 'Потеря паспорта → 1) Заявление в турполицию 1155, 2) Посольство за временным' },
      { en: 'Theft → Police report needed for insurance. Tourist Police speaks English: 1155', ru: 'Кража → Нужен полицейский отчёт для страховки. Турполиция на английском: 1155' },
      { en: 'Visa overstay → Immigration ASAP. Fine: 500 THB/day, max 20,000. Overstay 90+ days = ban', ru: 'Просрочка визы → В иммиграцию СРОЧНО. Штраф: 500 бат/день, макс 20,000. 90+ дней = бан' },
      { en: 'Keep passport COPY on phone + cloud. Never give original to tuk-tuk/jet-ski rentals', ru: 'Держите КОПИЮ паспорта в телефоне + облаке. Никогда не давайте оригинал прокату' },
    ],
  },
  {
    id: 'wildlife',
    title: 'Animals',
    titleRu: 'Животные',
    icon: '🐒',
    tips: [
      { en: 'Dog/cat bite → Wash 15min with soap → Rabies shots WITHIN 24H. Not optional!', ru: 'Укус собаки/кошки → Мыть 15мин с мылом → Прививки от бешенства ЧЕРЕЗ 24Ч. Обязательно!' },
      { en: 'Monkeys → No eye contact, no food showing, bag closed. If bitten = rabies shots', ru: 'Обезьяны → Без зрительного контакта, еда спрятана, сумка закрыта. Укус = прививки' },
      { en: 'Stray dogs → Freeze, no eye contact, back away slowly. Never run.', ru: 'Бродячие собаки → Замрите, без зрительного контакта, медленно отступайте. Не бегите.' },
      { en: 'Centipede (very painful!) → Ice + painkiller + antihistamine → hospital if severe', ru: 'Сороконожка (очень больно!) → Лёд + обезболивающее + антигистамин → больница при сильной' },
    ],
  },
  {
    id: 'weather',
    title: 'Weather',
    titleRu: 'Погода',
    icon: '⛈️',
    tips: [
      { en: 'Tsunami sign → Sea suddenly pulls FAR back = RUN to high ground/upper floors NOW', ru: 'Знак цунами → Море внезапно отступило ДАЛЕКО = БЕГИТЕ на возвышенность СЕЙЧАС' },
      { en: 'Monsoon floods → Never cross flooded roads. 30cm water can sweep a car.', ru: 'Муссонные наводнения → Никогда не переезжайте затопленные дороги. 30см сносят машину.' },
      { en: 'Thunderstorm → Exit water immediately, avoid trees/metal, crouch if caught in open', ru: 'Гроза → Выйти из воды немедленно, избегать деревьев/металла, присесть на открытом месте' },
    ],
  },
  {
    id: 'security',
    title: 'Safety & Scams',
    titleRu: 'Безопасность',
    icon: '🔒',
    tips: [
      { en: 'Jet-ski scam → Video ALL scratches before rent. Use phone timestamp.', ru: 'Обман с гидроциклами → Снимите ВСЕ царапины до аренды. Используйте метку времени.' },
      { en: 'Drink spiking → Never leave drink, watch it being made, buy your own', ru: 'Подсыпание в напиток → Не оставляйте напиток, следите за приготовлением, покупайте сами' },
      { en: 'ATM → Use bank ATMs inside. Cover PIN. 200 THB fee is normal, more = scam', ru: 'Банкомат → Используйте в банках. Прикрывайте PIN. 200 бат комиссия нормально, больше = обман' },
      { en: 'Fake police → Real police have ID card + badge number. Ask to see. Call 1155 if unsure.', ru: 'Фальшивая полиция → У настоящих есть удостоверение + номер значка. Попросите. Звоните 1155.' },
      { en: 'Share location with someone when going to remote areas or on tours', ru: 'Делитесь локацией когда едете в отдалённые места или на экскурсии' },
    ],
  },
  {
    id: 'accommodation',
    title: 'Accommodation',
    titleRu: 'Жильё',
    icon: '🏠',
    tips: [
      { en: 'Locked out → Reception first, or Locksmith service in this app (24/7)', ru: 'Заперлись → Сначала ресепшн, или Слесарь в приложении (24/7)' },
      { en: 'Power out → Check breaker box first. If building-wide, wait 10-30min usually', ru: 'Нет света → Проверьте автоматы. Если во всём доме, обычно ждать 10-30мин' },
      { en: 'Fire → Do NOT use elevator. Wet towel over mouth. Fire stairs only.', ru: 'Пожар → НЕ используйте лифт. Мокрое полотенце на рот. Только пожарная лестница.' },
    ],
  },
  {
    id: 'general',
    title: 'Pro Tips',
    titleRu: 'Важное',
    icon: '💡',
    tips: [
      { en: 'Save this page offline NOW — works without internet', ru: 'Сохраните эту страницу офлайн СЕЙЧАС — работает без интернета' },
      { en: 'Travel insurance = MUST. Hospital bill can be 50,000-500,000 THB easily', ru: 'Страховка = ОБЯЗАТЕЛЬНО. Счёт больницы легко 50,000-500,000 бат' },
      { en: 'Keep 2000+ THB cash always — not all accept cards, ATMs may be far', ru: 'Всегда 2000+ бат наличными — не везде карты, банкоматы могут быть далеко' },
      { en: 'Hotel address in Thai on phone — show taxi driver, they often cannot read English', ru: 'Адрес отеля на тайском в телефоне — показать таксисту, часто не читают английский' },
    ],
  },
];
