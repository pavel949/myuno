/**
 * Simulation Runner for E2E Tests
 * 
 * Orchestrates multi-session behavioral simulations using Playwright.
 * Creates realistic user flows across different roles.
 */

import { Page, Browser, BrowserContext } from '@playwright/test';
import { TEST_USERS, TestUserKey } from '../fixtures/testUsers';

// Simulation user profile
export interface SimulationUser {
  id: string;
  role: 'guest' | 'resident' | 'provider' | 'owner' | 'admin' | 'chaotic';
  language: 'en' | 'ru';
  device: 'mobile' | 'desktop';
  behavior: 'careful' | 'rushed' | 'confused';
  email: string;
  name: string;
}

// Simulation step result
export interface SimulationStepResult {
  userId: string;
  step: string;
  success: boolean;
  duration: number;
  error?: string;
  screenshot?: string;
}

// Simulation report
export interface SimulationReport {
  runId: string;
  startedAt: Date;
  completedAt: Date;
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  stepsByRole: Record<string, { total: number; success: number; failed: number }>;
  errors: Array<{ step: string; error: string; userId: string }>;
  uxIssues: string[];
}

/**
 * Generate simulation users with realistic distribution
 */
export function generateSimulationUsers(count: number): SimulationUser[] {
  const users: SimulationUser[] = [];
  
  // Distribution: 40% guests, 20% residents, 15% providers, 10% owners, 5% admins, 10% chaotic
  const distribution = {
    guest: Math.floor(count * 0.4),
    resident: Math.floor(count * 0.2),
    provider: Math.floor(count * 0.15),
    owner: Math.floor(count * 0.1),
    admin: Math.floor(count * 0.05),
    chaotic: Math.floor(count * 0.1),
  };

  let index = 0;
  for (const [role, roleCount] of Object.entries(distribution)) {
    for (let i = 0; i < roleCount; i++) {
      users.push({
        id: `sim-user-${index}`,
        role: role as SimulationUser['role'],
        language: Math.random() > 0.5 ? 'en' : 'ru',
        device: Math.random() > 0.3 ? 'mobile' : 'desktop',
        behavior: ['careful', 'rushed', 'confused'][Math.floor(Math.random() * 3)] as SimulationUser['behavior'],
        email: `sim-${role}-${index}@test.myuno.app`,
        name: `Simulation ${role} ${index}`,
      });
      index++;
    }
  }

  return users;
}

/**
 * Map simulation role to test user
 */
export function getTestUserForRole(role: SimulationUser['role']): TestUserKey {
  const mapping: Record<SimulationUser['role'], TestUserKey> = {
    guest: 'tourist',
    resident: 'resident',
    provider: 'vendor',
    owner: 'owner',
    admin: 'admin',
    chaotic: 'tourist', // Chaotic users use guest credentials
  };
  return mapping[role];
}

/**
 * Simulation action definitions by role
 */
export const SIMULATION_ACTIONS = {
  guest: [
    'visit_home',
    'browse_properties',
    'browse_yachts',
    'browse_services',
    'select_life_situation',
    'view_property_detail',
    'submit_inquiry',
    'switch_language',
    'abandon_booking',
  ],
  resident: [
    'visit_home',
    'browse_services',
    'browse_restaurants',
    'submit_booking',
    'check_wallet',
    'view_orders',
    'update_profile',
  ],
  provider: [
    'visit_vendor_dashboard',
    'create_listing',
    'edit_listing',
    'view_analytics',
    'respond_to_inquiry',
    'update_availability',
  ],
  owner: [
    'visit_owner_dashboard',
    'add_property',
    'edit_property',
    'view_bookings',
    'check_calendar',
    'view_reports',
  ],
  admin: [
    'visit_admin_dashboard',
    'review_providers',
    'manage_lifeos',
    'view_audit_logs',
    'check_metrics',
  ],
  chaotic: [
    'random_navigation',
    'rapid_clicks',
    'form_abandonment',
    'language_switch_spam',
    'invalid_inputs',
  ],
} as const;

/**
 * Execute a simulation step
 */
