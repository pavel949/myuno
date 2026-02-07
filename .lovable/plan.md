

# Enrich All Experience & Activity Descriptions with Real Data

## Problem

Most experiences in the database have bare 1-line descriptions (e.g., "Thailand's largest water park in Phuket with thrilling slides"), missing operating hours, exact addresses, who it's ideal for, what to expect, includes/excludes, and highlights. This makes the detail pages feel thin and unconvincing.

## What We'll Do

Run a single large SQL migration to UPDATE all ~30 active experiences with:
- **Rich `description_en` and `description_ru`** (3-5 sentences covering what it is, who it's for, what to expect)
- **`long_description`** (detailed 2-3 paragraph text with practical info)
- **`start_times` and `available_days`** (real operating hours)
- **`meeting_point`** with exact address
- **`external_link` / `booking_url`** (official website)
- **`highlights`** (3-5 key selling points as JSON array)
- **`includes` / `excludes`** (what's in the price)
- **`age_restriction`** where relevant
- **GPS coordinates** (`meeting_point_lat`, `meeting_point_lng`)

No frontend changes needed -- the ExperienceDetail page already renders all these fields.

---

## Data to Update (Activities)

### 1. Andamanda Water Park
- **Hours**: 10:00-19:00 daily
- **Address**: 888 Moo 3, Kathu, Phuket 83120
- **GPS**: 7.9156, 98.3465
- **Booking**: https://www.andamandaphuket.com
- **Description**: Thailand's biggest themed waterpark with 6 immersive zones inspired by Thai mythology. Features over 25 rides including Southeast Asia's longest lazy river, a massive wave pool, family splash zones, and adrenaline slides up to 20m high. Perfect for families with children of all ages -- toddler pools to extreme slides. Full-day entertainment with on-site restaurants, lockers, and cabanas.
- **Highlights**: 6 themed zones, 25+ rides & slides, Wave pool & lazy river, Toddler-safe splash area, On-site dining & cabanas
- **Includes**: Full-day access, Locker, Towel
- **Excludes**: Food & drinks, Cabana rental, Photos
- **Best for**: Families, kids 3+, couples, groups

### 2. Splash Jungle Water Park
- **Hours**: 10:00-17:45 daily
- **Address**: 65 Soi Mai Khao 4, Mai Khao, Thalang, Phuket 83110
- **GPS**: 8.1690, 98.3036
- **Booking**: https://www.splashjunglewaterpark.com
- **Description**: Family water park on Mai Khao Beach with wave pool, lazy river, kids aqua play zone, and thrilling Boomerango slide. Smaller and more intimate than Andamanda -- great for younger kids (2-10 years). Located inside the Centara Seaview Resort area. Features heated Jacuzzis, a swim-up bar, and direct beach access.
- **Highlights**: Boomerango slide, Kids aqua play zone, Wave pool, Swim-up bar, Beach access
- **Includes**: All-day access, Locker
- **Excludes**: Towel rental (100 THB), Food & drinks

### 3. Blue Tree Phuket
- **Hours**: 09:00-21:00 daily
- **Address**: 4/2 Srisoonthorn Rd, Cherng Talay, Thalang, Phuket 83110
- **GPS**: 7.9845, 98.3129
- **Booking**: https://bluetree.fun
- **Description**: A vibrant family lifestyle complex centered around a stunning blue lagoon. Features cliff jumping (3m-12m), water slides, kids splash zone, fitness areas, and a family-friendly shopping & dining district. Not just a waterpark -- it's a full-day destination with restaurants, shops, and entertainment. Open until 9 PM so you can enjoy sunset drinks by the lagoon.
- **Highlights**: Lagoon with cliff jumping (3-12m), Kids splash zone, Shopping & dining district, Open until 9 PM, Fitness & wellness zone
- **Includes**: Lagoon access
- **Excludes**: Cliff jump sessions (extra), Food & drinks, Equipment rental

### 4. Baan Teelanka (Upside Down House)
- **Hours**: 09:00-18:30 daily
- **Address**: 51/11 Chalermprakiat Ror 9 Rd, Chalong, Phuket 83130
- **GPS**: 7.8416, 98.3360
- **Booking**: https://www.baanteelanka.com
- **Description**: A quirky interactive museum where the entire house is built upside down -- walk on ceilings, pose with furniture dangling above, and capture mind-bending photos. Also features a challenging garden maze and mini-golf course. Perfect for families with kids 4+ and anyone who loves Instagram-worthy photo ops. Allow about 90 minutes for all attractions.
- **Highlights**: Upside-down house with furniture, Garden maze challenge, Mini-golf course, Interactive photo spots, Gift shop
- **Includes**: Entry to all 3 attractions (house, maze, mini-golf)
- **Excludes**: Food & drinks, Professional photography

### 5. Phuket Trickeye Museum
- **Hours**: 10:00-19:00 daily
- **Address**: 130/1 Phang Nga Rd, Talat Yai, Mueang Phuket, Phuket 83000
- **GPS**: 7.8849, 98.3889
- **Booking**: https://www.phuket3dmuseum.com
- **Description**: Interactive 3D art museum in Phuket Old Town with over 100 optical illusion paintings you can pose with. Zones include underwater worlds, dinosaurs, space, and classic art parodies. Each painting is designed for you to step inside and create hilarious, shareable photos. Great rainy-day activity for families, couples, and groups. Air-conditioned, fully indoor.
- **Highlights**: 100+ interactive 3D paintings, 10 themed zones, Air-conditioned indoor venue, Perfect rainy-day activity, Located in Old Town
- **Includes**: Museum entry, Photo opportunities
- **Excludes**: Printed photos, Food & drinks

### 6. Go-Kart Speedway (Kathu)
- **Hours**: 09:00-19:00 daily
- **Address**: 46/158 Moo 6, Phrabaramee Rd, Kathu, Phuket 83120
- **GPS**: 7.9050, 98.3250
- **Booking**: https://www.phuketkartspeedway.com
- **Description**: Open-air go-kart track in Kathu with karts for all ages and skill levels. Choose from kids' karts (5+ years), standard 160cc karts, or powerful 270cc racing karts for experienced drivers. 10-minute sessions on a purpose-built circuit with hairpin turns and long straights. Located opposite Tiger Kingdom -- easy to combine both in one visit. No experience needed; helmets provided.
- **Highlights**: Kids karts (age 5+), 160cc & 270cc adult karts, 10-min sessions, Opposite Tiger Kingdom, No experience needed
- **Includes**: Kart rental, Helmet, Safety briefing
- **Excludes**: Racing suit, Photos, Drinks

### 7. Flying Hanuman
- **Hours**: 08:00-17:00 daily (last session 15:00)
- **Address**: 89/16 Moo 6, Soi Namtok Kathu, Kathu, Phuket 83120
- **GPS**: 7.9270, 98.3290
- **Booking**: https://www.flyinghanuman.com
- **Description**: Premium zipline adventure through 300-year-old rainforest canopy in Kathu. 28 platforms connected by ziplines, sky bridges, spiral staircases, and abseiling stations spanning over 1.5 km. Professional safety equipment and trained guides at every station. Suitable for ages 4+ (kids course available). The most scenic zipline in Phuket with views over the jungle canopy and waterfall. Allow 3-4 hours for the full experience including transfer.
- **Highlights**: 28 platforms over 1.5 km, 300-year-old rainforest, Sky bridges & abseiling, Kids course (age 4+), Waterfall viewpoint
- **Includes**: Hotel transfer, Equipment, Guide, Insurance, Light refreshments
- **Excludes**: Photos & video package (extra), Lunch

### 8. Dino Park Mini Golf
- **Hours**: 10:00-23:00 (Oct-May), 10:00-22:00 (Jun-Sep)
- **Address**: 43 Karon Rd, Kata Beach, Karon, Phuket 83100
- **GPS**: 7.8217, 98.2978
- **Booking**: https://www.dinopark.com
- **Description**: Jurassic-themed 18-hole mini-golf course at Kata Beach with life-size animatronic dinosaurs throughout. The course winds through lush tropical gardens with caves, waterfalls, and erupting volcanoes. On-site restaurant and bar with panoramic views -- perfect for a sunset round followed by dinner. Family-friendly for all ages; popular evening activity. Open late!
- **Highlights**: 18-hole themed course, Life-size dinosaur models, Caves & waterfalls, On-site restaurant & bar, Open until late
- **Includes**: Club, ball, scorecard
- **Excludes**: Food & drinks, Souvenir photos

### 9. Phuket Aquarium
- **Hours**: 08:30-16:30 daily
- **Address**: 51 Moo 8, Sakdidet Rd, Wichit, Cape Panwa, Phuket 83000
- **GPS**: 7.8017, 98.3938
- **Booking**: https://phuketaquarium.org
- **Description**: Government-run marine research aquarium at Cape Panwa showcasing local Andaman Sea species. Features an underwater tunnel, touch pool, seahorse exhibits, and an Omura's whale skeleton display -- a first for Thailand. Small but educational and budget-friendly. Great rainy-day option for families with kids under 10. Recently renovated with new interactive exhibits.
- **Highlights**: Underwater walk-through tunnel, Touch pool for kids, Omura's whale skeleton, Seahorse & clownfish exhibits, Budget-friendly entry
- **Includes**: All exhibits
- **Excludes**: Parking (free), Souvenir shop

### 10. Tiger Kingdom
- **Hours**: 09:00-18:00 daily (last entry 17:30)
- **Address**: 118/88 Moo 7, Kathu, Phuket 83120
- **GPS**: 7.9050, 98.3276
- **Booking**: https://www.tigerkingdom.com
- **Description**: Get up close with real tigers in a safe, supervised environment. Choose from different size categories -- smallest (cubs), small, medium, and big tigers -- each with different pricing. Professional photographers capture your moment. Located in Kathu, next to Go-Kart Speedway. Note: ethical considerations apply; research before visiting. Age 4+ for smallest tigers. Allow 1-2 hours.
- **Highlights**: Close encounters with real tigers, Professional photos included, Multiple tiger size options, Adjacent to Go-Kart track, Café on-site
- **Includes**: Tiger enclosure entry, Safety briefing, Professional supervision
- **Excludes**: Photo package (optional extra), Food & drinks

### 11. Surf House Kata (FlowRider)
- **Hours**: 10:00-22:00 daily
- **Address**: 4 Pakbang Rd, Kata Beach, Karon, Phuket 83100
- **GPS**: 7.8196, 98.2981
- **Booking**: https://www.surfhousephuket.com
- **Description**: Indoor FlowRider surf simulator right on Kata Beach. Learn to surf or bodyboard on a continuous artificial wave -- no ocean experience needed. Sessions are 1 hour with professional instructors. Also features a beachfront bar and restaurant with live DJs on weekends. Great for teens, adults, and families. Combine with Dino Park mini-golf next door for a full evening out.
- **Highlights**: FlowRider surf simulator, Professional instructors, Beachfront bar & restaurant, Weekend DJ nights, Next to Dino Park
- **Includes**: Board rental, Instruction, 1-hour session
- **Excludes**: Food & drinks, Photos

### 12. Rawai Park
- **Hours**: 09:00-17:30 daily
- **Address**: 2/5 Viset Rd, Rawai, Mueang Phuket, Phuket 83130
- **GPS**: 7.7768, 98.3264
- **Booking**: https://rawaipark.com
- **Description**: Purpose-built kids park in Rawai with splash waterpark, outdoor playgrounds, indoor kids club, mini zoo, and carp pond -- all in a lush garden setting. Designed specifically for children aged 1-10. Parents can relax at the on-site family restaurant while kids play safely. Weekday admission just 250 THB (kids) / 100 THB (adults). The go-to rainy or sunny day destination for families in southern Phuket.
- **Highlights**: Kids waterpark with slides, Indoor air-con kids club, Mini zoo & carp pond, Family restaurant on-site, Budget-friendly
- **Includes**: Access to all outdoor play areas, waterpark
- **Excludes**: Indoor kids club (extra), Trampoline zone (extra), Food & drinks

### 13. Hanuman World
- **Hours**: 08:00-17:00 daily
- **Address**: 105 Moo 4, Chao Fa Tawan Tok Rd, Wichit, Phuket 83000
- **GPS**: 7.8730, 98.3230
- **Booking**: https://hanumanworldphuket.com
- **Description**: Thailand's biggest zipline park with over 40 platforms across multiple courses in pristine rainforest. Features the 400m-long "Roller Zipline," sky walks, rope bridges, and a giant swing. Choose from 10, 18, or 32-platform courses depending on your time and budget. Suitable for ages 4-70, with a dedicated kids course. Professional safety equipment with double-clip system. The most popular adventure activity in Phuket.
- **Highlights**: 40+ platforms, Thailand's biggest, 400m Roller Zipline, Sky walks & rope bridges, Kids course (age 4+)
- **Includes**: Hotel transfer (select packages), Equipment, Guide, Insurance
- **Excludes**: Photo/video package (extra), Lunch

### 14. Phuket Shooting Range
- **Hours**: 10:00-18:00 daily
- **Address**: 46/158 Moo 6, Phrabaramee Rd, Kathu, Phuket 83120
- **GPS**: 7.9052, 98.3248
- **Booking**: N/A
- **Description**: Outdoor shooting range in Kathu offering a variety of firearms including pistols, rifles, and shotguns. Packages start from 10 rounds. All equipment provided with professional safety supervision and instruction. No experience required. Minimum age 12. Located on the same road as Go-Kart Speedway and Tiger Kingdom -- combine all three for a full day of thrills.
- **Highlights**: Multiple firearm types, Professional instructors, No experience needed, Near Go-Kart & Tiger Kingdom, Safe supervised environment
- **Includes**: Firearm, Ammunition (per package), Safety equipment, Instruction
- **Excludes**: Extra ammunition, Photos

### 15. Boat Avenue Family Market
- **Free entry**, evening market
- **Hours**: 17:00-22:00 (Fri-Sun)
- **Address**: Boat Avenue, Cherng Talay, Phuket 83110
- **Update**: Free entry, evening family market with food stalls, live music, kids play areas

---

## Data to Update (Tours)

All duplicate tours (e.g., 3 "Big Buddha" tours, 3 "ATV" tours, 3 "Elephant Sanctuary" tours) will also get enriched descriptions, but we won't create new entries -- just update existing ones with richer content.

---

## Technical Details

### SQL Migration

A single UPDATE migration with ~30 UPDATE statements. Each statement updates:
- `description_en`, `description_ru` (rich 3-5 sentence descriptions)
- `long_description` (detailed paragraph with practical tips)
- `start_times` (real opening hours as array, e.g., `{'10:00'}`)
- `available_days` (e.g., `{'mon','tue','wed','thu','fri','sat','sun'}`)
- `meeting_point` (exact address)
- `meeting_point_lat`, `meeting_point_lng` (GPS)
- `booking_url` or `external_link` (official website)
- `highlights` (JSON array of 5 key selling points)
- `includes`, `excludes` (JSON arrays of what's in/not in price)
- `age_restriction` (where applicable)

### No Frontend Changes

The `ExperienceDetail.tsx` page already renders:
- `long_description` or `description_en` in the Description card
- `highlights` in the Highlights card
- `includes` / `excludes` in the Included/Not Included cards
- `meeting_point` in the Meeting Point card
- `start_times` (via Quick Info)
- `booking_url` in the CTA button

All data will flow automatically once updated.

### Files Changed

| File | Change |
|------|--------|
| SQL Migration | ~30 UPDATE statements enriching all active experiences |
| No frontend files | All fields already rendered by ExperienceDetail |

