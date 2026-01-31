-- =====================================================
-- TEST SEED USERS FOR E2E TESTING
-- Fixed UUID test users for automated testing
-- =====================================================

DO $$
DECLARE
  v_tourist_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_resident_id UUID := 'a0000000-0000-0000-0000-000000000002';
  v_owner_id UUID := 'a0000000-0000-0000-0000-000000000003';
  v_vendor_id UUID := 'a0000000-0000-0000-0000-000000000004';
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000005';
  v_uno_team_id UUID := 'a0000000-0000-0000-0000-000000000006';
BEGIN
  -- Create test users in auth.users
  -- Password for all: TestPass123!
  
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
    confirmation_token, recovery_token
  ) VALUES 
  (v_tourist_id, '00000000-0000-0000-0000-000000000000', 'test-tourist@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test Tourist"}',
   'authenticated', 'authenticated', now(), now(), '', ''),
  (v_resident_id, '00000000-0000-0000-0000-000000000000', 'test-resident@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test Resident"}',
   'authenticated', 'authenticated', now(), now(), '', ''),
  (v_owner_id, '00000000-0000-0000-0000-000000000000', 'test-owner@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test Owner"}',
   'authenticated', 'authenticated', now(), now(), '', ''),
  (v_vendor_id, '00000000-0000-0000-0000-000000000000', 'test-vendor@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test Vendor"}',
   'authenticated', 'authenticated', now(), now(), '', ''),
  (v_admin_id, '00000000-0000-0000-0000-000000000000', 'test-admin@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test Admin"}',
   'authenticated', 'authenticated', now(), now(), '', ''),
  (v_uno_team_id, '00000000-0000-0000-0000-000000000000', 'test-unoteam@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test UNO Team"}',
   'authenticated', 'authenticated', now(), now(), '', '')
  ON CONFLICT (id) DO NOTHING;

  -- Create identities
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
  (v_tourist_id, v_tourist_id, jsonb_build_object('sub', v_tourist_id, 'email', 'test-tourist@myuno.app'), 'email', v_tourist_id::text, now(), now(), now()),
  (v_resident_id, v_resident_id, jsonb_build_object('sub', v_resident_id, 'email', 'test-resident@myuno.app'), 'email', v_resident_id::text, now(), now(), now()),
  (v_owner_id, v_owner_id, jsonb_build_object('sub', v_owner_id, 'email', 'test-owner@myuno.app'), 'email', v_owner_id::text, now(), now(), now()),
  (v_vendor_id, v_vendor_id, jsonb_build_object('sub', v_vendor_id, 'email', 'test-vendor@myuno.app'), 'email', v_vendor_id::text, now(), now(), now()),
  (v_admin_id, v_admin_id, jsonb_build_object('sub', v_admin_id, 'email', 'test-admin@myuno.app'), 'email', v_admin_id::text, now(), now(), now()),
  (v_uno_team_id, v_uno_team_id, jsonb_build_object('sub', v_uno_team_id, 'email', 'test-unoteam@myuno.app'), 'email', v_uno_team_id::text, now(), now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Create profiles with correct user_type enum values
  INSERT INTO public.profiles (id, email, full_name, phone, preferred_language, user_type)
  VALUES 
    (v_tourist_id, 'test-tourist@myuno.app', 'Test Tourist', '+66800000001', 'en', 'tourist'),
    (v_resident_id, 'test-resident@myuno.app', 'Test Resident', '+66800000002', 'ru', 'resident'),
    (v_owner_id, 'test-owner@myuno.app', 'Test Owner', '+66800000003', 'en', 'owner'),
    (v_vendor_id, 'test-vendor@myuno.app', 'Test Vendor', '+66800000004', 'ru', 'vendor'),
    (v_admin_id, 'test-admin@myuno.app', 'Test Admin', '+66800000005', 'en', 'admin'),
    (v_uno_team_id, 'test-unoteam@myuno.app', 'Test UNO Team', '+66800000006', 'en', 'uno_team')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    user_type = EXCLUDED.user_type;

  -- Assign roles in user_roles table
  INSERT INTO public.user_roles (user_id, role) VALUES
    (v_tourist_id, 'user'),
    (v_tourist_id, 'guest'),
    (v_resident_id, 'user'),
    (v_owner_id, 'user'),
    (v_owner_id, 'owner'),
    (v_vendor_id, 'user'),
    (v_vendor_id, 'vendor'),
    (v_admin_id, 'user'),
    (v_admin_id, 'admin'),
    (v_uno_team_id, 'user'),
    (v_uno_team_id, 'staff'),
    (v_uno_team_id, 'uno_team')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create wallets
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES 
    (v_tourist_id, 500.00, 'THB'),
    (v_resident_id, 2500.00, 'THB'),
    (v_owner_id, 15000.00, 'THB'),
    (v_vendor_id, 8000.00, 'THB'),
    (v_admin_id, 0.00, 'THB'),
    (v_uno_team_id, 1000.00, 'THB')
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✅ Test seed users created:';
  RAISE NOTICE '  Tourist: test-tourist@myuno.app';
  RAISE NOTICE '  Resident: test-resident@myuno.app';
  RAISE NOTICE '  Owner: test-owner@myuno.app';
  RAISE NOTICE '  Vendor: test-vendor@myuno.app';
  RAISE NOTICE '  Admin: test-admin@myuno.app';
  RAISE NOTICE '  UNO Team: test-unoteam@myuno.app';
  RAISE NOTICE '  Password for all: TestPass123!';
END $$;