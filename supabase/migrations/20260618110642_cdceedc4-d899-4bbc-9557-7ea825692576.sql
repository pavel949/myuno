-- Wave 1.1: populate `manage` cluster with PMS categories
-- Adds 4 missing categories so owner/vendor scenarios stop hitting "0 categories in manage"

DO $$
DECLARE
  manage_group_id uuid;
BEGIN
  SELECT id INTO manage_group_id FROM public.category_groups WHERE slug = 'manage' LIMIT 1;
  IF manage_group_id IS NULL THEN
    RAISE EXCEPTION 'category_groups slug=manage not found';
  END IF;

  INSERT INTO public.categories (slug, name_en, name_ru, group_id, icon, sort_order, is_active, status)
  VALUES
    ('maintenance',         'Maintenance',         'Обслуживание',          manage_group_id, 'Wrench',   10, true, 'available'),
    ('garden',              'Garden & Landscape',  'Сад и ландшафт',        manage_group_id, 'Trees',    20, true, 'available'),
    ('accounting',          'Accounting & Tax',    'Бухгалтерия и налоги',  manage_group_id, 'Calculator', 30, true, 'available'),
    ('channel-management',  'Channel Management',  'Канал-менеджмент',      manage_group_id, 'Network',  40, true, 'available')
  ON CONFLICT (slug) DO UPDATE
    SET group_id = EXCLUDED.group_id,
        is_active = true;
END $$;
