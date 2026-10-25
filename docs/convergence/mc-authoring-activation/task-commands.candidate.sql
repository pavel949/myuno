-- SOURCE CANDIDATE. No production activation without explicit RPC/RLS approval.
-- Canonical property_operational_tasks only. No notifications, costs, invitations
-- or operational/property permission assignments are created by these commands.
BEGIN;
-- Existing properties enter this narrow command contract only after a separate
-- trusted per-property activation. The migration creates no activated rows.
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS checked_task_commands_enforced boolean NOT NULL DEFAULT false;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='properties'
 AND column_name='checked_task_commands_enforced' AND data_type='boolean' AND is_nullable='NO' AND column_default='false') THEN
  RAISE EXCEPTION 'reviewed checked task activation column contract required'; END IF;
END $$;
COMMENT ON COLUMN public.properties.checked_task_commands_enforced IS
 'Trusted per-property task-command activation; no capability, assignment or Space grant; ordinary clients cannot change';
CREATE FUNCTION public.guard_checked_task_activation() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN ('postgres','service_role','supabase_admin')
 OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user AND rolsuper) THEN RETURN NEW; END IF;
 IF (TG_OP='INSERT' AND NEW.checked_task_commands_enforced IS TRUE)
 OR (TG_OP='UPDATE' AND NEW.checked_task_commands_enforced IS DISTINCT FROM OLD.checked_task_commands_enforced) THEN
  RAISE EXCEPTION 'task-command activation requires separately approved trusted configuration' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_checked_task_activation() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_guard_checked_task_activation BEFORE INSERT OR UPDATE ON public.properties
 FOR EACH ROW EXECUTE FUNCTION public.guard_checked_task_activation();

CREATE FUNCTION public.actor_can_command_managed_task(p_property_id uuid,p_manager boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
  SELECT 1 FROM public.properties p JOIN public.management_companies c ON c.id=p.management_company_id
  JOIN public.operating_space_properties a ON a.property_id=p.id AND a.management_company_id=c.id
  JOIN public.operating_spaces s ON s.id=a.operating_space_id AND s.management_company_id=c.id
  WHERE p.id=p_property_id AND p.deleted_at IS NULL AND c.is_active IS TRUE AND s.is_active IS TRUE
  AND (public.actor_has_platform_admin() OR EXISTS(
   SELECT 1 FROM public.management_company_members m JOIN public.operating_space_members sm
   ON sm.company_member_id=m.id AND sm.management_company_id=m.company_id
   WHERE m.company_id=c.id AND m.user_id=auth.uid() AND m.is_active IS TRUE
   AND m.role IN ('director','admin','manager','staff') AND (NOT p_manager OR m.role IN ('director','admin','manager'))
   AND sm.operating_space_id=s.id AND sm.is_active IS TRUE))
  AND public.actor_can_operate_property(p.id,c.id,'tasks','view')
  AND public.actor_can_operate_property(p.id,c.id,'tasks','edit'))
