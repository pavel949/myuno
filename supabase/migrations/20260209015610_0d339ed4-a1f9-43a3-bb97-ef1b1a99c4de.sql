
-- ============================================================
-- VERTICAL ↔ LIFE TASK CANONICAL MAPPING TABLE
-- ============================================================

CREATE TABLE public.vertical_life_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vertical_code text NOT NULL,
  life_task_id uuid NOT NULL REFERENCES public.life_tasks(id) ON DELETE CASCADE,
  priority_weight int NOT NULL DEFAULT 100,
  context_notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vertical_code, life_task_id)
);

CREATE INDEX idx_vlt_vertical ON public.vertical_life_tasks(vertical_code) WHERE is_active;
CREATE INDEX idx_vlt_task ON public.vertical_life_tasks(life_task_id) WHERE is_active;

ALTER TABLE public.vertical_life_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vertical_life_tasks_read_all"
  ON public.vertical_life_tasks FOR SELECT USING (true);

CREATE POLICY "vertical_life_tasks_admin_write"
  ON public.vertical_life_tasks FOR ALL
  USING (is_admin_or_uno_team());

CREATE TRIGGER update_vertical_life_tasks_updated_at
  BEFORE UPDATE ON public.vertical_life_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CANONICAL DATA: 19 verticals mapped to life_tasks
-- ============================================================

-- TRANSFER
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('transfer', '45a9a43b-d021-41d4-97c1-612d9e720052', 100, NULL),
  ('transfer', 'bf7c56ca-7e86-4ca1-9c65-021f5ca8e2b3', 100, NULL),
  ('transfer', 'c90ea603-378e-4919-9ae7-1a7323b5a0c0', 100, NULL),
  ('transfer', '3c8ee587-e873-407b-8f4e-3c62850cd0b2', 70, 'Emergency medical transport');

-- VEHICLE
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('vehicle', '7eb9092f-d3f6-4217-abe1-6d3024b07255', 100, NULL),
  ('vehicle', '9218f8de-7afe-4863-8bec-6d94cc7a9994', 40, 'Self-drive excursion option');

-- PROPERTY
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('property', 'b5b4d69d-daf1-4d4c-b6e3-bc8cca2d8f4f', 100, NULL),
  ('property', '306c1455-e791-4316-989f-775b572715ff', 100, NULL),
  ('property', '0975da73-74e1-40ce-aa6f-bc8bfdab6f45', 100, NULL),
  ('property', 'ab935aaf-e6ea-4944-86b0-4bb42b5a6999', 100, NULL),
  ('property', '00ef8bae-4f75-4d53-b777-1e25492c5573', 70, NULL),
  ('property', '2aba2b5b-17f2-439e-be7e-cfcc62f7dc87', 100, NULL),
  ('property', 'fb45874b-bc5c-4df7-b060-999c0298cca2', 100, NULL),
  ('property', '8e987d62-9a24-4863-9935-d1cabd983976', 100, NULL),
  ('property', '7430ce03-a9f7-4069-ad79-c278f743bb23', 40, 'Property comfort for retirees');

-- YACHT
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('yacht', '869a4392-cadf-432a-b096-44ead472d48e', 100, NULL),
  ('yacht', '64360de1-2d6a-4206-b360-4b6da8a9ad4e', 100, NULL),
  ('yacht', 'c2ce1ac0-a029-4184-9ab8-8b1ed9b532ba', 40, 'Yacht as unique experience');

-- TOUR
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('tour', '1580119d-a342-408f-896a-d8a4723607df', 100, NULL),
  ('tour', '99db031f-fd68-493a-abb7-b3192c27f2b0', 100, NULL),
  ('tour', '9218f8de-7afe-4863-8bec-6d94cc7a9994', 100, NULL),
  ('tour', 'c2ce1ac0-a029-4184-9ab8-8b1ed9b532ba', 70, NULL);

