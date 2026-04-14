/**
 * Vercel Serverless Function — serves prerendered HTML with OG tags for /peylaa
 * Social crawlers hit this; real users get redirected to the SPA.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const OG = {
  title: 'PEYLAA Phuket — Autograph Collection Residences | от ฿7.1M',
  description: 'Первый проект Autograph Collection в Азии. 408 премиальных резиденций в Bang Tao, Пхукет. Marriott Bonvoy Gold Elite. Полная отделка. Рассрочка до передачи ключей. Финансирование до 50%.',
  image: 'https://bhmvnorkswapjkmbvykk.supabase.co/storage/v1/object/public/media/exterior/peylaa_drone-shot-with-3d-building.jpg',
  url: 'https://myuno.app/peylaa',
};

const SOCIAL_BOTS = /facebookexternalhit|Facebot|Twitterbot|TelegramBot|WhatsApp|LinkedInBot|Slackbot|vkShare|Pinterestbot|Googlebot|bingbot/i;

export default function handler(req: VercelRequest, res: VercelResponse) {
  const ua = req.headers['user-agent'] || '';

  // If not a social crawler, serve the SPA index.html (Vercel will handle this via rewrite)
  if (!SOCIAL_BOTS.test(ua)) {
    // Redirect real users to the SPA
    res.writeHead(302, { Location: '/peylaa' });
    res.end();
    return;
  }

  // Serve prerendered HTML with OG tags for crawlers
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${OG.title}</title>
  <meta name="description" content="${OG.description}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${OG.url}" />
  <meta property="og:title" content="${OG.title}" />
  <meta property="og:description" content="${OG.description}" />
  <meta property="og:image" content="${OG.image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="ru_RU" />
  <meta property="og:site_name" content="myUNO — PEYLAA Phuket" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${OG.title}" />
  <meta name="twitter:description" content="${OG.description}" />
  <meta name="twitter:image" content="${OG.image}" />

  <!-- Redirect real users -->
  <meta http-equiv="refresh" content="0;url=/peylaa" />
</head>
<body>
  <h1>PEYLAA Phuket — Autograph Collection Residences</h1>
  <p>${OG.description}</p>
  <p>408 резиденций в Bang Tao, Пхукет. От ฿7.1M (~$203,000).</p>
  <p>3 корпуса, 7 этажей, сдача Q4 2027.</p>
  <a href="/peylaa">Открыть каталог резиденций</a>
</body>
</html>`);
}