$$;
REVOKE ALL ON FUNCTION public.actor_can_command_managed_task(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_can_command_managed_task(uuid,boolean) TO authenticated,service_role;

CREATE FUNCTION public.managed_task_assignee_allowed(p_property_id uuid,p_assignee uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p_assignee IS NOT NULL AND EXISTS(
  SELECT 1 FROM public.properties p JOIN public.management_companies c ON c.id=p.management_company_id
  JOIN public.operating_space_properties a ON a.property_id=p.id AND a.management_company_id=c.id
  JOIN public.operating_spaces s ON s.id=a.operating_space_id AND s.management_company_id=c.id
  JOIN public.management_company_members m ON m.company_id=c.id AND m.user_id=p_assignee
  JOIN public.operating_space_members sm ON sm.company_member_id=m.id AND sm.management_company_id=c.id AND sm.operating_space_id=s.id
  WHERE p.id=p_property_id AND p.deleted_at IS NULL AND c.is_active IS TRUE AND s.is_active IS TRUE
  AND m.is_active IS TRUE AND sm.is_active IS TRUE AND m.role IN ('director','admin','manager','staff')
  AND public.mc_can_access_e28_private(p_assignee,c.id,'tasks','view')
  AND public.mc_can_access_e28_private(p_assignee,c.id,'tasks','edit')
  AND (m.role<>'staff' OR EXISTS(SELECT 1 FROM public.property_manager_assignments pm
   WHERE pm.property_id=p.id AND pm.manager_user_id=p_assignee AND pm.is_active IS TRUE)))
$$;
REVOKE ALL ON FUNCTION public.managed_task_assignee_allowed(uuid,uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.managed_task_projection(p_task public.property_operational_tasks)
RETURNS jsonb LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb) FROM jsonb_each(to_jsonb(p_task))
 WHERE key=ANY(ARRAY['id','property_id','task_type','title','title_ru','description','scheduled_date','scheduled_time',
 'priority','status','assigned_to','completed_at','completed_by','notes','photo_proof','created_at','updated_at'])
$$;
REVOKE ALL ON FUNCTION public.managed_task_projection(public.property_operational_tasks) FROM PUBLIC,anon,authenticated;

-- Staff read only assigned tasks inside their current operational authority.
-- Independent owner/provider paths retain their pre-existing permissive policies.
CREATE FUNCTION public.managed_task_staff_read_ceiling(p_property_id uuid,p_assigned_to uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE company uuid; owner uuid; provider uuid; governed boolean;
BEGIN
 SELECT management_company_id,owner_id,provider_id,(content_author_user_id IS NOT NULL OR checked_task_commands_enforced IS TRUE)
 INTO company,owner,provider,governed FROM public.properties WHERE id=p_property_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF governed IS NOT TRUE THEN RETURN true; END IF;
 IF public.actor_has_platform_admin() OR owner=auth.uid() OR provider=auth.uid()
 OR EXISTS(SELECT 1 FROM public.providers pr WHERE pr.id=provider AND pr.user_id=auth.uid()) THEN RETURN true; END IF;
 IF EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=company AND m.user_id=auth.uid() AND m.role='staff') THEN
  RETURN p_assigned_to=auth.uid() AND public.actor_can_operate_property(p_property_id,company,'tasks','view')
   AND EXISTS(SELECT 1 FROM public.management_companies c
    JOIN public.operating_space_properties a ON a.management_company_id=c.id AND a.property_id=p_property_id
    JOIN public.operating_spaces s ON s.id=a.operating_space_id AND s.management_company_id=c.id
    JOIN public.management_company_members m ON m.company_id=c.id AND m.user_id=auth.uid()
    JOIN public.operating_space_members sm ON sm.management_company_id=c.id AND sm.company_member_id=m.id AND sm.operating_space_id=s.id
    WHERE c.id=company AND c.is_active IS TRUE AND s.is_active IS TRUE AND m.is_active IS TRUE AND sm.is_active IS TRUE);
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.managed_task_staff_read_ceiling(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.managed_task_staff_read_ceiling(uuid,uuid) TO authenticated,service_role;
CREATE POLICY managed_task_staff_read_ceiling ON public.property_operational_tasks AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.managed_task_staff_read_ceiling(property_id,assigned_to));

CREATE FUNCTION public.actor_needs_checked_managed_task(p_property_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.properties p WHERE p.id=p_property_id AND p.management_company_id IS NOT NULL
 AND (p.content_author_user_id IS NOT NULL OR p.checked_task_commands_enforced IS TRUE)
 AND (public.actor_has_platform_admin()
 OR EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=p.management_company_id AND m.user_id=auth.uid())
 OR EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='uno_team')))
