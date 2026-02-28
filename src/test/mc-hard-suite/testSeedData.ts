/**
 * @module testSeedData
 * @description Fixed test seed data for MC Hard Test Suite.
 * All IDs are deterministic UUIDs for idempotent seeding.
 */

// ── Management Companies ──
export const MC_ALPHA = {
  id: 'b0000000-0000-0000-0000-000000000001',
  slug: 'mc-alpha-test',
  name_en: 'MC Alpha Test',
  name_ru: 'УК Альфа Тест',
  is_verified: true,
  is_active: true,
  properties_count: 10,
};

export const MC_BETA = {
  id: 'b0000000-0000-0000-0000-000000000002',
  slug: 'mc-beta-test',
  name_en: 'MC Beta Test',
  name_ru: 'УК Бета Тест',
  is_verified: true,
  is_active: true,
  properties_count: 5,
};

// ── Test Users (auth.users UUIDs) ──
export const OWNER_A = {
  id: 'c0000000-0000-0000-0000-000000000001',
  email: 'test-owner-a@myuno.app',
  fullName: 'Owner Alpha',
  companyId: MC_ALPHA.id,
  role: 'director' as const,
};

export const OWNER_B = {
  id: 'c0000000-0000-0000-0000-000000000002',
  email: 'test-owner-b@myuno.app',
  fullName: 'Owner Beta',
  companyId: MC_BETA.id,
  role: 'director' as const,
};

export const STAFF_ALPHA = {
  id: 'c0000000-0000-0000-0000-000000000003',
  email: 'test-staff-alpha@myuno.app',
  fullName: 'Staff Alpha',
  companyId: MC_ALPHA.id,
  role: 'manager' as const,
};

export const GUEST_USER = {
  id: 'c0000000-0000-0000-0000-000000000004',
  email: 'test-guest@myuno.app',
  fullName: 'Guest User',
  companyId: null,
  role: null,
};

// ── Properties ──
function generatePropertyId(mcPrefix: string, index: number): string {
  const hex = index.toString(16).padStart(4, '0');
  return `d000${mcPrefix}-0000-0000-0000-000000${hex}`;
}

export const ALPHA_PROPERTIES = Array.from({ length: 10 }, (_, i) => ({
  id: generatePropertyId('0001', i + 1),
  name_en: `Alpha Property ${i + 1}`,
  name_ru: `Альфа Объект ${i + 1}`,
  management_company_id: MC_ALPHA.id,
  owner_id: OWNER_A.id,
  status: i < 7 ? 'active' : i < 9 ? 'paused' : 'archived',
  price_per_night: 1000 + i * 500,
  currency: 'THB',
}));

export const BETA_PROPERTIES = Array.from({ length: 5 }, (_, i) => ({
  id: generatePropertyId('0002', i + 1),
  name_en: `Beta Property ${i + 1}`,
  name_ru: `Бета Объект ${i + 1}`,
  management_company_id: MC_BETA.id,
  owner_id: OWNER_B.id,
  status: i < 3 ? 'active' : i < 4 ? 'paused' : 'archived',
  price_per_night: 2000 + i * 300,
  currency: 'THB',
}));

// ── Bookings ──
export const TEST_BOOKINGS = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    property_id: ALPHA_PROPERTIES[0].id,
    owner_id: OWNER_A.id,
    guest_name: 'Test Guest 1',
    guest_email: 'guest1@test.com',
    check_in: '2026-03-15',
    check_out: '2026-03-20',
    status: 'confirmed',
    total_amount: 5000,
    currency: 'THB',
    source: 'direct',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    property_id: ALPHA_PROPERTIES[0].id,
    owner_id: OWNER_A.id,
    guest_name: 'Test Guest 2',
    guest_email: 'guest2@test.com',
    check_in: '2026-03-22',
    check_out: '2026-03-25',
    status: 'pending',
    total_amount: 3000,
    currency: 'THB',
    source: 'direct',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    property_id: ALPHA_PROPERTIES[1].id,
    owner_id: OWNER_A.id,
    guest_name: 'Test Guest 3',
    guest_email: 'guest3@test.com',
    check_in: '2026-03-10',
    check_out: '2026-03-12',
    status: 'cancelled',
    total_amount: 2000,
    currency: 'THB',
    source: 'airbnb',
  },
  // Overlapping attempt booking (same dates as booking 1)
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    property_id: ALPHA_PROPERTIES[0].id,
    owner_id: OWNER_A.id,
    guest_name: 'Overlap Guest',
    guest_email: 'overlap@test.com',
    check_in: '2026-03-16',
    check_out: '2026-03-19',
    status: 'pending',
    total_amount: 3000,
    currency: 'THB',
    source: 'direct',
  },
  // Beta company booking
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    property_id: BETA_PROPERTIES[0].id,
    owner_id: OWNER_B.id,
    guest_name: 'Beta Guest',
    guest_email: 'betaguest@test.com',
    check_in: '2026-04-01',
    check_out: '2026-04-05',
    status: 'confirmed',
    total_amount: 8000,
    currency: 'THB',
    source: 'direct',
  },
];

// ── Pricing formulas ──
export const PRICING_FORMULAS = {
  platform_fee_percent: 0.10, // 10%
  mc_commission_percent: 0.20, // 20% of remainder
  // owner_payout = total - platform_fee - mc_commission
  calculate: (totalAmount: number) => {
    const platformFee = Math.round(totalAmount * 0.10 * 100) / 100;
    const afterPlatform = totalAmount - platformFee;
    const mcCommission = Math.round(afterPlatform * 0.20 * 100) / 100;
    const ownerPayout = Math.round((afterPlatform - mcCommission) * 100) / 100;
    return { platformFee, mcCommission, ownerPayout, total: totalAmount };
  },
};

// ── Test case severity ──
export type Severity = 'P0' | 'P1' | 'P2';

export interface TestResult {
  id: string;
  module: string;
  name: string;
  severity: Severity;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  entityIds?: string[];
  durationMs?: number;
}
