INSERT INTO public.life_tasks (life_scenario_id, code, title_en, title_ru, task_type, priority, is_active)
VALUES
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.checkin_checkout', 'Guest check-in / check-out', 'Заезд / выезд гостей', 'service', 80, true),
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.cleaning', 'Cleaning & housekeeping', 'Уборка и клининг', 'service', 75, true),
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.meters', 'Utility meter readings', 'Показания счётчиков', 'service', 60, true),
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.deposits', 'Security deposits', 'Депозиты и залоги', 'service', 55, true),
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.taxes', 'Property taxes', 'Налоги на недвижимость', 'info', 50, true),
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.inspection', 'Property inspection', 'Инспекция объекта', 'service', 45, true)
ON CONFLICT (code) DO NOTHING;