$$;
REVOKE ALL ON FUNCTION public.actor_needs_checked_managed_task(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_needs_checked_managed_task(uuid) TO authenticated,service_role;

CREATE FUNCTION public.guard_managed_task_commands() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE property uuid;
BEGIN
 property:=CASE WHEN TG_OP='DELETE' THEN OLD.property_id ELSE NEW.property_id END;
 IF TG_OP='UPDATE' THEN NEW.updated_at:=greatest(clock_timestamp(),OLD.updated_at+interval '1 microsecond'); END IF;
 IF current_user IN ('postgres','service_role','supabase_admin')
 OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user AND rolsuper) THEN
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;
 -- Initial rollout governs checked content-author properties or explicitly
 -- activated existing properties. Unselected legacy writers stay unchanged.
 -- Booking/preparation on a governed property is a separate NO-GO gate.
 -- Check both the original and target property on UPDATE to prevent detaching
 -- from the governed company before editing the remaining fields.
 IF public.actor_needs_checked_managed_task(property) THEN
  RAISE EXCEPTION 'managed employee task mutations require checked commands' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' AND OLD.property_id IS DISTINCT FROM NEW.property_id AND public.actor_needs_checked_managed_task(OLD.property_id) THEN
  RAISE EXCEPTION 'managed employee task property is immutable outside checked commands' USING ERRCODE='42501'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
REVOKE ALL ON FUNCTION public.guard_managed_task_commands() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_guard_managed_task_commands BEFORE INSERT OR UPDATE OR DELETE ON public.property_operational_tasks
 FOR EACH ROW EXECUTE FUNCTION public.guard_managed_task_commands();

CREATE FUNCTION public.create_managed_task_checked(p_task_id uuid,p_property_id uuid,p_assigned_to uuid,
 p_title text,p_task_type text,p_scheduled_date date,p_priority text DEFAULT 'normal')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE task public.property_operational_tasks;
BEGIN
 IF public.actor_can_command_managed_task(p_property_id,true) IS NOT TRUE THEN
  RAISE EXCEPTION 'scoped manager tasks authority required' USING ERRCODE='42501'; END IF;
 IF p_task_id IS NULL OR p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 1 AND 500 OR p_scheduled_date IS NULL
 OR p_task_type IS NULL OR p_task_type NOT IN ('check_in','check_out','cleaning','maintenance','inspection','meter_reading')
 OR p_priority IS NULL OR p_priority NOT IN ('low','normal','high','urgent') THEN
  RAISE EXCEPTION 'valid bounded task input required' USING ERRCODE='22023'; END IF;
 IF public.managed_task_assignee_allowed(p_property_id,p_assigned_to) IS NOT TRUE THEN
  RAISE EXCEPTION 'active same-company Space and property-authorized assignee required' USING ERRCODE='42501'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('managed-task:'||p_task_id::text,0));
 SELECT * INTO task FROM public.property_operational_tasks WHERE id=p_task_id FOR UPDATE;
 IF FOUND THEN
  IF task.property_id IS DISTINCT FROM p_property_id OR task.assigned_to IS DISTINCT FROM p_assigned_to
  OR task.title IS DISTINCT FROM btrim(p_title) OR task.task_type IS DISTINCT FROM p_task_type
  OR task.scheduled_date IS DISTINCT FROM p_scheduled_date OR task.priority IS DISTINCT FROM p_priority THEN
   RAISE EXCEPTION 'task request ID already used with different input' USING ERRCODE='22023'; END IF;
  RETURN public.managed_task_projection(task);
 END IF;
 INSERT INTO public.property_operational_tasks(id,property_id,assigned_to,title,task_type,scheduled_date,priority,status)
 VALUES(p_task_id,p_property_id,p_assigned_to,btrim(p_title),p_task_type,p_scheduled_date,p_priority,'pending') RETURNING * INTO task;
 RETURN public.managed_task_projection(task);
