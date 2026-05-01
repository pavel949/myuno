/**
 * og-persona — Wave 4 dynamic OG image generator (persona / area / cluster).
 *
 * Returns a 1200×630 SVG (image/svg+xml) suitable for Open Graph and Twitter
 * `summary_large_image` cards. Vercel rewrites map nice URLs:
 *   /og/persona/:slug.svg
 *   /og/area/:slug.svg
 *   /og/cluster/:slug.svg
 * onto this function.
 *
 * Query params (all optional):
 *   persona      e.g. `tourists`
 *   area         e.g. `bang-tao`
 *   cluster      e.g. `arrive`
 *   areaName     human-readable area name (overrides slug)
 *   lang         `ru` | `en` (default `ru`)
 *   title        free-form override for the headline
 *   subtitle     free-form override for the subheadline
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

const CLUSTER_TITLES: Record<string, { ru: string; en: string }> = {
  arrive: { ru: 'Приезд и адаптация', en: 'Arrive & Settle' },
  live: { ru: 'Жизнь на острове', en: 'Live on the Island' },
  manage: { ru: 'Управление недвижимостью', en: 'Manage Property' },
  invest: { ru: 'Инвестиции', en: 'Investments' },
  legal: { ru: 'Юридическая поддержка', en: 'Legal Support' },
  build: { ru: 'Строительство и ремонт', en: 'Build & Renovate' },
};

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!),
  );
}

/** Naive line wrap for SVG text — splits by words at ~maxChars per line. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  // truncate if overflow
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (last.length > maxChars) lines[maxLines - 1] = last.slice(0, maxChars - 1) + '…';
  }
  return lines;
}

const FONT_FAMILY =
  "'Golos Text','Inter','Helvetica Neue',system-ui,-apple-system,'Segoe UI','Roboto','Arial',sans-serif";

function buildSvg(opts: { title: string; subtitle: string; tag: string }): string {
  const { title, subtitle, tag } = opts;
  const titleLines = wrap(title, 24, 2);
  const subtitleLines = wrap(subtitle, 56, 2);

  const titleY = titleLines.length === 1 ? 290 : 250;
  const titleSpans = titleLines
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 84}">${escapeXml(l)}</tspan>`)
    .join('');

  const subtitleY = titleY + titleLines.length * 84 + 24;
  const subtitleSpans = subtitleLines
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 42}">${escapeXml(l)}</tspan>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(title)}">
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
  <circle cx="1050" cy="120" r="180" fill="#00D68F" opacity="0.10"/>
  <circle cx="100" cy="540" r="220" fill="#4E7BFF" opacity="0.07"/>
  <rect x="80" y="80" width="6" height="40" fill="url(#accent)"/>
  <text x="110" y="112" font-family="${FONT_FAMILY}" font-size="22" font-weight="600" fill="#00D68F" letter-spacing="2">${escapeXml(tag.toUpperCase())}</text>
  <text y="${titleY}" font-family="${FONT_FAMILY}" font-size="76" font-weight="700" fill="#FAFAF9">${titleSpans}</text>
  <text y="${subtitleY}" font-family="${FONT_FAMILY}" font-size="30" font-weight="400" fill="#A8B2C1">${subtitleSpans}</text>
  <g transform="translate(80, 530)">
    <text font-family="${FONT_FAMILY}" font-size="36" font-weight="700" fill="#FAFAF9">myUNO</text>
    <text x="0" y="34" font-family="${FONT_FAMILY}" font-size="18" fill="#7A8499">Phuket SuperApp · myuno.app</text>
  </g>
</svg>`;
}

function resolveContent(params: URLSearchParams, lang: 'ru' | 'en') {
  const persona = params.get('persona') || '';
  const cluster = params.get('cluster') || '';
  const area = params.get('area') || '';
  const areaName = params.get('areaName') || (area ? titleCase(area) : '');
  const titleOverride = params.get('title') || '';
  const subtitleOverride = params.get('subtitle') || '';

  let tag = lang === 'ru' ? 'для' : 'for';
  let title = lang === 'ru' ? 'myUNO для вас' : 'myUNO for you';
  let subtitle =
    lang === 'ru'
      ? 'Один аккаунт · 40+ сервисов · Пхукет'
      : 'One account · 40+ services · Phuket';

  if (cluster) {
    tag = lang === 'ru' ? 'кластер' : 'cluster';
    const meta = CLUSTER_TITLES[cluster] || { ru: titleCase(cluster), en: titleCase(cluster) };
    title = meta[lang];
    subtitle =
      lang === 'ru'
        ? 'Подборка сервисов и проверенных партнёров'
        : 'Curated services and verified partners';
  } else if (persona) {
    tag = lang === 'ru' ? 'для' : 'for';
    const meta = PERSONA_TITLES[persona] || { ru: titleCase(persona), en: titleCase(persona) };
    title = meta[lang];
    subtitle = areaName
      ? lang === 'ru'
        ? `Район ${areaName} · Пхукет`
        : `${areaName} area · Phuket`
      : lang === 'ru'
        ? 'Один аккаунт · 40+ сервисов · Пхукет'
        : 'One account · 40+ services · Phuket';
  } else if (area) {
    tag = lang === 'ru' ? 'район' : 'area';
    title = areaName;
    subtitle =
      lang === 'ru'
        ? 'Гид по району · цены · доходность · сервисы'
        : 'Area guide · prices · yield · services';
  }

  if (titleOverride) title = titleOverride;
  if (subtitleOverride) subtitle = subtitleOverride;

  return { tag, title, subtitle };
}

Deno.serve((req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const lang = (url.searchParams.get('lang') === 'en' ? 'en' : 'ru') as 'ru' | 'en';
  const { tag, title, subtitle } = resolveContent(url.searchParams, lang);
  const svg = buildSvg({ tag, title, subtitle });

  return new Response(svg, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
