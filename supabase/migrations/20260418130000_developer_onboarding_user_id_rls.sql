-- Allow authenticated users to create and manage their own developers row via user_id
-- before developer_users exists (onboarding wizard). devmod_my_developer_id() only works
-- after an owner row is created in developer_users (devmod-apply).

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'developers' AND policyname = 'devmod: authenticated insert own developer via user_id'
  ) THEN
    CREATE POLICY "devmod: authenticated insert own developer via user_id"
      ON public.developers FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'developers' AND policyname = 'devmod: authenticated select own developer via user_id'
  ) THEN
    CREATE POLICY "devmod: authenticated select own developer via user_id"
      ON public.developers FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'developers' AND policyname = 'devmod: authenticated update own developer via user_id'
  ) THEN
    CREATE POLICY "devmod: authenticated update own developer via user_id"
      ON public.developers FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
