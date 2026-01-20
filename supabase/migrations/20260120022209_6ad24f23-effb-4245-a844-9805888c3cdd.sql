-- Update Water Sports naming in categories
UPDATE public.categories 
SET name_en = 'Water Sports', name_ru = 'Водный спорт'
WHERE slug = 'water';

-- Update Water Sports naming in category_groups
UPDATE public.category_groups 
SET name_en = 'Water Sports', name_ru = 'Водный спорт'
WHERE slug = 'water';