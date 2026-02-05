# Test Users for Wave 2 Testing

> **IMPORTANT**: These credentials are for TEST MODE ONLY (VITE_TEST_MODE=true)
> Never use these in production. All passwords are: `TestPass123!`

## Quick Start

1. Ensure test mode is enabled in `.env.local`:
   ```
   VITE_TEST_MODE=true
   ```

2. Navigate to `/auth` and log in with the appropriate test user.

3. Use the "Test Utilities" menu in the avatar dropdown to:
   - Switch accounts cleanly
   - Clear PIN data between tests
   - Reset onboarding state

## Test Users by Role

| Role | Email | Routes to Test |
|------|-------|----------------|
| **Tourist/Guest** | test-tourist@myuno.app | `/`, `/life-flow/*`, `/market`, `/bookings` |
| **Resident** | test-resident@myuno.app | `/`, `/life-flow/*`, `/services`, `/account` |
| **Property Owner** | test-owner@myuno.app | `/owner`, `/owner/properties`, `/owner/bookings` |
| **Vendor/Provider** | test-vendor@myuno.app | `/vendor`, `/vendor/services`, `/vendor/bookings` |
| **Admin** | test-admin@myuno.app | `/admin`, `/admin/lifeos`, `/admin/users` |
| **UNO Team** | test-unoteam@myuno.app | `/team`, `/admin/*`, `/owner/*` (elevated) |

## User Details

### 1. Tourist (Guest)
- **ID**: `a0000000-0000-0000-0000-000000000001`
- **Email**: `test-tourist@myuno.app`
- **Roles**: `user`, `guest`
- **Wallet**: 500 THB
- **Language**: EN
- **Use case**: First-time visitor exploring services

### 2. Resident
- **ID**: `a0000000-0000-0000-0000-000000000002`
- **Email**: `test-resident@myuno.app`
- **Roles**: `user`
- **Wallet**: 2,500 THB
- **Language**: RU
- **Use case**: Long-term resident using local services

### 3. Property Owner
- **ID**: `a0000000-0000-0000-0000-000000000003`
- **Email**: `test-owner@myuno.app`
- **Roles**: `user`, `owner`
- **Wallet**: 15,000 THB
- **Language**: EN
- **Use case**: Manages rental properties

### 4. Vendor/Provider
- **ID**: `a0000000-0000-0000-0000-000000000004`
- **Email**: `test-vendor@myuno.app`
- **Roles**: `user`, `vendor`
- **Wallet**: 8,000 THB
- **Language**: RU
- **Use case**: Service provider (must complete partner onboarding first)

### 5. Admin
- **ID**: `a0000000-0000-0000-0000-000000000005`
- **Email**: `test-admin@myuno.app`
- **Roles**: `user`, `admin`
- **Wallet**: 0 THB
- **Language**: EN
- **Use case**: Platform administrator

### 6. UNO Team
- **ID**: `a0000000-0000-0000-0000-000000000006`
- **Email**: `test-unoteam@myuno.app`
- **Roles**: `user`, `staff`, `uno_team`
- **Wallet**: 1,000 THB
- **Language**: EN
- **Use case**: Internal team member with elevated access

## Wave 2 Testing Checklist

### Guest/Tourist Flow
- [ ] Home page loads with LifeOS situations
- [ ] Can browse services without login
- [ ] Can view property listings
- [ ] Language switch (EN ↔ RU) works

### Authenticated User Flows
- [ ] Login with email/password
- [ ] PIN setup works (if enabled)
- [ ] Profile page accessible
- [ ] Wallet balance visible
- [ ] Bookings list loads

### Owner Dashboard
- [ ] `/owner` loads with Quick Actions
- [ ] Properties list accessible
- [ ] Calendar view works
- [ ] OTA import button visible

### Vendor Dashboard
- [ ] `/vendor` loads (may show partner gate)
- [ ] Partner onboarding flow completable
- [ ] After onboarding: services management works
- [ ] Bookings/orders visible

### Admin Panel
- [ ] `/admin` loads with navigation
- [ ] LifeOS mappings editable
- [ ] User management accessible
- [ ] Moderation queue visible

## Troubleshooting

### "PIN Required" blocking access
Use Test Utilities → Clear PIN, or:
```javascript
localStorage.removeItem('myuno_pin_setup');
localStorage.removeItem('myuno_pin_verified');
```

### Vendor showing "Partner Setup" gate
This is expected! Complete `/vendor/onboarding` to unlock full vendor features.

### Session not clearing
Use Test Utilities → Clean Logout for complete session reset.

## Notes

- All test users are pre-seeded in the database
- Roles are enforced server-side via RLS
- Test mode utilities are UI convenience only (no security bypass)
- PIN authentication is functional but can be cleared for testing