-- EXPERIENCE
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('experience', 'c2ce1ac0-a029-4184-9ab8-8b1ed9b532ba', 100, NULL),
  ('experience', '99db031f-fd68-493a-abb7-b3192c27f2b0', 70, NULL),
  ('experience', '99153978-598e-4c12-96f1-d31577ba048a', 70, 'Experience-driven nightlife');

-- CLEANING
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('cleaning', '54415c49-451d-4d92-b457-639708d64762', 100, NULL),
  ('cleaning', 'feb06865-8bc0-48d5-abd7-cfdbbadee5de', 100, NULL),
  ('cleaning', '7430ce03-a9f7-4069-ad79-c278f743bb23', 70, 'Cleaning as comfort service');

-- BABYSITTER
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('babysitter', 'ab859b25-087e-40f4-b9c0-4608b5053014', 100, NULL);

-- BEAUTY
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('beauty', '9367098e-04be-40d7-9bed-509265e11be7', 100, NULL),
  ('beauty', '5844aa63-6897-4283-934c-5be2070f615c', 70, 'Salon spa services');

-- RESTAURANT
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('restaurant', '37e4888c-8c9e-4772-ae85-b32fcff2ec08', 100, NULL),
  ('restaurant', 'd24d1881-9c60-4889-acc4-0847d6a93c04', 100, NULL),
  ('restaurant', 'd1bfd984-00a2-4e01-9e15-30b598052a92', 100, NULL),
  ('restaurant', '65371f20-75d6-4209-9a00-101f2853a76b', 70, 'Restaurant catering for events');

-- MEDICAL
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('medical', '052f304f-2b46-480e-9da7-3aff6f5b5f6f', 100, NULL),
  ('medical', '55e29ff8-affe-49c3-8cc0-6ba238d25bac', 70, NULL),
  ('medical', 'c4487fe3-5e12-4b88-a21d-28b2a59fe949', 100, NULL),
  ('medical', '7254da20-60ea-4546-9b9e-7e94e63be138', 100, NULL),
  ('medical', '132d4589-e1d0-46b6-9d51-a77d13e9f593', 100, NULL);

-- LEGAL
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('legal', 'c3754d11-73ee-423f-bfe1-e6afe7e0ccc6', 100, NULL),
  ('legal', 'c4a5be80-ccff-433e-9a3f-8ef193db64d6', 100, NULL),
  ('legal', '700ba024-2049-4b40-b7b6-97c6f9529c13', 70, NULL),
  ('legal', '482f93b6-22aa-45a2-b98b-a46d58e65d1c', 70, NULL),
  ('legal', '4ff91534-1f3e-4643-9bd2-6b83cea1c83a', 70, NULL),
  ('legal', '5d96503a-18e1-4764-8beb-64addc1abf53', 100, NULL),
  ('legal', '6e351fa0-853e-477a-8379-0be44c40cafa', 70, 'Close contracts on departure'),
  ('legal', '00ef8bae-4f75-4d53-b777-1e25492c5573', 70, 'Legal review of rental contract');

-- EDUCATION
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('education', 'b644bbb4-b710-41aa-955e-dcd82f4f560e', 100, NULL),
  ('education', 'e4b75a6c-7093-4b58-bbc3-30164d03f7e6', 100, NULL),
  ('education', '1578b1cb-a81a-40db-95de-6258f5ae0358', 100, NULL);

-- FITNESS
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('fitness', '81f18fe2-d37e-4fdb-b2f1-bf9cc389b7d7', 100, NULL),
  ('fitness', 'b3766622-e3fe-4c2e-99c7-8ea42e4baeaf', 100, NULL);

-- EVENT
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('event', '8d15825c-eb31-49a3-a667-54c6be04b2e3', 100, NULL),
  ('event', 'e353f47d-d219-4028-b74e-f40532526b01', 100, NULL),
  ('event', '99153978-598e-4c12-96f1-d31577ba048a', 100, NULL),
  ('event', '44e14470-0e29-4b2d-96e8-0ca57e273809', 100, NULL);

