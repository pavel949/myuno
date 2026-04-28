DO $seed$
DECLARE
  groups_data jsonb := '[
    {"slug":"arrive","en":"Arrival","ru":"Прибытие","icon":"Plane","color":"#00D68F","sort":1,"vEn":"Tourists & new residents: airport, connectivity, money, getting around.","vRu":"Туристы и новые резиденты: дорога из аэропорта, связь, деньги, мобильность."},
    {"slug":"live","en":"Live","ru":"Жизнь","icon":"Home","color":"#4E7BFF","sort":2,"vEn":"Home, health, food, family, pets — everyday life sorted.","vRu":"Дом, здоровье, еда, семья, питомцы — повседневность без хаоса."},
    {"slug":"manage","en":"Manage","ru":"Управление","icon":"Building2","color":"#06B6D4","sort":3,"vEn":"Hosts & managers: bookings, money, operations.","vRu":"Собственники и управляющие: брони, финансы, операции."},
    {"slug":"invest","en":"Invest","ru":"Инвестиции","icon":"TrendingUp","color":"#A855F7","sort":4,"vEn":"Real estate: search, off-plan, resale, ROI.","vRu":"Недвижимость: каталог, новостройки, вторичка, ROI."},
    {"slug":"legal","en":"Legal & Visa","ru":"Право и визы","icon":"Scale","color":"#F59E0B","sort":5,"vEn":"Visa, taxes, contracts, insurance, banking.","vRu":"Визы, налоги, договоры, страховки, банк."},
    {"slug":"build","en":"Build","ru":"Застройщикам","icon":"HardHat","color":"#F43F5E","sort":6,"vEn":"B2B: developer portal, leads, project showcase.","vRu":"B2B: портал застройщика, лиды, витрина проектов."}
  ]'::jsonb;

  cats_data jsonb := '[
    {"cluster":"arrive","slug":"cat-emergency","en":"Emergency","ru":"Экстренные случаи","icon":"AlertTriangle","color":"#EF4444","sort":10,"jtbd":["B"],"personas":["P01_first_time_tourist","P02_repeat_tourist"]},
    {"cluster":"arrive","slug":"cat-transport","en":"Transport","ru":"Транспорт","icon":"Car","color":"#3B82F6","sort":20,"jtbd":["A"],"personas":["P01_first_time_tourist","P02_repeat_tourist","P03_long_stay_tourist"]},
    {"cluster":"arrive","slug":"cat-tourism","en":"Tourism & Activities","ru":"Туризм и активности","icon":"Compass","color":"#06B6D4","sort":30,"jtbd":["A","D"],"personas":["P01_first_time_tourist","P02_repeat_tourist","P16_athlete_training"]},
    {"cluster":"live","slug":"cat-home-living","en":"Home & Living","ru":"Дом и быт","icon":"Home","color":"#10B981","sort":40,"jtbd":["C"],"personas":["P03_long_stay_tourist","P04_digital_nomad","P05_remote_worker_family","P14_medical_tourist"]},
    {"cluster":"live","slug":"cat-food-entertainment","en":"Food & Entertainment","ru":"Еда и развлечения","icon":"Utensils","color":"#F59E0B","sort":50,"jtbd":["D"],"personas":["P02_repeat_tourist","P03_long_stay_tourist","P04_digital_nomad"]},
    {"cluster":"live","slug":"cat-health-wellness","en":"Health & Wellness","ru":"Здоровье и велнес","icon":"Stethoscope","color":"#EC4899","sort":60,"jtbd":["D"],"personas":["P04_digital_nomad","P05_remote_worker_family","P14_medical_tourist","P19_accessibility_needs"]},
    {"cluster":"live","slug":"cat-family-kids","en":"Family & Kids","ru":"Семья и дети","icon":"Baby","color":"#F472B6","sort":70,"jtbd":["D"],"personas":["P05_remote_worker_family","P08_relocator_family"]},
    {"cluster":"live","slug":"cat-pet-services","en":"Pet Services","ru":"Сервисы для питомцев","icon":"PawPrint","color":"#A78BFA","sort":80,"jtbd":["D"],"personas":["P11_student"]},
    {"cluster":"live","slug":"cat-sports","en":"Sports & Athletic","ru":"Спорт и тренировки","icon":"Dumbbell","color":"#22C55E","sort":90,"jtbd":["D"],"personas":["P16_athlete_training"]},
    {"cluster":"live","slug":"cat-community","en":"Community","ru":"Сообщество","icon":"Users","color":"#0EA5E9","sort":100,"jtbd":["D"],"personas":["P03_long_stay_tourist","P04_digital_nomad"]},
    {"cluster":"live","slug":"cat-wedding-events","en":"Wedding & Events","ru":"Свадьбы и события","icon":"CalendarDays","color":"#F43F5E","sort":110,"jtbd":["D"],"personas":["P15_wedding_couple"]},
    {"cluster":"invest","slug":"cat-real-estate","en":"Real Estate","ru":"Недвижимость","icon":"Building2","color":"#8B5CF6","sort":120,"jtbd":["F","G","H"],"personas":["P06_snowbird","P07_retiree","P20_passive_investor","P21_active_investor","P23_property_owner"]},
    {"cluster":"legal","slug":"cat-business-legal","en":"Business & Legal","ru":"Бизнес и право","icon":"Scale","color":"#6366F1","sort":130,"jtbd":["E","I"],"personas":["P12_business_owner_local","P13_employee_expat"]},
    {"cluster":"legal","slug":"cat-finance","en":"Finance","ru":"Финансы","icon":"DollarSign","color":"#14B8A6","sort":140,"jtbd":["E"],"personas":["P12_business_owner_local"]},
    {"cluster":"legal","slug":"cat-halal-faith","en":"Halal & Faith","ru":"Халяль и вероисповедание","icon":"Heart","color":"#84CC16","sort":150,"jtbd":["D"],"personas":["P17_halal_traveler"]},
    {"cluster":"build","slug":"cat-partner-portal","en":"Partner Portal","ru":"Партнёры и B2B","icon":"Building","color":"#F97316","sort":160,"jtbd":["J"],"personas":["P22_developer_partner","P25_service_vendor"]}
  ]'::jsonb;

  svcs_data jsonb := '[
    {"cat":"cat-emergency","slug":"sos","en":"SOS","ru":"SOS","icon":"AlertTriangle","path":"/sos","status":"available"},
    {"cat":"cat-emergency","slug":"vip-concierge","en":"VIP Concierge","ru":"VIP-консьерж","icon":"Sparkles","path":"/vip-concierge","status":"available"},
    {"cat":"cat-emergency","slug":"support","en":"Support","ru":"Поддержка","icon":"ClipboardList","path":"/support","status":"available"},
    {"cat":"cat-transport","slug":"transfer","en":"Transfers","ru":"Трансферы","icon":"Car","path":"/airport-transfer","status":"available"},
    {"cat":"cat-transport","slug":"fast-track","en":"Fast Track","ru":"Fast Track","icon":"Zap","path":"/fast-track","status":"available"},
    {"cat":"cat-transport","slug":"vehicle","en":"Car & bike","ru":"Авто и байки","icon":"Car","path":"/transport","status":"available"},
    {"cat":"cat-transport","slug":"sim","en":"SIM cards","ru":"SIM-карты","icon":"Smartphone","path":"/sim","status":"available"},
    {"cat":"cat-transport","slug":"exchange","en":"Exchange","ru":"Курсы валют","icon":"ArrowLeftRight","path":"/exchange","status":"available"},
    {"cat":"cat-tourism","slug":"experience","en":"Experiences","ru":"Впечатления","icon":"Compass","path":"/experiences","status":"available"},
    {"cat":"cat-tourism","slug":"tours","en":"Tours","ru":"Туры","icon":"Route","path":"/experiences?type=tour","status":"available"},
    {"cat":"cat-tourism","slug":"water","en":"Water & activities","ru":"Вода и активности","icon":"Waves","path":"/experiences?type=activity","status":"available"},
    {"cat":"cat-tourism","slug":"yacht","en":"Yachts","ru":"Яхты","icon":"Anchor","path":"/yachts","status":"available"},
    {"cat":"cat-tourism","slug":"event","en":"Events","ru":"События","icon":"CalendarDays","path":"/events","status":"available"},
    {"cat":"cat-home-living","slug":"cleaning","en":"Cleaning","ru":"Уборка","icon":"Sparkles","path":"/cleaning","status":"available"},
    {"cat":"cat-home-living","slug":"services","en":"Services hub","ru":"Все услуги","icon":"Wrench","path":"/services","status":"available"},
    {"cat":"cat-home-living","slug":"laundry","en":"Laundry","ru":"Прачечная","icon":"Package","path":"/services?category=laundry","status":"available"},
    {"cat":"cat-home-living","slug":"handyman","en":"Handyman","ru":"Мастер на час","icon":"Hammer","path":"/services?category=handyman","status":"available"},
    {"cat":"cat-home-living","slug":"plumbing","en":"Plumbing","ru":"Сантехника","icon":"Wrench","path":"/services?category=plumbing","status":"available"},
    {"cat":"cat-home-living","slug":"electrical","en":"Electrical","ru":"Электрика","icon":"Zap","path":"/services?category=electrical","status":"available"},
    {"cat":"cat-home-living","slug":"ac-repair","en":"AC repair","ru":"Кондиционеры","icon":"Wind","path":"/services?category=ac-repair","status":"available"},
    {"cat":"cat-home-living","slug":"gardening","en":"Gardening","ru":"Сад","icon":"TreePine","path":"/services?category=gardening","status":"available"},
    {"cat":"cat-home-living","slug":"pest-control","en":"Pest control","ru":"Дезинсекция","icon":"Bug","path":"/services?category=pest-control","status":"available"},
    {"cat":"cat-home-living","slug":"locksmith","en":"Locksmith","ru":"Замки","icon":"KeyRound","path":"/services?category=locksmith","status":"available"},
    {"cat":"cat-home-living","slug":"storage","en":"Storage","ru":"Хранение","icon":"Warehouse","path":"/services?category=storage","status":"available"},
    {"cat":"cat-home-living","slug":"flowers","en":"Flowers","ru":"Цветы","icon":"Sparkles","path":"/flowers","status":"available"},
    {"cat":"cat-food-entertainment","slug":"restaurants","en":"Restaurants","ru":"Рестораны","icon":"Utensils","path":"/restaurants","status":"available"},
    {"cat":"cat-food-entertainment","slug":"market","en":"Market","ru":"Маркет","icon":"ShoppingBag","path":"/market","status":"available"},
    {"cat":"cat-food-entertainment","slug":"delivery","en":"Delivery","ru":"Доставка","icon":"Truck","path":"/delivery","status":"available"},
    {"cat":"cat-health-wellness","slug":"medical","en":"Medical","ru":"Медицина","icon":"Stethoscope","path":"/medical","status":"available"},
    {"cat":"cat-health-wellness","slug":"pharmacy","en":"Pharmacy","ru":"Аптеки","icon":"Bandage","path":"/pharmacy","status":"available"},
    {"cat":"cat-health-wellness","slug":"beauty-spa","en":"Beauty","ru":"Красота","icon":"Palette","path":"/beauty","status":"available"},
    {"cat":"cat-health-wellness","slug":"insurance","en":"Insurance","ru":"Страховка","icon":"Shield","path":"/insurance","status":"available"},
    {"cat":"cat-family-kids","slug":"babysitter","en":"Babysitters","ru":"Няни","icon":"Baby","path":"/babysitter","status":"available"},
    {"cat":"cat-family-kids","slug":"school-finder","en":"School finder","ru":"Школы","icon":"Search","path":"/school-finder","status":"available"},
    {"cat":"cat-family-kids","slug":"education-expat","en":"Education","ru":"Образование","icon":"GraduationCap","path":"/education","status":"available"},
    {"cat":"cat-family-kids","slug":"kids","en":"Kids","ru":"Дети","icon":"Baby","path":"/kids","status":"available"},
    {"cat":"cat-pet-services","slug":"pets","en":"Pets","ru":"Питомцы","icon":"PawPrint","path":"/pets","status":"available"},
    {"cat":"cat-pet-services","slug":"veterinary","en":"Veterinary","ru":"Ветеринары","icon":"Bandage","path":"/veterinary","status":"available"},
    {"cat":"cat-sports","slug":"fitness","en":"Fitness","ru":"Фитнес","icon":"Dumbbell","path":"/fitness","status":"available"},
    {"cat":"cat-community","slug":"community","en":"Community","ru":"Сообщество","icon":"Users","path":"/","status":"soon"},
    {"cat":"cat-wedding-events","slug":"wedding","en":"Weddings","ru":"Свадьбы","icon":"CalendarDays","path":"/wedding","status":"available"},
    {"cat":"cat-real-estate","slug":"property","en":"Property","ru":"Поиск","icon":"Search","path":"/property","status":"available"},
    {"cat":"cat-real-estate","slug":"real-estate","en":"Property full","ru":"Недвижимость","icon":"Building2","path":"/property","status":"available"},
    {"cat":"cat-real-estate","slug":"rent-short","en":"Short rent","ru":"Краткосрочная аренда","icon":"KeyRound","path":"/property/rent/short-term","status":"available"},
    {"cat":"cat-real-estate","slug":"rent-long","en":"Long rent","ru":"Долгосрочная аренда","icon":"Home","path":"/property/rent/long-term","status":"available"},
    {"cat":"cat-real-estate","slug":"offplan","en":"Off-plan","ru":"Новостройки","icon":"Building2","path":"/property/offplan","status":"available"},
    {"cat":"cat-real-estate","slug":"resale","en":"Resale","ru":"Вторичка","icon":"Building2","path":"/property/resale","status":"available"},
    {"cat":"cat-real-estate","slug":"developers","en":"Developers","ru":"Застройщики","icon":"Users","path":"/property/developers","status":"available"},
    {"cat":"cat-real-estate","slug":"roi-hub","en":"ROI Hub","ru":"ROI Hub","icon":"BarChart3","path":"/invest","status":"available"},
    {"cat":"cat-real-estate","slug":"due-diligence","en":"Due Diligence","ru":"Due Diligence","icon":"Shield","path":"/invest","status":"soon"},
    {"cat":"cat-business-legal","slug":"visa","en":"Visas","ru":"Визы","icon":"Globe","path":"/visa/immigration","status":"available"},
    {"cat":"cat-business-legal","slug":"legal","en":"Legal","ru":"Юристы","icon":"Scale","path":"/legal","status":"available"},
    {"cat":"cat-business-legal","slug":"contract-ai","en":"ContractAI","ru":"ContractAI","icon":"FileSearch","path":"/contract-analysis","status":"available"},
    {"cat":"cat-business-legal","slug":"relocate","en":"Relocation","ru":"Релокация","icon":"Briefcase","path":"/relocate","status":"available"},
    {"cat":"cat-business-legal","slug":"knowledge","en":"Knowledge","ru":"База знаний","icon":"BookOpen","path":"/knowledge","status":"available"},
    {"cat":"cat-finance","slug":"banking","en":"Banking","ru":"Банк","icon":"Landmark","path":"/banking","status":"available"},
    {"cat":"cat-finance","slug":"tax","en":"Taxes","ru":"Налоги","icon":"Calculator","path":"/tax","status":"available"},
    {"cat":"cat-halal-faith","slug":"faith","en":"Faith","ru":"Вероисповедание","icon":"Heart","path":"/","status":"soon"},
    {"cat":"cat-partner-portal","slug":"developer-portal","en":"Portal","ru":"Портал","icon":"Building","path":"/developer/portal","status":"available"},
    {"cat":"cat-partner-portal","slug":"program","en":"Program","ru":"Программа","icon":"LineChart","path":"/for/real-estate-developers","status":"available"},
    {"cat":"cat-partner-portal","slug":"newbuilds","en":"Showcase","ru":"Витрина","icon":"Building2","path":"/newbuilds","status":"available"},
    {"cat":"cat-partner-portal","slug":"advisory","en":"Advisory","ru":"Консультация","icon":"PenTool","path":"/property/consultation","status":"available"}
  ]'::jsonb;

  g jsonb; c jsonb; s jsonb;
  jtbd_arr jtbd_cluster[]; pers_arr app_persona[];
  cluster_group_id uuid; parent_cat_id uuid;