export async function executeStep(
  page: Page,
  user: SimulationUser,
  step: string
): Promise<SimulationStepResult> {
  const startTime = Date.now();
  
  try {
    switch (step) {
      case 'visit_home':
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        break;
        
      case 'browse_properties':
        await page.goto('/property?mode=rent');
        await page.waitForSelector('[data-testid="property-card"], .property-card, article', { timeout: 10000 }).catch(() => {});
        break;
        
      case 'browse_yachts':
        await page.goto('/yacht-charter');
        await page.waitForLoadState('networkidle');
        break;
        
      case 'browse_services':
        await page.goto('/services');
        await page.waitForLoadState('networkidle');
        break;
        
      case 'switch_language': {
        // Toggle language via UI
        const langButton = page.locator('[data-testid="language-toggle"], button:has-text("EN"), button:has-text("RU")').first();
        if (await langButton.isVisible()) {
          await langButton.click();
        }
        break;
      }

      case 'select_life_situation': {
        await page.goto('/life-situations');
        await page.waitForLoadState('networkidle');
        const firstSituation = page.locator('[data-testid="life-situation-card"], .life-situation-card').first();
        if (await firstSituation.isVisible()) {
          await firstSituation.click();
        }
        break;
      }
        
      case 'visit_admin_dashboard':
        await page.goto('/admin');
        await page.waitForLoadState('networkidle');
        break;
        
      case 'visit_owner_dashboard':
        await page.goto('/owner');
        await page.waitForLoadState('networkidle');
        break;
        
      case 'visit_vendor_dashboard':
        await page.goto('/vendor');
        await page.waitForLoadState('networkidle');
        break;

      case 'random_navigation': {
        const pages = ['/', '/property', '/yacht-charter', '/services', '/restaurants'];
        const randomPage = pages[Math.floor(Math.random() * pages.length)];
        await page.goto(randomPage);
        break;
      }
        
      default:
        // Unknown step - just wait
        await page.waitForTimeout(500);
    }

    return {
      userId: user.id,
      step,
      success: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      userId: user.id,
      step,
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run simulation for a single user
 */
export async function runUserSimulation(
  browser: Browser,
  user: SimulationUser,
  stepsToRun: number = 5
): Promise<SimulationStepResult[]> {
  const results: SimulationStepResult[] = [];
  
  // Create context with appropriate viewport
  const context = await browser.newContext({
    viewport: user.device === 'mobile' 
      ? { width: 390, height: 844 }
      : { width: 1280, height: 720 },
    locale: user.language === 'ru' ? 'ru-RU' : 'en-US',
  });

  const page = await context.newPage();
  
  try {
    // Get actions for this role
    const actions = SIMULATION_ACTIONS[user.role];
    
    // Run random subset of actions
    for (let i = 0; i < stepsToRun; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const result = await executeStep(page, user, action);
      results.push(result);
      
      // Add realistic delay between actions
      const delay = user.behavior === 'rushed' ? 200 : user.behavior === 'confused' ? 2000 : 1000;
      await page.waitForTimeout(delay);
    }
  } finally {
    await context.close();
  }

  return results;
}

/**
 * Run multi-user simulation in waves
 */
export async function runWaveSimulation(
  browser: Browser,
  waveSize: number,
  stepsPerUser: number = 5
): Promise<SimulationReport> {
  const users = generateSimulationUsers(waveSize);
  const allResults: SimulationStepResult[] = [];
  const startedAt = new Date();
  
  console.log(`[Simulation] Starting wave with ${users.length} users...`);
  
  // Run in batches to avoid overwhelming the browser
  const batchSize = 5;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const batchPromises = batch.map(user => runUserSimulation(browser, user, stepsPerUser));
    const batchResults = await Promise.all(batchPromises);
    allResults.push(...batchResults.flat());
    
    console.log(`[Simulation] Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`);
  }

  // Generate report
  const stepsByRole: Record<string, { total: number; success: number; failed: number }> = {};
  const errors: Array<{ step: string; error: string; userId: string }> = [];
  
  for (const result of allResults) {
    const user = users.find(u => u.id === result.userId);
    const role = user?.role || 'unknown';
    
    if (!stepsByRole[role]) {
      stepsByRole[role] = { total: 0, success: 0, failed: 0 };
    }
    
    stepsByRole[role].total++;
    if (result.success) {
      stepsByRole[role].success++;
    } else {
      stepsByRole[role].failed++;
      if (result.error) {
        errors.push({ step: result.step, error: result.error, userId: result.userId });
      }
    }
  }

  return {
    runId: `sim-${Date.now()}`,
    startedAt,
    completedAt: new Date(),
    totalSteps: allResults.length,
    successfulSteps: allResults.filter(r => r.success).length,
    failedSteps: allResults.filter(r => !r.success).length,
    stepsByRole,
    errors: errors.slice(0, 50), // Limit errors
    uxIssues: [], // Would be populated by specific UX checks
  };
}
