-- Add investment vertical to lookup_values for lead generation
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES ('vertical', 'investment', 'Investment', 'Инвестиции', '📈', 15, true)
ON CONFLICT (lookup_type, value_key) DO NOTHING;