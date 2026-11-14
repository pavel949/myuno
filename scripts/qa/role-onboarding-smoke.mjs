import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'https://myuno.app';
const roles = [
  { id: 'guest', entry: '/', cta: /find a home|найти жиль|explore|начать поиск/i, target: '/discover', authTarget: '/discover' },
  { id: 'owner', entry: '/for-owners', cta: /discuss property|manage it yourself|обсудить управление|управлять самостоятельно/i, target: '/owner/management-landing', alternate: '/mc/onboarding', authTarget: '/owner/management-landing' },
  { id: 'management-company', entry: '/for-management-companies', cta: /trial|start|попробовать|начать/i, target: '/mc/onboarding', authTarget: '/mc/onboarding' },
  { id: 'service-provider', entry: '/for-local-services', cta: /join|become|подключ|стать парт/i, target: '/vendor/join', authTarget: '/vendor/onboarding' },
  { id: 'developer', entry: '/for-developers', cta: /introduce|apply|подключить|представить|заявк/i, target: '/developer-portal/apply', authTarget: '/developer-portal/onboarding' },
];
const devices = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'mobile', width: 390, height: 844 },
];

function normalizedPath(href) {
  try { return new URL(href, base).pathname; } catch { return href; }
}

async function clickMatching(page, pattern) {
  const candidates = page.locator('a,button').filter({ hasText: pattern });
  const count = await candidates.count();
  if (!count) return { clicked: false, count: 0 };
  await candidates.first().click({ timeout: 8000 });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(300);
  return { clicked: true, count };
}

async function inspectAuth(page, target) {
  await page.goto(`${base}/auth?redirect=${encodeURIComponent(target)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  const url = new URL(page.url());
  const authShell = await page.locator('input[type="email"], input[type="password"], button').count() > 0;
  const redirect = url.searchParams.get('redirect') || '';
  return {
    path: url.pathname,
    redirect,
    authShell,
    redirectPreserved: redirect === target || decodeURIComponent(redirect) === target,
  };
}

async function runCase(browser, role, device) {
  const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, isMobile: device.id === 'mobile', hasTouch: device.id === 'mobile' });
  const page = await context.newPage();
  const result = { role: role.id, device: device.id, entry: role.entry, errors: [], passed: false };
  page.on('pageerror', error => result.errors.push(`pageerror: ${error.message}`));
  try {
    const response = await page.goto(`${base}${role.entry}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
    result.httpStatus = response?.status() ?? null;
    result.entryPath = new URL(page.url()).pathname;
    result.title = await page.title();
    result.h1 = (await page.locator('h1').first().textContent().catch(() => ''))?.trim() || '';
    result.links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(a => ({ text: (a.textContent || '').trim().replace(/\s+/g, ' '), href: a.href })).filter(x => x.text).slice(0, 80));
    result.targetPresent = result.links.some(link => normalizedPath(link.href) === role.target || normalizedPath(link.href) === role.alternate);
    result.cta = await clickMatching(page, role.cta);
    result.ctaPath = new URL(page.url()).pathname;
    result.ctaTargetReached = [role.target, role.alternate].includes(result.ctaPath) || (role.id === 'guest' && result.ctaPath.startsWith('/discover'));
    result.touchTargets = await page.locator('a,button').evaluateAll(nodes => nodes.slice(0, 80).map(node => {
      const r = node.getBoundingClientRect();
      return { text: (node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80), width: Math.round(r.width), height: Math.round(r.height) };
    }).filter(x => x.text).filter(x => x.width > 0 && x.height > 0).filter(x => x.height < 44).slice(0, 12));
    result.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    result.auth = await inspectAuth(page, role.authTarget);
    const authCtaIsValid = result.ctaPath === '/auth' && result.auth.redirectPreserved;
    const ctaIsValid = result.ctaTargetReached || authCtaIsValid;
    result.passed = result.httpStatus === 200 && (result.targetPresent || ctaIsValid) && result.auth.path === '/auth' && result.auth.authShell && result.auth.redirectPreserved && !result.horizontalOverflow;
  } catch (error) {
    result.errors.push(error.message);
  } finally {
    await context.close();
  }
  return result;
}

const browser = await chromium.launch({ headless: true });
const results = [];
for (const device of devices) {
  for (const role of roles) results.push(await runCase(browser, role, device));
}
await browser.close();
console.log(JSON.stringify({ base, results, summary: { total: results.length, passed: results.filter(x => x.passed).length, failed: results.filter(x => !x.passed).length } }, null, 2));
if (results.some(x => !x.passed)) process.exitCode = 1;