-- WATER_ACTIVITY
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('water_activity', '82027abf-8f26-49df-887b-af653af6bc70', 100, NULL),
  ('water_activity', '4f5c12a5-e530-4b3f-a7e1-71b711d361d6', 100, NULL);

-- PET_SERVICE
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('pet_service', '75db77f0-975c-4dc8-81ac-aa4f9d86802b', 100, NULL),
  ('pet_service', 'a31ebff7-0268-4a5f-8c4c-41864102e9f9', 100, NULL);

-- FLOWER
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('flower', 'd0bb66bd-d447-49d4-a974-853e866c91c8', 100, NULL);

-- INSURANCE
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('insurance', 'a1163d34-36e0-4343-951b-23d9890f0413', 100, NULL),
  ('insurance', 'aa8fec18-f5d7-4b78-ac67-342fdd34c1c6', 100, NULL),
  ('insurance', '2b200b28-2161-4201-819f-985850cfd73b', 100, NULL);

-- ============================================================
-- VALIDATION VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.vertical_task_coverage AS
SELECT
  vlt.vertical_code,
  count(*) AS task_count,
  count(*) FILTER (WHERE vlt.priority_weight >= 100) AS core_tasks,
  count(*) FILTER (WHERE vlt.priority_weight BETWEEN 50 AND 99) AS support_tasks,
  count(*) FILTER (WHERE vlt.priority_weight < 50) AS contextual_tasks,
  array_agg(DISTINCT lt.code ORDER BY lt.code) AS task_codes
FROM public.vertical_life_tasks vlt
JOIN public.life_tasks lt ON lt.id = vlt.life_task_id
WHERE vlt.is_active
GROUP BY vlt.vertical_code
ORDER BY vlt.vertical_code;

-- ============================================================
-- RPCs
-- ============================================================

-- Resolve verticals for a specific task
CREATE OR REPLACE FUNCTION public.resolve_verticals_for_task(p_task_code text)
RETURNS TABLE(vertical_code text, priority_weight int, context_notes text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT vlt.vertical_code, vlt.priority_weight, vlt.context_notes
  FROM vertical_life_tasks vlt
  JOIN life_tasks lt ON lt.id = vlt.life_task_id
  WHERE lt.code = p_task_code AND vlt.is_active AND lt.is_active
  ORDER BY vlt.priority_weight DESC;
$$;

-- Resolve tasks for a specific vertical
CREATE OR REPLACE FUNCTION public.resolve_tasks_for_vertical(p_vertical_code text)
RETURNS TABLE(task_code text, task_title_en text, task_type text, scenario_code text, situation_code text, priority_weight int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lt.code, lt.title_en, lt.task_type, lsc.code, ls.code, vlt.priority_weight
  FROM vertical_life_tasks vlt
  JOIN life_tasks lt ON lt.id = vlt.life_task_id
  JOIN life_scenarios lsc ON lsc.id = lt.life_scenario_id
  JOIN life_situations ls ON ls.id = lsc.life_situation_id
  WHERE vlt.vertical_code = p_vertical_code
    AND vlt.is_active AND lt.is_active AND lsc.is_active AND ls.is_active
  ORDER BY vlt.priority_weight DESC;
$$;

-- Resolve ranked verticals for a situation
CREATE OR REPLACE FUNCTION public.resolve_verticals_for_situation(p_situation_code text)
RETURNS TABLE(vertical_code text, max_priority int, task_count bigint, tasks text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT vlt.vertical_code, max(vlt.priority_weight)::int, count(*), array_agg(lt.code ORDER BY vlt.priority_weight DESC)
  FROM vertical_life_tasks vlt
  JOIN life_tasks lt ON lt.id = vlt.life_task_id
  JOIN life_scenarios lsc ON lsc.id = lt.life_scenario_id
  JOIN life_situations ls ON ls.id = lsc.life_situation_id
  WHERE ls.code = p_situation_code
    AND vlt.is_active AND lt.is_active AND lsc.is_active AND ls.is_active
  GROUP BY vlt.vertical_code
  ORDER BY max(vlt.priority_weight) DESC, count(*) DESC;
$$;
