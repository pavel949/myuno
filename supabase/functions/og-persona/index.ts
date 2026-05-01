/**
 * og-persona — Wave 4 dynamic OG image generator.
 * Returns a 1200×630 SVG for /for/:persona share cards.
 *
 * Usage: GET /functions/v1/og-persona?persona=tourists&area=bang-tao&lang=ru
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PERSONA_TITLES: Record<string, { ru: string; en: string }> = {
  tourists: { ru: 'Туристам', en: 'For Tourists' },
  'cn-investors': { ru: 'Инвесторам из Китая', en: 'For CN Investors' },
  'eu-guests': { ru: 'Гостям из ЕС', en: 'For EU Guests' },
  'digital-nomads': { ru: 'Цифровым кочевникам', en: 'For Digital Nomads' },
  snowbirds: { ru: 'Зимовщикам', en: 'For Snowbirds' },
  'ru-expats': { ru: 'Русскоязычным экспатам', en: 'For Russian Expats' },
  families: { ru: 'Семьям', en: 'For Families' },
  'passive-investors': { ru: 'Пассивным инвесторам', en: 'For Passive Investors' },
  hnw: { ru: 'HNW-клиентам', en: 'For HNW' },
  operators: { ru: 'Операторам', en: 'For Operators' },
  'mn-investors': { ru: 'Инвесторам из МО', en: 'For MN Investors' },
  'bn-business': { ru: 'Бизнесу из Брунея', en: 'For BN Business' },
  'pet-owners': { ru: 'Владельцам животных', en: 'For Pet Owners' },
  medical: { ru: 'Медицинским туристам', en: 'For Medical Tourism' },
  weddings: { ru: 'Свадьбам', en: 'For Weddings' },
  athletes: { ru: 'Спортсменам', en: 'For Athletes' },
  halal: { ru: 'Халяль-путешественникам', en: 'For Halal Travelers' },
  lgbtq: { ru: 'LGBTQ+ путешественникам', en: 'For LGBTQ+ Travelers' },
  accessibility: { ru: 'Доступная среда', en: 'Accessible Travel' },
  retirees: { ru: 'Пенсионерам', en: 'For Retirees' },
  providers: { ru: 'Поставщикам услуг', en: 'For Providers' },
  freelancers: { ru: 'Фрилансерам', en: 'For Freelancers' },
  'developer-partner': { ru: 'Девелоперам-партнёрам', en: 'For Developer Partners' },
  smb: { ru: 'Малому и среднему бизнесу', en: 'For SMB' },
  creatives: { ru: 'Креативным профессионалам', en: 'For Creatives' },
  students: { ru: 'Студентам', en: 'For Students' },
  'conscious-eaters': { ru: 'Осознанному питанию', en: 'For Conscious Eaters' },
};

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!)
  );
}

function buildSvg(opts: { title: string; subtitle: string; tag: string }): string {
  const { title, subtitle, tag } = opts;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#08101E"/>
      <stop offset="1" stop-color="#0F1B2D"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#00D68F"/>
      <stop offset="1" stop-color="#4E7BFF"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1050" cy="120" r="180" fill="#00D68F" opacity="0.08"/>
  <circle cx="100" cy="540" r="220" fill="#4E7BFF" opacity="0.06"/>
  <rect x="80" y="80" width="6" height="40" fill="url(#accent)"/>
  <text x="110" y="112" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="600" fill="#00D68F" letter-spacing="2">${escapeXml(tag.toUpperCase())}</text>
  <text x="80" y="280" font-family="system-ui,-apple-system,sans-serif" font-size="72" font-weight="700" fill="#FAFAF9">
    ${escapeXml(title.length > 32 ? title.slice(0, 30) + '…' : title)}
  </text>
  <text x="80" y="360" font-family="system-ui,-apple-system,sans-serif" font-size="32" font-weight="400" fill="#A8B2C1">
    ${escapeXml(subtitle.length > 60 ? subtitle.slice(0, 58) + '…' : subtitle)}
  </text>
  <g transform="translate(80, 520)">
    <text font-family="system-ui,-apple-system,sans-serif" font-size="36" font-weight="700" fill="#FAFAF9">myUNO</text>
    <text x="0" y="36" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="#7A8499">Phuket SuperApp · myuno.app</text>
  </g>
</svg>`;
}

Deno.serve((req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const persona = url.searchParams.get('persona') || 'tourists';
  const area = url.searchParams.get('area') || '';
  const lang = (url.searchParams.get('lang') === 'en' ? 'en' : 'ru') as 'ru' | 'en';

  const meta = PERSONA_TITLES[persona] || { ru: 'myUNO для вас', en: 'myUNO for you' };
  const title = meta[lang];
  const subtitle = area
    ? lang === 'ru'
      ? `Район ${area} · Пхукет`
      : `${area} area · Phuket`
    : lang === 'ru'
      ? 'Один аккаунт · 40+ сервисов · Пхукет'
      : 'One account · 40+ services · Phuket';
  const tag = lang === 'ru' ? 'для' : 'for';

  const svg = buildSvg({ title, subtitle, tag });

  return new Response(svg, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
});
