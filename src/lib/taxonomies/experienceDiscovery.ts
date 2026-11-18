/** Browse taxonomy, not supply or availability. Existing listing/category IDs stay canonical. */
export const EXPERIENCE_DISCOVERY_GROUPS = [
  { id: 'parks', ru: 'Парки и развлечения', en: 'Parks & attractions', th: 'สวนสนุกและสถานที่ท่องเที่ยว', icon: '🎡', categories: ['waterpark', 'theme-park', 'attraction', 'aquarium', 'playground', 'escape-room', 'indoor-games'] },
  { id: 'active', ru: 'Активный отдых', en: 'Adventure & sport', th: 'ผจญภัยและกีฬา', icon: '🧗', categories: ['adventure', 'extreme', 'zipline', 'karting', 'laser-tag', 'paintball', 'shooting', 'golf', 'martial-arts', 'fishing', 'atv'] },
  { id: 'sea', ru: 'Море и острова', en: 'Sea & islands', th: 'ทะเลและเกาะ', icon: '🏝️', categories: ['islands', 'island-hopping', 'water-sports', 'snorkeling', 'diving', 'jet-ski', 'kayak', 'kayaking', 'sea_canoe', 'surfing', 'wakeboarding', 'parasailing', 'sailing', 'sunset-cruise', 'private-charter'] },
  { id: 'nature', ru: 'Природа и животные', en: 'Nature & wildlife', th: 'ธรรมชาติและสัตว์', icon: '🌿', categories: ['nature', 'wildlife', 'eco-park', 'hiking', 'elephant-sanctuary'] },
  { id: 'culture', ru: 'Экскурсии, культура и шоу', en: 'Sightseeing, culture & shows', th: 'ท่องเที่ยว วัฒนธรรมและการแสดง', icon: '🏛️', categories: ['culture', 'cultural', 'city-tour', 'museum', 'temple', 'show'] },
  { id: 'food', ru: 'Еда и мастер-классы', en: 'Food & workshops', th: 'อาหารและเวิร์กช็อป', icon: '🍜', categories: ['food-tour', 'cooking_class', 'cooking-class', 'workshop', 'tasting'] },
  { id: 'wellness', ru: 'Отдых и забота о себе', en: 'Wellness & relaxation', th: 'สุขภาพและการผ่อนคลาย', icon: '🧘', categories: ['spa', 'massage', 'yoga', 'onsen', 'resort-pass'] },
  { id: 'events', ru: 'События и праздники', en: 'Events & celebrations', th: 'งานอีเวนต์และเทศกาล', icon: '🎉', categories: ['festival', 'concert', 'sport-event', 'seasonal-event'] },
] as const;
export type ExperienceGroupId = typeof EXPERIENCE_DISCOVERY_GROUPS[number]['id'];