END $$;
REVOKE ALL ON FUNCTION public.create_managed_task_checked(uuid,uuid,uuid,text,text,date,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_managed_task_checked(uuid,uuid,uuid,text,text,date,text) TO authenticated;

CREATE FUNCTION public.assign_managed_task_checked(p_task_id uuid,p_expected_updated_at timestamptz,p_assigned_to uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE task public.property_operational_tasks;
BEGIN
 SELECT * INTO task FROM public.property_operational_tasks WHERE id=p_task_id FOR UPDATE;
 IF NOT FOUND OR public.actor_can_command_managed_task(task.property_id,true) IS NOT TRUE THEN
  RAISE EXCEPTION 'task unavailable or scoped manager authority missing' USING ERRCODE='42501'; END IF;
 IF p_expected_updated_at IS NULL OR task.updated_at IS DISTINCT FROM p_expected_updated_at THEN
  RAISE EXCEPTION 'task changed; reload before assigning' USING ERRCODE='40001'; END IF;
 IF task.status NOT IN ('pending','in_progress') THEN RAISE EXCEPTION 'task is no longer assignable' USING ERRCODE='55000'; END IF;
 IF public.managed_task_assignee_allowed(task.property_id,p_assigned_to) IS NOT TRUE THEN
  RAISE EXCEPTION 'active same-company Space and property-authorized assignee required' USING ERRCODE='42501'; END IF;
 UPDATE public.property_operational_tasks SET assigned_to=p_assigned_to WHERE id=task.id RETURNING * INTO task;
 RETURN public.managed_task_projection(task);
END $$;
REVOKE ALL ON FUNCTION public.assign_managed_task_checked(uuid,timestamptz,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.assign_managed_task_checked(uuid,timestamptz,uuid) TO authenticated;

CREATE FUNCTION public.complete_managed_task_checked(p_task_id uuid,p_expected_updated_at timestamptz,p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE task public.property_operational_tasks;
BEGIN
 IF p_notes IS NOT NULL AND length(p_notes)>20000 THEN RAISE EXCEPTION 'bounded completion notes required' USING ERRCODE='22023'; END IF;
 SELECT * INTO task FROM public.property_operational_tasks WHERE id=p_task_id FOR UPDATE;
 IF NOT FOUND OR task.assigned_to IS DISTINCT FROM auth.uid()
 OR public.actor_can_command_managed_task(task.property_id,false) IS NOT TRUE
 OR public.managed_task_assignee_allowed(task.property_id,auth.uid()) IS NOT TRUE THEN
  RAISE EXCEPTION 'current assigned task authority required' USING ERRCODE='42501'; END IF;
 IF task.status='completed' AND task.completed_by=auth.uid() AND task.notes IS NOT DISTINCT FROM p_notes THEN
  RETURN public.managed_task_projection(task); END IF;
 IF p_expected_updated_at IS NULL OR task.updated_at IS DISTINCT FROM p_expected_updated_at THEN
  RAISE EXCEPTION 'task changed; reload before completing' USING ERRCODE='40001'; END IF;
 IF task.status NOT IN ('pending','in_progress') THEN RAISE EXCEPTION 'task is no longer completable' USING ERRCODE='55000'; END IF;
 IF coalesce(task.actual_cost,0)<>0 OR task.expense_created IS TRUE THEN
  RAISE EXCEPTION 'cost-bearing task requires separate reviewed financial workflow' USING ERRCODE='55000'; END IF;
 UPDATE public.property_operational_tasks SET status='completed',completed_by=auth.uid(),completed_at=clock_timestamp(),notes=p_notes
 WHERE id=task.id RETURNING * INTO task;
 RETURN public.managed_task_projection(task);
END $$;
REVOKE ALL ON FUNCTION public.complete_managed_task_checked(uuid,timestamptz,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.complete_managed_task_checked(uuid,timestamptz,text) TO authenticated;

CREATE FUNCTION public.edit_managed_task_checked(p_task_id uuid,p_expected_updated_at timestamptz,p_patch jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE task public.property_operational_tasks; proposed public.property_operational_tasks; manager boolean; key text;
BEGIN
 IF p_patch IS NULL OR jsonb_typeof(p_patch)<>'object' OR pg_column_size(p_patch)>65536 THEN
  RAISE EXCEPTION 'bounded task patch required' USING ERRCODE='22023'; END IF;
 FOR key IN SELECT jsonb_object_keys(p_patch) LOOP
  IF key NOT IN ('title','title_ru','description','notes','scheduled_date','scheduled_time','priority','status','assigned_to') THEN
   RAISE EXCEPTION 'unsupported task field: %',key USING ERRCODE='22023'; END IF;
 END LOOP;
 SELECT * INTO task FROM public.property_operational_tasks WHERE id=p_task_id FOR UPDATE;
 IF NOT FOUND OR public.actor_can_command_managed_task(task.property_id,false) IS NOT TRUE THEN
  RAISE EXCEPTION 'current task authority required' USING ERRCODE='42501'; END IF;
 manager:=public.actor_can_command_managed_task(task.property_id,true);
 IF NOT manager AND (task.assigned_to IS DISTINCT FROM auth.uid() OR public.managed_task_assignee_allowed(task.property_id,auth.uid()) IS NOT TRUE) THEN
  RAISE EXCEPTION 'current assigned task authority required' USING ERRCODE='42501'; END IF;
 SELECT * INTO proposed FROM jsonb_populate_record(task,p_patch);
 IF proposed.status='completed' THEN
  IF EXISTS(SELECT 1 FROM jsonb_each(p_patch) entry WHERE entry.key NOT IN ('status','notes')
   AND entry.value IS DISTINCT FROM to_jsonb(task)->entry.key) THEN
   RAISE EXCEPTION 'complete separately from content or assignment edits' USING ERRCODE='22023'; END IF;
  RETURN public.complete_managed_task_checked(task.id,p_expected_updated_at,proposed.notes);
 END IF;
 IF p_expected_updated_at IS NULL OR task.updated_at IS DISTINCT FROM p_expected_updated_at THEN
  RAISE EXCEPTION 'task changed; reload before editing' USING ERRCODE='40001'; END IF;
 IF task.status NOT IN ('pending','in_progress') THEN RAISE EXCEPTION 'closed task is frozen' USING ERRCODE='55000'; END IF;
 IF NOT manager AND EXISTS(SELECT 1 FROM jsonb_each(p_patch) entry WHERE entry.key NOT IN ('status','notes')
  AND entry.value IS DISTINCT FROM to_jsonb(task)->entry.key) THEN
  RAISE EXCEPTION 'only scoped manager may edit task content or assignment' USING ERRCODE='42501'; END IF;
 IF proposed.status IS NULL OR proposed.status NOT IN ('pending','in_progress','cancelled')
 OR (NOT manager AND proposed.status NOT IN ('pending','in_progress'))
 OR proposed.title IS NULL OR length(btrim(proposed.title)) NOT BETWEEN 1 AND 500
 OR proposed.scheduled_date IS NULL OR proposed.priority IS NULL OR proposed.priority NOT IN ('low','normal','high','urgent')
 OR length(coalesce(proposed.notes,''))>20000 OR length(coalesce(proposed.description,''))>20000 THEN
  RAISE EXCEPTION 'valid bounded task content and transition required' USING ERRCODE='22023'; END IF;
 IF public.managed_task_assignee_allowed(task.property_id,proposed.assigned_to) IS NOT TRUE THEN
  RAISE EXCEPTION 'active same-company Space and property-authorized assignee required' USING ERRCODE='42501'; END IF;
 UPDATE public.property_operational_tasks SET title=btrim(proposed.title),title_ru=proposed.title_ru,
  description=proposed.description,notes=proposed.notes,scheduled_date=proposed.scheduled_date,
  scheduled_time=proposed.scheduled_time,priority=proposed.priority,status=proposed.status,assigned_to=proposed.assigned_to
 WHERE id=task.id RETURNING * INTO task;
 RETURN public.managed_task_projection(task);
END $$;
REVOKE ALL ON FUNCTION public.edit_managed_task_checked(uuid,timestamptz,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.edit_managed_task_checked(uuid,timestamptz,jsonb) TO authenticated;
COMMIT;
