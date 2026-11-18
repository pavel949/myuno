"""Build a bounded publication/rollback patch from the reviewed manifest + snapshot.

Does not connect to a database. Uses the committed reviewed snapshot and manifest.
The generated publication is activated after the frontend and assets are live.
"""
import json
from pathlib import Path

rows = json.loads(Path('scripts/content/phuket-discovery-20261118.json').read_text())
before = json.loads(Path('docs/content/evidence/2026-11-18-phuket-discovery-before.json').read_text())
assert len(rows) == 9 and len(before) == 8
assert len({r['id'] for r in rows}) == 9
version = 'phuket-discovery-20261118'

def sql(value):
    return "'" + str(value).replace("'", "''") + "'"

def jsonsql(value):
    return sql(json.dumps(value, ensure_ascii=False)) + '::jsonb'

payload = []
for row in rows:
    attrs = {
        'status': 'published', 'discovery_only': True, 'content_version': version,
        'experience_type': row['experience_type'], 'location_name': row['location_name'],
        'source_page_url': row['source_page_url'], 'photo_source_url': row['photo_source_url'],
        # Never expose an actionable supplier booking handoff; keep provenance separately.
        'booking_url': None, 'external_link': None,
        'short_description': None, 'long_description': None,
        'duration_minutes': None, 'min_participants': None, 'max_participants': None,
        'available_days': [], 'start_times': [], 'source_type': 'editorial',
    }
    payload.append({**row, 'cover_image': 'https://www.myuno.app' + row['asset_path'], 'attrs': attrs})

categories = [
    ('zipline', 'Zipline', 'Зиплайн', '🪂'),
    ('waterpark', 'Water Parks', 'Аквапарки', '🌊'),
    ('karting', 'Karting', 'Картинг', '🏎️'),
    ('laser-tag', 'Laser Tag', 'Лазертаг', '🎯'),
    ('cooking-class', 'Cooking Classes', 'Кулинарные мастер-классы', '🍳'),
    ('shows', 'Shows', 'Вечерние шоу', '🎭'),
]
expected = ','.join('(' + sql(r['id']) + '::uuid,' + sql(r['updated_at']) + '::timestamptz)' for r in before)
data = jsonsql(payload)
publication = f"""-- Owner-authorised content activation; no schema/RLS/commercial writer changes.
-- Requires reviewed frontend discovery_only support and all nine assets already live.
BEGIN;
DO $guard$ BEGIN
 IF (SELECT count(*) FROM public.listings l JOIN (VALUES {expected}) e(id,ts) ON l.id=e.id AND l.updated_at=e.ts WHERE l.vertical='experience') <> 8 THEN
  RAISE EXCEPTION 'Catalogue changed since audit; re-read before publication';
 END IF;
 IF EXISTS (SELECT 1 FROM public.listings WHERE vertical='experience' AND (name_en ILIKE '%PowerDrive%' OR attributes->>'source_page_url' ILIKE '%powerdrive%')) THEN
  RAISE EXCEPTION 'PowerDrive already exists; reconcile identity before publication';
 END IF;
END $guard$;
"""
for index, (slug, en, ru, icon) in enumerate(categories):
    publication += f"INSERT INTO public.experience_categories(slug,name_en,name_ru,icon,experience_type,sort_order,is_active) VALUES ({sql(slug)},{sql(en)},{sql(ru)},{sql(icon)},'activity',{30+index},true) ON CONFLICT (slug) DO NOTHING;\n"
publication += f"""
DO $content$
DECLARE changed integer;
BEGIN
 WITH data AS (SELECT * FROM jsonb_to_recordset({data}) AS r(id uuid,name_en text,name_ru text,description_en text,description_ru text,category text,cover_image text,attrs jsonb))
 UPDATE public.listings l SET name_en=r.name_en,name_ru=r.name_ru,description_en=r.description_en,description_ru=r.description_ru,
 category=r.category,cover_image=r.cover_image,images=ARRAY[]::text[],price=NULL,price_period=NULL,rating=0,review_count=0,
 lat=NULL,lng=NULL,is_active=true,is_featured=false,is_verified=false,approval_status='approved',
 attributes=coalesce(l.attributes,'{{}}'::jsonb)||r.attrs||jsonb_build_object('content_published_at',now()),updated_at=now()
 FROM data r WHERE l.id=r.id AND l.vertical='experience';
 GET DIAGNOSTICS changed = ROW_COUNT;
 IF changed <> 8 THEN RAISE EXCEPTION 'Expected eight retained records, got %', changed; END IF;
 WITH data AS (SELECT * FROM jsonb_to_recordset({data}) AS r(id uuid,slug text,name_en text,name_ru text,description_en text,description_ru text,category text,cover_image text,attrs jsonb))
 INSERT INTO public.listings(id,vertical,slug,name_en,name_ru,description_en,description_ru,category,cover_image,images,price,rating,review_count,is_active,is_featured,is_verified,approval_status,attributes)
 SELECT id,'experience',slug,name_en,name_ru,description_en,description_ru,category,cover_image,ARRAY[]::text[],NULL,0,0,true,false,false,'approved',attrs||jsonb_build_object('content_published_at',now()) FROM data WHERE id='5e56ab2c-683b-4fd2-a392-a971b6b71d73';
 GET DIAGNOSTICS changed = ROW_COUNT;
 IF changed <> 1 THEN RAISE EXCEPTION 'Expected one new PowerDrive record'; END IF;
END $content$;
COMMIT;
SELECT id,name_en,category,approval_status,attributes->>'status' AS status FROM public.listings WHERE attributes->>'content_version'={sql(version)} ORDER BY name_en;
"""
Path('scripts/content/publish-phuket-discovery-20261118.sql').write_text(publication)

restore_fields = ['name_en','name_ru','description_en','description_ru','category','slug','cover_image','images','lat','lng','price','price_period','rating','review_count','is_active','is_featured','is_verified','approval_status','attributes']
rollback = "-- Restore only this content tranche; do not overwrite subsequent editorial changes.\nBEGIN;\n"
for row in before:
    assignments = []
    for field in restore_fields:
        value = row[field]
        if field == 'attributes': rendered = jsonsql(value)
        elif field == 'images': rendered = 'ARRAY[' + ','.join(sql(v) for v in value or []) + ']::text[]'
        elif value is None: rendered = 'NULL'
        elif isinstance(value, bool): rendered = str(value).lower()
        else: rendered = sql(value)
        assignments.append(field + '=' + rendered)
    rollback += 'UPDATE public.listings SET ' + ','.join(assignments) + ",updated_at=now() WHERE id=" + sql(row['id']) + " AND attributes->>'content_version'=" + sql(version) + " AND updated_at=(attributes->>'content_published_at')::timestamptz;\n"
rollback += f"UPDATE public.listings SET is_active=false,approval_status='pending',attributes=attributes||'{{\"status\":\"draft\"}}'::jsonb,updated_at=now() WHERE id='5e56ab2c-683b-4fd2-a392-a971b6b71d73' AND attributes->>'content_version'={sql(version)} AND updated_at=(attributes->>'content_published_at')::timestamptz;\n"
rollback += "-- Categories remain as reusable taxonomy; no unrelated entry is removed.\nCOMMIT;\n"
Path('docs/content/rollback-phuket-discovery-20261118.sql').write_text(rollback)
print('Prepared publication for 8 retained + 1 new experience; 6 category slugs; bounded rollback.')
