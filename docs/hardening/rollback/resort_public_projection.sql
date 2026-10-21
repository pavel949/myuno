-- Fail closed: disable only new public read entrypoints. Never restore broad base policies.
REVOKE ALL ON public.public_room_category_catalog,public.public_room_rate_plan_catalog,
 public.public_room_rate_season_catalog,public.public_room_stay_rule_catalog
FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_public_room_category_availability(uuid,date,date)
FROM PUBLIC,anon,authenticated,service_role;