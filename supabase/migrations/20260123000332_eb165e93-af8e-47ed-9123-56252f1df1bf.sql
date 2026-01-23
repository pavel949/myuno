-- Generate notifications for existing pending owner_properties
-- These were created before the trigger was installed

INSERT INTO notifications (user_id, title, body, type, data, is_read)
SELECT 
  ur.user_id,
  '🏠 Новый объект на модерации',
  'Объект "' || COALESCE(op.title, op.title_ru, 'Без названия') || '" ожидает проверки.',
  'property_submission',
  jsonb_build_object(
    'property_id', op.id,
    'property_title', COALESCE(op.title, op.title_ru, 'Без названия'),
    'owner_id', op.owner_id
  ),
  false
FROM owner_properties op
CROSS JOIN user_roles ur
WHERE op.approval_status = 'pending'
AND ur.role IN ('admin', 'uno_team')
ON CONFLICT DO NOTHING;