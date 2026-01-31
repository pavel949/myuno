/**
 * Test Seed Users for E2E Testing
 * 
 * These users are pre-created in the database with fixed UUIDs.
 * Password for all: TestPass123!
 */

export const TEST_USERS = {
  tourist: {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'test-tourist@myuno.app',
    password: 'TestPass123!',
    fullName: 'Test Tourist',
    userType: 'tourist' as const,
    roles: ['user', 'guest'],
    walletBalance: 500,
    language: 'en',
  },
  resident: {
    id: 'a0000000-0000-0000-0000-000000000002',
    email: 'test-resident@myuno.app',
    password: 'TestPass123!',
    fullName: 'Test Resident',
    userType: 'resident' as const,
    roles: ['user'],
    walletBalance: 2500,
    language: 'ru',
  },
  owner: {
    id: 'a0000000-0000-0000-0000-000000000003',
    email: 'test-owner@myuno.app',
    password: 'TestPass123!',
    fullName: 'Test Owner',
    userType: 'owner' as const,
    roles: ['user', 'owner'],
    walletBalance: 15000,
    language: 'en',
  },
  vendor: {
    id: 'a0000000-0000-0000-0000-000000000004',
    email: 'test-vendor@myuno.app',
    password: 'TestPass123!',
    fullName: 'Test Vendor',
    userType: 'vendor' as const,
    roles: ['user', 'vendor'],
    walletBalance: 8000,
    language: 'ru',
  },
  admin: {
    id: 'a0000000-0000-0000-0000-000000000005',
    email: 'test-admin@myuno.app',
    password: 'TestPass123!',
    fullName: 'Test Admin',
    userType: 'admin' as const,
    roles: ['user', 'admin'],
    walletBalance: 0,
    language: 'en',
  },
  unoTeam: {
    id: 'a0000000-0000-0000-0000-000000000006',
    email: 'test-unoteam@myuno.app',
    password: 'TestPass123!',
    fullName: 'Test UNO Team',
    userType: 'uno_team' as const,
    roles: ['user', 'staff', 'uno_team'],
    walletBalance: 1000,
    language: 'en',
  },
} as const;

export type TestUserKey = keyof typeof TEST_USERS;
export type TestUser = typeof TEST_USERS[TestUserKey];

/**
 * Get test user by type
 */
export function getTestUser(type: TestUserKey) {
  return TEST_USERS[type];
}

/**
 * Default password for all test users
 */
export const TEST_PASSWORD = 'TestPass123!';
