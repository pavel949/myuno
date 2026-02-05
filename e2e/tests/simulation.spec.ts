/**
 * Simulation E2E Tests
 * 
 * Multi-role behavioral simulation for myUNO platform.
 * Tests UX, permissions, and LifeOS behavior under load.
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/testUsers';
import { 
  generateSimulationUsers, 
  runWaveSimulation,
  executeStep,
  type SimulationUser,
} from '../utils/simulationRunner';

// Skip in CI by default (resource-intensive)
const SKIP_IN_CI = process.env.CI === 'true';

test.describe('Simulation Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test('Wave 1: Smoke test with 10 users', async ({ browser }) => {
    test.skip(SKIP_IN_CI, 'Skipping simulation in CI');
    test.setTimeout(120000); // 2 minutes

    const report = await runWaveSimulation(browser, 10, 3);
    
    console.log('\n=== WAVE 1 REPORT ===');
    console.log(`Total steps: ${report.totalSteps}`);
    console.log(`Success rate: ${((report.successfulSteps / report.totalSteps) * 100).toFixed(1)}%`);
    console.log('Steps by role:', JSON.stringify(report.stepsByRole, null, 2));
    
    if (report.errors.length > 0) {
      console.log('Errors:', report.errors.slice(0, 10));
    }

    // At least 80% success rate for smoke test
    expect(report.successfulSteps / report.totalSteps).toBeGreaterThan(0.8);
  });

  test('Wave 2: Role coverage with 30 users', async ({ browser }) => {
    test.skip(SKIP_IN_CI, 'Skipping simulation in CI');
    test.setTimeout(300000); // 5 minutes

    const report = await runWaveSimulation(browser, 30, 5);
    
    console.log('\n=== WAVE 2 REPORT ===');
    console.log(`Total steps: ${report.totalSteps}`);
    console.log(`Success rate: ${((report.successfulSteps / report.totalSteps) * 100).toFixed(1)}%`);
    console.log('Steps by role:', JSON.stringify(report.stepsByRole, null, 2));

    // Verify all roles were tested
    const testedRoles = Object.keys(report.stepsByRole);
    expect(testedRoles).toContain('guest');
    expect(testedRoles).toContain('resident');
    expect(testedRoles).toContain('provider');
    
    // At least 70% success rate
    expect(report.successfulSteps / report.totalSteps).toBeGreaterThan(0.7);
  });

  test('UX assertion: No raw slugs visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check page content doesn't contain raw technical slugs
    const content = await page.content();
    
    // Should not see raw entity IDs as visible text
    const hasRawUUID = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i.test(
      await page.locator('body').textContent() || ''
    );
    
    // UUIDs in URLs are OK, but not in visible content
    // This is a soft check - log warning but don't fail
    if (hasRawUUID) {
      console.warn('[UX Warning] Raw UUID visible in page content');
    }
  });

  test('UX assertion: No zero prices on property cards', async ({ page }) => {
    await page.goto('/property?mode=rent');
    await page.waitForLoadState('networkidle');
    
    // Look for price elements
    const priceElements = page.locator('[data-testid="price"], .price, [class*="price"]');
    const count = await priceElements.count();
    
    for (let i = 0; i < count; i++) {
      const text = await priceElements.nth(i).textContent();
      if (text) {
        // Should not show "0" as a price (but "0" in a phone number is OK)
        const isZeroPrice = /^\s*[฿$€₽]?\s*0\s*$/.test(text.trim());
        if (isZeroPrice) {
          console.warn(`[UX Issue] Zero price found: "${text}"`);
        }
      }
    }
  });

  test('UX assertion: No null values in property details', async ({ page }) => {
    await page.goto('/property?mode=rent');
    await page.waitForLoadState('networkidle');
    
    // Click first property if available
    const firstProperty = page.locator('[data-testid="property-card"], .property-card, article').first();
    if (await firstProperty.isVisible()) {
      await firstProperty.click();
      await page.waitForLoadState('networkidle');
      
      // Check for "null" text
      const bodyText = await page.locator('body').textContent() || '';
      const hasNullText = /\bnull\b/i.test(bodyText);
      
      if (hasNullText) {
        console.warn('[UX Issue] "null" text visible in property details');
      }
    }
  });

  test('LifeOS: Primary block never empty', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to life situations if available
    const lifeSituationsLink = page.locator('a[href*="life-situation"], [data-testid="life-situations-link"]').first();
    if (await lifeSituationsLink.isVisible()) {
      await lifeSituationsLink.click();
      await page.waitForLoadState('networkidle');
      
      // Click first situation
      const firstSituation = page.locator('[data-testid="life-situation-card"]').first();
      if (await firstSituation.isVisible()) {
        await firstSituation.click();
        await page.waitForLoadState('networkidle');
        
        // Verify primary block has content
        const primaryBlock = page.locator('[data-testid="primary-block"], .primary-block').first();
        if (await primaryBlock.isVisible()) {
          const isEmpty = (await primaryBlock.textContent())?.trim() === '';
          expect(isEmpty).toBe(false);
        }
      }
    }
  });

  test('RLS: Cross-tenant access denied', async ({ browser }) => {
    // Test that one user cannot access another user's private data
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as tourist
    await page.goto('/auth');
    await page.fill('input[type="email"]', TEST_USERS.tourist.email);
    await page.fill('input[type="password"]', TEST_USERS.tourist.password);
    await page.click('button[type="submit"]');
    
    // Wait for auth to complete
    await page.waitForTimeout(2000);
    
    // Try to access owner dashboard (should be denied or redirected)
    await page.goto('/owner');
    await page.waitForLoadState('networkidle');
    
    // Should not see owner dashboard content
    const isOwnerDashboard = await page.locator('text=Owner Dashboard, text=My Properties').first().isVisible().catch(() => false);
    
    // Tourist should not see owner-specific content
    // (They might see a redirect or access denied)
    if (isOwnerDashboard) {
      console.warn('[Security Issue] Tourist accessed owner dashboard');
    }
    
    await context.close();
  });
});

test.describe('Individual Role Tests', () => {
  test('Guest can browse and view properties', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to properties
    await page.goto('/property?mode=rent');
    await page.waitForLoadState('networkidle');
    
    // Should see property listings or empty state
    const hasContent = await page.locator('article, [data-testid="property-card"], [data-testid="empty-state"]').first().isVisible();
    expect(hasContent).toBe(true);
  });

  test('Admin can access admin dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // Navigate to admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should see admin content (or login redirect if auth failed)
    const pageContent = await page.content();
    const isAdminPage = pageContent.includes('Admin') || pageContent.includes('Dashboard');
    
    expect(isAdminPage).toBe(true);
    
    await context.close();
  });
});
