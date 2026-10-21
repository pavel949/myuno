DO $$ DECLARE definition text; BEGIN
 definition:=pg_get_functiondef('public.create_managed_property_checked(uuid,uuid,text,text,text,text)'::regprocedure);
 IF md5(definition)<>'d261ddc9a21ebe1830f5e98b5f86f460' THEN RAISE EXCEPTION 'E2.8 checked onboarding drift'; END IF;
 EXECUTE replace(definition,'public.mc_can_access(','public.mc_can_access_e28_private(');
END $$;
