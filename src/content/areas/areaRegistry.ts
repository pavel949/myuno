import { PHUKET_AREAS } from '@/lib/config/phuketAreas';
import { districtFilterAliases, getDistrictById, normalizeDistrictId, type DistrictId } from '@/lib/propertyTaxonomy';

/** Editorial extension of existing district keys and /area routes, never locations.id.
 * Relationships describe places, not query expansion, polygons or inventory ownership.
 */
export interface AreaGuide {
  key: DistrictId;
  slug: string;
  aliases: string[];
  kind: 'coastal-area' | 'resort-community';
  relationship?: { type: 'within' | 'includes'; key: DistrictId; source: string };
  content: { ru: GuideCopy; en: GuideCopy; th: null };
  sources: { url: string; checkedAt: string }[];
  media: { file: string; author: string; license: '3.0' | '4.0'; capturedAt: string; src: string; alt: string };
}
interface GuideCopy { intro: string; fit: string; tradeoffs: string; beach: string; daily: string; places: string }
const lagunaSource = 'https://www.angsana.com/thailand/laguna-phuket';
const canalSource = 'https://www.lagunaphuket.com/experience/canal-village-laguna-phuket/';
const tatSource = 'https://www.tourismthailand.org/Destinations/Provinces/Phuket/350';
const checkedAt = '2026-10-25';
const seed = [
  {
    key: 'laguna', kind: 'resort-community', relationship: { type: 'within', key: 'bang-tao', source: lagunaSource },
    content: {
      en: { intro: 'A resort community around lagoons beside Bang Tao beach. A distinct part of the wider Bang Tao area.', fit: 'Consider it if you want a resort setting with golf and dining options.', tradeoffs: 'Check access and charges for each hotel facility separately. A home in Laguna does not automatically include resort privileges or a walkable beach route.', beach: 'Bang Tao is the coastal reference; check the actual route from your building.', daily: 'Canal Village lists a minimart, pharmacy, laundry and cafés. Confirm current opening hours directly.', places: 'Canal Village and Laguna Golf are useful landmarks.' },
      ru: { intro: 'Курортная локация вокруг лагун у пляжа Банг Тао. Отдельная часть более широкой прибрежной зоны Банг Тао.', fit: 'Подойдёт тем, кто ищет курортную среду, гольф и рестораны.', tradeoffs: 'Уточняйте доступ и оплату инфраструктуры каждого отеля. Жильё в Лагуне само по себе не даёт курортных привилегий или пешего выхода к пляжу.', beach: 'Ориентир — пляж Банг Тао; маршрут нужно проверять от конкретного дома.', daily: 'Canal Village указывает минимаркет, аптеку, прачечную и кафе. Актуальные часы работы уточняйте напрямую.', places: 'Ориентиры для знакомства — Canal Village и Laguna Golf.' }, th: null,
    }, sources: [lagunaSource, canalSource, 'https://www.lagunaphuket.com/'],
    media: { file: 'Angsana_Laguna_Phuket.jpg', author: 'Banyantree2014', license: '4.0', capturedAt: '2013-07-09', src: 'a/a9/Angsana_Laguna_Phuket.jpg', alt: 'Angsana Laguna Phuket: resort and lagoons' },
  },
  {
    key: 'bang-tao', kind: 'coastal-area', relationship: { type: 'includes', key: 'laguna', source: lagunaSource },
    content: {
      en: { intro: 'A coastal area on Phuket’s west coast. Laguna sits beside the same beach, but remains a separate catalog location.', fit: 'Consider it for a beach-oriented stay with a choice of resort and residential settings.', tradeoffs: 'Check the home’s exact address and beach access. Two homes labelled Bang Tao can have very different surroundings.', beach: 'Bang Tao beach is the main coastal landmark. Follow lifeguard advice and red flags.', daily: 'Canal Village in Laguna offers shops and everyday services; check the route from your chosen home.', places: 'Explore the beach and Canal Village; hotel facilities may have separate access conditions.' },
      ru: { intro: 'Прибрежная локация на западном побережье Пхукета. Лагуна расположена у того же пляжа, но остаётся отдельной локацией каталога.', fit: 'Подойдёт для жизни у моря с выбором курортной или жилой среды.', tradeoffs: 'Проверяйте точный адрес и выход к морю: окружение двух домов с пометкой «Банг Тао» может сильно отличаться.', beach: 'Главный прибрежный ориентир — пляж Банг Тао. Следуйте указаниям спасателей и красным флагам.', daily: 'В Canal Village в Лагуне есть магазины и бытовые услуги; проверяйте маршрут от выбранного дома.', places: 'Пляж и Canal Village помогут познакомиться с локацией. У отельной инфраструктуры могут быть отдельные условия доступа.' }, th: null,
    }, sources: [lagunaSource, canalSource, tatSource],
    media: { file: 'Sunset_at_Bang_Tao_beach_-_02.jpg', author: 'Anton Zelenov', license: '4.0', capturedAt: '2017-10-21', src: '2/2c/Sunset_at_Bang_Tao_beach_-_02.jpg', alt: 'Sunset at Bang Tao beach at low tide' },
  },
  {
    key: 'nai-yang', kind: 'coastal-area',
    content: {
      en: { intro: 'A beach location in northern Phuket. Use the exact property address to judge its surroundings and access to the coast.', fit: 'Consider it if the beach is central to your stay and you are comfortable checking daily routes before choosing a home.', tradeoffs: 'It may not suit a stay built around Phuket Town or other west-coast destinations. Check transport options and local conditions for your dates.', beach: 'Nai Yang is a recognised Phuket beach. Sea conditions vary; red flags mean no swimming.', daily: 'Check the nearest food shops, pharmacy and dining options from the actual building rather than assuming every service is within walking distance.', places: 'Explore Nai Yang beach and Sirinat National Park. Confirm park rules, access and current conditions before visiting.' },
      ru: { intro: 'Пляжная локация на севере Пхукета. Окружение и доступ к побережью оценивайте по точному адресу объекта.', fit: 'Подойдёт тем, для кого важен пляж и кто готов заранее проверить повседневные маршруты.', tradeoffs: 'Может не подойти для поездок, сосредоточенных вокруг Пхукет-тауна или других пляжей западного побережья. Проверьте транспорт и местные условия на свои даты.', beach: 'Най Янг — один из пляжей Пхукета. Условия на море меняются; при красных флагах купаться нельзя.', daily: 'Ближайшие продукты, аптеку и рестораны проверяйте от конкретного дома: наличие всех услуг в пешей доступности не гарантировано.', places: 'Познакомьтесь с пляжем Най Янг и национальным парком Сиринат. Правила парка, доступ и текущие условия уточняйте до посещения.' }, th: null,
    }, sources: [tatSource, 'https://www.tourismthailand.org/Attraction/sirinart-national-park'],
    media: { file: 'Nai_Yang_Beach_(29).jpg', author: 'Wolfgang Holzem / isaan.live', license: '4.0', capturedAt: '2010-11-23', src: 'd/d7/Nai_Yang_Beach_%2829%29.jpg', alt: 'Nai Yang beach, Phuket' },
  },
  {
    key: 'kamala', kind: 'coastal-area',
    content: {
      en: { intro: 'A beach location on Phuket’s west coast. Thailand’s tourism authority describes Kamala as a place for a restful beach visit.', fit: 'Consider it for a beach-focused stay. Check the immediate surroundings of each home for your own pace of life.', tradeoffs: 'A district label does not guarantee a quiet room, step-free access or a walkable route to the beach.', beach: 'Kamala beach is the main landmark. Check current sea conditions and obey red flags.', daily: 'Check food shops, pharmacy and everyday routes from the specific home before booking.', places: 'Start with Kamala beach and the surrounding streets; confirm access and opening hours for individual attractions.' },
      ru: { intro: 'Пляжная локация на западном побережье Пхукета. Туристическое управление Таиланда описывает Камалу как место для спокойного пляжного отдыха.', fit: 'Подойдёт для отдыха с акцентом на море. Окружение конкретного дома стоит проверить под свой ритм жизни.', tradeoffs: 'Название района не гарантирует тишину в комнате, доступ без ступеней или пеший маршрут к пляжу.', beach: 'Главный ориентир — пляж Камала. Проверяйте состояние моря и соблюдайте запрет купания при красных флагах.', daily: 'Продукты, аптеку и бытовые маршруты проверяйте от выбранного дома до бронирования.', places: 'Начните с пляжа Камала и прилегающих улиц; условия доступа и часы работы отдельных достопримечательностей уточняйте напрямую.' }, th: null,
    }, sources: ['https://www.tourismthailand.org/Attraction/hat-kamala', tatSource],
    media: { file: 'Kamala_beach.jpg', author: 'govertvissers', license: '3.0', capturedAt: '2014-07-30', src: 'd/dc/Kamala_beach.jpg', alt: 'Panorama of Kamala beach, Phuket' },
  },
] as const;
export const AREA_GUIDES: readonly AreaGuide[] = seed.map(item => ({ ...item, slug: item.key, aliases: districtFilterAliases(item.key), sources: item.sources.map(url => ({ url, checkedAt })) }));
export function findAreaGuide(value: string) { return AREA_GUIDES.find(area => area.key === normalizeDistrictId(value)); }
export function areaName(area: AreaGuide, language: string) {
  const profile = PHUKET_AREAS.find(profile => profile.slug === area.key);
  const district = getDistrictById(area.key)!;
  return language === 'ru' ? profile?.name_ru ?? district.labelRu : profile?.name_en ?? district.labelEn;
}
/** Preserve the three existing search contracts; no implicit child union. */
export function areaInventoryFilters(area: AreaGuide) {
  const label = getDistrictById(area.key)!.labelEn;
  return { rentals: { district: area.key, listingType: 'rent' }, projects: { district: label }, resale: { zone: label } };
}
export function areaSearchHref(area: AreaGuide, category: 'rentals' | 'projects' | 'resale', current = '') {
  const params = new URLSearchParams(current);
  for (const key of ['zone', 'district', 'f.district', 'page', 'cursor']) params.delete(key);
  if (category === 'rentals') {
    params.set('mode', 'rent');
    if (!['rent-long', 'rent-month'].includes(params.get('intent') ?? '')) params.delete('intent');
  }
  else for (const key of [...params.keys()]) if (key !== 'lang') params.delete(key);
  const filters = areaInventoryFilters(area);
  if (category === 'resale') { params.delete('district'); params.set('zone', filters.resale.zone); }
  else { params.delete('zone'); params.set('district', category === 'rentals' ? filters.rentals.district : filters.projects.district); }
  return `${category === 'rentals' ? '/property/browse' : category === 'projects' ? '/property/offplan' : '/property/resale'}?${params}`;
}
export function mediaSource(area: AreaGuide) { return `https://commons.wikimedia.org/wiki/File:${area.media.file}`; }
export function mediaUrl(area: AreaGuide, width = 1280) {
  const name = area.media.src.split('/').at(-1);
  return `https://thumb.wikimedia.org/wikipedia/commons/thumb/${area.media.src}/${width}px-${name}`;
}
