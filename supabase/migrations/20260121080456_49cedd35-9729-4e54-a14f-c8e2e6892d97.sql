-- Add full property management commission rule (70/30 split after expenses)
INSERT INTO public.vertical_commission_rules (vertical, base_commission, min_commission_amount, max_commission_amount, notes, is_active)
VALUES (
  'property_management',
  0.30,
  NULL,
  NULL,
  'Полное управление недвижимостью от myUNO. Распределение 70/30 после вычета расходов в пользу собственника.',
  true
)
ON CONFLICT (vertical) DO UPDATE SET
  base_commission = 0.30,
  notes = 'Полное управление недвижимостью от myUNO. Распределение 70/30 после вычета расходов в пользу собственника.',
  is_active = true,
  updated_at = now();

-- Also fix the incorrect commission rates mentioned earlier
UPDATE public.vertical_commission_rules
SET base_commission = 0.10, notes = 'Комиссия за трансферы 10%', updated_at = now()
WHERE vertical = 'transfer' AND base_commission < 0.05;

UPDATE public.vertical_commission_rules
SET base_commission = 0.15, notes = 'Комиссия за водные активности 15%', updated_at = now()
WHERE vertical = 'water_activity' AND base_commission < 0.05;