BEGIN
  FOR g IN SELECT * FROM jsonb_array_elements(groups_data) LOOP
    INSERT INTO public.category_groups (slug, name_en, name_ru, icon, color, sort_order, is_active, is_surface, surface_id, description_en, description_ru)
    VALUES (g->>'slug', g->>'en', g->>'ru', g->>'icon', g->>'color', (g->>'sort')::int, true, true, g->>'slug', g->>'vEn', g->>'vRu')
    ON CONFLICT (slug) DO UPDATE SET
      name_en=EXCLUDED.name_en, name_ru=EXCLUDED.name_ru, icon=EXCLUDED.icon, color=EXCLUDED.color,
      sort_order=EXCLUDED.sort_order, is_active=true, is_surface=true, surface_id=EXCLUDED.surface_id,
      description_en=EXCLUDED.description_en, description_ru=EXCLUDED.description_ru;
  END LOOP;

  FOR c IN SELECT * FROM jsonb_array_elements(cats_data) LOOP
    SELECT id INTO cluster_group_id FROM public.category_groups WHERE slug = c->>'cluster';
    SELECT array_agg(x::jtbd_cluster) INTO jtbd_arr FROM jsonb_array_elements_text(c->'jtbd') x;
    SELECT array_agg(x::app_persona) INTO pers_arr FROM jsonb_array_elements_text(c->'personas') x;

    INSERT INTO public.categories (slug, name_en, name_ru, icon, color, group_id, sort_order, is_active, app_path, jtbd_clusters, persona_codes, status, parent_id)
    VALUES (c->>'slug', c->>'en', c->>'ru', c->>'icon', c->>'color', cluster_group_id, (c->>'sort')::int, true, NULL, COALESCE(jtbd_arr,'{}'::jtbd_cluster[]), COALESCE(pers_arr,'{}'::app_persona[]), 'available', NULL)
    ON CONFLICT (slug) DO UPDATE SET
      name_en=EXCLUDED.name_en, name_ru=EXCLUDED.name_ru, icon=EXCLUDED.icon, color=EXCLUDED.color,
      group_id=EXCLUDED.group_id, sort_order=EXCLUDED.sort_order, is_active=true,
      jtbd_clusters=EXCLUDED.jtbd_clusters, persona_codes=EXCLUDED.persona_codes,
      status='available', parent_id=NULL;
  END LOOP;

  FOR s IN SELECT * FROM jsonb_array_elements(svcs_data) LOOP
    SELECT id, group_id, jtbd_clusters, persona_codes
      INTO parent_cat_id, cluster_group_id, jtbd_arr, pers_arr
      FROM public.categories WHERE slug = s->>'cat' LIMIT 1;

    INSERT INTO public.categories (slug, name_en, name_ru, icon, color, group_id, parent_id, sort_order, is_active, app_path, jtbd_clusters, persona_codes, status)
    VALUES (s->>'slug', s->>'en', s->>'ru', s->>'icon', NULL, cluster_group_id, parent_cat_id, 0, true, s->>'path', COALESCE(jtbd_arr,'{}'::jtbd_cluster[]), COALESCE(pers_arr,'{}'::app_persona[]), s->>'status')
    ON CONFLICT (slug) DO UPDATE SET
      name_en=EXCLUDED.name_en, name_ru=EXCLUDED.name_ru, icon=EXCLUDED.icon,
      group_id=EXCLUDED.group_id, parent_id=EXCLUDED.parent_id, is_active=true,
      app_path=EXCLUDED.app_path, jtbd_clusters=EXCLUDED.jtbd_clusters,
      persona_codes=EXCLUDED.persona_codes, status=EXCLUDED.status;
  END LOOP;
END $seed$;