
-- Add recipe column to marketplace_products
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS recipe jsonb DEFAULT NULL;

-- Recipe structure: { "dish": "Tom Yum", "dish_ru": "Том Ям", "time_mins": 20, "difficulty": "easy", "image": "url", "tip": "Add at the end" }

COMMENT ON COLUMN marketplace_products.recipe IS 'Optional recipe info: dish name, cooking time, difficulty (easy/medium/hard), tip';