/** Prospective topics are explicit navigation, never seeded fake experiences. */
export const DISCOVERY_TOPIC_LABELS: Record<string, { ru: string; en: string; th: string }> = {
 waterpark:{ru:'Аквапарки',en:'Water parks',th:'สวนน้ำ'}, 'theme-park':{ru:'Тематические парки',en:'Theme parks',th:'สวนสนุก'}, attraction:{ru:'Развлекательные центры',en:'Attractions',th:'สถานที่ท่องเที่ยว'}, aquarium:{ru:'Океанариумы',en:'Aquariums',th:'พิพิธภัณฑ์สัตว์น้ำ'}, playground:{ru:'Детские пространства',en:'Playgrounds',th:'สนามเด็กเล่น'}, 'escape-room':{ru:'Квесты',en:'Escape rooms',th:'ห้องปริศนา'}, 'indoor-games':{ru:'Игры под крышей',en:'Indoor games',th:'เกมในร่ม'},
 adventure:{ru:'Приключения',en:'Adventure',th:'ผจญภัย'}, extreme:{ru:'Экстремальные развлечения',en:'Extreme activities',th:'กิจกรรมเอ็กซ์ตรีม'}, zipline:{ru:'Зиплайны',en:'Ziplines',th:'ซิปไลน์'}, karting:{ru:'Картинг',en:'Go-karting',th:'โกคาร์ท'}, 'laser-tag':{ru:'Лазертаг',en:'Laser tag',th:'เลเซอร์แท็ก'}, paintball:{ru:'Пейнтбол',en:'Paintball',th:'เพนต์บอล'}, shooting:{ru:'Стрелковые тиры',en:'Shooting ranges',th:'สนามยิงปืน'}, golf:{ru:'Гольф',en:'Golf',th:'กอล์ฟ'}, 'martial-arts':{ru:'Боевые искусства',en:'Martial arts',th:'ศิลปะการต่อสู้'}, fishing:{ru:'Рыбалка',en:'Fishing',th:'ตกปลา'}, atv:{ru:'Квадроциклы',en:'ATV rides',th:'ขับรถเอทีวี'},
 islands:{ru:'Островные экскурсии',en:'Island trips',th:'เที่ยวเกาะ'}, 'water-sports':{ru:'Водный спорт',en:'Water sports',th:'กีฬาทางน้ำ'}, snorkeling:{ru:'Снорклинг',en:'Snorkeling',th:'ดำน้ำตื้น'}, diving:{ru:'Дайвинг',en:'Diving',th:'ดำน้ำลึก'}, 'jet-ski':{ru:'Гидроциклы',en:'Jet skis',th:'เจ็ตสกี'}, kayaking:{ru:'Каяки и каноэ',en:'Kayaks & canoes',th:'คายัคและแคนู'}, surfing:{ru:'Сёрфинг',en:'Surfing',th:'โต้คลื่น'}, wakeboarding:{ru:'Вейкбординг',en:'Wakeboarding',th:'เวคบอร์ด'}, parasailing:{ru:'Парасейлинг',en:'Parasailing',th:'พาราเซลลิ่ง'}, sailing:{ru:'Парусные прогулки',en:'Sailing',th:'เรือใบ'}, 'sunset-cruise':{ru:'Круизы на закате',en:'Sunset cruises',th:'ล่องเรือชมพระอาทิตย์ตก'}, 'private-charter':{ru:'Приватные прогулки',en:'Private charters',th:'เรือส่วนตัว'},
 nature:{ru:'Природные маршруты',en:'Nature trips',th:'เส้นทางธรรมชาติ'}, wildlife:{ru:'Знакомство с животными',en:'Wildlife encounters',th:'ชมสัตว์'}, 'eco-park':{ru:'Экопарки и фермы',en:'Eco parks & farms',th:'สวนธรรมชาติและฟาร์ม'}, hiking:{ru:'Пешие маршруты',en:'Hiking',th:'เดินป่า'}, 'elephant-sanctuary':{ru:'Заповедники слонов',en:'Elephant sanctuaries',th:'เขตรักษาพันธุ์ช้าง'},
 culture:{ru:'Культура и история',en:'Culture & history',th:'วัฒนธรรมและประวัติศาสตร์'}, 'city-tour':{ru:'Обзорные экскурсии',en:'Sightseeing tours',th:'ทัวร์ชมเมือง'}, museum:{ru:'Музеи',en:'Museums',th:'พิพิธภัณฑ์'}, temple:{ru:'Храмы',en:'Temples',th:'วัด'}, show:{ru:'Шоу и представления',en:'Shows',th:'การแสดง'},
 'food-tour':{ru:'Гастрономические прогулки',en:'Food tours',th:'ทัวร์อาหาร'}, cooking_class:{ru:'Кулинарные классы',en:'Cooking classes',th:'เรียนทำอาหาร'}, workshop:{ru:'Творческие мастер-классы',en:'Creative workshops',th:'เวิร์กช็อปสร้างสรรค์'}, tasting:{ru:'Дегустации',en:'Tastings',th:'ชิมอาหาร'},
 spa:{ru:'Спа',en:'Spa',th:'สปา'}, massage:{ru:'Массаж',en:'Massage',th:'นวด'}, yoga:{ru:'Йога и медитация',en:'Yoga & meditation',th:'โยคะและสมาธิ'}, onsen:{ru:'Онсэны',en:'Onsen',th:'ออนเซ็น'}, 'resort-pass':{ru:'День в отеле',en:'Resort day passes',th:'เดย์พาสรีสอร์ต'},
 festival:{ru:'Фестивали',en:'Festivals',th:'เทศกาล'}, concert:{ru:'Концерты',en:'Concerts',th:'คอนเสิร์ต'}, 'sport-event':{ru:'Спортивные события',en:'Sports events',th:'งานกีฬา'}, 'seasonal-event':{ru:'Сезонные события',en:'Seasonal events',th:'กิจกรรมตามฤดูกาล'},
};
const aliases: Record<string, string> = {'island-hopping':'islands', cultural:'culture', kayak:'kayaking', sea_canoe:'kayaking', 'cooking-class':'cooking_class', shows:'show'};
export const discoveryTopic = (slug: string) => aliases[slug] || slug;
export function experienceGroup(category: string | null | undefined): ExperienceGroupId | undefined {
 return EXPERIENCE_DISCOVERY_GROUPS.find(group => (group.categories as readonly string[]).includes(discoveryTopic(category || '')))?.id;
}
export function isClosedExperience(status: string | null | undefined) {
 return ['temporarily_closed', 'permanently_closed', 'closed'].includes(status?.trim().toLowerCase() || '');
}
export function isFixedVenue(item: { location_type?: string | null; catalog_kind?: string | null }) {
 return item.location_type === 'fixed_venue' && item.catalog_kind === 'venue';
}

/** Public topic labels keep editable RU/EN names; Thai uses reviewed translations when available. */
export function experienceCategoryLabel(category: { slug: string; name_ru: string; name_en: string }, language: string): string {
 if (language === 'ru') return category.name_ru || category.name_en;
 if (language === 'th') return DISCOVERY_TOPIC_LABELS[discoveryTopic(category.slug)]?.th || category.name_en || category.name_ru;
 return category.name_en || category.name_ru;
}
/** Inventory is admitted published offers, not the prospective registry or place type guesses. */
export function populatedExperienceCategories<T extends { slug: string }>(categories: T[], offers: { category: string | null }[]): T[] {
 const populated = new Set(offers.map(offer => offer.category));
 return categories.filter(category => populated.has(category.slug));
}
